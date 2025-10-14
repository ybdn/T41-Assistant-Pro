/**
 * T41 Assistant - Outil de diagnostic et débogage
 * Ce script permet de vérifier le bon fonctionnement des communications entre la popup et le script content
 */

// Variables pour stocker les résultats des tests
const testResults = {
  scriptInjection: null,
  messagingSystem: null,
  storageAccess: null,
  loopProcessing: null,
};

// Interface utilisateur pour le débogage
document.addEventListener("DOMContentLoaded", async () => {
  const debugContainer = document.getElementById("debug-container");
  const resultsList = document.getElementById("debug-results");
  const actionButton = document.getElementById("debug-action");
  const statusText = document.getElementById("debug-status");

  // Fonction pour ajouter un résultat de test
  function addResult(test, status, message) {
    const li = document.createElement("li");
    li.className = `debug-result ${status}`;

    const nameSpan = document.createElement("span");
    nameSpan.className = "test-name";
    nameSpan.textContent = test;

    const separator = document.createTextNode(": ");

    const statusSpan = document.createElement("span");
    statusSpan.className = "test-status";
    statusSpan.textContent = message;

    li.append(nameSpan, separator, statusSpan);
    resultsList.appendChild(li);
    return li;
  }

  // Fonction pour mettre à jour le statut
  function updateStatus(message, isError = false) {
    statusText.textContent = message;
    statusText.className = isError ? "error" : "info";
  }

  // 1. Vérifier si la page actuelle est une page FAED
  async function checkFAEDPage() {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (!tabs || tabs.length === 0) {
        throw new Error("Aucun onglet actif trouvé");
      }

      const tab = tabs[0];
      const url = tab.url || "";

      if (
        url.includes("faed.ppsso.gendarmerie.fr") ||
        url.includes("faed.sso.gendarmerie.fr")
      ) {
        addResult(
          "Page FAED",
          "success",
          "L'onglet actif est bien une page FAED"
        );
        return { success: true, tab };
      } else {
        addResult(
          "Page FAED",
          "error",
          "L'onglet actif n'est pas une page FAED"
        );
        throw new Error("L'onglet actif n'est pas une page FAED");
      }
    } catch (error) {
      addResult("Page FAED", "error", `Erreur: ${error.message}`);
      throw error;
    }
  }

  // 2. Vérifier si le script content est bien injecté
  async function checkScriptInjection(tab) {
    try {
      const response = await browser.tabs.sendMessage(tab.id, {
        command: "ping",
      });

      if (response && response.pong) {
        addResult(
          "Injection script",
          "success",
          `Script injecté (version: ${response.version || "inconnue"})`
        );
        testResults.scriptInjection = true;
        return true;
      } else {
        addResult(
          "Injection script",
          "error",
          "Le script n'a pas répondu correctement"
        );
        testResults.scriptInjection = false;
        return false;
      }
    } catch (error) {
      addResult("Injection script", "error", `Erreur: ${error.message}`);
      testResults.scriptInjection = false;

      // Tenter de réinjecter le script
      const reinjectResult = await addResult(
        "Réinjection",
        "info",
        "Tentative de réinjection du script..."
      );

      try {
        await browser.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["/content/alphaMatchers.js"],
        });

        // Attendre que le script s'initialise
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Vérifier à nouveau
        try {
          const retryResponse = await browser.tabs.sendMessage(tab.id, {
            command: "ping",
          });
          if (retryResponse && retryResponse.pong) {
            reinjectResult.className = "debug-result success";
            reinjectResult.querySelector(".test-status").textContent =
              "Réinjection réussie!";
            testResults.scriptInjection = true;
            return true;
          } else {
            reinjectResult.className = "debug-result error";
            reinjectResult.querySelector(".test-status").textContent =
              "Échec de la réinjection";
            return false;
          }
        } catch (retryError) {
          reinjectResult.className = "debug-result error";
          reinjectResult.querySelector(
            ".test-status"
          ).textContent = `Échec de la réinjection: ${retryError.message}`;
          return false;
        }
      } catch (injectionError) {
        reinjectResult.className = "debug-result error";
        reinjectResult.querySelector(
          ".test-status"
        ).textContent = `Échec de l'injection: ${injectionError.message}`;
        return false;
      }
    }
  }

  // 3. Tester le système de communication
  async function testMessaging(tab) {
    try {
      const response = await browser.tabs.sendMessage(tab.id, {
        command: "testMessaging",
        timestamp: Date.now(),
      });

      if (response && response.success) {
        addResult(
          "Communication",
          "success",
          "Le système de messagerie fonctionne correctement"
        );
        testResults.messagingSystem = true;
        return true;
      } else {
        addResult("Communication", "error", "Réponse invalide reçue");
        testResults.messagingSystem = false;
        return false;
      }
    } catch (error) {
      addResult("Communication", "error", `Erreur: ${error.message}`);
      testResults.messagingSystem = false;
      return false;
    }
  }

  // 4. Tester l'accès au stockage
  async function testStorage() {
    try {
      // Écrire une valeur de test
      const testValue = `test-${Date.now()}`;
      await browser.storage.local.set({ diagnosticTest: testValue });

      // Lire la valeur
      const data = await browser.storage.local.get("diagnosticTest");

      if (data && data.diagnosticTest === testValue) {
        addResult(
          "Stockage",
          "success",
          "L'accès au stockage fonctionne correctement"
        );
        testResults.storageAccess = true;
        return true;
      } else {
        addResult(
          "Stockage",
          "error",
          "La valeur lue ne correspond pas à la valeur écrite"
        );
        testResults.storageAccess = false;
        return false;
      }
    } catch (error) {
      addResult("Stockage", "error", `Erreur: ${error.message}`);
      testResults.storageAccess = false;
      return false;
    }
  }

  // 5. Tester la fonction de boucle de traitement
  async function testLoopProcessing(tab) {
    try {
      const loopTestResult = await addResult(
        "Boucle traitement",
        "info",
        "Test en cours..."
      );

      // Envoyer la commande startLoopProcessing
      const response = await browser.tabs.sendMessage(tab.id, {
        command: "startLoopProcessing",
      });

      console.log("Réponse startLoopProcessing:", response);

      if (response && response.success) {
        loopTestResult.className = "debug-result success";
        loopTestResult.querySelector(".test-status").textContent =
          "La commande de démarrage fonctionne";
        testResults.loopProcessing = true;

        // Attendre un moment
        await new Promise((resolve) => setTimeout(resolve, 1000));

        // Arrêter la boucle
        try {
          await browser.tabs.sendMessage(tab.id, {
            command: "stopLoopProcessing",
          });

          addResult(
            "Arrêt boucle",
            "success",
            "La commande d'arrêt fonctionne"
          );
          return true;
        } catch (stopError) {
          addResult(
            "Arrêt boucle",
            "error",
            `Erreur lors de l'arrêt: ${stopError.message}`
          );
          return false;
        }
      } else {
        loopTestResult.className = "debug-result error";
        loopTestResult.querySelector(".test-status").textContent = `Échec: ${
          response ? response.error || "Réponse invalide" : "Pas de réponse"
        }`;
        testResults.loopProcessing = false;
        return false;
      }
    } catch (error) {
      addResult("Boucle traitement", "error", `Erreur: ${error.message}`);
      testResults.loopProcessing = false;
      return false;
    }
  }

  // Fonction principale de diagnostic
  async function runDiagnostic() {
    updateStatus("Diagnostic en cours...");
    resultsList.replaceChildren();

    try {
      // 1. Vérifier si nous sommes sur une page FAED
      const { tab } = await checkFAEDPage();

      // 2. Vérifier si le script est injecté
      const scriptInjected = await checkScriptInjection(tab);
      if (!scriptInjected) {
        updateStatus("Le script content n'est pas correctement injecté", true);
        return;
      }

      // 3. Tester le système de messagerie
      const messagingWorks = await testMessaging(tab);
      if (!messagingWorks) {
        updateStatus("Problème avec le système de messagerie", true);
      }

      // 4. Tester l'accès au stockage
      const storageWorks = await testStorage();
      if (!storageWorks) {
        updateStatus("Problème avec l'accès au stockage", true);
      }

      // 5. Tester le démarrage de la boucle
      const loopWorks = await testLoopProcessing(tab);

      // Résultat global
      if (messagingWorks && storageWorks && loopWorks) {
        updateStatus(
          "Tous les tests ont réussi! L'extension devrait fonctionner correctement."
        );
      } else {
        updateStatus(
          "Certains tests ont échoué. Voir les détails ci-dessus.",
          true
        );
      }
    } catch (error) {
      updateStatus(`Erreur lors du diagnostic: ${error.message}`, true);
    }
  }

  // Écouter le clic sur le bouton d'action
  if (actionButton) {
    actionButton.addEventListener("click", runDiagnostic);
  }

  // Exécuter le diagnostic automatiquement au chargement
  runDiagnostic();
});
