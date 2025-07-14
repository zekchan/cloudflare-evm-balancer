import { Context, Hono } from 'hono'
import { UpstreamDurableObject } from './UpstreamDurableObject';
import { ChainDurableObject } from './ChainDurableObject';
import { getDONameSpace } from './utils';
import { getUpstreamConfig } from './config';


const UPSTREAMS = getUpstreamConfig();
function getUpstreamDOs(c: Context) {
    const UPSTREAM_DO = getDONameSpace<UpstreamDurableObject>("UPSTREAM_DO");
    return UPSTREAMS.map(({ name }) => {
        const upstreamId = UPSTREAM_DO.idFromName(name);
        const upstream = UPSTREAM_DO.get(upstreamId);
        return upstream;
    })
}
function getChainDOs(c: Context) {
    const CHAIN_DO = getDONameSpace<ChainDurableObject>("CHAIN_DO");
    const chains = new Set(UPSTREAMS.map(({ chain }) => chain));
    return Array.from(chains).map((chain) => {
        const chainDOId = CHAIN_DO.idFromName(chain);
        const chainDO = CHAIN_DO.get(chainDOId);
        return chainDO;
    })
}
export function adminApi(app: Hono) {
    app.delete('/clear_storage', async (c) => {
        await Promise.all(getUpstreamDOs(c).map(async (upstream) => {
            await upstream.clearStorage();
        }));
        await Promise.all(getChainDOs(c).map(async (chainDO) => {
            await chainDO.clearStorage();
        }));
        return c.json({ message: "ok" });
    })
    app.post('/init_upstreams', async (c) => {
        const UPSTREAM_DO = getDONameSpace<UpstreamDurableObject>("UPSTREAM_DO");
        const CHAIN_DO = getDONameSpace<ChainDurableObject>("CHAIN_DO");
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