# Deployed Contracts - Challenge1_Vault

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

## Challenge Contracts

### Challenge1_Wrapper
- **Address**: `0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7`
- **Challenge ID**: 1
- **Status**: ✅ Solved
- **Purpose**: Wrapper contract implementing IChallenge interface
- **Initialization**: Requires 0.001 ether
- **Key Functions**:
  - `initialize()` - Initialize with 0.001 ether
  - `isSolved()` - Returns true if bank balance is 0
  - `challengeId()` - Returns 1

### EthBank
- **Address**: `0xe8AB294169D1Be61054e179c238B35Ad6FA3f1C2`
- **Status**: ✅ Drained (balance: 0)
- **Purpose**: Vulnerable bank contract with reentrancy vulnerability
- **Deployed By**: Challenge1_Wrapper constructor
- **Key Functions**:
  - `deposit()` - Deposit ETH
  - `withdraw()` - Withdraw ETH (vulnerable to reentrancy)

## Exploit Contract

### EthBankExploit
- **Address**: `0x84093c4e2aCca245e446E8592a4587e5E80a5721`
- **Purpose**: Exploits the reentrancy vulnerability in EthBank
- **Target**: `0xe8AB294169D1Be61054e179c238B35Ad6FA3f1C2`
- **Status**: ✅ Executed successfully
- **Key Functions**:
  - `pwn()` - Main exploit function
  - `receive()` - Reentrancy callback

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
    │                   └── challengeAddresses[1] = Challenge1_Wrapper
    │
    ├── Deploys → Challenge1_Wrapper (0x151868cF...)
    │                   │
    │                   └── Constructor → EthBank (0xe8AB2941...)
    │
    └── Deploys → EthBankExploit (0x84093c4e...)
                        │
                        └── Targets → EthBank (0xe8AB2941...)
```

## Verification Flow

1. User solves challenge by deploying and executing exploit
2. Challenge1_Wrapper.isSolved() returns true (bank balance = 0)
3. User calls ChallengeFactory.verifyAndRecord(userAddress, 1)
4. Factory checks:
   - Challenge is registered ✓
   - Challenge.isSolved() returns true ✓
5. Factory calls ProgressTracker.recordSolution(userAddress, 1)
6. ProgressTracker records the solution
7. Verification complete ✅

## Configuration Files

### Frontend Config
- File: `frontend/src/config/contracts.js`
- CHALLENGE_FACTORY: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`
- PROGRESS_TRACKER: `0x2B85A7801d11397DfCF28539841da379803E6da7`
- DEPLOYED_CHALLENGES[1]: `0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7`

### Backend Config
- File: `backend/config/index.js`
- POLYGON_AMOY_CHALLENGE_FACTORY_ADDRESS: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`
- POLYGON_AMOY_PROGRESS_TRACKER_ADDRESS: `0x2B85A7801d11397DfCF28539841da379803E6da7`

### Backend .env
- POLYGON_AMOY_CHALLENGE_FACTORY_ADDRESS: `0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66`

## Deployment Order

1. **ProgressTracker** - Deployed with factory address in constructor
2. **ChallengeFactory** - Deployed with ProgressTracker address
3. **Challenge1_Wrapper** - Deployed and initialized with 0.001 ether
4. **EthBankExploit** - Deployed and executed to solve challenge
5. **Registration** - Challenge1_Wrapper registered with factory

## Notes

- All contracts use 0.001 ether for Challenge1
- Challenge1 is fully solved and verified
- Factory owner has full control over challenge registration
- ProgressTracker only accepts calls from the factory contract

