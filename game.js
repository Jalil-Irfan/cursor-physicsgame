// Constants
const EARTH_RADIUS = 5;
const MOON_RADIUS = 1.5;
const PROBE_RADIUS = 0.3;
const EARTH_MOON_DISTANCE = 30;
const GRAVITY_CONSTANT = 0.1; // Increased gravity effect
const LAGRANGE_THRESHOLD = 4;
const WINNING_TIME = 30;
const BALANCE_THRESHOLD = 4;
const SCORE_RATE = 10;
const BOUNDARY_RADIUS = EARTH_MOON_DISTANCE * 2;
const MIN_BOUNDARY = -BOUNDARY_RADIUS;
const MAX_BOUNDARY = BOUNDARY_RADIUS;
const THRUST_POWER = 0.008;  // Increased from 0.003 for better responsiveness
const DAMPENING = 0.995;     // Increased from 0.98 for smoother movement
const MAX_VELOCITY = 0.3;    // Increased from 0.2 for better speed
const ROTATION_SPEED = 0.1;  // Increased from 0.05 for better rotation response
const TILT_SPEED = 0.15;     // Increased from 0.1 for better tilt response
const ROLL_SPEED = 0.2;      // Increased from 0.15 for better roll response
const COLLISION_DAMPENING = 0.7;  // Increased from 0.5 for better collision response
const MIN_VELOCITY = 0.001;  // Added to prevent micro-movements
const FORCE_ARROW_SCALE = 50; // Increased scale for better visibility
const ARROW_MIN_LENGTH = 2; // Minimum arrow length for visibility
const ARROW_MAX_LENGTH = 15; // Maximum arrow length

// Portal constants
const PORTAL_RADIUS = 3;
const PORTAL_POSITION = new THREE.Vector3(EARTH_MOON_DISTANCE * 0.5, EARTH_MOON_DISTANCE * 0.3, 0);
const PORTAL_COLOR = 0x00ffff;
const PORTAL_GAME_URL = window.location.href;

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
let portal, portalRing, portalLabel;

// Add sponsor system variables
let sponsorSystem;
let currentSponsor;

// Check for portal entry
function checkPortalEntry() {
    if (!probe || !portal) return;
    
    const distanceToPortal = probe.position.distanceTo(portal.position);
    if (distanceToPortal < PORTAL_RADIUS) {
        // Prepare portal parameters
        const params = new URLSearchParams();
        params.append('username', document.getElementById('player-name').value || 'unknown');
        params.append('color', currentSponsor ? currentSponsor.colors.primary.replace('#', '') : 'ffffff');
        params.append('speed', probe.velocity.length().toFixed(2));
        params.append('ref', PORTAL_GAME_URL);
        
        // Add additional parameters
        params.append('speed_x', probe.velocity.x.toFixed(2));
        params.append('speed_y', probe.velocity.y.toFixed(2));
        params.append('speed_z', probe.velocity.z.toFixed(2));
        params.append('rotation_x', probe.rotation.x.toFixed(2));
        params.append('rotation_y', probe.rotation.y.toFixed(2));
        params.append('rotation_z', probe.rotation.z.toFixed(2));
        
        // Redirect to portal
        window.location.href = `http://portal.pieter.com/?${params.toString()}`;
    }
}

