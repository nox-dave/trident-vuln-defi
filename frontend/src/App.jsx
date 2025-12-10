import { useState } from 'react'
import CodeEditor from './components/CodeEditor'

const initialCode = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {IChallenge} from "../interfaces/IChallenge.sol";

contract Challenge1_Vault is IChallenge {
    bool public solved;
    
    uint256 public constant CHALLENGE_ID = 1;
    string public constant CHALLENGE_NAME = "Vault Reentrancy";
    string public constant DIFFICULTY = "Easy";
    
    mapping(address => uint256) public balances;
    
    event ChallengeSolved(address indexed solver, uint256 timestamp);
    
    function isSolved() external view returns (bool) {
        return solved;
    }
    
    function challengeId() external pure returns (uint256) {
        return CHALLENGE_ID;
    }
    
    function challengeName() external pure returns (string memory) {
        return CHALLENGE_NAME;
    }
    
    function difficulty() external pure returns (string memory) {
        return DIFFICULTY;
    }
    
    function deposit() external payable {
        balances[msg.sender] += msg.value;
    }
    
    function withdraw(uint256 amount) external {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Transfer failed");
        
        balances[msg.sender] -= amount;
        
        if (address(this).balance == 0) {
            solved = true;
            emit ChallengeSolved(msg.sender, block.timestamp);
        }
    }
    
    receive() external payable {
        deposit();
    }
}`

function App() {
  const handleCompile = (code) => {
    console.log('Compiling:', code)
  }

  const handleRun = (code) => {
    console.log('Running:', code)
  }

  return (
    <CodeEditor 
      initialCode={initialCode}
      onCompile={handleCompile}
      onRun={handleRun}
    />
  )
}

export default App
