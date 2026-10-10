import assert from "node:assert/strict";
import { normalizeApiBaseUrl, API_BASE, API_BASE_URL, api } from "./src/api/client.js";

console.log("Running Frontend API URL Construction Tests...\n");

// 1. Default Fallback
const fallbackDefault = normalizeApiBaseUrl(undefined);
assert.equal(fallbackDefault, "http://127.0.0.1:8000", "Fallback for undefined should be localhost");

const fallbackEmpty = normalizeApiBaseUrl("");
assert.equal(fallbackEmpty, "http://127.0.0.1:8000", "Fallback for empty string should be localhost");

const fallbackWhitespace = normalizeApiBaseUrl("   ");
assert.equal(fallbackWhitespace, "http://127.0.0.1:8000", "Fallback for whitespace should be localhost");
console.log("✓ Test 1 Passed: Localhost fallback works when VITE_API_BASE_URL is not set.");

// 2. Custom Deployed URL (generic example)
const sampleBackendUrl = "https://backend.example.com";
assert.equal(normalizeApiBaseUrl(sampleBackendUrl), sampleBackendUrl, "Configured URL should be preserved");
console.log("✓ Test 2 Passed: Custom backend URL is preserved.");

// 3. Trailing Slash Normalization
assert.equal(
  normalizeApiBaseUrl("https://backend.example.com/"),
  sampleBackendUrl,
  "Single trailing slash should be stripped"
);
assert.equal(
  normalizeApiBaseUrl("https://backend.example.com///"),
  sampleBackendUrl,
  "Multiple trailing slashes should be stripped"
);
console.log("✓ Test 3 Passed: Trailing slashes normalized safely.");

// 4. Accidental /api Suffix Normalization
assert.equal(
  normalizeApiBaseUrl("https://backend.example.com/api"),
  sampleBackendUrl,
  "Accidental /api suffix should be stripped"
);
assert.equal(
  normalizeApiBaseUrl("https://backend.example.com/api/"),
  sampleBackendUrl,
  "Accidental /api/ suffix should be stripped"
);
console.log("✓ Test 4 Passed: Accidental /api suffix stripped to match FastAPI root routes.");

// 5. Independent Endpoint Path & URL Structure Verification using exported API_BASE
const baseOrigin = new URL(API_BASE).origin;
const expectedRoutePaths = [
  "/login",
  "/signup",
  "/voice-notes/record",
  "/voice-notes/upload",
  "/transcription",
  "/summarization",
  "/voice-notes/user/1",
  "/voice-notes/1"
];

for (const expectedPath of expectedRoutePaths) {
  const endpointUrl = new URL(`${API_BASE}${expectedPath}`);

  // 1. Origin must match API_BASE origin
  assert.equal(
    endpointUrl.origin,
    baseOrigin,
    `Origin for ${expectedPath} must match API_BASE origin (${baseOrigin})`
  );

  // 2. Pathname must exactly match the expected route path
  assert.equal(
    endpointUrl.pathname,
    expectedPath,
    `Pathname must exactly match expected route path (${expectedPath})`
  );

  // 3. Pathname must not contain duplicate slashes
  assert.ok(
    !endpointUrl.pathname.includes("//"),
    `Pathname must not contain duplicate slashes: ${endpointUrl.pathname}`
  );

  // 4. Pathname must not unexpectedly contain an /api prefix
  assert.ok(
    !endpointUrl.pathname.startsWith("/api/"),
    `Pathname must not start with /api/: ${endpointUrl.pathname}`
  );
  assert.notEqual(
    endpointUrl.pathname,
    "/api",
    `Pathname must not be /api: ${endpointUrl.pathname}`
  );
}
console.log("✓ Test 5 Passed: All 8 endpoint URLs independently verified using URL class (origin, exact pathname, no double slashes, no /api prefix).");

// 6. Independent Verification of normalizeApiBaseUrl with Example URL & Endpoint Paths
const exampleRawInput = "https://backend.example.com/api///";
const normalizedExampleBase = normalizeApiBaseUrl(exampleRawInput);
assert.equal(
  normalizedExampleBase,
  "https://backend.example.com",
  "normalizeApiBaseUrl should strip trailing slashes and /api suffix"
);

const exampleOrigin = new URL(normalizedExampleBase).origin;
assert.equal(exampleOrigin, "https://backend.example.com");

for (const expectedPath of expectedRoutePaths) {
  const exampleEndpoint = new URL(`${normalizedExampleBase}${expectedPath}`);

  assert.equal(
    exampleEndpoint.origin,
    exampleOrigin,
    `Example URL origin must match (${exampleOrigin})`
  );
  assert.equal(
    exampleEndpoint.pathname,
    expectedPath,
    `Example URL pathname must match ${expectedPath}`
  );
  assert.ok(
    !exampleEndpoint.pathname.includes("//"),
    `Example URL pathname must not contain duplicate slashes: ${exampleEndpoint.pathname}`
  );
  assert.ok(
    !exampleEndpoint.pathname.startsWith("/api/"),
    `Example URL pathname must not contain /api/: ${exampleEndpoint.pathname}`
  );
}
console.log("✓ Test 6 Passed: normalizeApiBaseUrl independently verified with example URL across all endpoint paths.");

// 7. Client exports and api.getBaseUrl
assert.equal(typeof API_BASE, "string");
assert.equal(API_BASE, API_BASE_URL);
assert.equal(api.getBaseUrl(), API_BASE);
console.log("✓ Test 7 Passed: API_BASE, API_BASE_URL, and api.getBaseUrl() match.");

console.log("\nALL 7 API CLIENT URL TESTS PASSED SUCCESSFULLY!");
