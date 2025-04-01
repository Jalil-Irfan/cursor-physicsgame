// Constants
const EARTH_RADIUS = 5;
const MOON_RADIUS = 1.5;
const PROBE_RADIUS = 0.3;
const EARTH_MOON_DISTANCE = 30;
const GRAVITY_CONSTANT = 0.1;
const LAGRANGE_THRESHOLD = 2;
const WINNING_TIME = 30; // Seconds needed to win
const BALANCE_THRESHOLD = 2; // Distance threshold for "balanced" state
const SCORE_RATE = 10; // Points per second when perfectly balanced
const BOUNDARY_RADIUS = EARTH_MOON_DISTANCE * 2; // Boundary radius around the system
const MIN_BOUNDARY = -BOUNDARY_RADIUS;
const MAX_BOUNDARY = BOUNDARY_RADIUS;

// Scene setup
let scene, camera, renderer, controls;
let earth, moon, probe;
let lagrangePoints = [];
let forceLines = [];
let joystick;
let stars = [];
let earthClouds, moonGlow;
let gameTime = 0;
let score = 0;
let balanceTime = 0;
let gameActive = false;
let currentLagrangePoint = null;

// Initialize Three.js scene
function initGame() {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById('game-screen').appendChild(renderer.domElement);

    // Camera position
    camera.position.z = 50;

    // Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Create environment
    createStarfield();
    
    // Create celestial bodies
    createCelestialBodies();
    
    // Create Lagrange points
    createLagrangePoints();
    
    // Create force visualization
    createForceLines();

    // Setup mobile controls
    if (window.innerWidth <= 768) {
        setupMobileControls();
    }

    // Event listeners
    window.addEventListener('resize', onWindowResize, false);
    window.addEventListener('keydown', onKeyDown, false);
    window.addEventListener('keyup', onKeyUp, false);

    // Start animation loop
    animate();

    initGameState();
}

// Create starfield background
function createStarfield() {
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.1,
        transparent: true,
        opacity: 0.8,
        sizeAttenuation: true
    });

    const starsVertices = [];
    for (let i = 0; i < 5000; i++) {
        const x = (Math.random() - 0.5) * 200;
        const y = (Math.random() - 0.5) * 200;
        const z = (Math.random() - 0.5) * 200;
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
}

