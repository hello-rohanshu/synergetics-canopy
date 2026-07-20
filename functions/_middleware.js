export async function onRequest() {
  const page = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Moved</title>
      <style>
        html, body { margin:0; padding:0; height:100%; overflow:hidden; }
        * { box-sizing: border-box; }
        body { font-family: sans-serif; background:#111; color:#eee;
          display:flex; align-items:center; justify-content:center;
          min-height:100vh; text-align:center; padding:24px; }
        a { color:#7fd4ff; }
      </style>
    </head>
    <body>
      <div>
        <h2>Wrong turn — you're on an old link</h2>
        <p>This page is a leftover dev preview, not the real site.<br>
        Head to <a href="https://synergetics.pages.dev">synergetics.pages.dev</a> — that's the one you want.</p>
      </div>
    </body>
    </html>
  `;
  return new Response(page, { status: 200, headers: { "content-type": "text/html" } });
}