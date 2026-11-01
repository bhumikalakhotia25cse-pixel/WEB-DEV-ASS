# Intro to Backend: Node.js, Express and MongoDB

Implementation of the [freeCodeCamp video](https://www.youtube.com/watch?v=KOutPbKc9UM), following the instructor's [Users/Posts project structure and tutorial routes](https://github.com/NewSmoke38/intro-to-backend).

## 1. Node project and dependencies

Use Node.js 22 or later. Open PowerShell in the project root:

```powershell
cd 'D:\WEB DEV ASS'
npm ci
```

The root package owns the dependencies and lockfile. `Backend/package.json` also lets you start the server from the Backend folder, using the dependencies installed at the root.

```text
Backend/src/
  app.js                     Express middleware and routes
  index.js                   Environment, database connection and server startup
  config/database.js         MongoDB connection
  models/                    User, Post and Session Mongoose schemas
  controllers/               Registration, login, logout and CRUD handlers
  routes/                    HTTP methods and URLs
  middleware/                Authentication and JSON error responses
  utils/password.js          Password hashing and comparison
Backend/test/                Local tests and opt-in MongoDB integration test
postman/                     Importable collection with response assertions
```

## 2. Create an Atlas account and database

1. Sign in or create your own account at [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create a project and a free cluster if the free option is available. Choose a region near you.
3. Under database access/security, create a **database user** with read/write access to `backend_tutorial`. This is separate from your Atlas website login.
4. Under network access/security, add your current public IP address to the IP access list.
5. On the cluster, choose **Connect → Drivers → Node.js** and copy the connection string.
6. Create a root `.env` using `.env.example` if you do not already have one. This workspace already has a `.env`; edit its placeholder rather than overwriting it.

```dotenv
PORT=8000
MONGODB_URI=mongodb+srv://USERNAME:URL_ENCODED_PASSWORD@CLUSTER_HOST/backend_tutorial
```

Replace the username, password and host using your actual cluster details. URL-encode special characters in the database password. Do not paste credentials into source code or commit `.env`; it is ignored by Git. The existing lowercase `port` key is accepted for compatibility, but prefer `PORT`.

Reference: [MongoDB's deployment and application setup guide](https://www.mongodb.com/docs/get-started/).

## 3. Start the backend

```powershell
npm run dev
```

For a normal run without auto-reload, use `npm start`. The server connects to MongoDB before opening its HTTP port. A missing or placeholder URI produces a clear error and exits. When configured, the console prints `MongoDB connected.` and `API running at http://localhost:8000`.

`GET http://localhost:8000/health` returns `200` when MongoDB is connected, or `503` if it disconnects while the server is running. Atlas creates the database and collections as the app writes documents; the app does not seed sample data.

## 4. Models and request flow

A request reaches a route, runs middleware, calls a controller, and uses a Mongoose model to read or write MongoDB. Express returns JSON to the client.

- **User:** username, unique normalized email, hashed password, timestamps. Password hashes are excluded from responses.
- **Post:** title, content, author reference, timestamps. Title is required and at most 200 characters; content is required and at most 20,000 characters.
- **Session:** hashed token, user reference and expiry. Login returns a random token valid for 24 hours. MongoDB expires old session documents; authentication also checks the expiry immediately.

Registration accepts a username of 2–60 characters and password of 8–128 characters. Passwords use Node's built-in salted `scrypt` instead of the video's bcrypt dependency. Login, protected writes, real token revocation on logout, and author checks extend the tutorial's basic login/logout examples. Standard REST aliases are also available.

## 5. API endpoints

Base URL: `http://localhost:8000`. Change the port to match `.env`.

| Method | Tutorial URL | JSON body | Success | Access |
| --- | --- | --- | --- | --- |
| POST | `/api/v1/users/register` | `username`, `email`, `password` | 201 | Public |
| POST | `/api/v1/users/login` | `email`, `password` | 200, including `token` | Public |
| POST | `/api/v1/users/logout` | none | 200 | Bearer token |
| POST | `/api/v1/posts/create` | `title`, `content` | 201 | Bearer token |
| GET | `/api/v1/posts/getPosts` | none | 200 | Public |
| GET | `/api/v1/posts/:id` | none | 200 | Public |
| PATCH | `/api/v1/posts/update/:id` | `title` and/or `content` | 200 | Post author |
| DELETE | `/api/v1/posts/delete/:id` | none | 200 | Post author |

REST aliases: `POST /api/v1/posts`, `GET /api/v1/posts`, `PATCH /api/v1/posts/:id`, `DELETE /api/v1/posts/:id`. List returns the newest 100 posts. Posts are publicly readable. Clients cannot set or change the author through a JSON body.

Errors return `{ "message": "..." }`: `400` invalid input/ID/JSON, `401` missing or invalid login, `403` another author's post, `404` missing post/route, `409` duplicate email, `413` oversized body, `500` unexpected server error.

## 6. Test using Postman desktop

1. Start the backend with a working Atlas URI.
2. Open Postman desktop. In your workspace select **Import** (or **Use resources or import → Import**, depending on version).
3. Import `postman/Backend-Tutorial.postman_collection.json`. [Postman supports importing collection JSON files](https://learning.postman.com/docs/getting-started/importing-and-exporting/importing-data/).
4. In the imported collection's variables, set `baseUrl` to `http://localhost:8000` or your configured port.
5. Run the requests in their numbered order in the collection runner, or open each request and click **Send**, following the displayed order.

The collection performs this sequence:

1. Health check → `200`.
2. Register → `201`; a pre-request script generates a fresh email for repeat runs.
3. Login → `200`; its response script saves `token` as a collection variable.
4. Create post → `201`; its response script saves `postId`.
5. List posts and read the created post → `200`.
6. Update the title → `200`; check that the returned title changed.
7. Delete the post → `200`.
8. Read the deleted post → expected `404`.
9. Logout → `200`.
10. Attempt another create using the revoked token → expected `401`.

Each request includes status assertions visible in Postman's test results. The collection inherits Bearer `{{token}}` authentication for protected requests. Its final `401` is a passing negative test. Registered test users remain in the database; the test post is deleted.

For manual requests, choose **Body → raw → JSON** and use:

```json
{ "username": "Student", "email": "student@example.com", "password": "Tutorial-password-123" }
```

After registering, log in with the same email/password. Copy the response's `token` to **Authorization → Bearer Token** when creating, editing, deleting or logging out. A create body is:

```json
{ "title": "My first post", "content": "Learning Express and MongoDB." }
```

Copy the response's `post._id` into update/delete URLs. An update body is `{ "title": "Updated title" }`.

## 7. Automated verification

```powershell
npm test
```

This runs local HTTP/validation and password tests without a MongoDB server. The full MongoDB integration test is separate:

```powershell
$env:TEST_MONGODB_URI = 'YOUR_REAL_MONGODB_CONNECTION_STRING'
npm run test:integration
Remove-Item Env:TEST_MONGODB_URI
```

The integration test creates a random `tutorial_test_...` database, verifies registration, duplicate email rejection, login, password hashing, full CRUD, ownership checks and logout revocation, then drops **only that random test database**. Use a test database user with permission to create and drop test databases. It skips explicitly when `TEST_MONGODB_URI` is unset. Never use a production account for this test.

## 8. Add the implementation to GitHub

This workspace already has a Git repository and an `origin` pointing to `https://github.com/bhumikalakhotia25cse-pixel/WEB-DEV-ASS.git`. Review changes before publishing, including the pre-existing deletion of `Backend/README.md`.

```powershell
git status
git check-ignore .env node_modules
git add .gitignore .env.example package.json package-lock.json README.md Backend/package.json Backend/src Backend/test postman
git diff --cached --stat
git commit -m "Implement tutorial backend with user authentication and post CRUD"
git push -u origin HEAD
```

Sign in to GitHub if Git prompts. The listed paths leave the pre-existing `Backend/README.md` deletion unstaged. `.env` and `node_modules` are excluded. If a push is rejected because remote changes exist, fetch and inspect them before integrating changes; do not force-push.

## Verification status

Local password, model and HTTP validation tests passed during implementation. Startup correctly rejects the placeholder URI. The MongoDB integration test and live Postman workflow require a working Atlas connection and have not yet been executed against a live database. The collection is ready to import; account/cluster creation and GitHub publication are not represented as completed.

This is a learning project. A public deployment would also need HTTPS, request rate limits, account recovery and operational monitoring.
