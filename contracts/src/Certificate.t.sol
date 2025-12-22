// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {Certificate} from "./Certificate.sol";
import {ProgressTracker} from "./ProgressTracker.sol";
import {ChallengeFactory} from "./ChallengeFactory.sol";

contract CertificateTest is Test {
    Certificate public certificate;
    ProgressTracker public progressTracker;
    ChallengeFactory public factory;
    address public user = address(1);

    function setUp() public {
        certificate = new Certificate();
        
        address deployerAddress = address(this);
        uint256 currentNonce = vm.getNonce(deployerAddress);
        address factoryAddress = vm.computeCreateAddress(deployerAddress, currentNonce + 1);
        
        progressTracker = new ProgressTracker(factoryAddress, address(certificate));
        factory = new ChallengeFactory(address(progressTracker));
        certificate.setProgressTracker(address(progressTracker));
        
        require(address(factory) == factoryAddress, "Factory address mismatch");
    }

    function test_Milestone5() public {
        for (uint256 i = 1; i <= 5; i++) {
            vm.prank(address(factory));
            progressTracker.recordSolution(user, i);
        }

        assertTrue(certificate.hasCertificate(user, 1));
        assertEq(certificate.balanceOf(user), 1);
    }

    function test_Milestone10() public {
        for (uint256 i = 1; i <= 10; i++) {
            vm.prank(address(factory));
            progressTracker.recordSolution(user, i);
        }

        assertTrue(certificate.hasCertificate(user, 1));
        assertTrue(certificate.hasCertificate(user, 2));
        assertEq(certificate.balanceOf(user), 2);
    }

    function test_NoDuplicateMinting() public {
        for (uint256 i = 1; i <= 5; i++) {
            vm.prank(address(factory));
            progressTracker.recordSolution(user, i);
        }

        assertTrue(certificate.hasCertificate(user, 1));
        uint256 balanceBefore = certificate.balanceOf(user);

        vm.prank(address(factory));
        progressTracker.recordSolution(user, 6);

        assertEq(certificate.balanceOf(user), balanceBefore);
    }

    function test_Soulbound() public {
        for (uint256 i = 1; i <= 5; i++) {
            vm.prank(address(factory));
            progressTracker.recordSolution(user, i);
        }

        vm.expectRevert(Certificate.SoulboundToken.selector);
        certificate.transferFrom(user, address(3), 1);
    }
}

