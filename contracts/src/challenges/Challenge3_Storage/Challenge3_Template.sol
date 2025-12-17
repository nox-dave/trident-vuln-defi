// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IUpgradeableWallet {}

contract MaliciousImplementatation {
    address public implementation;
    uint256 public limit;
    address payable public owner;

    constructor() {
        owner = payable(msg.sender);
    }

    function withdraw() external {
        payable(msg.sender).transfer(address(this).balance);
    }
}

contract UpgradeableWalletExploit {
    address public target;
    MaliciousImplementatation public malicious;

    constructor(address _target) {
        target = _target;
        malicious = new MaliciousImplementatation();
    }

    receive() external payable {}

    function pwn() external {}
}
