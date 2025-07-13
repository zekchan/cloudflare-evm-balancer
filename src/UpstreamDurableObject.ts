
import { DurableObject } from "cloudflare:workers";


function normalizeHeight(height: string | number | undefined): number {
    if (typeof height === "string" && height.startsWith("0x")) {
        return parseInt(height, 16);
    }
    if (typeof height === "number") {
        return height;
    }
    return 0;
}
export class UpstreamDurableObject extends DurableObject<Env> {
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
    }
    async setUrl(url: string) {
        await this.ctx.storage.put("url", url);
        await this.ctx.storage.setAlarm(Date.now() + 1000);
        this.updateHeight();
    }

    async getHeight(): Promise<number | undefined> {
        return this.ctx.storage.get<number>("height");
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
            await this.ctx.storage.put("height", normalizeHeight(result.result));
        }
    }
    async alarm(): Promise<void> {
        try {
            await this.updateHeight();
        } catch (error) {
        } finally {
            this.ctx.storage.setAlarm(Date.now() + 30 * 1000);
        }
    }
}