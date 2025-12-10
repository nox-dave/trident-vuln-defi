// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

interface IEthBank {
    function deposit() external payable;
    function withdraw() external payable;
}

contract EthBankExploit {
    IEthBank public bank;

    constructor(address _bank) {
        bank = IEthBank(_bank);
    }

    function pwn() external payable {}
}

