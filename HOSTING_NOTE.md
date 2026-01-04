# Hosting Note (Important)

This project supports two modes:

1) Static mode (GitHub Pages / any static host)
- The CV builder UI works.
- Optional login can work via **Firebase Auth** (Google + Email/Password).
- The AI Assistant **will not work** because it needs a backend `/api/ai`.

2) Server mode (Render / Railway / Glitch)
- Everything works including AI (because `/api/ai` exists).

Notes:
- If you want AI, deploy the Node server and set `OPENAI_API_KEY`.
- If you only want login, Firebase Auth works fine even on static hosting.
