// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Challenge1_Wrapper} from "../src/challenges/Challenge1_Vault/Challenge1_Wrapper.sol";
import {ChallengeFactory} from "../src/ChallengeFactory.sol";

contract DeployChallenge1 is Script {
    address constant FACTORY_ADDRESS = 0x2E0a2434cccE6f1Cb4267f1E0aFb88DA51F93124;
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        ChallengeFactory factory = ChallengeFactory(FACTORY_ADDRESS);
        
        Challenge1_Wrapper challenge1 = new Challenge1_Wrapper();
        
        console.log("Challenge1_Wrapper deployed at:", address(challenge1));
        console.log("NOTE: Send 2 ether to this address and call initialize() to set up the challenge");
        
        factory.setChallengeImplementation(1, address(challenge1));
        
        console.log("Challenge 1 implementation set in factory");
        
        factory.deployChallenge(1);
        
        console.log("Challenge 1 deployed via factory");
        console.log("Challenge 1 address:", factory.getChallengeAddress(1));

        vm.stopBroadcast();
    }
}

