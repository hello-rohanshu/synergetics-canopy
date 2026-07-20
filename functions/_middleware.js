export async function onRequest() {
  const page = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>410 Gone</title>
  <style>
    * { box-sizing: border-box; }
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
    main {
      max-width: 380px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .status-code {
      font-size: 1.1rem;
      font-weight: 600;
      color: #fff;
      letter-spacing: 0.05em;
      opacity: 0.9;
    }
    p {
      margin: 0;
      line-height: 1.6;
      font-size: 0.95rem;
    }
    a {
      color: #fff;
      text-decoration: underline;
      text-underline-offset: 4px;
      transition: color 0.15s ease;
    }
    a:hover {
      color: #7fd4ff;
    }
  </style>
</head>
<body>
  <main>
    <div class="status-code">410</div>
    <p>You may have been misdirected here. This preview site is staged for retirement.</p>
    <p>Return back to <a href="https://synergetics.pages.dev">synergetics.pages.dev</a>. Feel free to use the feedback options therein. Have a great day.</p>
  </main>
</body>
</html>`;

  return new Response(page, {
    status: 410,
    headers: { "content-type": "text/html; charset=utf-8" }
  });
}
