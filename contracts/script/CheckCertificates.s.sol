// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Script, console} from "forge-std/Script.sol";
import {Certificate} from "../src/Certificate.sol";

contract CheckCertificates is Script {
    function run() external {
        address certificateAddress = 0x836093bAB2DCa08a97567dBbF0c75eE9C6B305c9;
        address userAddress = 0x491dcF33ef2AFa81Fa9b711C81Ed156E6482365c;
        
        address envCert = vm.envOr("CERTIFICATE_ADDRESS", address(0));
        address envUser = vm.envOr("USER_ADDRESS", address(0));
        
        if (envCert != address(0)) {
            certificateAddress = envCert;
        }
        if (envUser != address(0)) {
            userAddress = envUser;
        }
        
        if (certificateAddress == address(0)) {
            console.log("CERTIFICATE_ADDRESS not set");
            return;
        }
        
        console.log("Certificate contract:", certificateAddress);
        console.log("User address:", userAddress);
        
        Certificate certificate = Certificate(certificateAddress);
        
        uint256 balance = certificate.balanceOf(userAddress);
        console.log("Total certificates:", balance);
        
        uint256[] memory tokenIds = certificate.getCertificates(userAddress);
        
        if (tokenIds.length == 0) {
            console.log("User has no certificates");
        } else {
            console.log("Certificates owned:");
            for (uint256 i = 0; i < tokenIds.length; i++) {
                uint256 tokenId = tokenIds[i];
                uint256 milestone = certificate.getMilestoneForTokenId(tokenId);
                string memory uri = certificate.tokenURI(tokenId);
                console.log("Token ID:", tokenId);
                console.log("Milestone:", milestone);
                console.log("URI:", uri);
            }
        }
        
        console.log("\nChecking individual certificates:");
        for (uint256 i = 1; i <= 3; i++) {
            bool hasCert = certificate.hasCertificate(userAddress, i);
            uint256 milestone = certificate.getMilestoneForTokenId(i);
            console.log("Certificate", i);
            console.log("Milestone:", milestone);
            if (hasCert) {
                console.log("Status: OWNED");
            } else {
                console.log("Status: NOT OWNED");
            }
        }
    }
}

