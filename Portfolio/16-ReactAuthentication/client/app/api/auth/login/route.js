import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "../../../../models/user";
import { connectDB } from "../../../../lib/db";
import { signAuthToken } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const email = (body?.email || "").trim().toLowerCase();
    const password = (body?.password || "").trim();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const token = await signAuthToken(user);
    return NextResponse.json({
      user: { id: user._id.toString(), name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Login failed:", error);
    return NextResponse.json({ error: "Unable to login right now." }, { status: 500 });
  }
}
