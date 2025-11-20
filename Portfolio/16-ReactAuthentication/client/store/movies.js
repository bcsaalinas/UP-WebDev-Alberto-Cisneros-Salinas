const MOVIES_START = "movies/start";
const MOVIES_SUCCESS = "movies/success";
const MOVIES_ERROR = "movies/error";
const MOVIE_DETAIL_START = "movies/detail/start";
const MOVIE_DETAIL_SUCCESS = "movies/detail/success";
const MOVIE_DETAIL_ERROR = "movies/detail/error";
const MOVIE_COMMENT_START = "movies/comment/start";
const MOVIE_COMMENT_ERROR = "movies/comment/error";
const MOVIE_COMMENTS_SUCCESS = "movies/comments/success";
const MOVIE_COMMENT_ADD = "movies/comment/add";
const MOVIE_FEEDBACK_UPDATE = "movies/feedback/update";

const initialState = {
  list: [],
  loading: false,
  error: null,
  dbConnected: true,
  detail: null,
  detailLoading: false,
  detailError: null,
  comments: [],
  commentsError: null,
  savingComment: false,
};

export default function moviesReducer(state = initialState, action) {
  switch (action.type) {
    case MOVIES_START:
      return { ...state, loading: true, error: null };
    case MOVIES_SUCCESS:
      return {
        ...state,
        loading: false,
        list: action.payload.movies,
        dbConnected: action.payload.dbConnected,
      };
    case MOVIES_ERROR:
      return { ...state, loading: false, error: action.payload };
    case MOVIE_DETAIL_START:
      return { ...state, detailLoading: true, detailError: null };
    case MOVIE_DETAIL_SUCCESS:
      return { ...state, detailLoading: false, detail: action.payload.movie, dbConnected: action.payload.dbConnected };
    case MOVIE_DETAIL_ERROR:
      return { ...state, detailLoading: false, detailError: action.payload };
    case MOVIE_COMMENTS_SUCCESS:
      return { ...state, comments: action.payload, commentsError: null, savingComment: false };
    case MOVIE_COMMENT_START:
      return { ...state, savingComment: true, commentsError: null };
    case MOVIE_COMMENT_ERROR:
      return { ...state, savingComment: false, commentsError: action.payload };
    case MOVIE_COMMENT_ADD:
      return { ...state, savingComment: false, comments: [action.payload, ...state.comments] };
    case MOVIE_FEEDBACK_UPDATE:
      return {
        ...state,
        list: state.list.map((movie) =>
          movie.episode === action.payload.episode ? { ...movie, stats: action.payload.stats } : movie
        ),
        detail:
          state.detail && state.detail.episode === action.payload.episode
            ? { ...state.detail, stats: action.payload.stats }
            : state.detail,
      };
    default:
      return state;
  }
}

export function loadMovies() {
  return async (dispatch) => {
    dispatch({ type: MOVIES_START });
    try {
      const res = await fetch("/api/movies", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: MOVIES_ERROR, payload: data.error || "Could not load movies" });
        return;
      }
      dispatch({
        type: MOVIES_SUCCESS,
        payload: { movies: data.movies || [], dbConnected: data.meta?.dbConnected ?? true },
      });
    } catch (error) {
      dispatch({ type: MOVIES_ERROR, payload: "Could not load movies" });
    }
  };
}

export function loadMovieDetail(episode) {
  return async (dispatch) => {
    dispatch({ type: MOVIE_DETAIL_START });
    try {
      const res = await fetch(`/api/movies/${episode}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: MOVIE_DETAIL_ERROR, payload: data.error || "Could not get movie" });
        return;
      }
      dispatch({
        type: MOVIE_DETAIL_SUCCESS,
        payload: { movie: data.movie, dbConnected: data.meta?.dbConnected ?? true },
      });
    } catch (error) {
      dispatch({ type: MOVIE_DETAIL_ERROR, payload: "Could not get movie" });
    }
  };
}

export function sendFeedback(episode, type) {
  return async (dispatch, getState) => {
    const token = getState().auth.token;
    if (!token) {
      return { error: "login-required" };
    }
    try {
      const res = await fetch(`/api/movies/${episode}/feedback`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { error: data.error || "Could not update" };
      }
      dispatch({ type: MOVIE_FEEDBACK_UPDATE, payload: { episode, stats: data.stats } });
      return { ok: true };
    } catch (error) {
      return { error: "Could not update" };
    }
  };
}

export function loadComments(episode) {
  return async (dispatch) => {
    try {
      const res = await fetch(`/api/movies/${episode}/comments`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: MOVIE_COMMENT_ERROR, payload: data.error || "Comments unavailable" });
        return;
      }
      const list = (data.comments || []).map((c) => normalizeComment(c));
      dispatch({ type: MOVIE_COMMENTS_SUCCESS, payload: list });
    } catch (error) {
      dispatch({ type: MOVIE_COMMENT_ERROR, payload: "Comments unavailable" });
    }
  };
}

export function addComment(episode, form) {
  return async (dispatch, getState) => {
    const token = getState().auth.token;
    if (!token) {
      dispatch({ type: MOVIE_COMMENT_ERROR, payload: "Please login first." });
      return;
    }
    dispatch({ type: MOVIE_COMMENT_START });
    try {
      const res = await fetch(`/api/movies/${episode}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: MOVIE_COMMENT_ERROR, payload: data.error || "Could not save comment" });
        return;
      }
      dispatch({ type: MOVIE_COMMENT_ADD, payload: normalizeComment(data.comment) });
    } catch (error) {
      dispatch({ type: MOVIE_COMMENT_ERROR, payload: "Could not save comment" });
    }
  };
}

function normalizeComment(entry) {
  return {
    id: entry._id?.toString?.() || entry.id || `${entry.name}-${entry.text}-${entry.createdAt || ""}`,
    name: entry.name,
    text: entry.text,
    createdAt: entry.createdAt
      ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(entry.createdAt))
      : "",
  };
}
