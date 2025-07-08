/**
 * T41 Assistant - Améliorations interactives
 * Ce fichier fournit des fonctionnalités interactives supplémentaires pour la popup
 */

// Attendre que le DOM soit chargé
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 T41 Assistant amélioré chargé");

  // Référence aux éléments de l'interface
  const nextActionButton = document.getElementById("next-action");
  const statusDot = document.getElementById("status-dot");
  const statusMessage = document.getElementById("status-message");
  const statusContainer = document.getElementById("status-container");
  const statusBadge = document.getElementById("status-badge");
  const progressContainer = document.getElementById("progress-container");
  const progressBar = document.getElementById("progress-value");
  const progressText = document.getElementById("progress-text");
  const scriptCard = document.getElementById("script-card");

  // Fonction pour mettre à jour l'interface utilisateur avec animation
  function updateUIWithProgress(isActive, progress = 0, hasError = false) {
    // Mise à jour du point de statut
    if (statusDot) {
      statusDot.classList.toggle("active", isActive && !hasError);
      statusDot.classList.toggle("error", hasError);
    }

    // Mise à jour du conteneur de statut
    if (statusContainer) {
      statusContainer.classList.toggle("active", isActive && !hasError);
      statusContainer.classList.toggle("error", hasError);
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
        progressText.textContent = `${progress}%`;
      }
    }

    // Mise à jour du bouton d'action
    if (nextActionButton) {
      const buttonIcon = nextActionButton.querySelector("i");
      const buttonText = nextActionButton.querySelector("span");

      if (isActive) {
        nextActionButton.classList.add("processing");
        if (buttonIcon) buttonIcon.className = "fas fa-stop";
        if (buttonText) buttonText.textContent = "Arrêter";
      } else {
        nextActionButton.classList.remove("processing");
        if (buttonIcon) buttonIcon.className = "fas fa-play";
        if (buttonText) buttonText.textContent = "Lancer";
      }
    }
  }

  // Simuler une progression pour la démonstration
  let demoProgress = 0;
  let demoInterval = null;

  // Ajouter un gestionnaire d'événements au bouton d'action
  if (nextActionButton) {
    nextActionButton.addEventListener("click", function () {
      const isActive = this.classList.contains("processing");

      if (isActive) {
        // Arrêter la simulation
        clearInterval(demoInterval);
        demoProgress = 0;
        updateUIWithProgress(false);
        showNotification("Traitement arrêté", "info");
      } else {
        // Démarrer la simulation
        updateUIWithProgress(true, demoProgress);
        showNotification("Traitement démarré", "success");

        // Simuler la progression
        demoInterval = setInterval(() => {
          demoProgress += Math.floor(Math.random() * 5) + 1;
          if (demoProgress >= 100) {
            demoProgress = 100;
            clearInterval(demoInterval);

            // Terminer après 1 seconde à 100%
            setTimeout(() => {
              updateUIWithProgress(false);
              demoProgress = 0;
              showNotification("Traitement effectué", "success");
            }, 1000);
          }
          updateUIWithProgress(true, demoProgress);
        }, 300);
      }
    });
  }

  // Fonction pour tester une erreur
  window.simulateError = function () {
    clearInterval(demoInterval);
    updateUIWithProgress(false, 0, true);
    showNotification("Une erreur est survenue", "error");
  };

  // Exposer la fonction updateUIWithProgress globalement pour le débogage
  window.updateUIWithProgress = updateUIWithProgress;
});
