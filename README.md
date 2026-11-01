# Intro to Backend

Backend implementation from [Shivani's freeCodeCamp tutorial](https://www.youtube.com/watch?v=KOutPbKc9UM), using the [instructor's source code](https://github.com/NewSmoke38/intro-to-backend).

The ten JavaScript files under `Backend/src` match the instructor's repository. The folder keeps this project's existing `Backend` capitalization and GitHub metadata. The existing `Backend/package.json` forwards start/dev commands to the root so the same root `.env` loads from either folder.

## Run

```powershell
cd 'D:\WEB DEV ASS'
npm install
npm run dev
```

Use the existing root `.env` with `PORT=4000` and your `MONGODB_URI`. `npm start` also works from the root or `Backend` directory. Run only one server at a time.

## Postman requests

Base URL: `http://localhost:4000`.

| Method | URL | JSON body |
| --- | --- | --- |
| POST | `/api/v1/users/register` | `username`, `email`, `password` |
| POST | `/api/v1/users/login` | `email`, `password` |
| POST | `/api/v1/users/logout` | `email` |
| POST | `/api/v1/posts/create` | `name`, `description`, `age` |
| GET | `/api/v1/posts/getPosts` | none |
| PATCH | `/api/v1/posts/update/:id` | fields to update |
| DELETE | `/api/v1/posts/delete/:id` | none |

In Postman, select Body → raw → JSON for requests with a body. Example registration:

```json
{ "username": "student", "email": "student@example.com", "password": "password123" }
```

Example post:

```json
{ "name": "Student", "description": "My first post", "age": 20 }
```

Use the created post's `_id` in update/delete URLs. These are the tutorial's basic endpoints, without tokens or author restrictions. Passwords are hashed with bcrypt as shown in the tutorial.
