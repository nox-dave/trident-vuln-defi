// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IAccessControl {
    function grantRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;
}

contract Challenge2Exploit {
    IAccessControl public accessControl;

    constructor(address _accessControl) {
        accessControl = IAccessControl(_accessControl);
    }

    function pwn() external {}
}

contract AccessControl {
    event GrantRole(bytes32 indexed role, address indexed account);
    event RevokeRole(bytes32 indexed role, address indexed account);

    mapping(bytes32 => mapping(address => bool)) public roles;

    bytes32 public constant ADMIN = keccak256(abi.encodePacked("ADMIN"));

    function _grantRole(bytes32 role, address account) internal {
        // Write code here
    }

    function grantRole(bytes32 role, address account) external {
        // Write code here
    }

    function revokeRole(bytes32 role, address account) external {
        // Write code here
    }
}
