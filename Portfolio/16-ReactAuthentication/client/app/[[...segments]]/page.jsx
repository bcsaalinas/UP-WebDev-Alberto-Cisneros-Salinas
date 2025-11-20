"use client";

import { useEffect, useMemo, useState } from "react";
import { Provider, useDispatch, useSelector } from "react-redux";
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
import { BrowserRouter, Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import store from "../../store";
import { addComment, loadComments, loadMovieDetail, loadMovies, sendFeedback } from "../../store/movies";
import { checkSession, loginUser, logoutUser, signupUser } from "../../store/auth";

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
    <Provider store={store}>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </Provider>
  );
}

function AppShell() {
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(checkSession());
  }, [dispatch]);

  return (
    <div className="page-shell">
      <Navbar bg="dark" variant="dark" expand="md" className="shadow-sm sticky-top" data-bs-theme="dark">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold">
            Star Wars Watchlist
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="nav" />
          <Navbar.Collapse id="nav">
            <Nav className="ms-auto align-items-center gap-2">
              <Nav.Link as={Link} to="/" className="fw-semibold">
                Movies
              </Nav.Link>
              {!auth.user && (
                <Button as={Link} to="/auth" size="sm" variant="outline-light">
                  Login / Sign up
                </Button>
              )}
              {auth.user && (
                <Stack direction="horizontal" gap={2} className="align-items-center">
                  <span className="text-secondary small mb-0">{auth.user.name}</span>
                  <Button size="sm" variant="outline-warning" onClick={() => dispatch(logoutUser())}>
                    Logout
                  </Button>
                </Stack>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <div className="hero-panel">
        <Container>
          <h1 className="display-6 fw-bold text-white mb-2">Login to react, like, and comment on the saga.</h1>
          <p className="text-secondary mb-0">
            Anonymous users can browse. Authenticated users can add comments and likes. State is handled with Redux +
            Thunk.
          </p>
        </Container>
      </div>

      <Container className="py-4">
        <Routes>
          <Route path="/" element={<MovieGrid />} />
          <Route path="/movie/:episode" element={<MovieDetail />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={<MovieGrid />} />
        </Routes>
      </Container>
    </div>
  );
}

function MovieGrid() {
  const dispatch = useDispatch();
  const moviesState = useSelector((state) => state.movies);
  const auth = useSelector((state) => state.auth);
  const [hovered, setHovered] = useState(null);
  const [warn, setWarn] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(loadMovies());
  }, [dispatch]);

  const handleFeedback = async (episode, type) => {
    if (!auth.user) {
      setWarn("Please login to vote.");
      return;
    }
    setWarn("");
    dispatch(sendFeedback(episode, type));
  };

  if (moviesState.loading) {
    return (
      <section className="py-5 d-flex justify-content-center">
        <Spinner animation="grow" variant="light" />
      </section>
    );
  }

  return (
    <section>
      {moviesState.error && (
        <Alert variant="danger" className="mb-3 d-flex align-items-center justify-content-between">
          <span>{moviesState.error}</span>
          <Button size="sm" variant="outline-light" onClick={() => dispatch(loadMovies())}>
            Retry
          </Button>
        </Alert>
      )}
      {!moviesState.dbConnected && (
        <Alert variant="warning" className="mb-3">
          MongoDB connection not detected. Likes and comments need the DB to persist.
        </Alert>
      )}
      {warn && (
        <Alert variant="info" className="mb-3">
          {warn}
        </Alert>
      )}
      <Row className="g-4">
        {moviesState.list.map((movie) => (
          <Col key={movie.episode} xs={12} sm={6} lg={4}>
            <MovieCard
              movie={movie}
              hovered={hovered}
              onHover={setHovered}
              onLeave={() => setHovered(null)}
              onSelect={(episode) => navigate(`/movie/${episode}`)}
              onFeedback={handleFeedback}
              canInteract={!!auth.user}
            />
          </Col>
        ))}
      </Row>
    </section>
  );
}

