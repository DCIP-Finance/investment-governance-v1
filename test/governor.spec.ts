import { expect } from './chai-setup'
import { deployments, getNamedAccounts, network, ethers, getUnnamedAccounts, run } from 'hardhat'

import { mineBlocks, numberToDcip, ownableRevertText, setupUser, setupUsers, weiToBnb } from './utils'
import { DCIP } from '../typechain/DCIP'
import { BigNumber } from '@ethersproject/bignumber'
import { parseUnits } from 'ethers/lib/utils'
import { DCIPGovernor, Governor, OtcSale } from '../typechain'

const votingWeight = parseUnits('2000000000000', '9') // Arbitrary amount

enum ProposalState {
  Pending,
  Active,
  Invalidated,
  Defeated,
  Succeeded,
  Executed
}

async function setup() {
  if (!network.live) {
    await deployments.fixture(['DCIP'])
    await deployments.fixture(['DCIPGovernor'])
  } else {
    // Network is online, cant load fixtures here
  }

  const { deployer } = await getNamedAccounts()
  const contracts = {
    dcip: (await ethers.getContract('DCIP')) as DCIP,
    governor: (await ethers.getContract('DCIPGovernor')) as DCIPGovernor
  }
  const users = await setupUsers(await getUnnamedAccounts(), contracts)

  // Initialize these 2 users for convenient reuse in test cases.
  const proposer = users[0]
  const voter = users[1]
  await contracts.dcip.transfer(proposer.address, votingWeight)
  await contracts.dcip.transfer(voter.address, votingWeight)

  return {
    ...contracts,
    deployer,
    tokenOwner: await setupUser(deployer, contracts),
    users,
    voter,
    proposer
  }
}

async function makeProposal(governor: DCIPGovernor) {
  return await governor.propose('Byont Tokens - The next moon', 'Its great.', numberToDcip(5000000000000))
}

