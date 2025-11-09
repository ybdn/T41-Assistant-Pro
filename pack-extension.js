#!/usr/bin/env node

/**
 * Script de packaging pour l'extension T41 Assistant Pro.
 * Empaquette les fichiers nécessaires dans un fichier ZIP prêt à être chargé dans Firefox.
 */

const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();
const MANIFEST_PATH = path.join(PROJECT_ROOT, "manifest.json");
const OUTPUT_NAME = "t41-assistant.zip";

function log(message) {
  console.log(message);
}

function exitWithError(message) {
  console.error(message);
  process.exit(1);
}

log("📦 Création du package d'extension T41 Assistant Pro...");

if (!fs.existsSync(MANIFEST_PATH)) {
  exitWithError(
    "❌ Erreur : ce script doit être exécuté depuis la racine du projet extension-t41-auto."
  );
}

const outputPath = path.join(PROJECT_ROOT, OUTPUT_NAME);
if (fs.existsSync(outputPath)) {
  log("🗑️ Suppression de l'ancien package...");
  fs.rmSync(outputPath);
}

log("🔄 Création du nouveau package...");
const zipArgs = [
  "-r",
  OUTPUT_NAME,
  "manifest.json",
  "background/",
  "content/",
  "icons/",
  "popup/",
  "README.md",
];

const zipResult = spawnSync("zip", zipArgs, {
  cwd: PROJECT_ROOT,
  stdio: "inherit",
});

if (zipResult.status !== 0) {
  exitWithError("❌ Erreur lors de la création du package.");
}

if (!fs.existsSync(outputPath)) {
  exitWithError("❌ Le fichier ZIP n'a pas été généré.");
}

log(`✅ Package créé avec succès : ${OUTPUT_NAME}`);
log("");
log("📋 Instructions pour tester l'extension :");
log("1. Ouvrez Firefox");
log("2. Naviguez vers about:debugging#/runtime/this-firefox");
log("3. Cliquez sur 'Charger un module complémentaire temporaire...'");
log(`4. Sélectionnez le fichier ${OUTPUT_NAME}`);
log("");
log(
  "Alternativement : about:addons > ⚙️ > Installer un module depuis un fichier... > Sélectionnez le fichier ZIP."
);
