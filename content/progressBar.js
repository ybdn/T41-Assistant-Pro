// Extension pour ajouter une barre de progression à la boîte de dialogue de confirmation
(function () {
  "use strict"; // Mode strict pour éviter les erreurs courantes

  // Variables pour stocker l'état
  let progressBarContainer = null;
  let progressBarElement = null;
  let progressTextElement = null;
  let observerActive = false;
  let updateIntervals = []; // Stocker les références aux intervalles pour nettoyage

  // Configuration du style de la barre de progression
  const PROGRESS_STYLES = {
    container: `
            width: 100%;
            background-color: #f0f0f0;
            border-radius: 4px;
            height: 14px;
            overflow: hidden;
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.1);
            position: relative;
        `,
    bar: `
            height: 100%;
            background-color: #4caf50;
            width: 0%;
            transition: width 0.3s ease;
            border-radius: 4px;
        `,
    text: `
            text-align: center;
            margin-top: 5px;
            font-size: 12px;
            color: #444;
            font-family: Arial, sans-serif;
        `,
  };

  // Fonction pour extraire les informations du dossier en cours
  function getDossierProgress() {
    try {
      // Utiliser la fonction globale d'alphaMatchers.js si elle existe
      if (window.t41_getDossierProgress) {
        return window.t41_getDossierProgress();
      }

      // Sinon, utiliser notre propre implémentation
      // Sélectionner l'élément input qui contient la valeur dossier en cours
      const dossierInput = document.querySelector(
        "#formValidationCorrection\\:j_idt465"
      );

      let dossierValue = null;

      // Chercher par label si l'ID spécifique ne fonctionne pas
      if (!dossierInput) {
        const labels = Array.from(document.querySelectorAll("label"));
        const dossierLabel = labels.find((label) =>
          label.textContent.trim().includes("Dossier en cours")
        );

        if (dossierLabel) {
          // Trouver l'input suivant l'étiquette
          const inputId = dossierLabel.getAttribute("for");
          if (inputId) {
            dossierValue = document.getElementById(inputId)?.value || null;
          }

          // Si l'attribut "for" n'est pas disponible, essayer de trouver l'input adjacent
          const parentRow = dossierLabel.closest("tr");
          if (parentRow) {
            dossierValue =
              parentRow.querySelector("input[type='text']")?.value || null;
          }
        }
      } else {
        dossierValue = dossierInput.value;
      }

      if (!dossierValue)
        return { current: null, total: null, dossierValue: null };

      // Format attendu: "2/4"
      const parts = dossierValue.split("/");
      if (parts.length !== 2)
        return { current: null, total: null, dossierValue: dossierValue };

      const current = parseInt(parts[0], 10);
      const total = parseInt(parts[1], 10);

      if (isNaN(current) || isNaN(total) || total === 0)
        return { current: null, total: null, dossierValue: dossierValue };

      return { current, total, dossierValue };
    } catch (error) {
      console.error(
        "Erreur lors de la récupération du dossier en cours:",
        error
      );
      return { current: null, total: null, dossierValue: null };
    }
  }

  // Fonction pour calculer le pourcentage de progression
  function calculateProgressPercentage(current, total) {
    // Utiliser la fonction globale d'alphaMatchers.js si elle existe
    if (
      window.t41_calculateProgressPercentage &&
      typeof window.t41_calculateProgressPercentage === "function"
    ) {
      try {
        return window.t41_calculateProgressPercentage(current, total);
      } catch (error) {
        console.error(
          "T41: Erreur lors de l'appel à t41_calculateProgressPercentage:",
          error
        );
        // Si l'appel échoue, on continue avec notre propre implémentation
      }
    }

    // Vérifications de validité renforcées
    if (
      current === null ||
      total === null ||
      total === 0 ||
      isNaN(current) ||
      isNaN(total) ||
      typeof current !== "number" ||
      typeof total !== "number"
    ) {
      return null;
    }

    // Limiter le pourcentage entre 0 et 100
    const percentage = Math.round((current / total) * 100);
    return Math.max(0, Math.min(100, percentage));
  }

  // Fonction pour créer et injecter la barre de progression
  function createProgressBar(dialogElement) {
    if (progressBarContainer) return; // Éviter la duplication

    try {
      // Vérifier si une autre barre existe déjà (peut-être créée par une autre instance)
      const existingProgressTable =
        document.getElementById("t41-progress-table");
      if (existingProgressTable) {
        console.log(
          "T41: Barre de progression déjà présente, suppression de l'ancienne instance"
        );
        existingProgressTable.remove();
      }

      // Créer un tableau pour contenir la barre de progression (plus compatible avec le style existant)
      const progressTable = document.createElement("table");
      progressTable.id = "t41-progress-table";
      progressTable.className = "ui-panelgrid ui-widget";
      progressTable.style.cssText =
        "margin-left: auto; margin-right: auto; margin-top: 5px; margin-bottom: 10px;";
      progressTable.setAttribute("role", "grid");

      const tbody = document.createElement("tbody");
      const tr = document.createElement("tr");
      tr.className = "ui-widget-content";
      tr.setAttribute("role", "row");

      const td = document.createElement("td");
      td.setAttribute("role", "gridcell");
      td.className = "ui-panelgrid-cell";

      // Créer le conteneur de la barre de progression
      progressBarContainer = document.createElement("div");
      progressBarContainer.id = "t41-progress-container";
      progressBarContainer.style.cssText = PROGRESS_STYLES.container;

      // Créer la barre elle-même
      progressBarElement = document.createElement("div");
      progressBarElement.id = "t41-progress-bar";
      progressBarElement.style.cssText = PROGRESS_STYLES.bar;

      // Créer le texte de progression
      progressTextElement = document.createElement("div");
      progressTextElement.id = "t41-progress-text";
      progressTextElement.style.cssText = PROGRESS_STYLES.text;

      // Assembler les éléments selon la hiérarchie DOM du site
      progressBarContainer.appendChild(progressBarElement);
      td.appendChild(progressBarContainer);
      td.appendChild(progressTextElement);
      tr.appendChild(td);
      tbody.appendChild(tr);
      progressTable.appendChild(tbody);

      // Trouver l'endroit où insérer la barre (après la table j_idt462)
      // On cherche d'abord la table des boutons pour insérer avant elle
      const buttonsTable = dialogElement.querySelector(
        "#formValidationCorrection\\:j_idt466"
      );

      if (buttonsTable) {
        // Insérer avant la table des boutons
        buttonsTable.parentNode.insertBefore(progressTable, buttonsTable);

        // Mettre à jour la progression initiale
        updateProgressBar();
      } else {
        // Fallback si on ne trouve pas la table des boutons
        const targetTable = dialogElement.querySelector(
          "#formValidationCorrection\\:j_idt462"
        );

        if (targetTable) {
          // Insérer après le tableau qui contient le texte "Dossier en cours"
          targetTable.parentNode.insertBefore(
            progressTable,
            targetTable.nextSibling
          );

          // Mettre à jour la progression initiale
          updateProgressBar();
        }
      }
    } catch (error) {
      console.error(
        "T41: Erreur lors de la création de la barre de progression:",
        error
      );
    }
  }

  // Fonction pour mettre à jour la barre de progression
  function updateProgressBar() {
    if (!progressBarElement || !progressTextElement) return;

    try {
      const { current, total, dossierValue } = getDossierProgress();
      const percentage = calculateProgressPercentage(current, total);

      // Vérifier la validité des données avant mise à jour
      if (
        percentage !== null &&
        !isNaN(percentage) &&
        percentage >= 0 &&
        percentage <= 100
      ) {
        progressBarElement.style.width = `${percentage}%`;
        progressTextElement.textContent = `${percentage}% (${dossierValue})`;
      } else if (dossierValue) {
        progressBarElement.style.width = "0%";
        progressTextElement.textContent = `${dossierValue}`;
      } else {
        progressBarElement.style.width = "0%";
        progressTextElement.textContent = "Chargement...";
      }
    } catch (error) {
      console.error(
        "T41: Erreur lors de la mise à jour de la barre de progression:",
        error
      );
      // Réinitialiser à un état connu en cas d'erreur
      progressBarElement.style.width = "0%";
      progressTextElement.textContent = "Erreur de chargement";
    }
  }

  // Fonction pour recevoir les mises à jour d'alphaMatchers.js
  function updateProgressBarFromAlphaMatchers(current, total, dossierValue) {
    if (!progressBarElement || !progressTextElement) return;

    try {
      // Vérifier la validité des paramètres
      if (
        current === undefined ||
        total === undefined ||
        dossierValue === undefined
      ) {
        console.error("T41: Paramètres invalides reçus de alphaMatchers.js");
        return;
      }

      const percentage = calculateProgressPercentage(current, total);

      // Vérifier la validité du pourcentage calculé
      if (
        percentage !== null &&
        !isNaN(percentage) &&
        percentage >= 0 &&
        percentage <= 100
      ) {
        progressBarElement.style.width = `${percentage}%`;
        progressTextElement.textContent = `${percentage}% (${dossierValue})`;
      } else if (dossierValue) {
        progressBarElement.style.width = "0%";
        progressTextElement.textContent = `${dossierValue}`;
      }
    } catch (error) {
      console.error(
        "T41: Erreur lors de la mise à jour depuis alphaMatchers:",
        error
      );
      // Réinitialiser à un état connu en cas d'erreur
      progressBarElement.style.width = "0%";
      progressTextElement.textContent = "Erreur de chargement";
    }
  }

  // Exposer la fonction de mise à jour pour alphaMatchers.js
  window.t41_updateProgressBarFromAlphaMatchers =
    updateProgressBarFromAlphaMatchers;

  // Fonction de nettoyage partagée avec alphaMatchers.js
  function cleanupProgressBar() {
    try {
      // Arrêter tous les intervalles
      updateIntervals.forEach((interval) => clearInterval(interval));
      updateIntervals = [];

      // Réinitialiser les variables
      progressBarContainer = null;
      progressBarElement = null;
      progressTextElement = null;

      // Supprimer la barre de progression du DOM si elle existe encore
      const existingProgressTable =
        document.getElementById("t41-progress-table");
      if (existingProgressTable) {
        existingProgressTable.remove();
      }

      // Réinitialiser la référence au dialogue
      window.t41_currentDialogElement = null;

      console.log("T41: Nettoyage de la barre de progression effectué");
    } catch (error) {
      console.error(
        "T41: Erreur lors du nettoyage de la barre de progression:",
        error
      );
    }
  }

  // Exposer la fonction de nettoyage pour alphaMatchers.js
  window.t41_cleanupProgressBar = cleanupProgressBar;

  // Observer pour détecter l'apparition de la boîte de dialogue
  function startObserver() {
    if (observerActive) return;

    try {
      // Vérifier si alphaMatchers.js a déjà détecté le dialogue
      if (
        window.t41_currentDialogElement &&
        document.body.contains(window.t41_currentDialogElement)
      ) {
        console.log(
          "T41: Utilisation du dialogue déjà détecté par alphaMatchers.js"
        );
        createProgressBar(window.t41_currentDialogElement);
      }

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                // Vérifier si c'est la boîte de dialogue de confirmation ou si elle est dedans
                const dialogId =
                  "formValidationCorrection:dialogueTerminerValidation";
                const dialogElement =
                  node.id === dialogId
                    ? node
                    : node.querySelector(`#${dialogId.replace(/:/g, "\\:")}`);

                if (
                  dialogElement &&
                  dialogElement.classList.contains("ui-dialog")
                ) {
                  console.log(
                    "T41: Boîte de dialogue de confirmation détectée"
                  );

                  // Stocker la référence au dialogue pour alphaMatchers.js
                  window.t41_currentDialogElement = dialogElement;

                  // Mettre un délai court pour s'assurer que la boîte est complètement chargée
                  setTimeout(() => {
                    createProgressBar(dialogElement);

                    // Configurer un intervalle pour mettre à jour la barre
                    const updateInterval = setInterval(() => {
                      if (document.body.contains(dialogElement)) {
                        // Utiliser notre propre fonction de mise à jour seulement si alphaMatchers.js
                        // n'est pas en train de mettre à jour la barre de progression
                        if (!window.t41_isUpdatingProgressBar) {
                          updateProgressBar();
                        }
                      } else {
                        // La boîte de dialogue a été fermée, nettoyer
                        clearInterval(updateInterval);
                        const index = updateIntervals.indexOf(updateInterval);
                        if (index > -1) {
                          updateIntervals.splice(index, 1);
                        }
                        // Réinitialiser les références
                        window.t41_currentDialogElement = null;
                        progressBarContainer = null;
                        progressBarElement = null;
                        progressTextElement = null;
                      }
                    }, 500);

                    // Stocker la référence à l'intervalle pour nettoyage ultérieur
                    updateIntervals.push(updateInterval);
                  }, 100);
                }
              }
            });
          }
        });
      });

      // Observer les changements dans le body avec configuration optimisée
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: false,
        characterData: false,
      });

      observerActive = true;
      console.log("T41: Observateur de boîte de dialogue démarré");
    } catch (error) {
      console.error("T41: Erreur lors du démarrage de l'observateur:", error);
    }
  }

  // Initialiser l'extension
  function init() {
    console.log("T41: Initialisation de la barre de progression");

    try {
      // Vérifier si alphaMatchers.js est chargé
      const alphaMatchersLoaded =
        typeof window.t41_getDossierProgress === "function";
      if (!alphaMatchersLoaded) {
        console.log(
          "T41: alphaMatchers.js n'est pas encore chargé, attente..."
        );
        // Attendre que alphaMatchers.js soit chargé (maximum 3 secondes)
        let waitCount = 0;
        const waitInterval = setInterval(() => {
          if (typeof window.t41_getDossierProgress === "function") {
            clearInterval(waitInterval);
            console.log(
              "T41: alphaMatchers.js maintenant chargé, initialisation"
            );
            initAfterDependencies();
          } else if (waitCount > 6) {
            // 3 secondes (6 * 500ms)
            clearInterval(waitInterval);
            console.log(
              "T41: alphaMatchers.js non détecté, initialisation autonome"
            );
            initAfterDependencies();
          }
          waitCount++;
        }, 500);
      } else {
        initAfterDependencies();
      }
    } catch (error) {
      console.error("T41: Erreur lors de l'initialisation:", error);
      // Fallback à l'initialisation standard en cas d'erreur
      initAfterDependencies();
    }
  }

  // Fonction d'initialisation après vérification des dépendances
  function initAfterDependencies() {
    try {
      // Vérifier si la page est bien chargée avant de démarrer l'observateur
      if (document.readyState === "complete") {
        startObserver();

        // Vérifier si la boîte de dialogue est déjà présente
        setTimeout(() => {
          const existingDialog = document.querySelector(
            "#formValidationCorrection\\:dialogueTerminerValidation"
          );

          if (
            existingDialog &&
            existingDialog.classList.contains("ui-dialog") &&
            existingDialog.style.display !== "none" &&
            existingDialog.style.visibility !== "hidden"
          ) {
            console.log("T41: Boîte de dialogue déjà présente au chargement");
            createProgressBar(existingDialog);
          }
        }, 500); // Attendre un peu pour s'assurer que la page est stable
      } else {
        // Si la page n'est pas complètement chargée, attendre
        window.addEventListener("load", () => {
          setTimeout(() => {
            startObserver();

            // Vérifier après le chargement complet
            const existingDialog = document.querySelector(
              "#formValidationCorrection\\:dialogueTerminerValidation"
            );

            if (
              existingDialog &&
              existingDialog.classList.contains("ui-dialog") &&
              existingDialog.style.display !== "none" &&
              existingDialog.style.visibility !== "hidden"
            ) {
              console.log(
                "T41: Boîte de dialogue trouvée après chargement complet"
              );
              createProgressBar(existingDialog);
            }
          }, 500);
        });
      }
    } catch (error) {
      console.error(
        "T41: Erreur lors de l'initialisation post-dépendances:",
        error
      );
    }
  }

  // Démarrer l'extension lorsque la page est complètement chargée
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Nettoyer lors du déchargement de la page
  window.addEventListener("beforeunload", () => {
    // Arrêter tous les intervalles
    updateIntervals.forEach((interval) => clearInterval(interval));
    updateIntervals = [];
  });
})();
