// Global counters for dynamic elements
let experienceCount = 0;
let educationCount = 0;
let courseCount = 0;
let languageCount = 0;
let projectCount = 0;
let awardCount = 0;
let currentStyle = 'style1'; // Default style
let profilePhotoDataUrl = '';
let skillsList = [];
let lastPreviewSnapshot = { markup: '', className: '' };
let previewScale = 1;

const CV_DRAFT_STORAGE_PREFIX = 'free-cv-builder:draft:v2.1';
let currentAuthUid = null;
let draftSaveTimer = null;

let cloudSaveTimer = null;
let firestoreDb = null;

function isFirebaseConfigured(cfg) {
    return !!(cfg?.apiKey && String(cfg.apiKey) !== 'REPLACE_ME');
}

function getFirebaseConfigFromFileOrStorage() {
    const fromFile = typeof window !== 'undefined' ? window.FIREBASE_CONFIG : null;
    if (isFirebaseConfigured(fromFile)) return fromFile;

    try {
        const raw = localStorage.getItem('free-cv-builder:firebase-config');
        const override = raw ? safeJsonParse(raw) : null;
        if (isFirebaseConfigured(override)) return override;
    } catch {
        // ignore
    }

    return fromFile;
}

function ensureFirestoreReady() {
    if (firestoreDb) return firestoreDb;

    const firebaseAvailable = typeof window !== 'undefined' && window.firebase;
    if (!firebaseAvailable) return null;

    const cfg = getFirebaseConfigFromFileOrStorage();
    if (!isFirebaseConfigured(cfg)) return null;

    try {
        if (!firebase.apps || !firebase.apps.length) {
            firebase.initializeApp(cfg);
        }
        if (!firebase.firestore) return null;

        firestoreDb = firebase.firestore();
        return firestoreDb;
    } catch {
        return null;
    }
}

function getCloudDraftRef(uid) {
    const db = ensureFirestoreReady();
    if (!db) return null;
    const safeUid = String(uid || '').trim();
    if (!safeUid) return null;
    return db.collection('freeCvBuilderDrafts').doc(safeUid);
}

