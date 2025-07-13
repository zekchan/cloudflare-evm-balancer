
import { DurableObject } from "cloudflare:workers";
import { UpstreamDurableObject } from "./UpstreamDurableObject";

export class ChainDurableObject extends DurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }
    async setUpstreams(upstreamsIds: DurableObjectId[]) {
        await this.ctx.storage.put("upstreams", upstreamsIds);
    }
    async addUpstream(upstreamId: string) {
        console.log("addUpstream", upstreamId);
        let upstreams = await this.ctx.storage.get<string[]>("upstreams");
        console.log("saved upstreams", upstreams);
        if (upstreams?.includes(upstreamId)) {
            return;
        }
        if (upstreams) {
            upstreams.push(upstreamId);
        } else {
            upstreams = [upstreamId];
        }
        console.log("saving upstreams", upstreams);
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

}