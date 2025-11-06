import { playCardHover, playCardClick, playButtonClick, playBGM, stopBGM, playChatMessage, toggleMute, getMuteState } from './sounds.js';

const API_BASE = 'http://localhost:3002/api';

let currentGameId = null;
let selectedCardIds = new Set();
let playerHand = [];
let lastPlayState = { cards: [], player: null };
let welcomeMessages = null;
const newGameBtn = document.getElementById('new-game-btn');
const playBtn = document.getElementById('play-btn');
const passBtn = document.getElementById('pass-btn');
const clearSelectionBtn = document.getElementById('clear-selection-btn');
const muteBtn = document.getElementById('mute-btn');
const playerCardsDiv = document.getElementById('player-cards');
const aiHandSizeSpan = document.getElementById('ai-hand-size');
const playerHandSizeSpan = document.getElementById('player-hand-size');
const lastPlayCardsDiv = document.getElementById('last-play-cards');
const lastPlayerDiv = document.getElementById('last-player');
const messageDiv = document.getElementById('message');
const winnerModal = document.getElementById('winner-modal');
const winnerText = document.getElementById('winner-text');
const closeModalBtn = document.getElementById('close-modal-btn');
const aiNameDiv = document.getElementById('ai-name');
const chatMessagesDiv = document.getElementById('chat-messages');

function showAIThinking() {
}

function hideAIThinking() {
}

function parseMarkdown(text) {
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/([^*]|^)\*([^*]+?)\*([^*]|$)/g, '$1<em>$2</em>$3');
    html = html.replace(/`(.+?)`/g, '<code>$1</code>');
    html = html.replace(/\n/g, '<br>');
    
    return html;
}

