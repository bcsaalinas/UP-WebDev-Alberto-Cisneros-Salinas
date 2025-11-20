# React with API (local & 3rd party)

---

- Recreate the exercise we did in the previous entry of the portfolio, but now provide the information from a backend server.
- Use React-bootstrap elements to do a reactive design
- Now, on every card, instead of displaying the detail of the movie below the cards, redirect it to a new component that should be only displayed via react-router
- Make sure that the like/dislike functionality is still working.
- Also make sure that the user can still save the comments through different sessions; that is, make sure you save the entries in a Mongo instance.

## Running the solution

- Code lives under `client/` (Next.js App Router with React Router on the client and API routes for data).
- Set `MONGODB_URI` if you want to persist likes/comments; defaults to `mongodb://127.0.0.1:27017/sw-watchlist`.
- From `client/`: install deps then `npm run dev` to run the SPA and API together. (From the repo root you can also run `npm run dev`, which delegates to the client.)
- REST endpoints: `GET /api/movies`, `GET /api/movies/:episode`, `PATCH /api/movies/:episode/feedback`, `GET|POST /api/movies/:episode/comments`.
