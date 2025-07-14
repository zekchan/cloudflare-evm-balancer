import { Context, Hono } from 'hono'
import { getUpstreamConfig } from './config';
import { basicAuth } from 'hono/basic-auth';
import { env } from 'cloudflare:workers';
import { json2htmlMiddleware } from './json2html';


const UPSTREAMS = getUpstreamConfig();
const { UPSTREAM_DO, CHAIN_DO } = env;
function getUpstreamDOs(c: Context) {
    return UPSTREAMS.map(({ name }) => {
        const upstreamId = UPSTREAM_DO.idFromName(name);
        const upstream = UPSTREAM_DO.get(upstreamId);
        return upstream;
    })
}
function getChainDOs(c: Context) {
    const chains = new Set(UPSTREAMS.map(({ chain }) => chain));
    return Array.from(chains).map((chain) => {
        const chainDOId = CHAIN_DO.idFromName(chain);
        const chainDO = CHAIN_DO.get(chainDOId);
        return chainDO;
    })
}
export function adminApi(app: Hono) {
    app.use(basicAuth({
        username: "admin",
        password: env.ADMIN_PASSWORD!,
    }));
    app.use(json2htmlMiddleware(app));
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