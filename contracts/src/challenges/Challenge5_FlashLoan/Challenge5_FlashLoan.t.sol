// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {LendingPoolExploit, LendingPool, SimpleERC20} from "./Challenge5_FlashLoan.sol";

contract Challenge5_FlashLoanTest is Test {
    SimpleERC20 private token;
    LendingPool private pool;
    LendingPoolExploit private exploit;
    address private constant attacker = address(3);

    function setUp() public {
        token = new SimpleERC20();
        pool = new LendingPool(address(token));
        
        token.mint(address(pool), 1000e18);
        
        exploit = new LendingPoolExploit(address(pool));

        vm.label(address(token), "SimpleERC20");
        vm.label(address(pool), "LendingPool");
        vm.label(address(exploit), "LendingPoolExploit");
    }

    function test_pwn() public {
        uint256 initialBalance = token.balanceOf(address(pool));
        assertGt(initialBalance, 0, "Pool should have tokens");

        vm.prank(attacker);
        exploit.pwn();

        assertEq(token.balanceOf(address(pool)), 0, "Pool should be drained");
        assertEq(token.balanceOf(address(exploit)), initialBalance, "Exploit should have all tokens");
    }
}
