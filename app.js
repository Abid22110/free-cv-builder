// Global counters for dynamic elements
let experienceCount = 0;
let educationCount = 0;
let courseCount = 0;
let languageCount = 0;
let currentStyle = 'style1'; // Default style
let profilePhotoDataUrl = '';
let skillsList = [];

const CV_DRAFT_STORAGE_PREFIX = 'free-cv-builder:draft:v2.1';
let currentAuthUid = null;
let draftSaveTimer = null;

function getDraftStorageKey(uid = currentAuthUid) {
    const owner = uid ? String(uid) : 'guest';
    return `${CV_DRAFT_STORAGE_PREFIX}:${owner}`;
}

function switchDraftOwner(uid) {
    const nextUid = uid ? String(uid) : null;
    if (nextUid === currentAuthUid) return;

    // Save current draft before switching keys.
    saveCvDraft();

    const prevKey = getDraftStorageKey(currentAuthUid);
    const nextKey = getDraftStorageKey(nextUid);

    // If user signs in and has no draft yet, migrate the guest draft.
    try {
        const prevRaw = localStorage.getItem(prevKey);
        const nextRaw = localStorage.getItem(nextKey);
        if (nextUid && !nextRaw && prevRaw) {
            localStorage.setItem(nextKey, prevRaw);
        }
    } catch {
        // ignore
    }

    currentAuthUid = nextUid;
    loadCvDraft({ storageKey: nextKey });
}

function safeJsonParse(value) {
    try {
        return JSON.parse(value);
    } catch {
        return null;
    }
}

function scheduleSaveDraft(delayMs = 450) {
    if (draftSaveTimer) {
        clearTimeout(draftSaveTimer);
    }
    draftSaveTimer = setTimeout(() => {
        draftSaveTimer = null;
        saveCvDraft();
    }, delayMs);
}

function collectCvDraft() {
    const getVal = (id) => String(document.getElementById(id)?.value || '').trim();

    const experiences = Array.from(document.querySelectorAll('.experience-item')).map((exp) => ({
        title: String(exp.querySelector('.exp-title')?.value || '').trim(),
        company: String(exp.querySelector('.exp-company')?.value || '').trim(),
        start: String(exp.querySelector('.exp-start')?.value || '').trim(),
        end: String(exp.querySelector('.exp-end')?.value || '').trim(),
        description: String(exp.querySelector('.exp-description')?.value || '').trim()
    })).filter(e => e.title || e.company || e.description);

    const education = Array.from(document.querySelectorAll('.education-item')).map((edu) => ({
        degree: String(edu.querySelector('.edu-degree')?.value || '').trim(),
        school: String(edu.querySelector('.edu-school')?.value || '').trim(),
        start: String(edu.querySelector('.edu-start')?.value || '').trim(),
        end: String(edu.querySelector('.edu-end')?.value || '').trim(),
        description: String(edu.querySelector('.edu-description')?.value || '').trim()
    })).filter(e => e.degree || e.school || e.description);

    const courses = Array.from(document.querySelectorAll('.course-item')).map((course) => ({
        title: String(course.querySelector('.course-title')?.value || '').trim(),
        org: String(course.querySelector('.course-org')?.value || '').trim(),
        start: String(course.querySelector('.course-start')?.value || '').trim(),
        end: String(course.querySelector('.course-end')?.value || '').trim(),
        description: String(course.querySelector('.course-description')?.value || '').trim()
    })).filter(c => c.title || c.org || c.description);

    const languages = Array.from(document.querySelectorAll('.language-item')).map((lang) => ({
        name: String(lang.querySelector('.lang-name')?.value || '').trim(),
        level: String(lang.querySelector('.lang-level')?.value || '').trim()
    })).filter(l => l.name);

    // Photo can be large; store only if reasonably sized.
    const photo = String(profilePhotoDataUrl || '');
    const photoSafe = photo && photo.length <= 220000 ? photo : '';

    let aiChatMessages = [];
    try {
        const chat = window.__freeCvAiChat;
        if (chat && typeof chat.getMessages === 'function') {
            aiChatMessages = chat
                .getMessages()
                .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && !m.pending)
                .map((m) => ({ role: m.role, content: String(m.content || '').trim() }))
                .filter((m) => m.content)
                .slice(-20);
        }
    } catch {
        // ignore
    }

    return {
        version: '2.1',
        savedAt: Date.now(),
        currentStyle: String(currentStyle || 'style1'),
        profilePhotoDataUrl: photoSafe,
        skillsList: Array.isArray(skillsList) ? skillsList.slice(0, 60) : [],
        aiChatMessages,
        fields: {
            fullName: getVal('fullName'),
            jobTitle: getVal('jobTitle'),
            email: getVal('email'),
            phone: getVal('phone'),
            location: getVal('location'),
            website: getVal('website'),
            summary: String(document.getElementById('summary')?.value || ''),
            signatureName: getVal('signatureName')
        },
        experiences,
        education,
        courses,
        languages
    };
}

function saveCvDraft() {
    try {
        const draft = collectCvDraft();
        localStorage.setItem(getDraftStorageKey(), JSON.stringify(draft));
    } catch {
        // Ignore storage failures (quota/private mode).
    }
}

function clearCvDraft() {
    try {
        localStorage.removeItem(getDraftStorageKey());
    } catch {
        // ignore
    }
}

function loadCvDraft({ storageKey } = {}) {
    const key = storageKey ? String(storageKey) : getDraftStorageKey();
    const raw = (() => {
        try {
            return localStorage.getItem(key);
        } catch {
            return null;
        }
    })();

    const draft = safeJsonParse(raw);
    if (!draft || typeof draft !== 'object') return;

    const setVal = (id, value) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.value = value ?? '';
    };

    const fields = draft.fields || {};
    setVal('fullName', fields.fullName);
    setVal('jobTitle', fields.jobTitle);
    setVal('email', fields.email);
    setVal('phone', fields.phone);
    setVal('location', fields.location);
    setVal('website', fields.website);
    if (document.getElementById('summary')) {
        document.getElementById('summary').value = String(fields.summary || '');
    }
    setVal('signatureName', fields.signatureName);

    currentStyle = String(draft.currentStyle || currentStyle || 'style1');
    profilePhotoDataUrl = String(draft.profilePhotoDataUrl || '');

    skillsList = Array.isArray(draft.skillsList) ? draft.skillsList.slice(0, 60) : [];
    renderSkillsChips();
    syncSkillsHiddenValue();

    const expContainer = document.getElementById('experienceContainer');
    const eduContainer = document.getElementById('educationContainer');
    const courseContainer = document.getElementById('courseContainer');
    const langContainer = document.getElementById('languageContainer');
    if (expContainer) expContainer.innerHTML = '';
    if (eduContainer) eduContainer.innerHTML = '';
    if (courseContainer) courseContainer.innerHTML = '';
    if (langContainer) langContainer.innerHTML = '';

    experienceCount = 0;
    educationCount = 0;
    courseCount = 0;
    languageCount = 0;

    const experiences = Array.isArray(draft.experiences) ? draft.experiences : [];
    const education = Array.isArray(draft.education) ? draft.education : [];
    const courses = Array.isArray(draft.courses) ? draft.courses : [];
    const languages = Array.isArray(draft.languages) ? draft.languages : [];

    if (experiences.length === 0) {
        addExperience();
    } else {
        for (const e of experiences) {
            addExperience();
            const last = expContainer?.lastElementChild;
            if (!last) continue;
            const t = last.querySelector('.exp-title');
            const c = last.querySelector('.exp-company');
            const s = last.querySelector('.exp-start');
            const en = last.querySelector('.exp-end');
            const d = last.querySelector('.exp-description');
            if (t) t.value = e.title || '';
            if (c) c.value = e.company || '';
            if (s) s.value = e.start || '';
            if (en) en.value = e.end || '';
            if (d) d.value = e.description || '';
        }
    }

    if (education.length === 0) {
        addEducation();
    } else {
        for (const e of education) {
            addEducation();
            const last = eduContainer?.lastElementChild;
            if (!last) continue;
            const deg = last.querySelector('.edu-degree');
            const sch = last.querySelector('.edu-school');
            const s = last.querySelector('.edu-start');
            const en = last.querySelector('.edu-end');
            const d = last.querySelector('.edu-description');
            if (deg) deg.value = e.degree || '';
            if (sch) sch.value = e.school || '';
            if (s) s.value = e.start || '';
            if (en) en.value = e.end || '';
            if (d) d.value = e.description || '';
        }
    }

    if (courses.length === 0) {
        addCourse();
    } else {
        for (const c of courses) {
            addCourse();
            const last = courseContainer?.lastElementChild;
            if (!last) continue;
            const title = last.querySelector('.course-title');
            const org = last.querySelector('.course-org');
            const s = last.querySelector('.course-start');
            const en = last.querySelector('.course-end');
            const d = last.querySelector('.course-description');
            if (title) title.value = c.title || '';
            if (org) org.value = c.org || '';
            if (s) s.value = c.start || '';
            if (en) en.value = c.end || '';
            if (d) d.value = c.description || '';
        }
    }

    if (languages.length === 0) {
        addLanguage();
    } else {
        for (const l of languages) {
            addLanguage();
            const last = langContainer?.lastElementChild;
            if (!last) continue;
            const name = last.querySelector('.lang-name');
            const level = last.querySelector('.lang-level');
            if (name) name.value = l.name || '';
            if (level) level.value = l.level || 'Native';
        }
    }

    // Apply selected style to preview container even before generating.
    const preview = document.getElementById('cvPreview');
    if (preview) {
        preview.className = `cv-preview ${currentStyle} ${getLayoutClassForStyle(currentStyle)}`;
    }

    // Restore AI chat messages (if assistant is initialized).
    try {
        const chat = window.__freeCvAiChat;
        if (chat && typeof chat.setMessages === 'function' && Array.isArray(draft.aiChatMessages)) {
            chat.setMessages(draft.aiChatMessages);
        }
    } catch {
        // ignore
    }

    // Auto-preview if required fields exist.
    const fullName = String(fields.fullName || '').trim();
    const jobTitle = String(fields.jobTitle || '').trim();
    const email = String(fields.email || '').trim();
    if (fullName && jobTitle && email) {
        try {
            generateCV();
        } catch {
            // ignore
        }
    }
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function escapeHtmlMultiline(value) {
    const escaped = escapeHtml(value);
    return escaped.replace(/\r\n|\r|\n/g, '<br>');
}

