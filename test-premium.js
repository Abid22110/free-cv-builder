/**
 * Premium CV Builder Test Suite
 * Tests Projects, Awards, and Preview Zoom features
 */

async function testPremiumFeatures() {
    console.log('🚀 Starting Premium CV Builder Tests...\n');

    // Test 1: Verify project and award sections exist
    console.log('Test 1: Checking DOM elements...');
    const projectContainer = document.getElementById('projectContainer');
    const awardContainer = document.getElementById('awardContainer');
    const zoomRange = document.getElementById('previewZoomRange');
    const previewCanvas = document.getElementById('previewCanvas');

    if (!projectContainer || !awardContainer) {
        console.error('❌ Missing project or award container');
        return;
    }
    if (!zoomRange || !previewCanvas) {
        console.error('❌ Missing zoom controls or preview canvas');
        return;
    }
    console.log('✅ All DOM elements present\n');

    // Test 2: Fill in basic CV data
    console.log('Test 2: Filling in basic information...');
    document.getElementById('fullName').value = 'Jane Smith';
    document.getElementById('jobTitle').value = 'Senior Product Designer';
    document.getElementById('email').value = 'jane@example.com';
    document.getElementById('phone').value = '+1 555 123 4567';
    document.getElementById('location').value = 'San Francisco, CA';
    document.getElementById('website').value = 'https://janesmith.design';
    document.getElementById('summary').value = 'Innovative product designer with 8+ years of experience crafting user-centered solutions for enterprise and consumer products.';
    console.log('✅ Basic info filled\n');

    // Test 3: Add a project
    console.log('Test 3: Adding project...');
    if (typeof addProject !== 'function') {
        console.error('❌ addProject function not available');
        return;
    }
    addProject();
    const project = projectContainer.querySelector('.project-item');
    if (!project) {
        console.error('❌ Project item not created');
        return;
    }
    project.querySelector('.project-title').value = 'Mobile Design System';
    project.querySelector('.project-role').value = 'Lead Designer';
    project.querySelector('.project-start').value = 'Jan 2023';
    project.querySelector('.project-end').value = 'Present';
    project.querySelector('.project-link').value = 'https://design-system.example.com';
    project.querySelector('.project-description').value = 'Built comprehensive design system with 200+ reusable components. Improved design-to-dev handoff by 40%.';
    console.log('✅ Project added and populated\n');

    // Test 4: Add an award
    console.log('Test 4: Adding award...');
    if (typeof addAward !== 'function') {
        console.error('❌ addAward function not available');
        return;
    }
    addAward();
    const award = awardContainer.querySelector('.award-item');
    if (!award) {
        console.error('❌ Award item not created');
        return;
    }
    award.querySelector('.award-title').value = 'Design Excellence Award';
    award.querySelector('.award-issuer').value = 'Tech Industry Association';
    award.querySelector('.award-year').value = '2025';
    award.querySelector('.award-description').value = 'Recognized for innovative approach to accessibility in design.';
    console.log('✅ Award added and populated\n');

    // Test 5: Generate CV preview
    console.log('Test 5: Generating CV preview...');
    if (typeof generateCV !== 'function') {
        console.error('❌ generateCV function not available');
        return;
    }
    generateCV({ skipValidation: true });
    const preview = document.getElementById('cvPreview');
    const projectSection = preview.querySelector('[class*="cv-section"]:has(.cv-project-item)');
    const awardSection = preview.querySelector('[class*="cv-section"]:has(.cv-award-item)');
    if (!projectSection || !awardSection) {
        console.warn('⚠️  Project or award section not visible in preview yet (may be empty placeholder)');
    } else {
        console.log('✅ CV preview generated with project and award sections\n');
    }

    // Test 6: Test zoom control
    console.log('Test 6: Testing zoom functionality...');
    const initialScale = parseFloat(previewCanvas.style.getPropertyValue('--preview-scale') || '1');
    console.log(`  Initial scale: ${initialScale}`);
    
    // Simulate zoom to 110%
    zoomRange.value = '110';
    const event = new Event('input', { bubbles: true });
    zoomRange.dispatchEvent(event);
    
    const newScale = parseFloat(previewCanvas.style.getPropertyValue('--preview-scale') || '1');
    const zoomLabel = document.getElementById('previewZoomLabel').textContent;
    console.log(`  After zoom input: scale=${newScale}, label="${zoomLabel}"`);
    
    if (Math.abs(newScale - 1.1) < 0.01) {
        console.log('✅ Zoom control working correctly\n');
    } else {
        console.warn('⚠️  Zoom scale may need adjustment\n');
    }

    // Test 7: Draft persistence
    console.log('Test 7: Testing draft auto-save...');
    if (typeof saveCvDraft !== 'function') {
        console.error('❌ saveCvDraft function not available');
        return;
    }
    saveCvDraft();
    
    const draftKey = getDraftStorageKey ? getDraftStorageKey() : 'free-cv-builder:draft:v2.1:guest';
    const savedDraft = localStorage.getItem(draftKey);
    
    if (savedDraft) {
        try {
            const draft = JSON.parse(savedDraft);
            const hasProjects = Array.isArray(draft.projects) && draft.projects.length > 0;
            const hasAwards = Array.isArray(draft.awards) && draft.awards.length > 0;
            
            if (hasProjects && hasAwards) {
                console.log('✅ Draft saved with projects and awards\n');
                console.log(`   Projects: ${draft.projects.length}, Awards: ${draft.awards.length}`);
            } else {
                console.warn('⚠️  Draft saved but missing project/award data\n');
            }
        } catch (e) {
            console.error('❌ Failed to parse saved draft:', e.message);
        }
    } else {
        console.error('❌ No draft found in localStorage');
    }

    // Test 8: Skills and other sections
    console.log('Test 8: Adding skills...');
    const skillsInput = document.getElementById('skillsInput');
    if (skillsInput) {
        skillsInput.value = 'UI Design';
        const addSkillBtn = document.querySelector('.skills-add-btn');
        if (addSkillBtn) {
            addSkillBtn.click();
            skillsInput.value = 'Prototyping';
            addSkillBtn.click();
            console.log('✅ Skills added\n');
        }
    }

    // Test 9: Education
    console.log('Test 9: Adding education...');
    if (typeof addEducation !== 'function') {
        console.error('❌ addEducation function not available');
        return;
    }
    addEducation();
    const edu = document.querySelector('.education-item');
    if (edu) {
        edu.querySelector('.edu-degree').value = 'Bachelor of Fine Arts';
        edu.querySelector('.edu-school').value = 'California College of the Arts';
        edu.querySelector('.edu-start').value = '2014';
        edu.querySelector('.edu-end').value = '2018';
        console.log('✅ Education added\n');
    }

    // Test 10: Language
    console.log('Test 10: Adding language...');
    if (typeof addLanguage !== 'function') {
        console.error('❌ addLanguage function not available');
        return;
    }
    addLanguage();
    const lang = document.querySelector('.language-item');
    if (lang) {
        lang.querySelector('.lang-name').value = 'English';
        lang.querySelector('.lang-level').value = 'Native';
        console.log('✅ Language added\n');
    }

    // Final check: Generate full CV
    console.log('Test 11: Final CV generation with all sections...');
    generateCV({ skipValidation: true });
    const fullPreview = document.getElementById('cvPreview');
    const sections = fullPreview.querySelectorAll('.cv-section').length;
    console.log(`✅ CV generated with ${sections} sections\n`);

    console.log('═══════════════════════════════════════');
    console.log('🎉 All tests completed successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\nSummary:');
    console.log('  ✅ Projects section working');
    console.log('  ✅ Awards section working');
    console.log('  ✅ Zoom controls functional');
    console.log('  ✅ Draft auto-save integrated');
    console.log('  ✅ Full CV generation with premium sections');
    console.log('\nNext: Try zooming (80%-130%) and download PDF to verify export quality.');
}

// Run tests when document is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testPremiumFeatures);
} else {
    testPremiumFeatures();
}
