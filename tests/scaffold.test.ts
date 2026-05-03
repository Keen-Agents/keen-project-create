import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const CLI = resolve(ROOT, 'dist/index.mjs');
const FAKE_BIN = resolve(HERE, 'fake-bin');
const PATH_SEP = process.platform === 'win32' ? ';' : ':';

vi.setConfig({ testTimeout: 15_000 });

describe('keen-project-create CLI', () => {
    let tmp: string;
    let logFile: string;

    beforeEach(() => {
        tmp = mkdtempSync(join(tmpdir(), 'kpc-'));
        logFile = join(tmp, 'fake-npm.log');
    });

    afterEach(() => {
        rmSync(tmp, { recursive: true, force: true });
    });

    it('scaffolds a project from a positional name', () => {
        const { projectDir } = scaffold(['test-project']);

        expect(existsSync(projectDir)).toBe(true);
        expect(existsSync(join(projectDir, 'keen.json'))).toBe(true);
        expect(existsSync(join(projectDir, 'package.json'))).toBe(true);
        expect(existsSync(join(projectDir, 'src', 'scripts', 'debux.js'))).toBe(true);
    });

    it('emits the current vscode template artifacts by default', () => {
        const { projectDir } = scaffold(['test-project']);

        expect(existsSync(join(projectDir, '.vscode', 'launch.json'))).toBe(true);
        expect(existsSync(join(projectDir, '.vscode', 'settings.json'))).toBe(true);
        expect(existsSync(join(projectDir, 'keen-tools.json'))).toBe(true);
    });

    it('scaffolds into an existing empty directory', () => {
        mkdirSync(join(tmp, 'existing-empty'));

        const result = runCli(['existing-empty']);

        expect(result.status).toBe(0);
        expect(existsSync(join(tmp, 'existing-empty', 'keen.json'))).toBe(true);
    });

    it('copies the documented top-level formatter files', () => {
        const { projectDir } = scaffold(['test-project']);

        expect(existsSync(join(projectDir, '.gitignore'))).toBe(true);
        expect(existsSync(join(projectDir, '.prettierignore'))).toBe(true);
        expect(existsSync(join(projectDir, '.prettierrc'))).toBe(true);
    });

    it('prints the next steps after a successful scaffold', () => {
        const result = scaffold(['next-steps']);

        expect(result.stdout).toContain('✅ Done!');
        expect(result.stdout).toContain('cd next-steps');
        expect(result.stdout).toContain('npm run dev');
    });

    it('--type default still emits the vscode template (Bug E regression assertion)', () => {
        const { projectDir } = scaffold(['test-project', '--type', 'default']);

        expect(existsSync(join(projectDir, '.vscode', 'launch.json'))).toBe(true);
        expect(existsSync(join(projectDir, 'src', 'agents', 'Agent-test-project'))).toBe(true);
    });

    it('--type=default still emits the vscode template (Bug E regression assertion)', () => {
        const { projectDir } = scaffold(['test-project', '--type=default']);

        expect(existsSync(join(projectDir, '.vscode', 'launch.json'))).toBe(true);
    });

    it('--type vscode emits the vscode template', () => {
        const { projectDir } = scaffold(['test-project', '--type', 'vscode']);

        expect(existsSync(join(projectDir, '.vscode', 'launch.json'))).toBe(true);
    });

    it('--type=vscode emits the vscode template', () => {
        const { projectDir } = scaffold(['test-project', '--type=vscode']);

        expect(existsSync(join(projectDir, '.vscode', 'launch.json'))).toBe(true);
    });

    it('accepts the positional second-argument type syntax for vscode', () => {
        const { projectDir } = scaffold(['test-project', 'vscode']);

        expect(existsSync(join(projectDir, '.vscode', 'launch.json'))).toBe(true);
    });

    it('accepts the positional second-argument type syntax for default', () => {
        const { projectDir } = scaffold(['test-project', 'default']);

        expect(existsSync(join(projectDir, '.vscode', 'launch.json'))).toBe(true);
    });

    it('falls back to the vscode template for unknown --type values', () => {
        const { projectDir } = scaffold(['test-project', '--type', 'banana']);

        expect(existsSync(join(projectDir, '.vscode', 'launch.json'))).toBe(true);
    });

    it('falls back to the vscode template for unknown positional type values', () => {
        const { projectDir } = scaffold(['test-project', 'banana']);

        expect(existsSync(join(projectDir, '.vscode', 'launch.json'))).toBe(true);
    });

    it('replaces __APP_NAME__ in package.json', () => {
        const { projectDir } = scaffold(['my-cool-app']);
        const packageJson = readFileSync(join(projectDir, 'package.json'), 'utf8');

        expect(packageJson).toContain('"name": "my-cool-app"');
        expect(packageJson).not.toContain('__APP_NAME__');
    });

    it('replaces __PROJECT_NAME_REPLACE__ in .vscode/launch.json', () => {
        const { projectDir } = scaffold(['my-cool-app']);
        const launchJson = readFileSync(join(projectDir, '.vscode', 'launch.json'), 'utf8');

        expect(launchJson).toContain('/app/projects/my-cool-app');
        expect(launchJson).not.toContain('__PROJECT_NAME_REPLACE__');
    });

    it('replaces __PROJECT_NAME_REPLACE__ in agent settings', () => {
        const { projectDir } = scaffold(['my-cool-app']);
        const settingsJson = readFileSync(join(projectDir, 'src', 'agents', 'Agent-my-cool-app', 'settings.json'), 'utf8');

        expect(settingsJson).toContain('"agentName": "Agent-my-cool-app"');
        expect(settingsJson).not.toContain('__PROJECT_NAME_REPLACE__');
    });

    it('emits registry-compatible keen.json agent defaults', () => {
        const { projectDir } = scaffold(['my-cool-app']);
        const keenJson = JSON.parse(readFileSync(join(projectDir, 'keen.json'), 'utf8')) as {
            $schema?: string;
            version?: number;
            project_name?: string;
            init_map_mode?: string;
            agents?: Array<{
                id?: string;
                name?: string;
                displayName?: string;
                entry_flow?: string;
            }>;
            entry?: string;
            dist?: string;
        };

        expect(keenJson).toMatchObject({
            $schema: '../../keen-flow-types/schemas/keen.json',
            version: 1,
            project_name: 'my-cool-app',
            init_map_mode: 'agents-required',
            agents: [
                {
                    id: 'agent-my-cool-app',
                    name: 'Agent-my-cool-app',
                    displayName: 'Agent-my-cool-app',
                    entry_flow: 'Agent-my-cool-app'
                }
            ],
            entry: 'src',
            dist: 'dist'
        });
        expect(keenJson).not.toHaveProperty('agent_name');
        expect(keenJson).not.toHaveProperty('start_agent');
    });

    it('slugifies the agent id in keen.json while preserving display names', () => {
        const { projectDir } = scaffold(['Has Spaces']);
        const keenJson = JSON.parse(readFileSync(join(projectDir, 'keen.json'), 'utf8')) as {
            project_name?: string;
            agents?: Array<{
                id?: string;
                name?: string;
                displayName?: string;
                entry_flow?: string;
            }>;
        };

        expect(keenJson.project_name).toBe('Has Spaces');
        expect(keenJson.agents?.[0]).toMatchObject({
            id: 'agent-has-spaces',
            name: 'Agent-Has Spaces',
            displayName: 'Agent-Has Spaces',
            entry_flow: 'Agent-Has Spaces'
        });
    });

    it('replaces __PROJECT_NAME_REPLACE__ in split-flow instructions', () => {
        const { projectDir } = scaffold(['my-cool-app']);
        const instructionsJson = readFileSync(join(projectDir, 'src', 'flows', 'Project', 'instructions.json'), 'utf8');

        expect(instructionsJson).toContain('"agentRef": "Agent-my-cool-app"');
        expect(instructionsJson).not.toContain('__PROJECT_NAME_REPLACE__');
    });

    it('replaces __PROJECT_NAME_REPLACE__ in Project.flow.json', () => {
        const { projectDir } = scaffold(['my-cool-app']);
        const projectFlowJson = readFileSync(join(projectDir, 'src', 'flows', 'Project.flow.json'), 'utf8');

        expect(projectFlowJson).toContain('"agentName": "Agent-my-cool-app"');
        expect(projectFlowJson).not.toContain('__PROJECT_NAME_REPLACE__');
    });

    it('renames the agent folder to the project name', () => {
        const { projectDir } = scaffold(['test-app']);

        expect(existsSync(join(projectDir, 'src', 'agents', 'Agent-test-app'))).toBe(true);
    });

    it('removes the placeholder agent folder', () => {
        const { projectDir } = scaffold(['test-app']);

        expect(existsSync(join(projectDir, 'src', 'agents', 'Agent-__PROJECT_NAME_REPLACE__'))).toBe(false);
    });

    it('leaves no placeholder tokens in emitted text files', () => {
        const { projectDir } = scaffold(['token-check']);
        const placeholderHits = listFilesRecursive(projectDir).flatMap(relativePath => {
            const content = readFileSync(join(projectDir, relativePath), 'utf8');
            const hits: string[] = [];

            if (content.includes('__PROJECT_NAME_REPLACE__')) {
                hits.push(`${relativePath}:__PROJECT_NAME_REPLACE__`);
            }
            if (content.includes('__APP_NAME__')) {
                hits.push(`${relativePath}:__APP_NAME__`);
            }
            if (content.includes('__PROJECT_NAME_REPLACE_LOWERCASE__')) {
                hits.push(`${relativePath}:__PROJECT_NAME_REPLACE_LOWERCASE__`);
            }

            return hits;
        });

        expect(placeholderHits).toEqual([]);
    });

    it('invokes the fake npm shim once per successful scaffold', () => {
        scaffold(['test-project']);

        expect(readFakeNpmEntries()).toHaveLength(1);
    });

    it('invokes npm install specifically', () => {
        scaffold(['test-project']);

        expect(readFakeNpmEntries()[0]?.args).toBe('install');
    });

    it('runs npm install inside the scaffolded project directory', () => {
        const { projectDir } = scaffold(['test-project']);

        expect(readFakeNpmEntries()[0]?.cwd).toBe(projectDir);
    });

    it('exits non-zero when the project name is missing', () => {
        const result = runCli([]);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Usage: keen-project-create <project-name>');
    });

    it('treats the --type value as the project name when no positional name is supplied', () => {
        const result = runCli(['--type', 'vscode']);

        expect(result.status).toBe(0);
        expect(existsSync(join(tmp, 'vscode', '.vscode', 'launch.json'))).toBe(true);
    });

    it('exits non-zero when only --type=value is supplied without a project name', () => {
        const result = runCli(['--type=vscode']);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Usage: keen-project-create <project-name>');
    });

    it('exits non-zero when the project name cannot produce a valid agent slug', () => {
        const result = runCli(['!@#$%']);

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Invalid project name');
        expect(existsSync(join(tmp, '!@#$%'))).toBe(false);
    });

    it('refuses to scaffold into a non-empty directory', () => {
        mkdirSync(join(tmp, 'parent', 'existing'), { recursive: true });
        writeFileSync(join(tmp, 'parent', 'existing', 'file.txt'), 'x');

        const result = runCli(['existing'], join(tmp, 'parent'));

        expect(result.status).toBe(1);
        expect(result.stderr).toContain('Target directory is not empty');
        expect(readFileSync(join(tmp, 'parent', 'existing', 'file.txt'), 'utf8')).toBe('x');
    });

    it('re-runs idempotently on an existing Keen project without overwriting Pascal-field settings', () => {
        const { projectDir } = scaffold(['support-project']);
        const settingsPath = join(projectDir, 'src', 'agents', 'Agent-support-project', 'settings.json');
        const fixture = {
            agentName: 'Support Bot',
            agentId: 'support-prod',
            sessionId: 'session-contract',
            requestId: 'request-contract',
            useParentDictionary: true,
            dictionaryKey: 'support.dictionary'
        };
        writeFileSync(settingsPath, JSON.stringify(fixture, null, 2));

        const result = runCli(['support-project']);

        expect(result.status, formatResult(result)).toBe(0);
        expect(JSON.parse(readFileSync(settingsPath, 'utf8'))).toEqual(fixture);
        expect(existsSync(join(projectDir, 'src', 'agents', 'Agent-__PROJECT_NAME_REPLACE__'))).toBe(false);
    });

    it('emits the documented file tree', () => {
        const { projectDir } = scaffold(['snap-test']);

        expect(listFilesRecursive(projectDir)).toMatchSnapshot();
    });

    function scaffold(args: string[]) {
        const result = runCli(args);

        expect(result.status, formatResult(result)).toBe(0);

        return {
            ...result,
            projectDir: resolve(tmp, args[0] ?? '')
        };
    }

    function runCli(args: string[], cwd = tmp) {
        return spawnSync(process.execPath, [CLI, ...args], {
            cwd,
            encoding: 'utf8',
            env: {
                ...process.env,
                KPC_FAKE_NPM_LOG: logFile,
                PATH: `${FAKE_BIN}${PATH_SEP}${process.env.PATH ?? ''}`
            }
        });
    }

    function readFakeNpmEntries() {
        if (!existsSync(logFile)) {
            return [];
        }

        return readFileSync(logFile, 'utf8')
            .split(/\r?\n/)
            .filter(Boolean)
            .map(line => {
                const [cwd, ...args] = line.split('|');

                return {
                    cwd,
                    args: args.join('|')
                };
            });
    }
});

function listFilesRecursive(dir: string, prefix = ''): string[] {
    return readdirSync(dir, { withFileTypes: true })
        .flatMap(entry => {
            const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
            const absolutePath = join(dir, entry.name);

            if (entry.isDirectory()) {
                return listFilesRecursive(absolutePath, relativePath);
            }

            const stats = statSync(absolutePath);
            expect(stats.size).toBeGreaterThan(0);

            return [relativePath];
        })
        .sort();
}

function formatResult(result: ReturnType<typeof spawnSync>) {
    return [`status=${String(result.status)}`, `stdout=${result.stdout ?? ''}`, `stderr=${result.stderr ?? ''}`].join('\n');
}
