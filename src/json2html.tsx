import { Context, Hono, MiddlewareHandler, Next } from "hono";
import { FC, Child } from "hono/jsx";
import { RouterRoute } from "hono/types";
const globalStyle = `
table {
    @apply border-collapse border border-gray-400 table-auto;
    @apply w-full;
}
th, td {
    @apply border border-gray-300 dark:border-gray-600;
    @apply p-2;
}
button {
    @apply bg-blue-500 text-white p-2 rounded;
    @apply cursor-pointer;
    @apply hover:bg-blue-600;
    @apply transition-colors duration-200;
    @apply border-none;
    @apply outline-none;
    @apply focus:ring-2 focus:ring-blue-500;
    @apply focus:outline-none;
    @apply focus:ring-offset-2;
    @apply focus:ring-offset-white;
}
a {
    @apply text-blue-500;
    @apply hover:text-blue-600;
    @apply transition-colors duration-200;
    @apply underline;
    @apply no-underline;
    @apply focus:outline-none;
}
` // now using it like this and it transforms on client side
const Layout: FC<{ children: Child, title?: string, routes: RouterRoute[] }> = ({ children, title = 'Admin Api response', routes = [] }) => {
    return (
        <html>
            <head>
                <title>{title}</title>
                <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" />
                <style type={"text/tailwindcss" as any} dangerouslySetInnerHTML={{ __html: globalStyle }} />
            </head>
            <body>
                <nav>
                    <ul>
                        {routes.map((route) => (
                            <li key={route.method + route.path}>
                                {route.method === 'GET' ? (
                                    <a href={route.path}>{route.method} {route.path}</a>) :
                                    (<form method='post' action={route.path}>
                                        <button type="submit">{route.method} {route.path}</button>
                                    </form>)
                                }
                            </li>
                        ))}
                    </ul>
                </nav>
                {children}</body>
        </html>
    )
}
function JsonTable(props: { data: object | object[] }) {
    const array = Array.isArray(props.data) ? props.data : [props.data];
    if (array.length === 0) {
        return <p>No data</p>;
    }
    const keys = Object.keys(array[0]);
    return (
        <table>
            <thead>
                <tr>
                    {keys.map((key) => (
                        <th key={key}>{key}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {array.map((item, idx) => (
                    <tr key={idx}>
                        {keys.map((key) => (
                            <td key={key}>{
                                Array.isArray(item[key]) || typeof item[key] === 'object' ? <JsonTable data={item[key]} /> : item[key]}
                            </td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table >
    )
}

export function json2htmlMiddleware(app: Hono): MiddlewareHandler {
    // we use app to get all routes list, so we can get navigation links
    return async (c: Context, next: Next) => {
        await next();
        if (c.req.header("Accept")?.includes("text/html") && c.res.status < 300 && c.res.status >= 200 && c.res.headers.get("Content-Type")?.includes("application/json")) { // if response is json, but request is html
            const json = await c.res.json() as object | object[]
            c.res = await c.html(<Layout title={c.req.path} routes={app.routes}><JsonTable data={json} /></Layout>);
        }
    }
}