const express = require("express");
const path = require("path");
const {
  register,
  metricsMiddleware,
  cpuRequestDuration,
  cpuRequestTotal,
} = require("./metrics");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(metricsMiddleware);

app.use(express.static(path.join(__dirname, "public")));

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

app.get("/api/cpu", (req, res) => {
  const index = parseInt(req.query.index, 10);

  if (isNaN(index) || index < 0 || index > 48) {
    cpuRequestTotal.labels(index.toString(), "error").inc();
    return res.status(400).json({
      error: "Invalid index parameter. Index must be between 0 and 48.",
    });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  res.write(`data: ${JSON.stringify({ status: "started" })}\n\n`);

  const start = Date.now();
  const result = fibonacci(index);
  const duration = Date.now() - start;

  const durationSeconds = duration / 1000;
  cpuRequestDuration.labels(index.toString()).observe(durationSeconds);
  cpuRequestTotal.labels(index.toString(), "success").inc();

  res.write(
    `data: ${JSON.stringify({
      status: "completed",
      index,
      result,
      duration,
    })}\n\n`
  );

  res.end();
});

app.get("/metrics", async (req, res) => {
  try {
    res.set("Content-Type", register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
