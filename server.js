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

        const model = String(process.env.OPENAI_MODEL || 'gpt-4o-mini');

        const system =
            'You are an expert CV/resume writing assistant. ' +
            'Write concise, ATS-friendly content. ' +
            'Avoid personal data not provided. ' +
            'If asked for a summary, keep it 3-5 lines. ' +
            'If asked for skills, return a comma-separated list. ' +
            'If asked to rewrite bullets, return bullet points using hyphen.';

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: system },
                    safeContext ? { role: 'user', content: `Context:\n${safeContext}` } : null,
                    { role: 'user', content: safePrompt }
                ].filter(Boolean),
                temperature: 0.6
            })
        });

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
            const msg = data?.error?.message || `OpenAI request failed (${response.status})`;
            return res.status(502).json({ error: msg });
        }

        const text = data?.choices?.[0]?.message?.content;
        return res.json({ text: String(text || '').trim() });
    } catch (err) {
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
