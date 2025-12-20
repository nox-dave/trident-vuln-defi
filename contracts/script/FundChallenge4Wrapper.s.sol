// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Challenge4_Wrapper} from "../src/challenges/Challenge4_ForceSendEth/Challenge4_Wrapper.sol";

contract FundChallenge4Wrapper is Script {
    function run() external {
        string memory privateKeyStr = vm.envString("PRIVATE_KEY");
        bytes memory keyBytes = bytes(privateKeyStr);
        
        string memory hexKey;
        if (keyBytes.length >= 2 && keyBytes[0] == "0" && keyBytes[1] == "x") {
            hexKey = privateKeyStr;
        } else {
            hexKey = string.concat("0x", privateKeyStr);
        }
        
        bytes32 keyBytes32 = vm.parseBytes32(hexKey);
        uint256 deployerPrivateKey = uint256(keyBytes32);
        vm.startBroadcast(deployerPrivateKey);

        address wrapperAddress = 0x0Cd75fced168ed1a8F4FabB21ea2b473ab225dbD;
        Challenge4_Wrapper wrapper = Challenge4_Wrapper(payable(wrapperAddress));
        
        console.log("Wrapper address:", address(wrapper));
        console.log("Wrapper balance before:", address(wrapper).balance);
        
        payable(address(wrapper)).transfer(7 ether);
        
        console.log("Wrapper balance after:", address(wrapper).balance);
        
        vm.stopBroadcast();
    }
}

