export type UpstreamChain = {
    id: number;
    name: string;
}
enum UpstreamStatus {
    height: number;
    current: number;
    startingBlock: number;
    highestBlock: number;
    isSyncing: boolean;
    isSyncing: boolean;
    // maybe add more statuses laters
}
export class Upstream {
    public status: Promise<UpstreamStatus> = Promise.resolve(UpstreamStatus.NOT_READY);
    constructor(private readonly url: string, public readonly chain: UpstreamChain) {
    }

    private async getStatus(): Promise<UpstreamStatus> {
        try {
            const response = await fetch(this.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: '{"jsonrpc":"2.0","method":"eth_syncing","params":[]}'
            });
            if (!response.ok) {
                return UpstreamStatus.NOT_READY;
            }
            const data = await response.json() as { result: boolean };
            if (data.result) {
                return UpstreamStatus.READY;
            } else {
                return UpstreamStatus.NOT_READY;
            }
        } catch (error) {
            return UpstreamStatus.NOT_READY;
        }
    }

    private async updateStatus() {
        // TODO sync status of upstream using CF key value store
        this.status = this.getStatus();
        env.KV.put(this.chain.id.toString(), this.status.toString());
    }
}