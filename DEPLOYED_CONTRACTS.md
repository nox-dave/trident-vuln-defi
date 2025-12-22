# Deployed Contracts

## Network: Polygon Amoy (Chain ID: 80002)

## Core Contracts

### ChallengeFactory
- **Address**: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`
- **Owner**: `0x491dcF33ef2AFa81Fa9b711C81Ed156E6482365c`
- **Purpose**: Manages challenge registration and verification
- **Key Functions**:
  - `updateChallengeAddress()` - Register challenges (owner only)
  - `verifyAndRecord()` - Verify solutions and record progress
  - `getChallengeAddress()` - Get registered challenge address

### ProgressTracker
- **Address**: `0x2B85A7801d11397DfCF28539841da379803E6da7`
- **Factory**: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`
- **Purpose**: Tracks which users have solved which challenges
- **Note**: This is the original ProgressTracker deployed before certificate system. Certificates are awarded via CertificateMigrator for users who solved challenges before certificate deployment.
- **Key Functions**:
  - `recordSolution()` - Records solution (only callable by factory)
  - `hasSolved()` - Check if user solved a challenge
  - `getSolvedCount()` - Get total solved challenges for a user

## NFT Certificate System

### Certificate Contract (ERC-721 NFT)
- **Contract Address**: `0x836093bAB2DCa08a97567dBbF0c75eE9C6B305c9`
- **Network**: Polygon Amoy Testnet (Chain ID: 80002)
- **Collection Name**: "Trident Challenge Certificates"
- **Collection Symbol**: "TCC"
- **Type**: Soulbound NFT (SBT) - Non-transferable
- **Status**: ✅ Active and ERC-721 compatible (visible in MetaMask)

### Certificate Milestones
- **Token ID 1**: 5 challenges completed
- **Token ID 2**: 10 challenges completed
- **Token ID 3**: 20 challenges completed

### Certificate Functions
- `mint(address to, uint256 tokenId)` - Mint certificate (only ProgressTracker or Migrator can call)
- `hasCertificate(address user, uint256 tokenId)` - Check if user owns a certificate
- `getCertificates(address user)` - Get all certificate token IDs owned by user
- `balanceOf(address owner)` - Get total number of certificates owned
- `ownerOf(uint256 tokenId)` - Get owner address of a specific token ID
- `tokenURI(uint256 tokenId)` - Get metadata URI for certificate
- `tokenOfOwnerByIndex(address owner, uint256 index)` - Get token ID by index (for enumerable)
- `name()` - Returns "Trident Challenge Certificates"
- `symbol()` - Returns "TCC"
- `supportsInterface(bytes4)` - ERC-165 interface detection (returns true for ERC-721)

### CertificateMigrator Contract
- **Contract Address**: `0xD6583C1dF7B63aeCc0F692746a08309f537666F0`
- **Network**: Polygon Amoy Testnet (Chain ID: 80002)
- **Owner**: `0x491dcF33ef2AFa81Fa9b711C81Ed156E6482365c`
- **Purpose**: Awards certificates retroactively to users who solved challenges before certificate system was deployed
- **Functions**:
  - `migrateUser(address user)` - Award certificates based on user's solved challenge count
  - `migrateMultipleUsers(address[] users)` - Batch migrate multiple users
- **How It Works**:
  1. Reads user's solved count from ProgressTracker
  2. Awards certificates for milestones reached (5, 10, 20 challenges)
  3. Prevents duplicate migrations (each user can only be migrated once)
- **Status**: ✅ Active

### NFT Import Information
To manually import your certificate NFT in MetaMask:
1. Open MetaMask → NFTs tab
2. Click "Import NFT"
3. Enter:
   - **Contract Address**: `0x836093bAB2DCa08a97567dBbF0c75eE9C6B305c9`
   - **Token ID**: `1` (for 5 challenges), `2` (for 10 challenges), or `3` (for 20 challenges)
4. Click "Import"

### View on Block Explorer
- **Polygonscan (Amoy)**: https://amoy.polygonscan.com/address/0x836093bAB2DCa08a97567dBbF0c75eE9C6B305c9
- **NFT Token Page**: https://amoy.polygonscan.com/nft/0x836093bAB2DCa08a97567dBbF0c75eE9C6B305c9/{tokenId}

