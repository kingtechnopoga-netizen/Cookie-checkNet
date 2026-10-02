const express = require("express");
const helmet = require("helmet");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const SECRET = process.env.TEST_COOKIE_SECRET || "change-this-secret-before-production";

app.use(helmet());
app.use(express.json({ limit: "16kb" }));
app.use(express.static(path.join(__dirname, "public")));

function sign(value) {
  return crypto.createHmac("sha256", SECRET).update(value).digest("base64url");
}

function createTestCookie(ttlSeconds = 3600) {
  const payload = {
    type: "TEST_SESSION",
    id: crypto.randomUUID(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds
  };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encoded}.${sign(encoded)}`;
}

function validateTestCookie(token) {
  if (typeof token !== "string" || token.length > 4096) {
    return { status: "INVALID", reason: "Malformed token." };
  }

  const parts = token.split(".");
  if (parts.length !== 2) {
    return { status: "INVALID", reason: "Expected payload.signature format." };
  }

  const [encoded, suppliedSignature] = parts;
  const expected = sign(encoded);

  const a = Buffer.from(suppliedSignature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { status: "INVALID", reason: "Signature verification failed." };
  }

  let payload;
  try {
    payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  } catch {
    return { status: "INVALID", reason: "Payload is not valid JSON." };
  }

  if (payload.type !== "TEST_SESSION" || !payload.id || !payload.exp) {
    return { status: "INVALID", reason: "Unexpected test-cookie payload." };
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp <= now) {
    return {
      status: "EXPIRED",
      reason: "The test cookie has expired.",
      expiresAt: new Date(payload.exp * 1000).toISOString()
    };
  }

  return {
    status: "VALID",
    reason: "Signature and expiration are valid.",
    id: payload.id,
    issuedAt: new Date(payload.iat * 1000).toISOString(),
    expiresAt: new Date(payload.exp * 1000).toISOString()
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "test-cookie-checker" });
});

app.post("/api/test-cookie/create", (req, res) => {
  const ttl = Math.min(Math.max(Number(req.body?.ttlSeconds) || 3600, 10), 86400);
  res.json({
    cookie: createTestCookie(ttl),
    expiresInSeconds: ttl
  });
});

app.post("/api/test-cookie/check", (req, res) => {
  const result = validateTestCookie(req.body?.cookie);
  res.status(result.status === "INVALID" ? 400 : 200).json(result);
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Test-cookie checker listening on ${PORT}`);
});