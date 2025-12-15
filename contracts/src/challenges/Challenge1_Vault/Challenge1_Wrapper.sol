// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../../IChallenge.sol";
import "./Challenge1_Vault.sol";

contract Challenge1_Wrapper is IChallenge {
    EthBank public immutable bank;
    uint256 private constant INIT_AMOUNT = 0.001 ether;
    uint256 private constant DEPOSIT_AMOUNT = 0.0005 ether;
    bool private _initialized;

    error AlreadyInitialized();
    error InsufficientFunds();

    constructor() {
        bank = new EthBank();
    }

    function initialize() external payable {
        if (_initialized) revert AlreadyInitialized();
        if (address(this).balance < INIT_AMOUNT) revert InsufficientFunds();

        _initialized = true;
        bank.deposit{value: DEPOSIT_AMOUNT}();
        bank.deposit{value: DEPOSIT_AMOUNT}();
    }

    function isSolved() external view override returns (bool) {
        return _initialized && address(bank).balance == 0;
    }

    function challengeId() external pure override returns (uint256) {
        return 1;
    }

    function initialized() external view returns (bool) {
        return _initialized;
    }

    receive() external payable {
        if (!_initialized && address(this).balance >= INIT_AMOUNT) {
            _initialized = true;
            bank.deposit{value: DEPOSIT_AMOUNT}();
            bank.deposit{value: DEPOSIT_AMOUNT}();
        }
    }
}
