
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
interface JsonRpcRequest {
    id: number;
    method: string;
    params: any[];
}
interface JsonRpcResponse {
    id: number;
    result?: any;
    error?: {
        code: number;
        message: string;
    }
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
        });
    }
    async setUrl(url: string) {
        await this.ctx.storage.put("url", url);
        await this.ctx.storage.setAlarm(Date.now() + 1000);
        this.updateHeight();
    }
    public async clearStorage() {
        await Promise.all([
            this.ctx.storage.deleteAll(),
            this.ctx.storage.deleteAlarm(),
        ]);
        this.stats = {};
    }
    async getHeight(): Promise<number | undefined> {
        return this.ctx.storage.get<number>("height");
    }
    private async request(method: string, params: any[]): Promise<JsonRpcResponse| undefined> {
        const url = await this.ctx.storage.get<string>("url");
        if (!url) {
            return;
        }
        const start = Date.now();
        const stats = this.stats[method] || { count: 0, totalTime: 0, errors: 0 };
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify({ jsonrpc: "2.0", method, params, id: 1 })
        });
        try {
            const result = await response.json<JsonRpcResponse>();
            
            if (response.ok && result.result !== undefined) {
                return result
            }
            stats.errors++;
            return;
        } catch (error) {
            stats.errors++;
            return;
        } finally {
            const end = Date.now();
            const duration = end - start;
            stats.count++;
            stats.totalTime += duration;
            this.stats[method] = stats;
        }
    }
    private async updateHeight() {
        const result = await this.request("eth_blockNumber", []);
        if (!result) {
            return;
        }
        if (result && result.result) {
            await this.ctx.storage.put("height", normalizeHeight(result.result));
        }
    }
    async alarm(): Promise<void> {
        try {
            await this.updateHeight();
            await this.saveStats();
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
        try {
            const body = await request.json<JsonRpcRequest>();
            const id = body.id;
            const response = await this.request(body.method, body.params);
            if (!response) {
                return new Response("No response from upstream", { status: 500 });
            }
            response.id = id;
            return new Response(JSON.stringify(response), { status: 200 });
        } catch (error) {
            return new Response("Invalid request", { status: 400 });
        }
    }
    async getStats(): Promise<Record<string, Stats>> {
        return this.stats;
    }
}