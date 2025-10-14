const logOutput = document.getElementById("log-output");

function log(message, type = "info") {
  const logEntry = document.createElement("div");
  logEntry.className = type;
  logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
  logOutput.appendChild(logEntry);
  logOutput.scrollTop = logOutput.scrollHeight;
}

document.getElementById("test-browser-api").addEventListener("click", () => {
  try {
    log("Vérification de la disponibilité de l'API browser...");
    if (typeof browser !== "undefined") {
      log("API browser disponible ✓", "success");
      log(`Type de browser: ${typeof browser}`);
      log(`Propriétés disponibles: ${Object.keys(browser).join(", ")}`);
    } else {
      log("API browser non disponible ✗", "error");
    }
  } catch (e) {
    log(`Erreur lors du test de l'API browser: ${e.message}`, "error");
  }
});

document.getElementById("test-tabs").addEventListener("click", async () => {
  try {
    log("Test de browser.tabs.query...");
    const tabs = await browser.tabs.query({
      active: true,
      currentWindow: true,
    });
    log(`Onglets actifs trouvés: ${tabs.length} ✓`, "success");
    log(`Premier onglet: ${tabs.length > 0 ? tabs[0].url : "aucun"}`);
  } catch (e) {
    log(`Erreur lors du test de tabs.query: ${e.message}`, "error");
  }
});

document.getElementById("test-storage").addEventListener("click", async () => {
  try {
    log("Test de browser.storage.local...");
    await browser.storage.local.set({ debugTest: "ok" });
    const data = await browser.storage.local.get("debugTest");
    log(`Lecture storage: ${JSON.stringify(data)} ✓`, "success");
  } catch (e) {
    log(`Erreur lors du test de storage.local: ${e.message}`, "error");
  }
});

document
  .getElementById("test-next-action")
  .addEventListener("click", () => {
    try {
      log('Simulation du clic sur le bouton "Lancer"...');
      browser.runtime
        .sendMessage({ command: "testNextAction" })
        .then((response) => {
          log(`Réponse reçue: ${JSON.stringify(response)}`, "success");
        })
        .catch((error) => {
          log(`Erreur de communication: ${error.message}`, "error");
        });
    } catch (e) {
      log(`Erreur lors de la simulation: ${e.message}`, "error");
    }
  });

document
  .getElementById("test-icon-trigger")
  .addEventListener("click", () => {
    try {
      log("Simulation du clic sur l'icône...");
      browser.runtime
        .sendMessage({ command: "testIconTrigger" })
        .then((response) => {
          log(`Réponse reçue: ${JSON.stringify(response)}`, "success");
        })
        .catch((error) => {
          log(`Erreur de communication: ${error.message}`, "error");
        });
    } catch (e) {
      log(`Erreur lors de la simulation: ${e.message}`, "error");
    }
  });

browser.runtime.onMessage.addListener((message) => {
  if (message.type === "debug") {
    log(message.content, message.level || "info");
    return true;
  }
  return undefined;
});

log("Outil de débogage initialisé", "info");
