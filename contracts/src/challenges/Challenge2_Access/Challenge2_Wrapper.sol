// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

import "../../IChallenge.sol";
import "./Challenge2_Access.sol";

contract Challenge2_Wrapper is IChallenge {
    AccessControl public immutable accessControl;
    bool private _initialized;

    error AlreadyInitialized();

    constructor() {
        accessControl = new AccessControl();
    }

    function initialize() external {
        if (_initialized) revert AlreadyInitialized();
        _initialized = true;
    }

    function isSolved() external view override returns (bool) {
        if (!_initialized) return false;

        bytes32 ADMIN = accessControl.ADMIN();
        bytes32 USER = accessControl.USER();

        return ADMIN != bytes32(0) && USER != bytes32(0);
    }

    function challengeId() external pure override returns (uint256) {
        return 2;
    }

    function initialized() external view returns (bool) {
        return _initialized;
    }
}
