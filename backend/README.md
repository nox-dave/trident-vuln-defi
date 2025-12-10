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

## API Endpoints

### POST /api/test
Runs a Foundry test for a challenge.

**Request:**
```json
{
  "challengeId": "52",
  "exploitCode": "contract EthBankExploit { ... }"
}
```

**Response:**
```json
{
  "success": true,
  "passed": true,
  "output": "Test output..."
}
```

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

