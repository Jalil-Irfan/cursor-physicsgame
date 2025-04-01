import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Portal } from '../core/Portal';

export class LevelManager {
    constructor() {
        this.levels = [];
        this.currentLevel = null;
        this.portals = [];
        this.obstacles = [];
        this.collectibles = [];
    }

    async loadLevel(levelNumber, scene, physicsWorld) {
        // Clear existing level
        this.clearLevel(scene, physicsWorld);

        try {
            let levelData;
            try {
                // Try to load level data from file
                const response = await fetch(`/levels/level${levelNumber}.json`);
                levelData = await response.json();
            } catch (error) {
                console.warn('Level file not found, using default level');
                // Use default level data
                levelData = {
                    number: levelNumber,
                    name: "Default Level",
                    timeLimit: 120,
                    ground: {
                        width: 100,
                        depth: 100,
                        color: 0x88cc88
                    },
                    lighting: {
                        ambientIntensity: 0.6,
                        directionalIntensity: 0.8,
                        directionalPosition: { x: 10, y: 20, z: 10 }
                    },
                    obstacles: [
                        {
                            type: "box",
                            position: { x: 5, y: 1, z: 0 },
                            rotation: { x: 0, y: 0, z: 0 },
                            color: 0xff0000
                        },
                        {
                            type: "sphere",
                            position: { x: -5, y: 1, z: 0 },
                            rotation: { x: 0, y: 0, z: 0 },
                            color: 0x0000ff
                        }
                    ],
                    collectibles: [
                        {
                            position: { x: 0, y: 1, z: 5 },
                            color: 0xffff00,
                            value: 10
                        }
                    ],
                    portals: [
                        {
                            position: { x: 0, y: 1, z: -10 },
                            rotation: { x: 0, y: 0, z: 0 },
                            target: "next",
                            portalData: {}
                        }
                    ]
                };
            }
            
            // Create ground
            this.createGround(scene, physicsWorld, levelData.ground);

            // Create obstacles
            if (levelData.obstacles) {
                this.createObstacles(scene, physicsWorld, levelData.obstacles);
            }

            // Create collectibles
            if (levelData.collectibles) {
                this.createCollectibles(scene, physicsWorld, levelData.collectibles);
            }

            // Create portals
            if (levelData.portals) {
                this.createPortals(scene, physicsWorld, levelData.portals);
            }

            // Set up lighting
            if (levelData.lighting) {
                this.setupLighting(scene, levelData.lighting);
            }

            // Store current level data
            this.currentLevel = levelData;

            return levelData;
        } catch (error) {
            console.error('Error loading level:', error);
            throw error;
        }
    }

    createGround(scene, physicsWorld, groundData) {
        // Create ground mesh
        const groundGeometry = new THREE.PlaneGeometry(
            groundData.width,
            groundData.depth
        );
        const groundMaterial = new THREE.MeshPhongMaterial({
            color: groundData.color,
            side: THREE.DoubleSide
        });
        const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        groundMesh.rotation.x = -Math.PI / 2;
        groundMesh.position.set(0, 0, 0);
        scene.add(groundMesh);

        // Create ground physics body
        const groundShape = new CANNON.Plane();
        const groundBody = new CANNON.Body({
            mass: 0,
            shape: groundShape
        });
        groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
        physicsWorld.addBody(groundBody);
    }

    createObstacles(scene, physicsWorld, obstacles) {
        obstacles.forEach(obstacle => {
            // Create obstacle mesh
            const geometry = this.getObstacleGeometry(obstacle.type);
            const material = new THREE.MeshPhongMaterial({
                color: obstacle.color
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(obstacle.position.x, obstacle.position.y, obstacle.position.z);
            mesh.rotation.set(obstacle.rotation.x, obstacle.rotation.y, obstacle.rotation.z);
            scene.add(mesh);

            // Create obstacle physics body
            const shape = this.getObstaclePhysicsShape(obstacle.type);
            const body = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(
                    obstacle.position.x,
                    obstacle.position.y,
                    obstacle.position.z
                ),
                shape: shape
            });
            body.quaternion.setFromEuler(
                obstacle.rotation.x,
                obstacle.rotation.y,
                obstacle.rotation.z
            );
            physicsWorld.addBody(body);

            this.obstacles.push({ mesh, body });
        });
    }

