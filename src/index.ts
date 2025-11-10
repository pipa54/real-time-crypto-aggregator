import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// create HTTP + WebSocket server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// health check route
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// simple in-memory tokens
type Token = {
  token_address: string;
  token_name: string;
  token_ticker: string;
  price: number;
  volume_24h: number;
};

let tokens: Token[] = [
  { token_address: '0xAAA', token_name: 'DemoCoin A', token_ticker: 'DCA', price: 0.01, volume_24h: 1000 },
  { token_address: '0xBBB', token_name: 'DemoCoin B', token_ticker: 'DCB', price: 0.2, volume_24h: 2000 },
];

// REST endpoint: list tokens (limit)
app.get('/tokens', (req, res) => {
  const limit = Math.min(Number(req.query.limit ?? 20), 100);
  const out = tokens.slice(0, limit);
  res.json({ data: out, nextCursor: out.length < tokens.length ? String(limit) : null });
});

// WebSocket connection
io.on('connection', socket => {
  console.log('client connected', socket.id);
  socket.emit('snapshot', tokens);
});

// simulate live price updates every 10 seconds
function randomUpdate() {
  const idx = Math.floor(Math.random() * tokens.length);
  const t = tokens[idx];
  const change = (Math.random() - 0.5) * 0.1; // +/- 5%
  t.price = Number((t.price * (1 + change)).toFixed(6));
  t.volume_24h = Math.max(0, t.volume_24h + Math.round((Math.random() - 0.5) * 500));
  io.emit('update', { token_address: t.token_address, price: t.price, volume_24h: t.volume_24h });
  console.log('emitted update', t.token_ticker, t.price, t.volume_24h);
}

setInterval(randomUpdate, 10000);

const PORT = Number(process.env.PORT || 3000);
server.listen(PORT, () => console.log(`🚀 Server listening on http://localhost:${PORT}`));
