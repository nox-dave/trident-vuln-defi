// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../../IChallenge.sol";

contract SevenEth {
    function play() external payable {
        require(msg.value == 0.0005 ether, "not 0.0005 ether");
        uint256 bal = address(this).balance;
        require(bal <= 0.01 ether, "game over");
        if (bal == 0.01 ether) {
            payable(msg.sender).transfer(0.01 ether);
        }
    }
}

contract Challenge4_Wrapper is IChallenge {
    SevenEth public immutable game;
    uint256 private constant INIT_AMOUNT = 0.001 ether;
    uint256 private constant DEPOSIT_AMOUNT = 0.0005 ether;
    uint256 private constant EXPLOIT_FUNDING = 0.01 ether;
    bool private _initialized;

    error AlreadyInitialized();
    error InsufficientFunds();

    constructor() payable {
        game = new SevenEth();
        if (msg.value >= INIT_AMOUNT + EXPLOIT_FUNDING) {
            _initialized = true;
            game.play{value: DEPOSIT_AMOUNT}();
            game.play{value: DEPOSIT_AMOUNT}();
        }
    }

    function initialize() external payable {
        if (_initialized) revert AlreadyInitialized();
        if (address(this).balance < INIT_AMOUNT + EXPLOIT_FUNDING)
            revert InsufficientFunds();

        _initialized = true;

        game.play{value: DEPOSIT_AMOUNT}();
        game.play{value: DEPOSIT_AMOUNT}();
    }

    function fundExploit(address exploit) external {
        require(_initialized, "not initialized");
        require(address(this).balance >= EXPLOIT_FUNDING, "insufficient funds");
        payable(exploit).transfer(EXPLOIT_FUNDING);
    }

    function isSolved() external view override returns (bool) {
        return _initialized && address(game).balance > 0.01 ether;
    }

    function challengeId() external pure override returns (uint256) {
        return 4;
    }

    function initialized() external view returns (bool) {
        return _initialized;
    }

    receive() external payable {
        if (
            !_initialized &&
            address(this).balance >= INIT_AMOUNT + EXPLOIT_FUNDING
        ) {
            _initialized = true;

            game.play{value: DEPOSIT_AMOUNT}();
            game.play{value: DEPOSIT_AMOUNT}();
        }
    }
}
