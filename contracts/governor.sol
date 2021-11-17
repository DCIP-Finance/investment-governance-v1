//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import './interfaces/governor.sol';
import './libraries/ownable.sol';
import './interfaces/dcip.sol';
import './libraries/timers.sol';
import '@openzeppelin/contracts/utils/math/SafeCast.sol';

abstract contract Governor is Ownable, IGovernor {
    using SafeCast for uint256;
    using Timers for Timers.BlockNumber;

    IDCIP public token;

    mapping(uint256 => Proposal) internal proposals;
    uint256 proposalTreshhold;
    uint256 public proposalCount;
    uint256 public votesForQuorum;
    uint64 public votingPeriodBlocks;

    constructor(IDCIP _tokenAddress) {
        token = _tokenAddress;
        proposalCount = 0;
        votesForQuorum = 25000000000000e9; /// Approxx 100 euros at current value
        votingPeriodBlocks = 201600;
    }

    function propose(
        string memory title,
        string memory description,
        uint256 fundAllocation
    ) public virtual override returns (uint256) {
        uint64 voteStart = block.number.toUint64();
        uint64 deadline = voteStart + votingPeriodBlocks;
        uint256 proposalId = proposalCount;

        Proposal storage p = proposals[proposalCount];
        p.id = proposalCount;
        p.proposer = msg.sender;
        p.title = title;
        p.description = description;
        p.fundAllocation = fundAllocation;
        p.voteStart = Timers.BlockNumber(voteStart);
        p.voteEnd = Timers.BlockNumber(deadline);
        p.invalidated = false;
        p.executed = false;
        p.votesFor = 0;
        p.votesAgainst = 0;
        p.votesForQuorum = votesForQuorum;

        emit ProposalCreated(proposalId, title, fundAllocation);

        _countVote(proposalId, _msgSender(), true, getVotingWeight(_msgSender()));
        proposalCount++;
        return proposalId;
    }

    /**
     * @dev See {IGovernor-castVote}.
     */
    function castVote(uint256 proposalId, bool support) public virtual override returns (uint256) {
        address voter = _msgSender();
        return _castVote(proposalId, voter, support);
    }

    /**
     * @dev Internal vote casting mechanism: Check that the vote is pending, that it has not been cast yet, retrieve
     * voting weight using {IGovernor-getVotes} and call the {_countVote} internal function.
     *
     * Emits a {IGovernor-VoteCast} event.
     */
    function _castVote(
        uint256 proposalId,
        address account,
        bool support
    ) internal virtual returns (uint256) {
        require(state(proposalId) == ProposalState.Active, 'Proposal is not currently active');

        uint256 weight = getVotingWeight(account);
        _countVote(proposalId, account, support, weight);
        return weight;
    }

    function state(uint256 proposalId) internal view virtual returns (ProposalState);

    function getVotingWeight(address voter) public virtual returns (uint256) {}

    /**
     * @dev Register a vote with a given support and voting weight.
     *
     * Note: Support is generic and can represent various things depending on the voting system used.
     */
    function _countVote(
        uint256 proposalId,
        address account,
        bool support,
        uint256 weight
    ) internal virtual;
}
