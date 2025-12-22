// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {Token} from "./Token.sol";
import {IERC20} from "./IERC20.sol";
import {LendingPoolExploit} from "./Challenge5_FlashLoan.sol";

contract LendingPoolExploitTest is Test {
    address private constant attacker = address(3);
    Token private token;
    LendingPool private pool;
    LendingPoolExploit private exploit;

    function setUp() public {
        token = new Token("test", "TEST", 18);
        pool = new LendingPool(address(token));
        exploit = new LendingPoolExploit(address(pool));

        token.mint(address(pool), 1e18);

        vm.label(address(token), "Token");
        vm.label(address(pool), "LendingPool");
        vm.label(address(exploit), "LendingPoolExploit");
    }

    function test_pwn() public {
        vm.prank(attacker);
        exploit.pwn();

        assertEq(token.balanceOf(address(pool)), 0);
    }
}

contract LendingPool {
    IERC20 public token;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function flashLoan(
        uint256 amount,
        address target,
        bytes calldata data
    ) external {
        uint256 balBefore = token.balanceOf(address(this));
        require(balBefore >= amount, "borrow amount > balance");

        token.transfer(msg.sender, amount);
        (bool ok, ) = target.call(data);
        require(ok, "loan failed");

        uint256 balAfter = token.balanceOf(address(this));
        require(balAfter >= balBefore, "balance after < before");
    }
}
