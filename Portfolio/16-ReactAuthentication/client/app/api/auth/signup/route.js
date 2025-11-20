import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import User from "../../../../models/user";
import { connectDB } from "../../../../lib/db";
import { signAuthToken } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const name = (body?.name || "").trim();
    const email = (body?.email || "").trim().toLowerCase();
    const password = (body?.password || "").trim();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }

    await connectDB();
    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json({ error: "Account already exists." }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await User.create({ name, email, passwordHash });
    const token = await signAuthToken(created);

    return NextResponse.json(
      {
        user: { id: created._id.toString(), name: created.name, email: created.email },
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup failed:", error);
    return NextResponse.json({ error: "Unable to sign up right now." }, { status: 500 });
  }
}
