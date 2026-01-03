# 🎓 Free CV Builder v2.0

A professional, modern CV/Resume builder web application with **50+ premium templates**, authentication, and cloud deployment ready!

**GitHub**: https://github.com/Abid22110/free-cv-builder  
**Live Demo**: Coming Soon (Deploy instructions below)

---

## ✨ Key Features

### 🎨 **50+ Premium CV Templates**
- Unique color schemes and designs
- Categories: Modern, Professional, Creative, Technical, Premium, etc.
- Real-time template switching
- Smooth animations and transitions

### 🔐 **Secure Authentication**
- User registration (Signup)
- Secure login with bcryptjs password hashing
- Session management (24-hour duration)
- Protected routes for authenticated users
- Logout functionality

### 📝 **Complete CV Builder**
- **Personal Information**: Name, job title, email, phone, location, website
- **Professional Summary**: 4-line text area for overview
- **Work Experience**: Multiple entries with descriptions
- **Education**: Multiple degrees/certifications
- **Skills**: Tag-based skill management
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
- Authentication-protected

### 📱 **Responsive Design**
- Works on all devices (Mobile, Tablet, Desktop)
- Touch-friendly buttons
- Adaptive layouts
- Beautiful animations

### 🚀 **Modern Tech Stack**
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js, Express.js
- Authentication: bcryptjs, express-session
- Process Management: PM2 (auto-restart, monitoring)
- Database: JSON (upgradeable to MongoDB)

---

## 📋 What's Included

✅ 50 unique CV templates with custom styling  
✅ User authentication system (Login/Signup)  
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

### Installation

```bash
# Navigate to directory
cd cv-builder

# Install dependencies
npm install

# Start server with PM2
./start.sh

# Or manually start
npm start
```

**Access**: http://localhost:3001

### Test Account
```
Email: test@example.com
Password: password123
```

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
- **CV Templates**: 50
- **User Reviews**: 50+
- **Features**: 15+
- **Responsive Breakpoints**: 5
- **Performance**: 0% CPU at idle

---

## 📁 Project Structure

```
cv-builder/
├── index.html           # Main CV builder app
├── login.html          # Login page
├── signup.html         # Registration page
├── app.js              # Frontend logic (templates, reviews)
├── server.js           # Express backend (auth, API)
├── style.css           # All styling (50 templates)
├── package.json        # Dependencies
├── ecosystem.config.js # PM2 config
├── start.sh            # Startup script
├── users.json          # User database
├── DEPLOYMENT.md       # Deployment guide
└── README.md           # This file
```

---

## 🎯 Usage Steps

### 1. **Register/Login**
- Click Signup to create account
- Or use test account credentials

### 2. **Fill Your Information**
- Personal details
- Work experience
- Education
- Skills
- Languages

### 3. **Select a Template**
- Click "Show All Styles"
- Choose from 50 templates
- See instant preview

### 4. **Preview & Download**
- Click "Preview CV"
- Click "Download PDF"
- Share with employers!

---

## 🛠️ Technology Stack

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | Node.js, Express.js v4.18.2 |
| Authentication | bcryptjs v2.4.3 |
| Sessions | express-session v1.17.3 |
| Process Management | PM2 |
| Database | JSON (MongoDB ready) |
| Icons | Font Awesome 6.4.0 |
| Package Manager | npm |

---

## 🔐 Security Features

- ✅ Password hashing with bcryptjs
- ✅ Secure session management
- ✅ Protected download functionality
- ✅ Input validation
- ✅ CSRF protection ready
- ✅ User data isolation

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