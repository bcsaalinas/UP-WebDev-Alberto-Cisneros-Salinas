import { NextResponse } from "next/server";
import { getMovieWithStats } from "../helpers";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    const { movie, dbConnected, externalSource } = await getMovieWithStats(params.episode);
    if (!movie) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ movie, meta: { dbConnected, externalSource } });
  } catch (error) {
    console.error("Unable to read movie:", error);
    return NextResponse.json({ error: "Unable to load movie" }, { status: 500 });
  }
}
