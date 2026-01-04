// Public app configuration (safe to commit)
//
// GitHub Pages cannot run the Node backend endpoints (like /api/ai).
// To enable AI on GitHub Pages, deploy the server (Render/Railway/Glitch)
// and set AI_API_BASE_URL to your backend URL.
// Example:
//   window.APP_CONFIG = { AI_API_BASE_URL: "https://your-app.onrender.com" };
//
// Leave empty to use same-origin /api/ai (when running via Node server).
window.APP_CONFIG = {
  AI_API_BASE_URL: ""
};
