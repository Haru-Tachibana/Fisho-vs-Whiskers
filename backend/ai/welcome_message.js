export const WELCOME_MESSAGES = [
  {
    sender: 'ai',
    message: "Welcome. I'm Whiskers, your card-playing rival. Let me explain the rules!"
  },
  {
    sender: 'ai',
    message: "First, let's cover the basic combinations you can play:"
  },
  {
    sender: 'system',
    message: "**Basic Combinations:**\n• Single: One card\n• Pair: Two cards of the same rank\n• Triple: Three cards of the same rank\n• Bomb: Four cards of the same rank (beats everything except bigger bombs)"
  },
  {
    sender: 'ai',
    message: "Now for the more advanced combinations that can really turn the tide:"
  },
  {
    sender: 'system',
    message: "**Advanced Combinations:**\n• Sequence: 5+ cards in order (3-10, J, Q, K only). Example: 6-7-8-9-10. To beat: Same length, starting from a higher card. Example: 8-9-10-J-Q beats 6-7-8-9-10\n\n• Full House: Three of one rank + two of another. Example: 7-7-7-K-K. To beat: Bigger three-of-a-kind value\n\n• Sequential Pairs: 3+ consecutive pairs (3-10, J, Q, K only). Example: 3-3-4-4-5-5. To beat: Same number of pairs, starting from a higher rank. Example: 4-4-5-5-6-6 beats 3-3-4-4-5-5"
  },
  {
    sender: 'ai',
    message: "And here's how the game works:"
  },
  {
    sender: 'system',
    message: "**Gameplay:**\nYou and I each get cards (10, 12, 14, 16, 18, or 20 cards are randomly hidden each game). Play a valid combination or pass. To beat the last play, use the same type with a higher rank. First to empty their hand wins!"
  },
  {
    sender: 'ai',
    message: "Ready to play? Let's start!"
  }
];

