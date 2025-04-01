export class UIManager {
    constructor() {
        this.elements = {
            timer: document.getElementById('timer'),
            score: document.getElementById('score'),
            level: document.getElementById('level'),
            mobileControls: document.getElementById('mobile-controls')
        };

        this.createUI();
        this.setupEventListeners();
    }

    createUI() {
        // Create pause menu
        this.createPauseMenu();

        // Create level complete overlay
        this.createLevelCompleteOverlay();

        // Create game over overlay
        this.createGameOverOverlay();

        // Create settings menu
        this.createSettingsMenu();
    }

    createPauseMenu() {
        const pauseMenu = document.createElement('div');
        pauseMenu.id = 'pause-menu';
        pauseMenu.className = 'overlay hidden';
        pauseMenu.innerHTML = `
            <div class="menu-content">
                <h2>Paused</h2>
                <button id="resume-btn">Resume</button>
                <button id="settings-btn">Settings</button>
                <button id="quit-btn">Quit</button>
            </div>
        `;
        document.body.appendChild(pauseMenu);
        this.elements.pauseMenu = pauseMenu;
    }

    createLevelCompleteOverlay() {
        const levelComplete = document.createElement('div');
        levelComplete.id = 'level-complete';
        levelComplete.className = 'overlay hidden';
        levelComplete.innerHTML = `
            <div class="menu-content">
                <h2>Level Complete!</h2>
                <div class="score-display">Score: <span id="level-score">0</span></div>
                <button id="next-level-btn">Next Level</button>
                <button id="retry-btn">Retry</button>
            </div>
        `;
        document.body.appendChild(levelComplete);
        this.elements.levelComplete = levelComplete;
    }

    createGameOverOverlay() {
        const gameOver = document.createElement('div');
        gameOver.id = 'game-over';
        gameOver.className = 'overlay hidden';
        gameOver.innerHTML = `
            <div class="menu-content">
                <h2>Game Over</h2>
                <div class="final-score">Final Score: <span id="final-score">0</span></div>
                <button id="restart-btn">Restart Game</button>
                <button id="main-menu-btn">Main Menu</button>
            </div>
        `;
        document.body.appendChild(gameOver);
        this.elements.gameOver = gameOver;
    }

    createSettingsMenu() {
        const settings = document.createElement('div');
        settings.id = 'settings-menu';
        settings.className = 'overlay hidden';
        settings.innerHTML = `
            <div class="menu-content">
                <h2>Settings</h2>
                <div class="setting-item">
                    <label for="volume-slider">Volume</label>
                    <input type="range" id="volume-slider" min="0" max="100" value="50">
                </div>
                <div class="setting-item">
                    <label for="music-toggle">Music</label>
                    <input type="checkbox" id="music-toggle" checked>
                </div>
                <div class="setting-item">
                    <label for="sfx-toggle">Sound Effects</label>
                    <input type="checkbox" id="sfx-toggle" checked>
                </div>
                <button id="back-btn">Back</button>
            </div>
        `;
        document.body.appendChild(settings);
        this.elements.settings = settings;
    }

    setupEventListeners() {
        // Pause menu events
        document.getElementById('resume-btn')?.addEventListener('click', () => this.hidePauseMenu());
        document.getElementById('settings-btn')?.addEventListener('click', () => this.showSettings());
        document.getElementById('quit-btn')?.addEventListener('click', () => this.quitGame());

        // Level complete events
        document.getElementById('next-level-btn')?.addEventListener('click', () => this.onNextLevel());
        document.getElementById('retry-btn')?.addEventListener('click', () => this.onRetry());

        // Game over events
        document.getElementById('restart-btn')?.addEventListener('click', () => this.onRestart());
        document.getElementById('main-menu-btn')?.addEventListener('click', () => this.onMainMenu());

        // Settings events
        document.getElementById('back-btn')?.addEventListener('click', () => this.hideSettings());
        document.getElementById('volume-slider')?.addEventListener('input', (e) => this.onVolumeChange(e));
        document.getElementById('music-toggle')?.addEventListener('change', (e) => this.onMusicToggle(e));
        document.getElementById('sfx-toggle')?.addEventListener('change', (e) => this.onSFXToggle(e));

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Escape') {
                this.togglePauseMenu();
            }
        });
    }

    update(gameState) {
        // Update timer
        this.elements.timer.textContent = `Time: ${Math.ceil(gameState.timeRemaining)}`;

        // Update score
        this.elements.score.textContent = `Score: ${gameState.score}`;

        // Update level
        this.elements.level.textContent = `Level: ${gameState.level}`;
    }

    showPauseMenu() {
        this.elements.pauseMenu.classList.remove('hidden');
    }

    hidePauseMenu() {
        this.elements.pauseMenu.classList.add('hidden');
    }

    togglePauseMenu() {
        if (this.elements.pauseMenu.classList.contains('hidden')) {
            this.showPauseMenu();
        } else {
            this.hidePauseMenu();
        }
    }

    showLevelComplete(score) {
        document.getElementById('level-score').textContent = score;
        this.elements.levelComplete.classList.remove('hidden');
    }

    hideLevelComplete() {
        this.elements.levelComplete.classList.add('hidden');
    }

    showGameOver(score) {
        document.getElementById('final-score').textContent = score;
        this.elements.gameOver.classList.remove('hidden');
    }

    hideGameOver() {
        this.elements.gameOver.classList.add('hidden');
    }

    showSettings() {
        this.elements.settings.classList.remove('hidden');
        this.hidePauseMenu();
    }

    hideSettings() {
        this.elements.settings.classList.add('hidden');
        this.showPauseMenu();
    }

    onVolumeChange(event) {
        const volume = event.target.value / 100;
        // Emit volume change event
        window.dispatchEvent(new CustomEvent('volumeChange', { detail: { volume } }));
    }

    onMusicToggle(event) {
        // Emit music toggle event
        window.dispatchEvent(new CustomEvent('musicToggle', { detail: { enabled: event.target.checked } }));
    }

    onSFXToggle(event) {
        // Emit SFX toggle event
        window.dispatchEvent(new CustomEvent('sfxToggle', { detail: { enabled: event.target.checked } }));
    }

    onNextLevel() {
        this.hideLevelComplete();
        // Emit next level event
        window.dispatchEvent(new CustomEvent('nextLevel'));
    }

    onRetry() {
        this.hideLevelComplete();
        // Emit retry event
        window.dispatchEvent(new CustomEvent('retryLevel'));
    }

    onRestart() {
        this.hideGameOver();
        // Emit restart event
        window.dispatchEvent(new CustomEvent('restartGame'));
    }

    onMainMenu() {
        this.hideGameOver();
        // Emit main menu event
        window.dispatchEvent(new CustomEvent('mainMenu'));
    }

    quitGame() {
        // Emit quit event
        window.dispatchEvent(new CustomEvent('quitGame'));
    }

    dispose() {
        // Remove event listeners and clean up
        document.removeEventListener('keydown', this.handleKeyDown);
    }
} 