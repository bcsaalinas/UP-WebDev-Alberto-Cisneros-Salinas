import { NextResponse } from "next/server";
import { getUserFromRequest } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }
    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth check failed:", error);
    return NextResponse.json({ error: "Unable to verify session." }, { status: 500 });
  }
}
