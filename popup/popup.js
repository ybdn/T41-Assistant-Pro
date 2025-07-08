/**
 * T41 Assistant - Script JS consolidé
 * Ce fichier combine la logique principale et l'interface utilisateur
 */

// Fonctions de journalisation pour le débogage
console.logOriginal = console.log || function () {};
console.log = function () {
  console.logOriginal.apply(console, arguments);
};

console.errorOriginal = console.error || function () {};
console.error = function () {
  console.errorOriginal.apply(console, arguments);
};

// Initialiser après le chargement du DOM
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔄 T41 Assistant chargé !");

  // Récupérer les éléments de l'interface utilisateur
  const nextActionButton = document.getElementById("next-action");
  const iconTrigger = document.getElementById("icon-trigger");
  const appIcon = document.querySelector(".app-icon");
  const statusDot = document.getElementById("status-dot");
  const statusMessage = document.getElementById("status-message");

  // Vérifier la présence des éléments critiques
  if (!nextActionButton) {
    console.error(
      "ERREUR CRITIQUE: Bouton 'next-action' non trouvé dans le DOM"
    );
  }

  if (!iconTrigger) {
    console.error(
      "ERREUR CRITIQUE: Bouton 'icon-trigger' non trouvé dans le DOM"
    );
  }

  if (!appIcon) {
    console.error(
      "ERREUR CRITIQUE: Élément '.app-icon' non trouvé dans le DOM"
    );
  }

  // Vérifier si l'API browser est disponible
  if (typeof browser === "undefined") {
    console.error("ERREUR CRITIQUE: L'API browser n'est pas disponible");
    alert(
      "L'API browser n'est pas disponible. L'extension ne fonctionnera pas correctement."
    );
    return;
  }

  // Récupérer les sous-éléments du bouton avec sécurité
  let nextActionIcon = nextActionButton
    ? nextActionButton.querySelector("i")
    : null;
  if (nextActionButton && !nextActionIcon) {
    console.warn(
      "⚠️ Icône dans le bouton next-action non trouvée, création d'un élément de remplacement"
    );
    nextActionIcon = document.createElement("i");
    nextActionButton.prepend(nextActionIcon);
  }

  let nextActionText = nextActionButton
    ? nextActionButton.querySelector("span")
    : null;
  if (nextActionButton && !nextActionText) {
    console.warn(
      "⚠️ Texte dans le bouton next-action non trouvé, création d'un élément de remplacement"
    );
    nextActionText = document.createElement("span");
    nextActionButton.appendChild(nextActionText);
    nextActionText.textContent = nextActionButton.textContent.trim();
  }

  // État de la boucle de traitement
  let popupLoopStateActive = false;

  // Fonctions UI
  const uiHelpers = {
    // Mise à jour de l'interface utilisateur en fonction de l'état de la boucle
    updateStatusUI: function (isActive, hasError = false) {
      console.log(`Mise à jour UI: isActive=${isActive}, hasError=${hasError}`);

      // Mise à jour du point de statut
      if (statusDot) {
        statusDot.classList.toggle("active", isActive && !hasError);
        statusDot.classList.toggle("error", hasError);
      }

      // Mise à jour du texte de statut
      if (statusMessage) {
        if (hasError) {
          statusMessage.textContent = "Erreur détectée";
        } else if (isActive) {
          statusMessage.textContent = "Boucle active";
        } else {
          statusMessage.textContent = "Boucle inactive";
        }
      }

      // Mise à jour du bouton
      if (nextActionButton) {
        if (isActive) {
          if (nextActionIcon) nextActionIcon.className = "fas fa-stop";
          if (nextActionText) nextActionText.textContent = "Arrêter";
          nextActionButton.classList.add("processing");
        } else {
          if (nextActionIcon) nextActionIcon.className = "fas fa-play";
          if (nextActionText) nextActionText.textContent = "Lancer";
          nextActionButton.classList.remove("processing");
        }
      }
    },

    // Mise à jour de l'icône en fonction du statut
    updateIconUI: function (status) {
      console.log(`Mise à jour icône: status=${status}`);

      // status: null = normal, false = success, true = error
      if (!appIcon) return;

      if (status === true) {
        appIcon.src = "../icons/icon-48-red.png";
        if (statusDot) {
          statusDot.classList.add("error");
          statusDot.classList.remove("active");
        }
      } else if (status === false) {
        appIcon.src = "../icons/icon-48-green.png";
        if (statusDot) {
          statusDot.classList.remove("error");
        }
      } else {
        appIcon.src = "../icons/icon-48.png";
        if (statusDot) {
          statusDot.classList.remove("error");
        }
      }
    },

    // Animation lors des changements d'état
    animateStatusChange: function (newState) {
      console.log(`Animation changement d'état: ${newState}`);

      // Ajouter une classe pour l'animation puis la retirer
      const container = document.getElementById("status-container");
      if (!container) return;

      container.classList.add("fade-in");
      setTimeout(() => {
        container.classList.remove("fade-in");
      }, 300);
    },
  };

  // Exposer les helpers UI pour d'autres scripts potentiels
  window.uiHelpers = uiHelpers;

  // Mettre à jour l'interface utilisateur en fonction de l'état de la boucle
  function updatePopupUIForLoopState(isLooping) {
    popupLoopStateActive = isLooping;
    uiHelpers.updateStatusUI(isLooping);
    uiHelpers.animateStatusChange(isLooping);
    updateIcon(null);
  }

  // Initialiser l'état de la boucle au chargement
  try {
    const data = await browser.storage.local.get("loopProcessingActive");
    updatePopupUIForLoopState(!!data.loopProcessingActive);
  } catch (e) {
    console.error("Erreur lecture loopProcessingActive depuis storage:", e);
    updatePopupUIForLoopState(false);
  }

  // Fonctions utilitaires
  function updateIcon(hasError) {
    uiHelpers.updateIconUI(hasError);
  }

  async function getActiveTab() {
    try {
      let tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tabs.length > 0 && tabs[0].id) {
        console.log("Onglet actif trouvé:", tabs[0].url);
        return tabs[0];
      } else {
        console.error("Aucun onglet actif trouvé.");
        return null;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des onglets :", error);
      return null;
    }
  }

  // Ajout d'effets visuels
  if (nextActionButton) {
    // Effet de survol
    nextActionButton.addEventListener("mouseover", () => {
      nextActionButton.style.transform = "scale(1.03)";
    });

    nextActionButton.addEventListener("mouseout", () => {
      nextActionButton.style.transform = "scale(1)";
    });

    // Effet de clic
    nextActionButton.addEventListener("click", async (event) => {
      console.log("🖱️ CLIC détecté sur le bouton d'action");

      // Effet visuel au clic
      nextActionButton.style.transform = "scale(0.98)";
      setTimeout(() => {
        nextActionButton.style.transform = "scale(1)";
      }, 100);

      try {
        let tab = await getActiveTab();
        if (!tab || !tab.id) {
          console.error(
            "❌ Aucun onglet actif trouvé ou l'onglet n'a pas d'ID."
          );
          alert("Aucun onglet actif trouvé ou l'onglet n'a pas d'ID.");
          return;
        }

        if (popupLoopStateActive) {
          console.log("Bouton 'Arrêter la Boucle' cliqué.");
          try {
            await browser.tabs.sendMessage(tab.id, {
              command: "stopLoopProcessing",
            });
            updatePopupUIForLoopState(false);
          } catch (error) {
            console.error(
              "Erreur lors de l'envoi de stopLoopProcessing:",
              error
            );
            alert(
              "Erreur communication pour arrêter la boucle: " + error.message
            );
          }
        } else {
          console.log("Bouton 'Lancer la Boucle' cliqué.");
          updatePopupUIForLoopState(true);
          nextActionButton.disabled = true;

          try {
            try {
              await browser.scripting.executeScript({
                target: { tabId: tab.id },
                files: ["/content/alphaMatchers.js"],
              });
              console.log(
                "Injection de content/alphaMatchers.js (précaution) réussie."
              );
            } catch (injectionError) {
              console.warn(
                "Échec de l'injection de précaution de content/alphaMatchers.js:",
                injectionError
              );
            }
            await new Promise((resolve) => setTimeout(resolve, 200));

            const response = await browser.tabs.sendMessage(tab.id, {
              command: "startLoopProcessing",
            });
            console.log("Réponse de startLoopProcessing:", response);
            if (response && response.success) {
              if (response.validationResult === false) {
                updatePopupUIForLoopState(false);
                updateIcon(true);
              }
            } else {
              alert(
                "Impossible de démarrer la boucle de traitement. Vérifiez la console."
              );
              updatePopupUIForLoopState(false);
            }
          } catch (error) {
            console.error(
              "Erreur lors de l'envoi de startLoopProcessing:",
              error
            );
            alert(
              "Erreur communication pour démarrer la boucle: " +
                error.message +
                ". Le script est-il bien injecté sur la page FAED ?"
            );
            updatePopupUIForLoopState(false);
          } finally {
            nextActionButton.disabled = false;
          }
        }
      } catch (globalError) {
        console.error(
          "❌ Erreur globale lors du clic sur le bouton:",
          globalError
        );
        alert("Une erreur s'est produite: " + globalError.message);
      }
    });
  }

  // Gérer le clic sur l'icône
  if (iconTrigger) {
    iconTrigger.addEventListener("click", async () => {
      console.log("Icône cliquée, exécution de alphaMatchers.js...");

      let tab = await getActiveTab();
      if (!tab) {
        console.error("Aucun onglet actif trouvé");
        return;
      }

      try {
        const response = await browser.tabs.sendMessage(tab.id, {
          command: "checkAlphaNumeric",
        });

        console.log("Réponse reçue:", response);
        if (response && response.success) {
          if (response.result) {
            updateIcon(false);
          } else {
            updateIcon(true);
          }
        } else {
          console.error("Erreur lors de la vérification");
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors de l'exécution d'alphaMatchers.js :",
          error
        );

        try {
          console.log("Tentative d'injection du script alphaMatchers.js...");

          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["/content/alphaMatchers.js"],
          });

          console.log("Script injecté, nouvelle tentative de vérification...");

          await new Promise((resolve) => setTimeout(resolve, 500));

          const retryResponse = await browser.tabs.sendMessage(tab.id, {
            command: "checkAlphaNumeric",
          });

          if (retryResponse && retryResponse.success) {
            if (retryResponse.result) {
              updateIcon(false);
            } else {
              updateIcon(true);
            }
          } else {
            console.error("Échec de la vérification");
          }
        } catch (injectionError) {
          console.error("Échec de l'injection du script:", injectionError);
        }
      }
    });
  }

  // Gérer les messages venant du script de contenu
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message reçu dans popup.js:", message);

    if (sender.tab) {
      if (message.command === "stepCompleted") {
        console.log(
          `Étape ${message.stepIndex} (${
            message.stepName || "N/A"
          }) terminée. Prochaine: ${message.nextStepIndex}.`
        );
        if (popupLoopStateActive && statusMessage) {
          statusMessage.textContent = "Boucle active: Traitement en cours...";
        }
      } else if (message.command === "actionsComplete") {
        console.log("Toutes les étapes de la fiche actuelle terminées.");
        if (popupLoopStateActive && statusMessage) {
          statusMessage.textContent =
            "Fiche terminée, en attente de la suivante...";
        }
        updateIcon(false);
        browser.action.setIcon({ path: "../icons/icon-48-green.png" });
      } else if (message.command === "validationResult") {
        console.log(
          "Résultat de validation reçu (hors boucle potentiellement):",
          message.result
        );
        updateIcon(!message.result);
        browser.action.setIcon({
          path: message.result
            ? "../icons/icon-48-green.png"
            : "../icons/icon-48-red.png",
        });
      } else if (message.command === "loopProcessingStopped") {
        console.log(
          "Le script de contenu a arrêté la boucle de traitement. Raison:",
          message.reason
        );
        updatePopupUIForLoopState(false);

        if (
          statusMessage &&
          (message.reason === "error" ||
            message.reason === "error_during_step" ||
            message.reason === "not_on_controle_fiche_page" ||
            message.reason === "initialization_not_on_controle_fiche_page" ||
            message.reason === "processing_completed")
        ) {
          if (message.reason === "processing_completed") {
            statusMessage.textContent = "Traitement effectué";
          } else if (
            message.reason === "error" ||
            message.reason === "error_during_step"
          ) {
            statusMessage.textContent = "Boucle arrêtée: Erreur détectée.";
          } else {
            statusMessage.textContent =
              "Boucle arrêtée: Page incorrecte ou erreur.";
          }
        } else if (statusMessage && message.reason) {
          statusMessage.textContent = `Boucle arrêtée: ${message.reason}`;
        }

        if (
          message.reason === "error" ||
          message.reason === "error_during_step"
        ) {
          updateIcon(true);
          browser.action.setIcon({ path: "../icons/icon-48-red.png" });
        }
      }
    } else {
      if (message.command === "updateLoopStateFromBackground") {
        updatePopupUIForLoopState(message.isLooping);
      }
    }

    return false;
  });

  // Initialiser l'état initial
  (async () => {
    try {
      const activeScriptResponse = await browser.runtime.sendMessage({
        command: "getActiveScript",
      });

      if (activeScriptResponse && activeScriptResponse.success) {
        if (activeScriptResponse.activeScript === "alphaMatchers") {
          let tab = await getActiveTab();
          if (tab) {
            try {
              const checkResponse = await browser.tabs.sendMessage(tab.id, {
                command: "checkAlphaNumeric",
              });

              if (checkResponse && checkResponse.success) {
                updateIcon(!checkResponse.result);
              }
            } catch (error) {
              console.error("Erreur lors de la vérification initiale:", error);
              updateIcon(null);
            }
          }
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du statut initial:", error);
    }
  })();

  // Ajouter un observateur pour les changements d'état du bouton
  if (nextActionButton) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.attributeName === "class" &&
          mutation.target === nextActionButton
        ) {
          console.log(
            `Changement détecté sur le bouton: ${nextActionButton.className}`
          );
          if (nextActionButton.classList.contains("processing")) {
            if (statusDot) statusDot.classList.add("active");
            if (statusMessage) statusMessage.textContent = "Boucle active";
            if (nextActionIcon) nextActionIcon.className = "fas fa-stop";
            if (nextActionText) nextActionText.textContent = "Arrêter";
          } else {
            if (statusDot) statusDot.classList.remove("active");
          }
        }
      });
    });

    // Observer le bouton d'action
    observer.observe(nextActionButton, { attributes: true });
  }

  // Signaler que l'initialisation est terminée
  console.log("✅ Initialisation T41 Assistant terminée avec succès");
});
