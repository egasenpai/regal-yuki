/**
 * API: Admin Login
 * Simple password-based auth with JWT-like token
 */

import crypto from "node:crypto";
import { readJsonFile, writeJsonFile } from "../_lib/github-store.js";

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"; // "password"
const TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString("hex");

function hashPassword(pw) {
  return crypto.createHash("sha256").update(pw).digest("hex");
}

function generateToken() {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString("hex");
  const sig = crypto.createHmac("sha256", TOKEN_SECRET).update(`${timestamp}:${random}`).digest("hex");
  return `${timestamp}:${random}:${sig}`;
}

function verifyToken(token) {
  if (!token) return false;
  const parts = token.split(":");
  if (parts.length !== 3) return false;
  const [timestamp, random, signature] = parts;
  // Token expired after 7 days
  if (Date.now() - parseInt(timestamp) > 7 * 24 * 60 * 60 * 1000) return false;
  const expected = crypto.createHmac("sha256", TOKEN_SECRET).update(`${timestamp}:${random}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export function verifyAdminToken(req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace("Bearer ", "").trim();
  return verifyToken(token);
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { password } = req.body;
  if (!password) return res.status(400).json({ error: "Password required" });

  const hash = hashPassword(password);
  if (hash !== ADMIN_PASSWORD_HASH) {
    return res.status(401).json({ error: "Invalid password" });
  }

  const token = generateToken();
  return res.status(200).json({ success: true, token });
}
