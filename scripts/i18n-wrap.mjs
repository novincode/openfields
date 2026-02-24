/**
 * Script to wrap hardcoded English strings in React components with __() from @wordpress/i18n.
 * This handles all files in admin/src/ that need i18n wrapping.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Text domain
const TD = 'codeideal-open-fields';

// Files to process with their string mappings
const FILES = {
  // Field settings files
  'admin/src/fields/TextareaFieldSettings.tsx': {
    labels: ['Placeholder', 'Rows', 'Default Value'],
    placeholders: ['Enter placeholder text', 'Default text'],
  },
  'admin/src/fields/NumberFieldSettings.tsx': {
    labels: ['Min', 'Max', 'Step', 'Placeholder', 'Default Value'],
    placeholders: ['Enter placeholder text'],
  },
  'admin/src/fields/SelectFieldSettings.tsx': {
    labels: [
      'Field Type Settings', 'Allow Multiple Selections', 'Allow Empty Value',
      'Show Toggle All', 'Layout', 'Vertical', 'Horizontal',
      'Choices', 'No choices added yet', 'Add Choice',
      'Return Format', 'Value', 'Label', 'Both (Array)',
    ],
  },
  'admin/src/fields/SwitchFieldSettings.tsx': {
    labels: ['On Text', 'Off Text', 'Default Value', 'Yes', 'No', 'On', 'Off'],
  },
  'admin/src/fields/RepeaterFieldSettings.tsx': {
    labels: [
      'Minimum Rows', 'Maximum Rows', 'Layout', 'Table', 'Block', 'Row',
      'Button Label', 'Add Row', 'Sub-fields:',
    ],
  },
  'admin/src/fields/PostObjectFieldSettings.tsx': {
    labels: [
      'Post Type', 'Select Multiple', 'Return Format',
      'Post Object', 'Post ID', 'Allow Null',
    ],
  },
  'admin/src/fields/TaxonomyFieldSettings.tsx': {
    labels: [
      'Taxonomy', 'Appearance', 'Dropdown', 'Checkbox', 'Radio Buttons',
      'Select Multiple', 'Return Format', 'Term ID', 'Term Object',
      'Save Terms', 'Load Terms',
    ],
  },
  'admin/src/fields/UserFieldSettings.tsx': {
    labels: [
      'Filter by Role', 'All Roles', 'Select Multiple', 'Return Format',
      'User Array', 'User Object', 'User ID', 'Allow Null',
    ],
  },
  'admin/src/fields/LinkFieldSettings.tsx': {
    labels: [
      'Show Link Text', 'Allow entering custom link text',
      'Show Target Option',
    ],
  },
  // App.tsx
  'admin/src/App.tsx': {
    labels: [
      'Field Groups', 'Settings', 'Import / Export',
      'OpenFields', 'Open Source Custom Fields Management',
      'Support this project', 'Support',
      'This plugin is free and will be free, your support will keep it going.',
    ],
  },
  // Settings.tsx
  'admin/src/pages/Settings.tsx': {
    labels: [
      'Data Management', 'Control how OpenFields handles your data',
      'Keep Plugin Data After Uninstall',
      'Save Settings', 'Saving...', 'Failed to load settings',
    ],
  },
  // Tools.tsx
  'admin/src/pages/Tools.tsx': {
    labels: [
      'Export', 'Import',
      'Export all field groups as a JSON file',
      'Import field groups from a JSON file',
      'Exporting...', 'Export Field Groups',
      'Importing...', 'Choose File',
    ],
  },
};

function addImportIfNeeded(content) {
  const importLine = "import { __ } from '@wordpress/i18n';";
  if (content.includes(importLine)) return content;

  // Find the first import statement and add before it
  const firstImport = content.indexOf('import ');
  if (firstImport === -1) return importLine + '\n' + content;

  // Find the start of the line with the first import
  const lineStart = content.lastIndexOf('\n', firstImport) + 1;
  return content.slice(0, lineStart) + importLine + '\n' + content.slice(lineStart);
}

function wrapStringsInFile(filePath, config) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Add import
  content = addImportIfNeeded(content);

  // Process labels - these appear as JSX text children like >Label<
  // or as string attributes
  const allStrings = [
    ...(config.labels || []),
    ...(config.placeholders || []),
  ];

  for (const str of allStrings) {
    // Skip short single-word strings that might have conflicts
    const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Pattern 1: JSX text like >String</ or >String\n (direct child text)
    // Match: >Text</  but not >{__('Text'  (already wrapped)
    const jsxTextRegex = new RegExp(`>\\s*${escaped}\\s*</`, 'g');
    content = content.replace(jsxTextRegex, (match) => {
      // Don't double-wrap
      if (match.includes('__(' )) return match;
      return `>{__('${str.replace(/'/g, "\\'")}', '${TD}')}<\/`;
    });

    // Pattern 2: placeholder="String" or title="String"
    const attrRegex = new RegExp(`(placeholder|title)="${escaped}"`, 'g');
    content = content.replace(attrRegex, (match, attr) => {
      if (match.includes('__(' )) return match;
      return `${attr}={__('${str.replace(/'/g, "\\'")}', '${TD}')}`;
    });
  }

  // Also handle description strings in <p> and <CardDescription> elements
  if (config.labels) {
    for (const str of config.labels) {
      if (str.length > 20) {
        // Longer strings are likely descriptions, handle them in JSX
        const escaped = str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Pattern: standalone text between tags that spans content
        const regex = new RegExp(`>\\n\\s*${escaped}\\n`, 'g');
        content = content.replace(regex, (match) => {
          if (match.includes('__(' )) return match;
          return match.replace(str, `{__('${str.replace(/'/g, "\\'")}', '${TD}')}`);
        });
      }
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ ${filePath}`);
}

// Process all files
for (const [relPath, config] of Object.entries(FILES)) {
  const fullPath = path.join(ROOT, relPath);
  if (fs.existsSync(fullPath)) {
    try {
      wrapStringsInFile(fullPath, config);
    } catch (e) {
      console.error(`✗ ${relPath}: ${e.message}`);
    }
  } else {
    console.error(`✗ ${relPath}: file not found`);
  }
}

console.log('\nDone! Review changes with git diff.');
