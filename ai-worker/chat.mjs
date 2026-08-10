import readline from 'readline';

const WORKER_URL = "https://synergetics-worker.rohanshu.workers.dev";

async function ask(query) {
  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  let fullResponse = "";
  let lastPrintLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const text = decoder.decode(value);
    const lines = text.split("\n");
    
    for (const line of lines) {
      if (line.startsWith("data: ") && line !== "data: [DONE]") {
        const data = JSON.parse(line.slice(6));
        fullResponse += data.response;
        // Only print the new part, not the whole thing
        const newPart = fullResponse.slice(lastPrintLength);
        process.stdout.write(newPart);
        lastPrintLength = fullResponse.length;
      }
    }
  }

  console.log("\n");
}

// Interactive loop
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> "
});

console.log('=== Synergetics Chat ===');
console.log('Type "exit" to quit\n');

rl.prompt();

rl.on("line", async (line) => {
  const query = line.trim();
  if (!query) {
    rl.prompt();
    return;
  }
  if (query.toLowerCase() === "exit") {
    console.log("Goodbye!");
    process.exit(0);
  }
  await ask(query);
  rl.prompt();
});