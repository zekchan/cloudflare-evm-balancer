import { Hono } from 'hono'
import { ChainDurableObject } from './ChainDurableObject';
import { UpstreamDurableObject } from './UpstreamDurableObject';
import { adminApi } from './adminApi';
import { env } from 'cloudflare:workers';
const app = new Hono()

adminApi(app.basePath('/admin'));
// main request handler
app.post('/:chain', async (c) => {
	const { CHAIN_DO } = env
	const chain = c.req.param('chain');
	const chainDOId = CHAIN_DO.idFromName(chain);
	const chainDO = CHAIN_DO.get(chainDOId);
	return chainDO.fetch(c.req.raw);
})
app.get('/', async (c) => {
	return c.redirect('/admin/chains');
})

export default app

export { UpstreamDurableObject, ChainDurableObject }