function openExternalLink(event, url) {
    if (event && typeof event.preventDefault === 'function') {
        event.preventDefault();
    }

    try {
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
            window.location.href = url;
        }
    } catch {
        window.location.href = url;
    }
}

function stripLeadingIconToken(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';

    const parts = raw.split(/\s+/);
    if (parts.length < 2) return raw;

    const firstToken = parts[0];
    // Strip only if the first token looks like an icon/emoji (no letters/numbers).
    if (!/[A-Za-z0-9]/.test(firstToken)) {
        return parts.slice(1).join(' ').trim() || raw;
    }
    return raw;
}

function getTemplateDisplayName(template) {
    const raw = String(template?.name || '').trim();
    // If name starts with an emoji/icon, strip it so browsers don't show "?".
    return stripLeadingIconToken(raw) || raw;
}

function getTemplateNumber(template) {
    const id = String(template?.id || '');
    const match = id.match(/(\d+)/);
    return match ? Number(match[1]) : 0;
}

function getCurrentTemplateMeta() {
    const template = cvTemplates.find(t => t.id === currentStyle);
    if (!template) {
        return { name: 'Template', category: 'Default', iconClass: 'fa-star' };
    }

    const displayName = stripLeadingIconToken(template.name);
    const iconByCategory = {
        Modern: 'fa-bolt',
        Classic: 'fa-landmark',
        Professional: 'fa-briefcase',
        Creative: 'fa-palette',
        Executive: 'fa-user-tie',
        Warm: 'fa-fire',
        Elegant: 'fa-gem',
        Technical: 'fa-microchip',
        Marketing: 'fa-bullhorn',
        Corporate: 'fa-building',
        Minimalist: 'fa-minus',
        Digital: 'fa-wifi',
        Startup: 'fa-rocket',
        Premium: 'fa-crown',
        Business: 'fa-chart-line',
        Academic: 'fa-graduation-cap',
        Natural: 'fa-leaf',
        Cool: 'fa-snowflake',
        Bold: 'fa-bolt',
        Luxury: 'fa-gem',
        Playful: 'fa-face-smile',
        Dark: 'fa-moon',
        Bright: 'fa-sun',
        Financial: 'fa-coins',
        Medical: 'fa-briefcase-medical',
        Legal: 'fa-scale-balanced',
        Media: 'fa-photo-film',
        International: 'fa-globe',
        Vibrant: 'fa-wand-magic-sparkles'
    };

    return {
        name: displayName,
        category: template.category,
        iconClass: iconByCategory[template.category] || 'fa-star'
    };
}

function updateCvThemeBadge() {
    const badgeName = document.querySelector('.cv-theme-name');
    const badgeIcon = document.querySelector('.cv-theme-icon');
    if (!badgeName || !badgeIcon) return;

    const meta = getCurrentTemplateMeta();
    badgeName.textContent = meta.name;
    badgeIcon.className = `fas ${meta.iconClass} cv-theme-icon`;
}

window.addEventListener('DOMContentLoaded', async () => {
    initializeStyleGrid();
    addExperience();
    addEducation();
    addCourse();
    addLanguage();
    setupProfilePhotoUpload();
    setupSkillsChips();
    setupAiAssistant();
    setupWizard();
    setupAuthUi();

    // Restore a saved draft if present.
    loadCvDraft();

    // Auto-save on any input changes.
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.addEventListener('input', () => scheduleSaveDraft());
        formSection.addEventListener('change', () => scheduleSaveDraft());
        formSection.addEventListener('click', (e) => {
            const el = e.target;
            if (el && (el.closest('.add-btn') || el.closest('.remove-btn'))) {
                scheduleSaveDraft();
            }
        });
    }
});

function setupAuthUi() {
    const statusEl = document.getElementById('authStatusText');
    const signInLink = document.getElementById('authSignInLink');
    const signOutBtn = document.getElementById('authSignOutBtn');

    if (!statusEl || !signInLink || !signOutBtn) return;

    const config = typeof window !== 'undefined' ? window.FIREBASE_CONFIG : null;
    const firebaseAvailable = typeof window !== 'undefined' && window.firebase && config;
    const configured = !!(config?.apiKey && String(config.apiKey) !== 'REPLACE_ME');

    if (!firebaseAvailable || !configured) {
        statusEl.textContent = 'Free • Optional Login (configure Firebase)';
        signInLink.style.display = '';
        signOutBtn.style.display = 'none';
        return;
    }

    try {
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(config);
        }

        const auth = firebase.auth();

        const setSignedOut = () => {
            statusEl.textContent = 'Free • Optional Login';
            signInLink.style.display = '';
            signOutBtn.style.display = 'none';
        };

        const setSignedIn = (user) => {
            const label = user?.displayName || user?.email || 'Account';
            statusEl.textContent = `Signed in: ${label}`;
            signInLink.style.display = 'none';
            signOutBtn.style.display = '';
        };

        signOutBtn.addEventListener('click', async () => {
            try {
                await auth.signOut();
            } catch {
                // ignore
            }
        });

        auth.onAuthStateChanged((user) => {
            if (user) setSignedIn(user);
            else setSignedOut();
            switchDraftOwner(user?.uid);
        });
    } catch {
        statusEl.textContent = 'Free • Optional Login';
        signInLink.style.display = '';
        signOutBtn.style.display = 'none';
    }
}

