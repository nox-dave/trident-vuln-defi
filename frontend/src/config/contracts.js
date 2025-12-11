export const CONTRACT_ADDRESSES = {
  CHALLENGE_FACTORY: '0x2E0a2434cccE6f1Cb4267f1E0aFb88DA51F93124',
  PROGRESS_TRACKER: '0x3C5E3Fc7622E0932c697e80b213b54EB7E7A4Eae',
}

export const CHALLENGES = [
  {
    id: 1,
    name: 'Vault Reentrancy',
    description: 'Exploit reentrancy vulnerability',
    difficulty: 'Easy',
    ascii: '╔═══╗\n║ $ ║\n╚═╬═╝\n║\n╔═╬═╗\n║ $ ║\n╚═══╝',
  },
  {
    id: 2,
    name: 'Access Control',
    description: 'Exploit tx.origin authentication flaw',
    difficulty: 'Easy',
    ascii: '───┬───\n│\n───┼───\n│\n───▼───',
  },
  {
    id: 3,
    name: 'Token Overflow',
    description: 'Exploit integer overflow vulnerability',
    difficulty: 'Medium',
    ascii: '┌─────┐\n│99999│\n└──┬──┘\n▼\n┌──┬──┐\n│00000│\n└─────┘',
  },
  {
    id: 4,
    name: 'Lottery Randomness',
    description: 'Manipulate block.timestamp randomness',
    difficulty: 'Medium',
    ascii: '┌─┬─┬─┐\n│?│?│?│\n└─┴─┴─┘\n▼\n┌─┬─┬─┐\n│7│7│7│\n└─┴─┴─┘',
  },
  {
    id: 5,
    name: 'Proxy Delegatecall',
    description: 'Exploit delegatecall context preservation',
    difficulty: 'Hard',
    ascii: '┌───┐\n        │ A │──►┌───┐\n        └───┘   │ B │\n                └─┬─┘\n                ▼\n                ┌───┐\n                │ A │\n                └───┘',
  },
]
