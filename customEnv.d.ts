
declare namespace Cloudflare {
	interface Env {
		UPSTREAM_CONFIG: string;
		ADMIN_PASSWORD: string;
	}
}
interface Env extends Cloudflare.Env {}
