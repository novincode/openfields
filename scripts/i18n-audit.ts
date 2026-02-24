/**
 * i18n Audit Script for OpenFields
 *
 * Scans TSX/TS/JS source files and detects hardcoded user-facing strings
 * that are NOT wrapped with __() / _n() / _x() / sprintf().
 *
 * Usage:
 *   pnpm i18n:audit              # audit all source files
 *   pnpm i18n:audit --strict     # exit 1 if any issues found (CI mode)
 *
 * What it detects:
 *   - JSX text content between tags: >Some text</
 *   - String props: label="Hello"  placeholder="Enter..."  title="..."
 *   - Template literal props: label={`Hello`}
 *   - toast() / alert() / confirm() with hardcoded strings
 *   - Error/description strings in thrown Errors
 *
 * What it ignores (by design):
 *   - Strings already wrapped in __(), _n(), _x(), sprintf()
 *   - CSS class strings, data attributes, key props, type props
 *   - Import/export paths
 *   - console.log/warn/error strings
 *   - Single-word className-like strings (all lowercase/dashes)
 *   - Component library primitives (ui/ directory) — they don't render user text
 *   - Strings ≤ 1 character (icons, separators)
 *   - Code-only strings (URLs, mime types, identifiers)
 */

import fs from 'fs';
import path from 'path';
import pc from 'picocolors';

const ROOT = path.resolve(import.meta.dirname ?? '.', '..');
const STRICT = process.argv.includes('--strict');

// ─── Configuration ───────────────────────────────────────────────────────────

/** Directories to scan (relative to project root) */
const SCAN_DIRS = ['admin/src'];

/** File extensions to scan */
const SCAN_EXTENSIONS = ['.tsx', '.ts', '.jsx', '.js'];

/** Directories/files to skip */
const SKIP_PATTERNS = [
  'components/ui/', // UI primitives don't have user-facing strings
  'types/',         // Type definitions
  'lib/utils.ts',   // Utility helpers — no UI text
  'stores/',        // Zustand stores — no UI text
  'main.tsx',       // Entry point — no UI text
  'api/',           // API layer — no UI text (type annotations only)
];

/** Strings that are always safe to ignore */
const IGNORE_STRINGS = new Set([
  // Field type identifiers
  'text', 'textarea', 'number', 'select', 'switch', 'repeater',
  'post_object', 'taxonomy', 'user', 'link', 'image', 'file',
  // Layout values
  'vertical', 'horizontal', 'table', 'block', 'row',
  // Data format values
  'value', 'label', 'array', 'object', 'id',
  // HTML/JSX
  'div', 'span', 'button', 'input', 'form', 'p', 'h1', 'h2', 'h3', 'h4',
  // Common non-translatable
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH',
  'json', 'JSON', 'ASC', 'DESC',
  'true', 'false', 'null', 'undefined',
]);

// ─── Detection Rules ────────────────────────────────────────────────────────

interface Finding {
  file: string;
  line: number;
  text: string;
  rule: string;
}

/**
 * Check if a string is already wrapped in an i18n function.
 * Looks at the surrounding context (the full line).
 */
function isWrapped(line: string, str: string): boolean {
  // Build a pattern: __('str' or __("str" or _x('str' or sprintf(... 'str'
  const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const i18nPattern = new RegExp(
    `(?:__|_n|_x|_nx|sprintf)\\s*\\(.*?['"\`]${escaped}['"\`]`
  );
  return i18nPattern.test(line);
}

/**
 * Check if a string looks code-like (not translatable)
 */
function isCodeString(str: string): boolean {
  const trimmed = str.trim();
  if (trimmed.length <= 1) return true;
  if (IGNORE_STRINGS.has(trimmed)) return true;
  if (IGNORE_STRINGS.has(trimmed.toLowerCase())) return true;

  // URLs, paths, mime types
  if (/^(https?:\/\/|\/|\.\/|\.\.\/)/.test(trimmed)) return true;
  if (/^[a-z]+\/[a-z]/.test(trimmed)) return true; // mime types

  // CSS class-like: all lowercase, dashes, spaces
  if (/^[a-z0-9 _-]+$/.test(trimmed) && !trimmed.includes(' ')) return true;

  // camelCase or snake_case identifiers
  if (/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed) && trimmed.length < 20) return true;

  // Hex colors
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed)) return true;

  // Version strings
  if (/^\d+\.\d+/.test(trimmed)) return true;

  // SCREAMING_SNAKE_CASE constants
  if (/^[A-Z][A-Z0-9_]+$/.test(trimmed)) return true;

  return false;
}

/**
 * Rules: each returns findings for a single line
 */
