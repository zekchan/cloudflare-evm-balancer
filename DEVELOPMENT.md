# Development Guide

This document contains all development-related information for the Cloudflare EVM Balancer project.

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd cloudflare-evm-balancer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   # Set upstream configuration (JSON string)
   wrangler secret put UPSTREAM_CONFIG
   
   # Set admin password
   wrangler secret put ADMIN_PASSWORD
   ```

4. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

## ⚙️ Configuration

### Local Development Setup

For local development, you need to create two configuration files:

#### 1. `.dev.vars` (for local worker development)
This file contains the secrets that will be used when running `wrangler dev`:

```env
UPSTREAM_CONFIG=[{"chain":"ethereum","name":"alchemy-mainnet","upstream":"https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY"},{"chain":"bsc","name":"binance-rpc","upstream":"https://bsc-dataseed1.binance.org"}]
ADMIN_PASSWORD=your_admin_password
```

#### 2. `.env` (for REST Client testing)
This file is used by the REST Client extension and contains:

```env
WORKER_URL=https://your-worker.your-subdomain.workers.dev
ADMIN_PASSWORD=your_admin_password
```

**Note**: 
- `.dev.vars` is used by Wrangler for local development
- `.env` is used by REST Client for testing the deployed worker
- Both files should be added to `.gitignore` to keep secrets secure

### Upstream Configuration Format

The `UPSTREAM_CONFIG` environment variable should contain a JSON array:

```json
[
  {
    "chain": "ethereum",
    "name": "alchemy-mainnet",
    "upstream": "https://eth-mainnet.alchemyapi.io/v2/YOUR_API_KEY"
  },
  {
    "chain": "bsc",
    "name": "binance-rpc",
    "upstream": "https://bsc-dataseed1.binance.org"
  },
  {
    "chain": "polygon",
    "name": "polygon-rpc",
    "upstream": "https://polygon-rpc.com"
  }
]
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `UPSTREAM_CONFIG` | JSON string containing upstream configurations | Yes |
| `ADMIN_PASSWORD` | Password for admin API access | Yes |

## 🏃‍♂️ Development

### Local Development
```bash
npm run dev
```

### Testing
```bash
npm test
```

### Type Generation
```bash
npm run cf-typegen
```

## 🔧 Usage

### Testing with HTTP Files

Use the provided `use.http` file for testing:

1. Create a `.env` file with:
   ```
   WORKER_URL=https://your-worker.your-subdomain.workers.dev
   ADMIN_PASSWORD=your_admin_password
   ```

2. Use VS Code REST Client or similar to execute the HTTP requests

### API Endpoints

#### Main RPC Endpoint
```
POST /{chain}
```
Proxies JSON-RPC requests to the best upstream for the specified chain.

**Example:**
```bash
curl -X POST https://your-worker.your-subdomain.workers.dev/ethereum \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "method": "eth_blockNumber",
    "params": [],
    "id": 1
  }'
```

#### Admin Endpoints

All admin endpoints require Basic Authentication with username `admin` and the configured password.

- `POST /admin/init_upstreams` - Initialize all upstream providers
- `DELETE /admin/clear_storage` - Clear all Durable Object storage
- `GET /admin/chains` - Get chain status and best block heights
- `GET /admin/upstreams` - Get upstream status and block heights
- `GET /admin/stats` - Get performance statistics

**Browser Access**: When accessing admin endpoints from a web browser, responses are automatically rendered as HTML with navigation using a custom JSON-to-HTML middleware. This provides a user-friendly web interface for monitoring and management.

**API Access**: When accessed programmatically (with appropriate headers), the same endpoints return JSON responses for integration with other tools and scripts.

## 🏗️ Technical Stack

- **Runtime**: Cloudflare Workers
- **Framework**: Hono (lightweight web framework)
- **State Management**: Durable Objects
- **Language**: TypeScript
- **Deployment**: Wrangler CLI

## 📈 Performance

- **Zero Latency Configuration**: Environment-based config eliminates KV read latency
- **Intelligent Routing**: Routes to most up-to-date upstream
- **Connection Pooling**: Efficient connection management
- **Automatic Recovery**: Self-healing when upstreams fail
- **Global Distribution**: Cloudflare's edge network for low latency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request 