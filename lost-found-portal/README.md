# Lost & Found Portal

This repository contains a minimal Lost & Found portal with a Node/Express backend and a static frontend.

Structure
```
backend/
  config/
    database.js
  controllers/
    authController.js
    itemController.js
  middleware/
    auth.js
  models/
    User.js
    Item.js
  routes/
    auth.js
    items.js
  server.js
  package.json
  .env (sample)

frontend/
  index.html
  css/style.css
  js/script.js

README.md
```

Quick start (backend)
1. Open a terminal in `backend`.
2. Install dependencies: `npm install`.
3. Create a `.env` (copy `.env` file that was created) and set `MONGO_URI` and `JWT_SECRET`.
4. Start the server: `npm run dev` (requires `nodemon`) or `npm start`.

The backend exposes these endpoints (base `/api`):
- `POST /api/auth/register` - register { name, email, password }
- `POST /api/auth/login` - login { email, password }
- `GET /api/auth/me` - get profile (requires Bearer token)
- `GET /api/items` - list items
- `POST /api/items` - create item (requires Bearer token)
- `GET /api/items/:id` - get an item
- `PUT /api/items/:id` - update an item (owner only)
- `DELETE /api/items/:id` - delete an item (owner only)

Frontend
- `frontend/index.html` is a minimal UI to list and submit items. It expects the backend to be reachable at the same origin (so place the static frontend on the same host as the API or adjust `API_BASE` in `frontend/js/script.js`).

Notes & next steps
- This is a minimal scaffold. You may want to add validation, file uploads for images, better error handling, and a proper frontend build.
- If you want, I can:
  - Add unit tests for the controllers
  - Add CORS config and deployment instructions
  - Wire a simple login form and token storage on the frontend

