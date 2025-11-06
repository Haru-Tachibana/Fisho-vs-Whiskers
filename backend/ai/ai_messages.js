import { askModel } from './llm_adapter.js';

const FALLBACK_MESSAGES = {
  playCards: [
    "Right then, let's see what I've got here...",
    "Alright, time to show you how it's done!",
    "Here we go, watch this carefully!",
    "My turn now, prepare yourself!"
  ],
  pass: [
    "Hmm, I'll pass on this one, let you have a go!",
    "Not this time, I'll let you lead for a bit!",
    "I'll skip this round, your turn to shine!"
  ],
  beatPlayer: [
    "Ha! Got you there, didn't I? That's how it's done!",
    "Brilliant! I've got you beat this round, mate!",
    "Oh yes, I've got something better than that!"
  ],
  useBomb: [
    "BOOM! Four of a kind, that's what I call a proper bomb!",
    "Right, here's my ace in the hole - four of a kind!",
    "Watch this, I'm dropping the big one - BOMB!"
  ],
  nearWin: [
    "Almost there! Just a few more cards and victory is mine!",
    "I can taste victory now, just need to finish this off!",
    "Nearly done, this is looking rather promising for me!"
  ],
  playerBeat: [
    "Oh, that's a good one! I'll remember that move!",
    "Not bad at all, you're getting the hang of this!",
    "Fair play, that was a clever move there!"
  ],
  gameStart: [
    "Right, let's get this game started then!",
    "Here we go, time for a proper game of cards!",
    "Brilliant, I'm ready when you are!"
  ],
  aiWin: [
    "Victory is mine! That was a brilliant game, well played!",
    "I've done it! What a fantastic game that was!",
    "I've won! That was rather enjoyable, wasn't it?"
  ],
  playerWin: [
    "Well done, you've got me there! That was a good game!",
    "Fair play, you've won this one! Well deserved!",
    "You've bested me this time, congratulations!"
  ]
};


function getFallbackMessage(situation) {
  const messages = FALLBACK_MESSAGES[situation] || ["..."];
  return messages[Math.floor(Math.random() * messages.length)];
}


async function generateDynamicMessage(context) {
  const { action, hasBomb, nearWin, playerBeat, cardsPlayed } = context;
  
  let prompt = '';
  
  if (action === 'play') {
    if (hasBomb) {
      prompt = `You're a cheeky, playful cat named Whiskers playing a card game. You just played a BOMB (four of a kind). Respond with a funny, sassy comment in UK English (2-3 sentences). Be playful and confident like a cat who just caught the biggest mouse.`;
    } else if (nearWin) {
      prompt = `You're Whiskers, a clever cat playing cards. You're about to win (only a few cards left). Respond with an excited, playful comment in UK English (2-3 sentences). Be like a cat about to pounce on its prey.`;
    } else if (playerBeat) {
      prompt = `You're Whiskers, a competitive cat. The player just played cards and you're beating them with better cards. Respond with a smug, playful comment in UK English (2-3 sentences). Be like a cat showing off.`;
    } else {
      prompt = `You're Whiskers, a playful cat playing cards. You're playing your turn. Respond with a casual, funny comment in UK English (2-3 sentences). Be like a cat casually batting at something.`;
    }
  } else if (action === 'pass') {
    prompt = `You're Whiskers, a clever cat. You're passing your turn (can't beat the player's cards). Respond with a cheeky, strategic comment in UK English (2-3 sentences). Be like a cat pretending to be uninterested but actually planning.`;
  } else {
    prompt = `You're Whiskers, a playful cat playing cards. Respond with a funny comment in UK English (2-3 sentences).`;
  }
  
  const response = await askModel(prompt);
  return response;
}


export async function getContextualMessage(context) {
  const { action, hasBomb, nearWin, playerBeat } = context;
  
  try {
    const dynamicMessage = await generateDynamicMessage(context);
    if (dynamicMessage && dynamicMessage.length > 10) {
      return dynamicMessage;
    }
  } catch (error) {
    console.error('Error generating dynamic message:', error);
  }
  
  if (action === 'play') {
    if (hasBomb) {
      return getFallbackMessage('useBomb');
    }
    if (nearWin) {
      return getFallbackMessage('nearWin');
    }
    if (playerBeat) {
      return getFallbackMessage('beatPlayer');
    }
    return getFallbackMessage('playCards');
  }
  
  if (action === 'pass') {
    return getFallbackMessage('pass');
  }
  
  return getFallbackMessage('playCards');
}
