import { env } from "cloudflare:workers";


type UpstreamConfig = Array<{ chain: string, name: string, upstream: string }>;
export function getUpstreamConfig(): UpstreamConfig {
	return JSON.parse(env["UPSTREAM_CONFIG"] as string) as UpstreamConfig;
}