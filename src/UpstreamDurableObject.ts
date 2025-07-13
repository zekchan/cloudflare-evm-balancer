
import { DurableObject } from "cloudflare:workers";

export class UpstreamDurableObject extends DurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }
    async setUrl(url: string) {
        await this.ctx.storage.put("url", url);
        await this.ctx.storage.setAlarm(Date.now() + 1000);
        this.updateHeight();
    }

    async getHeight(): Promise<string | undefined> {
        return this.ctx.storage.get<string>("height");
    }
    private async updateHeight() {
        const url = await this.ctx.storage.get<string>("url");
        if (!url) {
            return;
        }
        const response = await fetch(url, {
            method: 'POST',
            body: '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[], "id":1}'
        })
        let result;
        try {
            result = await response.json<{ result: number }>();
        } catch (error) {
        }
        if (!response.ok) {
            console.error({ action: "updateHeightError", url, response, result })
            return
        }
        if (result && result.result) {
            await this.ctx.storage.put("height", result.result);
        }
    }
    async alarm(): Promise<void> {
        try {
            await this.updateHeight();
        } catch (error) {
        } finally {
            this.ctx.storage.setAlarm(Date.now() + 1000);
        }
    }
}