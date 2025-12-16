// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {AccessControl} from "./Challenge2_Access.sol";

contract AccessControlTest is Test {
    AccessControl private ac;
    bytes32 constant ADMIN =
        0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42;
    bytes32 constant USER =
        0x2db9fd3d099848027c2383d0a083396f6c41510d7acfd92adc99b6cffcf31e96;

    function setUp() public {
        ac = new AccessControl();
        vm.label(address(ac), "AccessControl");
    }

    function test_user() public {
        assertEq(ac.USER(), USER);
    }

    function test_grantRole() public {
        vm.expectRevert();
        vm.prank(address(1));
        ac.grantRole(USER, address(1));

        ac.grantRole(USER, address(1));
        assertEq(ac.roles(USER, address(1)), true);
    }

    function test_revokeRole() public {
        ac.grantRole(USER, address(1));

        vm.expectRevert();
        vm.prank(address(1));
        ac.revokeRole(USER, address(1));

        ac.revokeRole(USER, address(1));
        assertEq(ac.roles(USER, address(1)), false);
    }
}
