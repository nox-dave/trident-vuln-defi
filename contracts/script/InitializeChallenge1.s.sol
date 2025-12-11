// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Challenge1_Wrapper} from "../src/challenges/Challenge1_Vault/Challenge1_Wrapper.sol";

contract InitializeChallenge1 is Script {
    address payable constant CHALLENGE1_ADDRESS = payable(0xF020b3Fb178DBC4AE1E0A52eF03428119C4c1Eb8);
    
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        
        vm.startBroadcast(deployerPrivateKey);

        Challenge1_Wrapper challenge1 = Challenge1_Wrapper(CHALLENGE1_ADDRESS);
        
        if (!challenge1.initialized()) {
            payable(CHALLENGE1_ADDRESS).transfer(2 ether);
            challenge1.initialize{value: 0}();
            console.log("Challenge 1 initialized with 2 ether");
        } else {
            console.log("Challenge 1 already initialized");
        }

        vm.stopBroadcast();
    }
}

