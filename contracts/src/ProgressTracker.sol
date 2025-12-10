// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract ProgressTracker {
    mapping(address => mapping(uint256 => bool)) public hasSolved;

    mapping(address => uint256[]) private solvedChallenges;

    address public factory;

    event ChallengeRecorded(
        address indexed user,
        uint256 indexed challengeId,
        uint256 timestamp
    );

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can record");
        _;
    }

    constructor() {
        factory = msg.sender;
    }

    function recordSolve(
        address user,
        uint256 challengeId
    ) external onlyFactory {
        require(!hasSolved[user][challengeId], "Already recorded");

        hasSolved[user][challengeId] = true;
        solvedChallenges[user].push(challengeId);

        emit ChallengeRecorded(user, challengeId, block.timestamp);
    }

    function getSolvedChallenges(
        address user
    ) external view returns (uint256[] memory) {
        return solvedChallenges[user];
    }

    function getSolvedCount(address user) external view returns (uint256) {
        return solvedChallenges[user].length;
    }
}