function setupWizard() {
    const header = document.getElementById('wizardHeader');
    if (!header) return;

    const steps = Array.from(document.querySelectorAll('.wizard-step'));
    const panels = Array.from(document.querySelectorAll('.wizard-panel'));
    const progress = document.getElementById('wizardProgressBar');

    const btnNext1 = document.getElementById('wizardNext1');
    const btnBack2 = document.getElementById('wizardBack2');
    const btnNext2 = document.getElementById('wizardNext2');
    const btnBack3 = document.getElementById('wizardBack3');
    const btnPreview = document.getElementById('wizardPreviewBtn');

    let current = 1;

    const setStep = (n) => {
        current = Math.max(1, Math.min(3, Number(n) || 1));

        for (const s of steps) {
            const sn = Number(s.getAttribute('data-step'));
            const active = sn === current;
            s.classList.toggle('is-active', active);
            if (active) {
                s.setAttribute('aria-current', 'step');
            } else {
                s.removeAttribute('aria-current');
            }
        }

        for (const p of panels) {
            const pn = Number(p.getAttribute('data-step'));
            p.style.display = pn === current ? '' : 'none';
        }

        if (progress) {
            progress.style.width = `${(current / 3) * 100}%`;
        }

        // Keep the view near the top of the form section when changing steps.
        header.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const canGenerate = () => {
        const fullName = String(document.getElementById('fullName')?.value || '').trim();
        const jobTitle = String(document.getElementById('jobTitle')?.value || '').trim();
        const email = String(document.getElementById('email')?.value || '').trim();
        return !!(fullName && jobTitle && email);
    };

    const refreshPreview = () => {
        if (!canGenerate()) {
            alert('Please fill required fields: Full Name, Job Title, and Email');
            return false;
        }
        generateCV();
        return true;
    };

    if (btnNext1) {
        btnNext1.addEventListener('click', () => {
            if (!refreshPreview()) return;
            setStep(2);
        });
    }

    if (btnPreview) {
        btnPreview.addEventListener('click', () => {
            refreshPreview();
        });
    }

    if (btnBack2) btnBack2.addEventListener('click', () => setStep(1));

    if (btnNext2) {
        btnNext2.addEventListener('click', () => {
            // Ensure preview exists before download step.
            if (!refreshPreview()) return;
            setStep(3);
        });
    }

    if (btnBack3) btnBack3.addEventListener('click', () => setStep(2));

    for (const s of steps) {
        s.addEventListener('click', () => {
            const sn = Number(s.getAttribute('data-step'));
            if (sn === 1) return setStep(1);
            if (sn === 2) {
                if (!refreshPreview()) return;
                return setStep(2);
            }
            if (sn === 3) {
                if (!refreshPreview()) return;
                return setStep(3);
            }
        });
    }

    setStep(1);
}

function setupAiAssistant() {
    const card = document.getElementById('aiAssistantCard');
    if (!card) return;

    const btnSummary = document.getElementById('aiGenerateSummaryBtn');
    const btnSkills = document.getElementById('aiSuggestSkillsBtn');
    const btnImprove = document.getElementById('aiImproveExperienceBtn');
    const btnRun = document.getElementById('aiRunCustomBtn');
    const btnCopy = document.getElementById('aiCopyBtn');
    const btnClear = document.getElementById('aiClearChatBtn');
    const promptEl = document.getElementById('aiPrompt');
    const messagesEl = document.getElementById('aiMessages');

    const messages = [];

    // Expose minimal hooks so draft autosave can persist chat per-user.
    window.__freeCvAiChat = {
        getMessages: () => messages.slice(),
        setMessages: (arr) => {
            messages.length = 0;
            const incoming = Array.isArray(arr) ? arr : [];
            for (const m of incoming.slice(-20)) {
                const role = m?.role === 'assistant' ? 'assistant' : 'user';
                const content = String(m?.content || '').trim();
                if (!content) continue;
                messages.push({ role, content });
            }
            renderMessages();
        }
    };
    const getLastAssistant = () => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'assistant' && !messages[i].pending) return messages[i].content;
        }
        return '';
    };

    const renderMessages = () => {
        if (!messagesEl) return;
        messagesEl.innerHTML = '';

        if (messages.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'ai-msg assistant';
            const bubble = document.createElement('div');
            bubble.className = 'ai-bubble';
            bubble.textContent = 'Hi! Use the buttons above, or ask me to write a summary, improve bullets, or suggest skills.';
            empty.appendChild(bubble);
            messagesEl.appendChild(empty);
        } else {
            for (const m of messages) {
                const row = document.createElement('div');
                row.className = `ai-msg ${m.role}`;
                const bubble = document.createElement('div');
                bubble.className = `ai-bubble${m.pending ? ' is-pending' : ''}`;
                bubble.textContent = m.content;
                row.appendChild(bubble);
                messagesEl.appendChild(row);
            }
        }

        if (btnCopy) {
            btnCopy.disabled = !String(getLastAssistant() || '').trim();
        }
        messagesEl.scrollTop = messagesEl.scrollHeight;
    };

    const pushMessage = (role, content, { pending = false } = {}) => {
        const text = String(content || '').trim();
        if (!text) return;
        messages.push({ role, content: text, pending: !!pending });
        // Keep chat light
        if (messages.length > 20) messages.splice(0, messages.length - 20);
        renderMessages();
    };

    const replaceLastPendingAssistant = (content) => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i].role === 'assistant' && messages[i].pending) {
                messages[i].content = String(content || '').trim();
                messages[i].pending = false;
                renderMessages();
                return;
            }
        }
        pushMessage('assistant', content);
    };

    const setBusy = (busy) => {
        const buttons = [btnSummary, btnSkills, btnImprove, btnRun, btnCopy, btnClear].filter(Boolean);
        for (const b of buttons) {
            b.disabled = !!busy || (b === btnCopy && !String(getLastAssistant() || '').trim());
        }
        card.classList.toggle('is-busy', !!busy);
    };

    const postAi = async ({ prompt, context }) => {
        const response = await fetch('/api/ai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, context })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data?.error || 'AI request failed');
        }
        return String(data?.text || '').trim();
    };

    const getAiContext = () => {
        const fullName = String(document.getElementById('fullName')?.value || '').trim();
        const jobTitle = String(document.getElementById('jobTitle')?.value || '').trim();
        const summary = String(document.getElementById('summary')?.value || '').trim();
        const skills = String(document.getElementById('skills')?.value || '').trim();

        const experiences = Array.from(document.querySelectorAll('.experience-item')).map((exp) => ({
            title: String(exp.querySelector('.exp-title')?.value || '').trim(),
            company: String(exp.querySelector('.exp-company')?.value || '').trim(),
            start: String(exp.querySelector('.exp-start')?.value || '').trim(),
            end: String(exp.querySelector('.exp-end')?.value || '').trim(),
            description: String(exp.querySelector('.exp-description')?.value || '').trim()
        })).filter(e => e.title || e.company || e.description);

        const education = Array.from(document.querySelectorAll('.education-item')).map((edu) => ({
            degree: String(edu.querySelector('.edu-degree')?.value || '').trim(),
            school: String(edu.querySelector('.edu-school')?.value || '').trim(),
            start: String(edu.querySelector('.edu-start')?.value || '').trim(),
            end: String(edu.querySelector('.edu-end')?.value || '').trim(),
            details: String(edu.querySelector('.edu-description')?.value || '').trim()
        })).filter(e => e.degree || e.school || e.details);

        const languages = Array.from(document.querySelectorAll('.language-item')).map((lang) => ({
            name: String(lang.querySelector('.lang-name')?.value || '').trim(),
            level: String(lang.querySelector('.lang-level')?.value || '').trim()
        })).filter(l => l.name);

        const recentChat = messages.slice(-6).map(m => ({ role: m.role, content: m.content }));

        const payload = {
            fullName,
            jobTitle,
            summary,
            skills,
            experiences,
            education,
            languages,
            recentChat
        };

        // Keep context reasonably small.
        return JSON.stringify(payload).slice(0, 6000);
    };

    const applySummary = (text) => {
        const el = document.getElementById('summary');
        if (!el) return;
        el.value = String(text || '').trim();
    };

    const applySkills = (text) => {
        const raw = String(text || '').trim();
        if (!raw) return;

        const parts = raw
            .split(/,|\n/)
            .map(s => s.trim())
            .filter(Boolean);

        for (const skill of parts) {
            const normalized = skill.replace(/^[-•\s]+/, '').replace(/\s+/g, ' ').trim();
            if (!normalized) continue;
            if (!skillsList.some(s => s.toLowerCase() === normalized.toLowerCase())) {
                skillsList.push(normalized);
            }
        }
        renderSkillsChips();
        syncSkillsHiddenValue();
    };

    const applyImprovedExperience = (text) => {
        const cleaned = String(text || '').trim();
        if (!cleaned) return;

        const exp = document.querySelector('.experience-item');
        const target = exp?.querySelector('.exp-description');
        if (!target) return;

        // Convert hyphen bullets to plain newlines (keeps it editable)
        const lines = cleaned
            .split(/\r\n|\r|\n/)
            .map(l => l.replace(/^\s*[-•]\s*/, '').trim())
            .filter(Boolean);

        target.value = lines.map(l => `- ${l}`).join('\n');
    };

    const sendMessage = async ({ kind, prompt }) => {
        setBusy(true);
        try {
            const context = getAiContext();
            pushMessage('user', prompt);
            pushMessage('assistant', 'Typing…', { pending: true });
            const text = await postAi({ prompt, context });
            replaceLastPendingAssistant(text);

            if (kind === 'summary') applySummary(text);
            if (kind === 'skills') applySkills(text);
            if (kind === 'improve') applyImprovedExperience(text);
        } catch (e) {
            replaceLastPendingAssistant(`Error: ${String(e?.message || e || 'AI failed')}`);
        } finally {
            setBusy(false);
        }
    };

    const buildPrompt = (kind) => {
        if (kind === 'summary') {
            const jobTitle = String(document.getElementById('jobTitle')?.value || '').trim();
            return `Write a strong, ATS-friendly professional summary for the CV. Role/job title: ${jobTitle || 'Not specified'}. Keep it 3-5 lines. No emojis.`;
        }
        if (kind === 'skills') {
            const jobTitle = String(document.getElementById('jobTitle')?.value || '').trim();
            return `Suggest 12-18 relevant skills for this CV (mix of technical + soft skills). Role/job title: ${jobTitle || 'Not specified'}. Return ONLY a comma-separated list.`;
        }
        if (kind === 'improve') {
            return 'Rewrite the FIRST work experience description into 4-6 impact-focused bullet points. Use hyphen bullets. Quantify where reasonable, but do not invent companies, tools, or numbers.';
        }
        return String(promptEl?.value || '').trim() || 'Improve this CV content for ATS.';
    };

    const run = (kind) => {
        const prompt = buildPrompt(kind);
        if (kind === 'custom' && !String(promptEl?.value || '').trim()) {
            return;
        }
        return sendMessage({ kind: kind === 'custom' ? 'custom' : kind, prompt });
    };

    if (btnSummary) btnSummary.addEventListener('click', () => run('summary'));
    if (btnSkills) btnSkills.addEventListener('click', () => run('skills'));
    if (btnImprove) btnImprove.addEventListener('click', () => run('improve'));
    if (btnRun) btnRun.addEventListener('click', () => run('custom'));

    if (promptEl) {
        promptEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                run('custom');
            }
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            messages.splice(0, messages.length);
            renderMessages();
        });
    }

    if (btnCopy) {
        btnCopy.addEventListener('click', async () => {
            const text = String(getLastAssistant() || '').trim();
            if (!text) return;
            try {
                await navigator.clipboard.writeText(text);
            } catch {
                // Fallback
                const ta = document.createElement('textarea');
                ta.value = text;
                ta.style.position = 'fixed';
                ta.style.left = '-9999px';
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
            }
        });
    }

    renderMessages();
}

