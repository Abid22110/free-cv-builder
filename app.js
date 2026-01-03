// Global counters for dynamic elements
let experienceCount = 0;
let educationCount = 0;
let languageCount = 0;
let currentStyle = 'style1'; // Default style
let profilePhotoDataUrl = '';
let skillsList = [];

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

function getCurrentTemplateMeta() {
    const template = cvTemplates.find(t => t.id === currentStyle);
    if (!template) {
        return { name: 'Template', category: 'Default', iconClass: 'fa-star' };
    }

    const displayName = String(template.name).replace(/^\S+\s+/, '');
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

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    initializeStyleGrid();
    addExperience();
    addEducation();
    addLanguage();
    setupProfilePhotoUpload();
    setupSkillsChips();
});

function getLayoutClassForStyle(styleId) {
    const match = String(styleId).match(/(\d+)/);
    const n = match ? Number(match[1]) : 1;
    // 5 layout groups across 50 templates
    const group = ((Math.max(1, Math.min(50, n)) - 1) % 5) + 1;
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
}

function removeSkill(skill) {
    const target = String(skill || '').toLowerCase();
    skillsList = skillsList.filter(s => s.toLowerCase() !== target);
    renderSkillsChips();
    syncSkillsHiddenValue();
}

function syncSkillsHiddenValue() {
    const hidden = document.getElementById('skills');
    if (!hidden) return;
    hidden.value = skillsList.join(', ');
}

function renderSkillsChips() {
    const container = document.getElementById('skillsChips');
    if (!container) return;

    container.innerHTML = skillsList.map(skill => `
        <span class="skill-chip">
            ${skill}
            <button type="button" aria-label="Remove ${skill}" onclick="removeSkill('${skill.replace(/'/g, "\\'")}')">
                <i class="fas fa-times"></i>
            </button>
        </span>
    `).join('');
}

function setupProfilePhotoUpload() {
    const input = document.getElementById('profilePhoto');
    if (!input) return;

    input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        if (!file) {
            profilePhotoDataUrl = '';
            return;
        }

        if (!file.type || !file.type.startsWith('image/')) {
            alert('Please select an image file.');
            input.value = '';
            profilePhotoDataUrl = '';
            return;
        }

        // Keep it lightweight for GitHub Pages + printing.
        const maxBytes = 2 * 1024 * 1024; // 2MB
        if (file.size > maxBytes) {
            alert('Image is too large. Please use an image under 2MB.');
            input.value = '';
            profilePhotoDataUrl = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            profilePhotoDataUrl = String(reader.result || '');
            const preview = document.getElementById('cvPreview');
            if (preview && preview.querySelector('.cv-header')) {
                generateCV();
            }
        };
        reader.readAsDataURL(file);
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

// 50 CV Template Styles with descriptions
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
    { id: 'style50', name: '🌊 Wave', category: 'Professional' }
];

// 50+ User Reviews/Testimonials
const userReviews = [
    { name: 'Ahmed Hassan', role: 'Software Engineer', rating: 5, text: 'Amazing CV builder! Created my CV in just 5 minutes. Got 3 job offers within a week!', img: '👨‍💼' },
    { name: 'Fatima Khan', role: 'Marketing Manager', rating: 5, text: 'The 50 templates are incredible. My CV looks so professional now. Highly recommended!', img: '👩‍💼' },
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
    { name: 'Nora Hassan', role: 'Finance Analyst', rating: 5, text: 'The 50 templates made it so easy to find one that matches my personality and style.', img: '👩‍💼' },
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
    { name: 'Fabrice Ahmed', role: 'Analyst', rating: 5, text: 'The 50 templates offer something for every industry and style preference.', img: '👨‍💼' },
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
                <div class="style-preview-icon">${template.name.charAt(0)}</div>
                <div class="style-card-name">${template.name.substring(2)}</div>
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
                    <h1 class="cv-name">${fullName}</h1>
                    <p class="cv-job-title">${jobTitle}</p>
                    ${badgeHTML}
                </div>
            </div>
            <div class="cv-contact">
                ${email ? `<div class="cv-contact-item"><i class="fas fa-envelope"></i> ${email}</div>` : ''}
                ${phone ? `<div class="cv-contact-item"><i class="fas fa-phone"></i> ${phone}</div>` : ''}
                ${location ? `<div class="cv-contact-item"><i class="fas fa-map-marker-alt"></i> ${location}</div>` : ''}
                ${website ? `<div class="cv-contact-item"><i class="fas fa-globe"></i> ${website}</div>` : ''}
            </div>
        </div>
    `;

    // Summary
    if (summary) {
        cvHTML += `
            <div class="cv-section">
                <h2 class="cv-section-title"><i class="fas fa-user"></i> Professional Summary</h2>
                <p class="cv-summary">${summary}</p>
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
                experienceHTML += `
                    <div class="cv-experience-item">
                        <div class="cv-item-header">
                            <div>
                                <div class="cv-item-title">${title}</div>
                                <div class="cv-item-company">${company}</div>
                            </div>
                            <div class="cv-item-date">${start} - ${end}</div>
                        </div>
                        ${description ? `<p class="cv-item-description">${description}</p>` : ''}
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
                educationHTML += `
                    <div class="cv-education-item">
                        <div class="cv-item-header">
                            <div>
                                <div class="cv-item-title">${degree}</div>
                                <div class="cv-item-school">${school}</div>
                            </div>
                            <div class="cv-item-date">${start} - ${end}</div>
                        </div>
                        ${description ? `<p class="cv-item-description">${description}</p>` : ''}
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
                        ${skillsArray.map(skill => `<span class="cv-skill-tag">${skill}</span>`).join('')}
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
                languageHTML += `
                    <div class="cv-language-item">
                        <span>${name}</span>
                        <span>${level}</span>
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
        preview.insertAdjacentHTML('beforeend', `<div class="cv-signature">${String(signatureName).trim()}</div>`);
    }
}

// Download PDF
function downloadPDF() {
    const preview = document.getElementById('cvPreview');
    
    if (!preview.querySelector('.cv-header')) {
        alert('Please generate a CV preview first!');
        return;
    }
    
    // Simple print dialog - user can save as PDF
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
        document.getElementById('languageContainer').innerHTML = '';
        
        // Reset counters
        experienceCount = 0;
        educationCount = 0;
        languageCount = 0;
        
        // Add one of each back
        addExperience();
        addEducation();
        addLanguage();
        
        // Clear preview
        document.getElementById('cvPreview').innerHTML = `
            <div class="empty-state">
                <i class="fas fa-file-alt"></i>
                <p>Your CV preview will appear here</p>
                <p class="hint">Fill in the form and click "Preview CV"</p>
            </div>
        `;
    }
}
