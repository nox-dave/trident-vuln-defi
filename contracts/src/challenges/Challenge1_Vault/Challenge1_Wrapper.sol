// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../../IChallenge.sol";
import "./Challenge1_Vault.sol";

contract Challenge1_Wrapper is IChallenge {
    EthBank public bank;
    bool public initialized;

    constructor() {
        bank = new EthBank();
    }

    function initialize() external payable {
        require(!initialized, "Already initialized");
        require(address(this).balance >= 2 ether, "Need at least 2 ether");
        initialized = true;
        
        bank.deposit{value: 1 ether}();
        bank.deposit{value: 1 ether}();
    }

    function isSolved() external view override returns (bool) {
        if (!initialized) {
            return false;
        }
        return address(bank).balance == 0;
    }

    function challengeId() external pure override returns (uint256) {
        return 1;
    }

    function challengeName() external pure override returns (string memory) {
        return "Vault Reentrancy";
    }

    function difficulty() external pure override returns (string memory) {
        return "Easy";
    }
    
    receive() external payable {
        if (!initialized && address(this).balance >= 2 ether) {
            this.initialize{value: 0}();
        }
    }
}