function getLayoutClassForStyle(styleId) {
    const match = String(styleId).match(/(\d+)/);
    const n = match ? Number(match[1]) : 1;
    // 10 layout groups across 100 templates
    const group = ((Math.max(1, Math.min(100, n)) - 1) % 10) + 1;
    return `layout-${group}`;
}

function setupSkillsChips() {
    const input = document.getElementById('skillsInput');
    const hidden = document.getElementById('skills');
    if (!input || !hidden) return;

    const seed = String(hidden.value || '').trim();
    if (seed) {
        skillsList = seed.split(',').map(s => s.trim()).filter(Boolean);
    }

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addSkillsFromInput();
        }
    });

    input.addEventListener('blur', () => {
        addSkillsFromInput();
    });

    renderSkillsChips();
}

function addSkillsFromInput() {
    const input = document.getElementById('skillsInput');
    if (!input) return;

    const raw = String(input.value || '').trim();
    if (!raw) return;

    const parts = raw
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

    for (const skill of parts) {
        const normalized = skill.replace(/\s+/g, ' ');
        if (!normalized) continue;
        if (!skillsList.some(s => s.toLowerCase() === normalized.toLowerCase())) {
            skillsList.push(normalized);
        }
    }

    input.value = '';
    renderSkillsChips();
    syncSkillsHiddenValue();
    scheduleSaveDraft();
}

function removeSkill(skill) {
    const target = String(skill || '').toLowerCase();
    skillsList = skillsList.filter(s => s.toLowerCase() !== target);
    renderSkillsChips();
    syncSkillsHiddenValue();
    scheduleSaveDraft();
}

function syncSkillsHiddenValue() {
    const hidden = document.getElementById('skills');
    if (!hidden) return;
    hidden.value = skillsList.join(', ');
}

function renderSkillsChips() {
    const container = document.getElementById('skillsChips');
    if (!container) return;

    container.innerHTML = '';
    for (const skill of skillsList) {
        const chip = document.createElement('span');
        chip.className = 'skill-chip';

        const text = document.createElement('span');
        text.textContent = skill;

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.setAttribute('aria-label', `Remove ${skill}`);
        btn.addEventListener('click', () => removeSkill(skill));

        const icon = document.createElement('i');
        icon.className = 'fas fa-times';
        btn.appendChild(icon);

        chip.appendChild(text);
        chip.appendChild(btn);
        container.appendChild(chip);
    }
}

function setupProfilePhotoUpload() {
    const input = document.getElementById('profilePhoto');
    if (!input) return;

    const resizeImageFileToDataUrl = (file, { maxDimension = 720, quality = 0.86 } = {}) => {
        return new Promise((resolve, reject) => {
            try {
                const url = URL.createObjectURL(file);
                const img = new Image();
                img.onload = () => {
                    try {
                        const width = img.naturalWidth || img.width;
                        const height = img.naturalHeight || img.height;

                        const scale = Math.min(1, maxDimension / Math.max(width, height));
                        const targetW = Math.max(1, Math.round(width * scale));
                        const targetH = Math.max(1, Math.round(height * scale));

                        const canvas = document.createElement('canvas');
                        canvas.width = targetW;
                        canvas.height = targetH;

                        const ctx = canvas.getContext('2d', { alpha: false });
                        if (!ctx) {
                            URL.revokeObjectURL(url);
                            reject(new Error('Canvas not supported'));
                            return;
                        }
                        ctx.imageSmoothingEnabled = true;
                        ctx.imageSmoothingQuality = 'high';
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, targetW, targetH);
                        ctx.drawImage(img, 0, 0, targetW, targetH);

                        const dataUrl = canvas.toDataURL('image/jpeg', quality);
                        URL.revokeObjectURL(url);
                        resolve(dataUrl);
                    } catch (e) {
                        URL.revokeObjectURL(url);
                        reject(e);
                    }
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(new Error('Failed to load image'));
                };
                img.src = url;
            } catch (e) {
                reject(e);
            }
        });
    };

    input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) {
            profilePhotoDataUrl = '';
            scheduleSaveDraft();
            return;
        }

        if (!file.type || !file.type.startsWith('image/')) {
            alert('Please select an image file.');
            input.value = '';
            profilePhotoDataUrl = '';
            scheduleSaveDraft();
            return;
        }

        // Keep it lightweight for GitHub Pages + printing.
        const maxBytes = 2 * 1024 * 1024; // 2MB
        if (file.size > maxBytes) {
            alert('Image is too large. Please use an image under 2MB.');
            input.value = '';
            profilePhotoDataUrl = '';
            scheduleSaveDraft();
            return;
        }

        resizeImageFileToDataUrl(file)
            .then((dataUrl) => {
                profilePhotoDataUrl = String(dataUrl || '');
                scheduleSaveDraft();
                const preview = document.getElementById('cvPreview');
                if (preview && preview.querySelector('.cv-header')) {
                    generateCV();
                }
            })
            .catch(() => {
                // Fallback: use FileReader if resize fails.
                const reader = new FileReader();
                reader.onload = () => {
                    profilePhotoDataUrl = String(reader.result || '');
                    scheduleSaveDraft();
                    const preview = document.getElementById('cvPreview');
                    if (preview && preview.querySelector('.cv-header')) {
                        generateCV();
                    }
                };
                reader.readAsDataURL(file);
            });
    });
}

// Load sample data
function loadSampleData() {
    document.getElementById('fullName').value = 'John Doe';
    document.getElementById('jobTitle').value = 'Full Stack Developer';
    document.getElementById('email').value = 'john.doe@example.com';
    document.getElementById('phone').value = '+92 300 1234567';
    document.getElementById('location').value = 'Karachi, Pakistan';
    document.getElementById('website').value = 'https://johndoe.dev';
    document.getElementById('summary').value = 'Passionate Full Stack Developer with 5+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud technologies.';
    document.getElementById('skills').value = 'JavaScript, React, Node.js, Python, MongoDB, PostgreSQL, AWS, Docker, Git, Agile';
}