// Create Earth, Moon, and Probe with enhanced visuals
function createCelestialBodies() {
    // Earth
    const earthGeometry = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const earthTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg');
    const earthNormalMap = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_normal_2048.jpg');
    const earthSpecularMap = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_specular_2048.jpg');
    const earthMaterial = new THREE.MeshPhongMaterial({
        map: earthTexture,
        normalMap: earthNormalMap,
        specularMap: earthSpecularMap,
        shininess: 25
    });
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    scene.add(earth);

    // Earth Atmosphere
    const earthAtmosGeometry = new THREE.SphereGeometry(EARTH_RADIUS + 0.1, 64, 64);
    const earthAtmosMaterial = new THREE.MeshPhongMaterial({
        color: 0x4287f5,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    const earthAtmos = new THREE.Mesh(earthAtmosGeometry, earthAtmosMaterial);
    scene.add(earthAtmos);

    // Earth Clouds
    const cloudsGeometry = new THREE.SphereGeometry(EARTH_RADIUS + 0.05, 64, 64);
    const cloudsTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/earth_clouds_1024.png');
    const cloudsMaterial = new THREE.MeshPhongMaterial({
        map: cloudsTexture,
        transparent: true,
        opacity: 0.4
    });
    earthClouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
    scene.add(earthClouds);

    // Moon
    const moonGeometry = new THREE.SphereGeometry(MOON_RADIUS, 32, 32);
    const moonTexture = new THREE.TextureLoader().load('https://threejs.org/examples/textures/planets/moon_1024.jpg');
    const moonMaterial = new THREE.MeshPhongMaterial({
        map: moonTexture,
        bumpMap: moonTexture,
        bumpScale: 0.05
    });
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.x = EARTH_MOON_DISTANCE;
    scene.add(moon);

    // Moon Glow
    const moonGlowGeometry = new THREE.SphereGeometry(MOON_RADIUS + 0.1, 32, 32);
    const moonGlowMaterial = new THREE.MeshPhongMaterial({
        color: 0xcccccc,
        transparent: true,
        opacity: 0.2,
        side: THREE.BackSide
    });
    moonGlow = new THREE.Mesh(moonGlowGeometry, moonGlowMaterial);
    moonGlow.position.copy(moon.position);
    scene.add(moonGlow);

    // Create satellite (probe)
    probe = new THREE.Group();

    // Main body (central cylinder)
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 12);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: 0x888888,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x222222
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    probe.add(body);

    // Antenna dish
    const dishGeometry = new THREE.SphereGeometry(0.6, 16, 16, 0, Math.PI);
    const dishMaterial = new THREE.MeshPhongMaterial({
        color: 0xffffff,
        metalness: 0.8,
        roughness: 0.2
    });
    const dish = new THREE.Mesh(dishGeometry, dishMaterial);
    dish.rotation.x = Math.PI / 2;
    dish.position.y = 1.0;
    probe.add(dish);

    // Solar panels
    const panelGeometry = new THREE.BoxGeometry(4, 0.1, 1.2);
    const panelMaterial = new THREE.MeshPhongMaterial({
        color: 0x2244aa,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x112244
    });

    // Left panel
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    leftPanel.position.x = -2.4;
    probe.add(leftPanel);

    // Right panel
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    rightPanel.position.x = 2.4;
    probe.add(rightPanel);

    // Small details
    const detailGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const detailMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        metalness: 0.8,
        roughness: 0.2
    });

    // Add some small boxes as details
    for (let i = 0; i < 3; i++) {
        const detail = new THREE.Mesh(detailGeometry, detailMaterial);
        detail.position.y = -0.6 + (i * 0.4);
        detail.position.z = 0.4;
        probe.add(detail);
    }

    // Add glow effect
    const glowGeometry = new THREE.SphereGeometry(3, 16, 16);
    const glowMaterial = new THREE.MeshPhongMaterial({
        color: 0x3366ff,
        transparent: true,
        opacity: 0.1,
        side: THREE.BackSide
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    probe.add(glow);

    // Position the entire satellite
    probe.position.set(0, 0, 5);
    probe.scale.set(0.6, 0.6, 0.6);
    scene.add(probe);

    // Add a point light to illuminate the satellite
    const satelliteLight = new THREE.PointLight(0xffffff, 0.8, 8);
    satelliteLight.position.set(0, 2, 0);
    probe.add(satelliteLight);

    // Add subtle rotation animation to the satellite
    probe.userData.rotationSpeed = 0.001;

    // Enhanced lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(50, 0, 50);
    scene.add(sunLight);

    // Add a point light near Earth for better illumination
    const earthLight = new THREE.PointLight(0x4287f5, 1, 20);
    earthLight.position.set(2, 2, 2);
    scene.add(earthLight);
}

// Create enhanced Lagrange points
function createLagrangePoints() {
    const lagrangeGeometry = new THREE.SphereGeometry(0.5, 16, 16);
    
    lagrangePoints = [];
    const positions = [
        { x: EARTH_MOON_DISTANCE * 0.85, y: 0, name: 'L1' },
        { x: EARTH_MOON_DISTANCE * 1.15, y: 0, name: 'L2' },
        { x: -EARTH_MOON_DISTANCE, y: 0, name: 'L3' },
        { x: EARTH_MOON_DISTANCE * 0.5, y: EARTH_MOON_DISTANCE * Math.sqrt(3) / 2, name: 'L4' },
        { x: EARTH_MOON_DISTANCE * 0.5, y: -EARTH_MOON_DISTANCE * Math.sqrt(3) / 2, name: 'L5' }
    ];

    positions.forEach(pos => {
        // Core sphere
        const material = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            emissive: 0x00ff00,
            emissiveIntensity: 0.5,
            transparent: true,
            opacity: 0.8
        });
        
        const point = new THREE.Mesh(lagrangeGeometry, material);
        point.position.set(pos.x, pos.y, 0);

        // Glow effect
        const glowGeometry = new THREE.SphereGeometry(0.7, 16, 16);
        const glowMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        point.add(glow);

        // Pulsing ring
        const ringGeometry = new THREE.RingGeometry(0.8, 1, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        point.add(ring);
        
        scene.add(point);
        lagrangePoints.push({ point, name: pos.name, ring });
    });
}

// Enhanced force visualization
function createForceLines() {
    forceLines = [];
    const colors = [0xff3333, 0xcccccc]; // Red for Earth, White for Moon
    
    for (let i = 0; i < 2; i++) {
        const arrowHelper = new THREE.ArrowHelper(
            new THREE.Vector3(),
            probe.position,
            5,
            colors[i],
            1,
            0.5
        );
        scene.add(arrowHelper);
        forceLines.push(arrowHelper);
    }
}

