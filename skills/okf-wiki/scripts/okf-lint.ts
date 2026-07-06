import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

const rootDir = process.argv[2] || process.cwd();

const REQUIRED_KEYS = ['id', 'type', 'created_date', 'status', 'last_updated'];
const IGNORED_DIRS = ['raw', '.agents', 'node_modules', '.git'];
const IGNORED_FILES = ['index.md', 'log.md', 'README.md'];

function levenshtein(a: string, b: string): number {
    const matrix = [];
    let i, j;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    for (i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (i = 1; i <= b.length; i++) {
        for (j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) == a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

function walkSync(dir: string, filelist: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            if (!IGNORED_DIRS.includes(file)) {
                filelist = walkSync(filepath, filelist);
            }
        } else {
            if (file.endsWith('.md') && !IGNORED_FILES.includes(file)) {
                filelist.push(filepath);
            }
        }
    }
    return filelist;
}

const allFiles = walkSync(rootDir);
let errors = 0;
const allTags = new Set<string>();

console.log(`Linting ${allFiles.length} markdown files...`);

for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
    const match = content.match(frontmatterRegex);

    if (!match) {
        console.error(`[ERR] Missing YAML frontmatter: ${file}`);
        errors++;
        continue;
    }

    let data: any;
    try {
        data = yaml.load(match[1]);
    } catch (e) {
        console.error(`[ERR] Invalid YAML frontmatter in ${file}`);
        errors++;
        continue;
    }

    if (!data || typeof data !== 'object') {
        console.error(`[ERR] Frontmatter is not an object in ${file}`);
        errors++;
        continue;
    }

    const missingKeys = REQUIRED_KEYS.filter(key => !(key in data));
    if (missingKeys.length > 0) {
        console.error(`[ERR] Missing required schema keys [${missingKeys.join(', ')}] in ${file}`);
        errors++;
    }

    if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => allTags.add(tag));
    }
}

// Tag Harmonization Check
const tagList = Array.from(allTags);
console.log(`\nAnalyzing ${tagList.length} unique tags...`);
for (let i = 0; i < tagList.length; i++) {
    for (let j = i + 1; j < tagList.length; j++) {
        const t1 = tagList[i].toLowerCase();
        const t2 = tagList[j].toLowerCase();
        
        // Simple plural/singular check or typo
        if (t1 === t2 + 's' || t2 === t1 + 's') {
            console.warn(`[WARN] Possible redundant tags found: '${tagList[i]}' and '${tagList[j]}'`);
        } else {
            const dist = levenshtein(t1, t2);
            if (dist === 1 && t1.length > 3 && t2.length > 3) {
                console.warn(`[WARN] Near-match tags found: '${tagList[i]}' and '${tagList[j]}'`);
            }
        }
    }
}

if (errors > 0) {
    console.error(`\nLinting failed with ${errors} error(s).`);
    process.exit(1);
} else {
    console.log(`\nLinting passed!`);
}
