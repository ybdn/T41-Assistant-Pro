#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const vm = require("vm");

// Fonction pour analyser les scripts JS et détecter les erreurs potentielles
function analyzeJsFile(filePath) {
  console.log(`\n\x1b[1mAnalyse de ${filePath}:\x1b[0m`);
  try {
    const content = fs.readFileSync(filePath, "utf8");

    // Vérifier les erreurs syntaxiques de base
    try {
      new vm.Script(content, {
        filename: path.basename(filePath),
        displayErrors: true,
      });
      console.log("\x1b[32m✓ Pas d'erreurs de syntaxe\x1b[0m");
    } catch (e) {
      console.log(`\x1b[31m✗ Erreur de syntaxe: ${e.message}\x1b[0m`);
      const lines = content.split("\n");
      const lineNumber = parseInt(
        e.message.match(/line (\d+)/)?.[1] || "0",
        10
      );
      if (lineNumber > 0 && lineNumber <= lines.length) {
        console.log(
          `\x1b[33mLigne ${lineNumber}:\x1b[0m ${lines[lineNumber - 1]}`
        );
      }
    }

    // Vérifier les éventuels problèmes courants
    const issues = [];

    // Vérifier le bouton next-action
    if (content.includes('getElementById("next-action")')) {
      console.log('\x1b[32m✓ Référence au bouton "next-action" trouvée\x1b[0m');

      // Vérifier s'il y a un écouteur d'événements sur ce bouton
      if (content.includes('nextActionButton.addEventListener("click"')) {
        console.log(
          '\x1b[32m✓ Écouteur d\'événements "click" sur le bouton trouvé\x1b[0m'
        );
      } else {
        issues.push(
          'Aucun écouteur d\'événements "click" sur le bouton next-action'
        );
      }
    } else {
      issues.push('Référence au bouton "next-action" non trouvée');
    }

    // Vérifier les appels à browser.tabs.sendMessage
    if (content.includes("browser.tabs.sendMessage")) {
      console.log(
        "\x1b[32m✓ Utilisation de browser.tabs.sendMessage trouvée\x1b[0m"
      );
    } else if (content.includes("chrome.tabs.sendMessage")) {
      console.log(
        "\x1b[33m⚠ Utilisation de chrome.tabs.sendMessage trouvée (polyfill nécessaire)\x1b[0m"
      );
    } else {
      issues.push("Aucun appel à browser/chrome.tabs.sendMessage trouvé");
    }

    // Vérifier les références à window.uiHelpers
    if (content.includes("window.uiHelpers")) {
      console.log("\x1b[32m✓ Référence à window.uiHelpers trouvée\x1b[0m");

      // Vérifier si window.uiHelpers est correctement défini avant utilisation
      if (content.includes("if (window.uiHelpers)")) {
        console.log(
          "\x1b[32m✓ Vérification de l'existence de window.uiHelpers avant utilisation\x1b[0m"
        );
      } else {
        issues.push(
          "Pas de vérification de l'existence de window.uiHelpers avant utilisation"
        );
      }
    }

    // Vérifier l'ordre de chargement des scripts
    if (filePath.includes("popup-ui.js")) {
      if (content.includes('document.addEventListener("DOMContentLoaded"')) {
        console.log("\x1b[32m✓ Écoute de DOMContentLoaded trouvée\x1b[0m");
      } else {
        issues.push("Pas d'écoute de DOMContentLoaded");
      }
    }

    // Afficher les problèmes détectés
    if (issues.length > 0) {
      console.log("\n\x1b[33mProblèmes potentiels:\x1b[0m");
      issues.forEach((issue) => console.log(`- ${issue}`));
    } else {
      console.log("\n\x1b[32mAucun problème majeur détecté\x1b[0m");
    }

    return { hasErrors: issues.length > 0, issues };
  } catch (e) {
    console.log(`\x1b[31m✗ Impossible de lire le fichier: ${e.message}\x1b[0m`);
    return { hasErrors: true, issues: [e.message] };
  }
}

// Fonction pour analyser les fichiers HTML
function analyzeHtmlFile(filePath) {
  console.log(`\n\x1b[1mAnalyse de ${filePath}:\x1b[0m`);
  try {
    const content = fs.readFileSync(filePath, "utf8");
    const issues = [];

    // Vérifier le bouton next-action
    if (content.includes('id="next-action"')) {
      console.log('\x1b[32m✓ Élément avec id="next-action" trouvé\x1b[0m');
    } else {
      issues.push('Aucun élément avec id="next-action" trouvé');
    }

    // Vérifier l'ordre de chargement des scripts
    const scriptTags = content.match(/<script[^>]*src="([^"]+)"[^>]*>/g) || [];
    console.log("\x1b[36mOrdre de chargement des scripts:\x1b[0m");
    scriptTags.forEach((tag) => {
      const src = tag.match(/src="([^"]+)"/)?.[1];
      console.log(`- ${src}`);
    });

    // Vérifier si browser-polyfill.js est chargé avant les autres scripts
    const scriptSources = scriptTags
      .map((tag) => tag.match(/src="([^"]+)"/)?.[1])
      .filter(Boolean);
    const polyfillIndex = scriptSources.findIndex((src) =>
      src.includes("browser-polyfill.js")
    );
    if (polyfillIndex === -1) {
      issues.push("browser-polyfill.js n'est pas chargé");
    } else if (polyfillIndex !== 0) {
      issues.push("browser-polyfill.js n'est pas chargé en premier");
    } else {
      console.log("\x1b[32m✓ browser-polyfill.js est chargé en premier\x1b[0m");
    }

    // Afficher les problèmes détectés
    if (issues.length > 0) {
      console.log("\n\x1b[33mProblèmes potentiels:\x1b[0m");
      issues.forEach((issue) => console.log(`- ${issue}`));
    } else {
      console.log("\n\x1b[32mAucun problème majeur détecté\x1b[0m");
    }

    return { hasErrors: issues.length > 0, issues };
  } catch (e) {
    console.log(`\x1b[31m✗ Impossible de lire le fichier: ${e.message}\x1b[0m`);
    return { hasErrors: true, issues: [e.message] };
  }
}

// Analyse les scripts de la popup
const popupFolder = path.join(__dirname, "popup");
console.log("\x1b[1;36m=== ANALYSE DES FICHIERS DE L'EXTENSION T41 ===\x1b[0m");

// Analyser les fichiers HTML
analyzeHtmlFile(path.join(popupFolder, "popup-new.html"));

// Analyser les fichiers JS
analyzeJsFile(path.join(popupFolder, "browser-polyfill.js"));
analyzeJsFile(path.join(popupFolder, "popup-fixed.js"));
analyzeJsFile(path.join(popupFolder, "popup-ui.js"));

console.log("\n\x1b[1;36m=== SUGGESTION DE CORRECTION ===\x1b[0m");
console.log(`
1. Vérifiez que le polyfill est correctement chargé et disponible avant les autres scripts
2. Assurez-vous que l'élément avec id="next-action" existe dans le HTML avant le chargement des scripts
3. Vérifiez que l'écouteur d'événements est correctement attaché au bouton
4. Assurez-vous que window.uiHelpers est défini avant son utilisation
5. Vérifiez les erreurs de console dans les outils de développement du navigateur
`);
