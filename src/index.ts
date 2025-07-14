import { DurableObject } from 'cloudflare:workers';
import { Context, Hono } from 'hono'
import { env } from 'hono/adapter';
import { ChainDurableObject } from './ChainDurableObject';
import { UpstreamDurableObject } from './UpstreamDurableObject';
import { adminApi } from './adminApi';
const app = new Hono()

adminApi(app.basePath('/admin'));
// main request handler
app.post('/:chain', async (c) => {
	const { CHAIN_DO } = env<{ CHAIN_DO: DurableObjectNamespace<ChainDurableObject> }>(c);
	const chain = c.req.param('chain');
	const chainDOId = CHAIN_DO.idFromName(chain);
	const chainDO = CHAIN_DO.get(chainDOId);
	return chainDO.fetch(c.req.raw);
})

export default app

export { UpstreamDurableObject, ChainDurableObject }