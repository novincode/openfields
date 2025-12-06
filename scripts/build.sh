#!/bin/bash

# OpenFields Plugin Build Script
# Builds the plugin, manages versioning, and creates a distributable ZIP

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PLUGIN_DIR="$ROOT_DIR/plugin"
BUILD_DIR="$ROOT_DIR/dist"
ZIP_NAME="openfields"
PACKAGE_JSON="$ROOT_DIR/package.json"
PLUGIN_FILE="$PLUGIN_DIR/openfields.php"

# Get version from package.json
get_version() {
    grep '"version"' "$PACKAGE_JSON" | head -1 | sed 's/.*"version": "\([^"]*\)".*/\1/'
}

# Update plugin version in openfields.php
update_plugin_version() {
    local version=$1
    echo -e "${YELLOW}→ Updating plugin version to $version${NC}"
    
    # macOS compatible sed (using .bak for backup, then deleting it)
    sed -i.bak "s/\* Version: .*/\* Version: $version/" "$PLUGIN_FILE"
    sed -i.bak "s/define( 'OPENFIELDS_VERSION', .*/define( 'OPENFIELDS_VERSION', '$version' );/" "$PLUGIN_FILE"
    rm -f "${PLUGIN_FILE}.bak"
}

# Get latest git commit hash (short)
get_git_hash() {
    git -C "$ROOT_DIR" rev-parse --short HEAD 2>/dev/null || echo "dev"
}

# Build admin React app
build_admin_app() {
    echo -e "${YELLOW}→ Building admin React app...${NC}"
    
    cd "$ROOT_DIR"
    
    if command -v pnpm &> /dev/null; then
        pnpm build
    elif command -v npm &> /dev/null; then
        npm run build
    else
        echo -e "${RED}✗ Neither pnpm nor npm found. Please install Node.js and pnpm.${NC}"
        exit 1
    fi
    
    cd - > /dev/null
}

# Copy built assets to plugin (not needed - Vite already outputs there)
copy_assets() {
    # Vite is configured to output directly to plugin/assets/admin
    # This function is kept for documentation purposes
    :
}

# Clean build directory
clean_build() {
    echo -e "${YELLOW}→ Cleaning build directory...${NC}"
    rm -rf "$BUILD_DIR"
    mkdir -p "$BUILD_DIR"
}

# Create plugin distribution
create_distribution() {
    local version=$1
    local git_hash=$2
    local dist_dir="$BUILD_DIR/openfields"
    
    echo -e "${YELLOW}→ Creating plugin distribution...${NC}"
    
    # Create plugin directory in dist
    mkdir -p "$dist_dir"
    
    # Copy plugin files, excluding unnecessary files
    rsync -av --delete \
        --exclude='.git' \
        --exclude='.gitignore' \
        --exclude='node_modules' \
        --exclude='.DS_Store' \
        --exclude='*.map' \
        --exclude='README.md' \
        --exclude='.env*' \
        "$PLUGIN_DIR/" "$dist_dir/"
    
    echo -e "${GREEN}✓ Distribution created${NC}"
}

# Create ZIP file
create_zip() {
    local version=$1
    local git_hash=$2
    local dist_dir="$BUILD_DIR/openfields"
    local zip_file="$BUILD_DIR/${ZIP_NAME}-${version}.zip"
    
    echo -e "${YELLOW}→ Creating ZIP file...${NC}"
    
    cd "$BUILD_DIR"
    zip -r "${ZIP_NAME}-${version}.zip" openfields/ > /dev/null
    cd - > /dev/null
    
    echo -e "${GREEN}✓ ZIP created: $zip_file${NC}"
}

# Display build info
show_build_info() {
    local version=$1
    local git_hash=$2
    
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}   OpenFields Plugin Build Complete${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "Version:    ${GREEN}$version${NC}"
    echo -e "Git Commit: ${GREEN}$git_hash${NC}"
    echo -e "Location:   ${GREEN}$BUILD_DIR${NC}"
    echo ""
    echo "Next steps:"
    echo "  • Test the plugin in WordPress"
    echo "  • Create a release tag: git tag v$version"
    echo "  • Push to repository: git push origin v$version"
    echo ""
}

# Main build process
main() {
    local version=$(get_version)
    local git_hash=$(get_git_hash)
    
    echo ""
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo -e "${YELLOW}   OpenFields Plugin Build${NC}"
    echo -e "${YELLOW}═══════════════════════════════════════${NC}"
    echo ""
    
    # Check if we're building for release or development
    if [[ "$1" == "release" ]]; then
        echo -e "${YELLOW}Mode: RELEASE BUILD${NC}"
        build_admin_app
        update_plugin_version "$version"
        copy_assets
        clean_build
        create_distribution "$version" "$git_hash"
        create_zip "$version" "$git_hash"
        show_build_info "$version" "$git_hash"
    else
        echo -e "${YELLOW}Mode: DEVELOPMENT BUILD${NC}"
        build_admin_app
        copy_assets
        echo ""
        echo -e "${GREEN}✓ Development build complete!${NC}"
        echo -e "Plugin ready at: ${GREEN}$PLUGIN_DIR${NC}"
        echo "Changes ready for Git commit."
    fi
}

# Run main function
main "$@"
