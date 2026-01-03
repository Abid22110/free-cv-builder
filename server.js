const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files (CSS, JS, images)
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));
app.use('/app.js', express.static(path.join(__dirname, 'app.js')));
app.use(express.static(__dirname, { 
    index: false // Don't serve index.html automatically
}));

// Main app (public)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Legacy routes (login/signup removed) -> redirect to the app
app.get('/login.html', (req, res) => {
    res.redirect('/');
});

app.get('/signup.html', (req, res) => {
    res.redirect('/');
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CV Builder is running on port ${PORT}`);
    console.log(`✅ No login required (static app)`);
});
