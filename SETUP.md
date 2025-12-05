# Setup Instructions

## Prerequisites

- Node.js >= 18
- pnpm >= 8

## Installation Steps

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys (optional):
   ```env
   ELEVENLABS_API_KEY=your_key_here
   ```

3. **Build shared packages:**
   ```bash
   pnpm --filter '@wave-ai/shared' build
   pnpm --filter '@wave-ai/agent' build
   ```

4. **Run the application:**
   ```bash
   pnpm dev
   ```
   
   This starts:
   - Frontend: http://localhost:5173
   - API: http://localhost:3001

5. **Test the agent:**
   ```bash
   pnpm agent:demo
   ```

## Troubleshooting

### Port Already in Use
If ports 3001 or 5173 are in use, change them in `.env`:
```env
API_PORT=3002
WEB_PORT=5174
```

### Module Not Found Errors
Make sure you've built the shared packages:
```bash
pnpm --filter '@wave-ai/shared' build
pnpm --filter '@wave-ai/agent' build
```

### Audio Generation Issues
If audio doesn't play:
- Check browser console for errors
- Verify API server is running
- Check that audio files are being generated in `packages/agent/temp/`

### Market Data Not Loading
- CoinGecko API is free but has rate limits
- If requests fail, the app will use mock data
- Check network tab in browser devtools

## Development Workflow

1. **Frontend changes:** Edit files in `apps/web/src/`
2. **API changes:** Edit files in `apps/api/src/`
3. **Agent changes:** Edit files in `packages/agent/src/`
4. **Shared types:** Edit files in `packages/shared/src/`

Hot reload is enabled for both frontend and API in dev mode.

## Building for Production

```bash
pnpm build
```

This builds all packages. Then:
- Frontend: `apps/web/dist/` (serve with any static server)
- API: `apps/api/dist/` (run with `node apps/api/dist/index.js`)

