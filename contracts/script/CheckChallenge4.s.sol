// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Challenge4_Wrapper} from "../src/challenges/Challenge4_ForceSendEth/Challenge4_Wrapper.sol";
import {IChallenge} from "../src/IChallenge.sol";

contract CheckChallenge4 is Script {
    function run() external view {
        address payable wrapperAddress = payable(vm.envAddress("CHALLENGE4_ADDRESS"));
        Challenge4_Wrapper wrapper = Challenge4_Wrapper(wrapperAddress);
        
        console.log("Challenge4_Wrapper address:", wrapperAddress);
        console.log("Game address:", address(wrapper.game()));
        console.log("Initialized:", wrapper.initialized());
        console.log("Game balance:", address(wrapper.game()).balance);
        console.log("Is solved:", wrapper.isSolved());
        
        uint256 gameBalance = address(wrapper.game()).balance;
        uint256 requiredBalance = 7 ether;
        console.log("Required balance (7 ether):", requiredBalance);
        console.log("Balance > 7 ether?", gameBalance > requiredBalance);
    }
}

