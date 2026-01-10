#!/usr/bin/env node

import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rawArgs = process.argv.slice(2);

// grab --type=... or --type ...
let typeFromFlag;
for (let i = 0; i < rawArgs.length; i++) {
    if (rawArgs[i].startsWith('--type=')) {
        typeFromFlag = rawArgs[i].split('=')[1];
        break;
    }
    if (rawArgs[i] === '--type' && rawArgs[i + 1]) {
        typeFromFlag = rawArgs[i + 1];
        break;
    }
}

const positional = rawArgs.filter(a => !a.startsWith('-'));
const projectNameArg = positional[0];
const positionalType = positional[1];

if (!projectNameArg) {
    console.error('Usage: keen-project-create <project-name>');
    process.exit(1);
}

const projectType = (typeFromFlag || positionalType || '').toLowerCase();

// Resolve paths
const TEMPLATE_DEFAULT = path.resolve(__dirname, '../templates/default');
const TEMPLATE_VSCODE = path.resolve(__dirname, '../templates/vscode');

//const TEMPLATE_DIR = projectType === 'vscode' ? TEMPLATE_VSCODE : TEMPLATE_DEFAULT;
const TEMPLATE_DIR =  TEMPLATE_VSCODE;

const targetDir = path.resolve(process.cwd(), projectNameArg);

async function ensureDirEmptyOrCreate(dir) {
    try {
        await fsp.mkdir(dir, { recursive: true });
        const items = await fsp.readdir(dir);
        if (items.length > 0) {
            console.error(`Target directory is not empty: ${dir}`);
            process.exit(1);
        }
    } catch (e) {
        console.error('Failed creating target directory:', e);
        process.exit(1);
    }
}

async function copyDir(src, dest) {
    await fsp.mkdir(dest, { recursive: true });
    const entries = await fsp.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const s = path.join(src, entry.name);
        const d = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDir(s, d);
        } else {
            await fsp.copyFile(s, d);
        }
    }
}

async function replaceInFile(filePath, replacements) {
    const exists = fs.existsSync(filePath);
    if (!exists) return;
    let content = await fsp.readFile(filePath, 'utf-8');
    for (const [from, to] of Object.entries(replacements)) {
        content = content.replaceAll(from, to);
    }
    await fsp.writeFile(filePath, content);
}

// Choose package manager: npm by default
function detectPackageManager() {
    // You could enhance to check for pnpm/yarn existence.
    return 'npm';
}

function runInstall(cwd, pm = 'npm') {
    return new Promise((resolve, reject) => {
        const args = ['install'];
        const child = spawn(pm, args, { stdio: 'inherit', cwd, shell: process.platform === 'win32' });
        child.on('close', code => (code === 0 ? resolve() : reject(new Error(pm + ' install failed'))));
    });
}

(async () => {
    console.log(`> Creating project: ${projectNameArg}`);
    await ensureDirEmptyOrCreate(targetDir);

    console.log('> Copying template…');
    await copyDir(TEMPLATE_DIR, targetDir);

    // Optional: personalize package.json
    const pkgJsonPath = path.join(targetDir, 'package.json');
    await replaceInFile(pkgJsonPath, {
        __APP_NAME__: projectNameArg
    });

    // Apply props inside the "templates/vscode/launch.json" file 
    const launchFile = path.join(targetDir, '.vscode', 'launch.json');
    await replaceInFile(launchFile, {
        __PROJECT_NAME_REPLACE__ : projectNameArg
    });

    // Apply props inside the "templates/keen.json" file
    const keenJsonFile = path.join(targetDir, 'keen.json');
    await replaceInFile(keenJsonFile, {
        __PROJECT_NAME_REPLACE__ : projectNameArg
    });

    // Rename agent folder from template placeholder to actual project name
    const agentTemplateName = 'Agent-__PROJECT_NAME_REPLACE__';
    const agentActualName = `Agent-${projectNameArg}`;
    const agentTemplateDir = path.join(targetDir, 'src', 'agents', agentTemplateName);
    const agentActualDir = path.join(targetDir, 'src', 'agents', agentActualName);
    if (fs.existsSync(agentTemplateDir)) {
        await fsp.rename(agentTemplateDir, agentActualDir);
    }

    // Apply props inside agent settings.json
    const agentSettingsFile = path.join(agentActualDir, 'settings.json');
    await replaceInFile(agentSettingsFile, {
        __PROJECT_NAME_REPLACE__: projectNameArg
    });

    // Apply props inside flow instructions.json
    const flowInstructionsFile = path.join(targetDir, 'src', 'flows', 'Project', 'instructions.json');
    await replaceInFile(flowInstructionsFile, {
        __PROJECT_NAME_REPLACE__: projectNameArg
    });

    // Apply props inside Project.flow.json (human viewport visualization)
    const projectFlowFile = path.join(targetDir, 'src', 'flows', 'Project.flow.json');
    await replaceInFile(projectFlowFile, {
        __PROJECT_NAME_REPLACE__: projectNameArg
    });

    // Install deps
    const pm = detectPackageManager();
    console.log(`> Installing dependencies with ${pm}…`);
    await runInstall(targetDir, pm);

    console.log('\n✅ Done!');
    console.log(`\nNext steps:
  cd ${projectNameArg}
  ${pm} run dev
`);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
