#!/usr/bin/env node

/**
 * Quick Validation: Check that all files have correct syntax and key functions exist
 */

const fs = require('fs');
const path = require('path');

console.log('\n🔍 Validating Premium CV Builder Changes...\n');

const checks = [];

// Check 1: app.js has new functions
console.log('Check 1: Verifying app.js has new functions...');
const appJs = fs.readFileSync(path.join(__dirname, 'app.js'), 'utf8');
const appFunctions = ['addProject', 'addAward', 'setupPreviewZoom'];
const appOk = appFunctions.every(fn => appJs.includes(`function ${fn}(`));
checks.push({ name: 'app.js functions', ok: appOk });
console.log(appOk ? '✅ All new functions found' : '❌ Missing functions');

// Check 2: app.js has project/award rendering in generateCV
console.log('\nCheck 2: Verifying CV rendering includes Projects/Awards...');
const hasProjectRender = appJs.includes('fa-diagram-project');
const hasAwardRender = appJs.includes('fa-trophy') && appJs.includes('Achievements');
checks.push({ name: 'CV rendering', ok: hasProjectRender && hasAwardRender });
console.log(hasProjectRender && hasAwardRender ? '✅ Rendering code present' : '❌ Rendering code missing');

// Check 3: app.js has draft save/load for projects/awards
console.log('\nCheck 3: Verifying draft persistence for new sections...');
const hasDraftProjects = appJs.includes('draft.projects') && appJs.includes('projects,');
const hasDraftAwards = appJs.includes('draft.awards') && appJs.includes('awards,');
checks.push({ name: 'Draft persistence', ok: hasDraftProjects && hasDraftAwards });
console.log(hasDraftProjects && hasDraftAwards ? '✅ Draft save/load integrated' : '❌ Draft integration incomplete');

// Check 4: index.html has project and award containers
console.log('\nCheck 4: Verifying index.html markup...');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const hasProjectContainer = indexHtml.includes('id="projectContainer"');
const hasAwardContainer = indexHtml.includes('id="awardContainer"');
const hasZoomControl = indexHtml.includes('id="previewZoomRange"');
const hasPreviewCanvas = indexHtml.includes('id="previewCanvas"');
checks.push({ name: 'HTML markup', ok: hasProjectContainer && hasAwardContainer && hasZoomControl && hasPreviewCanvas });
console.log(hasProjectContainer && hasAwardContainer && hasZoomControl && hasPreviewCanvas 
    ? '✅ All required elements present' 
    : '❌ Missing HTML elements');

// Check 5: style.css has new styles
console.log('\nCheck 5: Verifying style.css has new styles...');
const styleCss = fs.readFileSync(path.join(__dirname, 'style.css'), 'utf8');
const hasProjectItemStyle = styleCss.includes('.project-item');
const hasAwardItemStyle = styleCss.includes('.award-item');
const hasZoomStyle = styleCss.includes('.zoom-control');
const hasCanvasStyle = styleCss.includes('.preview-canvas');
checks.push({ name: 'CSS styling', ok: hasProjectItemStyle && hasAwardItemStyle && hasZoomStyle && hasCanvasStyle });
console.log(hasProjectItemStyle && hasAwardItemStyle && hasZoomStyle && hasCanvasStyle 
    ? '✅ All styles defined' 
    : '❌ Missing styles');

// Check 6: Syntax validation
console.log('\nCheck 6: Quick JavaScript syntax check...');
try {
    new Function(appJs);
    checks.push({ name: 'app.js syntax', ok: true });
    console.log('✅ app.js syntax valid');
} catch (e) {
    checks.push({ name: 'app.js syntax', ok: false });
    console.log('❌ app.js has syntax errors:', e.message.slice(0, 80));
}

// Summary
console.log('\n' + '═'.repeat(50));
const allPassed = checks.every(c => c.ok);
const passed = checks.filter(c => c.ok).length;
console.log(`Results: ${passed}/${checks.length} checks passed`);
console.log('═'.repeat(50));

checks.forEach(check => {
    console.log(`  ${check.ok ? '✅' : '❌'} ${check.name}`);
});

console.log('\n' + (allPassed ? '🎉 All checks passed!' : '⚠️  Some checks failed'));
console.log('\nNext steps:');
console.log('  1. Open http://localhost:8000 in your browser');
console.log('  2. Fill in CV details');
console.log('  3. Click "Add Project" and "Add Achievement" to test new sections');
console.log('  4. Use zoom slider (80%-130%) to verify preview scaling');
console.log('  5. Click "Preview CV" then "Download PDF" to test export\n');

process.exit(allPassed ? 0 : 1);
