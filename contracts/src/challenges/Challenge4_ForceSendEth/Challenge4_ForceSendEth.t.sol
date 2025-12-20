// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {SevenEthExploit} from "./Challenge4_ForceSendEth.sol";
import {Challenge4_Wrapper} from "./Challenge4_Wrapper.sol";

contract Challenge4_ForceSendEthTest is Test {
    address private constant attacker = address(3);
    Challenge4_Wrapper private wrapper;
    SevenEthExploit private exploit;

    function setUp() public {
        wrapper = new Challenge4_Wrapper{value: 0.001 ether + 0.01 ether}();

        deal(attacker, 0.01 ether);
        exploit = new SevenEthExploit(address(wrapper.game()));

        vm.label(address(wrapper.game()), "SevenEth");
        vm.label(address(exploit), "SevenEthExploit");
    }

    function test_pwn() public {
        wrapper.fundExploit(address(exploit));
        vm.prank(attacker);
        exploit.pwn();

        assertTrue(wrapper.isSolved(), "Challenge should be solved");
    }
}
