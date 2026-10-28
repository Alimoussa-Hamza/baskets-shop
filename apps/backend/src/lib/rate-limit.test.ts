import test from "node:test"
import assert from "node:assert/strict"
import { createLimiter } from "./rate-limit.ts"

test("bloque au-delà du maximum puis rouvre après la fenêtre", () => {
  const limit = createLimiter(2, 1000)
  assert.equal(limit("ip", 0).allowed, true)
  assert.equal(limit("ip", 10).allowed, true)
  const blocked = limit("ip", 20)
  assert.equal(blocked.allowed, false)
  assert.equal(blocked.retryAfterSec, 1)
  assert.equal(limit("ip", 1001).allowed, true)
  assert.equal(limit("autre", 20).allowed, true)
})
