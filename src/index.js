import { Game } from './core/Game';
import { AudioManager } from './managers/AudioManager';
import { LevelManager } from './managers/LevelManager';
import { UIManager } from './managers/UIManager';

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const gameContainer = document.getElementById('game-container');
const usernameInput = document.getElementById('username-input');
const startButton = document.getElementById('start-button');
const errorMessage = document.getElementById('error-message');

// Game state
let username = '';

// Event Listeners
usernameInput.addEventListener('input', handleUsernameInput);
startButton.addEventListener('click', startGame);

// Handle username input
function handleUsernameInput(event) {
    username = event.target.value.trim();
    
    if (username.length >= 3) {
        startButton.disabled = false;
        errorMessage.style.display = 'none';
    } else {
        startButton.disabled = true;
        errorMessage.style.display = 'block';
    }
}

// Start game
function startGame() {
    if (username.length < 3) return;

    // Save username
    localStorage.setItem('username', username);

    // Hide welcome screen and show game
    welcomeScreen.style.display = 'none';
    gameContainer.style.display = 'block';

    // Initialize game
    initGame();
}

// Initialize game
async function initGame() {
    try {
        // Create minimal game UI
        gameContainer.innerHTML = `
            <div id="game-ui">
                <div id="game-stats">
                    <div id="level">Level 1</div>
                    <div id="score">0 pts</div>
                    <div id="timer">2:00</div>
                </div>
                <div id="pause-btn">❚❚</div>
            </div>
            <div id="mobile-controls"></div>
            <div id="game-controls">
                <div class="control-text">WASD or Arrow Keys to move</div>
                <div class="control-text">Space to jump</div>
            </div>
        `;

        // Add clean UI styles
        const style = document.createElement('style');
        style.textContent = `
            #game-ui {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                padding: 20px;
                pointer-events: none;
                z-index: 100;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
            }
            #game-stats {
                background: rgba(0, 0, 0, 0.7);
                padding: 15px;
                border-radius: 10px;
                color: white;
                font-family: 'Arial', sans-serif;
                font-size: 18px;
                display: flex;
                gap: 20px;
                pointer-events: auto;
            }
            #pause-btn {
                background: rgba(0, 0, 0, 0.7);
                color: white;
                padding: 10px 15px;
                border-radius: 10px;
                cursor: pointer;
                pointer-events: auto;
                font-size: 20px;
                margin-left: 20px;
            }
            #game-controls {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.7);
                padding: 15px;
                border-radius: 10px;
                color: white;
                text-align: center;
                font-family: 'Arial', sans-serif;
                opacity: 0.7;
                transition: opacity 0.3s;
                pointer-events: none;
            }
            #game-controls:hover {
                opacity: 1;
            }
            .control-text {
                margin: 5px 0;
                font-size: 16px;
            }
            #mobile-controls {
                position: fixed;
                bottom: 20px;
                left: 20px;
                width: 120px;
                height: 120px;
                pointer-events: auto;
            }
        `;
        document.head.appendChild(style);

        // Initialize managers
        const audioManager = new AudioManager();
        const levelManager = new LevelManager();
        const uiManager = new UIManager();

        // Create game instance
        const game = new Game(audioManager, levelManager, uiManager);
        
        // Expose game instance globally for UI interactions
        window.game = game;
        
        // Add pause functionality
        const pauseBtn = document.getElementById('pause-btn');
        pauseBtn.addEventListener('click', () => {
            if (game.isRunning) {
                game.isRunning = false;
                pauseBtn.textContent = '▶';
                audioManager.stopAll();
            } else {
                game.isRunning = true;
                game.update();
                pauseBtn.textContent = '❚❚';
                audioManager.playBackgroundMusic();
            }
        });

        // Add keyboard controls
        document.addEventListener('keydown', (event) => {
            if (!game.isRunning) return;
            
            switch(event.code) {
                case 'Space':
                    game.player.jump();
                    audioManager.playSound('jump');
                    break;
                case 'KeyW':
                case 'ArrowUp':
                    game.player.moveForward();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    game.player.moveBackward();
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    game.player.moveLeft();
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    game.player.moveRight();
                    break;
            }
        });

        // Add keyup event to stop movement
        document.addEventListener('keyup', (event) => {
            if (!game.isRunning) return;
            
            switch(event.code) {
                case 'KeyW':
                case 'ArrowUp':
                case 'KeyS':
                case 'ArrowDown':
                case 'KeyA':
                case 'ArrowLeft':
                case 'KeyD':
                case 'ArrowRight':
                    game.player.stopMovement();
                    break;
            }
        });
        
        // Wait for player initialization
        await game.player.initializePlayer();
        
        // Resume audio context (needed for Chrome)
        await audioManager.audioContext.resume();
        
        // Start the game
        game.start();

    } catch (error) {
        console.error('Error initializing game:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            font-family: Arial, sans-serif;
        `;
        errorDiv.textContent = 'Error loading game. Please refresh the page.';
        document.body.appendChild(errorDiv);
    }
} 