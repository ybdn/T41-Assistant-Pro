#!/usr/bin/env node

/**
 * Bumps the extension version in manifest.json and popup/popup.html so they stay in sync.
 * Usage: node scripts/bump-version.js <major|minor|patch>
 */
const fs = require('fs');
const path = require('path');

const releaseType = process.argv[2];
const ALLOWED = new Set(['major', 'minor', 'patch']);

if (!ALLOWED.has(releaseType)) {
  console.error('Release type must be one of: major, minor, patch.');
  process.exit(1);
}

const manifestPath = path.join(__dirname, '..', 'manifest.json');
const popupPath = path.join(__dirname, '..', 'popup', 'popup.html');

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const currentVersion = manifest.version;

if (!/^\d+\.\d+\.\d+$/.test(currentVersion)) {
  console.error(`Invalid semver found in manifest.json: ${currentVersion}`);
  process.exit(1);
}

const bump = (version, type) => {
  const [major, minor, patch] = version.split('.').map(Number);
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
};

const newVersion = bump(currentVersion, releaseType);
manifest.version = newVersion;
fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const popupHtml = fs.readFileSync(popupPath, 'utf8');
const versionPattern = /(Version\s+)(\d+\.\d+\.\d+)/;

if (!versionPattern.test(popupHtml)) {
  console.error('Unable to locate version string in popup/popup.html');
  process.exit(1);
}

const updatedPopup = popupHtml.replace(versionPattern, `$1${newVersion}`);
fs.writeFileSync(popupPath, updatedPopup, 'utf8');

// surface new version to callers (GitHub Actions step can capture stdout)
console.log(newVersion);
