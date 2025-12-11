# Trident Test API Backend

Backend API server for running Foundry tests in the browser (free verification).

## Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure Foundry is installed:
```bash
curl -L https://foundry.paradigm.xyz | bash
foundryup
```

3. Start the server:
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

The server will run on `http://localhost:3001` by default.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `SEPOLIA_RPC_URL` - Sepolia testnet RPC URL (default: https://rpc.sepolia.org)
- `SEPOLIA_CHALLENGE_FACTORY_ADDRESS` - Address of the ChallengeFactory contract on Sepolia (required for verification)
- `SEPOLIA_PRIVATE_KEY` - Private key of the wallet that will sign verification transactions (required for verification, without 0x prefix)

## API Endpoints

### POST /api/test
Runs a Foundry test for a challenge. If tests pass and `userAddress` is provided, automatically verifies the solution on Sepolia testnet.

**Request:**
```json
{
  "challengeId": "1",
  "exploitCode": "contract EthBankExploit { ... }",
  "userAddress": "0x..." // Optional, but required for Sepolia verification
}
```

**Response:**
```json
{
  "success": true,
  "passed": true,
  "output": "Test output...",
  "verification": {
    "success": true,
    "verified": true,
    "transactionHash": "0x...",
    "blockNumber": "12345678"
  }
}
```

If verification fails or is not configured, the `verification` object will contain error details.

### GET /api/challenge/:id/template
Loads the exploit template for a challenge.

**Response:**
```json
{
  "template": "interface IEthBank { ... }",
  "interface": "interface IEthBank { ... }"
}
```

## Notes

- Tests are run in a temporary directory that is cleaned up after each test
- The server requires Foundry to be installed and accessible via `forge` command
- Test execution has a 30 second timeout
- When tests pass, the backend automatically verifies the solution on Sepolia testnet if:
  - `userAddress` is provided in the request
  - `SEPOLIA_CHALLENGE_FACTORY_ADDRESS` and `SEPOLIA_PRIVATE_KEY` are configured
  - The verification transaction calls `verifyAndRecord` on the ChallengeFactory contract