### Deprecated Addresses (No Longer Used)
- **Old Certificate**: `0xdd9fEe80e98735108ca8db3258a32c463412Ff41` (Not ERC-721 compatible, replaced)
- **Old Migrator**: `0xBf4937fc4D4476903F693c998e761Ee4cAd75689` (Replaced with new migrator)


## ⚠️ MANDATORY PRICE STRUCTURE STANDARD

**ALL challenges MUST follow this price structure. This is a hard requirement for all future deployments.**

### Standard Initialization Cost
- **Maximum Initialization Cost**: `0.001 ether` (1,000,000,000,000,000 wei)
- **Standard Amount**: `0.001 ether` for challenges requiring ETH initialization
- **Zero Cost**: Challenges that don't require ETH initialization (template/implementation challenges)

### Price Structure Rules

1. **ETH-Requiring Challenges** (e.g., Challenge1, Challenge3):
   - `INIT_AMOUNT` constant MUST be `0.001 ether` or less
   - Any internal amounts (deposits, limits, etc.) MUST be `0.0005 ether` or less
   - Total ETH required for initialization MUST NOT exceed `0.001 ether`

2. **Template/Implementation Challenges** (e.g., Challenge2):
   - No ETH required for initialization
   - `initialize()` function should not be `payable` or should revert if ETH is sent

3. **Internal Amounts**:
   - If a challenge uses multiple internal amounts (e.g., deposits, limits), each MUST be `0.0005 ether` or less
   - Total of all internal amounts MUST NOT exceed `0.001 ether`

### Current Challenge Price Structure

| Challenge | Type | Initialization Cost | Internal Amounts | Status |
|-----------|------|-------------------|-----------------|--------|
| Challenge1 | ETH-Requiring | `0.001 ether` | 2x `0.0005 ether` deposits | ✅ Compliant |
| Challenge2 | Template | `0 ether` | N/A | ✅ Compliant |
| Challenge3 | ETH-Requiring | `0.001 ether` | `0.0005 ether` withdraw limit | ✅ Compliant |
| Challenge4 | ETH-Requiring | `0.001 ether` | 2x `0.0005 ether` deposits | ✅ Compliant |
| Challenge5 | ETH-Requiring | `0.001 ether` | `1e18` tokens minted to pool | ✅ Compliant |

### Enforcement

- **Deployment Scripts**: MUST use `0.001 ether` or less for initialization
- **Wrapper Contracts**: MUST define `INIT_AMOUNT` as `0.001 ether` or less
- **Test Files**: MUST use `0.001 ether` or less in test setup
- **Code Review**: Any challenge exceeding `0.001 ether` will be rejected

### Rationale

- Keeps deployment costs low and accessible
- Standardizes challenge economics across all challenges
- Prevents accidental high-cost deployments
- Ensures consistency in testnet environments

---

## Challenge Contracts

### Challenge1_Wrapper
- **Address**: `0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7`
- **Challenge ID**: 1
- **Status**: ✅ Solved
- **Purpose**: Wrapper contract implementing IChallenge interface
- **Initialization**: Requires `0.001 ether` (✅ Compliant with price structure)
- **Internal Amounts**: 2x `0.0005 ether` deposits
- **Key Functions**:
  - `initialize()` - Initialize with 0.001 ether
  - `isSolved()` - Returns true if bank balance is 0
  - `challengeId()` - Returns 1

### Challenge2_Wrapper
- **Address**: `0xf6aC18Cb090d27200Be3335cf6B7Bc9fCD6C35Ad`
- **Challenge ID**: 2
- **Status**: ✅ Deployed and Registered
- **Purpose**: Wrapper contract implementing IChallenge interface for Access Control challenge
- **Initialization**: No ETH required (✅ Compliant with price structure)
- **Internal Amounts**: N/A (template challenge)
- **Key Functions**:
  - `initialize()` - Initialize the challenge
  - `isSolved()` - Returns true if AccessControl is properly implemented
  - `challengeId()` - Returns 2

