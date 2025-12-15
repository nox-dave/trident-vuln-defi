# Contract Architecture Diagram

## Challenge1_Vault System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         DEPLOYER                                 │
│           0x491dcF33ef2AFa81Fa9b711C81Ed156E6482365c             │
│                    (Factory Owner)                               │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │ Deploys & Owns
                            │
        ┌───────────────────┴───────────────────┐
        │                                         │
        ▼                                         ▼
┌──────────────────────┐              ┌──────────────────────┐
│  ChallengeFactory    │              │  Challenge1_Wrapper   │
│  0xdB51e44657D5...   │              │  0x151868cFA58C4...  │
│                      │              │                      │
│  - owner             │              │  - bank (EthBank)    │
│  - progressTracker   │              │  - initialized       │
│  - challengeAddresses│              │  - isSolved() ✓      │
└──────────┬───────────┘              └──────────┬───────────┘
           │                                     │
           │ References                          │ Creates
           │                                     │
           │                                     ▼
           │                            ┌──────────────────────┐
           │                            │      EthBank          │
           │                            │  0xe8AB294169D1...   │
           │                            │                      │
           │                            │  - balances          │
           │                            │  - balance: 0 ✓     │
           │                            └──────────┬───────────┘
           │                                       │
           │                                       │ Targeted by
           │                                       │
           │                                       ▼
           │                            ┌──────────────────────┐
           │                            │   EthBankExploit     │
           │                            │  0x84093c4e2aCc...   │
           │                            │                      │
           │                            │  - bank (EthBank)    │
           │                            │  - pwn() executed ✓  │
           │                            └──────────────────────┘
           │
           │ Uses
           │
           ▼
┌──────────────────────┐
│  ProgressTracker     │
│  0x2B85A7801d11...   │
│                      │
│  - factory           │
│  - solved[user][id]   │
└──────────────────────┘
```

## Data Flow: Verification Process

```
User (0x491dcF33...)
    │
    │ 1. Calls verifyAndRecord(userAddress, 1)
    │
    ▼
┌──────────────────────┐
│  ChallengeFactory    │
│  verifyAndRecord()   │
└──────────┬───────────┘
           │
           │ 2. Checks challengeAddresses[1]
           │    → 0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7
           │
           │ 3. Calls challenge.isSolved()
           │
           ▼
┌──────────────────────┐
│  Challenge1_Wrapper  │
│  isSolved()          │
└──────────┬───────────┘
           │
           │ 4. Checks bank.balance == 0
           │    → Returns true ✓
           │
           ▼
┌──────────────────────┐
│  ChallengeFactory    │
│  (continues)         │
└──────────┬───────────┘
           │
           │ 5. Calls progressTracker.recordSolution()
           │
           ▼
┌──────────────────────┐
│  ProgressTracker     │
│  recordSolution()    │
│                      │
│  - Verifies          │
│    msg.sender ==     │
│    factory ✓         │
│                      │
│  - Records           │
│    solved[user][1]   │
│    = true            │
└──────────────────────┘
```

## Ownership & Access Control

```
┌─────────────────────────────────────────────────────────────┐
│                    OWNERSHIP CHAIN                           │
└─────────────────────────────────────────────────────────────┘

Deployer (0x491dcF33...)
    │
    │ Owner of
    │
    ▼
ChallengeFactory
    │
    │ Only factory can call
    │
    ▼
ProgressTracker.recordSolution()
    │
    │ Only factory can verify
    │
    ▼
Challenge1_Wrapper.isSolved()
```

## Challenge Registration Flow

```
┌─────────────────────────────────────────────────────────────┐
│              CHALLENGE REGISTRATION                          │
└─────────────────────────────────────────────────────────────┘

1. Deploy Challenge1_Wrapper
   └─> 0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7

2. Initialize with 0.001 ether
   └─> Creates EthBank internally
       └─> 0xe8AB294169D1Be61054e179c238B35Ad6FA3f1C2

3. Deploy & Execute Exploit
   └─> 0x84093c4e2aCca245e446E8592a4587e5E80a5721
   └─> Drains EthBank (balance → 0)
   └─> Challenge isSolved() → true

4. Register with Factory (Owner only)
   ChallengeFactory.updateChallengeAddress(1, 0x151868cF...)
   └─> challengeAddresses[1] = 0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7

5. Ready for Verification ✓
```

## Contract Dependencies

```
ChallengeFactory
    ├── depends on → ProgressTracker
    │                  └── factory = ChallengeFactory address
    │
    └── manages → challengeAddresses mapping
                      └── [1] → Challenge1_Wrapper
                                    └── contains → EthBank
                                                      └── exploited by → EthBankExploit
```

## Key Relationships Summary

1. **ChallengeFactory** ↔ **ProgressTracker**: Factory calls ProgressTracker to record solutions
2. **ChallengeFactory** ↔ **Challenge1_Wrapper**: Factory verifies challenge status
3. **Challenge1_Wrapper** ↔ **EthBank**: Wrapper creates and manages EthBank
4. **EthBankExploit** ↔ **EthBank**: Exploit drains the bank
5. **Deployer** → **All Contracts**: Deployer owns factory and deployed all contracts

