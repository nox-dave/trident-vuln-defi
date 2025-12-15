// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IChallenge {
    function isSolved() external view returns (bool);
    function challengeId() external pure returns (uint256);
}
