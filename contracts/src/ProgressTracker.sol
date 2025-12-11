// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract ProgressTracker {
    address public factory;
    mapping(address => mapping(uint256 => bool)) private solved;
    mapping(address => uint256[]) private solvedChallenges;
    mapping(address => uint256) private solvedCount;

    constructor() {
        factory = msg.sender;
    }

    function hasSolved(address user, uint256 challengeId) external view returns (bool) {
        return solved[user][challengeId];
    }

    function getSolvedChallenges(address user) external view returns (uint256[] memory) {
        return solvedChallenges[user];
    }

    function getSolvedCount(address user) external view returns (uint256) {
        return solvedCount[user];
    }

    function recordSolution(address user, uint256 challengeId) external {
        require(msg.sender == factory, "Unauthorized");
        
        if (!solved[user][challengeId]) {
            solved[user][challengeId] = true;
            solvedChallenges[user].push(challengeId);
            solvedCount[user]++;
        }
    }
}