function getLocalDraftObject(uid) {
    try {
        const raw = localStorage.getItem(getDraftStorageKey(uid));
        const parsed = raw ? safeJsonParse(raw) : null;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

async function fetchCloudDraft(uid) {
    const ref = getCloudDraftRef(uid);
    if (!ref) return null;
    try {
        const snap = await ref.get();
        if (!snap.exists) return null;
        const data = snap.data();
        const draft = data?.draft;
        return draft && typeof draft === 'object' ? draft : null;
    } catch {
        return null;
    }
}

async function saveCloudDraft(uid, draft) {
    const ref = getCloudDraftRef(uid);
    if (!ref) return;
    try {
        await ref.set({
            updatedAt: Date.now(),
            draft
        }, { merge: true });
    } catch {
        // ignore
    }
}

async function syncDraftWithCloud(uid) {
    const safeUid = String(uid || '').trim();
    if (!safeUid) return;
    if (!ensureFirestoreReady()) return;

    const local = getLocalDraftObject(safeUid);
    const cloud = await fetchCloudDraft(safeUid);

    const localTs = Number(local?.savedAt || 0);
    const cloudTs = Number(cloud?.savedAt || 0);

    // Prefer newer draft (cloud wins only if clearly newer).
    if (cloud && cloudTs > localTs + 1500) {
        try {
            localStorage.setItem(getDraftStorageKey(safeUid), JSON.stringify(cloud));
        } catch {
            // ignore
        }
        loadCvDraft({ storageKey: getDraftStorageKey(safeUid) });
        return;
    }

    if (local) {
        await saveCloudDraft(safeUid, local);
    }
}

function scheduleCloudSaveDraft(delayMs = 900) {
    if (!currentAuthUid) return;
    if (!ensureFirestoreReady()) return;

    if (cloudSaveTimer) {
        clearTimeout(cloudSaveTimer);
        cloudSaveTimer = null;
    }

    cloudSaveTimer = setTimeout(async () => {
        cloudSaveTimer = null;
        try {
            const draft = getLocalDraftObject(currentAuthUid) || collectCvDraft();
            await saveCloudDraft(currentAuthUid, draft);
        } catch {
            // ignore
        }
    }, delayMs);
}

function getStoredAppConfig() {
    try {
        const raw = localStorage.getItem('free-cv-builder:app-config');
        const parsed = raw ? safeJsonParse(raw) : null;
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

function applyStoredAppConfig() {
    const base = (typeof window !== 'undefined' && window.APP_CONFIG && typeof window.APP_CONFIG === 'object')
        ? window.APP_CONFIG
        : {};
    const override = getStoredAppConfig() || {};
    window.APP_CONFIG = { ...base, ...override };
}

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

    if (nextUid) {
        // Fire-and-forget.
        syncDraftWithCloud(nextUid);
    }
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

    const projects = Array.from(document.querySelectorAll('.project-item')).map((proj) => ({
        title: String(proj.querySelector('.project-title')?.value || '').trim(),
        role: String(proj.querySelector('.project-role')?.value || '').trim(),
        link: String(proj.querySelector('.project-link')?.value || '').trim(),
        start: String(proj.querySelector('.project-start')?.value || '').trim(),
        end: String(proj.querySelector('.project-end')?.value || '').trim(),
        description: String(proj.querySelector('.project-description')?.value || '').trim()
    })).filter(p => p.title || p.role || p.description || p.link);

    const awards = Array.from(document.querySelectorAll('.award-item')).map((award) => ({
        title: String(award.querySelector('.award-title')?.value || '').trim(),
        issuer: String(award.querySelector('.award-issuer')?.value || '').trim(),
        year: String(award.querySelector('.award-year')?.value || '').trim(),
        description: String(award.querySelector('.award-description')?.value || '').trim()
    })).filter(a => a.title || a.issuer || a.description);

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
                .map((m) => ({
                    role: String(m.role || '').slice(0, 32),
                    content: String(m.content || '').trim().slice(0, 2000)
                }))
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
        projects,
        awards,
        languages
    };
}

function saveCvDraft() {
    try {
        const draft = collectCvDraft();
        localStorage.setItem(getDraftStorageKey(), JSON.stringify(draft));
        scheduleCloudSaveDraft();
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
    const projectContainer = document.getElementById('projectContainer');
    const awardContainer = document.getElementById('awardContainer');
    const langContainer = document.getElementById('languageContainer');
    if (expContainer) expContainer.innerHTML = '';
    if (eduContainer) eduContainer.innerHTML = '';
    if (courseContainer) courseContainer.innerHTML = '';
    if (projectContainer) projectContainer.innerHTML = '';
    if (awardContainer) awardContainer.innerHTML = '';
    if (langContainer) langContainer.innerHTML = '';

    experienceCount = 0;
    educationCount = 0;
    courseCount = 0;
    projectCount = 0;
    awardCount = 0;
    languageCount = 0;

    const experiences = Array.isArray(draft.experiences) ? draft.experiences : [];
    const education = Array.isArray(draft.education) ? draft.education : [];
    const courses = Array.isArray(draft.courses) ? draft.courses : [];
    const projects = Array.isArray(draft.projects) ? draft.projects : [];
    const awards = Array.isArray(draft.awards) ? draft.awards : [];
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

    if (projects.length === 0) {
        addProject();
    } else {
        for (const p of projects) {
            addProject();
            const last = projectContainer?.lastElementChild;
            if (!last) continue;
            const title = last.querySelector('.project-title');
            const role = last.querySelector('.project-role');
            const link = last.querySelector('.project-link');
            const s = last.querySelector('.project-start');
            const en = last.querySelector('.project-end');
            const d = last.querySelector('.project-description');
            if (title) title.value = p.title || '';
            if (role) role.value = p.role || '';
            if (link) link.value = p.link || '';
            if (s) s.value = p.start || '';
            if (en) en.value = p.end || '';
            if (d) d.value = p.description || '';
        }
    }

    if (awards.length === 0) {
        addAward();
    } else {
        for (const a of awards) {
            addAward();
            const last = awardContainer?.lastElementChild;
            if (!last) continue;
            const title = last.querySelector('.award-title');
            const issuer = last.querySelector('.award-issuer');
            const year = last.querySelector('.award-year');
            const d = last.querySelector('.award-description');
            if (title) title.value = a.title || '';
            if (issuer) issuer.value = a.issuer || '';
            if (year) year.value = a.year || '';
            if (d) d.value = a.description || '';
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
    lastPreviewSnapshot = { markup: '', className: '' };

    const fullName = String(fields.fullName || '').trim();
    const jobTitle = String(fields.jobTitle || '').trim();
    const email = String(fields.email || '').trim();
    if (fullName && jobTitle && email) {
        try {
            generateCV({ skipValidation: true });
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
    const safeRun = (label, fn) => {
        try {
            fn();
        } catch (err) {
            console.warn(`Init step failed: ${label}`, err);
        }
    };

    safeRun('applyStoredAppConfig', applyStoredAppConfig);
    safeRun('initializeStyleGrid', initializeStyleGrid);
    safeRun('addExperience', addExperience);
    safeRun('addEducation', addEducation);
    safeRun('addCourse', addCourse);
    safeRun('addProject', addProject);
    safeRun('addAward', addAward);
    safeRun('addLanguage', addLanguage);
    safeRun('setupProfilePhotoUpload', setupProfilePhotoUpload);
    safeRun('setupSkillsChips', setupSkillsChips);
    safeRun('setupFormValidation', setupFormValidation);
    safeRun('setupAiAssistant', setupAiAssistant);
    safeRun('setupWizard', setupWizard);
    safeRun('setupPreviewZoom', setupPreviewZoom);
    safeRun('setupAuthUi', setupAuthUi);
    safeRun('setupQuickSetup', setupQuickSetup);

    // Restore a saved draft if present.
    safeRun('loadCvDraft', loadCvDraft);

    // Auto-save on any input changes.
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.addEventListener('input', () => scheduleSaveDraft());
        formSection.addEventListener('change', () => scheduleSaveDraft());
        formSection.addEventListener('click', (e) => {
            const el = e.target;
            if (!el) return;
            const hasClosest = typeof el.closest === 'function'
                ? el.closest('.add-btn') || el.closest('.remove-btn')
                : el.classList && (el.classList.contains('add-btn') || el.classList.contains('remove-btn'));
            if (hasClosest) {
                scheduleSaveDraft();
            }
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveCvDraft();
        }
    });

    window.addEventListener('beforeunload', () => {
        saveCvDraft();
    });
});

function setupQuickSetup() {
    const card = document.getElementById('quickSetupCard');
    if (!card) return;

    const subtitle = document.getElementById('quickSetupSubtitle');

    const firebaseTa = document.getElementById('quickFirebaseConfig');
    const saveFirebaseBtn = document.getElementById('quickSaveFirebaseBtn');
    const firebaseNote = document.getElementById('quickFirebaseNote');

    const aiUrlInput = document.getElementById('quickAiBaseUrl');
    const saveAiBtn = document.getElementById('quickSaveAiBtn');
    const aiNote = document.getElementById('quickAiNote');

    const resetBtn = document.getElementById('quickResetSetupBtn');

    const isConfiguredFirebase = (cfg) => !!(cfg?.apiKey && String(cfg.apiKey) !== 'REPLACE_ME');

    const getFirebaseConfig = () => {
        const fromFile = typeof window !== 'undefined' ? window.FIREBASE_CONFIG : null;
        if (isConfiguredFirebase(fromFile)) return fromFile;
        try {
            const raw = localStorage.getItem('free-cv-builder:firebase-config');
            const override = raw ? safeJsonParse(raw) : null;
            if (isConfiguredFirebase(override)) return override;
        } catch {
            // ignore
        }
        return fromFile;
    };

    const getAiBaseUrl = () => String(window.APP_CONFIG?.AI_API_BASE_URL || '').trim();
    const isStaticHost = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';

    const refresh = () => {
        const fbOk = isConfiguredFirebase(getFirebaseConfig());
        const aiUrl = getAiBaseUrl();
        const aiOk = !isStaticHost || !!aiUrl;
        const loginMode = window.LocalAuth ? 'local' : (fbOk ? 'firebase' : 'none');

        // Show setup card primarily when AI backend needs configuration.
        const shouldShow = isStaticHost && !aiUrl;
        card.style.display = shouldShow ? '' : 'none';

        if (subtitle) {
            const parts = [];
            if (loginMode === 'local') {
                parts.push('Login: browser account (saved locally)');
            } else if (loginMode === 'firebase') {
                parts.push('Login: Firebase ready');
            } else {
                parts.push('Login: needs setup');
            }
            parts.push(isStaticHost ? (aiOk ? 'AI: ready (backend URL set)' : 'AI: needs backend URL') : 'AI: server mode');
            subtitle.textContent = parts.join(' • ');
        }

        if (aiUrlInput) aiUrlInput.value = aiUrl;

        if (window.LocalAuth) {
            const firebaseGroup = firebaseTa?.closest('.form-group');
            if (firebaseGroup) firebaseGroup.style.display = 'none';
            if (saveFirebaseBtn) saveFirebaseBtn.style.display = 'none';
            if (firebaseNote) firebaseNote.style.display = 'none';
        } else if (firebaseNote) {
            firebaseNote.style.display = fbOk ? 'none' : '';
            if (!fbOk) {
                firebaseNote.textContent = 'Tip: Firebase Console → Project settings → Your apps → Web app config.';
            }
        }

        if (aiNote) {
            aiNote.style.display = (isStaticHost && !aiUrl) ? '' : 'none';
            if (isStaticHost && !aiUrl) {
                aiNote.textContent = 'GitHub Pages is static. Deploy backend (Render/Railway/Glitch) then paste its URL above.';
            }
        }
    };

    const showMsg = (el, msg) => {
        if (!el) return;
        el.style.display = '';
        el.textContent = msg;
    };

    saveFirebaseBtn?.addEventListener('click', () => {
        try {
            const parsed = safeJsonParse(String(firebaseTa?.value || '').trim());
            if (!parsed || !parsed.apiKey || !parsed.authDomain) {
                showMsg(firebaseNote, 'Invalid JSON. Must include apiKey + authDomain.');
                return;
            }
            localStorage.setItem('free-cv-builder:firebase-config', JSON.stringify(parsed));
            showMsg(firebaseNote, 'Saved Firebase config. Reloading…');
            setTimeout(() => window.location.reload(), 350);
        } catch {
            showMsg(firebaseNote, 'Failed to save Firebase config (storage blocked).');
        }
    });

    saveAiBtn?.addEventListener('click', () => {
        try {
            const url = String(aiUrlInput?.value || '').trim();
            const next = { AI_API_BASE_URL: url };
            localStorage.setItem('free-cv-builder:app-config', JSON.stringify(next));
            applyStoredAppConfig();
            showMsg(aiNote, 'Saved AI backend URL. Reloading…');
            setTimeout(() => window.location.reload(), 350);
        } catch {
            showMsg(aiNote, 'Failed to save AI backend URL (storage blocked).');
        }
    });

    resetBtn?.addEventListener('click', () => {
        try {
            localStorage.removeItem('free-cv-builder:firebase-config');
            localStorage.removeItem('free-cv-builder:app-config');
            showMsg(aiNote, 'Reset done. Reloading…');
            setTimeout(() => window.location.reload(), 350);
        } catch {
            // ignore
        }
    });

    refresh();
}

function setupAuthUi() {
    const statusEl = document.getElementById('authStatusText');
    const signInLink = document.getElementById('authSignInLink');
    const signOutBtn = document.getElementById('authSignOutBtn');

    if (!statusEl || !signInLink || !signOutBtn) return;

    const localAuth = window.LocalAuth;

    const applyGuestState = () => {
        statusEl.textContent = 'Guest mode • Sign in to keep drafts per user';
        signInLink.style.display = '';
        signOutBtn.style.display = 'none';
        try {
            const next = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            signInLink.href = `login.html?next=${encodeURIComponent(next)}`;
        } catch {
            signInLink.href = 'login.html';
        }
        switchDraftOwner(null);
    };

    if (!localAuth) {
        applyGuestState();
        return;
    }

    const render = () => {
        const user = localAuth.getCurrentUser();
        if (user) {
            const label = user.displayName || user.email || 'Account';
            statusEl.textContent = `Signed in: ${label}`;
            signInLink.style.display = 'none';
            signOutBtn.style.display = '';
            switchDraftOwner(user.id);
        } else {
            applyGuestState();
        }
    };

    signOutBtn.addEventListener('click', () => {
        localAuth.signOut();
    });

    render();
    localAuth.onChange(render);
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
        if (header && typeof header.scrollIntoView === 'function') {
            header.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const ensureValidAndGenerate = ({ focusInvalid = false } = {}) => {
        const result = validatePrimaryFields({ showErrors: true, focusFirst: focusInvalid, updateSummaryBox: true });
        if (!result.valid) {
            return false;
        }
        generateCV({ skipValidation: true });
        return true;
    };

    if (btnNext1) {
        btnNext1.addEventListener('click', () => {
            if (!ensureValidAndGenerate({ focusInvalid: true })) return;
            setStep(2);
        });
    }

    if (btnPreview) {
        btnPreview.addEventListener('click', () => {
            ensureValidAndGenerate({ focusInvalid: true });
        });
    }

    if (btnBack2) btnBack2.addEventListener('click', () => setStep(1));

    if (btnNext2) {
        btnNext2.addEventListener('click', () => {
            // Ensure preview exists before download step.
            if (!ensureValidAndGenerate({ focusInvalid: true })) return;
            setStep(3);
        });
    }

    if (btnBack3) btnBack3.addEventListener('click', () => setStep(2));

    for (const s of steps) {
        s.addEventListener('click', () => {
            const sn = Number(s.getAttribute('data-step'));
            if (sn === 1) return setStep(1);
            if (sn === 2) {
                if (!ensureValidAndGenerate({ focusInvalid: true })) return;
                return setStep(2);
            }
            if (sn === 3) {
                if (!ensureValidAndGenerate({ focusInvalid: true })) return;
                return setStep(3);
            }
        });
    }

    setStep(1);
}

function setupPreviewZoom() {
    const range = document.getElementById('previewZoomRange');
    const label = document.getElementById('previewZoomLabel');
    const canvas = document.getElementById('previewCanvas');
    if (!range || !label || !canvas) return;

    const clampScale = (value) => Math.min(1.3, Math.max(0.8, value));

    const applyScale = (value) => {
        const scale = clampScale(Number(value) / 100 || 1);
        previewScale = scale;
        canvas.style.setProperty('--preview-scale', String(scale));
        label.textContent = `${Math.round(scale * 100)}%`;
    };

    range.addEventListener('input', () => applyScale(range.value));
    applyScale(range.value || 100);
}

function setupAiAssistant() {
    const helper = document.getElementById('aiHelper');
    const toggleBtn = document.getElementById('aiHelperToggle');
    const content = document.querySelector('.ai-helper-content');
    if (!helper || !toggleBtn || !content) return;

    // Toggle functionality for floating AI helper
    let isExpanded = true; // Start expanded by default for new users
    helper.classList.remove('collapsed'); // Ensure it's expanded
    const toggleHelper = () => {
        isExpanded = !isExpanded;
        helper.classList.toggle('collapsed', !isExpanded);
        const icon = toggleBtn.querySelector('i');
        if (icon) {
            icon.className = isExpanded ? 'fas fa-chevron-left' : 'fas fa-chevron-right';
        }
    };

    toggleBtn.addEventListener('click', toggleHelper);

    const btnSummary = document.getElementById('aiGenerateSummaryBtn');
    const btnSkills = document.getElementById('aiSuggestSkillsBtn');
    const btnImprove = document.getElementById('aiImproveExperienceBtn');
    const btnRun = document.getElementById('aiRunCustomBtn');
    const btnCopy = document.getElementById('aiCopyBtn');
    const btnClear = document.getElementById('aiClearChatBtn');
    const hintEl = document.getElementById('aiHint');
    const promptEl = document.getElementById('aiPrompt');
    const messagesEl = document.getElementById('aiMessages');

    const messages = [];
    let aiDisabled = false;
    let aiDemoMode = false;

    const getAiEndpoint = () => {
        const base = String(window.APP_CONFIG?.AI_API_BASE_URL || '').trim();
        if (!base) return '/api/ai';
        return `${base.replace(/\/+$/, '')}/api/ai`;
    };

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
            bubble.textContent = '👋 Welcome! I\'m your AI CV assistant. Click the buttons above to generate content, or ask me anything about your resume!';
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
            if (aiDemoMode) {
                b.disabled = (b === btnCopy && !String(getLastAssistant() || '').trim());
                continue;
            }

            if (aiDisabled) {
                // On static hosting, disable AI actions to avoid confusing failures.
                const allow = b === btnClear;
                b.disabled = !allow;
                continue;
            }

            b.disabled = !!busy || (b === btnCopy && !String(getLastAssistant() || '').trim());
        }

        if (!aiDisabled && !aiDemoMode) {
            helper.classList.toggle('is-busy', !!busy);
        }
    };

    const isStaticHost = window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';
    aiDemoMode = isStaticHost && getAiEndpoint() === '/api/ai';
    aiDisabled = false;
    if (aiDemoMode) {
        if (hintEl) {
            hintEl.textContent = 'Demo mode: basic suggestions are generated locally. Deploy the server for real AI.';
        }
        if (promptEl) {
            promptEl.disabled = false;
            promptEl.placeholder = 'Demo mode: ask for summary, skills, or bullets…';
        }
        setBusy(false);
    }

    const postAi = async ({ prompt, context }) => {
        const isStaticHostingDemo = () =>
            window.location.hostname.endsWith('github.io') || window.location.protocol === 'file:';

        try {
            const response = await fetch(getAiEndpoint(), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, context })
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (response.status === 404 || response.status === 405) {
                    throw new Error(
                        'AI needs a backend server. Deploy with Render/Railway/Glitch (Node) and set OPENAI_API_KEY.'
                    );
                }
                throw new Error(data?.error || 'AI request failed');
            }
            return String(data?.text || '').trim();
        } catch (err) {
            if (isStaticHostingDemo()) {
                throw new Error(
                    'AI is disabled on GitHub Pages unless you set AI_API_BASE_URL in app-config.js to your deployed backend.'
                );
            }
            throw err;
        }
    };

    const collectAiContext = () => {
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

        return {
            fullName,
            jobTitle,
            summary,
            skills,
            experiences,
            education,
            languages,
            recentChat
        };
    };

    const getAiContext = () => {
        const payload = collectAiContext();
        // Keep context reasonably small.
        return JSON.stringify(payload).slice(0, 6000);
    };

    const buildDemoResponse = (kind, prompt) => {
        const data = collectAiContext();
        const skillsArray = Array.isArray(skillsList) ? skillsList.slice() : [];
        const normalizedJob = String(data.jobTitle || '').toLowerCase();

        const ensureSentence = (text) => {
            const value = String(text || '').trim();
            if (!value) return '';
            return /[.!?]$/.test(value) ? value : `${value}.`;
        };

        if (kind === 'summary') {
            const namePart = data.fullName ? `${data.fullName.split(' ')[0]} is a` : 'A';
            const rolePart = data.jobTitle || 'versatile professional';
            const skillHighlights = skillsArray.slice(0, 3).join(', ');
            const experienceHint = data.experiences.length ? ` with experience across ${data.experiences.length} role${data.experiences.length > 1 ? 's' : ''}` : '';
            const closing = skillHighlights ? ` Known for strengths in ${skillHighlights}.` : '';
            return `${namePart} ${rolePart}${experienceHint}, focused on delivering measurable outcomes and collaborating smoothly with teams.${closing}`;
        }

        if (kind === 'skills') {
            const baseSet = new Set(skillsArray.map((s) => s.trim()));
            const roleSuggestions = [];
            const addAll = (arr) => {
                for (const item of arr) {
                    const trimmed = String(item || '').trim();
                    if (trimmed) baseSet.add(trimmed);
                }
            };

            if (normalizedJob.includes('developer') || normalizedJob.includes('engineer')) {
                roleSuggestions.push('JavaScript', 'React', 'Node.js', 'API Design', 'Unit Testing', 'Agile Collaboration');
            }
            if (normalizedJob.includes('designer')) {
                roleSuggestions.push('Figma', 'User Research', 'Responsive Layouts', 'Design Systems');
            }
            if (normalizedJob.includes('marketing')) {
                roleSuggestions.push('Campaign Strategy', 'Content Writing', 'SEO', 'Marketing Analytics');
            }
            if (normalizedJob.includes('sales')) {
                roleSuggestions.push('Pipeline Management', 'Negotiation', 'CRM (HubSpot/Salesforce)', 'Lead Qualification');
            }

            addAll(roleSuggestions);
            addAll(['Stakeholder Communication', 'Problem Solving', 'Time Management', 'Team Leadership', 'Continuous Improvement']);

            return Array.from(baseSet)
                .slice(0, 15)
                .join(', ');
        }

        if (kind === 'improve') {
            const defaultBullets = [
                'Led key deliverables from planning through release to hit deadlines and quality goals.',
                'Collaborated with cross-functional partners to surface requirements and remove blockers.',
                'Tracked outcomes with simple metrics to highlight efficiency, quality, or customer impact.'
            ];

            const firstExp = data.experiences[0];
            if (!firstExp || !firstExp.description) {
                return defaultBullets.map((line) => `- ${line}`).join('\n');
            }

            const verbs = ['Accelerated', 'Optimized', 'Delivered', 'Elevated', 'Streamlined', 'Partnered'];
            const lines = String(firstExp.description || '')
                .split(/\r\n|\r|\n/)
                .map((line) => line.replace(/^[-•]\s*/, '').trim())
                .filter(Boolean);

            if (!lines.length) {
                return defaultBullets.map((line) => `- ${line}`).join('\n');
            }

            const upgraded = lines.map((line, idx) => {
                const verb = verbs[idx % verbs.length];
                const neutral = line.charAt(0).toUpperCase() + line.slice(1);
                return ensureSentence(`${verb} ${neutral}`);
            });

            return upgraded.map((line) => `- ${line}`).join('\n');
        }

        const note = 'Demo mode: deploy the backend server and set AI_API_BASE_URL for live AI responses.';
        const promptSnippet = String(prompt || '').trim();
        if (!promptSnippet) return note;
        return `${promptSnippet}\n\n${note}`;
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
        if (aiDemoMode) {
            pushMessage('user', prompt);
            const text = buildDemoResponse(kind, prompt);
            pushMessage('assistant', text);
            if (kind === 'summary') applySummary(text);
            if (kind === 'skills') applySkills(text);
            if (kind === 'improve') applyImprovedExperience(text);
            return;
        }

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

const PRIMARY_FIELD_RULES = [
    {
        id: 'fullName',
        label: 'Full Name',
        validate: (value) => {
            const trimmed = String(value || '').trim();
            if (!trimmed) return 'Full Name is required.';
            if (trimmed.length < 3) return 'Full Name must be at least 3 characters.';
            return '';
        }
    },
    {
        id: 'jobTitle',
        label: 'Job Title',
        validate: (value) => {
            const trimmed = String(value || '').trim();
            if (!trimmed) return 'Job Title is required.';
            return '';
        }
    },
    {
        id: 'email',
        label: 'Email',
        validate: (value) => {
            const trimmed = String(value || '').trim();
            if (!trimmed) return 'Email is required.';
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(trimmed)) return 'Enter a valid email address.';
            return '';
        }
    },
    {
        id: 'phone',
        label: 'Phone',
        validate: (value) => {
            const raw = String(value || '').trim();
            if (!raw) return '';
            const phonePattern = /^[0-9+()\-\.\s]{7,}$/;
            if (!phonePattern.test(raw)) {
                return 'Phone should include digits and allowed symbols only.';
            }
            return '';
        }
    }
];

function setFieldErrorState(input, errorMessage) {
    if (!input) return;
    const group = input.closest('.form-group');
    if (!group) return;

    let messageEl = group.querySelector('.input-error-message');

    if (errorMessage) {
        group.classList.add('has-error');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.className = 'input-error-message';
            group.appendChild(messageEl);
        }
        messageEl.textContent = errorMessage;
    } else {
        group.classList.remove('has-error');
        if (messageEl) messageEl.remove();
    }
}

function validateFieldRule(rule, { showError } = {}) {
    const input = document.getElementById(rule.id);
    if (!input) {
        return { valid: true, error: '' };
    }

    const errorMessage = rule.validate(input.value);
    if (showError) {
        setFieldErrorState(input, errorMessage);
    }

    return { valid: !errorMessage, error: errorMessage, element: input };
}

function updateValidationSummary(message) {
    const summary = document.getElementById('formValidationSummary');
    if (!summary) return;
    if (message) {
        summary.textContent = message;
        summary.classList.add('is-visible');
    } else {
        summary.textContent = '';
        summary.classList.remove('is-visible');
    }
}

function validatePrimaryFields({ showErrors = false, focusFirst = false, updateSummaryBox = false } = {}) {
    const errors = [];
    for (const rule of PRIMARY_FIELD_RULES) {
        const result = validateFieldRule(rule, { showError: showErrors });
        if (!result.valid) {
            errors.push({ id: rule.id, message: result.error, element: result.element });
        }
    }

    if (updateSummaryBox) {
        updateValidationSummary(errors[0]?.message || '');
    }

    if (focusFirst && errors[0]?.element) {
        errors[0].element.focus();
    }

    return { valid: errors.length === 0, errors };
}

function setupFormValidation() {
    for (const rule of PRIMARY_FIELD_RULES) {
        const input = document.getElementById(rule.id);
        if (!input) continue;

        input.addEventListener('blur', () => {
            validateFieldRule(rule, { showError: true });
            validatePrimaryFields({ updateSummaryBox: true });
        });

        input.addEventListener('input', () => {
            if (input.closest('.form-group')?.classList.contains('has-error')) {
                validateFieldRule(rule, { showError: true });
                validatePrimaryFields({ updateSummaryBox: true });
            }
        });
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
                    generateCV({ skipValidation: true });
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
                        generateCV({ skipValidation: true });
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
    if (!container) {
        console.warn('Missing experience container');
        return;
    }
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
    scheduleSaveDraft();
}

// Add Education
function addEducation() {
    educationCount++;
    const container = document.getElementById('educationContainer');
    if (!container) {
        console.warn('Missing education container');
        return;
    }
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
    scheduleSaveDraft();
}

// Add Course / Certification
function addCourse() {
    courseCount++;
    const container = document.getElementById('courseContainer');
    if (!container) {
        console.warn('Missing course container');
        return;
    }

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
    scheduleSaveDraft();
}

// Add Project
function addProject() {
    projectCount++;
    const container = document.getElementById('projectContainer');
    if (!container) {
        console.warn('Missing project container');
        return;
    }

    const item = document.createElement('div');
    item.className = 'project-item';
    item.id = `project-${projectCount}`;
    item.innerHTML = `
        <button type="button" class="remove-btn" onclick="removeItem('project-${projectCount}')">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-group">
            <label>Project Name</label>
            <input type="text" class="project-title" placeholder="e.g., Portfolio Website">
        </div>
        <div class="form-group">
            <label>Role / Focus</label>
            <input type="text" class="project-role" placeholder="e.g., Frontend Developer">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Start</label>
                <input type="text" class="project-start" placeholder="e.g., Jan 2024">
            </div>
            <div class="form-group">
                <label>End</label>
                <input type="text" class="project-end" placeholder="e.g., Mar 2024 or Present">
            </div>
        </div>
        <div class="form-group">
            <label>Project Link (Optional)</label>
            <input type="url" class="project-link" placeholder="https://">
        </div>
        <div class="form-group">
            <label>Description</label>
            <textarea class="project-description" rows="3" placeholder="Impact, tech stack, achievements..."></textarea>
        </div>
    `;
    container.appendChild(item);
    scheduleSaveDraft();
}

// Add Award / Achievement
function addAward() {
    awardCount++;
    const container = document.getElementById('awardContainer');
    if (!container) {
        console.warn('Missing award container');
        return;
    }

    const item = document.createElement('div');
    item.className = 'award-item';
    item.id = `award-${awardCount}`;
    item.innerHTML = `
        <button type="button" class="remove-btn" onclick="removeItem('award-${awardCount}')">
            <i class="fas fa-times"></i>
        </button>
        <div class="form-group">
            <label>Award / Achievement</label>
            <input type="text" class="award-title" placeholder="e.g., Employee of the Year">
        </div>
        <div class="form-group">
            <label>Issuer / Event</label>
            <input type="text" class="award-issuer" placeholder="e.g., ABC Corp / Hackathon">
        </div>
        <div class="form-row">
            <div class="form-group">
                <label>Year</label>
                <input type="text" class="award-year" placeholder="e.g., 2025">
            </div>
            <div class="form-group">
                <label>Details</label>
                <textarea class="award-description" rows="2" placeholder="What you achieved..."></textarea>
            </div>
        </div>
    `;
    container.appendChild(item);
    scheduleSaveDraft();
}

// Add Language
function addLanguage() {
    languageCount++;
    const container = document.getElementById('languageContainer');
    if (!container) {
        console.warn('Missing language container');
        return;
    }
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
    scheduleSaveDraft();
}

// Remove Item
function removeItem(id) {
    const item = document.getElementById(id);
    if (item) {
        item.remove();
        scheduleSaveDraft();
    } else {
        console.warn('Attempted to remove missing item', id);
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
    
    // Update badge with selected template name
    const templateName = cvTemplates.find(t => t.id === styleId).name;

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
function generateCV(options = {}) {
    const { skipValidation = false } = options;

    if (!skipValidation) {
        const validation = validatePrimaryFields({ showErrors: true, focusFirst: true, updateSummaryBox: true });
        if (!validation.valid) return;
    } else {
        updateValidationSummary('');
    }

    const fullName = String(document.getElementById('fullName')?.value || '');
    const jobTitle = String(document.getElementById('jobTitle')?.value || '');
    const email = String(document.getElementById('email')?.value || '');
    const phone = String(document.getElementById('phone')?.value || '');
    const location = String(document.getElementById('location')?.value || '');
    const website = String(document.getElementById('website')?.value || '');
    const summary = String(document.getElementById('summary')?.value || '');
    const signatureName = String(document.getElementById('signatureName')?.value || '');
    const skills = String(document.getElementById('skills')?.value || '');

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

    // Projects
    {
        const projects = document.querySelectorAll('.project-item');
        if (projects.length > 0) {
            let hasProject = false;
            let projectHTML = '';

            projects.forEach(proj => {
                const title = proj.querySelector('.project-title')?.value || '';
                const role = proj.querySelector('.project-role')?.value || '';
                const link = proj.querySelector('.project-link')?.value || '';
                const start = proj.querySelector('.project-start')?.value || '';
                const end = proj.querySelector('.project-end')?.value || '';
                const description = proj.querySelector('.project-description')?.value || '';

                if (title || description || link) {
                    hasProject = true;
                    const safeTitle = escapeHtml(title);
                    const safeRole = escapeHtml(role);
                    const safeLink = escapeHtml(link);
                    const safeStart = escapeHtml(start);
                    const safeEnd = escapeHtml(end);
                    const safeDescription = escapeHtmlMultiline(description);

                    const linkHtml = safeLink ? `<a href="${safeLink}" class="cv-project-link" target="_blank" rel="noopener">${safeLink}</a>` : '';

                    projectHTML += `
                        <div class="cv-project-item">
                            <div class="cv-item-header">
                                <div>
                                    <div class="cv-item-title">${safeTitle}</div>
                                    <div class="cv-item-company">${safeRole}</div>
                                    ${linkHtml ? `<div class="cv-item-link">${linkHtml}</div>` : ''}
                                </div>
                                <div class="cv-item-date">${safeStart}${(safeStart && safeEnd) ? ' - ' : ''}${safeEnd}</div>
                            </div>
                            ${description ? `<p class="cv-item-description">${safeDescription}</p>` : ''}
                        </div>
                    `;
                }
            });

            if (hasProject) {
                cvHTML += `
                    <div class="cv-section">
                        <h2 class="cv-section-title"><i class="fas fa-diagram-project"></i> Projects</h2>
                        ${projectHTML}
                    </div>
                `;
            }
        }
    }

    // Awards / Achievements
    {
        const awards = document.querySelectorAll('.award-item');
        if (awards.length > 0) {
            let hasAward = false;
            let awardHTML = '';

            awards.forEach(award => {
                const title = award.querySelector('.award-title')?.value || '';
                const issuer = award.querySelector('.award-issuer')?.value || '';
                const year = award.querySelector('.award-year')?.value || '';
                const description = award.querySelector('.award-description')?.value || '';

                if (title || issuer || description) {
                    hasAward = true;
                    const safeTitle = escapeHtml(title);
                    const safeIssuer = escapeHtml(issuer);
                    const safeYear = escapeHtml(year);
                    const safeDescription = escapeHtmlMultiline(description);
                    awardHTML += `
                        <div class="cv-award-item">
                            <div class="cv-item-header">
                                <div>
                                    <div class="cv-item-title">${safeTitle}</div>
                                    <div class="cv-item-company">${safeIssuer}</div>
                                </div>
                                <div class="cv-item-date">${safeYear}</div>
                            </div>
                            ${description ? `<p class="cv-item-description">${safeDescription}</p>` : ''}
                        </div>
                    `;
                }
            });

            if (hasAward) {
                cvHTML += `
                    <div class="cv-section">
                        <h2 class="cv-section-title"><i class="fas fa-trophy"></i> Achievements & Awards</h2>
                        ${awardHTML}
                    </div>
                `;
            }
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
    if (!preview) return;

    const signatureMarkup = signatureName && String(signatureName).trim()
        ? `<div class="cv-signature">${escapeHtml(String(signatureName).trim())}</div>`
        : '';

    const finalHtml = `${cvHTML}${signatureMarkup}`;
    const previewClass = `cv-preview ${currentStyle} ${getLayoutClassForStyle(currentStyle)}`.replace(/\s+/g, ' ').trim();

    if (lastPreviewSnapshot.markup === finalHtml && lastPreviewSnapshot.className === previewClass) {
        return;
    }

    preview.classList.remove('is-animating');
    preview.className = previewClass;
    preview.innerHTML = finalHtml;
    void preview.offsetWidth;
    preview.classList.add('is-animating');

    lastPreviewSnapshot = { markup: finalHtml, className: previewClass };
}

// Download PDF
async function downloadPDF() {
    const validation = validatePrimaryFields({ showErrors: true, focusFirst: true, updateSummaryBox: true });
    if (!validation.valid) return;

    generateCV({ skipValidation: true });

    const preview = document.getElementById('cvPreview');
    if (!preview || !preview.querySelector('.cv-header')) {
        updateValidationSummary('Click "Preview CV" before downloading your PDF.');
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

    const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        .map((link) => link.href)
        .filter((href) => !!href);

    const printWindow = window.open('', '_blank', 'noopener');
    if (!printWindow || printWindow.closed) {
        window.print();
        return;
    }

    const serializedHtml = preview.innerHTML;
    const previewClass = preview.className || 'cv-preview';
    const doc = printWindow.document;

    const inlineStyles = `
        body {
            margin: 0;
            padding: 24px 0;
            background: #f8fafc;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .print-wrapper {
            width: 100%;
            max-width: 960px;
            margin: 0 auto;
            padding: 0 24px;
        }
        @page {
            size: A4;
            margin: 12mm;
        }
        @media print {
            body {
                background: transparent;
                padding: 0;
            }
            .print-wrapper {
                padding: 0;
            }
        }
    `;

    const linksHtml = stylesheets
        .map((href) => `<link rel="stylesheet" href="${href}">`)
        .join('');

    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="utf-8">${linksHtml}<style>${inlineStyles}</style><title>CV Export</title></head><body><div class="print-wrapper"><div class="${previewClass}">${serializedHtml}</div></div></body></html>`);
    doc.close();

    const finishPrint = () => {
        try {
            printWindow.focus();
            printWindow.print();
        } catch {
            try {
                window.print();
            } catch {
                // ignore
            }
        }
        setTimeout(() => {
            try {
                printWindow.close();
            } catch {
                // ignore
            }
        }, 800);
    };

    if (doc.fonts && doc.fonts.ready) {
        doc.fonts.ready.then(finishPrint).catch(finishPrint);
    } else {
        printWindow.addEventListener('load', finishPrint, { once: true });
        setTimeout(finishPrint, 1200);
    }
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
        const expContainer = document.getElementById('experienceContainer');
        if (expContainer) expContainer.innerHTML = '';
        const eduContainer = document.getElementById('educationContainer');
        if (eduContainer) eduContainer.innerHTML = '';
        const courseContainer = document.getElementById('courseContainer');
        if (courseContainer) courseContainer.innerHTML = '';
        const projectContainer = document.getElementById('projectContainer');
        if (projectContainer) projectContainer.innerHTML = '';
        const awardContainer = document.getElementById('awardContainer');
        if (awardContainer) awardContainer.innerHTML = '';
        const langContainer = document.getElementById('languageContainer');
        if (langContainer) langContainer.innerHTML = '';
        
        // Reset counters
        experienceCount = 0;
        educationCount = 0;
        courseCount = 0;
        projectCount = 0;
        awardCount = 0;
        languageCount = 0;
        
        // Add one of each back
        addExperience();
        addEducation();
        addCourse();
        addProject();
        addAward();
        addLanguage();
        
        // Clear preview
        const preview = document.getElementById('cvPreview');
        if (preview) {
            preview.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>Start entering your details to see a live CV preview.</p>
                <p class="hint">Click "Preview CV" anytime to refresh the look.</p>
            </div>
            `;
        }

        clearCvDraft();
    }
}

Object.assign(window, {
    addExperience,
    addEducation,
    addCourse,
    addProject,
    addAward,
    addLanguage,
    removeItem,
    generateCV,
    downloadPDF,
    clearForm,
    toggleStyleGrid,
    toggleReviews,
    openExternalLink
});
