
interface LatencyStats {
  count: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
}

function calcStats(durationsMs: number[]): LatencyStats {
  if (durationsMs.length === 0) {
    return { count: 0, min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 };
  }
  const sorted = [...durationsMs].sort((a, b) => a - b);
  const total = sorted.reduce((acc, val) => acc + val, 0);
  const percentile = (p: number) => sorted[Math.floor((sorted.length - 1) * p)];
  return {
    count: sorted.length,
    min: sorted[0],
    max: sorted[sorted.length - 1],
    mean: total / sorted.length,
    p50: percentile(0.50),
    p95: percentile(0.95),
    p99: percentile(0.99),
  };
}

async function runWSBenchmark(endpoint: string, concurrency: number) {
  console.log(`\n>>> Testing ${concurrency} Concurrent WebSocket Connections against ${endpoint}`);
  const connectTimes: number[] = [];
  const sockets: any[] = [];

  const startAll = performance.now();

  const connectPromises = Array.from({ length: concurrency }).map((_, idx) => {
    return new Promise<void>((resolve, reject) => {
      const t0 = performance.now();
      const ws = new WebSocket(`${endpoint}?workspaceId=ws-bench-room&userId=user-${idx}`);
      ws.onopen = () => {
        connectTimes.push(performance.now() - t0);
        sockets.push(ws);
        resolve();
      };
      ws.onerror = (err) => {
        reject(err);
      };
    });
  });

  await Promise.all(connectPromises);
  const wallTime = performance.now() - startAll;
  const stats = calcStats(connectTimes);

  console.log(`Connected: ${sockets.length}/${concurrency} sockets in ${wallTime.toFixed(2)}ms`);
  console.log(`Handshake Latency: min=${stats.min.toFixed(2)}ms | p50=${stats.p50.toFixed(2)}ms | p95=${stats.p95.toFixed(2)}ms | p99=${stats.p99.toFixed(2)}ms | mean=${stats.mean.toFixed(2)}ms`);

  // Close all sockets cleanly
  for (const ws of sockets) {
    ws.close();
  }
}

async function main() {
  const endpoint = process.argv[2] || "ws://35.244.37.227:30001/ws";
  console.log("================================================================================");
  console.log("COLLABIFY — REMOTE WEBSOCKET CONCURRENCY & CONNECTION BENCHMARK");
  console.log(`Target: ${endpoint}`);
  console.log("================================================================================");

  await runWSBenchmark(endpoint, 10);
  await runWSBenchmark(endpoint, 25);
  await runWSBenchmark(endpoint, 50);
  await runWSBenchmark(endpoint, 100);

  console.log("\n[✓] WebSocket benchmark complete.");
  process.exit(0);
}

main().catch(console.error);
