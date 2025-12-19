// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {SevenEthExploit, SevenEth} from "./Challenge4_Lottery.sol";

contract Challenge4_LotteryTest is Test {
    address private constant alice = address(1);
    address private constant bob = address(2);
    address private constant attacker = address(3);
    SevenEth private game;
    SevenEthExploit private exploit;

    function setUp() public {
        game = new SevenEth();

        deal(alice, 1e18);
        vm.prank(alice);
        game.play{value: 1e18}();

        deal(bob, 1e18);
        vm.prank(bob);
        game.play{value: 1e18}();

        deal(attacker, 10e18);
        exploit = new SevenEthExploit(address(game));

        vm.label(address(game), "SevenEth");
        vm.label(address(exploit), "SevenEthExploit");
    }

    function test_pwn() public {
        vm.prank(attacker);
        exploit.pwn{value: 10e18}();

        assertGt(address(game).balance, 7 ether);
    }
}
