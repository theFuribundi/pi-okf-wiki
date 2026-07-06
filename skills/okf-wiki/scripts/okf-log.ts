import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const command = args[0];
const rootDir = process.env.OKF_ROOT || process.cwd();
const logFile = path.join(rootDir, 'log.md');

if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '# Wiki Chronology\n\n', 'utf8');
}

function getTodayStr() {
    const d = new Date();
    return d.toISOString().split('T')[0];
}

if (command === 'append') {
    const operation = args[1];
    const description = args.slice(2).join(' ');
    
    if (!operation || !description) {
        console.error('Usage: tsx okf-log.ts append <operation> <description>');
        process.exit(1);
    }
    
    const entry = `## [${getTodayStr()}] ${operation} | ${description}\n`;
    fs.appendFileSync(logFile, entry, 'utf8');
    
    // Auto commit the log
    try {
        execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
        execSync(`git add "${logFile}"`);
        execSync(`git commit -m "Log: ${operation} - ${description}"`);
        console.log('Appended to log.md and committed to git.');
    } catch (e) {
        console.log('Appended to log.md (Git commit skipped).');
    }
}
else if (command === 'digest') {
    const limit = parseInt(args[1], 10) || 5;
    const content = fs.readFileSync(logFile, 'utf8');
    
    // Extract entries using regex
    const entryRegex = /^## \[\d{4}-\d{2}-\d{2}\].*$/gm;
    const entries = content.match(entryRegex) || [];
    
    const recent = entries.slice(-limit);
    console.log(`--- Last ${recent.length} Log Entries ---`);
    recent.forEach(e => console.log(e));
}
else if (command === 'history') {
    const target = args[1];
    if (!target) {
        console.error('Usage: tsx okf-log.ts history <filename_or_concept>');
        process.exit(1);
    }
    
    const content = fs.readFileSync(logFile, 'utf8');
    const entryRegex = /^## \[\d{4}-\d{2}-\d{2}\].*$/gm;
    const entries = content.match(entryRegex) || [];
    
    const relevant = entries.filter(e => e.toLowerCase().includes(target.toLowerCase()));
    
    console.log(`--- History for '${target}' (${relevant.length} entries) ---`);
    relevant.forEach(e => console.log(e));
}
else {
    console.error('Usage: tsx okf-log.ts <append|digest|history>');
}
