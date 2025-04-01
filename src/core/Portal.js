import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Portal {
    constructor(scene, physicsWorld, position, rotation, target, portalData = {}) {
        this.scene = scene;
        this.physicsWorld = physicsWorld;
        this.target = target;
        this.portalData = portalData;

        // Create portal mesh
        this.createPortalMesh(position, rotation);

        // Create portal physics body
        this.createPortalBody(position, rotation);

        // Create portal effect
        this.createPortalEffect();
    }

    createPortalMesh(position, rotation) {
        // Create portal ring
        const ringGeometry = new THREE.TorusGeometry(1.5, 0.2, 16, 100);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ffff,
            emissive: 0x00ffff,
            emissiveIntensity: 0.5
        });
        this.ring = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ring.position.copy(position);
        this.ring.rotation.copy(rotation);
        this.scene.add(this.ring);

        // Create portal surface
        const portalGeometry = new THREE.CircleGeometry(1.3, 32);
        const portalMaterial = new THREE.MeshPhongMaterial({
            color: 0x0088ff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        this.surface = new THREE.Mesh(portalGeometry, portalMaterial);
        this.surface.position.copy(position);
        this.surface.rotation.copy(rotation);
        this.scene.add(this.surface);
    }

    createPortalBody(position, rotation) {
        // Create portal trigger area
        const shape = new CANNON.Box(new CANNON.Vec3(2, 0.1, 2));
        this.body = new CANNON.Body({
            mass: 0,
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape
        });
        this.body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
        this.physicsWorld.addBody(this.body);
    }

    createPortalEffect() {
        // Create portal particles
        const particleCount = 100;
        const particles = new Float32Array(particleCount * 3);
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particles, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x00ffff,
            size: 0.05,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.particles.position.copy(this.ring.position);
        this.scene.add(this.particles);

        // Initialize particle positions
        this.updateParticles();
    }

    updateParticles() {
        const positions = this.particles.geometry.attributes.position.array;
        const time = Date.now() * 0.001;

        for (let i = 0; i < positions.length; i += 3) {
            const angle = (i / 3) * Math.PI * 2 / (positions.length / 3);
            const radius = 1.5 + Math.sin(time + angle) * 0.1;
            
            positions[i] = Math.cos(angle) * radius;
            positions[i + 1] = Math.sin(time + angle) * 0.2;
            positions[i + 2] = Math.sin(angle) * radius;
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    update() {
        // Update portal effect
        this.updateParticles();

        // Rotate portal ring
        this.ring.rotation.y += 0.01;
    }

    checkPlayerCollision(playerBody) {
        if (!this.body || !playerBody) return false;

        const distance = this.body.position.distanceTo(playerBody.position);
        return distance < 2;
    }

    teleportPlayer(player) {
        if (this.target === 'next') {
            // Handle next level portal
            window.location.href = `http://portal.pieter.com/?username=${this.portalData.username}&color=${this.portalData.color}&speed=${this.portalData.speed}&ref=${window.location.hostname}`;
        } else if (this.target === 'previous') {
            // Handle previous level portal
            const ref = this.portalData.ref;
            if (ref) {
                window.location.href = ref;
            }
        }
    }

    dispose() {
        // Remove from scene
        this.scene.remove(this.ring);
        this.scene.remove(this.surface);
        this.scene.remove(this.particles);

        // Remove from physics world
        if (this.body) {
            this.physicsWorld.removeBody(this.body);
        }
    }
} 