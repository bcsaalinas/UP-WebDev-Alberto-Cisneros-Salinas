import { NextResponse } from "next/server";
import Comment from "../../../../../models/comment";
import { connectDB } from "../../../../../lib/db";
import { requireUser } from "../../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  try {
    await connectDB();
    const comments = await Comment.find({ episode: params.episode }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ comments });
  } catch (error) {
    console.error("Unable to load comments:", error);
    return NextResponse.json({ error: "Unable to load comments" }, { status: 503 });
  }
}

export async function POST(request, { params }) {
  try {
    const auth = await requireUser(request);
    if (!auth.ok) return auth.response;

    await connectDB();
    const body = await request.json();
    const name = (body?.name || "").trim();
    const text = (body?.text || "").trim();

    const finalName = name || auth.user.name;
    if (!finalName || !text) {
      return NextResponse.json({ error: "Name and comment are required" }, { status: 400 });
    }

    const created = await Comment.create({
      episode: params.episode,
      name: finalName,
      text,
    });

    return NextResponse.json(
      {
        comment: {
          id: created._id.toString(),
          episode: created.episode,
          name: created.name,
          text: created.text,
          createdAt: created.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unable to save comment:", error);
    return NextResponse.json({ error: "Unable to save comment" }, { status: 500 });
  }
}
