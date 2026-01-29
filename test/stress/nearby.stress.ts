import autocannon from "autocannon";

const url = process.env.STRESS_URL
  ?? "http://localhost:3000/stations/nearby?lat=20.6736&lon=-103.344&radius=1200&limit=20&onlyAvailable=false";

const connections = Number(process.env.STRESS_CONNECTIONS ?? 50);
const duration = Number(process.env.STRESS_DURATION ?? 20);

autocannon(
  {
    url,
    connections,
    duration,
    pipelining: 1
  },
  (err, result) => {
    if (err) throw err;
    console.log(result);
  }
);
