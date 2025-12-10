export const CHALLENGE_DETAILS = {
  1: {
    title: 'Vault Reentrancy',
    tags: ['solidity', 'easy', 'security', 'ctf'],
    points: 100,
    scenario: 'Alice and Bob each has 1 ETH deposited into the vault contract.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IChallenge} from "../interfaces/IChallenge.sol";

contract Challenge1_Vault is IChallenge {
    mapping(address => bool) public solved;
    mapping(address => uint256) public balances;

    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }

    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");

        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");

        balances[msg.sender] -= amount;

        if (balances[msg.sender] == 0 && address(this).balance == 0) {
            solved[msg.sender] = true;
            emit ChallengeSolved(msg.sender, block.timestamp);
        }
    }

    receive() external payable {
        balances[msg.sender] += msg.value;
    }
}`,
    tasks: [
      {
        id: 1,
        description: 'Drain all ETH from the vault. You are given 1 ETH when the function attack is called.',
        completed: false,
      },
    ],
    hints: [
      'Inside attack, deposit and then withdraw 1 ETH.',
      'receive will be called by the vault so call withdraw again.',
      'Optionally send all ETH to attacker.',
    ],
  },
  2: {
    title: 'Access Control',
    tags: ['solidity', 'easy', 'security', 'ctf'],
    points: 100,
    scenario: 'The contract uses tx.origin for authentication instead of msg.sender.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Challenge2_Access {
    address public owner;
    
    constructor() {
        owner = tx.origin;
    }
    
    function withdraw() external {
        require(tx.origin == owner, "Not owner");
        payable(msg.sender).transfer(address(this).balance);
    }
}`,
    tasks: [
      {
        id: 1,
        description: 'Exploit the tx.origin vulnerability to drain the contract.',
        completed: false,
      },
    ],
    hints: [
      'tx.origin refers to the original EOA that initiated the transaction.',
      'msg.sender can be a contract address.',
      'Create an intermediary contract to exploit this.',
    ],
  },
  3: {
    title: 'Token Overflow',
    tags: ['solidity', 'medium', 'security', 'ctf'],
    points: 200,
    scenario: 'The token contract has an integer overflow vulnerability.',
    vulnerableCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract Challenge3_Token {
    mapping(address => uint256) public balances;
    
    function transfer(address to, uint256 amount) external {
        balances[msg.sender] -= amount;
        balances[to] += amount;
    }
}`,
    tasks: [
      {
        id: 1,
        description: 'Exploit the integer overflow to gain tokens.',
        completed: false,
      },
    ],
    hints: [
      'Solidity 0.8+ has built-in overflow protection.',
      'But older versions or unchecked blocks can be vulnerable.',
      'Think about how to manipulate the arithmetic.',
    ],
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

