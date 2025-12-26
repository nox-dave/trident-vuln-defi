// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Challenge2_Wrapper} from "../src/challenges/Challenge2_Access/Challenge2_Wrapper.sol";
import {ChallengeFactory} from "../src/ChallengeFactory.sol";

contract DeployChallenge2 is Script {
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

        Challenge2_Wrapper wrapper = new Challenge2_Wrapper();
        
        vm.deal(address(wrapper), 1 ether);
        wrapper.initialize{value: 1 ether}();

        console.log("Challenge2_Wrapper deployed at:", address(wrapper));
        console.log("UpgradeableWallet deployed at:", address(wrapper.wallet()));
        console.log("WalletImplementation deployed at:", address(wrapper.implementation()));
        console.log("Initialized:", wrapper.initialized());

        try vm.envAddress("CHALLENGE_FACTORY") returns (address factoryAddress) {
            if (factoryAddress != address(0)) {
                ChallengeFactory factory = ChallengeFactory(factoryAddress);
                try factory.updateChallengeAddress(2, address(wrapper)) {
                    console.log("Challenge2 registered with factory at:", factoryAddress);
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

