import { askModel } from './llm_adapter.js';

const FALLBACK_MESSAGES = [
  "Let's see how you handle this!",
  "Here we go!",
  "Take that!",
  "Your move!",
  "Let's do this!"
];

export async function generatePlayerMessage(cards) {
  if (!cards || cards.length === 0) {
    return null;
  }

  const cardNames = cards.map(c => `${c.rank}${c.suit || ''}`).join(', ');
  const isBomb = cards.length === 4;
  const isTriple = cards.length === 3;
  const isPair = cards.length === 2;
  
  let prompt = '';
  
  if (isBomb) {
    prompt = `You're a confident card player. You just played a BOMB (four of a kind: ${cardNames}). Respond with a short, confident comment in UK English (1-2 sentences). Be assertive but not overly aggressive.`;
  } else if (isTriple) {
    prompt = `You're playing cards. You just played three of a kind (${cardNames}). Respond with a short, casual comment in UK English (1 sentence).`;
  } else if (isPair) {
    prompt = `You're playing cards. You just played a pair (${cardNames}). Respond with a short, casual comment in UK English (1 sentence).`;
  } else {
    prompt = `You're playing cards. You just played a single card (${cardNames}). Respond with a short, casual comment in UK English (1 sentence).`;
  }

  try {
    const response = await askModel(prompt);
    if (response && response.length > 5) {
      return response;
    }
  } catch (error) {
    console.error('Error generating player message:', error);
  }

  return FALLBACK_MESSAGES[Math.floor(Math.random() * FALLBACK_MESSAGES.length)];
}

