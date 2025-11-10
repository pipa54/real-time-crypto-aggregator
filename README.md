# 🚀 Real-Time Crypto Aggregator

This project was built as part of the **Eterna Backend Internship Assignment**.  
It aggregates real-time meme coin data from multiple DEX APIs (DexScreener and GeckoTerminal), implements caching, and pushes live updates to connected clients via WebSocket.

---

## ✨ Features
- Aggregates token data from **DexScreener** and **GeckoTerminal**
- Implements **in-memory caching** with configurable TTL (default 30 seconds)
- Supports **filtering, sorting, and cursor-based pagination**
- Provides **WebSocket live updates** for price and volume changes
- Handles **API rate limits** using exponential backoff retries
- Simple, scalable structure that can easily swap cache with Redis

---

## ⚙️ Tech Stack
- **Runtime:** Node.js + TypeScript  
- **Framework:** Express.js  
- **Realtime:** Socket.io  
- **HTTP Client:** Axios (with retry logic)  
- **Cache:** Custom in-memory cache (Redis-ready)

---

## 🧩 Endpoints

### `GET /health`
Health check endpoint — returns `{"status": "ok"}`

### `GET /tokens`
Fetch aggregated token data  
**Query parameters:**
| Param | Type | Description |
|--------|------|-------------|
| `limit` | number | Max number of tokens to return (default 20) |
| `cursor` | base64 string | Used for pagination |
| `sort` | string | Sort by `volume`, `price`, `market_cap`, or `price_change_24h` |
| `minVolume` | number | Filter out tokens below this 24h volume |
| `period` | string | `1h`, `24h`, or `7d` (affects sorting field) |

**Example:**
