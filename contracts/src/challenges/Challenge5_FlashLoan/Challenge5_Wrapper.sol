// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../../IChallenge.sol";
import "./Token.sol";
import "./IERC20.sol";
import "./Challenge5_FlashLoan.sol";

contract LendingPool {
    IERC20 public token;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function flashLoan(uint256 amount, address target, bytes calldata data)
        external
    {
        uint256 balBefore = token.balanceOf(address(this));
        require(balBefore >= amount, "borrow amount > balance");

        token.transfer(msg.sender, amount);
        (bool ok,) = target.call(data);
        require(ok, "loan failed");

        uint256 balAfter = token.balanceOf(address(this));
        require(balAfter >= balBefore, "balance after < before");
    }
}

contract Challenge5_Wrapper is IChallenge {
    LendingPool public immutable pool;
    Token public immutable token;
    uint256 private constant INIT_AMOUNT = 0.001 ether;
    uint256 private constant TOKEN_AMOUNT = 1e18;
    bool private _initialized;

    error AlreadyInitialized();
    error InsufficientFunds();

    constructor() {
        token = new Token("FlashLoanToken", "FLT", 18);
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

