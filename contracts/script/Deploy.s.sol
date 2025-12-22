// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Certificate} from "../src/Certificate.sol";
import {ProgressTracker} from "../src/ProgressTracker.sol";
import {ChallengeFactory} from "../src/ChallengeFactory.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        address deployerAddress = vm.addr(deployerPrivateKey);
        uint256 currentNonce = vm.getNonce(deployerAddress);
        address factoryAddress = vm.computeCreateAddress(deployerAddress, currentNonce + 2);
        
        Certificate certificate = new Certificate();
        ProgressTracker progressTracker = new ProgressTracker(factoryAddress, address(certificate));
        ChallengeFactory factory = new ChallengeFactory(
            address(progressTracker)
        );

        require(address(factory) == factoryAddress, "Factory address mismatch");

        certificate.setProgressTracker(address(progressTracker));

        console.log("Certificate deployed at:", address(certificate));
        console.log("ProgressTracker deployed at:", address(progressTracker));
        console.log("ChallengeFactory deployed at:", address(factory));

        vm.stopBroadcast();
    }
}
