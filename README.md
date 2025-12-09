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

### Configuration

1. Create a `.env` file in the `contracts/` directory with the following variables:

```bash
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID
PRIVATE_KEY=your_private_key_here_without_0x_prefix
ETHERSCAN_API_KEY=your_etherscan_api_key_here
```

**How to get these values:**
- **SEPOLIA_RPC_URL**: Get a free RPC endpoint from [Infura](https://infura.io/), [Alchemy](https://www.alchemy.com/), or use a public endpoint like `https://rpc.sepolia.org`
- **PRIVATE_KEY**: Your wallet's private key (without 0x prefix). **NEVER commit this to Git!**
- **ETHERSCAN_API_KEY**: Get from [Etherscan](https://etherscan.io/apis) (free account required)

**Important**: Foundry doesn't automatically load `.env` files. Before running deployment scripts, source the file:

```bash
cd contracts
source .env
```

### Smart Contracts

```bash
cd contracts
forge install
forge build
forge test
```

### Deploying Contracts

When deploying to Sepolia, make sure to source your `.env` file first:

```bash
cd contracts
source .env
forge script script/Deploy.s.sol --rpc-url sepolia --broadcast
```

Or run it in one command:

```bash
cd contracts
source .env && forge script script/Deploy.s.sol --rpc-url sepolia --broadcast
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

