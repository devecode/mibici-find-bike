import autocannon from "autocannon";

const base = process.env.STRESS_BASE_URL ?? "http://localhost:3000";
const stationId = Number(process.env.STRESS_STATION_ID ?? 57);

const nearbyUrl = `${base}/stations/nearby?lat=20.6736&lon=-103.344&radius=1200&limit=20&onlyAvailable=false`;
const reserveUrl = `${base}/stations/${stationId}/reserve`;

const connections = Number(process.env.STRESS_CONNECTIONS ?? 50);
const duration = Number(process.env.STRESS_DURATION ?? 20);

async function run() {
  const nearby = autocannon({
    url: nearbyUrl,
    connections,
    duration,
    pipelining: 1
  });

  const reserve = autocannon({
    url: reserveUrl,
    connections: Math.max(5, Math.floor(connections / 5)), // 20% de carga
    duration,
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ userId: "stress-user" })
  });

  nearby.on("done", (r) => console.log("NEARBY RESULT\n", r));
  reserve.on("done", (r) => console.log("RESERVE RESULT\n", r));
}

run().catch(console.error);
