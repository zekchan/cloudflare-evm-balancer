import { env } from "cloudflare:workers";

/**
 * Extracts the keys from the Env interface whose values are of type DurableObjectNamespace.
 */
type DurableObjectNamespaceKeys<T> = {
    [K in keyof T]: T[K] extends DurableObjectNamespace<any> ? K : never
}[keyof T];

type DOEnumKeys = DurableObjectNamespaceKeys<Env>;

export function getDONameSpace<T extends Rpc.DurableObjectBranded>(name: DOEnumKeys) {
    const DO = env[name];
    return DO as unknown as DurableObjectNamespace<T>;
}