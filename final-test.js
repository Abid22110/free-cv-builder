#!/usr/bin/env node
/**
 * Comprehensive Test Suite for Free CV Builder
 * Tests all critical functionality
 */

const fs = require('fs');
const path = require('path');

console.log('\n🧪 COMPREHENSIVE CV BUILDER TEST SUITE\n');
console.log('═'.repeat(50) + '\n');

// Test 1: File Existence
console.log('TEST 1: File Existence');
const requiredFiles = [
    'index.html',
    'app.js',
    'style.css',
    'local-auth.js',
    'config.js',
    'package.json'
];

let test1Pass = true;
for (const file of requiredFiles) {
    const exists = fs.existsSync(file);
    console.log(`  ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) test1Pass = false;
}
console.log();

// Test 2: JavaScript Syntax
console.log('TEST 2: JavaScript Syntax');
const jsFiles = ['app.js', 'local-auth.js'];
let test2Pass = true;

for (const file of jsFiles) {
    try {
        const code = fs.readFileSync(file, 'utf8');
        new Function(code);
        console.log(`  ✅ ${file} - Valid syntax`);
    } catch (err) {
        console.log(`  ❌ ${file} - ${err.message}`);
        test2Pass = false;
    }
}
console.log();

// Test 3: Required Functions
console.log('TEST 3: Required Functions Exist');
const appCode = fs.readFileSync('app.js', 'utf8');
const requiredFunctions = [
    'addExperience', 'addEducation', 'addCourse', 'addProject', 'addAward',
    'addLanguage', 'removeItem', 'generateCV', 'downloadPDF', 'clearForm',
    'saveCvDraft', 'loadCvDraft', 'setupPreviewZoom', 'setupKeyboardShortcuts',
    'setupCharacterCounter', 'setupFormValidation', 'validatePrimaryFields',
    'setupAiAssistant', 'setupWizard', 'setupSkillsChips'
];

let test3Pass = true;
for (const fn of requiredFunctions) {
    const exists = appCode.includes(`function ${fn}(`) || appCode.includes(`function ${fn} (`);
    console.log(`  ${exists ? '✅' : '❌'} ${fn}()`);
    if (!exists) test3Pass = false;
}
console.log();

// Test 4: HTML Elements
console.log('TEST 4: HTML Elements');
const htmlCode = fs.readFileSync('index.html', 'utf8');
const requiredElements = [
    { id: 'fullName', type: 'input' },
    { id: 'jobTitle', type: 'input' },
    { id: 'email', type: 'input' },
    { id: 'experienceContainer', type: 'div' },
    { id: 'educationContainer', type: 'div' },
    { id: 'projectContainer', type: 'div' },
    { id: 'awardContainer', type: 'div' },
    { id: 'skillsChips', type: 'div' },
    { id: 'cvPreview', type: 'div' },
    { id: 'aiHelper', type: 'div' },
    { id: 'previewZoomRange', type: 'input' }
];

let test4Pass = true;
for (const elem of requiredElements) {
    const exists = htmlCode.includes(`id="${elem.id}"`);
    console.log(`  ${exists ? '✅' : '❌'} #${elem.id}`);
    if (!exists) test4Pass = false;
}
console.log();

// Test 5: CSS Classes
console.log('TEST 5: CSS Classes');
const cssCode = fs.readFileSync('style.css', 'utf8');
const requiredClasses = [
    'form-group', 'btn-primary', 'btn-outline', 'preview-canvas',
    'cv-preview', 'ai-helper', 'toast-notification', 'help-tip',
    'char-counter', 'skill-chip', 'experience-item', 'project-item',
    'award-item', 'zoom-control'
];

let test5Pass = true;
for (const cls of requiredClasses) {
    const exists = cssCode.includes(`.${cls}`);
    console.log(`  ${exists ? '✅' : '❌'} .${cls}`);
    if (!exists) test5Pass = false;
}
console.log();

// Test 6: Onclick Handlers
console.log('TEST 6: Onclick Handlers Wired');
const onclickHandlers = [
    'onclick="addExperience()"',
    'onclick="addEducation()"',
    'onclick="addCourse()"',
    'onclick="addProject()"',
    'onclick="addAward()"',
    'onclick="addLanguage()"',
    'onclick="addSkillsFromInput()"',
    'onclick="generateCV()"',
    'onclick="downloadPDF()"',
    'onclick="toggleStyleGrid()"'
];

let test6Pass = true;
for (const handler of onclickHandlers) {
    const exists = htmlCode.includes(handler);
    console.log(`  ${exists ? '✅' : '❌'} ${handler}`);
    if (!exists) test6Pass = false;
}
console.log();

// Test 7: Code Quality
console.log('TEST 7: Code Quality');
let test7Pass = true;

// Check for balanced braces
const openBraces = (appCode.match(/\{/g) || []).length;
const closeBraces = (appCode.match(/\}/g) || []).length;
const bracesOk = openBraces === closeBraces;
console.log(`  ${bracesOk ? '✅' : '❌'} Balanced braces: ${openBraces} = ${closeBraces}`);
test7Pass = test7Pass && bracesOk;

// Check for balanced parentheses
const openParens = (appCode.match(/\(/g) || []).length;
const closeParens = (appCode.match(/\)/g) || []).length;
const parensOk = openParens === closeParens;
console.log(`  ${parensOk ? '✅' : '❌'} Balanced parentheses: ${openParens} = ${closeParens}`);
test7Pass = test7Pass && parensOk;

// Check for console.log in production code (should be minimal)
const consoleLogs = (appCode.match(/console\.log/g) || []).length;
const logsOk = consoleLogs === 0;
console.log(`  ${logsOk ? '✅' : '⚠️'} Debug logs: ${consoleLogs} (should be 0)`);
test7Pass = test7Pass && logsOk;

console.log();

// Summary
console.log('═'.repeat(50));
console.log('\n📊 TEST SUMMARY\n');

const allTests = [
    { name: 'File Existence', pass: test1Pass },
    { name: 'JavaScript Syntax', pass: test2Pass },
    { name: 'Required Functions', pass: test3Pass },
    { name: 'HTML Elements', pass: test4Pass },
    { name: 'CSS Classes', pass: test5Pass },
    { name: 'Onclick Handlers', pass: test6Pass },
    { name: 'Code Quality', pass: test7Pass }
];

let passCount = 0;
for (const test of allTests) {
    const icon = test.pass ? '✅' : '❌';
    console.log(`${icon} ${test.name}`);
    if (test.pass) passCount++;
}

console.log(`\n${passCount}/${allTests.length} tests passed\n`);

if (passCount === allTests.length) {
    console.log('🎉 ALL TESTS PASSED! App is ready for deployment.\n');
    process.exit(0);
} else {
    console.log('⚠️  Some tests failed. Please fix issues above.\n');
    process.exit(1);
}
