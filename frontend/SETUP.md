# Frontend Setup Instructions

## 1. Configure Contract Addresses

After deploying your contracts to Sepolia, update `src/config/contracts.js`:

```javascript
export const CONTRACT_ADDRESSES = {
  CHALLENGE_FACTORY: '0x...', // Your deployed ChallengeFactory address
  PROGRESS_TRACKER: '0x...',  // Your deployed ProgressTracker address
}
```

## 2. Configure RainbowKit Project ID

1. Go to https://cloud.walletconnect.com/
2. Create a project and get your Project ID
3. Update `src/config/wallet.js`:

```javascript
projectId: 'YOUR_PROJECT_ID', // Replace with your WalletConnect Project ID
```

## 3. Install Dependencies

```bash
npm install
```

## 4. Run Development Server

```bash
npm run dev
```

## Usage Flow

1. Connect wallet (top right)
2. Select a challenge from the gallery
3. Deploy challenge instance
4. Write exploit contract in code editor
5. Compile exploit contract
6. Deploy exploit contract
7. Execute exploit
8. Verify solution

## Notes

- Make sure you're connected to Sepolia testnet
- You'll need testnet ETH for gas fees
- Each user gets their own isolated challenge instance

