document.addEventListener('DOMContentLoaded', () => {
    const landingScreen = document.getElementById('landing-screen');
    const gameScreen = document.getElementById('game-screen');
    const playerNameInput = document.getElementById('player-name');
    const startGameButton = document.getElementById('start-game');
    const playerDisplay = document.getElementById('player-display');

    // Handle game start
    startGameButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            // Store player name
            window.playerName = playerName;
            
            // Update display
            playerDisplay.textContent = `Player: ${playerName}`;
            
            // Switch screens
            landingScreen.classList.add('hidden');
            gameScreen.classList.remove('hidden');
            
            // Initialize game
            initGame();
        } else {
            alert('Please enter your name!');
        }
    });

    // Handle enter key
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startGameButton.click();
        }
    });
}); 