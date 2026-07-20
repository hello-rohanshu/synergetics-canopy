export async function onRequest(context) {
  const response = await context.next();
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("text/html")) {
    return response;
  }

  const banner = `
    <div style="position:fixed;top:0;left:0;right:0;z-index:999999;
      background:#1a1a1a;color:#fff;padding:12px 16px;text-align:center;
      font-family:sans-serif;font-size:14px;line-height:1.4;">
      This link is outdated and staged for removal — apologies for the confusion.
      Please visit <a href="https://synergetics.pages.dev" style="color:#7fd4ff;text-decoration:underline;">synergetics.pages.dev</a> for the actual site.
    </div>
    <div style="height:52px;"></div>
  `;

  let html = await response.text();
  html = html.replace(/<body([^>]*)>/i, `<body$1>${banner}`);

  return new Response(html, {
    status: response.status,
    headers: response.headers,
  });
}