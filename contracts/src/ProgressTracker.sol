// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract ProgressTracker {
    address public immutable factory;
    mapping(address => mapping(uint256 => bool)) private solved;
    mapping(address => uint256) private solvedCount;

    error Unauthorized();

    event ChallengeSolved(
        address indexed user,
        uint256 indexed challengeId,
        uint256 timestamp
    );

    constructor(address _factory) {
        factory = _factory;
    }

    function hasSolved(
        address user,
        uint256 challengeId
    ) external view returns (bool) {
        return solved[user][challengeId];
    }

    function getSolvedCount(address user) external view returns (uint256) {
        return solvedCount[user];
    }

    function recordSolution(address user, uint256 challengeId) external {
        if (msg.sender != factory) revert Unauthorized();

        if (!solved[user][challengeId]) {
            solved[user][challengeId] = true;
            unchecked {
                solvedCount[user]++;
            }
            emit ChallengeSolved(user, challengeId, block.timestamp);
        }
    }
}
