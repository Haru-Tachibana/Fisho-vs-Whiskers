# Fisho vs Whiskers — When Cards Collide and Chaos Ensues

A simple 1v1 card battle web game (User vs AI), but cute ≽^•⩊•^≼

## Gameplay

### Basic Rules

- **Cards**: 54 cards (standard 52 + 2 jokers)
- **Hidden pool**: 10, 12, 14, 16, 18, or 20 random cards removed each game (unseen by both sides, so you can't remorise all the cards :3)
- **Hands**: Player and AI each get an equal share of the remaining cards
- **Goal**: Simple - Be first to empty your hand!!

### Valid Combinations

**Basic Combinations:**
- **Single**: One card
- **Pair**: Two cards of the same rank
- **Triple**: Three cards of the same rank
- **Bomb**: Four cards of the same rank (beats everything except bigger bombs)
- **Sequence**: 5+ consecutive cards in order (3-10, J, Q, K only). Each value appears once.
  - Example: 6-7-8-9-10
  - To beat: Same length, starting from a higher card (e.g., 8-9-10-J-Q beats 6-7-8-9-10)
- **Full House**: Three of one rank + two of another
  - Example: 7-7-7-K-K
  - To beat: Bigger three-of-a-kind value
- **Sequential Pairs**: 3+ consecutive pairs (3-10, J, Q, K only)
  - Example: 3-3-4-4-5-5
  - To beat: Same number of pairs, starting from a higher rank (e.g., 4-4-5-5-6-6 beats 3-3-4-4-5-5)

### Turn Rules

- Play a valid combination or pass
- To beat the last play, use the same type with a higher rank
- Bombs beat any non-bomb combination
- If you pass on your own play, the board clears and the opponent can start fresh

## Local Deployment

### Option 1: Docker (Recommended)

```bash
# Copy environment file (optional)
cp .env.example .env

# Start services
docker-compose up -d

# Access the application
# Frontend: http://localhost:8081
# Backend API: http://localhost:3002
```

### Option 2: Manual Setup

#### Backend

```bash
cd backend
npm install
export GROQ_API_KEY=your_groq_api_key  # optional - 100% free at https://console.groq.com
export PORT=3002
node server.js
```

The server will start on `http://localhost:3002`

#### Frontend

Open `frontend/index.html` in your browser, or serve it via a local server:

```bash
# Using Python
cd frontend
python3 -m http.server 8000

# Or using Node.js http-server
npx http-server frontend -p 8000
```

Then navigate to `http://localhost:8000` in your browser.

**Note**: Update `API_BASE` in `frontend/app.js` to match your backend URL if not using the default.

## Assets & Credits

- **Background Music**: [Pixabay](https://pixabay.com/)
- **Sound Effects**: [Mixkit](https://mixkit.co/)
- **Font**: [Barriecito](https://fonts.google.com/specimen/Barriecito) from Google Fonts

## License

MIT
