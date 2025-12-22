<div align="center">

<pre>
┌─────┼─────┐
▼     ▼     ▼
</pre>

# **TRIDENT**

### Smart Contract Penetration Testing Learning Platform

</div>

Educational platform for learning smart contract penetration testing through hands-on exploitation of intentionally vulnerable DeFi contracts.

## Tech Stack

- **Smart Contracts**: Solidity 0.8.30, Foundry
- **Backend**: Node.js, Express
- **Frontend**: React, Vite, Ethers.js v6, RainbowKit
- **Network**: Polygon Amoy Testnet (Chain ID: 80002)

## Structure

```
trident-vuln-defi/
├── contracts/          # Solidity contracts, tests, and deployment scripts
├── backend/            # API for compilation, testing, and verification
├── frontend/           # React web interface
```

## Architecture

### Frontend (React + Vite)
- React app with wagmi/viem for blockchain interactions
- Monaco editor for code editing
- Challenge list with progress tracking
- Certificate display (ERC-721 NFTs)
- On-chain deployment and execution flow

### Backend (Node.js + Express)
- **Compilation service**: Uses `solc` to compile user code
- **Testing service**: Runs Foundry tests by replacing exploit contracts in challenge files
- **Verification service**: Verifies solutions on-chain via ChallengeFactory
- **Challenge service**: Loads templates and challenge info
- **API endpoints**: `/api/compile`, `/api/test`, `/api/verify`, `/api/challenge/:id/template`

### Smart Contracts (Solidity 0.8.30 + Foundry)
- **ChallengeFactory**: Manages challenge registration and verification
- **ProgressTracker**: Tracks solved challenges per user
- **Certificate**: ERC-721 soulbound NFT for milestones (5, 10, 20 challenges)
- **Challenge wrappers**: Each implements `IChallenge` interface
- **5 challenges** covering different vulnerabilities

## Setup

### Contracts

```bash
cd contracts
forge install
forge build
forge test
```

Create `contracts/.env`:
```bash
PRIVATE_KEY=your_private_key_without_0x
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
CHALLENGE_FACTORY=0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66
```

### Backend

```bash
cd backend
npm install
npm run dev
```

Create `backend/.env`:
```bash
PORT=3001
POLYGON_AMOY_RPC_URL=https://rpc-amoy.polygon.technology
POLYGON_AMOY_CHALLENGE_FACTORY_ADDRESS=0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66
POLYGON_AMOY_PROGRESS_TRACKER_ADDRESS=0x2B85A7801d11397DfCF28539841da379803E6da7
PRIVATE_KEY=your_private_key_without_0x
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Challenges

Each challenge includes:
- **Template file**: Starting point for users
- **Challenge file**: Contains vulnerable contract + exploit contract placeholder
- **Test file**: Foundry test that validates the exploit
- **Wrapper contract**: Implements `IChallenge` interface, checks if challenge is solved

### The 5 Challenges

1. **Challenge 1 (Reentrancy)**: Drain ETH from vulnerable bank using reentrancy
2. **Challenge 2 (Access Control)**: Implement proper role-based access control
3. **Challenge 3 (Storage Misalignment)**: Exploit storage collision in upgradeable wallet
4. **Challenge 4 (Force Send ETH)**: Disable game by forcing ETH balance via selfdestruct
5. **Challenge 5 (Flash Loan)**: Drain tokens using flash loan approval manipulation


## User Flow

1. Connect wallet (MetaMask via wagmi)
2. Select challenge from list
3. View challenge details, vulnerable code, and hints
4. Write exploit code in Monaco editor
5. Compile code (backend uses solc)
6. Test locally (backend runs Foundry tests)
7. Deploy exploit contract on-chain (Polygon Amoy)
8. Execute exploit (calls `pwn()` function)
9. Verify solution (calls `ChallengeFactory.verifyAndRecord()`)
10. Earn certificate NFT at milestones (5, 10, 20 challenges)

## Features

- Free browser testing via Foundry
- Automatic exploit funding (Challenge 4 wrapper funds exploits)
- Progress tracking on-chain
- Certificate NFTs visible in MetaMask
- Template-based learning with hints
- Real-time compilation and testing feedback

## License

MIT