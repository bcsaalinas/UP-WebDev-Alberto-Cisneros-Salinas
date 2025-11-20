import mongoose from "mongoose";

const MovieStatSchema = new mongoose.Schema(
  {
    episode: { type: String, required: true, unique: true },
    likes: { type: Number, default: 0 },
    dislikes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.models.MovieStat || mongoose.model("MovieStat", MovieStatSchema);