function MovieCard({ movie, hovered, onHover, onLeave, onSelect, onFeedback, canInteract }) {
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
        <Card.Img className={`poster ${isHovered ? "logo" : ""}`} src={imgSrc} alt={movie.title} />
      </div>
      <Card.Body className="d-flex flex-column">
        <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
          <div>
            <Card.Title className="mb-0 text-white">{movie.title}</Card.Title>
            <small className="text-secondary">
              Episode {movie.episode} · {movie.year}
            </small>
          </div>
          <Badge bg={meta.side === "evil" ? "danger" : "primary"}>{movie.best_character.affiliation}</Badge>
        </div>
        <p className="text-secondary small flex-grow-1">{preview}</p>
        <Stack direction="horizontal" gap={2} className="mt-2">
          <Button variant="outline-light" size="sm" onClick={() => onSelect(movie.episode)}>
            Details
          </Button>
          <Stack direction="horizontal" gap={1} className="ms-auto">
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => onFeedback(movie.episode, "like")}
              disabled={!canInteract}
            >
              👍 {stats.likes}
            </Button>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => onFeedback(movie.episode, "dislike")}
              disabled={!canInteract}
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
  const dispatch = useDispatch();
  const auth = useSelector((state) => state.auth);
  const moviesState = useSelector((state) => state.movies);
  const [form, setForm] = useState({ text: "" });

  const movie = moviesState.detail;
  const comments = moviesState.comments;

  useEffect(() => {
    dispatch(loadMovieDetail(episode));
    dispatch(loadComments(episode));
  }, [dispatch, episode]);

  const handleFeedback = (type) => {
    if (!auth.user) return;
    dispatch(sendFeedback(episode, type));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const text = form.text.trim();
    if (!text) return;
    dispatch(addComment(episode, { text, name: auth.user?.name || "" }));
    setForm({ text: "" });
  };

  if (moviesState.detailLoading) {
    return (
      <section className="py-5 d-flex justify-content-center">
        <Spinner animation="border" variant="light" />
      </section>
    );
  }

  if (moviesState.detailError || !movie) {
    return (
      <section className="py-4">
        <Alert variant="danger" className="mb-3">
          {moviesState.detailError || "Movie not found."}
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
      <Button variant="outline-light" size="sm" onClick={() => navigate(-1)} className="mb-3">
        ← Back
      </Button>
      {!moviesState.dbConnected && (
        <Alert variant="warning" className="mb-3">
          MongoDB connection not detected. Comments will not persist until the DB is available.
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
              <Badge bg={meta.side === "evil" ? "danger" : "primary"} className="fs-6">
                {movie.best_character.affiliation}
              </Badge>
            </div>

            {movie.extra?.opening_crawl && (
              <p className="text-light small fst-italic mb-0">"{movie.extra.opening_crawl}"</p>
            )}
            <p className="text-light small mb-0">{movie.best_character.bio}</p>

            <div className="d-flex align-items-center gap-2">
              <Button variant="success" size="sm" onClick={() => handleFeedback("like")} disabled={!auth.user}>
                👍 Like ({stats.likes})
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleFeedback("dislike")}
                disabled={!auth.user}
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
              <small className="text-secondary">Login to add your own. We save them to Mongo.</small>
            </div>
            <Button variant="outline-light" size="sm" onClick={() => dispatch(loadComments(episode))}>
              Refresh
            </Button>
          </div>

          {moviesState.commentsError && (
            <Alert variant="danger" className="mb-3">
              {moviesState.commentsError}
            </Alert>
          )}

          {!auth.user && (
            <Alert variant="info" className="mb-3">
              You need to login before posting comments or voting.
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            <Row className="g-2 align-items-end">
              <Col md={10}>
                <Form.Label className="text-white" htmlFor="commentText">
                  Share your thoughts
                </Form.Label>
                <Form.Control
                  id="commentText"
                  as="textarea"
                  placeholder="Share your thoughts"
                  value={form.text}
                  onChange={(e) => setForm({ ...form, text: e.target.value })}
                  style={{ height: "120px" }}
                  required
                  disabled={!auth.user}
                />
              </Col>
              <Col md={2} className="d-grid">
                <Button variant="primary" type="submit" className="h-100" disabled={!auth.user || moviesState.savingComment}>
                  {moviesState.savingComment ? "Saving..." : "Post"}
                </Button>
              </Col>
            </Row>
          </Form>

          <div className="d-grid gap-2 mt-3">
            {comments.length === 0 && <p className="text-secondary mb-0">No comments yet.</p>}
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

function AuthPage() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const auth = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (auth.user) {
      navigate("/");
    }
  }, [auth.user, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (mode === "login") {
      dispatch(loginUser({ email: form.email, password: form.password }));
    } else {
      dispatch(signupUser(form));
    }
  };

  return (
    <section className="auth-section">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card className="detail-card shadow-sm">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <Card.Title className="text-white h4 mb-0">
                  {mode === "login" ? "Login to interact" : "Create an account"}
                </Card.Title>
                <Button variant="link" className="text-decoration-none" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
                  {mode === "login" ? "Need an account?" : "Already have an account?"}
                </Button>
              </div>

              {auth.error && (
                <Alert variant="danger" className="mb-3">
                  {auth.error}
                </Alert>
              )}

              <Form onSubmit={handleSubmit}>
                {mode === "signup" && (
                  <div className="mb-3">
                    <Form.Label className="text-white">Name</Form.Label>
                    <Form.Control
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      required
                    />
                  </div>
                )}
                <div className="mb-3">
                  <Form.Label className="text-white">Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="mb-3">
                  <Form.Label className="text-white">Password</Form.Label>
                  <Form.Control
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <Button type="submit" variant="primary" disabled={auth.status === "loading"}>
                  {auth.status === "loading" ? "Working..." : mode === "login" ? "Login" : "Sign up"}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </section>
  );
}
