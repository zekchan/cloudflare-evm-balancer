import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono'
import { env } from 'hono/adapter';
import { ChainDurableObject } from './ChainDurableObject';
import { UpstreamDurableObject } from './UpstreamDurableObject';

const app = new Hono()
const UPSTREAMS = [
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
app.get('/init_upstreams', async (c) => {
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
app.get('/get_upstreams', async (c) => {
	const { UPSTREAM_DO, CHAIN_DO } = env<{ UPSTREAM_DO: DurableObjectNamespace<UpstreamDurableObject>, CHAIN_DO: DurableObjectNamespace<ChainDurableObject> }>(c);
	const heights = await Promise.all(UPSTREAMS.map(async ({ upstream: upstreamUrl, name, chain }) => {
		const upstreamId = UPSTREAM_DO.idFromName(name);
		const upstream = UPSTREAM_DO.get(upstreamId);
		return {
			name: name,
			chain: chain,
			height: await upstream.getHeight(),
		}
	}));
	return c.json(heights);
})
app.get('/get_chains', async (c) => {
	const { CHAIN_DO } = env<{ CHAIN_DO: DurableObjectNamespace<ChainDurableObject> }>(c);
	const chains = new Set(UPSTREAMS.map(({ chain }) => chain));
	const heights = await Promise.all(
		Array.from(chains).map(async (chain) => {
			const chainDOId = CHAIN_DO.idFromName(chain);
			const chainDO = CHAIN_DO.get(chainDOId);
			return {
				chain: chain,
				height: await chainDO.getBestHeight(),
			}
		}));
	return c.json(heights);
})
app.post('/:chain', async (c) => {
	const { CHAIN_DO } = env<{ CHAIN_DO: DurableObjectNamespace<ChainDurableObject> }>(c);
	const chain = c.req.param('chain');
	const chainDOId = CHAIN_DO.idFromName(chain);
	const chainDO = CHAIN_DO.get(chainDOId);
	return chainDO.fetch(c.req.raw);
})
export default app

export { UpstreamDurableObject, ChainDurableObject }