const rules: Array<{
  name: string;
  pattern: RegExp;
  extract: (match: RegExpMatchArray) => string | null;
}> = [
  {
    // >Some visible text</tag>
    name: 'jsx-text',
    pattern: />([^<>{}`]+)</g,
    extract: (m) => {
      const text = m[1].trim();
      // Must contain at least one letter and be more than whitespace
      if (text.length < 2 || !/[a-zA-Z]/.test(text)) return null;
      // Skip if it looks like a template expression residual
      if (text.startsWith('{') || text.endsWith('}')) return null;
      return text;
    },
  },
  {
    // label="Visible text" / placeholder="..." / title="..." / description="..."
    // Also aria-label
    name: 'string-prop',
    pattern:
      /(?:label|placeholder|title|description|aria-label|alt|header)=["']([^"']+)["']/g,
    extract: (m) => {
      const text = m[1].trim();
      if (text.length < 2 || !/[a-zA-Z]/.test(text)) return null;
      return text;
    },
  },
  {
    // toast("Some message") / toast.error("...") / toast.success("...")
    name: 'toast-call',
    pattern: /toast(?:\.\w+)?\(\s*["'`]([^"'`]+)["'`]/g,
    extract: (m) => m[1].trim(),
  },
  {
    // alert("...") / confirm("...")
    name: 'alert-confirm',
    pattern: /(?:alert|confirm)\(\s*["'`]([^"'`]+)["'`]/g,
    extract: (m) => m[1].trim(),
  },
  {
    // throw new Error("User-visible message")
    name: 'thrown-error',
    pattern: /throw\s+new\s+Error\(\s*["'`]([^"'`]+)["'`]/g,
    extract: (m) => m[1].trim(),
  },
];

// ─── Scanner ─────────────────────────────────────────────────────────────────

function scanFile(filePath: string): Finding[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relPath = path.relative(ROOT, filePath);
  const findings: Finding[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Skip comment lines
    if (/^\s*(\/\/|\/\*|\*)/.test(line)) continue;
    // Skip import/export lines
    if (/^\s*(import|export)\s/.test(line)) continue;
    // Skip console.* lines
    if (/console\.(log|warn|error|info|debug)/.test(line)) continue;
    // Skip lines that are only className or style
    if (/^\s*className=/.test(line)) continue;

    for (const rule of rules) {
      // Reset lastIndex for global regex
      rule.pattern.lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = rule.pattern.exec(line)) !== null) {
        const text = rule.extract(match);
        if (!text) continue;
        if (isCodeString(text)) continue;
        if (isWrapped(line, text)) continue;

        // Check adjacent lines for multiline wrapping
        const context = [
          lines[i - 1] || '',
          line,
          lines[i + 1] || '',
        ].join('\n');
        if (isWrapped(context, text)) continue;

        findings.push({
          file: relPath,
          line: lineNum,
          text,
          rule: rule.name,
        });
      }
    }
  }

  return findings;
}

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = path.relative(ROOT, full);

    if (entry.isDirectory()) {
      if (SKIP_PATTERNS.some((p) => rel.includes(p))) continue;
      results.push(...collectFiles(full));
    } else if (SCAN_EXTENSIONS.includes(path.extname(entry.name))) {
      if (SKIP_PATTERNS.some((p) => rel.includes(p))) continue;
      results.push(full);
    }
  }

  return results;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  console.log(pc.bold('i18n Audit — Scanning for unwrapped strings...\n'));

  let allFindings: Finding[] = [];

  for (const scanDir of SCAN_DIRS) {
    const absDir = path.resolve(ROOT, scanDir);
    if (!fs.existsSync(absDir)) {
      console.log(pc.yellow(`⚠ Directory not found: ${scanDir}`));
      continue;
    }

    const files = collectFiles(absDir);
    for (const file of files) {
      const findings = scanFile(file);
      allFindings.push(...findings);
    }
  }

  // Deduplicate (same file+line+text)
  const seen = new Set<string>();
  allFindings = allFindings.filter((f) => {
    const key = `${f.file}:${f.line}:${f.text}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (allFindings.length === 0) {
    console.log(pc.green('✓ No unwrapped strings found. All clear!\n'));
    return;
  }

  // Group by file
  const byFile = new Map<string, Finding[]>();
  for (const f of allFindings) {
    const list = byFile.get(f.file) ?? [];
    list.push(f);
    byFile.set(f.file, list);
  }

  console.log(
    pc.yellow(
      `Found ${allFindings.length} potentially unwrapped string(s) in ${byFile.size} file(s):\n`
    )
  );

  for (const [file, findings] of byFile) {
    console.log(pc.bold(pc.underline(file)));
    for (const f of findings) {
      console.log(
        `  ${pc.dim(`L${String(f.line).padStart(4)}`)} ${pc.cyan(`[${f.rule}]`)} ${pc.white(`"${f.text}"`)}`
      );
    }
    console.log('');
  }

  console.log(
    pc.dim(
      'To fix: wrap strings with __(\'...\', \'codeideal-open-fields\') from @wordpress/i18n\n'
    )
  );

  if (STRICT) {
    console.log(pc.red(`✗ ${allFindings.length} unwrapped string(s) found — failing audit.`));
    process.exit(1);
  }
}

main();
