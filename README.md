# Cloudflare EVM Balancer

A high-performance EVM (Ethereum Virtual Machine) load balancer built on Cloudflare Workers using Durable Objects. This project provides intelligent routing and failover for blockchain RPC requests across multiple upstream providers.

## 🏗️ Architecture

### Core Components

#### 1. **ChainDurableObject**
- **Purpose**: Manages a specific blockchain network (e.g., Ethereum, BSC, Polygon)
- **Responsibilities**:
  - Maintains list of available upstream providers for the chain
  - Selects the best upstream based on block height (highest = most up-to-date)
  - Proxies requests to the optimal upstream
  - Handles failover when upstreams become unavailable

#### 2. **UpstreamDurableObject**
- **Purpose**: Represents a single RPC provider endpoint
- **Responsibilities**:
  - Maintains connection to upstream RPC provider
  - Tracks block height and sync status
  - Monitors performance metrics (response times, error rates)
  - Handles health checks and automatic recovery
  - Proxies JSON-RPC requests to upstream

#### 3. **Admin API**
- **Purpose**: Management interface for configuration and monitoring
- **Features**:
  - Initialize upstream providers
  - Clear storage and reset state
  - Monitor chain and upstream health
  - View performance statistics
  - Basic authentication protection

### Data Flow

```
Client Request → ChainDurableObject → Best UpstreamDurableObject → RPC Provider
                ↓
            Block Height
            Comparison
                ↓
            Select Highest
            Block Height
```

## 🚀 Features

- **Intelligent Load Balancing**: Routes requests to the most up-to-date upstream
- **Automatic Failover**: Switches to healthy upstreams when others fail
- **Performance Monitoring**: Tracks response times and error rates
- **Health Checks**: Continuous monitoring of upstream availability
- **Admin Interface**: Easy management and monitoring
- **Durable State**: Persistent state across worker restarts
- **Zero Latency**: Environment-based configuration for instant startup

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

## 🔧 Usage

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

### Testing with HTTP Files

Use the provided `use.http` file for testing:

1. Create a `.env` file with:
   ```
   WORKER_URL=https://your-worker.your-subdomain.workers.dev
   ADMIN_PASSWORD=your_admin_password
   ```

2. Use VS Code REST Client or similar to execute the HTTP requests

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

## 📊 Monitoring

The system provides comprehensive monitoring through:

- **Block Height Tracking**: Each upstream reports its current block height
- **Performance Metrics**: Response times and error counts per method
- **Health Status**: Real-time upstream availability
- **Admin Dashboard**: Web interface for monitoring (via API endpoints)

## 🔒 Security

- **Admin API Protection**: Basic authentication required for all admin endpoints
- **Environment Variables**: Sensitive configuration stored as secrets
- **Request Validation**: JSON-RPC request validation and sanitization
- **Error Handling**: Graceful error handling without exposing internal details

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

## 📄 License

This project is licensed under the MIT License.