// Create portal
function createPortal() {
    const portalGroup = new THREE.Group();
    
    // Main portal ring
    const ringGeometry = new THREE.TorusGeometry(PORTAL_RADIUS, 0.3, 16, 100);
    const ringMaterial = new THREE.MeshPhongMaterial({
        color: PORTAL_COLOR,
        emissive: PORTAL_COLOR,
        emissiveIntensity: 0.5,
        transparent: true,
        opacity: 0.8
    });
    portalRing = new THREE.Mesh(ringGeometry, ringMaterial);
    
    // Portal effect (inner glow)
    const portalGeometry = new THREE.CircleGeometry(PORTAL_RADIUS - 0.1, 32);
    const portalMaterial = new THREE.MeshBasicMaterial({
        color: PORTAL_COLOR,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });
    portal = new THREE.Mesh(portalGeometry, portalMaterial);
    
    // Create portal label
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 64;
    context.fillStyle = '#ffffff';
    context.font = 'bold 32px Arial';
    context.textAlign = 'center';
    context.fillText('Vibeverse Portal', canvas.width/2, canvas.height/2);
    
    const labelTexture = new THREE.CanvasTexture(canvas);
    const labelGeometry = new THREE.PlaneGeometry(4, 1);
    const labelMaterial = new THREE.MeshBasicMaterial({
        map: labelTexture,
        transparent: true,
        side: THREE.DoubleSide
    });
    portalLabel = new THREE.Mesh(labelGeometry, labelMaterial);
    portalLabel.position.y = PORTAL_RADIUS + 1;
    
    // Add everything to the portal group
    portalGroup.add(portalRing);
    portalGroup.add(portal);
    portalGroup.add(portalLabel);
    
    // Position the portal
    portalGroup.position.copy(PORTAL_POSITION);
    
    // Add to scene
    scene.add(portalGroup);
    
    // Add portal animation
    portalGroup.userData.rotationSpeed = 0.001;
    portalGroup.userData.pulseSpeed = 0.02;
    portalGroup.userData.pulseTime = 0;
}

// Handle incoming portal players
function handlePortalEntry() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('portal') === 'true') {
        // Skip intro screens
        document.getElementById('landing-screen').style.display = 'none';
        document.getElementById('sponsor-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
        
        // Initialize game
        initGame();
        
        // Set probe properties from portal params
        if (probe) {
            // Position probe near portal
            probe.position.copy(PORTAL_POSITION).add(new THREE.Vector3(PORTAL_RADIUS * 2, 0, 0));
            
            // Set velocity
            const speed_x = parseFloat(urlParams.get('speed_x')) || 0;
            const speed_y = parseFloat(urlParams.get('speed_y')) || 0;
            const speed_z = parseFloat(urlParams.get('speed_z')) || 0;
            probe.velocity.set(speed_x, speed_y, speed_z);
            
            // Set rotation
            const rotation_x = parseFloat(urlParams.get('rotation_x')) || 0;
            const rotation_y = parseFloat(urlParams.get('rotation_y')) || 0;
            const rotation_z = parseFloat(urlParams.get('rotation_z')) || 0;
            probe.rotation.set(rotation_x, rotation_y, rotation_z);
        }
        
        gameActive = true;
    }
}

// Initialize Three.js scene
function initGame() {
    // Initialize sponsor system
    sponsorSystem = new SponsorSystem();
    currentSponsor = sponsorSystem.selectSponsor(window.selectedSponsor);

    // Update UI with sponsor info
    const sponsorLogo = document.getElementById('sponsor-logo');
    sponsorLogo.innerHTML = `<img src="${currentSponsor.logo}" alt="${currentSponsor.name} logo" height="30">`;

    const missionObjectives = document.getElementById('mission-objectives');
    missionObjectives.innerHTML = `
        <div class="mission-box">
            <h3>${currentSponsor.name} Mission Objectives</h3>
            <p>Primary: ${currentSponsor.objectives.main}</p>
            <p>Bonus: ${currentSponsor.objectives.bonus}</p>
            <p>Time Limit: ${currentSponsor.objectives.timeLimit}s</p>
        </div>
    `;

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
    
    // Create probe first
    createProbe(currentSponsor.satellite);
    
    // Create force visualization after probe exists
    createForceLines();

    // Create portal
    createPortal();

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

    // Check for portal entry
    handlePortalEntry();

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

        // Create label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 32;
        context.fillStyle = '#ffffff';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(pos.name, canvas.width/2, canvas.height/2);
        
        const labelTexture = new THREE.CanvasTexture(canvas);
        const labelGeometry = new THREE.PlaneGeometry(1, 0.5);
        const labelMaterial = new THREE.MeshBasicMaterial({
            map: labelTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeometry, labelMaterial);
        label.position.y = 1.2; // Position above the point
        point.add(label);
        
        scene.add(point);
        lagrangePoints.push({ point, name: pos.name, ring });
    });
}

