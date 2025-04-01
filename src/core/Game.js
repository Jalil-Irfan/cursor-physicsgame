import { Scene, PerspectiveCamera, WebGLRenderer, Color, DirectionalLight, AmbientLight, PlaneGeometry, MeshPhongMaterial, Mesh } from 'three';
import * as CANNON from 'cannon-es';
import { Player } from './Player';
import { Portal } from './Portal';

export class Game {
    constructor(audioManager, levelManager, uiManager) {
        this.audioManager = audioManager;
        this.levelManager = levelManager;
        this.uiManager = uiManager;

        // Initialize Three.js scene
        this.scene = new Scene();
        this.scene.background = new Color(0x87CEEB); // Sky blue background
        
        // Initialize camera
        this.camera = new PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 10, 15);
        this.camera.lookAt(0, 0, 0);
        
        // Initialize renderer
        this.renderer = new WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 10);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);
        
        // Initialize physics world
        this.physicsWorld = new CANNON.World({
            gravity: new CANNON.Vec3(0, -9.82, 0)
        });

        // Create ground
        this.createGround();

        // Initialize game state
        this.isRunning = false;
        this.currentLevel = 1;
        this.score = 0;
        this.timeRemaining = 120; // Set initial time limit

        // Initialize player
        this.player = new Player(this.scene, this.physicsWorld);
        
        // Bind methods
        this.update = this.update.bind(this);
        this.handlePortalEnter = this.handlePortalEnter.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);

        // Handle window resize
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    createGround() {
        // Create visual ground
        const groundGeometry = new PlaneGeometry(100, 100);
        const groundMaterial = new MeshPhongMaterial({ color: 0x88cc88 });
        const groundMesh = new Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);

        // Create physics ground
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape,
            material: new CANNON.Material({ friction: 0.3 })
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        this.physicsWorld.addBody(groundBody);
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    start() {
        // Load initial level
        this.levelManager.loadLevel(this.currentLevel, this.scene, this.physicsWorld);
        
        // Start game loop
        this.isRunning = true;
        this.update();
        
        // Start audio
        this.audioManager.playBackgroundMusic();
        
        // Initialize controls
        this.initializeControls();
    }

    initializeControls() {
        // Desktop controls
        document.addEventListener('keydown', (event) => {
            if (!this.isRunning) return;
            
            switch(event.code) {
                case 'Space':
                    this.player.jump();
                    break;
                case 'KeyW':
                case 'ArrowUp':
                    this.player.moveForward();
                    break;
                case 'KeyS':
                case 'ArrowDown':
                    this.player.moveBackward();
                    break;
                case 'KeyA':
                case 'ArrowLeft':
                    this.player.moveLeft();
                    break;
                case 'KeyD':
                case 'ArrowRight':
                    this.player.moveRight();
                    break;
            }
        });

        // Mobile controls
        if ('ontouchstart' in window) {
            const joystick = nipplejs.create({
                zone: document.getElementById('mobile-controls'),
                mode: 'static',
                position: { left: '50%', top: '50%' },
                color: 'white'
            });

            joystick.on('move', (evt, data) => {
                const angle = data.angle.radian;
                const force = data.force;
                
                if (force > 0.5) {
                    this.player.moveByAngle(angle, force);
                }
            });
        }
    }

    update() {
        if (!this.isRunning) return;

        // Update physics
        this.physicsWorld.step(1/60);

        // Update player
        this.player.update();

        // Update level
        this.levelManager.update();

        // Update UI
        this.uiManager.update({
            score: this.score,
            timeRemaining: this.timeRemaining,
            level: this.currentLevel
        });

        // Update camera position to follow player
        if (this.player.mesh) {
            const playerPos = this.player.mesh.position;
            this.camera.position.x = playerPos.x;
            this.camera.position.z = playerPos.z + 15;
            this.camera.position.y = 10;
            this.camera.lookAt(playerPos);
        }

        // Render scene
        this.renderer.render(this.scene, this.camera);

        // Check for level completion
        if (this.timeRemaining <= 0) {
            this.handleLevelComplete();
        }

        // Request next frame
        requestAnimationFrame(this.update);
    }

    handlePortalEnter(portalData) {
        // Handle portal interaction
        if (portalData.target === 'next') {
            this.nextLevel();
        } else if (portalData.target === 'previous') {
            this.previousLevel();
        }
    }

    nextLevel() {
        this.currentLevel++;
        this.resetLevel();
    }

    previousLevel() {
        if (this.currentLevel > 1) {
            this.currentLevel--;
            this.resetLevel();
        }
    }

    resetLevel() {
        // Clear current level
        this.levelManager.clearLevel(this.scene, this.physicsWorld);
        
        // Load new level
        this.levelManager.loadLevel(this.currentLevel, this.scene, this.physicsWorld);
        
        // Reset player position
        this.player.reset();
        
        // Reset time
        this.timeRemaining = this.levelManager.getLevelTimeLimit(this.currentLevel);
    }

    handleLevelComplete() {
        // Save score
        this.levelManager.saveScore(this.score);
        
        // Show completion UI
        this.uiManager.showLevelComplete(this.score);
        
        // Pause game
        this.isRunning = false;
    }
} 