function addChatMessage(message, sender, isSystem = false) {
    if (!chatMessagesDiv) {
        console.error('Chat messages div not found');
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `chat-message chat-message-${sender}`;
    
    if (isSystem) {
        messageDiv.className = 'chat-message chat-message-system';
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        const formattedMessage = parseMarkdown(message);
        bubble.innerHTML = `<div class="chat-text">${formattedMessage}</div>`;
        messageDiv.appendChild(bubble);
    } else {
        const avatar = document.createElement('div');
        avatar.className = 'chat-avatar';
        
        if (sender === 'ai') {
            const img = document.createElement('img');
            img.src = 'assets/avatars/cat.jpeg';
            img.alt = 'Whiskers';
            img.onerror = () => {
                const text = document.createElement('div');
                text.className = 'chat-avatar-text';
                text.textContent = 'W';
                avatar.appendChild(text);
            };
            avatar.appendChild(img);
        } else {
            const img = document.createElement('img');
            img.src = 'assets/avatars/fish.jpg';
            img.alt = 'You';
            img.onerror = () => {
                const text = document.createElement('div');
                text.className = 'chat-avatar-text';
                text.textContent = 'You';
                avatar.appendChild(text);
            };
            avatar.appendChild(img);
        }
        
        const bubble = document.createElement('div');
        bubble.className = 'chat-bubble';
        const formattedMessage = parseMarkdown(message);
        bubble.innerHTML = `
            <div class="chat-name">${sender === 'ai' ? 'Whiskers' : 'You'}</div>
            <div class="chat-text">${formattedMessage}</div>
        `;
        
        messageDiv.appendChild(avatar);
        messageDiv.appendChild(bubble);
    }
    
    chatMessagesDiv.appendChild(messageDiv);
    
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    
    playChatMessage();
}

async function newGame() {
    try {
        hideAIThinking();
        
        if (chatMessagesDiv) {
            chatMessagesDiv.innerHTML = '';
        }
        
        const response = await fetch(`${API_BASE}/newgame`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (!response.ok) {
            throw new Error('Failed to create game');
        }
        
        const state = await response.json();
        currentGameId = state.gameId;
        playerHand = state.playerHand;
        selectedCardIds.clear();
        
        if (state.welcomeMessages && Array.isArray(state.welcomeMessages) && chatMessagesDiv) {
            welcomeMessages = state.welcomeMessages;
            
            state.welcomeMessages.forEach((msgObj, index) => {
                setTimeout(() => {
                    if (chatMessagesDiv) {
                        const isSystem = msgObj.sender === 'system';
                        addChatMessage(msgObj.message, msgObj.sender, isSystem);
                    }
                }, index * 1200);
            });
            
            setTimeout(() => {
                if (chatMessagesDiv) {
                    addChatMessage('Game started! Good luck!', 'system', true);
                }
            }, state.welcomeMessages.length * 1200 + 500);
        } else {
            if (!welcomeMessages) {
                try {
                    const rulesResponse = await fetch(`${API_BASE}/rules`);
                    if (rulesResponse.ok) {
                        welcomeMessages = await rulesResponse.json();
                    }
                } catch (error) {
                    console.debug('Could not fetch rules:', error);
                }
            }
            if (chatMessagesDiv) {
                addChatMessage('Game started! Good luck!', 'system', true);
            }
        }
        
        lastPlayState = { 
            cards: state.lastPlay || [], 
            player: state.lastPlayer || null 
        };
        
        updateUI(state);
        if (messageDiv) {
            messageDiv.textContent = 'Game started! Select cards to play.';
        }
    } catch (error) {
        if (messageDiv) {
            messageDiv.textContent = `Error: ${error.message}`;
        }
        console.error(error);
    }
}

async function playCards() {
    if (selectedCardIds.size === 0) {
        if (messageDiv) {
            messageDiv.textContent = 'Please select cards to play';
        }
        return;
    }
    
    try {
        if (playBtn) playBtn.disabled = true;
        if (passBtn) passBtn.disabled = true;
        
        const response = await fetch(`${API_BASE}/play`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                gameId: currentGameId,
                selectedCardIds: Array.from(selectedCardIds)
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to play cards');
        }
        
        const state = await response.json();
        selectedCardIds.clear();
        
        if (state.lastPlay) {
            lastPlayState.cards = state.lastPlay;
            lastPlayState.player = state.lastPlayer;
        }
        
        updateUI(state);
        
        if (state.playerMessage) {
            addChatMessage(state.playerMessage, 'player');
        }
        
        if (state.message && messageDiv) {
            messageDiv.textContent = state.message;
        }
        
        if (state.winner === 'player') {
            showWinner('player');
            return;
        }
        
        if (state.aiThinking) {
            showAIThinking();
            
            const thinkingTime = 1000 + Math.random() * 1500;
            
            await new Promise(resolve => setTimeout(resolve, thinkingTime));
            
            await getAIMove();
        } else {
            updateUI(state);
        }
    } catch (error) {
        if (messageDiv) {
            messageDiv.textContent = `Error: ${error.message}`;
        }
        console.error(error);
        hideAIThinking();
        const state = { 
            playerHand, 
            aiHandSize: parseInt(aiHandSizeSpan?.textContent || '0'), 
            playerHandSize: playerHand.length,
            lastPlay: lastPlayState.cards,
            lastPlayer: lastPlayState.player
        };
        updateUI(state);
    }
}

async function getAIMove() {
    try {
        const response = await fetch(`${API_BASE}/ai-move`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: currentGameId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to get AI move');
        }
        
        const state = await response.json();
        hideAIThinking();
        
        if (state.lastPlay) {
            lastPlayState.cards = state.lastPlay;
            lastPlayState.player = state.lastPlayer;
        }
        
        if (state.aiName && aiNameDiv) {
            aiNameDiv.textContent = state.aiName;
        }
        
        if (state.aiChatMessage) {
            addChatMessage(state.aiChatMessage, 'ai');
        }
        
        if (state.aiCards && state.aiCards.length > 0) {
            playerHand = state.playerHand || playerHand;
            if (aiHandSizeSpan) {
                aiHandSizeSpan.textContent = state.aiHandSize || 0;
            }
            if (playerHandSizeSpan) {
                playerHandSizeSpan.textContent = state.playerHandSize || playerHand.length;
            }
            renderPlayerCards();
            
            const hasSelection = selectedCardIds.size > 0;
            const canPass = state.lastPlay && state.lastPlay.length > 0;
            if (playBtn) {
                playBtn.disabled = !currentGameId || state.winner || !hasSelection;
            }
            if (passBtn) {
                passBtn.disabled = !currentGameId || state.winner || !canPass;
            }
            
            setTimeout(() => {
                renderLastPlay(state.lastPlay || [], state.lastPlayer);
            }, 300);
        } else {
            updateUI(state);
        }
        
        if (state.message && messageDiv) {
            messageDiv.textContent = state.message;
        }
        
        if (state.winner === 'ai') {
            showWinner('ai');
        }
    } catch (error) {
        if (messageDiv) {
            messageDiv.textContent = `Error: ${error.message}`;
        }
        console.error(error);
        hideAIThinking();
        // Re-enable buttons on error and preserve last play
        const state = { 
            playerHand, 
            aiHandSize: parseInt(aiHandSizeSpan?.textContent || '0'), 
            playerHandSize: playerHand.length,
            lastPlay: lastPlayState.cards,
            lastPlayer: lastPlayState.player
        };
        updateUI(state);
    }
}

async function passTurn() {
    try {
        playBtn.disabled = true;
        passBtn.disabled = true;
        
        const response = await fetch(`${API_BASE}/pass`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ gameId: currentGameId })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to pass');
        }
        
        const state = await response.json();
        selectedCardIds.clear();
        
        if (state.lastPlay) {
            lastPlayState.cards = state.lastPlay;
            lastPlayState.player = state.lastPlayer;
        }
        
        updateUI(state);
        
        addChatMessage("I'll pass this round.", 'player');
        
        if (state.message && messageDiv) {
            messageDiv.textContent = state.message;
        }
        
        if (state.winner === 'player') {
            showWinner('player');
            return;
        }
        
        if (state.aiThinking) {
            showAIThinking();
            
            const thinkingTime = 1000 + Math.random() * 1500;
            await new Promise(resolve => setTimeout(resolve, thinkingTime));
            
            await getAIMove();
        } else {
            updateUI(state);
        }
    } catch (error) {
        if (messageDiv) {
            messageDiv.textContent = `Error: ${error.message}`;
        }
        console.error(error);
        hideAIThinking();
        const state = { 
            playerHand, 
            aiHandSize: parseInt(aiHandSizeSpan?.textContent || '0'), 
            playerHandSize: playerHand.length,
            lastPlay: lastPlayState.cards,
            lastPlayer: lastPlayState.player
        };
        updateUI(state);
    }
}


