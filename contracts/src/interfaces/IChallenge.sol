// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IChallenge {
    function isSolved() external view returns (bool);

    function challengeId() external view returns (uint256);

    function challengeName() external view returns (string memory);

    function difficulty() external view returns (string memory);

    event ChallengeSolved(address indexed solver, uint256 timestamp);
}
