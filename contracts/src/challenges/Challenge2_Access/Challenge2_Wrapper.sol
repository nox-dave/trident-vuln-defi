// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../../IChallenge.sol";
import "./Challenge2_Access.sol";

contract Challenge2_Wrapper is IChallenge {
    UpgradeableWallet public immutable wallet;
    WalletImplementation public immutable implementation;
    uint256 private constant INIT_AMOUNT = 1 ether;
    bool private _initialized;

    error AlreadyInitialized();
    error InsufficientFunds();

    constructor() {
        implementation = new WalletImplementation();
        wallet = new UpgradeableWallet(address(implementation));
    }

    function initialize() external payable {
        if (_initialized) revert AlreadyInitialized();
        if (address(this).balance < INIT_AMOUNT) revert InsufficientFunds();

        _initialized = true;
        
        (bool success, ) = address(wallet).call{value: INIT_AMOUNT}("");
        require(success, "Failed to fund wallet");
    }

    function isSolved() external view override returns (bool) {
        return _initialized && address(wallet).balance == 0;
    }

    function challengeId() external pure override returns (uint256) {
        return 2;
    }

    function initialized() external view returns (bool) {
        return _initialized;
    }

    receive() external payable {
        if (!_initialized && address(this).balance >= INIT_AMOUNT) {
            _initialized = true;
            
            (bool success, ) = address(wallet).call{value: INIT_AMOUNT}("");
            require(success, "Failed to fund wallet");
        }
    }
}