    createCollectibles(scene, physicsWorld, collectibles) {
        collectibles.forEach(collectible => {
            // Create collectible mesh
            const geometry = new THREE.SphereGeometry(0.5, 16, 16);
            const material = new THREE.MeshPhongMaterial({
                color: collectible.color,
                emissive: collectible.color,
                emissiveIntensity: 0.5
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(
                collectible.position.x,
                collectible.position.y,
                collectible.position.z
            );
            scene.add(mesh);

            // Create collectible physics body
            const shape = new CANNON.Sphere(0.5);
            const body = new CANNON.Body({
                mass: 0,
                position: new CANNON.Vec3(
                    collectible.position.x,
                    collectible.position.y,
                    collectible.position.z
                ),
                shape: shape
            });
            physicsWorld.addBody(body);

            this.collectibles.push({
                mesh,
                body,
                value: collectible.value
            });
        });
    }

    createPortals(scene, physicsWorld, portals) {
        portals.forEach(portalData => {
            const portal = new Portal(
                scene,
                physicsWorld,
                new THREE.Vector3(
                    portalData.position.x,
                    portalData.position.y,
                    portalData.position.z
                ),
                new THREE.Euler(
                    portalData.rotation.x,
                    portalData.rotation.y,
                    portalData.rotation.z
                ),
                portalData.target,
                portalData.portalData
            );
            this.portals.push(portal);
        });
    }

    setupLighting(scene, lighting) {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, lighting.ambientIntensity);
        scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(
            0xffffff,
            lighting.directionalIntensity
        );
        directionalLight.position.set(
            lighting.directionalPosition.x,
            lighting.directionalPosition.y,
            lighting.directionalPosition.z
        );
        scene.add(directionalLight);
    }

    getObstacleGeometry(type) {
        switch (type) {
            case 'box':
                return new THREE.BoxGeometry(1, 1, 1);
            case 'sphere':
                return new THREE.SphereGeometry(0.5, 16, 16);
            case 'cylinder':
                return new THREE.CylinderGeometry(0.5, 0.5, 1, 16);
            default:
                return new THREE.BoxGeometry(1, 1, 1);
        }
    }

    getObstaclePhysicsShape(type) {
        switch (type) {
            case 'box':
                return new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
            case 'sphere':
                return new CANNON.Sphere(0.5);
            case 'cylinder':
                return new CANNON.Cylinder(0.5, 0.5, 1, 8);
            default:
                return new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5));
        }
    }

    clearLevel(scene, physicsWorld) {
        // Remove all objects except player and ground
        while(scene.children.length > 0) {
            const object = scene.children[0];
            scene.remove(object);
        }

        // Remove all physics bodies
        while(physicsWorld.bodies.length > 0) {
            physicsWorld.removeBody(physicsWorld.bodies[0]);
        }

        // Clear arrays
        this.portals = [];
        this.obstacles = [];
        this.collectibles = [];
    }

    update() {
        // Update portals
        this.portals.forEach(portal => portal.update());

        // Update collectibles (rotation, floating effect, etc.)
        this.collectibles.forEach(collectible => {
            collectible.mesh.rotation.y += 0.02;
            collectible.mesh.position.y += Math.sin(Date.now() * 0.003) * 0.01;
        });
    }

    getLevelTimeLimit(levelNumber) {
        return this.currentLevel?.timeLimit || 120;
    }

    async saveScore(score) {
        try {
            // Get existing scores from localStorage
            const existingScores = JSON.parse(localStorage.getItem('gameScores') || '[]');
            
            // Add new score
            const newScore = {
                score,
                level: this.currentLevel?.number,
                timestamp: Date.now()
            };
            
            existingScores.push(newScore);
            
            // Sort by score (highest first) and keep only top 10
            existingScores.sort((a, b) => b.score - a.score);
            const topScores = existingScores.slice(0, 10);
            
            // Save back to localStorage
            localStorage.setItem('gameScores', JSON.stringify(topScores));
            
            return newScore;
        } catch (error) {
            console.warn('Error saving score:', error);
            return null;
        }
    }
} 