#!/usr/bin/env tsx
/**
 * Codeideal Open Fields — Release CLI
 *
 * Interactive release tool that handles:
 *   • Building the plugin (Vite + TypeScript)
 *   • Creating a distributable ZIP
 *   • Deploying to WordPress.org SVN (trunk + tagged version)
 *   • Creating a GitHub release (git tag + push)
 *
 * Usage:
 *   pnpm release          — interactive mode (choose targets)
 *   pnpm release --svn    — deploy to WordPress.org only
 *   pnpm release --github — create GitHub release only
 *   pnpm release --all    — deploy everywhere
 *   pnpm release --dry    — dry-run (build + show what would happen)
 */

import { execSync, type ExecSyncOptions } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, cpSync, rmSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import prompts from 'prompts';
import pc from 'picocolors';

// ─── Constants ───────────────────────────────────────────────────────────────

const ROOT      = resolve(import.meta.dirname, '..');
const PLUGIN    = join(ROOT, 'plugin');
const DIST      = join(ROOT, 'dist');
const SVN_REPO  = join(ROOT, '.svn-repo');
const ENV_FILE  = join(ROOT, '.env');
const PKG_FILE  = join(ROOT, 'package.json');
const PLUGIN_FILE = join(PLUGIN, 'codeideal-open-fields.php');
const SLUG      = 'codeideal-open-fields';
const SVN_URL   = 'https://plugins.svn.wordpress.org/codeideal-open-fields/';
const SVN_USER  = 'shayancode';

