//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import '../libraries/timers.sol';

enum ProposalState {
    Pending,
    Active,
    Invalidated,
    Defeated,
    Succeeded,
    Executed
}

struct Proposal {
    /// @notice Unique id for looking up a proposal
    uint256 id;
    /// @notice Creator of the proposal
    address proposer;
    /// @notice Title of the proposal
    string title;
    /// @notice Description of the proposal
    string description;
    /// @notice Funds to allocate
    uint256 fundAllocation;
    /// @notice The block at which voting begins: holders must delegate their votes prior to this block
    Timers.BlockNumber voteStart;
    /// @notice The block at which voting ends: votes must be cast prior to this block
    Timers.BlockNumber voteEnd;
    /// @notice Current number of votes in favor of this proposal
    bool executed;
    /// @notice Flag marking whether the proposal has been invalidated
    bool invalidated;
    uint256 votesAgainst;
    uint256 votesFor;
    uint256 votesForQuorum;
    mapping(address => bool) hasVoted;
    mapping(address => bool) vote;
}

// enum AssetType {
//     blockchain
// }

// struct Investment {
//     /// @notice Type of the proposed asset
//     AssetType assetType;
//     /// @notice Number of DCIP allocated for investment
//     uint256 fundAllocation;
//     /// @notice Chain such as BSC, ETH, etc
//     string chain;
//     /// @notice address of token to buy
//     address contractAddress;
// }

interface IDCIPGovernor {
    function propose(
        string memory title,
        string memory description,
        uint256 fundAllocation
    ) external returns (uint256);

    function getProposal(uint256 proposalId)
        external
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
            bool invalidated,
            uint256 votesAgainst,
            uint256 votesFor,
            uint256 votesForQuorum,
            ProposalState proposalState
        );

    function castVote(uint256 proposalId, bool support) external returns (uint256);

    function quorumReached(uint256 proposalId) external view returns (bool);

    function voteSucceeded(uint256 proposalId) external view returns (bool);

    function blockAddress(address adr) external returns (bool);

    function unblockAddress(address adr) external returns (bool);

    function proposalThreshold() external pure returns (uint256);

    function setProposalTreshhold(uint256 _threshold) external returns (bool);

    function setVotingPeriod(uint64 period) external returns (bool);

    function setVotesForQuorum(uint256 nrOfTokens) external returns (uint256);

    function getVotingWeight(address voter) external returns (uint256);

    function hasVoted(address account, uint256 proposalId) external view returns (bool);

    function getVote(address account, uint256 proposalId) external view returns (bool);
}

interface IGovernor {
    event ProposalCreated(uint256 id, string title, uint256 fundAllocation);
    event VoteCast(address account, uint256 proposalId, bool support, uint256 weight);

    function propose(
        string memory title,
        string memory description,
        uint256 fundAllocation
    ) external returns (uint256);

    function castVote(uint256 proposalId, bool support) external returns (uint256);
}
