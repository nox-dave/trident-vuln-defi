# Trident: A Vulnerable DeFi Playground

A Vulnerable DeFi Playground for OffensiveSecurityDAO - An educational platform teaching smart contract security through hands-on exploitation of intentionally vulnerable contracts.

## Project Overview

Trident is an education/Web3-penetration platform that teaches smart contract security through hands-on exploitation of intentionally vulnerable contracts. The platform provides developers with a safe environment to understand common DeFi vulnerabilities including reentrancy attacks, access control flaws, integer overflows, and randomness manipulation.

## Tech Stack

- **Smart Contracts**: Solidity ^0.8.19, Foundry
- **Frontend**: React, Vite, Ethers.js v6, RainbowKit
- **Network**: Ethereum Sepolia Testnet

## Project Structure

```
trident-vuln-defi/
├── contracts/          # Foundry smart contracts
├── frontend/           # React frontend application
└── docs/              # Documentation
```

## Getting Started

### Smart Contracts

```bash
cd contracts
forge install
forge build
forge test
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Legal Disclaimer

This platform operates exclusively on testnet with clear disclaimers about education purposes. All code is for learning purposes and not suitable for any production use.

## License

MIT

