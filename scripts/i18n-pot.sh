#!/bin/bash

# OpenFields POT File Generator
# Generates a complete .pot file with both PHP and JS strings.
#
# Usage:
#   bash scripts/i18n-pot.sh          # Generate POT from plugin/
#   pnpm i18n:pot                     # Same, via npm script
#
# Requires:
#   - WP-CLI (wp i18n make-pot)
#   - PHP with at least 1G available memory (for parsing large JS bundles)
#
# The generated POT lives at: plugin/languages/codeideal-open-fields.pot

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_DIR="$ROOT_DIR/plugin"
POT_FILE="$PLUGIN_DIR/languages/codeideal-open-fields.pot"
DOMAIN="codeideal-open-fields"

# Verify WP-CLI is available
WP_BIN="$(which wp 2>/dev/null || true)"
if [ -z "$WP_BIN" ]; then
  echo -e "${RED}✗ WP-CLI not found. Install: brew install wp-cli${NC}"
  exit 1
fi

echo -e "${YELLOW}→ Generating POT file...${NC}"

# Use 1G memory to handle the 600KB+ admin.js IIFE bundle.
# --skip-audit silences the slug/headers audit (not relevant for dev builds).
php -d memory_limit=1G "$WP_BIN" i18n make-pot \
  "$PLUGIN_DIR" \
  "$POT_FILE" \
  --domain="$DOMAIN" \
  --skip-audit

# Count strings
TOTAL=$(grep -c '^msgid ' "$POT_FILE" 2>/dev/null || echo 0)

echo -e "${GREEN}✓ POT generated: $TOTAL translatable strings${NC}"
echo "  → $POT_FILE"
