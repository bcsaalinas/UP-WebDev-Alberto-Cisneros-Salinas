import mongoose from "mongoose";

const CommentSchema = new mongoose.Schema(
  {
    episode: { type: String, required: true, index: true },
    name: { type: String, required: true },
    text: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Comment || mongoose.model("Comment", CommentSchema);
