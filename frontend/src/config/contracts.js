export const CONTRACT_ADDRESSES = {
  CHALLENGE_FACTORY: '0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66',
  PROGRESS_TRACKER: '0x2B85A7801d11397DfCF28539841da379803E6da7',
}

export const DEPLOYED_CHALLENGES = {
  1: '0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7',
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
    name: 'Misaligned Storage',
    description: 'Exploit upgradeable wallet storage misalignment',
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
