# FundFlow

FundFlow is a MERN startup-funding tracker. Each account has a private set of
startups and investor relationships. The client is a React/Vite app; the API is
an Express service backed by MongoDB and Mongoose.

## Requirements

- Node.js 20.19 or newer
- npm
- A local MongoDB server or a MongoDB Atlas connection string

## Local setup

1. Install dependencies from the repository root:

   ```sh
   npm ci
   ```

2. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI`,
   `JWT_SECRET`, and `CLIENT_URL`. Generate a suitable secret with:

   ```sh
   node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   `JWT_SECRET` must be at least 32 characters. Keep `.env` files private; they
   are ignored by Git.

3. `VITE_API_URL` is a Vite client setting, not a server setting. Copy
   `client/.env.example` to `client/.env` when you need to set or change the
   API base URL (including `/api`). Vite reads this value while running locally
   and when building the production client. The default URL is
   `http://localhost:5000/api`.

4. Start the API and client in separate terminals:

   ```sh
   npm run dev:server
   npm run dev:client
   ```

   The API listens on port 5000 by default and the Vite client on port 5173.
   The API health endpoint is `http://localhost:5000/api/health`.

## Commands

Run these from the repository root:

```sh
npm test
npm run build
```

The tests use `mongodb-memory-server` for isolated MongoDB integration tests;
they do not require an external database. The production frontend output is
written to `client/dist`.

## API overview

Successful responses use `{ "success": true, "data": ... }`. Errors use
`{ "success": false, "error": { "code": "...", "message": "..." } }`; validation
errors may include an `error.details` array.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API health |
| `POST` | `/api/auth/register` | Create an account and start a session |
| `POST` | `/api/auth/login` | Start a session |
| `POST` | `/api/auth/logout` | Clear the session cookie |
| `GET` | `/api/auth/me` | Read the authenticated account |
| `GET`, `POST` | `/api/startups` | List or create startups |
| `GET`, `PATCH`, `DELETE` | `/api/startups/:startupId` | Read, update, or delete a startup |
| `GET`, `POST` | `/api/investors` | List or create investors; optional `status` and `startupId` filters |
| `GET`, `PATCH`, `DELETE` | `/api/investors/:investorId` | Read, update, or delete an investor |
| `GET` | `/api/dashboard/metrics` | Read account-scoped funding, pipeline, and follow-up metrics |

Authentication uses a JWT in an HttpOnly, SameSite=Strict cookie; it is not
stored in browser storage. The client sends credentialed requests. In
production, serve the client and API over HTTPS and keep them on the same
site so the cookie policy works. Set `CLIENT_URL` to the exact client origin.

Every startup and investor query is scoped to the authenticated account.
Investor creation and reassignment verify that the selected startup belongs to
that account. Deleting a startup that still has linked investors returns a
`409 STARTUP_HAS_INVESTORS` error and leaves both the startup and investor
records intact. Delete the linked investors first, then delete the startup.
This supports the documented standalone MongoDB setup without requiring
transaction support. Follow-up dates use `YYYY-MM-DD` date-only values.

## Deployment preparation

- Provide `MONGODB_URI`, a newly generated `JWT_SECRET`, and `CLIENT_URL` to the
  server through the hosting provider's environment settings. Never commit
  real credentials.
- Set `VITE_API_URL` in the client build environment. Build the client from the
  repository root with `npm run build` and deploy `client/dist` to a static
  host. Vite embeds the API URL at build time.
- From the repository root, deploy the server with
  `npm run start --workspace server` on Node.js 20.19 or newer. Alternatively,
  run `npm start` with `server/` as the working directory. Configure HTTPS at
  the hosting layer and allow the client origin through `CLIENT_URL`.
- Run `npm test` and `npm run build` before release.

## AI-assisted development tasks

- Planned the client/server architecture, ownership model, API boundaries, and
  implementation sequence with AI assistance.
- Used AI assistance to draft the React pages, Express controllers, Mongoose
  models, validation, and cookie-authentication flow.
- Used AI assistance to create security and integration tests, then ran the
  project tests and build and corrected issues found during verification.