function updateUI(state) {
    playerHand = state.playerHand || playerHand;
    if (aiHandSizeSpan) {
        aiHandSizeSpan.textContent = state.aiHandSize || 0;
    }
    if (playerHandSizeSpan) {
        playerHandSizeSpan.textContent = state.playerHandSize || playerHand.length;
    }
    
    renderPlayerCards();
    
    const lastPlay = state.lastPlay !== undefined ? state.lastPlay : lastPlayState.cards;
    const lastPlayer = state.lastPlayer !== undefined ? state.lastPlayer : lastPlayState.player;
    renderLastPlay(lastPlay || [], lastPlayer);
    
    const hasSelection = selectedCardIds.size > 0;
    const canPass = lastPlay && lastPlay.length > 0;
    if (playBtn) {
        playBtn.disabled = !currentGameId || state.winner || !hasSelection;
    }
    if (passBtn) {
        passBtn.disabled = !currentGameId || state.winner || !canPass;
    }
}

function renderAICards(count) {
}

function renderPlayerCards() {
    if (!playerCardsDiv) return;
    
    playerCardsDiv.innerHTML = '';
    
    playerHand.forEach((card) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card';
        cardEl.dataset.cardId = card.id;
        
        if (selectedCardIds.has(card.id)) {
            cardEl.classList.add('selected');
        }
        
        if (card.suit === '♥' || card.suit === '♦') {
            cardEl.classList.add('red');
        } else {
            cardEl.classList.add('black');
        }
        
        const rankEl = document.createElement('div');
        rankEl.className = 'rank';
        // Style jokers differently
        if (card.rank === 'Joker') {
            rankEl.classList.add('joker-small');
            rankEl.textContent = 'Joker';
        } else if (card.rank === 'JOKER') {
            rankEl.classList.add('joker-big');
            rankEl.textContent = 'JOKER';
        } else {
            rankEl.textContent = card.rank;
        }
        
        const suitEl = document.createElement('div');
        suitEl.className = 'suit';
        suitEl.textContent = card.suit || '';
        
        cardEl.appendChild(rankEl);
        if (card.suit) {
            cardEl.appendChild(suitEl);
        }
        
        cardEl.addEventListener('mouseenter', () => {
            playCardHover();
        });
        
        cardEl.addEventListener('click', () => {
            playCardClick();
            const cardId = cardEl.dataset.cardId;
            if (selectedCardIds.has(cardId)) {
                selectedCardIds.delete(cardId);
                cardEl.classList.remove('selected');
            } else {
                selectedCardIds.add(cardId);
                cardEl.classList.add('selected');
            }
            const hasSelection = selectedCardIds.size > 0;
            if (playBtn) {
                playBtn.disabled = !currentGameId || !hasSelection;
            }
        });
        
        playerCardsDiv.appendChild(cardEl);
    });
}

