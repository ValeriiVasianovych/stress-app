const client = require("prom-client");

const register = new client.Registry();

client.collectDefaultMetrics({ register });

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const httpRequestTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [register],
});

const cpuRequestDuration = new client.Histogram({
  name: "cpu_request_duration_seconds",
  help: "Duration of CPU-intensive requests in seconds",
  labelNames: ["index"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [register],
});

const cpuRequestTotal = new client.Counter({
  name: "cpu_requests_total",
  help: "Total number of CPU requests",
  labelNames: ["index", "status"],
  registers: [register],
});

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  const route = req.route ? req.route.path : req.path;

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000; // в секундах
    const statusCode = res.statusCode;

    httpRequestDuration.labels(req.method, route, statusCode).observe(duration);

    httpRequestTotal.labels(req.method, route, statusCode).inc();
  });

  next();
};

module.exports = {
  register,
  metricsMiddleware,
  cpuRequestDuration,
  cpuRequestTotal,
};
