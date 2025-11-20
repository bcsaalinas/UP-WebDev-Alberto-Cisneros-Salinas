# React Authentication

---

- Re-use the previous exercise, add login/signup so users can register.
- Anonymous users can only view data; likes/dislikes and comments need authentication and must be saved in the backend.
- Use Redux + Thunk for state management.

## Running the solution

- Code lives in `client/` (Next.js App Router + React Router on the client, Redux + Thunk for state).
- Set `MONGODB_URI` for Mongo and `JWT_SECRET` for signing sessions. Defaults: `mongodb://127.0.0.1:27017/sw-watchlist` and `dev-secret`.
- From `16-ReactAuthentication`: run `npm run install:client` once, then `npm run dev` to start the UI and API.
- Auth endpoints: `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`.
- Data endpoints: `GET /api/movies`, `GET /api/movies/:episode`, `PATCH /api/movies/:episode/feedback`, `GET|POST /api/movies/:episode/comments` (POST + feedback need a Bearer token).