// Enhanced force visualization
function createForceLines() {
    forceLines = [];
    
    // Earth's gravitational force arrow (red)
    const earthArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        5,
        0xff0000, // Bright red
        2, // Larger head length
        1  // Larger head width
    );
    earthArrow.line.material.linewidth = 3; // Thicker line
    
    // Moon's gravitational force arrow (white)
    const moonArrow = new THREE.ArrowHelper(
        new THREE.Vector3(1, 0, 0),
        new THREE.Vector3(0, 0, 0),
        5,
        0xffffff, // Pure white
        2, // Larger head length
        1  // Larger head width
    );
    moonArrow.line.material.linewidth = 3; // Thicker line
    
    scene.add(earthArrow);
    scene.add(moonArrow);
    forceLines = [earthArrow, moonArrow];
}

// Setup mobile controls with 3D movement
function setupMobileControls() {
    joystick = nipplejs.create({
        zone: document.getElementById('joystick-container'),
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 120
    });

    // Add a second joystick for z-axis control
    const zJoystick = nipplejs.create({
        zone: document.getElementById('joystick-container'),
        mode: 'static',
        position: { left: '80%', top: '50%' },
        color: 'white',
        size: 80
    });

    joystick.on('move', (evt, data) => {
        const force = data.force;
        const angle = data.angle.radian;
        
        // Calculate x and y components with reduced sensitivity
        const x = Math.cos(angle) * force * 0.03;
        const y = Math.sin(angle) * force * 0.03;
        
        // Keep existing z velocity
        const z = probe.velocity.z;
        
        probe.velocity = new THREE.Vector3(x, y, z);
    });

    zJoystick.on('move', (evt, data) => {
        const force = data.force;
        const angle = data.angle.radian;
        
        // Calculate z component based on joystick position
        const z = Math.sin(angle) * force * 0.03;
        
        // Keep existing x and y velocity
        const x = probe.velocity.x;
        const y = probe.velocity.y;
        
        probe.velocity = new THREE.Vector3(x, y, z);
    });

    joystick.on('end', () => {
        // Keep z velocity when x/y joystick ends
        const z = probe.velocity.z;
        probe.velocity = new THREE.Vector3(0, 0, z);
    });

    zJoystick.on('end', () => {
        // Keep x/y velocity when z joystick ends
        const x = probe.velocity.x;
        const y = probe.velocity.y;
        probe.velocity = new THREE.Vector3(x, y, 0);
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Handle keyboard input with acceleration
function onKeyDown(event) {
    if (window.innerWidth > 768) {
        if (!probe.acceleration) {
            probe.acceleration = new THREE.Vector3();
        }
        
        let thrustChanged = false;
        
        switch(event.key.toLowerCase()) {
            case 'arrowup':
            case 'w':
                probe.acceleration.y = THRUST_POWER;
                thrustChanged = true;
                break;
            case 'arrowdown':
            case 's':
                probe.acceleration.y = -THRUST_POWER;
                thrustChanged = true;
                break;
            case 'arrowleft':
            case 'a':
                probe.acceleration.x = -THRUST_POWER;
                thrustChanged = true;
                break;
            case 'arrowright':
            case 'd':
                probe.acceleration.x = THRUST_POWER;
                thrustChanged = true;
                break;
            case 'q':
                probe.acceleration.z = -THRUST_POWER;
                thrustChanged = true;
                break;
            case 'e':
                probe.acceleration.z = THRUST_POWER;
                thrustChanged = true;
                break;
            case ' ': // Emergency brake
                probe.velocity.multiplyScalar(0.3);
                probe.acceleration.set(0, 0, 0);
                break;
        }
        
        if (thrustChanged) {
            probe.thrusterActive = true;
            // Smoother velocity reduction when changing direction
            if (probe.acceleration.x !== 0 && Math.sign(probe.velocity.x) !== Math.sign(probe.acceleration.x)) {
                probe.velocity.x *= 0.8;
            }
            if (probe.acceleration.y !== 0 && Math.sign(probe.velocity.y) !== Math.sign(probe.acceleration.y)) {
                probe.velocity.y *= 0.8;
            }
            if (probe.acceleration.z !== 0 && Math.sign(probe.velocity.z) !== Math.sign(probe.acceleration.z)) {
                probe.velocity.z *= 0.8;
            }
        }
    }
}

function onKeyUp(event) {
    if (window.innerWidth > 768) {
        if (!probe.acceleration) {
            probe.acceleration = new THREE.Vector3();
        }
        
        switch(event.key.toLowerCase()) {
            case 'arrowup':
            case 'w':
            case 'arrowdown':
            case 's':
                probe.acceleration.y = 0;
                break;
            case 'arrowleft':
            case 'a':
            case 'arrowright':
            case 'd':
                probe.acceleration.x = 0;
                break;
            case 'q':
            case 'e':
                probe.acceleration.z = 0;
                break;
        }
        
        // Check if any other keys are still pressed
        probe.thrusterActive = (probe.acceleration.x !== 0 || probe.acceleration.y !== 0 || probe.acceleration.z !== 0);
    }
}

// Calculate gravitational force
function calculateGravity(probePos, bodyPos, bodyMass) {
    const direction = bodyPos.clone().sub(probePos);
    const distance = direction.length();
    // Added minimum distance to prevent extreme forces when very close
    const minDistance = 5;
    const actualDistance = Math.max(distance, minDistance);
    const force = GRAVITY_CONSTANT * bodyMass / (actualDistance * actualDistance);
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

    // Update UI with more detailed feedback
    if (minDistance < BALANCE_THRESHOLD) {
        const stabilityPercentage = Math.floor((1 - minDistance/BALANCE_THRESHOLD) * 100);
        nearestLagrange.textContent = `At ${nearestPoint} - Stability: ${stabilityPercentage}%`;
        nearestLagrange.style.color = '#00ff00';
        
        if (gameActive && nearestPoint === currentLagrangePoint) {
            balanceTime += 1/60;
            score += (SCORE_RATE * (1 - minDistance/BALANCE_THRESHOLD)) / 60;
        } else {
            currentLagrangePoint = nearestPoint;
            balanceTime = 0;
        }
        
        if (balanceTime >= WINNING_TIME) {
            handleWin();
        }
    } else {
        nearestLagrange.textContent = `Distance to ${nearestPoint}: ${minDistance.toFixed(1)} units`;
        nearestLagrange.style.color = minDistance < BALANCE_THRESHOLD * 1.5 ? '#ffff00' : '#ffffff';
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
    
    // If outside boundary or too close to Earth/Moon, constrain position
    if (distance > BOUNDARY_RADIUS || distance < EARTH_RADIUS * 1.2 || 
        position.distanceTo(moon.position) < MOON_RADIUS * 1.2) {
        
        if (distance > BOUNDARY_RADIUS) {
            // Constrain to boundary
            position.normalize().multiplyScalar(BOUNDARY_RADIUS * 0.95);
        } else {
            // Move away from celestial body
            const awayFromEarth = position.clone().normalize();
            position.copy(awayFromEarth.multiplyScalar(EARTH_RADIUS * 1.5));
        }
        
        // Add a bounce effect with energy loss
        if (probe.velocity) {
            const normal = position.clone().normalize();
            probe.velocity.reflect(normal);
            probe.velocity.multiplyScalar(0.6); // Increased energy loss
            
            // Add a minimum velocity to prevent getting stuck
            if (probe.velocity.length() < 0.05) {
                probe.velocity.normalize().multiplyScalar(0.05);
            }
        }

        // Visual feedback
        window.boundaryIndicator.material.opacity = 0.3;
        setTimeout(() => {
            window.boundaryIndicator.material.opacity = 0.1;
        }, 200);

        return true;
    }
    return false;
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
        gameTime += 1/60;
        
        if (gameTime >= currentSponsor.objectives.timeLimit) {
            handleTimeout();
        }
        
        updateUI();
    }

    // Rotate Earth and clouds
    earth.rotation.y += 0.001;
    if (earthClouds) earthClouds.rotation.y += 0.0015;

    // Rotate Moon
    moon.rotation.y += 0.0005;
    if (moonGlow) moonGlow.position.copy(moon.position);

    // Calculate gravitational forces
    const earthForce = calculateGravity(probe.position, earth.position, 1);
    const moonForce = calculateGravity(probe.position, moon.position, 0.0123);
    const totalForce = earthForce.clone().add(moonForce);

    // Apply forces and update probe position
    if (!probe.velocity) probe.velocity = new THREE.Vector3();
    
    // Apply gravitational forces
    probe.velocity.add(totalForce);
    
    // Apply thruster acceleration if active
    if (probe.thrusterActive) {
        probe.velocity.add(probe.acceleration);
        // Reduced dampening when thrusting
        probe.velocity.multiplyScalar(0.995);
    } else {
        // Light dampening when not thrusting
        probe.velocity.multiplyScalar(0.998);
    }
    
    // Apply velocity limits with smoother capping
    const speed = probe.velocity.length();
    if (speed > MAX_VELOCITY) {
        probe.velocity.multiplyScalar(0.95);
    }
    
    const newPosition = probe.position.clone().add(probe.velocity);
    
    // Check and constrain position
    if (constrainPosition(newPosition)) {
        probe.position.copy(newPosition);
        probe.velocity.multiplyScalar(0.8);
    } else {
        probe.position.add(probe.velocity);
    }

    // Update visual effects
    updateBoundaryWarning(probe.position);
    
    // Update probe rotation and tilt based on movement
    updateProbeRotation();

    // Update force visualization arrows
    if (forceLines && forceLines.length === 2) {
        forceLines[0].position.copy(probe.position);
        const earthForceScaled = earthForce.clone().multiplyScalar(FORCE_ARROW_SCALE);
        const earthArrowLength = Math.max(ARROW_MIN_LENGTH, 
            Math.min(earthForce.length() * FORCE_ARROW_SCALE, ARROW_MAX_LENGTH));
        
        forceLines[0].setDirection(earthForceScaled.normalize());
        forceLines[0].setLength(earthArrowLength);

        forceLines[1].position.copy(probe.position);
        const moonForceScaled = moonForce.clone().multiplyScalar(FORCE_ARROW_SCALE);
        const moonArrowLength = Math.max(ARROW_MIN_LENGTH,
            Math.min(moonForce.length() * FORCE_ARROW_SCALE, ARROW_MAX_LENGTH));
        
        forceLines[1].setDirection(moonForceScaled.normalize());
        forceLines[1].setLength(moonArrowLength);
    }

    // Animate portal
    if (portal && portalRing) {
        const portalGroup = portal.parent;
        portalGroup.rotation.y += portalGroup.userData.rotationSpeed;
        
        // Pulse effect
        portalGroup.userData.pulseTime += portalGroup.userData.pulseSpeed;
        const pulse = Math.sin(portalGroup.userData.pulseTime) * 0.2 + 0.8;
        portal.material.opacity = pulse * 0.3;
        portalRing.material.emissiveIntensity = pulse * 0.5;
        
        // Make label always face camera
        if (portalLabel) {
            portalLabel.quaternion.copy(camera.quaternion);
        }
    }

    // Check for portal entry
    checkPortalEntry();

    // Check Lagrange point proximity
    checkLagrangeProximity();

    // Rotate stars
    if (stars) stars.rotation.y += 0.0001;

    // Update controls
    controls.update();

    // Apply sponsor-specific effects
    if (currentSponsor.special.effect) {
        switch (currentSponsor.special.effect) {
            case 'stabilityBonus':
                if (!probe.thrusterActive) {
                    probe.velocity.multiplyScalar(1 / currentSponsor.special.value);
                }
                break;
            case 'reducedDrift':
                probe.velocity.multiplyScalar(currentSponsor.special.value);
                break;
            case 'speedBoost':
                if (probe.thrusterActive) {
                    probe.velocity.multiplyScalar(currentSponsor.special.value);
                }
                break;
        }
    }

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
    const satisfactionElement = document.getElementById('sponsor-satisfaction');
    
    timerElement.textContent = `Time: ${Math.floor(gameTime)}s`;
    scoreElement.textContent = `Score: ${Math.floor(score)}`;
    
    if (currentLagrangePoint && balanceTime > 0) {
        balanceStatus.textContent = `Balanced at ${currentLagrangePoint} for ${Math.floor(balanceTime)}s`;
        balanceStatus.style.color = '#00ff00';
        
        // Update sponsor satisfaction
        sponsorSystem.updateSatisfaction({ objective: true, bonus: balanceTime > 10 });
    } else {
        balanceStatus.textContent = '';
        sponsorSystem.updateSatisfaction({ objective: false, bonus: false });
    }
    
    satisfactionElement.textContent = `Sponsor Satisfaction: ${Math.floor(sponsorSystem.satisfaction)}%`;
    satisfactionElement.style.color = sponsorSystem.satisfaction > 50 ? '#00ff00' : '#ff0000';
}

// Add this function to handle winning
function handleWin() {
    gameActive = false;
    const winScreen = document.getElementById('win-screen');
    const winMessage = document.getElementById('win-message');
    winScreen.classList.remove('hidden');
    
    const finalScore = Math.floor(score);
    const satisfaction = Math.floor(sponsorSystem.satisfaction);
    
    winMessage.innerHTML = `
        Outstanding Achievement!<br>
        You've successfully completed ${currentSponsor.name}'s primary objective!<br>
        Final Score: ${finalScore}<br>
        Sponsor Satisfaction: ${satisfaction}%<br>
        Time: ${Math.floor(gameTime)}s
    `;
    
    // Add achievement for winning
    sponsorSystem.checkAchievements({
        stabilityTime: balanceTime,
        visitedPoints: new Set([currentLagrangePoint]),
        maxPrecision: probe.position.distanceTo(lagrangePoints[0].point.position)
    });
}

// Add timeout handling
function handleTimeout() {
    gameActive = false;
    const winScreen = document.getElementById('win-screen');
    const winMessage = document.getElementById('win-message');
    winScreen.classList.remove('hidden');
    
    const finalScore = Math.floor(score);
    const satisfaction = Math.floor(sponsorSystem.satisfaction);
    
    if (satisfaction >= 80) {
        winMessage.innerHTML = `
            Mission Accomplished!<br>
            ${currentSponsor.name} is extremely pleased with your performance.<br>
            Final Score: ${finalScore}<br>
            Satisfaction: ${satisfaction}%
        `;
    } else if (satisfaction >= 50) {
        winMessage.innerHTML = `
            Mission Completed.<br>
            ${currentSponsor.name} acknowledges your effort.<br>
            Final Score: ${finalScore}<br>
            Satisfaction: ${satisfaction}%
        `;
    } else {
        winMessage.innerHTML = `
            Mission Failed.<br>
            ${currentSponsor.name} is disappointed with your performance.<br>
            Final Score: ${finalScore}<br>
            Satisfaction: ${satisfaction}%
        `;
    }
}

// Improved probe creation
function createProbe(satelliteConfig) {
    probe = new THREE.Group();
    probe.velocity = new THREE.Vector3();
    probe.acceleration = new THREE.Vector3();
    probe.thrusterActive = false;

    // Main body (central cylinder with better detail)
    const bodyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 16);
    const bodyMaterial = new THREE.MeshPhongMaterial({
        color: satelliteConfig.bodyColor,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x222222,
        emissiveIntensity: 0.2,
        shininess: 90
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    probe.add(body);

    // Enhanced solar panels
    const panelGeometry = new THREE.BoxGeometry(4 * satelliteConfig.details.panelSize, 0.05, 1.5);
    const panelMaterial = new THREE.MeshPhongMaterial({
        color: satelliteConfig.panelColor,
        metalness: 0.8,
        roughness: 0.2,
        emissive: 0x112244,
        emissiveIntensity: 0.3,
        shininess: 100
    });

    // Solar panel details
    const panelDetailGeometry = new THREE.BoxGeometry(3.8 * satelliteConfig.details.panelSize, 0.06, 1.4);
    const panelDetailMaterial = new THREE.MeshPhongMaterial({
        color: 0x1a1a1a,
        metalness: 0.7,
        roughness: 0.3,
        emissive: 0x001133
    });

    // Left panel with details
    const leftPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    const leftPanelDetail = new THREE.Mesh(panelDetailGeometry, panelDetailMaterial);
    leftPanel.position.x = -2.4 * satelliteConfig.details.panelSize;
    leftPanelDetail.position.x = -2.4 * satelliteConfig.details.panelSize;
    leftPanelDetail.position.z = 0.01;
    probe.add(leftPanel);
    probe.add(leftPanelDetail);

    // Right panel with details
    const rightPanel = new THREE.Mesh(panelGeometry, panelMaterial);
    const rightPanelDetail = new THREE.Mesh(panelDetailGeometry, panelDetailMaterial);
    rightPanel.position.x = 2.4 * satelliteConfig.details.panelSize;
    rightPanelDetail.position.x = 2.4 * satelliteConfig.details.panelSize;
    rightPanelDetail.position.z = 0.01;
    probe.add(rightPanel);
    probe.add(rightPanelDetail);

    // Add enhanced instruments
    if (satelliteConfig.details.instruments) {
        const instrumentsGroup = createInstruments();
        probe.add(instrumentsGroup);
    }

    // Enhanced antenna
    const antennaGroup = createAntenna(satelliteConfig.details.antennaSize);
    probe.add(antennaGroup);

    // Improved glow effect
    const glowGeometry = new THREE.SphereGeometry(3, 24, 24);
    const glowMaterial = new THREE.MeshPhongMaterial({
        color: satelliteConfig.bodyColor,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        emissive: satelliteConfig.bodyColor,
        emissiveIntensity: 0.2
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    probe.add(glow);

    // Position and scale
    probe.position.set(0, 0, 5);
    probe.scale.set(0.6, 0.6, 0.6);
    scene.add(probe);

    // Enhanced lighting
    const satelliteLight = new THREE.PointLight(0xffffff, 1, 8);
    satelliteLight.position.set(0, 2, 0);
    probe.add(satelliteLight);

    // Add rotation animation
    probe.userData.rotationSpeed = 0.001;
}

// Enhanced antenna creation
function createAntenna(size) {
    const group = new THREE.Group();
    
    // Main dish with better geometry
    const dishGeometry = new THREE.SphereGeometry(0.6 * size, 32, 32, 0, Math.PI);
    const dishMaterial = new THREE.MeshPhongMaterial({
        color: 0xdddddd,
        metalness: 0.9,
        roughness: 0.1,
        emissive: 0x222222,
        emissiveIntensity: 0.1
    });
    const dish = new THREE.Mesh(dishGeometry, dishMaterial);
    
    // Add dish details
    const dishDetailGeometry = new THREE.RingGeometry(0.2 * size, 0.55 * size, 32);
    const dishDetailMaterial = new THREE.MeshPhongMaterial({
        color: 0x333333,
        metalness: 0.8,
        roughness: 0.2,
        side: THREE.DoubleSide
    });
    const dishDetail = new THREE.Mesh(dishDetailGeometry, dishDetailMaterial);
    
    dish.rotation.x = Math.PI / 2;
    dish.position.y = 1.0;
    dishDetail.rotation.x = Math.PI / 2;
    dishDetail.position.y = 1.01;
    
    group.add(dish);
    group.add(dishDetail);
    return group;
}

// Helper function to create instruments
function createInstruments() {
    const group = new THREE.Group();
    const instrumentGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const instrumentMaterial = new THREE.MeshPhongMaterial({
        color: 0x444444,
        metalness: 0.8,
        roughness: 0.2
    });

    for (let i = 0; i < 3; i++) {
        const instrument = new THREE.Mesh(instrumentGeometry, instrumentMaterial);
        instrument.position.y = -0.6 + (i * 0.4);
        instrument.position.z = 0.4;
        group.add(instrument);
    }

    return group;
}

// Update probe rotation and tilt based on movement
function updateProbeRotation() {
    const speed = Math.sqrt(
        probe.velocity.x * probe.velocity.x +
        probe.velocity.y * probe.velocity.y +
        probe.velocity.z * probe.velocity.z
    );

    if (speed > MIN_VELOCITY) {
        // Calculate target rotation based on velocity direction
        const targetRotationX = Math.atan2(probe.velocity.y, probe.velocity.z);
        const targetRotationY = Math.atan2(probe.velocity.x, probe.velocity.z);
        const targetRotationZ = Math.atan2(probe.velocity.x, probe.velocity.y);

        // Smoothly interpolate current rotation to target rotation
        probe.rotation.x += (targetRotationX - probe.rotation.x) * ROTATION_SPEED;
        probe.rotation.y += (targetRotationY - probe.rotation.y) * ROTATION_SPEED;
        probe.rotation.z += (targetRotationZ - probe.rotation.z) * ROTATION_SPEED;

        // Apply tilt based on movement direction
        const tiltX = probe.velocity.z * TILT_SPEED;
        const tiltY = probe.velocity.x * TILT_SPEED;
        probe.rotation.x += tiltX;
        probe.rotation.y += tiltY;

        // Apply roll based on z-axis movement
        const roll = probe.velocity.z * ROLL_SPEED;
        probe.rotation.z += roll;
    }
} 