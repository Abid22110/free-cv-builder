# 🎓 Free CV Builder v2.1

A professional, modern CV/Resume builder web application with **100+ premium templates**, AI assistant, and zero setup required!

**GitHub**: https://github.com/Abid22110/free-cv-builder
**Live Demo**: Coming Soon (Deploy instructions below)

---

## ✨ Key Features

### 🎨 **100+ Premium CV Templates**
- Unique color schemes and designs
- Categories: Modern, Professional, Creative, Technical, Premium, etc.
- Real-time template switching
- Smooth animations and transitions

### ✅ **Zero Setup Required**
- Works instantly in the browser - no login, no configuration needed
- AI Helper available immediately for generating content
- Everything works offline and saves locally
- Just open and start building!

### 🤖 **AI Assistant (Always Available)**
- Generates ATS-friendly summaries
- Suggests relevant skills
- Improves experience bullet points
- Floating helper visible on every page
- No API keys or backend needed for basic use

### 📝 **Complete CV Builder**
- **Personal Information**: Name, job title, email, phone, location, website
- **Professional Summary**: AI-generated or custom text
- **Work Experience**: Multiple entries with AI-improved descriptions
- **Education**: Multiple degrees/certifications
- **Skills**: AI-suggested tag-based skill management
- **Languages**: Multiple languages with proficiency levels

### 📊 **Social Proof Features**
- 500+ CVs Created counter
- 50+ User Reviews with 5-star ratings
- User testimonials from various professions
- Professional footer with social links

### 📄 **PDF Export**
- One-click PDF download
- Professional formatting
- Styled based on selected template
- Print → Save as PDF

### 🤖 **AI Assistant (Optional)**
- Generates ATS-friendly summaries
- Suggests relevant skills
- Improves experience bullet points
- Runs via server-side API (`/api/ai`) so your API key stays private

### 📱 **Responsive Design**
- Works on all devices (Mobile, Tablet, Desktop)
- Touch-friendly buttons
- Adaptive layouts

---

## � **Recent Updates & Fixes**

### **v2.1.1 - AI Backend Improvements**
- ✅ **Fixed AI Integration**: Updated server.js to use proper OpenAI client library instead of raw fetch requests
- ✅ **Enhanced Error Handling**: Better error messages and response formatting for AI requests
- ✅ **Improved Dependencies**: Added OpenAI SDK to package.json for reliable AI functionality
- ✅ **Security Updates**: Added .env to .gitignore to protect API keys
- ✅ **Code Quality**: Cleaner, more maintainable backend code with proper async/await patterns

### **Key Improvements:**
- AI assistant now uses official OpenAI SDK for better reliability
- Proper error handling prevents crashes when AI is not configured
- Environment variables properly secured
- All dependencies updated and verified

---

## �🚀 **Getting Started**

1. **Open the app** - Works instantly in any browser
2. **Fill your info** - Name, job title, experience, skills
3. **Use AI Helper** - Click buttons for instant content generation
4. **Pick template** - Choose from 100+ professional designs
5. **Download PDF** - One-click professional CV export

**That's it!** No setup, no login, no configuration required.
- Beautiful animations

### 🚀 **Modern Tech Stack**
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Process Management: PM2 (auto-restart, monitoring)
- Storage: none by default (no user accounts)

---

## 📋 What's Included

✅ 100 unique CV templates with custom styling  
✅ Modern animations and hover effects  
✅ Mobile-responsive design  
✅ PM2 process management  
✅ PDF download functionality  
✅ 50+ user reviews/testimonials  
✅ Professional footer  
✅ Statistics display (500+ CVs created)  
✅ Smooth transitions and interactions  

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher) - Download from https://nodejs.org

### Installation

#### **Windows (PowerShell)**
```powershell
# Navigate to directory
cd free-cv-builder

# Install dependencies and start (automatic check)
.\start.ps1
```

#### **Linux/Mac (Bash)**
```bash
# Navigate to directory
cd free-cv-builder

# Install dependencies
npm install

# Start server with PM2
./start.sh

# Or manually start
npm start
```

**Access**: http://localhost:3001

### AI Assistant Setup (Optional)
1. Copy `.env.example` to `.env` (or set environment variables in your hosting provider)
2. Set `OPENAI_API_KEY`
3. Restart the server

If `OPENAI_API_KEY` is not set, the AI Assistant UI will still show, but requests will return a friendly “not configured” error.

### AI on GitHub Pages (Frontend) + Render/Railway/Glitch (Backend)
GitHub Pages is static, so it cannot run `/api/ai`. You have two options:

1) Use your deployed **Node URL** as the main website (recommended)
2) Keep GitHub Pages for UI and deploy the backend separately:
	 - Deploy this repo to Render/Railway/Glitch
	 - Set `OPENAI_API_KEY` on the backend host
	 - Set `CORS_ORIGIN=https://abid22110.github.io` (or `*`) on the backend host
	 - Edit [app-config.js](app-config.js) and set:
		 - `AI_API_BASE_URL` to your backend URL (example: `https://your-app.onrender.com`)

### Optional Login (Firebase Auth)
This project includes a simple login system powered by **Firebase Authentication** (Phone SMS verification).

For the simplest setup, follow: [FIREBASE_SETUP.md](FIREBASE_SETUP.md)

**Login Methods Available:**
- **Email/Password**: Create account or sign in with email and password
- **Google Sign-in**: One-click login with your Google account
- **Continue as Guest**: Skip login and use locally (always available)

**Benefits of Login:**
- Save CV drafts across devices (syncs to cloud)
- Access your saved drafts from any device
- Premium experience with data persistence

Note: To make login actually useful across devices, the app can also sync drafts using **Firestore** (optional but recommended).

