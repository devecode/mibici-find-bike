import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { request } from "undici";
import { setInventory, getInventory } from "../helpers/db.js";
import { buildApp } from "../../src/app.js";


describe("Race condition: reserve endpoint", () => {
  const stationId = 57;
  let app: ReturnType<typeof buildApp>;
  let baseUrl = "";

  beforeAll(async () => {
    app = await buildApp();
    await app.listen({ port: 0, host: "127.0.0.1" }); // random free port
    const addr = app.server.address();
    const port = typeof addr === "object" && addr ? addr.port : 0;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it("should allow only 1 successful reservation when bikes=1 and 50 requests hit concurrently", async () => {
    await setInventory(stationId, 1, 10);

    const body = JSON.stringify({ userId: "race-user" });

    const promises = Array.from({ length: 50 }).map(() =>
      request(`${baseUrl}/stations/${stationId}/reserve`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body
      }).then(async (r) => {
        const text = await r.body.text();
        return { statusCode: r.statusCode, body: text };
      })
    );

    const results = await Promise.all(promises);

    const okCount = results.filter(r => r.statusCode === 200).length;
    const conflictCount = results.filter(r => r.statusCode === 409).length;

    expect(okCount).toBe(1);
    expect(conflictCount).toBe(49);

    const inv = await getInventory(stationId);
    expect(inv.available_bikes).toBe(0);
  });
});
