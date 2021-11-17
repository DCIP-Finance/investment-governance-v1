// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import './governor.sol';
import './interfaces/dcip.sol';

contract DCIPGovernor is Governor {
    using Timers for Timers.BlockNumber;
    mapping(address => bool) public blockedAddresses;
    uint16 public proposalReward;

    constructor(IDCIP _token, uint16 _proposalReward) Governor(_token) {
        proposalReward = _proposalReward;
    }

    function blockAddress(address adr) public onlyOwner returns (bool) {
        blockedAddresses[adr] = true;
        return true;
    }

    function unblockAddress(address adr) public onlyOwner returns (bool) {
        blockedAddresses[adr] = false;
        return true;
    }

    function proposalThreshold() public pure returns (uint256) {
        return 80000000000e9;
    }

    function setProposalTreshhold(uint256 _threshold) public onlyOwner returns (bool) {
        proposalTreshhold = _threshold;
        return true;
    }

    function setVotingPeriod(uint64 period) public onlyOwner returns (bool) {
        require(period >= 14400, 'Voting period cannot be less than 12 hours');
        votingPeriodBlocks = period;
        return true;
    }

    function propose(
        string memory title,
        string memory description,
        uint256 fundAllocation
    ) public override returns (uint256) {
        require(blockedAddresses[_msgSender()] != true, 'Your address is blocked from making proposals');
        require(getVotingWeight(_msgSender()) >= proposalThreshold(), 'Proposer votes below proposal threshold');
        return super.propose(title, description, fundAllocation);
    }

    /**
     * @dev If amount of votes cast passes the threshold limit.
     */
    function quorumReached(uint256 proposalId) public view virtual returns (bool) {
        Proposal storage p = proposals[proposalId];
        return p.votesForQuorum < (p.votesFor + p.votesAgainst);
    }

    function setVotesForQuorum(uint256 nrOfTokens) public virtual onlyOwner returns (uint256) {
        require(nrOfTokens > 1000000e9, 'At least 1.000.000 DCIP is required');
        votesForQuorum = nrOfTokens;
        return votesForQuorum;
    }

    function getVotingWeight(address voter) public virtual override returns (uint256) {
        return token.balanceOf(voter);
    }

    function hasVoted(address account, uint256 proposalId) public view returns (bool) {
        return proposals[proposalId].hasVoted[account];
    }

    function getVote(address account, uint256 proposalId) public view returns (bool) {
        return proposals[proposalId].vote[account];
    }

    function voteSucceeded(uint256 proposalId) public view returns (bool) {
        Proposal storage p = proposals[proposalId];
        return p.votesFor > p.votesAgainst;
    }

    function getProposal(uint256 proposalId)
        public
        view
        returns (
            uint256 id,
            address proposer,
            string memory title,
            string memory description,
            uint256 fundAllocation,
            Timers.BlockNumber memory voteStart,
            Timers.BlockNumber memory voteEnd,
            bool executed,
            uint256 votesAgainst,
            uint256 votesFor,
            uint256 votesForQuorum,
            ProposalState proposalState
        )
    {
        Proposal storage p = proposals[proposalId];
        ProposalState s = state(proposalId);
        return (
            p.id,
            p.proposer,
            p.title,
            p.description,
            p.fundAllocation,
            p.voteStart,
            p.voteEnd,
            p.executed,
            p.votesAgainst,
            p.votesFor,
            p.votesForQuorum,
            s
        );
    }

    function state(uint256 proposalId) internal view virtual override returns (ProposalState) {
        Proposal storage proposal = proposals[proposalId];

        if (proposal.executed) {
            return ProposalState.Executed;
        } else if (proposal.invalidated) {
            return ProposalState.Invalidated;
        } else if (proposal.voteStart.isPending()) {
            return ProposalState.Pending;
        } else if (proposal.voteEnd.isPending()) {
            return ProposalState.Active;
        } else if (proposal.voteEnd.isExpired()) {
            return
                quorumReached(proposalId) && voteSucceeded(proposalId)
                    ? ProposalState.Succeeded
                    : ProposalState.Defeated;
        } else {
            revert('Governor: unknown proposal id');
        }
    }

    function _countVote(
        uint256 proposalId,
        address account,
        bool support,
        uint256 weight
    ) internal virtual override {
        Proposal storage p = proposals[proposalId];
        require(blockedAddresses[account] != true, 'Address blocked from voting');
        require(p.hasVoted[account] == false, 'Vote has already been cast!');
        require(weight >= 1, 'Invalid vote weight');
        if (support == true) {
            p.votesFor += weight;
        } else {
            p.votesAgainst += weight;
        }
        p.hasVoted[account] = true;
        p.vote[account] = support;
        emit VoteCast(account, proposalId, support, weight);
    }

    function invalidateProposal(uint256 proposalId) public onlyOwner returns (bool) {
        Proposal storage p = proposals[proposalId];
        p.invalidated = true;
        return true;
    }

    function setProposalReward(uint16 _proposalReward) public onlyOwner returns (bool) {
        proposalReward = _proposalReward;
        return true;
    }
}