// Add Experience
function addExperience() {
    experienceCount++;
    const container = document.getElementById('experienceContainer');
    const item = document.createElement('div');
    item.className = 'experience-item';
    item.id = `experience-${experienceCount}`;
    item.innerHTML = `
        <button type="button" class="remove-btn" onclick="removeItem('experience-${experienceCount}')">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-group">
            <label>Job Title</label>
            <input type="text" class="exp-title" placeholder="e.g., Senior Software Engineer">
        </div>
        <div class="form-group">
            <label>Company</label>
            <input type="text" class="exp-company" placeholder="Company Name">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start Date</label>
                <input type="text" class="exp-start" placeholder="e.g., Jan 2020">
            </div>
            <div class="form-group">
                <label>End Date</label>
                <input type="text" class="exp-end" placeholder="Present or Dec 2023">
            </div>
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="exp-description" rows="3" placeholder="Describe your responsibilities and achievements..."></textarea>
        </div>
    `;
    container.appendChild(item);
}

// Add Education
function addEducation() {
    educationCount++;
    const container = document.getElementById('educationContainer');
    const item = document.createElement('div');
    item.className = 'education-item';
    item.id = `education-${educationCount}`;
    item.innerHTML = `
        <button type="button" class="remove-btn" onclick="removeItem('education-${educationCount}')">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-group">
            <label>Degree</label>
            <input type="text" class="edu-degree" placeholder="e.g., Bachelor of Science in Computer Science">
        </div>
        <div class="form-group">
            <label>School/University</label>
            <input type="text" class="edu-school" placeholder="University Name">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start Year</label>
                <input type="text" class="edu-start" placeholder="e.g., 2015">
            </div>
            <div class="form-group">
                <label>End Year</label>
                <input type="text" class="edu-end" placeholder="e.g., 2019">
            </div>
        </div>
        <div class="form-group">
            <label>Description (Optional)</label>
            <textarea class="edu-description" rows="2" placeholder="GPA, honors, relevant coursework..."></textarea>
        </div>
    `;
    container.appendChild(item);
}

// Add Course / Certification
function addCourse() {
    courseCount++;
    const container = document.getElementById('courseContainer');
    if (!container) return;

    const item = document.createElement('div');
    item.className = 'course-item';
    item.id = `course-${courseCount}`;
    item.innerHTML = `
        <button type="button" class="remove-btn" onclick="removeItem('course-${courseCount}')">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-group">
            <label>Course / Certification</label>
            <input type="text" class="course-title" placeholder="e.g., Web Development Bootcamp">
        </div>
        <div class="form-group">
            <label>Institute / Platform</label>
            <input type="text" class="course-org" placeholder="e.g., Coursera / Udemy / University">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start</label>
                <input type="text" class="course-start" placeholder="e.g., Jan 2024">
            </div>
            <div class="form-group">
                <label>End</label>
                <input type="text" class="course-end" placeholder="e.g., Mar 2024">
            </div>
        </div>
        <div class="form-group">
            <label>Description (Optional)</label>
            <textarea class="course-description" rows="2" placeholder="What you learned, key projects, grade... (optional)"></textarea>
        </div>
    `;
    container.appendChild(item);
}

// Add Language
function addLanguage() {
    languageCount++;
    const container = document.getElementById('languageContainer');
    const item = document.createElement('div');
    item.className = 'language-item';
    item.id = `language-${languageCount}`;
    item.innerHTML = `
        <button type="button" class="remove-btn" onclick="removeItem('language-${languageCount}')">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-row">
            <div class="form-group">
                <label>Language</label>
                <input type="text" class="lang-name" placeholder="e.g., English">
            </div>
            <div class="form-group">
                <label>Proficiency</label>
                <select class="lang-level">
                    <option value="Native">Native</option>
                    <option value="Fluent">Fluent</option>
                    <option value="Professional">Professional</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Basic">Basic</option>
                </select>
            </div>
        </div>
    `;
    container.appendChild(item);
}

// Remove Item
function removeItem(id) {
    const item = document.getElementById(id);
    if (item) {
        item.remove();
    }
}

// 100 CV Template Styles with descriptions
const cvTemplates = [
    { id: 'style1', name: '🔵 Modern Blue', category: 'Modern' },
    { id: 'style2', name: '⚫ Classic Black', category: 'Classic' },
    { id: 'style3', name: '💚 Professional Green', category: 'Professional' },
    { id: 'style4', name: '🟣 Creative Purple', category: 'Creative' },
    { id: 'style5', name: '🔴 Executive Red', category: 'Executive' },
    { id: 'style6', name: '🟠 Warm Orange', category: 'Warm' },
    { id: 'style7', name: '🌊 Ocean Blue', category: 'Professional' },
    { id: 'style8', name: '🏙️ Urban Dark', category: 'Modern' },
    { id: 'style9', name: '✨ Elegant Gold', category: 'Elegant' },
    { id: 'style10', name: '🎨 Artistic Pink', category: 'Creative' },
    { id: 'style11', name: '📊 Data Analyst', category: 'Technical' },
    { id: 'style12', name: '🎯 Marketing Pro', category: 'Marketing' },
    { id: 'style13', name: '💻 Tech Geek', category: 'Technical' },
    { id: 'style14', name: '👔 Corporate', category: 'Corporate' },
    { id: 'style15', name: '🌟 Star Bright', category: 'Modern' },
    { id: 'style16', name: '🎭 Minimalist', category: 'Minimalist' },
    { id: 'style17', name: '🌈 Rainbow', category: 'Creative' },
    { id: 'style18', name: '📱 Digital', category: 'Digital' },
    { id: 'style19', name: '🚀 Startup', category: 'Startup' },
    { id: 'style20', name: '🏆 Premium', category: 'Premium' },
    { id: 'style21', name: '💼 Business', category: 'Business' },
    { id: 'style22', name: '🎓 Academic', category: 'Academic' },
    { id: 'style23', name: '🌿 Natural', category: 'Natural' },
    { id: 'style24', name: '❄️ Icy Blue', category: 'Cool' },
    { id: 'style25', name: '🔥 Hot Red', category: 'Bold' },
    { id: 'style26', name: '💎 Diamond', category: 'Luxury' },
    { id: 'style27', name: '🎪 Colorful', category: 'Playful' },
    { id: 'style28', name: '📚 Scholar', category: 'Academic' },
    { id: 'style29', name: '🌙 Midnight', category: 'Dark' },
    { id: 'style30', name: '☀️ Sunshine', category: 'Bright' },
    { id: 'style31', name: '🎸 Creative Artist', category: 'Creative' },
    { id: 'style32', name: '⚙️ Engineer', category: 'Technical' },
    { id: 'style33', name: '💰 Financial', category: 'Financial' },
    { id: 'style34', name: '🏥 Medical', category: 'Medical' },
    { id: 'style35', name: '⚖️ Legal', category: 'Legal' },
    { id: 'style36', name: '🎬 Media', category: 'Media' },
    { id: 'style37', name: '🌐 Global', category: 'International' },
    { id: 'style38', name: '🔐 Security', category: 'Technical' },
    { id: 'style39', name: '🎯 Focus', category: 'Minimalist' },
    { id: 'style40', name: '🌺 Tropical', category: 'Vibrant' },
    { id: 'style41', name: '📈 Growth', category: 'Business' },
    { id: 'style42', name: '🎪 Festive', category: 'Playful' },
    { id: 'style43', name: '🏅 Champion', category: 'Premium' },
    { id: 'style44', name: '🌌 Galaxy', category: 'Modern' },
    { id: 'style45', name: '🎨 Painter', category: 'Creative' },
    { id: 'style46', name: '⚡ Lightning', category: 'Bold' },
    { id: 'style47', name: '🌸 Blossom', category: 'Elegant' },
    { id: 'style48', name: '🔮 Mystical', category: 'Creative' },
    { id: 'style49', name: '👑 Royal', category: 'Premium' },
    { id: 'style50', name: '🌊 Wave', category: 'Professional' },

    { id: 'style51', name: 'Minimal Slate', category: 'Minimalist' },
    { id: 'style52', name: 'Executive Navy', category: 'Executive' },
    { id: 'style53', name: 'Modern Teal', category: 'Modern' },
    { id: 'style54', name: 'Creative Coral', category: 'Creative' },
    { id: 'style55', name: 'Premium Onyx', category: 'Premium' },
    { id: 'style56', name: 'Academic Ink', category: 'Academic' },
    { id: 'style57', name: 'Warm Copper', category: 'Warm' },
    { id: 'style58', name: 'Cool Glacier', category: 'Cool' },
    { id: 'style59', name: 'Bold Crimson', category: 'Bold' },
    { id: 'style60', name: 'Business Steel', category: 'Business' },

    { id: 'style61', name: 'Elegant Rose', category: 'Elegant' },
    { id: 'style62', name: 'Technical Cyan', category: 'Technical' },
    { id: 'style63', name: 'Corporate Graphite', category: 'Corporate' },
    { id: 'style64', name: 'Bright Citrus', category: 'Bright' },
    { id: 'style65', name: 'Dark Aurora', category: 'Dark' },
    { id: 'style66', name: 'Luxury Emerald', category: 'Luxury' },
    { id: 'style67', name: 'International Blue', category: 'International' },
    { id: 'style68', name: 'Media Magenta', category: 'Media' },
    { id: 'style69', name: 'Financial Olive', category: 'Financial' },
    { id: 'style70', name: 'Medical Mint', category: 'Medical' },

    { id: 'style71', name: 'Legal Burgundy', category: 'Legal' },
    { id: 'style72', name: 'Marketing Sunset', category: 'Marketing' },
    { id: 'style73', name: 'Digital Neon', category: 'Digital' },
    { id: 'style74', name: 'Startup Lime', category: 'Startup' },
    { id: 'style75', name: 'Natural Forest', category: 'Natural' },
    { id: 'style76', name: 'Vibrant Violet', category: 'Vibrant' },
    { id: 'style77', name: 'Classic Charcoal', category: 'Classic' },
    { id: 'style78', name: 'Professional Azure', category: 'Professional' },
    { id: 'style79', name: 'Playful Bubblegum', category: 'Playful' },
    { id: 'style80', name: 'Elegant Pearl', category: 'Elegant' },

    { id: 'style81', name: 'Modern Indigo', category: 'Modern' },
    { id: 'style82', name: 'Executive Maroon', category: 'Executive' },
    { id: 'style83', name: 'Technical Midnight', category: 'Technical' },
    { id: 'style84', name: 'Corporate Cobalt', category: 'Corporate' },
    { id: 'style85', name: 'Bold Electric', category: 'Bold' },
    { id: 'style86', name: 'Premium Champagne', category: 'Premium' },
    { id: 'style87', name: 'Academic Stone', category: 'Academic' },
    { id: 'style88', name: 'Business Ocean', category: 'Business' },
    { id: 'style89', name: 'Cool Ice', category: 'Cool' },
    { id: 'style90', name: 'Warm Sand', category: 'Warm' },

    { id: 'style91', name: 'Creative Plum', category: 'Creative' },
    { id: 'style92', name: 'Bright Sky', category: 'Bright' },
    { id: 'style93', name: 'Dark Carbon', category: 'Dark' },
    { id: 'style94', name: 'Luxury Sapphire', category: 'Luxury' },
    { id: 'style95', name: 'International Sandstone', category: 'International' },
    { id: 'style96', name: 'Media Studio', category: 'Media' },
    { id: 'style97', name: 'Financial Carbon', category: 'Financial' },
    { id: 'style98', name: 'Medical Clean', category: 'Medical' },
    { id: 'style99', name: 'Legal Night', category: 'Legal' },
    { id: 'style100', name: 'Minimal Paper', category: 'Minimalist' }
];

