// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface ISevenEth {
    function play() external payable;
}

contract SevenEthExploit {
    address public target;

    constructor(address _target) {
        target = _target;
    }

    function pwn() external payable {
    }
}
