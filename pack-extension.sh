#!/bin/zsh
# Script pour empaqueter l'extension T41 Assistant pour le test

echo "📦 Création du package d'extension T41 Assistant..."

# Vérifier si le répertoire de travail est correct
if [[ ! -f manifest.json ]]; then
    echo "❌ Erreur : Ce script doit être exécuté depuis la racine du projet extension-t41"
    exit 1
fi

# Nom du fichier zip
OUTPUT_FILE="t41-assistant.zip"

# Suppression de l'ancien fichier s'il existe
if [[ -f "$OUTPUT_FILE" ]]; then
    echo "🗑️ Suppression de l'ancien package..."
    rm "$OUTPUT_FILE"
fi

# Création du nouveau package
echo "🔄 Création du nouveau package..."
zip -r "$OUTPUT_FILE" manifest.json background/ content/ icons/ popup/ README.md

# Vérification que le zip a été créé avec succès
if [[ -f "$OUTPUT_FILE" ]]; then
    echo "✅ Package créé avec succès : $OUTPUT_FILE"
    echo ""
    echo "📋 Instructions pour tester l'extension :"
    echo "1. Ouvrez Firefox"
    echo "2. Naviguez vers about:debugging#/runtime/this-firefox"
    echo "3. Cliquez sur 'Charger un module complémentaire temporaire...'"
    echo "4. Sélectionnez le fichier $OUTPUT_FILE"
    echo ""
    echo "Ou allez dans about:addons > ⚙️ > Installer un module depuis un fichier... > Sélectionnez $OUTPUT_FILE"
else
    echo "❌ Erreur lors de la création du package"
    exit 1
fi
