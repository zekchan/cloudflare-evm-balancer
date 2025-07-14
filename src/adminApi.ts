import { Context, Hono } from 'hono'
import { UpstreamDurableObject } from './UpstreamDurableObject';
import { ChainDurableObject } from './ChainDurableObject';
import { env } from 'hono/adapter';
const UPSTREAMS = [
    {
        chain: "bsc",
        name: "publicnode-bsc-mainnet",
        upstream: "https://bsc-rpc.publicnode.com",
    },
    {
        chain: "celo",
        name: "celo1",
        upstream: "https://forno.celo.org",
    },
    {
        chain: "celo",
        name: "drpc-public-celo",
        upstream: "https://celo.drpc.org",
    },
    {
        chain: "base",
        name: "drpc-public-base",
        upstream: "https://base.drpc.org",
    },
    {
        chain: "ethereum",
        name: "drpc-public-ethereum",
        upstream: "https://eth.drpc.org",
    },
    {
        chain: "ethereum",
        name: "publicnode-ethereum-mainnet",
        upstream: "https://ethereum-rpc.publicnode.com",
    },
]
function getUpstreamDOs(c: Context) {
    const { UPSTREAM_DO } = env<{ UPSTREAM_DO: DurableObjectNamespace<UpstreamDurableObject> }>(c);
    return UPSTREAMS.map(({ name }) => {
        const upstreamId = UPSTREAM_DO.idFromName(name);
        const upstream = UPSTREAM_DO.get(upstreamId);
        return upstream;
    })
}
function getChainDOs(c: Context) {
    const { CHAIN_DO } = env<{ CHAIN_DO: DurableObjectNamespace<ChainDurableObject> }>(c);
    const chains = new Set(UPSTREAMS.map(({ chain }) => chain));
    return Array.from(chains).map((chain) => {
        const chainDOId = CHAIN_DO.idFromName(chain);
        const chainDO = CHAIN_DO.get(chainDOId);
        return chainDO;
    })
}
export function adminApi(app: Hono) {
    app.delete('/clear_storage', async (c) => {
        const { UPSTREAM_DO, CHAIN_DO } = env<{ UPSTREAM_DO: DurableObjectNamespace<UpstreamDurableObject>, CHAIN_DO: DurableObjectNamespace<ChainDurableObject> }>(c);
        await Promise.all(getUpstreamDOs(c).map(async (upstream) => {
            await upstream.clearStorage();
        }));
        await Promise.all(getChainDOs(c).map(async (chainDO) => {
            await chainDO.clearStorage();
        }));
        return c.json({ message: "ok" });
    })
    app.post('/init_upstreams', async (c) => {
        const { UPSTREAM_DO, CHAIN_DO } = env<{ UPSTREAM_DO: DurableObjectNamespace<UpstreamDurableObject>, CHAIN_DO: DurableObjectNamespace<ChainDurableObject> }>(c);
        for (const { upstream: upstreamUrl, name, chain } of UPSTREAMS) {
            const upstreamId = UPSTREAM_DO.idFromName(name);
            const upstream = UPSTREAM_DO.get(upstreamId);
            await upstream.setUrl(upstreamUrl);
            const chainDOId = CHAIN_DO.idFromName(chain);
            const chainDO = CHAIN_DO.get(chainDOId);
            await chainDO.addUpstream(upstreamId.toString());
        }
        return c.json({ message: "ok" });
    })
    app.get('/upstreams', async (c) => {
        const heights = await Promise.all(getUpstreamDOs(c).map(async (upstream) => {
            return {
                name: upstream.name,
                id: upstream.id.toString(),
                height: await upstream.getHeight(),
            }
        }));
        return c.json(heights);
    })
    app.get('/chains', async (c) => {
        const heights = await Promise.all(
            getChainDOs(c).map(async (chainDO) => {
                return {
                    chain: chainDO.name,
                    id: chainDO.id.toString(),
                    height: await chainDO.getBestHeight(),
                }
            })
        );
        return c.json(heights);
    })

    app.get('/stats', async (c) => {
        const stats = await Promise.all(getUpstreamDOs(c).map(async (upstream) => {
            return {
                name: upstream.name,
                id: upstream.id.toString(),
                stats: await upstream.getStats(),
            }
        }));
        return c.json(stats);
    })
}