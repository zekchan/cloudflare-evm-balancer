import { DurableObject } from 'cloudflare:workers';
import { Hono } from 'hono'
import { env } from 'hono/adapter';
import { UpstreamDurableObject } from './UpstreamDurableObject';

const app = new Hono()
const UPSTREAMS = [
	{
		chain: "celo",
		name: "celo1",
		upstream: "https://forno.celo.org",
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
app.get('/', async (c) => {
	const { UPSTREAM_DO, CHAIN_DO } = env<{ UPSTREAM_DO: DurableObjectNamespace<UpstreamDurableObject>, CHAIN_DO: DurableObjectNamespace<ChainDurableObject> }>(c);
	let height: number | undefined;
	for (const { upstream: upstreamUrl, name } of UPSTREAMS) {
		const upstreamId = UPSTREAM_DO.idFromName(name);
		const upstream = UPSTREAM_DO.get(upstreamId);
		await upstream.setUrl(upstreamUrl);
	}
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

export default app

export { UpstreamDurableObject }

export class ChainDurableObject extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);

	}

	async sayHello(): Promise<string> {
		return "Hello from ChainDurableObject";
	}
}