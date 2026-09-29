# QuizNova — GitHub Pages Edition

This version is **static** and works directly from a GitHub Pages URL. It does not need `localhost`, Node.js, Express, or a local database.

## Upload to GitHub Pages

1. Create a GitHub repository, for example `quiznova`.
2. Upload these files/folders:
   - `index.html`
   - `css/style.css`
   - `js/app.js`
3. GitHub → **Settings** → **Pages**
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select your main branch and `/ (root)`.
6. Save and wait for GitHub Pages to publish.
7. Open the generated Pages URL on any phone or computer.

## Important

Because GitHub Pages only serves static files:
- Quiz data and score history are stored in the browser's `localStorage`.
- Admin CRUD/import/export works in that browser.
- Admin username: `admin`
- Admin password: `Admin@12345`
- Admin changes are NOT shared between different devices.
- This client-side admin password is not real server security.

For a true multi-device app with one shared question database and secure admin login, the Node.js backend must be hosted separately with a cloud database.
