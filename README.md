# Fisho vs Whiskers — When Cards Collide and Chaos Ensues

*A lighthearted 1v1 card battle game where strategy meets cuteness ≽^•⩊•^≼*

---

## Overview

**Fisho vs Whiskers** is a simple 1v1 card battle game (User vs AI) where both sides aim to be the first to empty their hands. Built as a small web-based experience, the project emphasizes:

* Fast-paced gameplay
* Simple yet strategic mechanics
* A cute, fun theme for casual players

This document explains not just the *how*, but also the *why* behind design and implementation decisions.

---

## Gameplay Mechanics

### Basic Rules

* **Deck:** 54 cards (standard 52 + 2 jokers).
* **Hidden Pool:** At the start of each game, **10–20 random cards** are removed unseen by both players.

  * *Reason:* Adds unpredictability and prevents perfect memorization, keeping gameplay fresh.
* **Hands:** The remaining cards are split evenly between Player and AI.
* **Goal:** Be the first to empty your hand!

---

### Valid Combinations

| Type                 | Description                               | Example       | Beats                                   |
| -------------------- | ----------------------------------------- | ------------- | --------------------------------------- |
| **Single**           | One card                                  | 7♠            | Higher single                           |
| **Pair**             | Two cards of the same rank                | 9♥ 9♠         | Higher pair                             |
| **Triple**           | Three of the same rank                    | Q♦ Q♥ Q♠      | Higher triple                           |
| **Full House**       | Three of one + two of another             | 7♣7♠7♦ + K♣K♦ | Higher triple value                     |
| **Sequence**         | 5+ consecutive cards (3–10, J, Q, K only) | 6-7-8-9-10    | Same length, higher start               |
| **Sequential Pairs** | 3+ consecutive pairs                      | 3-3 4-4 5-5   | Same number of pairs, higher start      |
| **Bomb**             | Four of the same rank                     | A♣A♦A♥A♠      | Beats everything except a stronger bomb |

---

### Turn Rules

1. On your turn, play a **valid combination** or **pass**.
2. To beat the previous play, you must use the **same type** with a **higher rank**.
3. **Bombs** beat any non-bomb combination.
4. If both pass consecutively, the board clears and the current player starts fresh.

*Design Note:* This system is inspired by games like “Big Two” and “Dou Dizhu,” but simplified to be beginner-friendly and quick.

---

## AI Behavior (Conceptual)

The AI makes decisions based on:

* Hand value scoring (prioritizing smaller plays early)
* Simple probability-based estimation (without seeing hidden cards)
* Optional difficulty scaling via random error factor

*Design rationale:* Keeping AI logic modular allows future expansion for smarter difficulty tiers or even human-like bluffing mechanics.

---

## Local Deployment

### Option 1: Docker (Recommended)

```bash
# Copy environment file (optional)
cp .env.example .env

# Start services
docker-compose up -d

# Access:
# Frontend: http://localhost:8081
# Backend API: http://localhost:3002
```

### Option 2: Manual Setup

#### Backend

```bash
cd backend
npm install
export GROQ_API_KEY=your_groq_api_key  # optional - get one free from https://console.groq.com
export PORT=3002
node server.js
```

Access via **[http://localhost:3002](http://localhost:3002)**

#### Frontend

Open `frontend/index.html` directly or serve via local server:

**Option A — Python**

```bash
cd frontend
python3 -m http.server 8000
```

**Option B — Node.js**

```bash
npx http-server frontend -p 8000
```

Visit **[http://localhost:8000](http://localhost:8000)**

Update `API_BASE` in `frontend/app.js` if backend URL differs.

---

## Assets & Credits

* **Background Music:** Pixabay
* **Sound Effects:** Mixkit
* **Font:** [Barriecito](https://fonts.google.com/specimen/Barriecito) (Google Fonts)

*Design note:* All assets were chosen for a playful, whimsical tone to match the lighthearted theme of the game.

---

## Future Improvements & Ideas

| Feature                   | Description                           | Design Rationale                           |
| ------------------------- | ------------------------------------- | ------------------------------------------ |
| **Multiplayer (PVP)**     | Real-time or turn-based online mode   | Expands replay value & community           |
| **Coin Flip to Start**    | Randomize which player begins         | Adds fairness & tension                    |
| **Leaderboards**          | Track global or local win streaks     | Boosts competitiveness                     |
| **Achievements / Badges** | e.g. “Bomb Master” or “Fast Finisher” | Increases player retention                 |
| **Daily Challenges**      | Unique rule modifiers each day        | Keeps gameplay varied                      |
| **Card Skins & Themes**   | Unlockable visuals                    | Adds personalization                       |
| **Replay System**         | View previous matches                 | Useful for debugging and strategy analysis |

---

## Development Notes

* **Frontend:** Vanilla JS + simple HTML/CSS for accessibility and portability.
* **Backend:** Node.js API (lightweight game state manager).
* **AI Engine:** Deterministic with randomized decision branches for replay variability.
* **Deployment:** Docker for seamless environment management and isolation.

*Decision reasoning:*

* Keeping tech stack minimal ensures the project runs locally with zero dependencies beyond Node and Docker.
* Avoiding heavy frameworks helps new contributors and students learn from a transparent, readable codebase.

---

## Summary

“**Fisho vs Whiskers**” was designed with three goals in mind:

1. **Simple enough to learn in one round.**
2. **Cute enough to make players smile.**
3. **Strategic enough to keep them coming back.**

From the random hidden pool mechanic to the clean deployment setup, each choice supports the core vision: **easy to play, hard to master, and always a little chaotic.**