// 50+ User Reviews/Testimonials
const userReviews = [
    { name: 'Ahmed Hassan', role: 'Software Engineer', rating: 5, text: 'Amazing CV builder! Created my CV in just 5 minutes. Got 3 job offers within a week!', img: '👨‍💼' },
    { name: 'Fatima Khan', role: 'Marketing Manager', rating: 5, text: 'The 100 templates are incredible. My CV looks so professional now. Highly recommended!', img: '👩‍💼' },
    { name: 'Muhammad Ali', role: 'Data Scientist', rating: 5, text: 'Best free CV tool I\'ve used. The design options are amazing and it\'s super easy to use.', img: '👨‍💻' },
    { name: 'Sarah Johnson', role: 'Graphic Designer', rating: 5, text: 'Finally found a CV builder that matches my creative style! Love the modern templates.', img: '👩‍🎨' },
    { name: 'Hassan Raza', role: 'Business Analyst', rating: 5, text: 'Professional, fast, and completely free. This is exactly what I was looking for!', img: '👨‍💼' },
    { name: 'Aisha Mohamed', role: 'UX Designer', rating: 5, text: 'The style selector is genius! I tried 5 different designs before settling on the perfect one.', img: '👩‍💻' },
    { name: 'Ali Ahmed', role: 'Project Manager', rating: 5, text: 'Saved me so much time. Downloaded my CV as PDF and sent it to recruiters same day.', img: '👨‍💼' },
    { name: 'Zainab Ali', role: 'Content Writer', rating: 5, text: 'Love the simplicity. No complicated steps, just fill, select style, and download. Perfect!', img: '👩‍💼' },
    { name: 'Omar Khan', role: 'DevOps Engineer', rating: 5, text: 'Secure, private, and free. Exactly what we need in 2026. Excellent work!', img: '👨‍💻' },
    { name: 'Hana Ibrahim', role: 'HR Manager', rating: 5, text: 'I recommend this to all job seekers. Clean interface and professional output.', img: '👩‍💼' },
    { name: 'Karim Hassan', role: 'Web Developer', rating: 5, text: 'The animations and transitions are smooth. Clearly built by developers for developers.', img: '👨‍💻' },
    { name: 'Layla Ahmed', role: 'Product Manager', rating: 5, text: 'Got my dream job! This CV tool definitely helped me stand out from other candidates.', img: '👩‍💼' },
    { name: 'Mahmoud Sharif', role: 'Senior Developer', rating: 5, text: 'Finally a free tool that doesn\'t compromise on quality. Absolutely stellar!', img: '👨‍💻' },
    { name: 'Nora Hassan', role: 'Finance Analyst', rating: 5, text: 'The 100 templates made it so easy to find one that matches my personality and style.', img: '👩‍💼' },
    { name: 'Tariq Mohamed', role: 'Systems Architect', rating: 5, text: 'Best CV builder I\'ve ever used. The code quality is impressive too!', img: '👨‍💻' },
    { name: 'Salma Khan', role: 'Business Owner', rating: 5, text: 'Recommended to all my employees. They all created amazing CVs in minutes!', img: '👩‍💼' },
    { name: 'Ibrahim Ali', role: 'Mobile Developer', rating: 5, text: 'The responsive design is perfect. Works great on all devices. Impressive work!', img: '👨‍💻' },
    { name: 'Amira Hassan', role: 'Consultant', rating: 5, text: 'Professional, elegant, and completely customizable. Exactly what I needed!', img: '👩‍💼' },
    { name: 'Rashid Khan', role: 'QA Engineer', rating: 5, text: 'No bugs, smooth performance, beautiful UI. This is how software should be built!', img: '👨‍💻' },
    { name: 'Dana Ahmed', role: 'Recruiter', rating: 5, text: 'CVs created here stand out immediately. Candidates who use this tool look more professional.', img: '👩‍💼' },
    { name: 'Youssef Hassan', role: 'Cloud Engineer', rating: 5, text: 'Simple, effective, and beautiful. No unnecessary complexity. Love it!', img: '👨‍💻' },
    { name: 'Rana Ali', role: 'Marketing Specialist', rating: 5, text: 'The design options helped me create a CV that truly represents my brand.', img: '👩‍💼' },
    { name: 'Faisal Khan', role: 'Backend Developer', rating: 5, text: 'Excellent user experience. Everything is intuitive and works perfectly.', img: '👨‍💻' },
    { name: 'Jasmine Hassan', role: 'Social Media Manager', rating: 5, text: 'So easy to use! Created a professional CV without any technical knowledge needed.', img: '👩‍💼' },
    { name: 'Kamal Ahmed', role: 'Full Stack Dev', rating: 5, text: 'PDF download works flawlessly. Sent to 20 companies and got interviews!', img: '👨‍💻' },
    { name: 'Leila Khan', role: 'Data Analyst', rating: 5, text: 'The authentication system gives me peace of mind. My CV is secure and private.', img: '👩‍💼' },
    { name: 'Majid Hassan', role: 'Frontend Developer', rating: 5, text: 'Beautiful code and beautiful UI. This is how web apps should be designed!', img: '👨‍💻' },
    { name: 'Nadia Ahmed', role: 'Business Consultant', rating: 5, text: 'Recommended by my job coach. Best decision ever. Got the job offer!', img: '👩‍💼' },
    { name: 'Osama Khan', role: 'Tech Lead', rating: 5, text: 'The attention to detail is amazing. Every pixel is perfectly placed.', img: '👨‍💻' },
    { name: 'Pasha Hassan', role: 'Director', rating: 5, text: 'Professional tool for professional careers. Highly impressed!', img: '👨‍💼' },
    { name: 'Qadira Ahmed', role: 'Analyst', rating: 5, text: 'The style switching feature is genius. Makes CV creation fun and easy!', img: '👩‍💼' },
    { name: 'Rayan Khan', role: 'Engineer', rating: 5, text: 'Free and premium quality. Can\'t believe this is available for free!', img: '👨‍💻' },
    { name: 'Sama Hassan', role: 'Manager', rating: 5, text: 'My CV looks like it was designed by a professional designer. So impressed!', img: '👩‍💼' },
    { name: 'Talal Ahmed', role: 'Architect', rating: 5, text: 'The modern design templates really make my CV stand out to recruiters.', img: '👨‍💻' },
    { name: 'Ulfa Khan', role: 'Specialist', rating: 5, text: 'Fast, reliable, and beautiful. Everything a CV builder should be!', img: '👩‍💼' },
    { name: 'Valerio Hassan', role: 'Developer', rating: 5, text: 'One of the best web tools I\'ve used. Absolutely fantastic!', img: '👨‍💻' },
    { name: 'Wafa Ahmed', role: 'Officer', rating: 5, text: 'Simple interface but powerful features. Perfect balance!', img: '👩‍💼' },
    { name: 'Xavier Khan', role: 'Expert', rating: 5, text: 'The attention to UX/UI design is clearly evident in every detail.', img: '👨‍💻' },
    { name: 'Yasmeen Hassan', role: 'Lead', rating: 5, text: 'Changed my job search completely. Got 5 interviews in 2 weeks!', img: '👩‍💼' },
    { name: 'Zackary Ahmed', role: 'Senior Dev', rating: 5, text: 'This is how tools should be built. Clean, simple, and effective!', img: '👨‍💻' },
    { name: 'Amela Khan', role: 'Director', rating: 5, text: 'Impressive execution. The code quality is obviously very high.', img: '👩‍💼' },
    { name: 'Badr Hassan', role: 'Developer', rating: 5, text: 'Finally, a CV builder that respects user privacy and security!', img: '👨‍💻' },
    { name: 'Carmen Ahmed', role: 'Manager', rating: 5, text: 'The best tool for creating professional CVs. 100% satisfied!', img: '👩‍💼' },
    { name: 'Darren Khan', role: 'Engineer', rating: 5, text: 'Incredibly intuitive. My mom even managed to create a CV without help!', img: '👨‍💻' },
    { name: 'Elina Hassan', role: 'Consultant', rating: 5, text: 'Professional results in minutes. This tool is a game changer!', img: '👩‍💼' },
    { name: 'Fabrice Ahmed', role: 'Analyst', rating: 5, text: 'The 100 templates offer something for every industry and style preference.', img: '👨‍💼' },
    { name: 'Gloria Khan', role: 'Specialist', rating: 5, text: 'Best investment of my time. Got the job I always wanted!', img: '👩‍💼' },
    { name: 'Henry Hassan', role: 'Executive', rating: 5, text: 'Outstanding quality and completely free. Simply remarkable!', img: '👨‍💻' },
    { name: 'Iris Ahmed', role: 'Professional', rating: 5, text: 'This tool proves that free doesn\'t mean compromising on quality.', img: '👩‍💼' },
    { name: 'Jerome Khan', role: 'Specialist', rating: 5, text: 'Absolutely brilliant. Recommend to everyone in my network!', img: '👨‍💻' }
];

