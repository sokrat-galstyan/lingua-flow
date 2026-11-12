export async function api<T = any>(
  path: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const r = await fetch("/api/" + path, {
    method: method || (body ? "POST" : "GET"),
    headers: body
      ? { "Content-Type": "application/json", "X-English-Client": "1" }
      : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.message || "Request failed");
  return data;
}
export const docLink = (path: string) =>
  "/document?path=" + encodeURIComponent(path);
