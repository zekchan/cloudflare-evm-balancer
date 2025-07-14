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

## 📄 License

This project is licensed under the MIT License.

## 📚 Documentation

- **[Development Guide](DEVELOPMENT.md)** - Installation, configuration, and development instructions
