import { Hono } from 'hono'
import { DurableObject } from "cloudflare:workers";
import { env } from 'hono/adapter';

const app = new Hono()

app.get('/', async (c) => {
	const { UPSTREAM_DO, CHAIN_DO } = env<{ UPSTREAM_DO: DurableObjectNamespace<UpstreamDurableObject>, CHAIN_DO: DurableObjectNamespace<ChainDurableObject> }>(c);
	const upstreamId = UPSTREAM_DO.idFromName("testupstream");
	const upstream = UPSTREAM_DO.get(upstreamId);
	const chainId = CHAIN_DO.idFromName("testchain");
	const chain = CHAIN_DO.get(chainId);
	return c.text(await upstream.sayHello() + " " + await chain.sayHello());
})

export default app

export class UpstreamDurableObject extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async sayHello(): Promise<string> {
		return "Hello from UpstreamDurableObject";
	}
}

export class ChainDurableObject extends DurableObject<Env> {
	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
	}

	async sayHello(): Promise<string> {
		return "Hello from ChainDurableObject";
	}
}