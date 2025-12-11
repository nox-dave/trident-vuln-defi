// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "./IChallenge.sol";
import "./ProgressTracker.sol";

contract ChallengeFactory {
    ProgressTracker public progressTracker;
    mapping(uint256 => address) public challengeAddresses;
    mapping(uint256 => address) public challengeImplementations;
    address public owner;

    event ChallengeDeployed(uint256 indexed challengeId, address indexed challengeAddress);
    event ChallengeVerified(address indexed user, uint256 indexed challengeId);

    constructor(address _progressTracker) {
        progressTracker = ProgressTracker(_progressTracker);
        owner = msg.sender;
    }

    function setChallengeImplementation(uint256 challengeId, address implementation) external {
        require(msg.sender == owner, "Unauthorized");
        challengeImplementations[challengeId] = implementation;
    }

    function deployChallenge(uint256 challengeId) external returns (address) {
        require(challengeImplementations[challengeId] != address(0), "Implementation not set");
        require(challengeAddresses[challengeId] == address(0), "Challenge already deployed");

        address challengeAddress = challengeImplementations[challengeId];
        challengeAddresses[challengeId] = challengeAddress;

        emit ChallengeDeployed(challengeId, challengeAddress);
        return challengeAddress;
    }

    function getChallengeAddress(uint256 challengeId) external view returns (address) {
        return challengeAddresses[challengeId];
    }

    function verifyAndRecord(address user, uint256 challengeId) external {
        address challengeAddress = challengeAddresses[challengeId];
        require(challengeAddress != address(0), "Challenge not deployed");

        IChallenge challenge = IChallenge(challengeAddress);
        require(challenge.isSolved(), "Challenge not solved");

        progressTracker.recordSolution(user, challengeId);
        emit ChallengeVerified(user, challengeId);
    }
}

