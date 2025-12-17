// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import {Test} from "forge-std/Test.sol";
import {UpgradeableWalletExploit, UpgradeableWallet, WalletImplementation} from "./Challenge3_Storage.sol";

contract Challenge3_StorageTest is Test {
    UpgradeableWallet private wallet;
    WalletImplementation private implementation;
    UpgradeableWalletExploit private exploit;
    address private constant owner = address(1);
    address private constant attacker = address(2);

    function setUp() public {
        implementation = new WalletImplementation();
        wallet = new UpgradeableWallet(address(implementation));

        deal(address(wallet), 10 ether);

        vm.prank(owner);
        (bool success, ) = address(wallet).call(
            abi.encodeWithSignature("setWithdrawLimit(uint256)", 1 ether)
        );
        require(success, "setWithdrawLimit failed");

        exploit = new UpgradeableWalletExploit(address(wallet));

        vm.label(address(wallet), "UpgradeableWallet");
        vm.label(address(implementation), "WalletImplementation");
        vm.label(address(exploit), "UpgradeableWalletExploit");
    }

    function test_pwn() public {
        uint256 initialBalance = address(wallet).balance;
        assertGt(initialBalance, 0, "Wallet should have ETH");

        vm.prank(attacker);
        exploit.pwn();

        assertEq(address(wallet).balance, 0, "Wallet should be drained");
    }
}
