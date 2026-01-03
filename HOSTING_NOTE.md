# Hosting Note (Important)

This project uses a Node/Express backend for authentication (`/api/login`, `/api/signup`, sessions).

- GitHub Pages is **static hosting** and cannot run the backend. So login/signup cannot work on GitHub Pages.
- For real login/signup, open the site using your backend host URL (Glitch/Render/Railway) such as:
  - `https://<your-app>.glitch.me/login.html`
  - `https://<your-app>.onrender.com/login.html`

If you open `https://<username>.github.io/<repo>/`, the app will run in demo/static mode.
