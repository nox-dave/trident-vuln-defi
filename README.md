<div align="center">

<pre>
┌─────┼─────┐
▼     ▼     ▼
</pre>

# **TRIDENT**

### Smart Contract Security Learning Platform

</div>

Educational platform for learning smart contract security through hands-on exploitation of intentionally vulnerable DeFi contracts.

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

## Deployed Challenges

See `DEPLOYED_CONTRACTS.md` for complete deployment details.

| Challenge | Type | Vulnerability | Address |
|-----------|------|--------------|---------|
| Challenge 1 | Vault Reentrancy | Reentrancy | `0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7` |
| Challenge 2 | Access Control | tx.origin flaw | `0xf6aC18Cb090d27200Be3335cf6B7Bc9fCD6C35Ad` |
| Challenge 3 | Storage Misalignment | Storage collision | `0xaF6B5f41D51AF63e5A10b106674Ef45A4AD762C8` |

## Deployment

Deploy new challenge:
```bash
cd contracts
forge script script/DeployChallenge1.s.sol:DeployChallenge1 \
  --rpc-url https://rpc-amoy.polygon.technology \
  --broadcast \
  --legacy
```

Check challenge status:
```bash
forge script script/CheckChallengeSolved.s.sol:CheckChallengeSolved \
  --rpc-url https://rpc-amoy.polygon.technology
```

## License

MIT