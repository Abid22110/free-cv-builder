# FREE CV Builder - Render.com Deployment (100% FREE)

## ✅ Render.com - Completely FREE Option

### Step-by-Step Instructions:

## 📝 STEP 1: Go to Render.com

**Visit**: https://render.com

Click "Get Started for Free"

---

## 📝 STEP 2: Sign Up with GitHub

1. Click **"Sign in with GitHub"**
2. Authorize Render to access your GitHub
3. ✅ Done!

---

## 📝 STEP 3: Create New Web Service

1. Click **"New +"** button (top right)
2. Select **"Web Service"**
3. Connect your GitHub account (if not already)

---

## 📝 STEP 4: Select Repository

1. Find **"free-cv-builder"** repository
2. Click **"Connect"**

---

## 📝 STEP 5: Configure Settings

Fill in these details:

```
Name: free-cv-builder
OR
Name: my-cv-builder

Region: Select closest to you (e.g., Singapore, Frankfurt)

Branch: main

Root Directory: (leave blank)

Environment: Node

Build Command: npm install

Start Command: npm start
```

---

## 📝 STEP 6: Select Free Plan

**Important**: 
- Scroll down to "Instance Type"
- Select: **"Free"** (0 USD/month)
- ✅ Completely FREE forever!

---

## 📝 STEP 7: Advanced Settings (Optional)

**Add Environment Variable** (recommended):
```
Key: NODE_ENV
Value: production
```

**Also add (recommended):**
```
Key: SESSION_SECRET
Value: (any long random string)
```

To add:
1. Click "Advanced" button
2. Click "Add Environment Variable"
3. Enter key and value
4. Click "Save"

---

## 📝 STEP 8: Deploy!

1. Click **"Create Web Service"** button at bottom
2. Wait 3-5 minutes for deployment
3. Watch the logs - you'll see:
   - Building...
   - Installing dependencies...
   - Starting server...
   - ✅ Live!

---

## 🎉 STEP 9: Get Your URL

Once deployed, you'll get a URL like:
```
https://free-cv-builder.onrender.com
OR
https://my-cv-builder.onrender.com
```

**Share this URL with everyone!** 🌍

---

## ⚡ Important Notes:

### Free Plan Features:
✅ 100% FREE forever
✅ Automatic HTTPS
✅ Auto-deploy on GitHub push
✅ 750 hours/month (enough for 24/7)
✅ Custom domain support

### Free Plan Limitations:
⚠️ App sleeps after 15 minutes of inactivity
⚠️ Takes 30-50 seconds to wake up
⚠️ 512 MB RAM

**But it's PERFECT for your CV Builder!** ✅

---

## 🔧 If App Sleeps:

Your app will **sleep after 15 minutes** of no visitors.

**Solution**: First visitor waits 30 seconds, then it's fast!

**Want to keep it awake?** (Optional)
- Use a free service like UptimeRobot (https://uptimerobot.com)
- Ping your URL every 10 minutes
- Free plan available

---

## 🚨 Common Issues & Solutions:

### Issue 1: "Build Failed"
**Solution**: Check logs, usually it's:
- Missing dependencies → Already fixed ✅
- Wrong start command → Already correct ✅

### Issue 2: "Application Failed to Start"
**Solution**: Check if PORT is set correctly
- Our server uses: `process.env.PORT || 3001` ✅
- Render automatically sets PORT ✅

### Issue 3: "Cannot find users.json"
**Solution**: Server creates it automatically ✅

---

## 📊 After Deployment:

### Test Your App:

1. **Visit your URL**: `https://your-app.onrender.com`
2. **Create account**: Click Signup
3. **Login**: Use your credentials
4. **Create CV**: Fill form, select template
5. **Download**: Click Download PDF

---

## 🔄 Auto-Deploy:

Every time you push to GitHub:
1. Render automatically detects changes
2. Rebuilds your app
3. Deploys new version
4. ✅ Always up-to-date!

---

## 💰 Cost Breakdown:

```
Render Free Plan: $0/month
Domain (optional): $0 (use .onrender.com)
SSL Certificate: $0 (automatic)
Bandwidth: $0 (100GB free)

Total: $0/month ✅
```

---

## 📱 Custom Domain (Optional):

If you want your own domain later:

1. Buy domain from Namecheap/GoDaddy
2. In Render settings → Custom Domain
3. Add your domain
4. Update DNS records (Render shows you how)
5. ✅ Your domain connected!

---

## 🎯 Quick Reference:

**Render Dashboard**: https://dashboard.render.com
**Your Repo**: https://github.com/Abid22110/free-cv-builder
**Logs**: Click your service → "Logs" tab
**Settings**: Click your service → "Settings"

---

## 🆘 Need Help?

1. **Check Logs**: Most errors show here
2. **Render Docs**: https://render.com/docs
3. **Community**: Render community forum

---

## ✅ Checklist:

Before deploying, make sure:
- ✅ Code pushed to GitHub
- ✅ package.json has correct scripts
- ✅ server.js uses process.env.PORT
- ✅ All files committed

**Everything is ready! Just follow the steps above!** 🚀

---

## 🎉 Success Indicators:

You'll know it's working when:
1. ✅ Build completes successfully
2. ✅ Server logs show "Running on port..."
3. ✅ You can visit the URL
4. ✅ Login page loads
5. ✅ You can create account and login

---

**Expected Timeline**:
- Sign up: 2 minutes
- Configure: 3 minutes
- Deploy: 3-5 minutes
- **Total: ~10 minutes** ⏱️

**Cost: $0** 💰

**Status: 100% Free Forever** ✅

---

Made with ❤️ by Abid
Last Updated: January 3, 2026
Version: 2.0

**GO DEPLOY NOW!** 🚀
