
import { DurableObject } from "cloudflare:workers";
import { UpstreamDurableObject } from "./UpstreamDurableObject";

export class ChainDurableObject extends DurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }
    public async clearStorage() {
        await Promise.all([
            this.ctx.storage.deleteAll(),
            this.ctx.storage.deleteAlarm(),
        ]);
    }
    async setUpstreams(upstreamsIds: DurableObjectId[]) {
        await this.ctx.storage.put("upstreams", upstreamsIds);
    }
    async addUpstream(upstreamId: string) {
        let upstreams = await this.ctx.storage.get<string[]>("upstreams");
        if (upstreams?.includes(upstreamId)) {
            return;
        }
        if (upstreams) {
            upstreams.push(upstreamId);
        } else {
            upstreams = [upstreamId];
        }
        await this.ctx.storage.put("upstreams", upstreams);
    }
    async getUpstreamIds(): Promise<string[]> {
        return await this.ctx.storage.get<string[]>("upstreams") || [];
    }
    private async getBestUpstream(): Promise<DurableObjectStub<UpstreamDurableObject>> {
        const upstreams = await this.getUpstreamIds();
        const heights = await Promise.all(upstreams.map(async (upstreamIdString) => {
            const upstreamId = this.env.UPSTREAM_DO.idFromString(upstreamIdString);
            const upstream = (this.env.UPSTREAM_DO as unknown as DurableObjectNamespace<UpstreamDurableObject>).get(upstreamId);
            return {
                upstream,
                height: await upstream.getHeight() || 0,
            }
        }));
        return heights.sort((a, b) => b.height - a.height)[0].upstream;
    }
    async getBestHeight(): Promise<number> {
        const upstream = await this.getBestUpstream();
        return await upstream.getHeight() || 0
    }
    // proxy request to best upstream
    async fetch(request: Request): Promise<Response> {
        const upstream = await this.getBestUpstream();
        return upstream.fetch(request); // just proxy in raw mode
    }

}