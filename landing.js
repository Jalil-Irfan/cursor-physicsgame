document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements
    const landingScreen = document.getElementById('landing-screen');
    const gameScreen = document.getElementById('game-screen');
    const sponsorScreen = document.getElementById('sponsor-screen');
    const startButton = document.getElementById('start-game');
    const playerNameInput = document.getElementById('player-name');
    const playerDisplay = document.getElementById('player-display');

    // Check if all required elements exist
    if (!landingScreen || !gameScreen || !sponsorScreen || !startButton || !playerNameInput || !playerDisplay) {
        console.error('Required DOM elements not found');
        return;
    }

    // Initialize sponsor selection
    const sponsorSelect = new SponsorSelect((selectedSponsor) => {
        window.selectedSponsor = selectedSponsor;
        sponsorScreen.classList.add('hidden');
        gameScreen.classList.remove('hidden');
        initGame();
    });

    // Handle start button click
    startButton.addEventListener('click', () => {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            window.playerName = playerName;
            playerDisplay.textContent = `Agent: ${playerName}`;
            landingScreen.classList.add('hidden');
            sponsorScreen.classList.remove('hidden');
            sponsorSelect.show();
        } else {
            alert('Please enter your name');
        }
    });

    // Handle enter key press
    playerNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            startButton.click();
        }
    });
}); 