# Firebase Setup (1-time) — Login + Cloud Save

You only need to do this **once**. After that:
- Login will work
- Your CV draft will **sync across devices** (Firestore)

## 1) Create Firebase project
1. Open: https://console.firebase.google.com/
2. Click **Add project**
3. Give it any name (example: `free-cv-builder`)
4. Continue → Finish

## 2) Add a Web App + copy config
1. Inside your project → click the **Web** icon `</>` (Add app)
2. App nickname: anything (example: `cv-web`)
3. Click **Register app**
4. You will see a config like:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  appId: "...",
};
```

Copy ONLY the object `{ ... }` and keep it ready.

## 3) Enable Authentication
1. Firebase Console → **Build → Authentication**
2. Click **Get started**
3. Go to **Sign-in method**
4. Enable:
   - **Google**
   - **Email/Password** (for email links)
   - **Phone** (for SMS codes)

## 4) Add Authorized domain (important)
1. Firebase Console → **Authentication → Settings**
2. In **Authorized domains** add:
   - `abid22110.github.io`
   - `localhost` (recommended for local testing)

## 5) Enable Firestore (Cloud Save)
1. Firebase Console → **Build → Firestore Database**
2. Click **Create database**
3. Choose **Start in test mode** (fastest)
4. Select location → Enable

Later you can lock rules, but test mode is easiest to start.

## 6) Paste config in the app (no coding)
Open your site and use either:

### Option A (recommended): Main page “Quick Setup”
- Open: `index.html` (Step 1)
- Find **Quick Setup** card
- Paste Firebase JSON
- Click **Save Firebase**

### Option B: Login page setup panel
- Open: `login.html`
- Paste Firebase JSON
- Click **Save Config**

## 7) Verify
- Go to `login.html`
- Try Email/Password or Google
- Come back to builder, type something, refresh
- Login again on another device → draft should restore

## Common problems
- **“Login needs a proper domain…”**
  - Don’t open via `file://`
  - Use GitHub Pages or `http://localhost`
- **Google popup blocked**
  - Allow popups, try again
- **Cloud save not restoring**
  - Ensure Firestore is enabled
  - Wait 5–10 seconds after editing (auto sync)
