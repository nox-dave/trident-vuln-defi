// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {UpgradeableWalletExploit, UpgradeableWallet, WalletImplementation} from "./Challenge2_Access.sol";

contract UpgradeableWalletExploitTest is Test {
    address private constant attacker = address(3);
    WalletImplementation private imp;
    UpgradeableWallet private wallet;
    UpgradeableWalletExploit private exploit;

    function setUp() public {
        imp = new WalletImplementation();
        wallet = new UpgradeableWallet(address(imp));

        (bool ok, ) = address(wallet).call{value: 1e18}("");
        require(ok, "failed to send ETH");

        exploit = new UpgradeableWalletExploit(address(wallet));

        vm.label(address(imp), "WalletImplementation");
        vm.label(address(wallet), "UpgradeableWallet");
        vm.label(address(exploit), "UpgradeableWalletExploit");
    }

    function test_pwn() public {
        vm.prank(attacker);
        exploit.pwn();
        assertEq(address(wallet).balance, 0);
    }
}
