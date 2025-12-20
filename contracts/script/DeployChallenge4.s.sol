// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Challenge4_Wrapper} from "../src/challenges/Challenge4_ForceSendEth/Challenge4_Wrapper.sol";
import {ChallengeFactory} from "../src/ChallengeFactory.sol";

contract DeployChallenge4 is Script {
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

        Challenge4_Wrapper wrapper = new Challenge4_Wrapper{value: 0.001 ether + 0.01 ether}();

        console.log("Challenge4_Wrapper deployed at:", address(wrapper));
        console.log("SevenEth deployed at:", address(wrapper.game()));
        console.log("Initialized:", wrapper.initialized());
        console.log("Game balance:", address(wrapper.game()).balance);

        try vm.envAddress("CHALLENGE_FACTORY") returns (address factoryAddress) {
            if (factoryAddress != address(0)) {
                ChallengeFactory factory = ChallengeFactory(factoryAddress);
                try factory.updateChallengeAddress(4, address(wrapper)) {
                    console.log("Challenge4 registered with factory at:", factoryAddress);
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
