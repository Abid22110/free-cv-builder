const express = require('express');
const path = require('path');
const OpenAI = require('openai');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 3001;

function safeJsonParse(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic security + caching headers (keep minimal; static HTML should not be aggressively cached)
app.use((req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
});

// Health check (useful for Render/Railway)
app.get('/health', (req, res) => {
        res.status(200).json({ ok: true });
});

// Runtime config (set via hosting environment variables; avoids editing files per deploy)
// - AI_API_BASE_URL (optional)
// - FIREBASE_CONFIG_JSON (optional) OR FIREBASE_API_KEY/FIREBASE_AUTH_DOMAIN/FIREBASE_PROJECT_ID/FIREBASE_APP_ID
app.get('/config.js', (req, res) => {
        res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store, max-age=0');

        const aiBaseUrl = String(process.env.AI_API_BASE_URL || '').trim();

        const firebaseFromJson = safeJsonParse(process.env.FIREBASE_CONFIG_JSON);
        const firebaseFromParts = {
                apiKey: String(process.env.FIREBASE_API_KEY || '').trim(),
                authDomain: String(process.env.FIREBASE_AUTH_DOMAIN || '').trim(),
                projectId: String(process.env.FIREBASE_PROJECT_ID || '').trim(),
                appId: String(process.env.FIREBASE_APP_ID || '').trim()
        };

        const firebaseCandidate = (firebaseFromJson && typeof firebaseFromJson === 'object')
                ? firebaseFromJson
                : firebaseFromParts;

        const hasFirebase = !!(firebaseCandidate?.apiKey && firebaseCandidate?.authDomain && firebaseCandidate?.projectId);
        const hasAi = !!aiBaseUrl;

        const js = `;(function(){
    try {
        var hasAi = ${hasAi ? 'true' : 'false'};
        var hasFirebase = ${hasFirebase ? 'true' : 'false'};

        if (hasAi) {
            window.APP_CONFIG = Object.assign({}, window.APP_CONFIG || {}, { AI_API_BASE_URL: ${JSON.stringify(aiBaseUrl)} });
        }

        if (hasFirebase) {
            window.FIREBASE_CONFIG = Object.assign({}, window.FIREBASE_CONFIG || {}, ${JSON.stringify(firebaseCandidate)});
        }
    } catch (e) {}
})();\n`;

        res.status(200).send(js);
});

// CORS for AI endpoint (so a static frontend like GitHub Pages can call this backend)
// Configure allowed origins via CORS_ORIGIN (comma-separated) or '*' for any.
app.use('/api/ai', (req, res, next) => {
    const configured = String(process.env.CORS_ORIGIN || 'https://abid22110.github.io').trim();
    const allowAny = configured === '*';
    const allowList = configured
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    const origin = req.headers.origin;
    if (origin) {
        if (allowAny) {
            res.setHeader('Access-Control-Allow-Origin', '*');
        } else if (allowList.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
            res.setHeader('Vary', 'Origin');
        }
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    }

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }
    next();
});

// Serve static files (CSS, JS, images)
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));
app.use('/app.js', express.static(path.join(__dirname, 'app.js')));
app.use(express.static(__dirname, { 
    index: false // Don't serve index.html automatically
}));

// Friendly auth routes (for production URLs)
app.get('/login', (req, res) => {
    res.redirect(302, '/login.html');
});

app.get('/signup', (req, res) => {
    res.redirect(302, '/signup.html');
});

// --- AI Assistant API (server-side proxy to keep keys private) ---
// Requires: OPENAI_API_KEY in environment
// Optional: OPENAI_MODEL (default: gpt-4o-mini)
app.post('/api/ai', async (req, res) => {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.status(501).json({
                error: 'AI is not configured on the server. Set OPENAI_API_KEY and restart the server.'
            });
        }

        const { prompt, context } = req.body || {};
        const safePrompt = String(prompt || '').trim();
        const safeContext = String(context || '').trim();

        if (!safePrompt) {
            return res.status(400).json({ error: 'Missing prompt' });
        }

        const openai = new OpenAI({ apiKey });
        const model = String(process.env.OPENAI_MODEL || 'gpt-4o-mini');

        const system =
            'You are an expert CV/resume writing assistant. ' +
            'Write concise, ATS-friendly content. ' +
            'Use a clean, confident, slightly unique tone without being flashy. ' +
            'Prefer strong action verbs and measurable impact. ' +
            'If key info is missing, ask 1-2 short clarifying questions. ' +
            'Avoid personal data not provided. ' +
            'If asked for a summary, keep it 3-5 lines. ' +
            'If asked for skills, return a comma-separated list. ' +
            'If asked to rewrite bullets, return bullet points using hyphen.';

        const messages = [
            { role: 'system', content: system }
        ];

        if (safeContext) {
            messages.push({ role: 'user', content: `Context:\n${safeContext}` });
        }

        messages.push({ role: 'user', content: safePrompt });

        const completion = await openai.chat.completions.create({
            model,
            messages,
            temperature: 0.6,
            max_tokens: 1000
        });

        const text = completion.choices[0]?.message?.content;
        return res.json({ text: String(text || '').trim() });
    } catch (err) {
        console.error('AI Error:', err);
        return res.status(500).json({ error: 'AI request failed' });
    }
});

// Main app (public)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 CV Builder is running on port ${PORT}`);
    console.log(`✅ App ready (login is optional)`);
});