function renderLastPlay(cards, player) {
    if (!lastPlayCardsDiv) return;
    
    lastPlayCardsDiv.innerHTML = '';
    
    if (cards.length === 0) {
        lastPlayCardsDiv.innerHTML = '<div class="empty-message">No cards on board</div>';
        if (lastPlayerDiv) {
            lastPlayerDiv.textContent = '';
        }
        return;
    }
    
    cards.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'card card-play-animation';
        cardEl.style.animationDelay = `${index * 0.1}s`;
        
        if (card.suit === '♥' || card.suit === '♦') {
            cardEl.classList.add('red');
        } else {
            cardEl.classList.add('black');
        }
        
        const rankEl = document.createElement('div');
        rankEl.className = 'rank';
        // Style jokers differently
        if (card.rank === 'Joker') {
            rankEl.classList.add('joker-small');
            rankEl.textContent = 'Joker';
        } else if (card.rank === 'JOKER') {
            rankEl.classList.add('joker-big');
            rankEl.textContent = 'JOKER';
        } else {
            rankEl.textContent = card.rank;
        }
        
        const suitEl = document.createElement('div');
        suitEl.className = 'suit';
        suitEl.textContent = card.suit || '';
        
        cardEl.appendChild(rankEl);
        if (card.suit) {
            cardEl.appendChild(suitEl);
        }
        
        lastPlayCardsDiv.appendChild(cardEl);
    });
    
    if (player && lastPlayerDiv) {
        lastPlayerDiv.textContent = `Played by: ${player === 'player' ? 'You' : 'AI'}`;
    }
}

function showWinner(winner) {
    if (winnerText) {
        winnerText.textContent = winner === 'player' ? 'You Win!' : 'AI Wins!';
    }
    if (winnerModal) {
        winnerModal.style.display = 'flex';
    }
    hideAIThinking();
    
    const winnerMsg = winner === 'player' 
        ? 'Congratulations! You won the game!' 
        : 'Whiskers wins! Better luck next time!';
    addChatMessage(winnerMsg, 'system', true);
}

if (newGameBtn) {
    newGameBtn.addEventListener('click', () => {
        playButtonClick();
        newGame();
    });
}
if (playBtn) {
    playBtn.addEventListener('click', () => {
        playButtonClick();
        playCards();
    });
}
if (passBtn) {
    passBtn.addEventListener('click', () => {
        playButtonClick();
        passTurn();
    });
}
if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
        playButtonClick();
        if (winnerModal) {
            winnerModal.style.display = 'none';
        }
        newGame();
    });
}

function clearAllSelections() {
    selectedCardIds.clear();
    
    if (playerCardsDiv) {
        const cards = playerCardsDiv.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.remove('selected');
        });
    }
    
    if (playBtn) {
        playBtn.disabled = !currentGameId || selectedCardIds.size === 0;
    }
}

if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener('click', () => {
        playButtonClick();
        clearAllSelections();
    });
}

async function replayRules() {
    if (!chatMessagesDiv) {
        return;
    }
    
    if (!welcomeMessages || welcomeMessages.length === 0) {
        try {
            const response = await fetch(`${API_BASE}/rules`);
            if (!response.ok) {
                throw new Error('Failed to fetch rules');
            }
            welcomeMessages = await response.json();
        } catch (error) {
            console.error('Failed to fetch welcome messages for replay:', error);
            addChatMessage('Could not load rules. Please try again later.', 'system', true);
            return;
        }
    }
    
    addChatMessage('Here are the rules again:', 'ai');
    
    welcomeMessages.forEach((msgObj, index) => {
        setTimeout(() => {
            if (chatMessagesDiv) {
                const isSystem = msgObj.sender === 'system';
                addChatMessage(msgObj.message, msgObj.sender, isSystem);
            }
        }, (index + 1) * 1200);
    });
}

document.addEventListener('keydown', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }
    
    if (event.key === 'R' || event.key === 'r') {
        replayRules();
    }
});

if (muteBtn) {
    muteBtn.addEventListener('click', () => {
        const muted = toggleMute();
        muteBtn.textContent = muted ? 'Sound Off' : 'Sound On';
    });
}

setTimeout(() => {
    playBGM(true);
}, 100);

window.addEventListener('focus', () => {
    if (!getMuteState()) {
        playBGM(true);
    }
});

document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !getMuteState()) {
        playBGM(true);
    }
});

const startBGMOnInteraction = () => {
    if (!getMuteState()) {
        playBGM(true);
    }
    document.removeEventListener('click', startBGMOnInteraction);
    document.removeEventListener('keydown', startBGMOnInteraction);
    document.removeEventListener('touchstart', startBGMOnInteraction);
    document.removeEventListener('mousedown', startBGMOnInteraction);
};

document.addEventListener('click', startBGMOnInteraction, { once: true });
document.addEventListener('keydown', startBGMOnInteraction, { once: true });
document.addEventListener('touchstart', startBGMOnInteraction, { once: true });
document.addEventListener('mousedown', startBGMOnInteraction, { once: true });

newGame();
