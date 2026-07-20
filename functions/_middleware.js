export async function onRequest() {
  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>410 Gone</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0a;
      color: #888;
      font-family: system-ui, -apple-system, sans-serif;
      padding: 24px;
      text-align: center;
    }
    p { max-width: 380px; line-height: 1.6; font-size: 0.9rem; }
    a { color: #fff; text-decoration: underline; text-underline-offset: 3px; }
    a:hover { color: #7fd4ff; }
  </style>
</head>
<body>
  <p>
    You may have been misdirected here. Return back to 
    <a href="https://synergetics.pages.dev">synergetics.pages.dev</a>. 
    Feel free to use the feedback options therein.
  </p>
</body>
</html>`;

  return new Response(page, {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
