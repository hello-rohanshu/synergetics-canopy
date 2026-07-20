export async function onRequest() {
  const page = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Moved</title>
      <style>
        body { font-family: sans-serif; background:#111; color:#eee;
          display:flex; align-items:center; justify-content:center;
          height:100vh; margin:0; text-align:center; padding:20px; }
        a { color:#7fd4ff; }
      </style>
    </head>
    <body>
      <div>
        <h2>This link is outdated</h2>
        <p>This preview site is being retired.<br>
        Please visit <a href="https://synergetics.pages.dev">synergetics.pages.dev</a> for the actual site.</p>
      </div>
    </body>
    </html>
  `;
  return new Response(page, { status: 200, headers: { "content-type": "text/html" } });
}