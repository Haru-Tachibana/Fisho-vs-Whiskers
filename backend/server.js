import express from 'express';
import cors from 'cors';
import { Game } from './game/game.js';
import { chooseAIMove } from './ai/heuristic_ai.js';
import { getContextualMessage } from './ai/ai_messages.js';
import { generatePlayerMessage } from './ai/player_messages.js';
import { WELCOME_MESSAGES } from './ai/welcome_message.js';

export const AI_RIVAL_NAME = 'Whiskers';

let welcomeShown = false;

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));
app.use(express.json());

const games = new Map();

function cleanupOldGames() {
  const now = Date.now();
  for (const [gameId, game] of games.entries()) {
    const gameAge = now - parseInt(gameId.split('_')[1]);
    if (gameAge > 3600000) {
      games.delete(gameId);
    }
  }
}

setInterval(cleanupOldGames, 60000);

app.post('/api/newgame', (req, res) => {
  try {
    const game = new Game();
    const state = game.newGame();
    games.set(state.gameId, game);
    
    const response = { ...state };
    if (!welcomeShown) {
      response.welcomeMessages = WELCOME_MESSAGES;
      welcomeShown = true;
    }
    
    res.json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/play', async (req, res) => {
  try {
    const { gameId, selectedCardIds } = req.body;
    
    if (!gameId || !selectedCardIds || !Array.isArray(selectedCardIds)) {
      return res.status(400).json({ error: 'Invalid request: gameId and selectedCardIds required' });
    }

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const cardsPlayed = selectedCardIds
      .map(id => game.player.hand.find(c => c.id === id))
      .filter(c => c !== undefined);
    
    const state = game.playMove('player', selectedCardIds);
    
    const playerMessage = await generatePlayerMessage(
      cardsPlayed.map(c => ({ rank: c.rank, suit: c.suit, value: c.value }))
    );
    
    if (state.winner === 'player') {
      return res.json({ 
        ...state, 
        message: 'You win!',
        playerMessage: playerMessage
      });
    }

    return res.json({ 
      ...state, 
      message: 'Your turn completed',
      aiThinking: true,
      playerMessage: playerMessage
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/pass', async (req, res) => {
  try {
    const { gameId } = req.body;
    
    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const beforePassState = game.getState();
    const hadLastPlay = beforePassState.lastPlay && beforePassState.lastPlay.length > 0;
    const lastPlayWasPlayer = beforePassState.lastPlayer === 'player';
    
    game.pass('player');
    
    const state = game.getState();
    
    if (state.winner === 'player') {
      return res.json({ ...state, message: 'You win!' });
    }
    
    if (hadLastPlay && lastPlayWasPlayer && state.lastPlay.length === 0) {
      const aiStartMove = chooseAIMove(
        game.ai.hand,
        [],
        {
          playerHandSize: game.player.hand.length,
          aiHandSize: game.ai.hand.length,
          hiddenCount: game.hiddenCount
        }
      );
      
      if (aiStartMove) {
        const aiCardIds = aiStartMove.map(c => c.id);
        const finalState = game.playMove('ai', aiCardIds);
        
        if (finalState.winner === 'ai') {
          const winMessage = await getContextualMessage({ action: 'aiWin' });
          return res.json({ 
            ...finalState, 
            message: 'AI wins!',
            aiChatMessage: winMessage,
            aiCards: aiStartMove.map(c => ({ id: c.id, suit: c.suit, rank: c.rank, value: c.value })),
            aiName: AI_RIVAL_NAME
          });
        }
        
        const playMessage = await getContextualMessage({
          action: 'play',
          hasBomb: aiStartMove.length === 4,
          nearWin: game.ai.hand.length <= 5,
          playerBeat: false,
          cardsPlayed: aiStartMove
        });
        
        return res.json({ 
          ...finalState, 
          message: `AI plays: ${aiStartMove.map(c => c.toString()).join(', ')}`,
          aiChatMessage: playMessage,
          aiCards: aiStartMove.map(c => ({ id: c.id, suit: c.suit, rank: c.rank, value: c.value })),
          aiName: AI_RIVAL_NAME
        });
      }
    }
    
    return res.json({ 
      ...state, 
      message: 'You passed',
      aiThinking: true 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/game/:id', (req, res) => {
  const game = games.get(req.params.id);
  if (!game) {
    return res.status(404).json({ error: 'Game not found' });
  }
  res.json(game.getState());
});

app.post('/api/ai-move', async (req, res) => {
  try {
    const { gameId } = req.body;
    
    if (!gameId) {
      return res.status(400).json({ error: 'gameId required' });
    }

    const game = games.get(gameId);
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const aiMove = chooseAIMove(
      game.ai.hand,
      game.lastPlay,
      {
        playerHandSize: game.player.hand.length,
        aiHandSize: game.ai.hand.length,
        hiddenCount: game.hiddenCount
      }
    );

    let aiChatMessage = '';
    let aiCards = [];
    
    if (aiMove) {
      const isBomb = aiMove.length === 4;
      const nearWin = game.ai.hand.length <= 5;
      const playerBeat = game.lastPlay.length > 0;
      
      aiChatMessage = await getContextualMessage({
        action: 'play',
        hasBomb: isBomb,
        nearWin: nearWin,
        playerBeat: playerBeat,
        cardsPlayed: aiMove
      });

      const aiCardIds = aiMove.map(c => c.id);
      const updatedState = game.playMove('ai', aiCardIds);
      aiCards = aiMove.map(c => ({ id: c.id, suit: c.suit, rank: c.rank, value: c.value }));
      
      if (updatedState.winner === 'ai') {
        aiChatMessage = await getContextualMessage({ action: 'aiWin' });
        return res.json({ 
          ...updatedState, 
          message: 'AI wins!',
          aiChatMessage: aiChatMessage,
          aiCards: aiCards,
          aiName: AI_RIVAL_NAME
        });
      }
      
      return res.json({ 
        ...updatedState, 
        message: `AI plays: ${aiMove.map(c => c.toString()).join(', ')}`,
        aiChatMessage: aiChatMessage,
        aiCards: aiCards,
        aiName: AI_RIVAL_NAME
      });
    } else {
      aiChatMessage = await getContextualMessage({ action: 'pass' });
      game.pass('ai');
      const updatedState = game.getState();
      
      if (updatedState.lastPlay.length === 0) {
        const aiStartMove = chooseAIMove(
          game.ai.hand,
          [],
          {
            playerHandSize: game.player.hand.length,
            aiHandSize: game.ai.hand.length,
            hiddenCount: game.hiddenCount
          }
        );
        
        if (aiStartMove) {
          const aiCardIds = aiStartMove.map(c => c.id);
          const finalState = game.playMove('ai', aiCardIds);
          
          if (finalState.winner === 'ai') {
            const winMessage = await getContextualMessage({ action: 'aiWin' });
            return res.json({ 
              ...finalState, 
              message: 'AI wins!',
              aiChatMessage: winMessage,
              aiCards: aiStartMove.map(c => ({ id: c.id, suit: c.suit, rank: c.rank, value: c.value })),
              aiName: AI_RIVAL_NAME
            });
          }
          
          const playMessage = await getContextualMessage({
            action: 'play',
            hasBomb: aiStartMove.length === 4,
            nearWin: game.ai.hand.length <= 5,
            playerBeat: false,
            cardsPlayed: aiStartMove
          });
          
          return res.json({ 
            ...finalState, 
            message: `AI plays: ${aiStartMove.map(c => c.toString()).join(', ')}`,
            aiChatMessage: playMessage,
            aiCards: aiStartMove.map(c => ({ id: c.id, suit: c.suit, rank: c.rank, value: c.value })),
            aiName: AI_RIVAL_NAME
          });
        }
      }
      
      return res.json({ 
        ...updatedState, 
        message: 'AI passes',
        aiChatMessage: aiChatMessage,
        aiName: AI_RIVAL_NAME
      });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/rules', (req, res) => {
  res.json(WELCOME_MESSAGES);
});

app.listen(PORT, () => {
  console.log(`ShadowDeal server running on http://localhost:${PORT}`);
});

