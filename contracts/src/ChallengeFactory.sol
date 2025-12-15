// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./IChallenge.sol";
import "./ProgressTracker.sol";

contract ChallengeFactory {
    ProgressTracker public immutable progressTracker;
    mapping(uint256 => address) public challengeAddresses;
    mapping(uint256 => address) public challengeImplementations;
    address public owner;

    error Unauthorized();
    error ImplementationNotSet();
    error ChallengeAlreadyDeployed();
    error ChallengeNotDeployed();
    error ChallengeNotSolved();

    event ChallengeDeployed(uint256 indexed challengeId, address indexed challengeAddress);
    event ChallengeVerified(address indexed user, uint256 indexed challengeId);

    constructor(address _progressTracker) {
        progressTracker = ProgressTracker(_progressTracker);
        owner = msg.sender;
    }

    function setChallengeImplementation(uint256 challengeId, address implementation) external {
        if (msg.sender != owner) revert Unauthorized();
        challengeImplementations[challengeId] = implementation;
    }

    function updateChallengeAddress(uint256 challengeId, address newAddress) external {
        if (msg.sender != owner) revert Unauthorized();
        challengeAddresses[challengeId] = newAddress;
    }

    function deployChallenge(uint256 challengeId) external returns (address) {
        address implementation = challengeImplementations[challengeId];
        if (implementation == address(0)) revert ImplementationNotSet();
        if (challengeAddresses[challengeId] != address(0)) revert ChallengeAlreadyDeployed();

        challengeAddresses[challengeId] = implementation;
        emit ChallengeDeployed(challengeId, implementation);
        return implementation;
    }

    function getChallengeAddress(uint256 challengeId) external view returns (address) {
        return challengeAddresses[challengeId];
    }

    function verifyAndRecord(address user, uint256 challengeId) external {
        address challengeAddress = challengeAddresses[challengeId];
        if (challengeAddress == address(0)) revert ChallengeNotDeployed();

        IChallenge challenge = IChallenge(challengeAddress);
        if (!challenge.isSolved()) revert ChallengeNotSolved();

        progressTracker.recordSolution(user, challengeId);
        emit ChallengeVerified(user, challengeId);
    }
}
