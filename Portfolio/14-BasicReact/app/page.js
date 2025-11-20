"use client";

import { useState } from "react";
import movies from "./data/sw";

const affiliationMeta = {
  Jedi: { logo: "/images/jedi.png", side: "good" },
  Rebellion: { logo: "/images/rebel.png", side: "good" },
  Sith: { logo: "/images/sith.png", side: "evil" },
  Empire: { logo: "/images/empire.png", side: "evil" },
};

const makeCounts = () =>
  movies.reduce((acc, movie) => {
    acc[movie.episode] = { likes: 0, dislikes: 0 };
    return acc;
  }, {});

const makeComments = () =>
  movies.reduce((acc, movie) => {
    acc[movie.episode] = [];
    return acc;
  }, {});

export default function Home() {
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [counts, setCounts] = useState(makeCounts);
  const [comments, setComments] = useState(makeComments);
  const [form, setForm] = useState({ name: "", text: "" });

  const handleVote = (episode, type) => {
    setCounts((prev) => ({
      ...prev,
      [episode]: {
        ...prev[episode],
        [type]: prev[episode][type] + 1,
      },
    }));
  };

  const handleMore = (movie) => {
    setSelected(movie);
    setForm({ name: "", text: "" });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selected) return;
    const name = form.name.trim();
    const text = form.text.trim();
    if (!name || !text) return;
    setComments((prev) => ({
      ...prev,
      [selected.episode]: [...prev[selected.episode], { name, text }],
    }));
    setForm({ name: "", text: "" });
  };

  const detailComments = selected ? comments[selected.episode] : [];

  return (
    <main className="container py-4">
      <header className="mb-3">
        <h1 className="fw-bold text-white mb-1">Star Wars Watchlist</h1>
        <p className="text-secondary mb-0">
          Hover a card to swap the poster for the faction logo. Click “More...” to see the character and add your
          comment.
        </p>
      </header>

      <div className="row g-3">
        {movies.map((movie) => {
          const meta = affiliationMeta[movie.best_character.affiliation] || {};
          const isHovered = hovered === movie.episode;
          const sideClass =
            isHovered && meta.side ? (meta.side === "good" ? "good-side" : "evil-side") : "";
          const imgSrc = isHovered && meta.logo ? meta.logo : `/images/${movie.poster}`;
          return (
            <div className="col-12 col-sm-6 col-md-4" key={movie.episode}>
              <div
                className={`card h-100 shadow-sm movie-card ${sideClass}`}
                onMouseEnter={() => setHovered(movie.episode)}
                onMouseLeave={() => setHovered(null)}
              >
                <div className="poster-wrap">
                  <img className={`poster ${isHovered ? "logo" : ""}`} src={imgSrc} alt={movie.title} />
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="mb-2">
                    <h5 className="card-title mb-0 text-white">{movie.title}</h5>
                    <small className="text-secondary">{movie.year}</small>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-auto">
                    <button className="btn btn-primary btn-sm" type="button" onClick={() => handleMore(movie)}>
                      More...
                    </button>
                    <div className="btn-group btn-group-sm">
                      <button
                        className="btn btn-outline-success"
                        type="button"
                        onClick={() => handleVote(movie.episode, "likes")}
                      >
                        👍 {counts[movie.episode].likes}
                      </button>
                      <button
                        className="btn btn-outline-danger"
                        type="button"
                        onClick={() => handleVote(movie.episode, "dislikes")}
                      >
                        👎 {counts[movie.episode].dislikes}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selected && (
        <div className="card detail-card mt-4">
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3">
              <h2 className="h4 text-white mb-0">
                Episode {selected.episode}: {selected.title} ({selected.year})
              </h2>
              <span
                className={`badge rounded-pill ${
                  affiliationMeta[selected.best_character.affiliation]?.side === "good"
                    ? "text-bg-primary"
                    : "text-bg-danger"
                }`}
              >
                {selected.best_character.affiliation}
              </span>
            </div>
            <div className="row g-3 align-items-center">
              <div className="col-12 col-md-5">
                <img
                  className="img-fluid rounded"
                  src={`/images/${selected.best_character.image}`}
                  alt={selected.best_character.name}
                />
              </div>
              <div className="col-12 col-md-7">
                <h3 className="h5 text-white">{selected.best_character.name}</h3>
                <p className="text-light small mb-0">{selected.best_character.bio}</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h4 className="h6 text-white mb-0">Comments</h4>
              </div>
              <div className="d-grid gap-2">
                {detailComments.length === 0 && (
                  <p className="text-secondary small mb-0">No comments yet. Be the first!</p>
                )}
                {detailComments.map((entry, idx) => (
                  <div className="comment-card" key={`${entry.name}-${idx}`}>
                    <p className="fw-semibold mb-1 text-white">{entry.name}</p>
                    <p className="mb-0 text-light small">{entry.text}</p>
                  </div>
                ))}
              </div>
              <form className="mt-3" onSubmit={handleSubmit}>
                <div className="mb-2">
                  <input
                    className="form-control"
                    name="name"
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-2">
                  <textarea
                    className="form-control"
                    name="text"
                    placeholder="Share your thoughts..."
                    value={form.text}
                    onChange={(e) => setForm({ ...form, text: e.target.value })}
                    required
                  />
                </div>
                <button className="btn btn-success btn-sm" type="submit">
                  Post comment
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
