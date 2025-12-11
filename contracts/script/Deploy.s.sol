// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {ProgressTracker} from "../src/ProgressTracker.sol";
import {ChallengeFactory} from "../src/ChallengeFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        ProgressTracker progressTracker = new ProgressTracker();
        ChallengeFactory factory = new ChallengeFactory(
            address(progressTracker)
        );

        console.log("ProgressTracker deployed at:", address(progressTracker));
        console.log("ChallengeFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
