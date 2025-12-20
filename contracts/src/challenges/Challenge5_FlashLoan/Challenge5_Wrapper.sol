// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../../IChallenge.sol";
import "./Challenge5_FlashLoan.sol";

contract Challenge5_Wrapper is IChallenge {
    LendingPool public immutable pool;
    SimpleERC20 public immutable token;
    uint256 private constant INIT_AMOUNT = 0.001 ether;
    uint256 private constant TOKEN_AMOUNT = 1000e18;
    bool private _initialized;

    error AlreadyInitialized();
    error InsufficientFunds();

    constructor() {
        token = new SimpleERC20();
        pool = new LendingPool(address(token));
    }

    function initialize() external payable {
        if (_initialized) revert AlreadyInitialized();
        if (address(this).balance < INIT_AMOUNT) revert InsufficientFunds();

        _initialized = true;
        
        token.mint(address(pool), TOKEN_AMOUNT);
    }

    function isSolved() external view override returns (bool) {
        return _initialized && token.balanceOf(address(pool)) == 0;
    }

    function challengeId() external pure override returns (uint256) {
        return 5;
    }

    function initialized() external view returns (bool) {
        return _initialized;
    }

    receive() external payable {
        if (!_initialized && address(this).balance >= INIT_AMOUNT) {
            _initialized = true;
            
            token.mint(address(pool), TOKEN_AMOUNT);
        }
    }
}