// Initialize style grid
function initializeStyleGrid() {
    const grid = document.getElementById('styleGrid');
    grid.innerHTML = cvTemplates.map(template => `
        <div class="style-card" onclick="selectStyle('${template.id}')" title="${template.category}">
            <div class="style-card-inner">
                <div class="style-preview-icon">${getTemplateNumber(template) || ''}</div>
                <div class="style-card-name">${getTemplateDisplayName(template)}</div>
            </div>
        </div>
    `).join('');
}

// Toggle style grid
function toggleStyleGrid() {
    const container = document.getElementById('styleGridContainer');
    container.style.display = container.style.display === 'none' ? 'block' : 'none';
}

// Select style and regenerate CV
function selectStyle(styleId) {
    currentStyle = styleId;
    const container = document.getElementById('styleGridContainer');
    container.style.display = 'none';
    
    // Update preview with selected style
    const preview = document.getElementById('cvPreview');
    preview.className = `cv-preview ${styleId} ${getLayoutClassForStyle(styleId)}`;
    // Trigger a small animation to make the change feel "alive".
    preview.classList.remove('is-animating');
    void preview.offsetWidth;
    preview.classList.add('is-animating');
    
    // Show notification
    const templateName = cvTemplates.find(t => t.id === styleId).name;
    console.log('Selected template:', templateName);

    updateCvThemeBadge();

    scheduleSaveDraft();
}

// Toggle Reviews Modal
function toggleReviews() {
    const modal = document.getElementById('reviewsModal');
    if (modal.style.display === 'none') {
        displayReviews();
        modal.style.display = 'flex';
    } else {
        modal.style.display = 'none';
    }
}

// Display all reviews
function displayReviews() {
    const grid = document.getElementById('reviewsGrid');
    grid.innerHTML = userReviews.map((review, index) => `
        <div class="review-card">
            <div class="review-avatar">${review.img}</div>
            <div class="review-name">${review.name}</div>
            <div class="review-role">${review.role}</div>
            <div class="review-rating">
                ${Array(review.rating).fill().map(() => '<i class="fas fa-star"></i>').join('')}
            </div>
            <div class="review-text">"${review.text}"</div>
        </div>
    `).join('');
}

