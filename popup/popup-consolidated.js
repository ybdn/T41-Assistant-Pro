/**
 * T41 Assistant - Script JS consolidé
 * Ce fichier combine la logique principale et l'interface utilisateur
 */

// Variable globale pour vérifier si on est dans une fenêtre détachée
let isDetachedWindow = false;

// Vérifier si on est dans une fenêtre détachée
async function checkIfDetachedWindow() {
  try {
    // Vérifier si l'URL contient le paramètre detached
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('detached') === 'true';
  } catch (error) {
    console.error("Erreur lors de la vérification du type de fenêtre:", error);
    return false;
  }
}

// Attendre que le DOM soit chargé
document.addEventListener("DOMContentLoaded", async () => {
  console.log("🔄 T41 Assistant chargé !");

  // Vérifier si on est dans une fenêtre détachée
  isDetachedWindow = await checkIfDetachedWindow();
  console.log("Fenêtre détachée:", isDetachedWindow);

  // Récupérer les éléments de l'interface utilisateur
  const nextActionButton = document.getElementById("next-action");
  const iconTrigger = document.getElementById("icon-trigger");
  const appIcon = document.querySelector(".app-icon");
  const statusDot = document.getElementById("status-dot");
  const statusMessage = document.getElementById("status-message");
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-value");
  const progressText = document.getElementById("progress-text");
  const statusBadge = document.getElementById("status-badge");
  const scriptCard = document.getElementById("script-card");

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
    showNotification(
      "L'API browser n'est pas disponible. L'extension ne fonctionnera pas correctement.",
      "error"
    );
    return;
  }

  // Récupérer les sous-éléments du bouton avec sécurité
  let nextActionIcon = nextActionButton
    ? nextActionButton.querySelector("i")
    : null;
  let nextActionText = nextActionButton
    ? nextActionButton.querySelector("span")
    : null;

  // État de la boucle de traitement
  let popupLoopStateActive = false;
  let demoInterval = null;
  let demoProgress = 0;
  let lastRealProgressTime = null; // Pour suivre la dernière fois qu'une progression réelle a été reçue

  // Système de notification
  function showNotification(message, type = "info") {
    const notificationContainer = document.getElementById(
      "notification-container"
    );
    if (!notificationContainer) return;

    const notification = document.createElement("div");
    notification.className = `notification ${type}`;

    const icon = document.createElement("i");
    switch (type) {
      case "success":
        icon.className = "fas fa-check-circle";
        break;
      case "error":
        icon.className = "fas fa-exclamation-circle";
        break;
      case "warning":
        icon.className = "fas fa-exclamation-triangle";
        break;
      default:
        icon.className = "fas fa-info-circle";
    }

    const text = document.createElement("span");
    text.textContent = message;

    notification.appendChild(icon);
    notification.appendChild(text);
    notificationContainer.appendChild(notification);

    // Animation d'entrée
    setTimeout(() => {
      notification.classList.add("show");
    }, 10);

    // Disparition automatique
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notificationContainer.removeChild(notification);
      }, 300);
    }, 4000);
  }

  // Fonctions UI
  function updateUIWithProgress(isActive, progress = 0, hasError = false, currentDossier = null, totalDossiers = null) {
    // Mise à jour du point de statut
    if (statusDot) {
      statusDot.classList.toggle("active", isActive && !hasError);
      statusDot.classList.toggle("error", hasError);
    }

    // Mise à jour du badge de statut
    if (statusBadge) {
      statusBadge.classList.toggle("active", isActive && !hasError);
      statusBadge.classList.toggle("error", hasError);

      const badgeIcon = statusBadge.querySelector("i");
      const badgeText = statusBadge.querySelector("span");

      if (badgeIcon && badgeText) {
        if (hasError) {
          badgeIcon.className = "fas fa-exclamation-circle";
          badgeText.textContent = "Erreur";
        } else if (isActive) {
          badgeIcon.className = "fas fa-spinner fa-spin";
          badgeText.textContent = "En cours";
        } else {
          badgeIcon.className = "fas fa-circle-info";
          badgeText.textContent = "Prêt";
        }
      }
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

    // Mise à jour de la carte principale
    if (scriptCard) {
      scriptCard.classList.toggle("active-card", isActive && !hasError);
    }

    // Mise à jour de la barre de progression
    if (progressContainer) {
      progressContainer.style.display = isActive ? "block" : "none";

      if (isActive && progressBar && progressText) {
        progressBar.style.width = `${progress}%`;
        if (currentDossier !== null && totalDossiers !== null) {
          progressText.textContent = `${currentDossier}/${totalDossiers}`;
        } else {
          progressText.textContent = `${Math.round(progress)}%`;
        }
      }
    }

    // Mise à jour du bouton d'action
    if (nextActionButton) {
      if (isActive) {
        nextActionButton.classList.add("processing");
        if (nextActionIcon) nextActionIcon.className = "fas fa-stop";
        if (nextActionText) nextActionText.textContent = "Arrêter";
      } else {
        nextActionButton.classList.remove("processing");
        if (nextActionIcon) nextActionIcon.className = "fas fa-play";
        if (nextActionText) nextActionText.textContent = "Lancer";
      }
    }
  }

  // Mettre à jour l'interface utilisateur en fonction de l'état de la boucle
  function updatePopupUIForLoopState(
    isLooping,
    progress = 0,
    currentDossier = null,
    totalDossiers = null
  ) {
    popupLoopStateActive = isLooping;
    updateUIWithProgress(isLooping, progress, currentDossier, totalDossiers);
  }

  // Initialiser l'état de la boucle au chargement
  try {
    const data = await browser.storage.local.get("loopProcessingActive");
    updatePopupUIForLoopState(!!data.loopProcessingActive, 0, null, null);
  } catch (e) {
    console.error("Erreur lecture loopProcessingActive depuis storage:", e);
    updatePopupUIForLoopState(false, 0, null, null);
  }

  // Fonctions utilitaires
  async function getActiveTab() {
    try {
      // Chercher l'onglet actif dans toutes les fenêtres normales (pas les popups)
      // Important: Ne pas utiliser currentWindow: true car on est dans une fenêtre popup
      let tabs = await browser.tabs.query({
        active: true,
      });

      // Filtrer pour ne garder que les onglets des fenêtres normales (pas popup)
      for (let tab of tabs) {
        if (tab.id) {
          const window = await browser.windows.get(tab.windowId);
          if (window.type === 'normal') {
            console.log("Onglet actif trouvé:", tab.url);
            return tab;
          }
        }
      }

      console.error("Aucun onglet actif trouvé dans les fenêtres normales.");
      return null;
    } catch (error) {
      console.error("Erreur lors de la récupération des onglets :", error);
      return null;
    }
  }

  // GESTIONNAIRE D'ÉVÉNEMENTS PRINCIPAL DU BOUTON LANCER
  if (nextActionButton) {
    nextActionButton.addEventListener("click", async (event) => {
      console.log("🖱️ CLIC détecté sur le bouton d'action");

      try {
        let tab = await getActiveTab();
        if (!tab || !tab.id) {
          console.error(
            "❌ Aucun onglet actif trouvé ou l'onglet n'a pas d'ID."
          );
          showNotification(
            "Aucun onglet actif trouvé ou l'onglet n'a pas d'ID.",
            "error"
          );
          return;
        }

        if (popupLoopStateActive) {
          // Arrêter la simulation si elle est active
          if (demoInterval) {
            clearInterval(demoInterval);
            demoInterval = null;
          }

          // Arrêter le traitement
          console.log("Bouton 'Arrêter la Boucle' cliqué.");
          try {
            await browser.tabs.sendMessage(tab.id, {
              command: "stopLoopProcessing",
            });
            updatePopupUIForLoopState(false, 0, null, null);
            showNotification("Traitement arrêté", "info");
          } catch (error) {
            console.error(
              "Erreur lors de l'envoi de stopLoopProcessing:",
              error
            );
            showNotification(
              "Erreur lors de l'arrêt du traitement: " + error.message,
              "error"
            );
          }
        } else {
          // Lancer le traitement
          console.log("Bouton 'Lancer la Boucle' cliqué.");
          updatePopupUIForLoopState(true, 0, null, null);
          nextActionButton.disabled = true;
          showNotification("Traitement démarré", "success");

          try {
            console.log("Tentative d'injection du script alphaMatchers.js...");

            // Fonction pour vérifier si le script est déjà injecté
            async function checkScriptInjection(tabId) {
              try {
                const response = await browser.tabs.sendMessage(tabId, {
                  command: "ping",
                });
                console.log("Réponse au ping:", response);
                return response && response.pong;
              } catch (error) {
                console.log(
                  "Erreur lors du ping, script probablement non injecté:",
                  error
                );
                return false;
              }
            }

            // Vérifier d'abord si le script est déjà injecté
            const isInjected = await checkScriptInjection(tab.id);

            if (!isInjected) {
              console.log("Script non détecté, tentative d'injection...");
              try {
                await browser.scripting.executeScript({
                  target: { tabId: tab.id },
                  files: ["/content/alphaMatchers.js"],
                });
                console.log("Injection de content/alphaMatchers.js réussie.");
                await new Promise((resolve) => setTimeout(resolve, 500)); // Attendre que le script s'initialise
              } catch (injectionError) {
                console.warn(
                  "Échec de l'injection de content/alphaMatchers.js:",
                  injectionError
                );
                showNotification(
                  "Avertissement: Impossible d'injecter le script. Vérification de l'installation existante...",
                  "warning"
                );
              }
            } else {
              console.log("Script déjà injecté, pas besoin de réinjection");
            }

            // Pause pour permettre au script de s'initialiser
            await new Promise((resolve) => setTimeout(resolve, 300));

            // Envoyer la commande de démarrage
            const response = await browser.tabs.sendMessage(tab.id, {
              command: "startLoopProcessing",
            });

            console.log("Réponse de startLoopProcessing:", response);

            if (response && response.success) {
              // Initialiser l'interface utilisateur avec la boucle active
              updatePopupUIForLoopState(true, 0, null, null);

              // Simuler la progression pour l'effet visuel en attendant les mises à jour réelles
              demoProgress = 0;
              demoInterval = setInterval(() => {
                demoProgress += Math.floor(Math.random() * 5) + 1;
                if (demoProgress >= 95) {
                  demoProgress = 95; // Plafond à 95% pendant le traitement actif
                }
                // On n'utilise la progression simulée que si aucune mise à jour réelle n'a été reçue récemment
                if (
                  !lastRealProgressTime ||
                  Date.now() - lastRealProgressTime > 3000
                ) {
                  updatePopupUIForLoopState(true, demoProgress, null, null);
                }
              }, 500);

              if (response.validationResult === false) {
                updatePopupUIForLoopState(false, 0, null, null);
                showNotification("Échec de validation des données", "error");
              }
            } else {
              showNotification(
                "Impossible de démarrer le traitement. Vérifiez la console.",
                "error"
              );
              updatePopupUIForLoopState(false, 0, null, null);
            }
          } catch (error) {
            console.error(
              "Erreur lors de l'envoi de startLoopProcessing:",
              error
            );
            showNotification(
              "Erreur de communication: " +
                error.message +
                ". Le script est-il bien injecté sur la page FAED ?",
              "error"
            );
            updatePopupUIForLoopState(false, 0, null, null);
          } finally {
            nextActionButton.disabled = false;
          }
        }
      } catch (globalError) {
        console.error(
          "❌ Erreur globale lors du clic sur le bouton:",
          globalError
        );
        showNotification(
          "Une erreur s'est produite: " + globalError.message,
          "error"
        );
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
        showNotification("Aucun onglet actif trouvé", "error");
        return;
      }

      try {
        const response = await browser.tabs.sendMessage(tab.id, {
          command: "checkAlphaNumeric",
        });

        console.log("Réponse reçue:", response);
        if (response && response.success) {
          if (response.result) {
            showNotification("Vérification réussie !", "success");
          } else {
            showNotification("Données incorrectes détectées", "warning");
          }
        } else {
          console.error("Erreur lors de la vérification");
          showNotification("Erreur lors de la vérification", "error");
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors de l'exécution d'alphaMatchers.js :",
          error
        );
        showNotification("Tentative d'injection du script...", "info");

        try {
          console.log("Tentative d'injection du script alphaMatchers.js...");

          await browser.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["/content/alphaMatchers.js"],
          });

          console.log("Script injecté, nouvelle tentative de vérification...");
          showNotification("Script injecté avec succès", "success");

          await new Promise((resolve) => setTimeout(resolve, 500));

          const retryResponse = await browser.tabs.sendMessage(tab.id, {
            command: "checkAlphaNumeric",
          });

          if (retryResponse && retryResponse.success) {
            if (retryResponse.result) {
              showNotification("Vérification réussie !", "success");
            } else {
              showNotification("Données incorrectes détectées", "warning");
            }
          } else {
            console.error("Échec de la vérification");
            showNotification("Échec de la vérification", "error");
          }
        } catch (injectionError) {
          console.error("Échec de l'injection du script:", injectionError);
          showNotification("Échec de l'injection du script", "error");
        }
      }
    });
  }

  // Gérer les messages venant du script de contenu
  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message reçu dans popup.js:", message);

    if (sender.tab) {
      if (
        message.command === "progressUpdate" &&
        message.progressPercentage !== undefined
      ) {
        // Mise à jour de la progression réelle à partir de "Dossier en cours"
        console.log(
          `Mise à jour de progression reçue: ${message.progressPercentage}%`
        );
        if (popupLoopStateActive) {
          // Mettre à jour le timestamp de la dernière progression réelle
          lastRealProgressTime = Date.now();
          // Remplacer la progression simulée par la progression réelle
          updatePopupUIForLoopState(
            true,
            message.progressPercentage,
            message.currentDossier,
            message.totalDossiers
          );
        }
      } else if (message.command === "stepCompleted") {
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
        // Si le traitement est terminé, mettre la progression à 100%
        if (demoInterval) {
          clearInterval(demoInterval);
          demoInterval = null;
          demoProgress = 100;
          updatePopupUIForLoopState(true, demoProgress, null, null);

          // Terminer après 1 seconde à 100%
          setTimeout(() => {
            updatePopupUIForLoopState(false, 0, null, null);
            demoProgress = 0;
            showNotification("Traitement effectué", "success");
          }, 1000);
        }
      } else if (message.status === "done") {
        console.log("Traitement terminé reçu avec status 'done'");

        // Si le message contient une progression réelle, l'utiliser
        if (message.progressPercentage !== undefined) {
          console.log(
            `Progression finale reçue: ${message.progressPercentage}%`
          );
          // Mettre à jour le timestamp de la dernière progression réelle
          lastRealProgressTime = Date.now();
          // Arrêter la progression simulée si elle est active
          if (demoInterval) {
            clearInterval(demoInterval);
            demoInterval = null;
          }
          // Afficher la progression finale réelle
          updatePopupUIForLoopState(true, message.progressPercentage, message.currentDossier, message.totalDossiers);
        } else {
          // Fallback sur 100% si aucune progression n'est fournie
          if (demoInterval) {
            clearInterval(demoInterval);
            demoInterval = null;
            demoProgress = 100;
            updatePopupUIForLoopState(true, demoProgress, null, null);
          }
        }

        // Terminer après 1 seconde
        setTimeout(() => {
            updatePopupUIForLoopState(false, 0, null, null);
            demoProgress = 0;
            lastRealProgressTime = null; // Réinitialiser le timestamp
            showNotification("Traitement effectué", "success");
          }, 1000);
      } else if (message.command === "validationResult") {
        console.log(
          "Résultat de validation reçu (hors boucle potentiellement):",
          message.result
        );
        showNotification(
          message.result ? "Validation réussie" : "Validation échouée",
          message.result ? "success" : "error"
        );
      } else if (message.command === "loopProcessingStopped") {
        console.log(
          "Le script de contenu a arrêté la boucle de traitement. Raison:",
          message.reason
        );
        updatePopupUIForLoopState(false);

        // Arrêter la simulation de progression
        if (demoInterval) {
          clearInterval(demoInterval);
          demoInterval = null;
        }

        if (
          message.reason === "error" ||
          message.reason === "error_during_step"
        ) {
          showNotification("Erreur détectée pendant le traitement", "error");
        } else if (message.reason === "processing_completed") {
          showNotification("Traitement effectué", "success");
        } else if (
          message.reason === "not_on_controle_fiche_page" ||
          message.reason === "initialization_not_on_controle_fiche_page"
        ) {
          showNotification(
            "Page incorrecte. Veuillez ouvrir une fiche de contrôle.",
            "warning"
          );
        } else {
          showNotification("Traitement arrêté: " + message.reason, "info");
        }
      }
    } else {
      if (message.command === "updateLoopStateFromBackground") {
        updatePopupUIForLoopState(message.isLooping, 0, null, null);
      }
    }

    return false;
  });

  // Écouter l'événement de fermeture de la fenêtre
  window.addEventListener('beforeunload', async (event) => {
    console.log("Fermeture de la fenêtre détectée");

    // Si le script est actif, l'arrêter
    if (popupLoopStateActive) {
      console.log("Arrêt du script en cours à cause de la fermeture de la fenêtre...");
      try {
        const tab = await getActiveTab();
        if (tab && tab.id) {
          await browser.tabs.sendMessage(tab.id, {
            command: "stopLoopProcessing",
          });
        }
      } catch (error) {
        console.error("Erreur lors de l'arrêt du script:", error);
      }
    }

    // Nettoyer le storage local
    await browser.storage.local.remove('detachedWindowId');
  });

  // Signaler que l'initialisation est terminée
  console.log("✅ Initialisation T41 Assistant terminée avec succès");
});

