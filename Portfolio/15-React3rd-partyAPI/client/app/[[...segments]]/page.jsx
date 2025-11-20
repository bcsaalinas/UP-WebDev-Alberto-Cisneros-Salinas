"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  Nav,
  Navbar,
  Row,
  Spinner,
  Stack,
} from "react-bootstrap";
import {
  BrowserRouter,
  Link,
  Route,
  Routes,
  useNavigate,
  useParams,
} from "react-router-dom";

const affiliationMeta = {
  Jedi: { logo: "/images/jedi.png", side: "good" },
  Rebellion: { logo: "/images/rebel.png", side: "good" },
  Sith: { logo: "/images/sith.png", side: "evil" },
  Empire: { logo: "/images/empire.png", side: "evil" },
};

function useClientReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}

export default function SpaRouter() {
  const ready = useClientReady();

  if (!ready) {
    return (
      <div className="page-loading d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

function AppShell() {
  return (
    <div className="page-shell">
      <Navbar
        bg="dark"
        variant="dark"
        expand="md"
        className="shadow-sm sticky-top"
        data-bs-theme="dark"
      >
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold">
            Star Wars Watchlist
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="nav" />
          <Navbar.Collapse id="nav">
            <Nav className="ms-auto">
              <Nav.Link as={Link} to="/" className="fw-semibold">
                Movies
              </Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="hero-panel">
        <Container>
          <h1 className="display-5 fw-bold text-white mb-2">
            Browse the saga. React to it. Save your take.
          </h1>
          <p className="text-secondary mb-0">
            Cards now load from a Next.js API backed by MongoDB for comments and
            live like/dislike counters. Click any movie to open a routed detail
            view.
          </p>
        </Container>
      </div>

      <Container className="py-4">
        <Routes>
          <Route path="/" element={<MovieGrid />} />
          <Route path="/movie/:episode" element={<MovieDetail />} />
          <Route path="*" element={<MovieGrid />} />
        </Routes>
      </Container>
    </div>
  );
}

function MovieGrid() {
  const [movies, setMovies] = useState([]);
  const [hovered, setHovered] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dbConnected, setDbConnected] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadMovies();
  }, []);

  const loadMovies = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/movies", { cache: "no-store" });
      if (!response.ok) throw new Error("Request failed");
      const payload = await response.json();
      setMovies(payload.movies || []);
      setDbConnected(payload.meta?.dbConnected ?? true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to load movies from the API");
    } finally {
      setLoading(false);
    }
  };

  const handleFeedback = async (episode, type) => {
    const field = type === "like" ? "likes" : "dislikes";
    setMovies((prev) =>
      prev.map((movie) =>
        movie.episode === episode
          ? {
              ...movie,
              stats: {
                ...(movie.stats || {}),
                [field]: (movie.stats?.[field] || 0) + 1,
              },
            }
          : movie
      )
    );

    try {
      const response = await fetch(`/api/movies/${episode}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (response.ok) {
        const payload = await response.json();
        setMovies((prev) =>
          prev.map((movie) =>
            movie.episode === episode
              ? { ...movie, stats: payload.stats }
              : movie
          )
        );
      }
    } catch (err) {
      console.error("Unable to register feedback", err);
    }
  };

  if (loading) {
    return (
      <section className="py-5 d-flex justify-content-center">
        <Spinner animation="grow" variant="light" />
      </section>
    );
  }

  return (
    <section>
      {error && (
        <Alert
          variant="danger"
          className="mb-3 d-flex align-items-center justify-content-between"
        >
          <span>{error}</span>
          <Button size="sm" variant="outline-light" onClick={loadMovies}>
            Retry
          </Button>
        </Alert>
      )}
      {!dbConnected && (
        <Alert variant="warning" className="mb-3">
          MongoDB connection not detected. You can still interact, but likes and
          comments may not persist until the DB is available.
        </Alert>
      )}
      <Row className="g-4">
        {movies.map((movie) => (
          <Col key={movie.episode} xs={12} sm={6} lg={4}>
            <MovieCard
              movie={movie}
              hovered={hovered}
              onHover={setHovered}
              onLeave={() => setHovered(null)}
              onSelect={(episode) => navigate(`/movie/${episode}`)}
              onFeedback={handleFeedback}
            />
          </Col>
        ))}
      </Row>
    </section>
  );
}

function MovieCard({ movie, hovered, onHover, onLeave, onSelect, onFeedback }) {
  const meta = affiliationMeta[movie.best_character.affiliation] || {};
  const isHovered = hovered === movie.episode;
  const stats = movie.stats || { likes: 0, dislikes: 0 };
  const imgSrc = isHovered && meta.logo ? meta.logo : `/images/${movie.poster}`;
  const sideClass = meta.side ? `${meta.side}-side` : "";
  const preview = useMemo(() => {
    const text = movie.extra?.opening_crawl || movie.best_character.bio;
    return text.length > 140 ? `${text.slice(0, 140)}…` : text;
  }, [movie]);

  return (
    <Card
      className={`movie-card h-100 shadow-sm ${isHovered ? sideClass : ""}`}
      onMouseEnter={() => onHover(movie.episode)}
      onMouseLeave={onLeave}
    >
      <div className="poster-wrap">
        <Card.Img
          className={`poster ${isHovered ? "logo" : ""}`}
          src={imgSrc}
          alt={movie.title}
        />
      </div>
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div>
            <Card.Title className="mb-0 text-white">{movie.title}</Card.Title>
            <small className="text-secondary">
              Episode {movie.episode} · {movie.year}
            </small>
          </div>
          <Badge bg={meta.side === "evil" ? "danger" : "primary"}>
            {movie.best_character.affiliation}
          </Badge>
        </div>
        <p className="text-secondary small flex-grow-1">{preview}</p>
        <Stack direction="horizontal" gap={2} className="mt-2">
          <Button
            variant="outline-light"
            size="sm"
            onClick={() => onSelect(movie.episode)}
          >
            Details
          </Button>
          <Stack direction="horizontal" gap={1} className="ms-auto">
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => onFeedback(movie.episode, "like")}
            >
              👍 {stats.likes}
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onFeedback(movie.episode, "dislike")}
            >
              👎 {stats.dislikes}
            </Button>
          </Stack>
        </Stack>
      </Card.Body>
    </Card>
  );
}

function MovieDetail() {
  const { episode } = useParams();
  const navigate = useNavigate();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentError, setCommentError] = useState(null);
  const [form, setForm] = useState({ name: "", text: "" });
  const [saving, setSaving] = useState(false);
  const [dbConnected, setDbConnected] = useState(true);

  useEffect(() => {
    loadMovie();
    loadComments();
  }, [episode]);

  const loadMovie = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/movies/${episode}`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Request failed");
      const payload = await response.json();
      setMovie(payload.movie);
      setDbConnected(payload.meta?.dbConnected ?? true);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to load this movie from the API");
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await fetch(`/api/movies/${episode}/comments`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Request failed");
      const payload = await response.json();
      const normalized = (payload.comments || []).map((item) =>
        normalizeComment(item)
      );
      setComments(normalized);
      setCommentError(null);
    } catch (err) {
      console.error(err);
      setCommentError("Comments service is unavailable right now.");
    }
  };

  const handleFeedback = async (type) => {
    if (!movie) return;
    const field = type === "like" ? "likes" : "dislikes";
    setMovie((prev) => ({
      ...prev,
      stats: {
        ...(prev?.stats || {}),
        [field]: (prev?.stats?.[field] || 0) + 1,
      },
    }));
    try {
      const response = await fetch(`/api/movies/${episode}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (response.ok) {
        const payload = await response.json();
        setMovie((prev) => ({ ...prev, stats: payload.stats }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const name = form.name.trim();
    const text = form.text.trim();
    if (!name || !text) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/movies/${episode}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, text }),
      });

      if (!response.ok) throw new Error("Request failed");
      const payload = await response.json();
      const created = normalizeComment(payload.comment);
      setComments((prev) => [created, ...prev]);
      setForm({ name: "", text: "" });
      setCommentError(null);
    } catch (err) {
      console.error(err);
      setCommentError("Unable to save your comment right now.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="py-5 d-flex justify-content-center">
        <Spinner animation="border" variant="light" />
      </section>
    );
  }

  if (error || !movie) {
    return (
      <section className="py-4">
        <Alert variant="danger" className="mb-3">
          {error || "Movie not found."}
        </Alert>
        <Button variant="outline-light" onClick={() => navigate("/")}>
          Back to list
        </Button>
      </section>
    );
  }

  const meta = affiliationMeta[movie.best_character.affiliation] || {};
  const stats = movie.stats || { likes: 0, dislikes: 0 };

  return (
    <section className="detail-section">
      <Button
        variant="outline-light"
        size="sm"
        onClick={() => navigate(-1)}
        className="mb-3"
      >
        ← Back
      </Button>
      {!dbConnected && (
        <Alert variant="warning" className="mb-3">
          MongoDB connection not detected. Comments will not persist until the
          DB is available.
        </Alert>
      )}
      <Card className="detail-card shadow-sm">
        <Row className="g-0 align-items-stretch">
          <Col md={5}>
            <div className="detail-image-wrap">
              <img
                className="img-fluid h-100 object-cover rounded-start"
                src={`/images/${movie.best_character.image}`}
                alt={movie.best_character.name}
              />
            </div>
          </Col>
          <Col md={7} className="p-4 d-flex flex-column gap-3">
            <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
              <div>
                <Card.Title className="text-white h3 mb-1">
                  Episode {movie.episode}: {movie.title} ({movie.year})
                </Card.Title>
                <div className="text-secondary small">
                  Featured: {movie.best_character.name}
                  {movie.extra?.title && ` · Canon title: ${movie.extra.title}`}
                </div>
              </div>
              <Badge
                bg={meta.side === "evil" ? "danger" : "primary"}
                className="fs-6"
              >
                {movie.best_character.affiliation}
              </Badge>
            </div>

            {movie.extra?.opening_crawl && (
              <p className="text-light small fst-italic mb-0">
                "{movie.extra.opening_crawl}"
              </p>
            )}
            <p className="text-light small mb-0">{movie.best_character.bio}</p>

            <div className="d-flex align-items-center gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={() => handleFeedback("like")}
              >
                👍 Like ({stats.likes})
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleFeedback("dislike")}
              >
                👎 Dislike ({stats.dislikes})
              </Button>
              {movie.extra && (
                <div className="ms-auto text-secondary small text-end">
                  Director: {movie.extra.director} <br />
                  Released: {movie.extra.release_date}
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Card>

      <Card className="detail-card shadow-sm mt-4">
        <Card.Body>
          <div className="d-flex justify-content-between flex-wrap gap-2 align-items-center mb-3">
            <div>
              <Card.Title className="text-white h5 mb-0">Comments</Card.Title>
              <small className="text-secondary">
                Share your thoughts. We save them to Mongo so they survive
                reloads.
              </small>
            </div>
            <Button variant="outline-light" size="sm" onClick={loadComments}>
              Refresh
            </Button>
          </div>

          {commentError && (
            <Alert variant="danger" className="mb-3">
              {commentError}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row className="g-2 align-items-end">
              <Col md={4}>
                <Form.Label className="text-white" htmlFor="commentName">
                  Your name
                </Form.Label>
                <Form.Control
                  id="commentName"
                  type="text"
                  placeholder="Your name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Col>
              <Col md={6}>
                <Form.Label className="text-white" htmlFor="commentText">
                  Share your thoughts
                </Form.Label>
                <Form.Control
                  id="commentText"
                  as="textarea"
                  placeholder="Share your thoughts"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  style={{ height: "110px" }}
                  required
                />
              </Col>
              <Col md={2} className="d-grid">
                <Button
                  variant="primary"
                  type="submit"
                  className="h-100"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Post"}
                </Button>
              </Col>
            </Row>
          </Form>

          <div className="d-grid gap-2 mt-3">
            {comments.length === 0 && (
              <p className="text-secondary mb-0">No comments yet.</p>
            )}
            {comments.map((entry) => (
              <div className="comment-card" key={entry.id}>
                <div className="d-flex justify-content-between align-items-start">
                  <p className="fw-semibold mb-0 text-white">{entry.name}</p>
                  <small className="text-secondary">{entry.createdAt}</small>
                </div>
                <p className="mb-0 text-light small">{entry.text}</p>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>
    </section>
  );
}

function normalizeComment(entry) {
  return {
    id:
      entry._id?.toString?.() ||
      entry.id ||
      `${entry.name}-${entry.text}-${entry.createdAt || ""}`,
    name: entry.name,
    text: entry.text,
    createdAt: entry.createdAt
      ? new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
        }).format(new Date(entry.createdAt))
      : "",
  };
}
