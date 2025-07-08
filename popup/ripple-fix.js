/**
 * T41 Assistant - Gestion des effets visuels
 * Ce script gère les effets visuels des boutons pour garantir une expérience utilisateur fluide
 */

document.addEventListener("DOMContentLoaded", function () {
  // Sélectionne tous les boutons qui ont des effets de ripple
  const buttonsWithRipple = document.querySelectorAll(".icon-button, .btn");

  // Ajoute un gestionnaire d'événements pour réinitialiser l'effet après le clic
  buttonsWithRipple.forEach((button) => {
    button.addEventListener("click", function (e) {
      // Ajoute une classe temporaire pour l'animation
      this.classList.add("ripple-active");

      // Supprime la classe après la fin de l'animation pour réinitialiser l'effet
      setTimeout(() => {
        this.classList.remove("ripple-active");
      }, 600); // 600ms correspond à la durée de notre animation resetRipple
    });

    // Assure-toi que l'effet est réinitialisé même si l'utilisateur déplace la souris pendant le clic
    button.addEventListener("mouseup", function () {
      // Force la réinitialisation de l'état visuel du bouton
      const before = this.querySelector("::before");
      if (before) {
        before.style.width = "0";
        before.style.height = "0";
        before.style.opacity = "0";
      }
    });

    // Ajoute un gestionnaire pour le cas où l'utilisateur quitte le bouton pendant le clic
    button.addEventListener("mouseleave", function () {
      this.classList.remove("ripple-active");
    });
  });

  // Ajoute une classe spécifique pour les styles
  document.documentElement.classList.add("ripple-fix-applied");
});
