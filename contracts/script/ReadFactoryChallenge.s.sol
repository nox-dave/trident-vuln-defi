// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";

contract ReadFactoryChallenge is Script {
    function run() external {
        address factoryAddress = vm.envAddress("CHALLENGE_FACTORY");
        
        console.log("Factory address:", factoryAddress);
        console.log("Attempting to read challengeAddresses[1]...");
        
        (bool success, bytes memory data) = factoryAddress.staticcall(
            abi.encodeWithSignature("challengeAddresses(uint256)", 1)
        );
        
        if (success && data.length >= 32) {
            address registeredAddress = abi.decode(data, (address));
            console.log("Registered Challenge1 address:", registeredAddress);
            
            if (registeredAddress != address(0)) {
                console.log("Challenge1 IS registered at:", registeredAddress);
            } else {
                console.log("Challenge1 is NOT registered (address is zero)");
                console.log("Your challenge needs to be registered at: 0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7");
            }
        } else {
            console.log("Could not read challengeAddresses - function may not exist");
            console.log("The factory contract may have a different interface");
        }
        
        (bool success2, bytes memory data2) = factoryAddress.staticcall(
            abi.encodeWithSignature("getChallengeAddress(uint256)", 1)
        );
        
        if (success2 && data2.length >= 32) {
            address registeredAddress2 = abi.decode(data2, (address));
            console.log("getChallengeAddress(1) returns:", registeredAddress2);
        }
    }
}