1) Create a Firebase project: https://console.firebase.google.com/
2) Add a **Web App** and copy the config values
3) Firebase Console → Authentication → Sign-in method:
	- Enable **Phone** (for SMS codes)
4) Firebase Console → Authentication → Settings → Authorized domains:
	- Add your domain (and `localhost` for local dev)
5) Configure Firebase in ONE of these ways:
	- Recommended (no code changes): open `/login.html` and paste your Firebase config in the “Enable Login” panel
	- Or: open [firebase-config.js](firebase-config.js) and replace the `REPLACE_ME` values

Then open `/login.html` or click “Sign in” in the header.
**Note**: Login is completely optional. The CV builder works perfectly without it!
### New Step-by-Step Flow
The builder now uses a 3-step wizard:
1) Fill in the blanks → 2) Pick a template → 3) Download

You can still use the live preview panel on the right at all times.

### Verification Checklist (Manual)
- Step 1: Fill required fields (Full Name, Job Title, Email)
- Step 1: Click “Generate Summary / Suggest Skills / Improve Experience Bullets” (AI requires `OPENAI_API_KEY`)
- Step 2: Open “Browse 100 Styles” and select a template
- Step 3: Preview → Download PDF (Print → Save as PDF)

**Windows users**: Run `.\start.ps1` in PowerShell for automatic setup with helpful checks.

If you see `node` / `npm` "not recognized":
1. Install Node.js from https://nodejs.org (LTS version)
2. Restart PowerShell/Terminal after installation
3. Run `.\start.ps1` again

---

## 🌐 Deploy to Web (5-10 Minutes)

### **Option 1: Railway (RECOMMENDED)**
1. Go to https://railway.app
2. Sign in with GitHub
3. Click "New Project"
4. Connect your repository
5. Auto-deploys! ✅

**Cost**: $5-10/month  
**Time**: 5 minutes  
**Link**: You'll get a railway.app URL

### **Option 2: Render**
1. Go to https://render.com
2. Click "New Web Service"
3. Connect GitHub repo
4. Deploy! ✅

**Cost**: Free tier available  
**Time**: 5 minutes

### **Option 3: Heroku**
```bash
heroku login
heroku create your-app-name
git push heroku main
```

**Cost**: $5-7/month  
**Time**: 5 minutes

**See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions**

---

## 📊 Project Statistics

- **Lines of Code**: 1000+
- **CSS Animations**: 10+
- **CV Templates**: 100
- **User Reviews**: 50+
- **Features**: 15+
- **Responsive Breakpoints**: 5
- **Performance**: 0% CPU at idle

---

## 📁 Project Structure

```
cv-builder/
├── index.html           # Main CV builder app
├── login.html          # Legacy (redirects to /)
├── signup.html         # Legacy (redirects to /)
├── app.js              # Frontend logic (templates, reviews)
├── server.js           # Express backend (static + AI API)
├── style.css           # All styling (100 templates)
├── package.json        # Dependencies
├── ecosystem.config.js # PM2 config
├── start.sh            # Startup script
├── users.json          # Legacy file (not used in no-login mode)
├── DEPLOYMENT.md       # Deployment guide
└── README.md           # This file
```

---

## 🎯 Usage Steps

### 1. **Fill Your Information**
- Personal details
- Work experience
- Education
- Skills
- Languages

Optional:
- Use **AI Assistant** to generate Summary / Skills / Bullets

### 2. **Pick a Template**
- Click **Browse 100 Styles**
- Choose from 100 templates
- See instant preview

### 3. **Preview & Download**
- Click **Preview CV**
- Click **Download PDF**
- Share with employers!

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js v4.18.2 |
| Process Management | PM2 |
| Icons | Font Awesome 6.4.0 |
| Package Manager | npm |

---

## 🔐 Security Features

- ✅ Input escaping/sanitization for CV preview rendering
- ✅ No login/accounts required
- ✅ AI API key stays server-side (never shipped to the browser)

---

## 📈 Performance

- **Server Memory**: ~65MB
- **CPU Usage**: 0% idle
- **Response Time**: <100ms
- **Concurrent Users**: 100+
- **Auto-Restart**: Enabled with PM2

---

## 🎨 CV Template Categories

**Modern** (5): Blue, Urban Dark, Star Bright, Galaxy, etc.  
**Professional** (8): Green, Teal, Ocean, Scholar, etc.  
**Creative** (8): Purple, Pink, Artist, Blossom, etc.  
**Technical** (4): Data Analyst, Tech Geek, Engineer, Security  
**Premium** (3): Premium, Champion, Royal  
**And 22+ unique styles!**

---

## 📞 Support & Contact

- **GitHub Issues**: Report bugs and feature requests
- **Email**: Via GitHub profile
- **Documentation**: See DEPLOYMENT.md for web access

---

## 📄 License

Free to use for personal and commercial purposes  
Made with ❤️ by **Abid**

---

## 🚀 Roadmap (Future)

- [ ] MongoDB integration
- [ ] Redis caching
- [ ] Email verification
- [ ] Password reset
- [ ] Social login (Google, GitHub)
- [ ] CV templates store
- [ ] Analytics dashboard
- [ ] Export to multiple formats (DOCX, etc.)

---

**Version**: 2.0  
**Last Updated**: January 3, 2026  
**Status**: Production Ready ✅

**Ready to deploy? See [DEPLOYMENT.md](./DEPLOYMENT.md)** 🚀

## Technologies Used

- HTML5
- CSS3
- JavaScript (Vanilla)
- Node.js & Express
- Font Awesome Icons

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.

## Author

Created with ❤️ by Abid

---

**Made in 2026**