// Files/folders to EXCLUDE from the WordPress.org SVN deployment
const SVN_EXCLUDES = [
  '.git', '.gitignore', '.github', '.DS_Store',
  'node_modules', '.env', '.env.local',
  '*.map', 'README.md', '.vscode', '.idea',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pkg = () => JSON.parse(readFileSync(PKG_FILE, 'utf-8'));

function banner() {
  console.log('');
  console.log(pc.cyan('  ╔══════════════════════════════════════════╗'));
  console.log(pc.cyan('  ║') + pc.bold('   Codeideal Open Fields — Release CLI  ') + pc.cyan('  ║'));
  console.log(pc.cyan('  ╚══════════════════════════════════════════╝'));
  console.log('');
}

function step(msg: string) {
  console.log(pc.yellow(`\n  ▸ ${msg}`));
}

function success(msg: string) {
  console.log(pc.green(`  ✓ ${msg}`));
}

function info(msg: string) {
  console.log(pc.dim(`    ${msg}`));
}

function fail(msg: string): never {
  console.error(pc.red(`\n  ✗ ${msg}\n`));
  process.exit(1);
}

const exec = (cmd: string, opts?: ExecSyncOptions) =>
  execSync(cmd, { stdio: 'inherit', cwd: ROOT, ...opts });

const execQuiet = (cmd: string, opts?: ExecSyncOptions) =>
  String(execSync(cmd, { encoding: 'utf-8', cwd: ROOT, ...opts })).trim();

function getSvnPassword(): string {
  if (existsSync(ENV_FILE)) {
    const content = readFileSync(ENV_FILE, 'utf-8');
    const match = content.match(/SVN_PASSWORD=(.+)/);
    if (match) return match[1].trim();
  }
  if (process.env.SVN_PASSWORD) return process.env.SVN_PASSWORD;
  fail('SVN_PASSWORD not found. Set it in .env or as an environment variable.');
}

function getGitHash(): string {
  try { return execQuiet('git rev-parse --short HEAD'); }
  catch { return 'dev'; }
}

// ─── Build ───────────────────────────────────────────────────────────────────

function buildPlugin(version: string) {
  step(`Building plugin v${version}...`);

  // 1. Update version in PHP file
  info('Syncing version numbers...');
  let php = readFileSync(PLUGIN_FILE, 'utf-8');
  php = php.replace(/\* Version: .+/, `* Version: ${version}`);
  php = php.replace(/define\( 'COFLD_VERSION', .+/, `define( 'COFLD_VERSION', '${version}' );`);
  writeFileSync(PLUGIN_FILE, php);

  // 2. Build admin React app via Vite
  info('Building admin React app (Vite + TypeScript)...');
  exec('pnpm build');

  success('Build complete');
}

function createDistZip(version: string) {
  step(`Creating distributable ZIP...`);

  // Clean dist
  if (existsSync(DIST)) rmSync(DIST, { recursive: true });
  mkdirSync(join(DIST, SLUG), { recursive: true });

  // Copy plugin files
  cpSync(PLUGIN, join(DIST, SLUG), {
    recursive: true,
    filter: (src) => {
      const name = src.split('/').pop() || '';
      return !SVN_EXCLUDES.some(ex =>
        ex.startsWith('*') ? name.endsWith(ex.slice(1)) : name === ex
      );
    },
  });

  // Zip
  exec(`cd "${DIST}" && zip -r "${SLUG}-${version}.zip" "${SLUG}/" > /dev/null`);

  success(`ZIP created: dist/${SLUG}-${version}.zip`);
}

// ─── WordPress.org SVN ───────────────────────────────────────────────────────

function deploySvn(version: string, dry: boolean) {
  step(`Deploying v${version} to WordPress.org SVN...`);

  const password = getSvnPassword();
  const svnAuth  = `--username "${SVN_USER}" --password "${password}" --non-interactive`;
  const trunk    = join(SVN_REPO, 'trunk');
  const tagDir   = join(SVN_REPO, 'tags', version);

  // 1. Ensure SVN working copy exists
  if (!existsSync(join(SVN_REPO, '.svn'))) {
    info('Checking out SVN repository (first time)...');
    exec(`svn co "${SVN_URL}" "${SVN_REPO}" ${svnAuth}`);
  } else {
    info('Updating SVN working copy...');
    exec(`svn up "${SVN_REPO}" ${svnAuth}`, { stdio: 'pipe' });
  }

  // 2. Sync plugin files → trunk (delete old, copy new)
  info('Syncing files to trunk...');
  // Remove old trunk contents but keep the directory
  const trunkContents = existsSync(trunk) ? readdirSync(trunk) : [];
  for (const item of trunkContents) {
    if (item === '.svn') continue;
    rmSync(join(trunk, item), { recursive: true });
  }
  // Copy fresh plugin files
  cpSync(PLUGIN, trunk, {
    recursive: true,
    filter: (src) => {
      const name = src.split('/').pop() || '';
      return !SVN_EXCLUDES.some(ex =>
        ex.startsWith('*') ? name.endsWith(ex.slice(1)) : name === ex
      );
    },
  });

  // 3. SVN add new / remove deleted files
  const svnStatus = execQuiet(`svn status "${SVN_REPO}"`);
  for (const line of svnStatus.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const status = trimmed[0];
    const file = trimmed.slice(1).trim();
    if (status === '?') {
      execQuiet(`svn add "${file}"`);
    } else if (status === '!') {
      execQuiet(`svn rm "${file}"`);
    }
  }

  // 4. Create tag from trunk (svn cp)
  if (existsSync(tagDir)) {
    info(`Tag ${version} already exists in SVN, will update it.`);
    rmSync(tagDir, { recursive: true });
    execQuiet(`svn rm "${tagDir}" --force`, { cwd: SVN_REPO });
  }
  info(`Creating tag ${version} from trunk...`);
  execQuiet(`svn cp "${trunk}" "${tagDir}"`);

  // 5. Commit (or dry-run)
  if (dry) {
    info(pc.yellow('DRY RUN — skipping svn commit'));
    info('Would commit trunk + tags/' + version);
    // Show what changed
    exec(`svn status "${SVN_REPO}" | head -30`);
    return;
  }

  info('Committing to WordPress.org SVN...');
  exec(`svn ci "${SVN_REPO}" -m "Release v${version}" ${svnAuth}`);

  success(`Deployed v${version} to WordPress.org!`);
  console.log(pc.dim(`    https://wordpress.org/plugins/${SLUG}/`));
}

// ─── GitHub Release ──────────────────────────────────────────────────────────

function deployGithub(version: string, dry: boolean) {
  step(`Creating GitHub release v${version}...`);

  const tag = `v${version}`;

  // Check if tag already exists
  const existingTags = execQuiet('git tag -l').split('\n');
  if (existingTags.includes(tag)) {
    info(`Tag ${tag} already exists locally, skipping tag creation.`);
  } else {
    info(`Creating git tag ${tag}...`);
    if (!dry) {
      exec(`git tag -a "${tag}" -m "Release ${tag}"`);
    }
  }

  if (dry) {
    info(pc.yellow(`DRY RUN — would push tag ${tag} and trigger GitHub Actions release`));
    return;
  }

  info(`Pushing tag ${tag} to origin...`);
  exec(`git push origin "${tag}"`);

  success(`GitHub release triggered!`);
  info(`GitHub Actions will build & create the release automatically.`);
  info(`Check: https://github.com/novincode/openfields/actions`);
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

type Target = 'svn' | 'github';

async function main() {
  banner();

  const version = pkg().version;
  const gitHash = getGitHash();
  const args    = process.argv.slice(2);

  // Parse flags
  const flagAll    = args.includes('--all');
  const flagSvn    = args.includes('--svn');
  const flagGithub = args.includes('--github');
  const flagDry    = args.includes('--dry');

  console.log(`  ${pc.dim('Version:')}  ${pc.bold(version)}`);
  console.log(`  ${pc.dim('Commit:')}   ${pc.bold(gitHash)}`);
  console.log(`  ${pc.dim('Plugin:')}   ${pc.dim(PLUGIN)}`);
  if (flagDry) console.log(`  ${pc.yellow('⚡ DRY RUN MODE')}`);
  console.log('');

  let targets: Target[] = [];

  if (flagAll) {
    targets = ['github', 'svn'];
  } else if (flagSvn || flagGithub) {
    if (flagGithub) targets.push('github');
    if (flagSvn) targets.push('svn');
  } else {
    // Interactive mode
    const response = await prompts({
      type: 'multiselect',
      name: 'targets',
      message: 'Where do you want to release?',
      choices: [
        { title: `${pc.magenta('WordPress.org')} ${pc.dim('(SVN → trunk + tag)')}`, value: 'svn' },
        { title: `${pc.blue('GitHub')} ${pc.dim('(git tag → Actions → Release)')}`, value: 'github' },
      ],
      instructions: false,
      hint: '— Space to select, Enter to confirm',
    });

    if (!response.targets || response.targets.length === 0) {
      console.log(pc.dim('\n  No targets selected. Bye!\n'));
      return;
    }
    targets = response.targets;
  }

  // Confirm
  const targetLabel = targets.map(t =>
    t === 'svn' ? pc.magenta('WordPress.org') : pc.blue('GitHub')
  ).join(' + ');

  const { confirmed } = await prompts({
    type: 'confirm',
    name: 'confirmed',
    message: `Release ${pc.bold(`v${version}`)} to ${targetLabel}?`,
    initial: true,
  });

  if (!confirmed) {
    console.log(pc.dim('\n  Cancelled.\n'));
    return;
  }

  // ── Execute ──

  // Always build first
  buildPlugin(version);
  createDistZip(version);

  if (targets.includes('github')) {
    deployGithub(version, flagDry);
  }

  if (targets.includes('svn')) {
    deploySvn(version, flagDry);
  }

  // ── Done ──
  console.log('');
  console.log(pc.green('  ╔══════════════════════════════════════════╗'));
  console.log(pc.green('  ║') + pc.bold(pc.green(`    Release v${version} complete! 🎉`)) + '          ' + pc.green('║'));
  console.log(pc.green('  ╚══════════════════════════════════════════╝'));
  console.log('');

  if (targets.includes('svn') && !flagDry) {
    console.log(`  ${pc.magenta('WordPress.org:')} https://wordpress.org/plugins/${SLUG}/`);
    info('Note: It may take up to 15 minutes for the update to appear.');
  }
  if (targets.includes('github') && !flagDry) {
    console.log(`  ${pc.blue('GitHub:')} https://github.com/novincode/openfields/releases`);
    info('GitHub Actions will create the release in ~2 minutes.');
  }
  console.log('');
}

main().catch((err) => {
  console.error(pc.red(`\n  Fatal error: ${err.message}\n`));
  process.exit(1);
});
