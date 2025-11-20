import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import User from "../models/user";
import { connectDB } from "./db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

export async function signAuthToken(user) {
  const payload = { id: user._id.toString(), name: user.name, email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function getUserFromRequest(request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  const token = parts[1];
  const decoded = verifyToken(token);
  if (!decoded) return null;

  await connectDB();
  const user = await User.findById(decoded.id).lean();
  if (!user) return null;
  return { id: user._id.toString(), name: user.name, email: user.email };
}

export async function requireUser(request) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, user };
}