// Setup mobile controls
function setupMobileControls() {
    joystick = nipplejs.create({
        zone: document.getElementById('joystick-container'),
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 120
    });

    joystick.on('move', (evt, data) => {
        const force = data.force;
        const angle = data.angle.radian;
        
        probe.velocity = new THREE.Vector3(
            Math.cos(angle) * force * 0.1,
            Math.sin(angle) * force * 0.1,
            0
        );
    });

    joystick.on('end', () => {
        probe.velocity = new THREE.Vector3();
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle keyboard input
function onKeyDown(event) {
    if (window.innerWidth > 768) {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
                probe.velocity = new THREE.Vector3(0, 0.1, 0);
                break;
            case 'ArrowDown':
            case 's':
                probe.velocity = new THREE.Vector3(0, -0.1, 0);
                break;
            case 'ArrowLeft':
            case 'a':
                probe.velocity = new THREE.Vector3(-0.1, 0, 0);
                break;
            case 'ArrowRight':
            case 'd':
                probe.velocity = new THREE.Vector3(0.1, 0, 0);
                break;
        }
    }
}

function onKeyUp(event) {
    if (window.innerWidth > 768) {
        switch(event.key) {
            case 'ArrowUp':
            case 'w':
            case 'ArrowDown':
            case 's':
            case 'ArrowLeft':
            case 'a':
            case 'ArrowRight':
            case 'd':
                probe.velocity = new THREE.Vector3();
                break;
        }
    }
}

// Calculate gravitational force
function calculateGravity(probePos, bodyPos, bodyMass) {
    const direction = bodyPos.clone().sub(probePos);
    const distance = direction.length();
    const force = GRAVITY_CONSTANT * bodyMass / (distance * distance);
    return direction.normalize().multiplyScalar(force);
}

// Check Lagrange point proximity
function checkLagrangeProximity() {
    const nearestLagrange = document.getElementById('nearest-lagrange');
    let minDistance = Infinity;
    let nearestPoint = null;

    lagrangePoints.forEach(({ point, name }) => {
        const distance = probe.position.distanceTo(point.position);
        if (distance < minDistance) {
            minDistance = distance;
            nearestPoint = name;
        }
    });

    if (minDistance < BALANCE_THRESHOLD) {
        nearestLagrange.textContent = `Near ${nearestPoint} - Stay balanced!`;
        nearestLagrange.style.color = '#00ff00';
        
        // Update balance time if at same point
        if (gameActive && nearestPoint === currentLagrangePoint) {
            balanceTime += 1/60; // Assuming 60 FPS
            score += (SCORE_RATE * (1 - minDistance/BALANCE_THRESHOLD)) / 60;
        } else {
            currentLagrangePoint = nearestPoint;
            balanceTime = 0;
        }
        
        // Check for win condition
        if (balanceTime >= WINNING_TIME) {
            handleWin();
        }
    } else {
        nearestLagrange.textContent = `Distance to nearest Lagrange point: ${minDistance.toFixed(1)}`;
        nearestLagrange.style.color = '#ffffff';
        currentLagrangePoint = null;
        balanceTime = 0;
    }
}

// Add this function to check and constrain position
function constrainPosition(position) {
    // Create a visual boundary indicator if it doesn't exist
    if (!window.boundaryIndicator) {
        const boundaryGeometry = new THREE.SphereGeometry(BOUNDARY_RADIUS, 32, 32);
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0x444444,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
            wireframe: true
        });
        window.boundaryIndicator = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
        scene.add(window.boundaryIndicator);
    }

    // Calculate distance from origin
    const distance = position.length();
    
    // If outside boundary, constrain to boundary
    if (distance > BOUNDARY_RADIUS) {
        position.normalize().multiplyScalar(BOUNDARY_RADIUS);
        
        // Add a bounce effect
        if (probe.velocity) {
            // Reflect velocity vector off the boundary
            const normal = position.clone().normalize();
            probe.velocity.reflect(normal);
            // Reduce velocity to simulate energy loss
            probe.velocity.multiplyScalar(0.8);
        }

        // Visual feedback when hitting boundary
        window.boundaryIndicator.material.opacity = 0.3;
        setTimeout(() => {
            window.boundaryIndicator.material.opacity = 0.1;
        }, 200);

        return true; // Return true if position was constrained
    }
    return false; // Return false if position was within bounds
}