### Challenge3_Wrapper
- **Address**: `0xaF6B5f41D51AF63e5A10b106674Ef45A4AD762C8`
- **Challenge ID**: 3
- **Status**: ✅ Deployed, Registered, and Solved
- **Purpose**: Wrapper contract implementing IChallenge interface for Storage Misalignment challenge
- **Initialization**: Requires `0.001 ether` (✅ Compliant with price structure)
- **Internal Amounts**: `0.0005 ether` withdraw limit
- **Key Functions**:
  - `initialize()` - Initialize with 0.001 ether
  - `isSolved()` - Returns true if wallet balance is 0
  - `challengeId()` - Returns 3

### Challenge4_Wrapper
- **Address**: `0x739C920641e896aa48Fb1cDDbc4c1C6568a68Ca2`
- **Challenge ID**: 4
- **Status**: ✅ Deployed and Registered
- **Purpose**: Wrapper contract implementing IChallenge interface for Force Send ETH challenge
- **Initialization**: Requires `0.001 ether + 0.01 ether` total (✅ Compliant with price structure for user-facing costs)
  - `0.001 ether` for game initialization (2x `0.0005 ether` deposits)
  - `0.01 ether` held in wrapper for automatic exploit funding (one-time deployment cost, users don't pay this)
- **Internal Amounts**: 2x `0.0005 ether` deposits (Alice and Bob)
- **Key Functions**:
  - `initialize()` - Initialize with 0.001 ether + 0.01 ether total (0.001 for game + 0.01 for exploit funding)
  - `fundExploit(address)` - **CRITICAL**: Sends 0.01 ETH to exploit contract (users don't need to send ETH)
  - `isSolved()` - Returns true if game balance > 0.01 ether (game disabled)
  - `challengeId()` - Returns 4
- **⚠️ CRITICAL DESIGN PATTERN**: 
  - **Users DO NOT send ETH to solve this challenge**
  - Wrapper holds 0.01 ETH during initialization (one-time deployment cost)
  - Frontend automatically calls `fundExploit()` after deploying exploit
  - Exploit receives 0.01 ETH from wrapper, not from user
  - This matches the pattern of Challenge 1 and Challenge 3 (no user ETH required)
  - **Browser Tests**: Use Foundry's `deal()` cheatcode - NO real ETH needed ✅
  - Challenge descriptions mentioning ETH amounts (e.g., "7 ETH") are educational context only

### Challenge5_Wrapper
- **Address**: `0x4A585d850D9F5acAe550f81430bbc91631C0a58d`
- **Challenge ID**: 5
- **Status**: ✅ Deployed, Registered, and Solved
- **Purpose**: Wrapper contract implementing IChallenge interface for ERC20 Flash Loan challenge
- **Initialization**: Requires `0.001 ether` (✅ Compliant with price structure)
- **Internal Amounts**: `1e18` tokens minted to pool
- **Key Functions**:
  - `initialize()` - Initialize with 0.001 ether
  - `isSolved()` - Returns true if pool token balance is 0
  - `challengeId()` - Returns 5

### AccessControl
- **Address**: `0x0205EdE733Ff8A6cDF5B5BB47D916A35469ECe87`
- **Status**: ✅ Deployed
- **Purpose**: Access control contract for Challenge 2 (template challenge)
- **Deployed By**: Challenge2_Wrapper constructor
- **Key Functions**:
  - `grantRole()` - Grant role to account (ADMIN only)
  - `revokeRole()` - Revoke role from account (ADMIN only)
  - `roles()` - Check if account has role
  - `ADMIN()` - Admin role constant
  - `USER()` - User role constant

### UpgradeableWallet
- **Address**: `0x417b2968CaE7224714aF8E2bA2d0dd0fD726D40c`
- **Status**: ✅ Drained (balance: 0)
- **Purpose**: Vulnerable upgradeable wallet with storage collision vulnerability
- **Deployed By**: Challenge3_Wrapper constructor
- **Key Functions**:
  - `setImplementation()` - Set implementation address (owner only)
  - `fallback()` - Delegates calls to implementation

### WalletImplementation
- **Address**: Deployed by Challenge3_Wrapper
- **Status**: ✅ Deployed
- **Purpose**: Implementation contract for UpgradeableWallet
- **Deployed By**: Challenge3_Wrapper constructor
- **Key Functions**:
  - `setWithdrawLimit()` - Set withdraw limit (vulnerable to storage collision)
  - `withdraw()` - Withdraw ETH with limit check (owner only)

### EthBank
- **Address**: `0xe8AB294169D1Be61054e179c238B35Ad6FA3f1C2`
- **Status**: ✅ Drained (balance: 0)
- **Purpose**: Vulnerable bank contract with reentrancy vulnerability
- **Deployed By**: Challenge1_Wrapper constructor
- **Key Functions**:
  - `deposit()` - Deposit ETH
  - `withdraw()` - Withdraw ETH (vulnerable to reentrancy)

## Exploit Contracts

### EthBankExploit
- **Address**: `0x84093c4e2aCca245e446E8592a4587e5E80a5721`
- **Purpose**: Exploits the reentrancy vulnerability in EthBank
- **Target**: `0xe8AB294169D1Be61054e179c238B35Ad6FA3f1C2`
- **Status**: ✅ Executed successfully
- **Key Functions**:
  - `pwn()` - Main exploit function
  - `receive()` - Reentrancy callback

### UpgradeableWalletExploit
- **Address**: `0x02AaBE2036851f3E52E5a2D6E48349C289a64A0e`
- **Purpose**: Exploits the storage collision vulnerability in UpgradeableWallet
- **Target**: `0x417b2968CaE7224714aF8E2bA2d0dd0fD726D40c`
- **Status**: ✅ Executed successfully
- **Key Functions**:
  - `pwn()` - Main exploit function
  - `malicious` - Malicious implementation contract

### SevenEth
- **Address**: `0x75D11abC8c00628c04768eF03Cc2E50A208Ed54B`
- **Status**: ✅ Deployed
- **Purpose**: Vulnerable game contract with force send vulnerability
- **Deployed By**: Challenge4_Wrapper constructor
- **Key Functions**:
  - `play()` - Deposit 0.0005 ether to play (scaled down from 1 ether for price structure)
  - Game is disabled when balance > 0.01 ether (scaled down from 7 ether for educational purposes)

### SevenEthExploit
- **Address**: Deployed by users (example: `0xf5Ec9BAB2AD5ceEe106319Ecc8508107435c1798`)
- **Purpose**: Exploits the force send vulnerability in SevenEth
- **Target**: SevenEth contract address (`0x75D11abC8c00628c04768eF03Cc2E50A208Ed54B`)
- **Status**: ✅ Pattern established, users deploy their own
- **Key Functions**:
  - `receive() external payable {}` - **REQUIRED**: Receives ETH from wrapper's `fundExploit()` call
  - `pwn()` - Force sends ETH via selfdestruct to disable game (uses ETH received from wrapper)
- **⚠️ IMPORTANT**: The exploit contract MUST include a `receive()` function to receive ETH from the wrapper's `fundExploit()` call. Without it, the funding transaction will revert.

### LendingPool
- **Address**: `0x0D2D98D17fE96B2a24c9f4Fe9DE6b53d5671267A`
- **Status**: ✅ Drained (token balance: 0)
- **Purpose**: Vulnerable lending pool with flash loan vulnerability
- **Deployed By**: Challenge5_Wrapper constructor
- **Key Functions**:
  - `flashLoan()` - Provides flash loans (vulnerable to approval manipulation)
  - `token()` - Returns the ERC20 token address

### FlashLoanToken
- **Address**: `0xaD1c29bd0a38E82CaD8d85e3B08bF0F28112457b`
- **Status**: ✅ Deployed
- **Purpose**: ERC20 token for Challenge 5
- **Deployed By**: Challenge5_Wrapper constructor
- **Key Functions**:
  - `mint()` - Mint tokens
  - `transfer()` - Transfer tokens
  - `transferFrom()` - Transfer tokens from another address
  - `approve()` - Approve spender

### LendingPoolExploit
- **Address**: `0xdd48261140531B7fD3C93Ed03A7e06Cf27fACD4e`
- **Purpose**: Exploits the flash loan vulnerability in LendingPool
- **Target**: `0x0D2D98D17fE96B2a24c9f4Fe9DE6b53d5671267A`
- **Status**: ✅ Executed successfully
- **Key Functions**:
  - `pwn()` - Main exploit function that uses flashLoan to approve and drain tokens

## Account Information

### Deployer/Owner
- **Address**: `0x491dcF33ef2AFa81Fa9b711C81Ed156E6482365c`
- **Role**: Factory owner, Challenge deployer

## Contract Relationships

```
Deployer (0x491dcF33...)
    │
    ├── Deploys → Certificate (0x836093bA...) [ERC-721 NFT]
    │                   │
    │                   ├── setMigrator → CertificateMigrator address
    │                   └── ERC-721 compatible for MetaMask
    │
    ├── Deploys → CertificateMigrator (0xD6583C1d...)
    │                   │
    │                   ├── certificate → Certificate address
    │                   └── oldProgressTracker → ProgressTracker address
    │
    ├── Deploys → ChallengeFactory (0xdB51e446...)
    │                   │
    │                   ├── Constructor → ProgressTracker (0x2B85A780...)
    │                   │                   │
    │                   │                   ├── factory = ChallengeFactory address
    │                   │                   └── certificate = Certificate address
    │                   │
    │                   ├── challengeAddresses[1] = Challenge1_Wrapper
    │                   ├── challengeAddresses[2] = Challenge2_Wrapper
    │                   ├── challengeAddresses[3] = Challenge3_Wrapper
    │                   ├── challengeAddresses[4] = Challenge4_Wrapper (0x739C9206...)
    │                   └── challengeAddresses[5] = Challenge5_Wrapper (0x4A585d85...)
    │
    ├── Deploys → Challenge1_Wrapper (0x151868cF...)
    │                   │
    │                   └── Constructor → EthBank (0xe8AB2941...)
    │
    ├── Deploys → Challenge2_Wrapper (0xf6aC18Cb...)
    │                   │
    │                   └── Constructor → AccessControl (0x0205EdE7...)
    │
    ├── Deploys → Challenge3_Wrapper (0xaF6B5f41...)
    │                   │
    │                   ├── Constructor → UpgradeableWallet (0x417b2968...)
    │                   └── Constructor → WalletImplementation
    │
    ├── Deploys → Challenge4_Wrapper (0x739C9206...)
    │                   │
    │                   └── Constructor → SevenEth (0x75D11abC...)
    │
    ├── Deploys → Challenge5_Wrapper (0x4A585d85...)
    │                   │
    │                   ├── Constructor → LendingPool (0x0D2D98D1...)
    │                   └── Constructor → FlashLoanToken (0xaD1c29bd...)
    │
    ├── Deploys → EthBankExploit (0x84093c4e...)
    │                   │
    │                   └── Targets → EthBank (0xe8AB2941...)
    │
    ├── Deploys → UpgradeableWalletExploit (0x02AaBE20...)
    │                   │
    │                   └── Targets → UpgradeableWallet (0x417b2968...)
    │
    ├── Deploys → LendingPoolExploit (0xdd482611...)
    │                   │
    │                   └── Targets → LendingPool (0x0D2D98D1...)
    │
    └── Users Deploy → SevenEthExploit (TBD)
                        │
                        └── Targets → SevenEth
```

## Verification Flow

### Challenge 1
1. User solves challenge by deploying and executing exploit
2. Challenge1_Wrapper.isSolved() returns true (bank balance = 0)
3. User calls ChallengeFactory.verifyAndRecord(userAddress, 1)
4. Factory checks:
   - Challenge is registered ✓
   - Challenge.isSolved() returns true ✓
5. Factory calls ProgressTracker.recordSolution(userAddress, 1)
6. ProgressTracker records the solution
7. Verification complete ✅

### Challenge 2
1. User implements AccessControl contract correctly
2. Challenge2_Wrapper.isSolved() returns true (AccessControl properly implemented)
3. User calls ChallengeFactory.verifyAndRecord(userAddress, 2)
4. Factory checks:
   - Challenge is registered ✓
   - Challenge.isSolved() returns true ✓
5. Factory calls ProgressTracker.recordSolution(userAddress, 2)
6. ProgressTracker records the solution
7. Verification complete ✅

### Challenge 3
1. User deploys exploit contract and executes pwn() function
2. Challenge3_Wrapper.isSolved() returns true (wallet balance = 0)
3. User calls ChallengeFactory.verifyAndRecord(userAddress, 3)
4. Factory checks:
   - Challenge is registered ✓
   - Challenge.isSolved() returns true ✓
5. Factory calls ProgressTracker.recordSolution(userAddress, 3)
6. ProgressTracker records the solution
7. Verification complete ✅

### Challenge 5
1. User deploys exploit contract and executes pwn() function
2. Challenge5_Wrapper.isSolved() returns true (pool token balance = 0)
3. User calls ChallengeFactory.verifyAndRecord(userAddress, 5)
4. Factory checks:
   - Challenge is registered ✓
   - Challenge.isSolved() returns true ✓
5. Factory calls ProgressTracker.recordSolution(userAddress, 5)
6. ProgressTracker records the solution
7. **Certificate Check**: If user reached milestone (5, 10, 20 challenges), Certificate is automatically minted
8. Verification complete ✅

### Certificate Awarding Flow
When a user verifies a challenge solution:
1. `ProgressTracker.recordSolution()` is called by Factory
2. User's solved count is incremented
3. If new count matches a milestone (5, 10, or 20 challenges):
   - Certificate is automatically minted via `CertificateMigrator`
   - Soulbound NFT is minted to user's wallet
   - `CertificateMinted` event is emitted
4. Certificates are non-transferable (Soulbound Tokens)

**Note**: For users who solved challenges before certificate deployment, use `CertificateMigrator.migrateUser(address)` to award certificates retroactively.

### Challenge 4
1. User deploys exploit contract (targeting game address)
2. **Frontend automatically calls `wrapper.fundExploit(exploitAddress)`** - sends 0.01 ETH from wrapper to exploit
3. User executes `pwn()` function (NO ETH needed from user - exploit already funded)
4. Exploit force sends 0.01 ETH via selfdestruct to SevenEth game
5. Challenge4_Wrapper.isSolved() returns true (game balance > 0.01 ether, game disabled)
6. User calls ChallengeFactory.verifyAndRecord(userAddress, 4)
7. Factory checks:
   - Challenge is registered ✓
   - Challenge.isSolved() returns true ✓
8. Factory calls ProgressTracker.recordSolution(userAddress, 4)
9. ProgressTracker records the solution
10. Verification complete ✅

## Configuration Files

### Frontend Config
- File: `frontend/src/config/contracts.js`
- CHALLENGE_FACTORY: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`
- PROGRESS_TRACKER: `0x2B85A7801d11397DfCF28539841da379803E6da7`
- CERTIFICATE: `0x836093bAB2DCa08a97567dBbF0c75eE9C6B305c9` (ERC-721 NFT Contract)
- DEPLOYED_CHALLENGES[1]: `0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7`
- DEPLOYED_CHALLENGES[2]: `0xf6aC18Cb090d27200Be3335cf6B7Bc9fCD6C35Ad`
- DEPLOYED_CHALLENGES[3]: `0xaF6B5f41D51AF63e5A10b106674Ef45A4AD762C8`
- DEPLOYED_CHALLENGES[4]: `0x739C920641e896aa48Fb1cDDbc4c1C6568a68Ca2`
- DEPLOYED_CHALLENGES[5]: `0x4A585d850D9F5acAe550f81430bbc91631C0a58d`

### Backend Config
- File: `backend/config/index.js`
- POLYGON_AMOY_CHALLENGE_FACTORY_ADDRESS: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`
- POLYGON_AMOY_PROGRESS_TRACKER_ADDRESS: `0x2B85A7801d11397DfCF28539841da379803E6da7`

### Backend .env
- POLYGON_AMOY_CHALLENGE_FACTORY_ADDRESS: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`

## Deployment Order

1. **Certificate** - Deployed first (no dependencies)
2. **ProgressTracker** - Deployed with factory address (computed) and Certificate address
3. **ChallengeFactory** - Deployed with ProgressTracker address
4. **Certificate.setProgressTracker()** - Called to link Certificate to ProgressTracker
3. **Challenge1_Wrapper** - Deployed and initialized with `0.001 ether` (✅ Price structure compliant)
4. **EthBankExploit** - Deployed and executed to solve challenge
5. **Registration** - Challenge1_Wrapper registered with factory
6. **Challenge2_Wrapper** - Deployed and initialized (✅ Price structure compliant - no ETH required)
7. **Registration** - Challenge2_Wrapper registered with factory
8. **Challenge3_Wrapper** - Deployed and initialized with `0.001 ether` (✅ Price structure compliant)
9. **Registration** - Challenge3_Wrapper registered with factory
10. **UpgradeableWalletExploit** - Deployed and executed to solve challenge
11. **Challenge4_Wrapper** - Deployed and initialized with `0.001 ether + 0.01 ether` total:
    - `0.001 ether` for game initialization (✅ Price structure compliant for user-facing costs)
    - `0.01 ether` held in wrapper for automatic exploit funding (one-time deployment cost, users don't pay this)
12. **Registration** - Challenge4_Wrapper registered with factory
13. **Challenge5_Wrapper** - Deployed and initialized with `0.001 ether` (✅ Price structure compliant)
14. **Registration** - Challenge5_Wrapper registered with factory
15. **LendingPoolExploit** - Deployed and executed to solve challenge

## Notes

### Price Structure Compliance
- ✅ **Challenge1**: Uses `0.001 ether` for initialization (2x `0.0005 ether` deposits) - COMPLIANT
- ✅ **Challenge2**: No ETH required (template challenge) - COMPLIANT
- ✅ **Challenge3**: Uses `0.001 ether` for initialization (`0.0005 ether` withdraw limit) - COMPLIANT
- ✅ **Challenge4**: Uses `0.001 ether` for game initialization (2x `0.0005 ether` deposits) - COMPLIANT
  - **Note**: Wrapper holds additional `0.01 ether` for exploit funding, but users don't pay this
  - Users solve challenge with ZERO ETH cost (wrapper funds exploit automatically)
- **ALL future challenges MUST follow the `0.001 ether` maximum initialization cost standard**
- **CRITICAL**: Challenges should NOT require users to send ETH to solve them. If exploit needs ETH, wrapper should fund it automatically.

### Challenge Status
- Challenge1 is fully solved and verified
- Challenge2 is deployed and registered with factory
- Challenge2 is a template challenge (users implement AccessControl contract)
- Challenge3 is fully deployed, registered, and solved

### System Architecture
- Factory owner has full control over challenge registration
- ProgressTracker only accepts calls from the factory contract
- All challenges are registered in ChallengeFactory.challengeAddresses mapping
- All challenges implement the IChallenge interface for consistent verification

## ⚠️ CRITICAL DESIGN PRINCIPLE: NO USER ETH REQUIRED

**ALL challenges must be solvable WITHOUT requiring users to send ETH.**

### Design Pattern
- **Challenge 1**: Exploit uses ETH already in the bank (from initialization)
- **Challenge 2**: Template challenge, no ETH needed
- **Challenge 3**: Exploit manipulates storage, no ETH needed
- **Challenge 4**: Wrapper holds 0.01 ETH and automatically funds exploit via `fundExploit()` function

### Challenge 4 Implementation Details
- **Wrapper Initialization**: Requires `0.001 ether + 0.01 ether` total
  - `0.001 ether` for game setup (user-facing cost, compliant with price structure)
  - `0.01 ether` held in wrapper for exploit funding (one-time deployment cost)
- **User Flow**:
  1. User deploys exploit contract (no ETH needed)
  2. Frontend automatically calls `wrapper.fundExploit(exploitAddress)` 
  3. Wrapper sends 0.01 ETH to exploit contract
  4. User executes `pwn()` (no ETH needed - exploit already funded)
  5. Exploit selfdestructs with 0.01 ETH to game contract
  6. Challenge solved ✅
- **⚠️ IMPORTANT**: Challenge descriptions may mention ETH amounts (e.g., "10 ETH will be sent to pwn") - these are **educational context only**. 
  - **Browser Tests**: Use Foundry's `deal()` cheatcode to simulate ETH (no real ETH needed)
  - **On-Chain**: Wrapper automatically funds exploits (users don't send ETH)
  - **Users NEVER need real ETH or testnet ETH to solve challenges**

### Enforcement
- **Frontend**: Automatically calls funding functions after exploit deployment
- **Wrapper Contracts**: Must provide funding mechanism if exploit needs ETH
- **User Experience**: Users should NEVER need to send ETH to solve challenges
- **Deployment**: One-time cost to deploy wrapper with funding (acceptable)
- **Solving**: Zero cost to users (required)

