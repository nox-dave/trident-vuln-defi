export const CONTRACT_ADDRESSES = {
  CHALLENGE_FACTORY: '',
  PROGRESS_TRACKER: '',
}

export const CHALLENGES = [
  {
    id: 1,
    name: 'Vault Reentrancy',
    description: 'Exploit reentrancy vulnerability',
    difficulty: 'Easy',
  },
  {
    id: 2,
    name: 'Access Control',
    description: 'Exploit tx.origin authentication flaw',
    difficulty: 'Easy',
  },
  {
    id: 3,
    name: 'Token Overflow',
    description: 'Exploit integer overflow vulnerability',
    difficulty: 'Medium',
  },
  {
    id: 4,
    name: 'Lottery Randomness',
    description: 'Manipulate block.timestamp randomness',
    difficulty: 'Medium',
  },
  {
    id: 5,
    name: 'Proxy Delegatecall',
    description: 'Exploit delegatecall context preservation',
    difficulty: 'Hard',
  },
]

