// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IChallenge} from "./interfaces/IChallenge.sol";
import {ProgressTracker} from "./ProgressTracker.sol";
import {Challenge1_Vault} from "./challenges/Challenge1_Vault.sol";

contract ChallengeFactory {
    ProgressTracker public immutable tracker;
    address public owner;
    
    mapping(uint256 => address) public challenges;
    
    event ChallengeDeployed(uint256 indexed challengeId, address indexed challengeAddress);
    event ChallengeVerified(address indexed user, uint256 indexed challengeId, bool solved);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _tracker) {
        owner = msg.sender;
        tracker = ProgressTracker(_tracker);
    }
    
    function deployChallenge(uint256 challengeId) external returns (address) {
        require(challenges[challengeId] == address(0), "Challenge already deployed");
        
        address challengeAddress;
        
        if (challengeId == 1) {
            Challenge1_Vault challenge = new Challenge1_Vault();
            challengeAddress = address(challenge);
        } else if (challengeId == 2) {
            revert("Challenge 2 not implemented yet");
        } else if (challengeId == 3) {
            revert("Challenge 3 not implemented yet");
        } else if (challengeId == 4) {
            revert("Challenge 4 not implemented yet");
        } else if (challengeId == 5) {
            revert("Challenge 5 not implemented yet");
        } else {
            revert("Invalid challenge ID");
        }
        
        challenges[challengeId] = challengeAddress;
        emit ChallengeDeployed(challengeId, challengeAddress);
        
        return challengeAddress;
    }
    
    function verifyAndRecord(address user, uint256 challengeId) external {
        address challengeAddress = challenges[challengeId];
        require(challengeAddress != address(0), "Challenge not deployed");
        
        IChallenge challenge = IChallenge(challengeAddress);
        bool solved = challenge.isSolved();
        
        emit ChallengeVerified(user, challengeId, solved);
        
        if (solved) {
            tracker.recordSolve(user, challengeId);
        }
    }
    
    function getChallengeAddress(uint256 challengeId) external view returns (address) {
        return challenges[challengeId];
    }
}
