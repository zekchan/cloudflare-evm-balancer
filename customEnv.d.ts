
declare namespace Cloudflare {
	interface Env {
		UPSTREAM_CONFIG: string;
	}
}
interface Env extends Cloudflare.Env {}
