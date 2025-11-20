import { NextResponse } from "next/server";
import MovieStat from "../../../../../models/movieStat";
import { connectDB } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

export async function PATCH(request, { params }) {
  try {
    const body = await request.json();
    const type = body?.type;
    if (!["like", "dislike"].includes(type)) {
      return NextResponse.json({ error: "type must be like or dislike" }, { status: 400 });
    }

    await connectDB();
    const stat = await MovieStat.findOneAndUpdate(
      { episode: params.episode },
      { $inc: type === "like" ? { likes: 1 } : { dislikes: 1 } },
      { upsert: true, new: true }
    );

    return NextResponse.json({ stats: { likes: stat.likes, dislikes: stat.dislikes } });
  } catch (error) {
    console.error("Unable to register feedback:", error);
    return NextResponse.json({ error: "Unable to update feedback" }, { status: 500 });
  }
}