describe('Governor tests', async () => {
  describe('Quorum', () => {
    it('votesForQuorum set at start', async () => {
      const { governor } = await setup()

      expect(await governor.votesForQuorum()).to.be.equal(BigNumber.from('25000000000000000000000'))
    })

    it('Owner can set votesForQuorum', async () => {
      const { governor } = await setup()

      const votesForQuorum = parseUnits('200000000', '9')
      await governor.setVotesForQuorum(votesForQuorum)
      expect(await governor.votesForQuorum()).to.be.equal(votesForQuorum)
    })

    it('User cannot set votesForQuorum', async () => {
      const { governor, proposer } = await setup()

      const votesForQuorum = parseUnits('200000000', '9')
      await expect(proposer.governor.setVotesForQuorum(votesForQuorum)).to.be.revertedWith(ownableRevertText)
    })

    // Not enough DCIP available inwallet to run this test with current quorum number
    it.skip('votesForQuorum reached', async () => {
      const { governor, proposer, voter } = await setup()

      const votesForQuorum = await proposer.governor.votesForQuorum()
      const voterBalance = await proposer.dcip.balanceOf(proposer.address)
      expect(votesForQuorum.lt(voterBalance)).to.equal(
        true,
        'Invalid test case: Change balance to be higer or quorum lower'
      )

      await makeProposal(proposer.governor)
      const lastProposal = (await proposer.governor.proposalCount()).sub(1)
      expect(await voter.governor.quorumReached(lastProposal)).to.equal(true)
    })

    it('votesForQuorum not reached', async () => {
      const { governor, proposer, voter } = await setup()

      const proposerBalance = await proposer.dcip.balanceOf(proposer.address)
      const voterBalance = await voter.dcip.balanceOf(proposer.address)

      await governor.setVotesForQuorum(votingWeight.mul(5))
      const newVotesQuorum = await governor.votesForQuorum()

      expect(newVotesQuorum.gt(voterBalance.add(proposerBalance))).to.equal(
        true,
        'Invalid test case: Change balance to be lower or quorum higher'
      )

      await makeProposal(proposer.governor)
      const lastProposal = (await proposer.governor.proposalCount()).sub(1)
      await voter.governor.castVote(lastProposal, true)
      expect(await voter.governor.quorumReached(lastProposal)).to.equal(false)
    })
  })

  // async function castVote(address: user, v) {}

  describe('Voting', async () => {
    it('Voting for works', async () => {
      const { proposer, voter, users, dcip } = await setup()
      const voter2 = users[5]
      await dcip.transfer(voter2.address, votingWeight)

      await makeProposal(proposer.governor)
      const proposalId = (await proposer.governor.proposalCount()).sub(1)

      const initialProposal = await proposer.governor.getProposal(proposalId)
      const initialVotesFor = initialProposal.votesFor

      await voter.governor.castVote(proposalId, true)
      await voter2.governor.castVote(proposalId, true)
      const proposal = await voter.governor.getProposal(proposalId)

      expect(proposal.votesFor.sub(initialVotesFor)).to.equal(
        votingWeight.mul(2),
        'Added forotes do not match votingWeight'
      )
      expect(proposal.votesAgainst).to.equal(initialProposal.votesAgainst)
      // expect(await proposer.governor.)
      expect(await proposer.governor.hasVoted(voter.address, proposalId)).to.equal(true)
    })

    it('vote updated', () => {})

    it('Voting against works', async () => {
      const { proposer, voter } = await setup()

      await makeProposal(proposer.governor)
      const proposalId = (await proposer.governor.proposalCount()).sub(1)

      const initialProposal = await proposer.governor.getProposal(proposalId)
      const initialVotesAgainst = initialProposal.votesAgainst

      await voter.governor.castVote(proposalId, false)
      const proposal = await voter.governor.getProposal(proposalId)

      expect(proposal.votesAgainst.sub(initialVotesAgainst)).to.equal(
        votingWeight,
        'Added forvotes do not match votingWeight'
      )
      expect(await proposer.governor.hasVoted(voter.address, proposalId)).to.equal(true)
      expect(proposal.votesFor).to.equal(initialProposal.votesFor)
    })

    it('Voting for and against mixed works', async () => {
      const { proposer, voter, users, dcip } = await setup()
      const voter2 = users[5]
      await dcip.transfer(voter2.address, votingWeight)

      await makeProposal(proposer.governor)
      const proposalId = (await proposer.governor.proposalCount()).sub(1)

      const initialProposal = await proposer.governor.getProposal(proposalId)

      await voter.governor.castVote(proposalId, true)
      await voter2.governor.castVote(proposalId, false)
      const proposal = await voter.governor.getProposal(proposalId)

      expect(proposal.votesFor.sub(initialProposal.votesFor)).to.equal(
        votingWeight,
        'Added forvotes do not match votingWeight'
      )
      expect(proposal.votesAgainst.sub(initialProposal.votesAgainst)).to.equal(
        votingWeight,
        'Added againstVotes do not match votingWeight'
      )
      expect(await proposer.governor.hasVoted(voter.address, proposalId)).to.equal(true)
      expect(await proposer.governor.hasVoted(voter2.address, proposalId)).to.equal(true)
    })

    it('Can get for vote ', async () => {
      const { governor, deployer, dcip, voter } = await setup()
      await makeProposal(governor)

      const vote = await governor.getVote(deployer, 0)
      expect(vote).to.equal(true)
      await voter.governor.castVote(0, true)
      const voterVote = await governor.getVote(voter.address, 0)
      expect(voterVote).to.equal(true)
    })

    it('Can get against vote ', async () => {
      const { governor, deployer, dcip, voter } = await setup()
      await makeProposal(governor)

      await voter.governor.castVote(0, false)
      const voterVote = await governor.getVote(voter.address, 0)
      expect(voterVote).to.equal(false)
    })
  })

  describe('Proposal lifecycle', async () => {
    it('Can make close to empty proposal', async () => {
      const { governor } = await setup()
      const desc = '1'
      await governor.propose('', desc, numberToDcip(5000000000000))
      // costs approx 0.013 gas which is 5,2 euros

      const proposalId = (await governor.proposalCount()).sub(1)
      expect((await governor.getProposal(proposalId)).description).to.equal(desc)
    })

    it('Can make short proposal', async () => {
      const { governor } = await setup()
      const desc = 'Its simply the best.'
      await governor.propose('Byont Tokens - The next moon', 'Its simply the best.', numberToDcip(5000000000000))

      // Costs approx 0.15 gas which is 6 euros with bnb val of 400 eur
      const proposalId = (await governor.proposalCount()).sub(1)
      expect((await governor.getProposal(proposalId)).description).to.equal(desc)
    })

    it('Can make long proposal', async () => {
      const { governor } = await setup()
      const desc = 'a'.repeat(525)
      await governor.propose('Byont Tokens - The next moon', desc, numberToDcip(5000000000000))
      // Costs approx 0.05 gas which is 21 euros with bnb val of 400 eur
      const proposalId = (await governor.proposalCount()).sub(1)
      expect((await governor.getProposal(proposalId)).description).to.equal(desc)
    })

    it('Can make huge proposal', async () => {
      const { governor } = await setup()
      const desc = 'a'.repeat(1000)
      await governor.propose('Byont Tokens - The next moon', desc, numberToDcip(5000000000000))
      // Costs approx 40 euro euros with bnb val of 400 eur
      const proposalId = (await governor.proposalCount()).sub(1)
      expect((await governor.getProposal(proposalId)).description).to.equal(desc)
    })

    it('Cannot make proposal if voting weight is too low', async () => {
      const { governor, users } = await setup()
      await expect(makeProposal(users[3].governor)).to.be.revertedWith('Proposer votes below proposal threshold')
    })

    it('proposalVote is propoerly initialized after proposing', async () => {
      const { governor, deployer, dcip } = await setup()

      const votingWeight = await makeProposal(governor)

      const proposal = await governor.getProposal(0)

      expect(proposal.votesAgainst).to.equal(0)
      const expectedVotesFor = await dcip.balanceOf(deployer)
      expect(proposal.votesFor).to.equal(expectedVotesFor)
    })

    it('HasVoted true for proposal creator', async () => {
      const { governor, deployer, dcip } = await setup()
      await makeProposal(governor)

      const hasVoted = await governor.hasVoted(deployer, 0)
      expect(hasVoted).to.equal(true)
    })

    it('VotedFor true for proposal creator', async () => {
      const { governor, deployer, dcip } = await setup()
      await makeProposal(governor)

      const votedFor = await governor.getVote(deployer, 0)
      expect(votedFor).to.equal(true)
    })

    it('HasVoted false for random user', async () => {
      const { governor, deployer, users, dcip } = await setup()
      await makeProposal(governor)

      const hasVoted = await governor.hasVoted(users[0].address, 0)
      expect(hasVoted).to.equal(false)
    })

    it('Proposalcount properly updated after making a proposal', async () => {
      const { governor } = await setup()
      expect(await governor.proposalCount()).to.equal(0)
      await makeProposal(governor)
      expect(await governor.proposalCount()).to.equal(1)
    })

    it('Proposal input matches output', async () => {
      const { governor } = await setup()
      const title = 'Byont Tokens - The next moon'
      const desc = 'Its great. https://forum.dcip.finance'
      const amount = numberToDcip(5000000000000)
      await governor.propose(title, desc, amount)
      const proposalId = (await governor.proposalCount()).sub(1)
      const proposal = await governor.getProposal(proposalId)
      expect(proposal.title).to.equal(title)
      expect(proposal.description).to.equal(desc)
      expect(true).to.equal(proposal.fundAllocation.eq(amount))
    })

    it('Can get proposalState ', async () => {
      const { governor } = await setup()
      await governor.propose('Byont Tokens - The next moon', 'Its great.', numberToDcip(5000000000000))
      const proposalId = (await governor.proposalCount()).sub(1)
      const proposal = await governor.getProposal(proposalId)
      expect(proposal.proposalState).to.equal(1)
      // console.log(proposal)
    })

    if (!network.live) {
      // requires setVotingPeriod require check to be removed or decreased before testing
      describe.skip('Tests that require very small votingPeriod', async () => {
        it('Not enough votes proposal cycle works', async () => {
          const { governor, proposer } = await setup()

          // Since mining blocks with hardhat is really slow we need to test with a minimum amount of block periods
          //https://github.com/nomiclabs/hardhat/issues/1112
          const votingPeriod = 10

          await governor.setVotingPeriod(votingPeriod)
          await governor.setVotesForQuorum(numberToDcip(50000000000000))
          expect(await governor.votingPeriodBlocks()).to.equal(votingPeriod)

          await proposer.governor.propose('Byont Tokens - The next moon', 'Its great.', numberToDcip(5000000000000))
          const proposalId = (await governor.proposalCount()).sub(1)
          expect((await governor.getProposal(proposalId)).proposalState).to.equal(ProposalState.Active)
          await mineBlocks(2)
          expect((await governor.getProposal(proposalId)).proposalState).to.equal(ProposalState.Active)

          await mineBlocks(votingPeriod)
          expect((await governor.getProposal(proposalId)).proposalState).to.equal(ProposalState.Defeated)
        })

        it('Proposal cycle for succeeded proposal works', async () => {
          const { governor, proposer } = await setup()

          // Since mining blocks with hardhat is really slow we need to test with a minimum amount of block periods
          //https://github.com/nomiclabs/hardhat/issues/1112
          const votingPeriod = 10

          await governor.setVotingPeriod(votingPeriod)
          expect(await governor.votingPeriodBlocks()).to.equal(votingPeriod)

          await proposer.governor.propose('Byont Tokens - The next moon', 'Its great.', numberToDcip(5000000000000))
          const proposalId = (await governor.proposalCount()).sub(1)
          expect((await governor.getProposal(proposalId)).proposalState).to.equal(ProposalState.Active)
          await mineBlocks(2)
          expect((await governor.getProposal(proposalId)).proposalState).to.equal(ProposalState.Active)

          await mineBlocks(votingPeriod)
          // const proposal = await governor.getProposal(proposalId)
          // console.log(proposal)
          expect((await governor.getProposal(proposalId)).proposalState).to.equal(ProposalState.Succeeded)
        })
      })
    }
  })

  describe('management', async () => {
    it('Owner is warned of too small votingPeriod', async () => {
      const { governor, users } = await setup()
      await expect(governor.setVotingPeriod(7)).to.be.revertedWith('Voting period cannot be less than 12 hours')
    })

    it('Owner can set votingPeriod', async () => {
      const { governor, users } = await setup()
      await governor.setVotingPeriod(806400) // 4 weeks
      expect(await governor.votingPeriodBlocks()).to.equal(BigNumber.from(806400))
    })

    it('Random user cannot set votingPeriod', async () => {
      const { users } = await setup()
      expect(users[5].governor.setVotingPeriod(806400)).to.be.revertedWith(ownableRevertText)
    })

    it('Cannot vote on invalidated proposal', async () => {
      const { governor, voter, proposer } = await setup()

      await makeProposal(proposer.governor)

      const lastProposal = (await governor.proposalCount()).sub(1)
      await governor.invalidateProposal(lastProposal)
      await expect(voter.governor.castVote(lastProposal, true)).to.be.revertedWith('Proposal is not currently active')
    })

    it('Owner can invalidate proposal', async () => {
      const { governor, proposer } = await setup()

      await makeProposal(proposer.governor)

      const lastProposal = (await governor.proposalCount()).sub(1)
      await governor.invalidateProposal(lastProposal)
      const proposal = await governor.getProposal(lastProposal)
      expect(proposal.proposalState).to.equal(ProposalState.Invalidated)
    })

    it('Random person cannot invalidate proposal', async () => {
      const { governor, proposer, voter } = await setup()
      await makeProposal(proposer.governor)

      const lastProposal = (await governor.proposalCount()).sub(1)
      await expect(voter.governor.invalidateProposal(lastProposal)).to.be.revertedWith(ownableRevertText)
    })

    it('Proposal owner (not contract owner) cannot invalidate proposal', async () => {
      const { governor, proposer, voter } = await setup()
      await makeProposal(proposer.governor)

      const lastProposal = (await governor.proposalCount()).sub(1)
      await expect(proposer.governor.invalidateProposal(lastProposal)).to.be.revertedWith(ownableRevertText)
    })

    it('Owner can block and unblock user ', async () => {
      const { governor, voter } = await setup()

      await governor.blockAddress(voter.address)
      expect(await governor.blockedAddresses(voter.address)).to.equal(true)

      await governor.unblockAddress(voter.address)
      expect(await governor.blockedAddresses(voter.address)).to.equal(false)
    })

    it('Random user cannot block ', async () => {
      const { governor, voter, users } = await setup()
      await expect(voter.governor.blockAddress(users[2].address)).to.be.revertedWith(ownableRevertText)
    })

    it('Random user cannot unblock', async () => {
      const { governor, voter, users } = await setup()
      await expect(voter.governor.unblockAddress(users[2].address)).to.be.revertedWith(ownableRevertText)
    })

    it('Blocked user cannot make proposals ', async () => {
      const { governor, users, proposer } = await setup()

      await governor.blockAddress(proposer.address)
      await expect(
        proposer.governor.propose('Byont Tokens - The next moon', 'Its great.', numberToDcip(5000000000000))
      ).to.be.revertedWith('Your address is blocked from making proposals')
    })

    it('Blocked user cannot vote', async () => {
      const { governor, voter } = await setup()
      await governor.blockAddress(voter.address)
      await makeProposal(governor)
      const lastProposal = (await governor.proposalCount()).sub(1)
      await expect(voter.governor.castVote(lastProposal, true)).to.be.revertedWith('Address blocked from voting')
    })

    it('Updating votes for quorum does not affect previous proposals and does affet new proposals', async () => {
      const { governor, proposer, voter } = await setup()

      const votesForQuorum = await governor.votesForQuorum()
      await makeProposal(proposer.governor)
      const proposalId = (await governor.proposalCount()).sub(1)
      expect((await governor.getProposal(proposalId)).votesForQuorum).to.equal(votesForQuorum)

      const newQuorumRequirement = numberToDcip(7000000000000)
      await governor.setVotesForQuorum(newQuorumRequirement)
      expect((await governor.getProposal(proposalId)).votesForQuorum).to.equal(votesForQuorum)

      await makeProposal(proposer.governor)
      expect((await governor.getProposal(proposalId.add(1))).votesForQuorum).to.equal(newQuorumRequirement)
    })

    it('Default proposalReward is 2,5%', async () => {
      const { governor } = await setup()

      expect(await governor.proposalReward()).to.equal(250)
    })

    it('Owner can set low proposalReward', async () => {
      const { governor } = await setup()

      await governor.setProposalReward(10)

      expect(await governor.proposalReward()).to.equal(10)
    })

    it('Owner can set high proposalReward', async () => {
      const { governor } = await setup()

      await governor.setProposalReward(1000)

      expect(await governor.proposalReward()).to.equal(1000)
    })

    it('User cannot set proposal reward', async () => {
      const { proposer } = await setup()

      await expect(proposer.governor.setProposalReward(300)).to.be.revertedWith(ownableRevertText)
    })
  })

  // Cannot vote if expired
})
