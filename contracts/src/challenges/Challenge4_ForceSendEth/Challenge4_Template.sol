// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract SevenEthExploit {
    address private immutable target;

    constructor(address _target) {
        target = _target;
    }

    receive() external payable {}

    function pwn() external payable {
        // write your code here
    }
}
