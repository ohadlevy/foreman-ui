#!/usr/bin/env node

/**
 * Extract translation keys from plugin and generate .po template
 * This bridges modern plugin development with Foreman's gettext workflow
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Import plugin to extract translation keys
async function extractTranslations() {
  try {
    // Read the translation keys file
    const keysPath = path.join(__dirname, '../src/i18n/keys.ts');
    const keysContent = fs.readFileSync(keysPath, 'utf8');

    // Extract the keys object (simple regex for now, could use AST parsing)
    const keysMatch = keysContent.match(/export const translationKeys = \{([\s\S]*?)\};/);
    if (!keysMatch) {
      throw new Error('Could not find translationKeys export');
    }

    // Parse the keys (this is a simplified approach)
    const keysText = keysMatch[1];
    const keyLines = keysText.split('\n').filter(line => line.includes(':'));

    const translations = {};
    keyLines.forEach(line => {
      const match = line.match(/['"`]([^'"`]+)['"`]\s*:\s*['"`]([^'"`]+)['"`]/);
      if (match) {
        const [, key, value] = match;
        translations[key] = value;
      }
    });

    // Generate POT template
    const potContent = generatePOTTemplate(translations);

    // Ensure locale directory exists
    const localeDir = path.join(__dirname, '../locale');
    if (!fs.existsSync(localeDir)) {
      fs.mkdirSync(localeDir, { recursive: true });
    }

    // Write POT template
    const potPath = path.join(localeDir, 'foreman_example.pot');
    fs.writeFileSync(potPath, potContent);

    console.log(`Generated translation template: ${potPath}`);
    console.log(`Found ${Object.keys(translations).length} translation keys`);

    // Also generate a JSON file for development
    const jsonPath = path.join(localeDir, 'en.json');
    fs.writeFileSync(jsonPath, JSON.stringify(translations, null, 2));
    console.log(`Generated development JSON: ${jsonPath}`);

  } catch (error) {
    console.error('Failed to extract translations:', error);
    process.exit(1);
  }
}

function generatePOTTemplate(translations) {
  const header = `# FOREMAN EXAMPLE PLUGIN
# Copyright (C) 2024 The Foreman Project
# This file is distributed under the same license as the foreman_example package.
#
#, fuzzy
msgid ""
msgstr ""
"Project-Id-Version: foreman_example 1.0.0\\n"
"Report-Msgid-Bugs-To: \\n"
"POT-Creation-Date: ${new Date().toISOString()}\\n"
"PO-Revision-Date: YEAR-MO-DA HO:MI+ZONE\\n"
"Last-Translator: FULL NAME <EMAIL@ADDRESS>\\n"
"Language-Team: LANGUAGE <LL@li.org>\\n"
"MIME-Version: 1.0\\n"
"Content-Type: text/plain; charset=UTF-8\\n"
"Content-Transfer-Encoding: 8bit\\n"
"Language: \\n"

`;

  let potContent = header;

  Object.entries(translations).forEach(([key, value]) => {
    potContent += `#: src/i18n/keys.ts:${key}\n`;
    potContent += `msgid "${key}"\n`;
    potContent += `msgstr "${value}"\n\n`;
  });

  return potContent;
}

// Run the extraction
extractTranslations();