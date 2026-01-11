(function () {
    const USERS_KEY = 'free-cv-builder:local-users:v1';
    const SESSION_KEY = 'free-cv-builder:local-session:v1';
    const subscribers = new Set();

    const safeJsonParse = (value) => {
        try {
            return JSON.parse(value);
        } catch (err) {
            return null;
        }
    };

    const readUsers = () => {
        try {
            const raw = localStorage.getItem(USERS_KEY);
            const list = safeJsonParse(raw);
            return Array.isArray(list) ? list : [];
        } catch (err) {
            return [];
        }
    };

    const writeUsers = (users) => {
        try {
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } catch (err) {
            throw new Error('storage-write-failed');
        }
    };

    const sanitizeEmail = (email) => String(email || '').trim().toLowerCase();

    const generateUserId = (email) => `local:${sanitizeEmail(email)}`;

    const randomSalt = () => {
        try {
            if (window.crypto && window.crypto.getRandomValues) {
                const bytes = new Uint8Array(16);
                window.crypto.getRandomValues(bytes);
                return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
            }
        } catch (err) {
            // ignore and fall through
        }
        return Math.random().toString(36).slice(2, 10);
    };

    const hashPassword = async (password, salt) => {
        const value = `${salt}:${String(password || '')}`;
        if (window.crypto && window.crypto.subtle && window.TextEncoder) {
            const encoder = new TextEncoder();
            const data = encoder.encode(value);
            const digest = await window.crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(digest));
            return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
        }
        return btoa(value);
    };

    const getCurrentUserId = () => {
        try {
            return localStorage.getItem(SESSION_KEY) || '';
        } catch (err) {
            return '';
        }
    };

    const setCurrentUserId = (userId) => {
        try {
            if (userId) {
                localStorage.setItem(SESSION_KEY, userId);
            } else {
                localStorage.removeItem(SESSION_KEY);
            }
        } catch (err) {
            // Ignore storage issues (private mode)
        }
    };

    const pickDisplayName = (user) => {
        if (!user) return '';
        const rawName = String(user.name || '').trim();
        if (rawName) return rawName;
        const email = String(user.email || '');
        const firstPart = email.split('@')[0];
        return firstPart ? firstPart.replace(/[^a-zA-Z0-9]+/g, ' ').trim() : 'Account';
    };

    const cloneUserSafe = (user) => {
        if (!user) return null;
        return {
            id: user.id,
            email: user.email,
            name: user.name || '',
            createdAt: user.createdAt || 0,
            lastLoginAt: user.lastLoginAt || 0,
            displayName: pickDisplayName(user)
        };
    };

    const notifySubscribers = () => {
        const snapshot = LocalAuth.getCurrentUser();
        subscribers.forEach((cb) => {
            try {
                cb(snapshot);
            } catch (err) {
                // ignore subscriber errors
            }
        });
    };

    const createError = (code, message) => {
        const err = new Error(message || code);
        err.code = code;
        return err;
    };

    const LocalAuth = {
        async register({ name, email, password }) {
            const cleanEmail = sanitizeEmail(email);
            const cleanName = String(name || '').trim();
            const cleanPassword = String(password || '');

            if (!cleanEmail) {
                throw createError('invalid-email', 'Email is required.');
            }
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(cleanEmail)) {
                throw createError('invalid-email', 'Enter a valid email address.');
            }
            if (cleanPassword.length < 6) {
                throw createError('weak-password', 'Password must be at least 6 characters.');
            }

            const users = readUsers();
            if (users.some((existing) => existing.email === cleanEmail)) {
                throw createError('email-exists', 'An account with this email already exists.');
            }

            const salt = randomSalt();
            const passwordHash = await hashPassword(cleanPassword, salt);
            const user = {
                id: generateUserId(cleanEmail),
                email: cleanEmail,
                name: cleanName,
                salt,
                passwordHash,
                createdAt: Date.now(),
                lastLoginAt: Date.now()
            };

            users.push(user);
            writeUsers(users);
            setCurrentUserId(user.id);
            notifySubscribers();
            return cloneUserSafe(user);
        },

        async signIn({ email, password }) {
            const cleanEmail = sanitizeEmail(email);
            const cleanPassword = String(password || '');

            if (!cleanEmail || !cleanPassword) {
                throw createError('missing-credentials', 'Email and password are required.');
            }

            const users = readUsers();
            const user = users.find((candidate) => candidate.email === cleanEmail);
            if (!user) {
                throw createError('user-not-found', 'No account found with this email.');
            }

            const hashed = await hashPassword(cleanPassword, user.salt);
            if (hashed !== user.passwordHash) {
                throw createError('wrong-password', 'Incorrect password.');
            }

            user.lastLoginAt = Date.now();
            writeUsers(users);
            setCurrentUserId(user.id);
            notifySubscribers();
            return cloneUserSafe(user);
        },

        signOut() {
            setCurrentUserId('');
            notifySubscribers();
        },

        getCurrentUser() {
            const currentId = getCurrentUserId();
            if (!currentId) return null;
            const users = readUsers();
            const user = users.find((candidate) => candidate.id === currentId);
            return cloneUserSafe(user || null);
        },

        listUsers() {
            return readUsers().map(cloneUserSafe).filter(Boolean);
        },

        updateProfileName(name) {
            const currentId = getCurrentUserId();
            if (!currentId) return;
            const cleanName = String(name || '').trim();
            const users = readUsers();
            const user = users.find((candidate) => candidate.id === currentId);
            if (!user) return;
            user.name = cleanName;
            writeUsers(users);
            notifySubscribers();
        },

        onChange(callback) {
            if (typeof callback !== 'function') {
                return () => {};
            }
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        }
    };

    window.LocalAuth = LocalAuth;

    window.addEventListener('storage', (event) => {
        if (!event) return;
        if (event.key === SESSION_KEY || event.key === USERS_KEY) {
            notifySubscribers();
        }
    });
})();
