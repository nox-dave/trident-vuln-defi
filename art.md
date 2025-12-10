CHALLENGE 1 - Vault Reentrancy
╔═══╗
║ $ ║
╚═╬═╝
  ║
╔═╬═╗
║ $ ║
╚═══╝
CHALLENGE 2 - Access Control
───┬───
   │
───┼───
   │
───▼───
CHALLENGE 3 - Token Overflow
┌─────┐
│99999│
└──┬──┘
   ▼
┌──┬──┐
│00000│
└─────┘
CHALLENGE 4 - Lottery Randomness
┌─┬─┬─┐
│?│?│?│
└─┴─┴─┘
   ▼
┌─┬─┬─┐
│7│7│7│
└─┴─┴─┘
CHALLENGE 5 - Proxy Delegatecall
┌───┐
│ A │──►┌───┐
└───┘   │ B │
        └─┬─┘
          ▼
        ┌───┐
        │ A │
        └───┘
Each symbol captures the essence of the vulnerability - reentrancy's loop-back, access