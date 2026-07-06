import * as fs from 'fs';
import * as path from 'path';

const args = process.argv.slice(2);
const command = args[0];
const rootDir = process.env.OKF_ROOT || process.cwd();
const IGNORED_DIRS = ['raw', '.agents', 'node_modules', '.git'];

function walkSync(dir: string, filelist: string[] = []): string[] {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filepath = path.join(dir, file);
        if (fs.statSync(filepath).isDirectory()) {
            if (!IGNORED_DIRS.includes(file)) {
                filelist = walkSync(filepath, filelist);
            }
        } else {
            if (file.endsWith('.md')) {
                filelist.push(filepath);
            }
        }
    }
    return filelist;
}

// Extracts both standard markdown links [text](target) and wikilinks [[target]]
function extractLinks(content: string): string[] {
    const links: string[] = [];
    const mdRegex = /\[.*?\]\((.*?\.md)\)/g;
    const wikiRegex = /\[\[(.*?)\]\]/g;
    
    let match;
    while ((match = mdRegex.exec(content)) !== null) {
        links.push(match[1].split('#')[0]);
    }
    while ((match = wikiRegex.exec(content)) !== null) {
        let linkTarget = match[1].split('|')[0].split('#')[0];
        if (!linkTarget.endsWith('.md')) {
            linkTarget += '.md';
        }
        links.push(linkTarget);
    }
    return links;
}

const allFiles = walkSync(rootDir);

if (command === 'orphans') {
    // Find all files that are never linked to
    const linkedTargets = new Set<string>();
    
    for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const links = extractLinks(content);
        for (const link of links) {
            // resolve relative to the file, then get path relative to root
            const resolved = path.resolve(path.dirname(file), link);
            const relativeToRoot = path.relative(rootDir, resolved);
            linkedTargets.add(relativeToRoot);
        }
    }

    const orphans = [];
    for (const file of allFiles) {
        const relPath = path.relative(rootDir, file);
        if (relPath !== 'index.md' && relPath !== 'log.md' && !linkedTargets.has(relPath)) {
            orphans.push(relPath);
        }
    }
    
    console.log(`Found ${orphans.length} orphan pages:`);
    orphans.forEach(o => console.log(`- ${o}`));
} 
else if (command === 'backlinks') {
    const target = args[1];
    if (!target) {
        console.error('Usage: tsx okf-graph.ts backlinks <filepath>');
        process.exit(1);
    }
    
    const targetAbs = path.resolve(rootDir, target);
    console.log(`Backlinks for ${target}:`);
    
    for (const file of allFiles) {
        const content = fs.readFileSync(file, 'utf8');
        const links = extractLinks(content);
        for (const link of links) {
            const resolved = path.resolve(path.dirname(file), link);
            if (resolved === targetAbs) {
                console.log(`- ${path.relative(rootDir, file)}`);
                break;
            }
        }
    }
}
else {
    console.error('Usage: tsx okf-graph.ts <orphans|backlinks>');
}
