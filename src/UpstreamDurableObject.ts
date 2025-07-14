
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
type Stats = {
    count: number;
    totalTime: number;
    errors: number;
}
export class UpstreamDurableObject extends DurableObject<Env> {
    private stats: Record<string, Stats> = {};
    private async saveStats() {
        await this.ctx.storage.put("stats", this.stats);
    }
    private async restoreStats() {
        this.stats = await this.ctx.storage.get<Record<string, Stats>>("stats") || {};
    }
    constructor(ctx: DurableObjectState, env: Env) {
        super(ctx, env);
        this.ctx.blockConcurrencyWhile(async () => {
            await this.restoreStats();
            console.log({
                action: "restoreStats from constructor",
                id: this.ctx.id.toString(),
                stats: this.stats,
            });
        });
    }
    async setUrl(url: string) {
        await this.ctx.storage.put("url", url);
        await this.ctx.storage.setAlarm(Date.now() + 1000);
        this.updateHeight();
    }

    async getHeight(): Promise<number | undefined> {
        return this.ctx.storage.get<number>("height");
    }
    private async request(method: string, params: any[]) {
        const url = await this.ctx.storage.get<string>("url");
        if (!url) {
            return;
        }
        const start = Date.now();
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 })
        });
        const end = Date.now();
        const duration = end - start;
        const stats = this.stats[method] || { count: 0, totalTime: 0, errors: 0 };
        stats.count++;
        stats.totalTime += duration;
        this.stats[url] = stats;
        return response;
    }
    private async updateHeight() {
        const response = await this.request("eth_blockNumber", []);
        if (!response) {
            return;
        }
        let result;
        try {
            result = await response.json<{ result: number }>();
        } catch (error) {
        }
        if (!response.ok) {
            console.error({ action: "updateHeightError", response, result })
            return
        }
        if (result && result.result) {
            await this.ctx.storage.put("height", normalizeHeight(result.result));
        }
    }
    async alarm(): Promise<void> {
        try {
            await Promise.all([this.updateHeight(), this.saveStats()]);
        } catch (error) {
        } finally {
            this.ctx.storage.setAlarm(Date.now() + 30 * 1000);
        }
    }
    async fetch(request: Request): Promise<Response> {
        const url = await this.ctx.storage.get<string>("url");
        if (!url) {
            return new Response("No url found", { status: 500 });
        }
        // TODO: intercept request AND
        // make fix all headers
        // normilize body, chage id, validate something
        // handlre response and errors.
        // Maybe do that in chain and not it upstream
        return fetch(url, request); // just proxy in raw mode
    }
    async getStats(): Promise<Record<string, Stats>> {
        return this.stats;
    }
}