// Add this function to show warning when near boundary
function updateBoundaryWarning(position) {
    const distance = position.length();
    const warningThreshold = BOUNDARY_RADIUS * 0.9; // Start warning at 90% of boundary
    
    if (distance > warningThreshold) {
        const warningElement = document.getElementById('nearest-lagrange');
        warningElement.textContent = "WARNING: Approaching boundary!";
        warningElement.style.color = '#ff0000';
    }
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);

    if (gameActive) {
        gameTime += 1/60; // Assuming 60 FPS
        updateUI();
    }

    // Rotate Earth and clouds
    earth.rotation.y += 0.001;
    if (earthClouds) earthClouds.rotation.y += 0.0015;

    // Rotate Moon
    moon.rotation.y += 0.0005;
    if (moonGlow) moonGlow.position.copy(moon.position);

    // Update probe position and rotation
    if (probe.velocity) {
        const newPosition = probe.position.clone().add(probe.velocity);
        
        // Check and constrain position before applying
        if (constrainPosition(newPosition)) {
            probe.position.copy(newPosition);
        } else {
            probe.position.add(probe.velocity);
        }

        // Update boundary warning
        updateBoundaryWarning(probe.position);
    }

    // Add subtle rotation to the satellite
    probe.rotation.y += probe.userData.rotationSpeed;
    
    // Tilt the satellite slightly based on movement
    if (probe.velocity) {
        const tiltAmount = 0.1;
        probe.rotation.z = -probe.velocity.x * tiltAmount;
        probe.rotation.x = probe.velocity.y * tiltAmount;
    }

    // Animate Lagrange point rings
    lagrangePoints.forEach(({ ring }) => {
        if (ring) {
            ring.scale.x = 1 + 0.1 * Math.sin(Date.now() * 0.003);
            ring.scale.y = 1 + 0.1 * Math.sin(Date.now() * 0.003);
        }
    });

    // Calculate gravitational forces
    const earthForce = calculateGravity(probe.position, earth.position, 1);
    const moonForce = calculateGravity(probe.position, moon.position, 0.0123);
    
    // Apply combined force
    const totalForce = earthForce.add(moonForce);
    if (probe.velocity) {
        probe.velocity.add(totalForce);
        
        // Add velocity dampening to prevent excessive speeds
        probe.velocity.multiplyScalar(0.995);
    }

    // Update force visualization
    forceLines[0].position.copy(probe.position);
    forceLines[1].position.copy(probe.position);
    forceLines[0].setDirection(earthForce.normalize());
    forceLines[1].setDirection(moonForce.normalize());

    // Check Lagrange point proximity
    checkLagrangeProximity();

    // Rotate stars slightly for subtle movement
    if (stars) stars.rotation.y += 0.0001;

    // Update controls
    controls.update();

    // Render scene
    renderer.render(scene, camera);
}

// Add this function to initialize game state
function initGameState() {
    gameTime = 0;
    score = 0;
    balanceTime = 0;
    gameActive = true;
    currentLagrangePoint = null;
    updateUI();
}

// Add this function to update UI elements
function updateUI() {
    const timerElement = document.getElementById('timer');
    const scoreElement = document.getElementById('score');
    const balanceStatus = document.getElementById('balance-status');
    
    timerElement.textContent = `Time: ${Math.floor(gameTime)}s`;
    scoreElement.textContent = `Score: ${Math.floor(score)}`;
    
    if (currentLagrangePoint && balanceTime > 0) {
        balanceStatus.textContent = `Balanced at ${currentLagrangePoint} for ${Math.floor(balanceTime)}s`;
        balanceStatus.style.color = '#00ff00';
    } else {
        balanceStatus.textContent = '';
    }
}

// Add this function to handle winning
function handleWin() {
    gameActive = false;
    const winScreen = document.getElementById('win-screen');
    const winMessage = document.getElementById('win-message');
    winScreen.classList.remove('hidden');
    winMessage.textContent = `You balanced at ${currentLagrangePoint} for ${WINNING_TIME} seconds!\nFinal Score: ${Math.floor(score)}`;
    
    // Add event listener for restart button
    document.getElementById('restart-game').addEventListener('click', () => {
        winScreen.classList.add('hidden');
        initGameState();
    });
} 