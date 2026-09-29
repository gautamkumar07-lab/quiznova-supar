# quiznova-supar  
# Modern Quiz App

A responsive full-stack quiz application built with HTML, CSS, JavaScript, Node.js, Express and SQLite.

## Features
- Home screen with category and difficulty filters
- Per-question countdown timer
- Progress bar and score tracking
- Next/Previous navigation
- Results analysis
- Local score history
- Dark/Light theme
- Admin CRUD for questions and categories
- JSON import/export
- SQLite persistence
- Helmet security headers and input validation

## Run
```bash
npm install
npm start
```
Open http://localhost:3000

## Admin authentication
Open `/#admin` in the browser.

Default development credentials:
- Username: `admin`
- Password: `Admin@12345`

For production, set environment variables:
```bash
ADMIN_USER=your-admin
ADMIN_PASSWORD=use-a-strong-password
SESSION_SECRET=use-a-long-random-secret
NODE_ENV=production
```

The admin API is protected by a server-side session. For a production deployment, also use HTTPS, a persistent session store, rate limiting, CSRF protection and proper account management.

## API
- GET `/api/categories`
- POST `/api/categories`
- DELETE `/api/categories/:id`
- GET `/api/questions`
- GET `/api/questions/:id`
- POST `/api/questions`
- PUT `/api/questions/:id`
- DELETE `/api/questions/:id`
- GET `/api/questions/export`
- POST `/api/questions/import`
- POST `/api/scores`

## Production notes
Add authentication/authorization, CSRF protection, rate limiting, HTTPS, environment variables and server-side audit logging before exposing the admin API publicly.