// Système de thème
document.addEventListener("DOMContentLoaded", function () {
  const themeSwitch = document.getElementById("theme-switch");
  const themeIcon = themeSwitch ? themeSwitch.querySelector("i") : null;

  // Vérifier si le thème sombre est déjà activé
  const isDarkTheme = localStorage.getItem("t41-dark-theme") === "true";

  // Appliquer le thème au chargement
  if (isDarkTheme) {
    document.body.classList.add("dark-theme");
    if (themeIcon) themeIcon.className = "fas fa-sun";
  } else {
    document.body.classList.remove("dark-theme");
    if (themeIcon) themeIcon.className = "fas fa-moon";
  }

  // Gestionnaire pour le bouton de changement de thème
  if (themeSwitch) {
    themeSwitch.addEventListener("click", function () {
      // Ajouter une classe temporaire pour l'animation
      document.body.classList.add("theme-transition");

      // Basculer le thème avec un délai pour permettre l'animation
      setTimeout(() => {
        const isDark = document.body.classList.toggle("dark-theme");
        localStorage.setItem("t41-dark-theme", isDark);

        if (themeIcon) {
          themeIcon.className = isDark ? "fas fa-sun" : "fas fa-moon";
        }

        // Retirer la classe d'animation après un délai
        setTimeout(() => {
          document.body.classList.remove("theme-transition");
        }, 400);
      }, 50);
    });
  }
});

// Exposer les fonctions pour le débogage
window.showNotification = function (message, type) {
  const notificationContainer = document.getElementById(
    "notification-container"
  );
  if (!notificationContainer) return;

  const notification = document.createElement("div");
  notification.className = `notification ${type || "info"}`;

  const icon = document.createElement("i");
  switch (type) {
    case "success":
      icon.className = "fas fa-check-circle";
      break;
    case "error":
      icon.className = "fas fa-exclamation-circle";
      break;
    case "warning":
      icon.className = "fas fa-exclamation-triangle";
      break;
    default:
      icon.className = "fas fa-info-circle";
  }

  const text = document.createElement("span");
  text.textContent = message;

  notification.appendChild(icon);
  notification.appendChild(text);
  notificationContainer.appendChild(notification);

  // Animation d'entrée
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Disparition automatique
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notificationContainer.removeChild(notification);
    }, 300);
  }, 4000);
};

document.addEventListener("DOMContentLoaded", async () => {
  // ...existing code...
});
