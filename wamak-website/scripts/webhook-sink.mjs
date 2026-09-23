// Test helper: receives LEAD_WEBHOOK_URL posts and returns them on GET /leads.
import { createServer } from "node:http";

const leads = [];
createServer((req, res) => {
  if (req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      try { leads.push(JSON.parse(body)); } catch {}
      res.writeHead(204).end();
    });
    return;
  }
  res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(leads));
}).listen(Number(process.env.SINK_PORT ?? 3199));
