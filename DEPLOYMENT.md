# Deployment Guide

This guide covers deploying ShadowDeal to cloud platforms and running locally with Docker.

## Local Deployment with Docker

### Prerequisites
- Docker and Docker Compose installed

### Steps

1. **Clone and navigate to project:**
   ```bash
   cd CardGame
   ```

2. **Create `.env` file (optional):**
   ```bash
   cp .env.example .env
   # Edit .env if you want to set GROQ_API_KEY
   ```

3. **Start services:**
   ```bash
   docker-compose up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001

5. **Stop services:**
   ```bash
   docker-compose down
   ```

6. **View logs:**
   ```bash
   docker-compose logs -f backend
   ```

---

## Cloud Deployment Options

### Option 1: Railway (Recommended - Easiest)

Railway supports both backend and frontend deployment.

#### Backend Deployment

1. **Install Railway CLI:**
   ```bash
   npm i -g @railway/cli
   railway login
   ```

2. **Initialize project:**
   ```bash
   cd backend
   railway init
   ```

3. **Set environment variables:**
   ```bash
   railway variables set GROQ_API_KEY=your_key_here
   railway variables set PORT=3001
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

#### Frontend Deployment

1. **Create `railway.json` in frontend directory:**
   ```json
   {
     "build": {
       "builder": "STATIC"
     },
     "routes": {
       "/": "index.html"
     }
   }
   ```

2. **Deploy frontend:**
   ```bash
   cd frontend
   railway init
   railway up
   ```

3. **Update frontend API URL:**
   - Edit `frontend/app.js`
   - Change `API_BASE` to your Railway backend URL

**Railway Dashboard:** https://railway.app

---

### Option 2: Render

#### Backend Deployment

1. **Create `render.yaml` in project root:**
   ```yaml
   services:
     - type: web
       name: shadowdeal-backend
       env: node
       buildCommand: cd backend && npm install
       startCommand: cd backend && node server.js
       envVars:
         - key: PORT
           value: 3001
         - key: GROQ_API_KEY
           sync: false
   ```

2. **Deploy via Render Dashboard:**
   - Connect GitHub repository
   - Select "New Web Service"
   - Choose backend directory
   - Set build command: `cd backend && npm install`
   - Set start command: `cd backend && node server.js`
   - Add environment variables

#### Frontend Deployment

1. **Deploy as Static Site:**
   - Connect GitHub repository
   - Select "New Static Site"
   - Choose frontend directory
   - Set build command: (none needed)
   - Set publish directory: `frontend`

2. **Update API URL in `app.js`**

**Render Dashboard:** https://render.com

---

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

#### Backend
- Deploy backend to Railway or Render (see above)

#### Frontend on Vercel

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Deploy:**
   ```bash
   cd frontend
   vercel
   ```

3. **Update API URL:**
   - Edit `frontend/app.js` to use your backend URL
   - Redeploy

**Vercel Dashboard:** https://vercel.com

---

### Option 4: Fly.io

#### Backend

1. **Install Fly CLI:**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create `fly.toml` in backend directory:**
   ```toml
   app = "shadowdeal-backend"
   primary_region = "iad"

   [build]

   [env]
     PORT = "3001"

   [[services]]
     internal_port = 3001
     protocol = "tcp"

     [[services.ports]]
       handlers = ["http"]
       port = 80

     [[services.ports]]
       handlers = ["tls", "http"]
       port = 443
   ```

3. **Deploy:**
   ```bash
   cd backend
   fly launch
   fly secrets set GROQ_API_KEY=your_key_here
   fly deploy
   ```

**Fly.io Dashboard:** https://fly.io

---

## Environment Variables

Create a `.env` file (or set in your platform's dashboard):

```env
PORT=3001
NODE_ENV=production
GROQ_API_KEY=your_groq_api_key_here  # Optional - 100% FREE
```

### Getting Groq API Key (Optional - 100% Free)

1. Go to https://console.groq.com
2. Sign up for a free account
3. Navigate to API Keys section
4. Create a new API key
5. Copy and set as `GROQ_API_KEY` in your environment

**Note:** Groq offers a generous free tier with fast inference. No credit card required!

---

## CORS Configuration

If deploying frontend and backend separately, update CORS in `backend/server.js`:

```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));
```

Then set `CORS_ORIGIN` environment variable to your frontend URL.

---

## Health Check Endpoint

Add this to `server.js` for platform health checks:

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
```

---

## Troubleshooting

### Backend won't start
- Check `PORT` environment variable is set
- Verify Node.js version (requires 18+)
- Check logs: `docker-compose logs backend` or platform logs

### Frontend can't connect to backend
- Verify backend URL in `app.js` matches deployed URL
- Check CORS settings
- Verify backend is running and accessible

### Games not persisting
- Current implementation uses in-memory storage
- For production, add database (Redis, PostgreSQL, etc.)
- See `backend/server.js` for game storage logic

---

## Production Considerations

1. **Add Database:**
   - Replace in-memory `games` Map with Redis or PostgreSQL
   - Add session management

2. **Rate Limiting:**
   - Add rate limiting middleware (express-rate-limit)
   - Prevent abuse

3. **Error Handling:**
   - Add proper error logging (Winston, Pino)
   - Set up error tracking (Sentry)

4. **Monitoring:**
   - Add health check endpoint
   - Set up uptime monitoring

5. **Security:**
   - Validate all inputs
   - Add request size limits
   - Use HTTPS only

