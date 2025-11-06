# ShadowDeal API Documentation

Base URL: `http://localhost:3001/api` (or your deployed URL)

All endpoints return JSON responses.

## Endpoints

### POST /api/newgame

Creates a new game and deals cards.

**Request:**
```json
{}
```

**Response:**
```json
{
  "gameId": "game_1234567890_abc123",
  "playerHand": [
    {
      "id": "0",
      "suit": "♠",
      "rank": "3",
      "value": 3
    },
    // ... more cards
  ],
  "aiHandSize": 24,
  "lastPlay": [],
  "lastPlayer": null,
  "winner": null
}
```

**Status Codes:**
- `200` - Success
- `500` - Server error

---

### POST /api/play

Player plays selected cards. AI automatically responds after player's move.

**Request:**
```json
{
  "gameId": "game_1234567890_abc123",
  "selectedCardIds": ["0", "1", "2"]
}
```

**Response:**
```json
{
  "gameId": "game_1234567890_abc123",
  "playerHand": [...],
  "aiHandSize": 23,
  "lastPlay": [
    {
      "id": "10",
      "suit": "♥",
      "rank": "5",
      "value": 5
    }
  ],
  "lastPlayer": "ai",
  "winner": null,
  "message": "AI plays: 5♥"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request (missing gameId/cardIds, invalid combination, cannot beat last play)
- `404` - Game not found
- `500` - Server error

**Error Response:**
```json
{
  "error": "Invalid combination"
}
```

---

### POST /api/pass

Player passes their turn. AI automatically responds.

**Request:**
```json
{
  "gameId": "game_1234567890_abc123"
}
```

**Response:**
```json
{
  "gameId": "game_1234567890_abc123",
  "playerHand": [...],
  "aiHandSize": 22,
  "lastPlay": [
    {
      "id": "15",
      "suit": "♦",
      "rank": "7",
      "value": 7
    }
  ],
  "lastPlayer": "ai",
  "winner": null,
  "message": "AI plays: 7♦"
}
```

**Status Codes:**
- `200` - Success
- `400` - Invalid request (cannot pass when starting, game already over)
- `404` - Game not found
- `500` - Server error

---

### GET /api/game/:id

Fetches current game state.

**Request:**
```
GET /api/game/game_1234567890_abc123
```

**Response:**
```json
{
  "gameId": "game_1234567890_abc123",
  "playerHand": [...],
  "aiHandSize": 20,
  "lastPlay": [...],
  "lastPlayer": "player",
  "winner": null,
  "playerHandSize": 18
}
```

**Status Codes:**
- `200` - Success
- `404` - Game not found

---

## Game Rules

### Card Values
- Standard cards: 3-10, J, Q, K, A, 2 (values 3-15)
- Jokers: Small Joker (16), Big JOKER (17)

### Combinations
- **Single**: 1 card
- **Pair**: 2 cards of same rank
- **Triple**: 3 cards of same rank
- **Bomb**: 4 cards of same rank (beats any non-bomb)

### Turn Rules
1. First player plays any valid combination
2. Opponent must play same-type combination with higher rank, or pass
3. Bombs beat any non-bomb combination
4. If both players pass consecutively, board clears and next player can start
5. First to empty hand wins

### Hidden Cards
- 6 random cards are removed from deck each game
- Neither player knows which cards are hidden
- This adds uncertainty and prevents perfect strategy

---

## Example Game Flow

1. **Create game:**
   ```bash
   curl -X POST http://localhost:3001/api/newgame
   ```

2. **Play cards:**
   ```bash
   curl -X POST http://localhost:3001/api/play \
     -H "Content-Type: application/json" \
     -d '{"gameId": "game_123...", "selectedCardIds": ["0"]}'
   ```

3. **Pass:**
   ```bash
   curl -X POST http://localhost:3001/api/pass \
     -H "Content-Type: application/json" \
     -d '{"gameId": "game_123..."}'
   ```

4. **Check state:**
   ```bash
   curl http://localhost:3001/api/game/game_123...
   ```

