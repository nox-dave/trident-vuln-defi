// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../../IChallenge.sol";
import "./Challenge4_Lottery.sol";

contract Challenge4_Wrapper is IChallenge {
    SevenEth public immutable game;
    uint256 private constant INIT_AMOUNT = 0.001 ether;
    uint256 private constant DEPOSIT_AMOUNT = 0.0005 ether;
    bool private _initialized;

    error AlreadyInitialized();
    error InsufficientFunds();

    constructor() {
        game = new SevenEth();
    }

    function initialize() external payable {
        if (_initialized) revert AlreadyInitialized();
        if (address(this).balance < INIT_AMOUNT) revert InsufficientFunds();

        _initialized = true;
        
        game.play{value: DEPOSIT_AMOUNT}();
        game.play{value: DEPOSIT_AMOUNT}();
    }

    function isSolved() external view override returns (bool) {
        return _initialized && address(game).balance > 7 ether;
    }

    function challengeId() external pure override returns (uint256) {
        return 4;
    }

    function initialized() external view returns (bool) {
        return _initialized;
    }

    receive() external payable {
        if (!_initialized && address(this).balance >= INIT_AMOUNT) {
            _initialized = true;
            
            game.play{value: DEPOSIT_AMOUNT}();
            game.play{value: DEPOSIT_AMOUNT}();
        }
    }
}

