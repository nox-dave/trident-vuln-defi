// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

interface ILendingPool {
    function token() external view returns (IERC20);
    function flashLoan(uint256 amount, address target, bytes calldata data) external;
}

contract LendingPoolExploit {
    IERC20 public token;
    ILendingPool public pool;

    constructor(address _pool) {
        pool = ILendingPool(_pool);
        token = pool.token();
    }

    function pwn() external {
    }
}
