import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { execSync } from 'child_process';

const args = process.argv.slice(2);
const command = args[0];

if (command !== 'finalize') {
    console.error('Usage: tsx okf-fs.ts finalize <filepath>');
    process.exit(1);
}

const filepath = args[1];
if (!filepath || !fs.existsSync(filepath)) {
    console.error(`File not found: ${filepath}`);
    process.exit(1);
}

// 1. Slug normalization
const dir = path.dirname(filepath);
const ext = path.extname(filepath);
const basename = path.basename(filepath, ext);

const slug = basename
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const newFilepath = path.join(dir, `${slug}${ext}`);

// 2. Read and update frontmatter
const content = fs.readFileSync(filepath, 'utf8');
const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
let newContent = content;

const match = content.match(frontmatterRegex);
if (match) {
    const yamlString = match[1];
    try {
        const data = (yaml.load(yamlString) as any) || {};
        data.last_updated = new Date().toISOString();
        const newYaml = yaml.dump(data);
        newContent = content.replace(frontmatterRegex, `---\n${newYaml}---`);
    } catch (e) {
        console.warn('Failed to parse YAML frontmatter, skipping last_updated update.');
    }
} else {
    // If no frontmatter, we add a basic one (though okf-lint will catch if it lacks required keys)
    const newYaml = yaml.dump({ last_updated: new Date().toISOString() });
    newContent = `---\n${newYaml}---\n\n${content}`;
}

// 3. Atomic Write to the potentially new slug path
const tempPath = newFilepath + '.tmp';
fs.writeFileSync(tempPath, newContent, 'utf8');
fs.renameSync(tempPath, newFilepath);

// If the slug changed, remove the old file (handle case-insensitive OS issues)
if (filepath !== newFilepath && filepath.toLowerCase() !== newFilepath.toLowerCase()) {
    try { fs.unlinkSync(filepath); } catch(e) {}
}

// 4. Git auto-commit
try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
    execSync(`git add "${newFilepath}"`);
    if (filepath !== newFilepath) {
        try { execSync(`git add "${filepath}"`); } catch(e) {}
    }
    execSync(`git commit -m "Auto-update ${newFilepath}"`);
    console.log(`Successfully finalized and committed ${newFilepath}`);
} catch (e) {
    console.log(`Successfully finalized ${newFilepath} (Git commit skipped - not a repo or nothing to commit)`);
}
