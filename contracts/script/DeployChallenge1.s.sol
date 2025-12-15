// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Challenge1_Wrapper} from "../src/challenges/Challenge1_Vault/Challenge1_Wrapper.sol";
import {ChallengeFactory} from "../src/ChallengeFactory.sol";

contract DeployChallenge1 is Script {
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

        Challenge1_Wrapper wrapper = new Challenge1_Wrapper();
        
        wrapper.initialize{value: 0.001 ether}();

        console.log("Challenge1_Wrapper deployed at:", address(wrapper));
        console.log("EthBank deployed at:", address(wrapper.bank()));
        console.log("Initialized:", wrapper.initialized());
        console.log("Bank balance:", address(wrapper.bank()).balance);

        try vm.envAddress("CHALLENGE_FACTORY") returns (address factoryAddress) {
            if (factoryAddress != address(0)) {
                ChallengeFactory factory = ChallengeFactory(factoryAddress);
                try factory.updateChallengeAddress(1, address(wrapper)) {
                    console.log("Challenge1 registered with factory at:", factoryAddress);
                } catch {
                    console.log("Failed to register with factory (may not be owner)");
                }
            }
        } catch {
            console.log("CHALLENGE_FACTORY not set, skipping factory registration");
        }

        vm.stopBroadcast();
    }
}

