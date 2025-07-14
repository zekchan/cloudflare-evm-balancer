import { Context, Next } from "hono";
import { FC, Child } from "hono/jsx";

const Layout: FC<{ children: Child, title?: string }> = ({ children, title = 'Admin Api response' }) => {
    return (
        <html>
            <head>
                <title>{title}</title>
                <style></style>
            </head>
            <body>{children}</body>
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
                            <td key={key}>{item[key]}</td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table >
    )
}

export async function json2htmlMiddleware(c: Context, next: Next) {
    await next();
    if (c.req.header("Accept")?.includes("text/html") && c.res.status < 300 && c.res.status >= 200 && c.res.headers.get("Content-Type")?.includes("application/json")) { // if response is json, but request is html
        const json = await c.res.json() as object | object[]
        c.res = await c.html(<Layout title={c.req.path}><JsonTable data={json} /></Layout>);
    }
}