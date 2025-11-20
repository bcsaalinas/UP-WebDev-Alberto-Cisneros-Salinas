import { NextResponse } from "next/server";
import { getMoviesWithStats } from "./helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { movies, dbConnected, externalSource } = await getMoviesWithStats();
    return NextResponse.json({ movies, meta: { dbConnected, externalSource } });
  } catch (error) {
    console.error("Unable to list movies:", error);
    return NextResponse.json({ error: "Unable to load movies" }, { status: 500 });
  }
}