// Generate CV
function generateCV() {
    const fullName = document.getElementById('fullName').value;
    const jobTitle = document.getElementById('jobTitle').value;
    const email = document.getElementById('email').value;
    const phone = document.getElementById('phone').value;
    const location = document.getElementById('location').value;
    const website = document.getElementById('website').value;
    const summary = document.getElementById('summary').value;
    const signatureName = document.getElementById('signatureName') ? document.getElementById('signatureName').value : '';
    const skills = document.getElementById('skills') ? document.getElementById('skills').value : '';

    if (!fullName || !jobTitle || !email) {
        alert('Please fill in required fields: Full Name, Job Title, and Email');
        return;
    }

    const safeFullName = escapeHtml(fullName);
    const safeJobTitle = escapeHtml(jobTitle);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone);
    const safeLocation = escapeHtml(location);
    const safeWebsite = escapeHtml(website);

    const photoHTML = profilePhotoDataUrl
        ? `<img class="cv-photo" src="${profilePhotoDataUrl}" alt="Profile photo">`
        : '';

    const themeMeta = getCurrentTemplateMeta();
    const badgeHTML = `
        <div class="cv-theme-badge" title="${themeMeta.category} template">
            <i class="fas ${themeMeta.iconClass} cv-theme-icon"></i>
            <span class="cv-theme-name">${themeMeta.name}</span>
        </div>
    `;

    let cvHTML = `
        <div class="cv-header">
            <div class="cv-header-top">
                ${photoHTML}
                <div class="cv-header-text">
                    <h1 class="cv-name">${safeFullName}</h1>
                    <p class="cv-job-title">${safeJobTitle}</p>
                    ${badgeHTML}
                </div>
            </div>
            <div class="cv-contact">
                ${email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i> ${safeEmail}</div>` : ''}
                ${phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i> ${safePhone}</div>` : ''}
                ${location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i> ${safeLocation}</div>` : ''}
                ${website ? `<div class="cv-contact-item"><i class="fas fa-globe"></i> ${safeWebsite}</div>` : ''}
            </div>
        </div>
    `;

    // Summary
    if (summary) {
        cvHTML += `
            <div class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-user"></i> Professional Summary</h2>
                <p class="cv-summary">${escapeHtmlMultiline(summary)}</p>
            </div>
        `;
    }

    // Experience
    const experiences = document.querySelectorAll('.experience-item');
    if (experiences.length > 0) {
        let hasExperience = false;
        let experienceHTML = '';
        
        experiences.forEach(exp => {
            const title = exp.querySelector('.exp-title').value;
            const company = exp.querySelector('.exp-company').value;
            const start = exp.querySelector('.exp-start').value;
            const end = exp.querySelector('.exp-end').value;
            const description = exp.querySelector('.exp-description').value;

            if (title || company) {
                hasExperience = true;
                const safeTitle = escapeHtml(title);
                const safeCompany = escapeHtml(company);
                const safeStart = escapeHtml(start);
                const safeEnd = escapeHtml(end);
                const safeDescription = escapeHtmlMultiline(description);
                experienceHTML += `
                    <div class="cv-experience-item">
                        <div class="cv-item-header">
                            <div>
                                <div class="cv-item-title">${safeTitle}</div>
                                <div class="cv-item-company">${safeCompany}</div>
                            </div>
                            <div class="cv-item-date">${safeStart}${(safeStart && safeEnd) ? ' - ' : ''}${safeEnd}</div>
                        </div>
                        ${description ? `<p class="cv-item-description">${safeDescription}</p>` : ''}
                    </div>
                `;
            }
        });

        if (hasExperience) {
            cvHTML += `
                <div class="cv-section">
                    <h2 class="cv-section-title"><i class="fas fa-briefcase"></i> Work Experience</h2>
                    ${experienceHTML}
                </div>
            `;
        }
    }

    // Education
    const educations = document.querySelectorAll('.education-item');
    if (educations.length > 0) {
        let hasEducation = false;
        let educationHTML = '';
        
        educations.forEach(edu => {
            const degree = edu.querySelector('.edu-degree').value;
            const school = edu.querySelector('.edu-school').value;
            const start = edu.querySelector('.edu-start').value;
            const end = edu.querySelector('.edu-end').value;
            const description = edu.querySelector('.edu-description').value;

            if (degree || school) {
                hasEducation = true;
                const safeDegree = escapeHtml(degree);
                const safeSchool = escapeHtml(school);
                const safeStart = escapeHtml(start);
                const safeEnd = escapeHtml(end);
                const safeDescription = escapeHtmlMultiline(description);
                educationHTML += `
                    <div class="cv-education-item">
                        <div class="cv-item-header">
                            <div>
                                <div class="cv-item-title">${safeDegree}</div>
                                <div class="cv-item-school">${safeSchool}</div>
                            </div>
                            <div class="cv-item-date">${safeStart}${(safeStart && safeEnd) ? ' - ' : ''}${safeEnd}</div>
                        </div>
                        ${description ? `<p class="cv-item-description">${safeDescription}</p>` : ''}
                    </div>
                `;
            }
        });

        if (hasEducation) {
            cvHTML += `
                <div class="cv-section">
                    <h2 class="cv-section-title"><i class="fas fa-graduation-cap"></i> Education</h2>
                    ${educationHTML}
                </div>
            `;
        }
    }

    // Courses / Certifications
    const courses = document.querySelectorAll('.course-item');
    if (courses.length > 0) {
        let hasCourse = false;
        let courseHTML = '';

        courses.forEach(course => {
            const title = course.querySelector('.course-title')?.value || '';
            const org = course.querySelector('.course-org')?.value || '';
            const start = course.querySelector('.course-start')?.value || '';
            const end = course.querySelector('.course-end')?.value || '';
            const description = course.querySelector('.course-description')?.value || '';

            if (title || org) {
                hasCourse = true;
                const safeTitle = escapeHtml(title);
                const safeOrg = escapeHtml(org);
                const safeStart = escapeHtml(start);
                const safeEnd = escapeHtml(end);
                const safeDescription = escapeHtmlMultiline(description);
                courseHTML += `
                    <div class="cv-education-item">
                        <div class="cv-item-header">
                            <div>
                                <div class="cv-item-title">${safeTitle}</div>
                                <div class="cv-item-school">${safeOrg}</div>
                            </div>
                            <div class="cv-item-date">${safeStart}${(safeStart && safeEnd) ? ' - ' : ''}${safeEnd}</div>
                        </div>
                        ${description ? `<p class="cv-item-description">${safeDescription}</p>` : ''}
                    </div>
                `;
            }
        });

        if (hasCourse) {
            cvHTML += `
                <div class="cv-section">
                    <h2 class="cv-section-title"><i class="fas fa-certificate"></i> Courses & Certifications</h2>
                    ${courseHTML}
                </div>
            `;
        }
    }

    // Skills
    {
        const skillsArray = (skillsList && skillsList.length > 0)
            ? skillsList
            : String(skills).split(',').map(s => s.trim()).filter(s => s);
        if (skillsArray.length > 0) {
            cvHTML += `
                <div class="cv-section">
                    <h2 class="cv-section-title"><i class="fas fa-cogs"></i> Skills</h2>
                    <div class="cv-skills">
                        ${skillsArray.map(skill => `<span class="cv-skill-tag">${escapeHtml(skill)}</span>`).join('')}
                    </div>
                </div>
            `;
        }
    }

    // Languages
    const languages = document.querySelectorAll('.language-item');
    if (languages.length > 0) {
        let hasLanguage = false;
        let languageHTML = '';
        
        languages.forEach(lang => {
            const name = lang.querySelector('.lang-name').value;
            const level = lang.querySelector('.lang-level').value;

            if (name) {
                hasLanguage = true;
                const safeName = escapeHtml(name);
                const safeLevel = escapeHtml(level);
                languageHTML += `
                    <div class="cv-language-item">
                        <span>${safeName}</span>
                        <span>${safeLevel}</span>
                    </div>
                `;
            }
        });

        if (hasLanguage) {
            cvHTML += `
                <div class="cv-section">
                    <h2 class="cv-section-title"><i class="fas fa-language"></i> Languages</h2>
                    <div class="cv-languages">
                        ${languageHTML}
                    </div>
                </div>
            `;
        }
    }

    const preview = document.getElementById('cvPreview');
    preview.innerHTML = cvHTML;
    
    // Apply current style
    preview.className = `cv-preview ${currentStyle} ${getLayoutClassForStyle(currentStyle)}`;

    preview.classList.remove('is-animating');
    void preview.offsetWidth;
    preview.classList.add('is-animating');

    if (signatureName && String(signatureName).trim()) {
        preview.insertAdjacentHTML('beforeend', `<div class="cv-signature">${escapeHtml(String(signatureName).trim())}</div>`);
    }
}

// Download PDF
async function downloadPDF() {
    const preview = document.getElementById('cvPreview');
    
    if (!preview.querySelector('.cv-header')) {
        alert('Please generate a CV preview first!');
        return;
    }
    
    // Ensure the latest layout is painted and assets (especially the profile photo) are decoded
    // before invoking print. Some browsers can otherwise render/crop images in the PDF.
    preview.classList.remove('is-animating');

    const images = Array.from(preview.querySelectorAll('img'));
    const waitForImage = (img) => {
        if (!img) return Promise.resolve();

        // If already loaded, try to decode (best effort).
        if (img.complete && img.naturalWidth > 0) {
            if (typeof img.decode === 'function') {
                return img.decode().catch(() => undefined);
            }
            return Promise.resolve();
        }

        // Otherwise wait for load/error.
        return new Promise((resolve) => {
            const done = () => {
                img.removeEventListener('load', done);
                img.removeEventListener('error', done);
                // Attempt decode after load (best effort).
                if (typeof img.decode === 'function') {
                    img.decode().catch(() => undefined).finally(resolve);
                } else {
                    resolve();
                }
            };
            img.addEventListener('load', done, { once: true });
            img.addEventListener('error', done, { once: true });
        });
    };

    try {
        await Promise.all(images.map(waitForImage));
    } catch {
        // Best effort only — printing should still proceed.
    }

    // Two RAFs ensures styles/layout are committed right before printing.
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);

    window.print();
}

// Clear Form
function clearForm() {
    if (confirm('Are you sure you want to clear all fields?')) {
        // Clear all input fields
        document.querySelectorAll('input, textarea').forEach(field => {
            field.value = '';
        });

        profilePhotoDataUrl = '';

        skillsList = [];
        const skillsInput = document.getElementById('skillsInput');
        if (skillsInput) skillsInput.value = '';
        const skillsHidden = document.getElementById('skills');
        if (skillsHidden) skillsHidden.value = '';
        renderSkillsChips();
        
        // Clear dynamic sections
        document.getElementById('experienceContainer').innerHTML = '';
        document.getElementById('educationContainer').innerHTML = '';
        const courseContainer = document.getElementById('courseContainer');
        if (courseContainer) courseContainer.innerHTML = '';
        document.getElementById('languageContainer').innerHTML = '';
        
        // Reset counters
        experienceCount = 0;
        educationCount = 0;
        courseCount = 0;
        languageCount = 0;
        
        // Add one of each back
        addExperience();
        addEducation();
        addCourse();
        addLanguage();
        
        // Clear preview
        document.getElementById('cvPreview').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>Your CV preview will appear here</p>
                <p class="hint">Fill in the form and click "Preview CV"</p>
            </div>
        `;

        clearCvDraft();
    }
}
