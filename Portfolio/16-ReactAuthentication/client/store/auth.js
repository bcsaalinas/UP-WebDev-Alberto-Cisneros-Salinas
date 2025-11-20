const AUTH_START = "auth/start";
const AUTH_SUCCESS = "auth/success";
const AUTH_ERROR = "auth/error";
const AUTH_LOGOUT = "auth/logout";

const initialState = {
  user: null,
  token: null,
  status: "idle",
  error: null,
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case AUTH_START:
      return { ...state, status: "loading", error: null };
    case AUTH_SUCCESS:
      return { ...state, status: "ready", error: null, user: action.payload.user, token: action.payload.token };
    case AUTH_ERROR:
      return { ...state, status: "error", error: action.payload };
    case AUTH_LOGOUT:
      return { ...initialState };
    default:
      return state;
  }
}

export function checkSession() {
  return async (dispatch) => {
    const savedToken = localStorage.getItem("authToken");
    if (!savedToken) return;
    try {
      const res = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${savedToken}` },
      });
      if (!res.ok) {
        localStorage.removeItem("authToken");
        return;
      }
      const data = await res.json();
      if (data.user) {
        dispatch({ type: AUTH_SUCCESS, payload: { user: data.user, token: savedToken } });
      }
    } catch (error) {
      localStorage.removeItem("authToken");
    }
  };
}

export function signupUser(form) {
  return async (dispatch) => {
    dispatch({ type: AUTH_START });
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: AUTH_ERROR, payload: data.error || "Signup failed" });
        return;
      }
      localStorage.setItem("authToken", data.token);
      dispatch({ type: AUTH_SUCCESS, payload: { user: data.user, token: data.token } });
    } catch (error) {
      dispatch({ type: AUTH_ERROR, payload: "Signup failed" });
    }
  };
}

export function loginUser(form) {
  return async (dispatch) => {
    dispatch({ type: AUTH_START });
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        dispatch({ type: AUTH_ERROR, payload: data.error || "Login failed" });
        return;
      }
      localStorage.setItem("authToken", data.token);
      dispatch({ type: AUTH_SUCCESS, payload: { user: data.user, token: data.token } });
    } catch (error) {
      dispatch({ type: AUTH_ERROR, payload: "Login failed" });
    }
  };
}

export function logoutUser() {
  return (dispatch) => {
    localStorage.removeItem("authToken");
    dispatch({ type: AUTH_LOGOUT });
  };
}
