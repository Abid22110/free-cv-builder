// Global counters for dynamic elements
let experienceCount = 0;
let educationCount = 0;
let languageCount = 0;
let isUserAuthenticated = false;
let currentStyle = 'style1'; // Default style

// Check authentication on page load
window.addEventListener('DOMContentLoaded', async () => {
    await checkAuthentication();
    initializeStyleGrid();
    addExperience();
    addEducation();
    addLanguage();
    loadSampleData();
});

// Check if user is authenticated
async function checkAuthentication() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            isUserAuthenticated = true;
            const userNameEl = document.getElementById('userName');
            if (userNameEl) {
                userNameEl.textContent = `Welcome, ${data.user.name}!`;
            }
        } else {
            window.location.href = '/login.html';
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        window.location.href = '/login.html';
    }
}

// Logout function
async function logout() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            const response = await fetch('/api/logout', { method: 'POST' });
            if (response.ok) {
                window.location.href = '/login.html';
            }
        } catch (error) {
            console.error('Logout failed:', error);
            alert('Logout failed. Please try again.');
        }
    }
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
    preview.className = `cv-preview ${styleId}`;
    
    // Show notification
    const templateName = cvTemplates.find(t => t.id === styleId).name;
    console.log('Selected template:', templateName);
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
    const skills = document.getElementById('skills').value;

    if (!fullName || !jobTitle || !email) {
        alert('Please fill in required fields: Full Name, Job Title, and Email');
        return;
    }

    let cvHTML = `
        <div class="cv-header">
            <h1 class="cv-name">${fullName}</h1>
            <p class="cv-job-title">${jobTitle}</p>
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
    if (skills) {
        const skillsArray = skills.split(',').map(s => s.trim()).filter(s => s);
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
    preview.className = `cv-preview ${currentStyle}`;
}

// Download PDF
function downloadPDF() {
    const preview = document.getElementById('cvPreview');
    
    if (!preview.querySelector('.cv-header')) {
        alert('Please generate a CV preview first!');
        return;
    }
    
    if (!isUserAuthenticated) {
        alert('Please login to download your CV!');
        window.location.href = '/login.html';
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
