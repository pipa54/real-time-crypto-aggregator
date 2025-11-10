import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Aggregator } from './services/aggregator';
import { encodeCursor, decodeCursor } from './utils/pagination';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// init aggregator
const aggregator = new Aggregator(io);
aggregator.startPolling();

// health
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

/**
 * GET /tokens
 * query:
 *  - limit (default 20)
 *  - cursor (base64 encoded index)
 *  - sort: price|volume|price_change_24h|market_cap (default none)
 *  - period: 1h|24h|7d (used for filtering/sorting on change)
 *  - minVolume: numeric (filter)
 */
app.get('/tokens', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 20), 100);
    const cursor = decodeCursor(req.query.cursor as string | undefined);
    const sort = String(req.query.sort ?? '');
    const period = String(req.query.period ?? '24h'); // unused beyond sort selection
    const minVolume = Number(req.query.minVolume ?? 0);

    let tokens = await aggregator.getTokens();

    // filter by min volume if provided
    if (minVolume > 0) {
      tokens = tokens.filter(t => (t.volume_24h ?? 0) >= minVolume);
    }

    // sorting
    if (sort === 'price') {
      tokens.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (sort === 'volume') {
      tokens.sort((a, b) => (b.volume_24h ?? 0) - (a.volume_24h ?? 0));
    } else if (sort === 'price_change_24h' || sort === 'price_change') {
      tokens.sort((a, b) => (b.price_24hr_change ?? 0) - (a.price_24hr_change ?? 0));
    } else if (sort === 'market_cap') {
      tokens.sort((a, b) => (b.market_cap ?? 0) - (a.market_cap ?? 0));
    }

    // cursor pagination (cursor = start index)
    const start = cursor;
    const slice = tokens.slice(start, start + limit);
    const nextCursor = start + slice.length < tokens.length ? encodeCursor(start + slice.length) : null;

    res.json({
      data: slice,
      nextCursor
    });
  } catch (err) {
    console.error('tokens endpoint error', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

// WebSocket: log connections and let aggregator emit snapshot/update events
io.on('connection', socket => {
  console.log('client connected', socket.id);
  // No special per-socket logic needed — aggregator emits snapshot/updates globally
});

const PORT = Number(process.env.PORT ?? 3000);
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
