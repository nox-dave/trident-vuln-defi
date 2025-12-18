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
- **Key Functions**:
  - `recordSolution()` - Records solution (only callable by factory)
  - `hasSolved()` - Check if user solved a challenge
  - `getSolvedCount()` - Get total solved challenges for a user

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

## Account Information

### Deployer/Owner
- **Address**: `0x491dcF33ef2AFa81Fa9b711C81Ed156E6482365c`
- **Role**: Factory owner, Challenge deployer

## Contract Relationships

```
Deployer (0x491dcF33...)
    │
    ├── Deploys → ChallengeFactory (0xdB51e446...)
    │                   │
    │                   ├── Constructor → ProgressTracker (0x2B85A780...)
    │                   │                   │
    │                   │                   └── factory = ChallengeFactory address
    │                   │
    │                   ├── challengeAddresses[1] = Challenge1_Wrapper
    │                   ├── challengeAddresses[2] = Challenge2_Wrapper
    │                   └── challengeAddresses[3] = Challenge3_Wrapper (TBD)
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
    ├── Deploys → EthBankExploit (0x84093c4e...)
    │                   │
    │                   └── Targets → EthBank (0xe8AB2941...)
    │
    └── Deploys → UpgradeableWalletExploit (0x02AaBE20...)
                        │
                        └── Targets → UpgradeableWallet (0x417b2968...)
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

## Configuration Files

### Frontend Config
- File: `frontend/src/config/contracts.js`
- CHALLENGE_FACTORY: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`
- PROGRESS_TRACKER: `0x2B85A7801d11397DfCF28539841da379803E6da7`
- DEPLOYED_CHALLENGES[1]: `0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7`
- DEPLOYED_CHALLENGES[2]: `0xf6aC18Cb090d27200Be3335cf6B7Bc9fCD6C35Ad`
- DEPLOYED_CHALLENGES[3]: `0xaF6B5f41D51AF63e5A10b106674Ef45A4AD762C8`

### Backend Config
- File: `backend/config/index.js`
- POLYGON_AMOY_CHALLENGE_FACTORY_ADDRESS: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`
- POLYGON_AMOY_PROGRESS_TRACKER_ADDRESS: `0x2B85A7801d11397DfCF28539841da379803E6da7`

### Backend .env
- POLYGON_AMOY_CHALLENGE_FACTORY_ADDRESS: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`

## Deployment Order

1. **ProgressTracker** - Deployed with factory address in constructor
2. **ChallengeFactory** - Deployed with ProgressTracker address
3. **Challenge1_Wrapper** - Deployed and initialized with `0.001 ether` (✅ Price structure compliant)
4. **EthBankExploit** - Deployed and executed to solve challenge
5. **Registration** - Challenge1_Wrapper registered with factory
6. **Challenge2_Wrapper** - Deployed and initialized (✅ Price structure compliant - no ETH required)
7. **Registration** - Challenge2_Wrapper registered with factory
8. **Challenge3_Wrapper** - Deployed and initialized with `0.001 ether` (✅ Price structure compliant)
9. **Registration** - Challenge3_Wrapper registered with factory
10. **UpgradeableWalletExploit** - Deployed and executed to solve challenge

## Notes

### Price Structure Compliance
- ✅ **Challenge1**: Uses `0.001 ether` for initialization (2x `0.0005 ether` deposits) - COMPLIANT
- ✅ **Challenge2**: No ETH required (template challenge) - COMPLIANT
- ✅ **Challenge3**: Uses `0.001 ether` for initialization (`0.0005 ether` withdraw limit) - COMPLIANT
- **ALL future challenges MUST follow the `0.001 ether` maximum initialization cost standard**

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

