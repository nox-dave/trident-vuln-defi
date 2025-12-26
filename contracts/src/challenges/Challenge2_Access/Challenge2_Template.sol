// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract UpgradeableWalletExploit {
    address public target;

    constructor(address _target) {
        target = _target;
    }

    function pwn() external {}
}
