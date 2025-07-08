/**
 * T41 Assistant - Polyfill amélioré pour la compatibilité navigateurs
 */

// Log pour vérifier le chargement du script
console.log("🔄 browser-polyfill-fixed.js chargé");

// Compatibilité Chrome/Firefox pour les extensions WebExtensions
if (typeof browser === "undefined") {
  console.log("⚠️ API browser non détectée, utilisation du polyfill");
  var browser = chrome;
} else {
  console.log("✅ API browser déjà disponible");
}

// Vérifier que l'API browser est maintenant disponible et complète
if (typeof browser !== "undefined") {
  // Vérifier les APIs essentielles
  const requiredApis = ["tabs", "runtime", "storage"];
  const missingApis = [];

  requiredApis.forEach((api) => {
    if (!browser[api]) {
      missingApis.push(api);
    }
  });

  if (missingApis.length > 0) {
    console.error(`❌ APIs manquantes: ${missingApis.join(", ")}`);
  } else {
    console.log("✅ Toutes les APIs requises sont disponibles");
  }
} else {
  console.error(
    "❌ L'API browser n'est toujours pas disponible après le polyfill"
  );
}

// Ajouter une fonction utilitaire pour les opérations asynchrones
if (typeof browser !== "undefined") {
  browser.promisify = function (api) {
    return function () {
      return new Promise((resolve, reject) => {
        api.apply(null, [
          ...arguments,
          (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(result);
            }
          },
        ]);
      });
    };
  };
}
