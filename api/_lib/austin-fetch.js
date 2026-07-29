import crypto from "node:crypto";
import { Agent, fetch as undiciFetch } from "undici";
const ipv4Agent = new Agent({
  connect: {
    family: 4,
  },
});

export function austinFetch(url, options = {}) {
  return undiciFetch(url, { ...options, dispatcher: ipv4Agent });
}

export function signRequest(method, path, body, secret) {
  const timestamp = Date.now().toString();
  const payload = `${String(method).toUpperCase()}\n${path}\n${body || ""}\n${timestamp}`;
  const signature = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return { timestamp, signature };
}

export function austinFetchSigned(baseUrl, path, options = {}, apiKey, apiSecret) {
  const method = options.method || "GET";
  const body = typeof options.body === "string" ? options.body : "";

  const headers = {
    ...(options.headers || {}),
    "X-Api-Key": apiKey,
  };

  if (apiSecret) {
    const { timestamp, signature } = signRequest(method, path, body, apiSecret);
    headers["X-Timestamp"] = timestamp;
    headers["X-Signature"] = signature;
  }

  return austinFetch(`${baseUrl}${path}`, { ...options, method, headers });
}
