import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Player {
    constructor(scene, physicsWorld) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;

        // Movement properties
        this.moveSpeed = 5;
        this.jumpForce = 10;
        this.isGrounded = false;
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();

        // Initialize player mesh and physics body
        this.initializePlayer();
    }

    async initializePlayer() {
        try {
            // Create player mesh
            const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
            const material = new THREE.MeshPhongMaterial({
                color: 0x4a90e2,
                emissive: 0x2c3e50,
                emissiveIntensity: 0.2,
                shininess: 30
            });
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.castShadow = true;
            this.mesh.position.set(0, 2, 0);
            this.scene.add(this.mesh);

            // Create player physics body
            const shape = new CANNON.Cylinder(0.5, 0.5, 2, 8);
            this.body = new CANNON.Body({
                mass: 5,
                position: new CANNON.Vec3(0, 2, 0),
                shape: shape,
                material: new CANNON.Material({
                    friction: 0.3,
                    restitution: 0.3
                })
            });
            this.body.linearDamping = 0.1;
            this.body.angularDamping = 0.1;
            this.physicsWorld.addBody(this.body);

            // Add collision event listener
            this.body.addEventListener('collide', this.handleCollision.bind(this));

        } catch (error) {
            console.error('Error initializing player:', error);
            throw error;
        }
    }

    handleCollision(event) {
        // Check if collision is with ground or obstacle
        const contact = event.contact;
        const normal = contact.ni;
        
        // If collision normal is pointing up, player is grounded
        if (normal.y > 0.5) {
            this.isGrounded = true;
        }
    }

    update() {
        if (!this.mesh || !this.body) return;

        // Update mesh position from physics body
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        // Apply movement forces
        if (this.velocity.length() > 0) {
            const force = new CANNON.Vec3(
                this.velocity.x * this.moveSpeed,
                0,
                this.velocity.z * this.moveSpeed
            );
            this.body.applyForce(force, this.body.position);
        }

        // Reset velocity
        this.velocity.set(0, 0, 0);
    }

    moveForward() {
        this.velocity.z = -1;
    }

    moveBackward() {
        this.velocity.z = 1;
    }

    moveLeft() {
        this.velocity.x = -1;
    }

    moveRight() {
        this.velocity.x = 1;
    }

    moveByAngle(angle, force) {
        this.velocity.x = Math.cos(angle) * force;
        this.velocity.z = Math.sin(angle) * force;
    }

    stopMovement() {
        this.velocity.set(0, 0, 0);
    }

    jump() {
        if (this.isGrounded) {
            this.body.applyImpulse(
                new CANNON.Vec3(0, this.jumpForce, 0),
                this.body.position
            );
            this.isGrounded = false;
        }
    }

    reset() {
        if (this.body) {
            this.body.position.set(0, 2, 0);
            this.body.velocity.set(0, 0, 0);
            this.body.angularVelocity.set(0, 0, 0);
            this.body.quaternion.set(0, 0, 0, 1);
        }
        if (this.mesh) {
            this.mesh.position.copy(this.body.position);
            this.mesh.quaternion.copy(this.body.quaternion);
        }
        this.velocity.set(0, 0, 0);
        this.isGrounded = false;
    }
} 