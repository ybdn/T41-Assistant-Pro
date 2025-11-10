// Easter Egg Initializer - Click on version to launch Space Invaders
// This script adds the click event to launch the game

document.addEventListener('DOMContentLoaded', function() {
  const versionInfo = document.querySelector('.version-info');

  if (versionInfo) {
    // Add click event to version element
    versionInfo.addEventListener('click', function() {
      console.log('🎮 T41 Space Invaders Easter Egg activated!');
      initSpaceInvaders();
    });

    // Secret: Double-click for instant high score mode (just for fun)
    let clickCount = 0;
    let clickTimer = null;

    versionInfo.addEventListener('dblclick', function() {
      clickCount++;
      if (clickCount >= 3) {
        console.log('🏆 Secret mode activated!');
        clickCount = 0;
      }
    });
  }
});
