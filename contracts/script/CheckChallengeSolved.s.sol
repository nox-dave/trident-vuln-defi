// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {IChallenge} from "../src/IChallenge.sol";

contract CheckChallengeSolved is Script {
    function run() external {
        address challengeAddress = vm.envAddress("CHALLENGE_ADDRESS");
        
        console.log("Checking challenge at:", challengeAddress);
        
        IChallenge challenge = IChallenge(challengeAddress);
        
        uint256 challengeId;
        try challenge.challengeId() returns (uint256 id) {
            challengeId = id;
            console.log("Challenge ID:", challengeId);
        } catch {
            console.log("Could not read challengeId");
        }
        
        bool isSolved = challenge.isSolved();
        console.log("Challenge is solved:", isSolved);
        
        if (!isSolved) {
            console.log("Challenge is NOT solved");
            console.log("You need to deploy and execute your exploit to solve the challenge");
        } else {
            console.log("Challenge IS solved - ready for verification!");
        }
    }
}

