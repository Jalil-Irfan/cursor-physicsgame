# Lagrange Drift

A 3D space game that simulates the Earth-Moon system and its Lagrange points. Players control a probe and navigate through the gravitational field between Earth and Moon.

## Features

- Realistic Earth-Moon system with proper relative sizes and distances
- Five Lagrange points (L1-L5) marked with glowing indicators
- Player-controlled probe with simplified physics simulation
- Visual representation of gravitational forces
- Mobile-friendly controls with virtual joystick
- Desktop controls with WASD/Arrow keys
- Camera orbit controls for scene inspection
- Responsive design that works on both desktop and mobile devices

## Controls

### Desktop
- WASD or Arrow keys: Move the probe
- Mouse drag: Orbit camera around the scene
- Mouse scroll: Zoom in/out

### Mobile
- Virtual joystick: Move the probe
- Touch and drag: Orbit camera around the scene
- Pinch to zoom: Zoom in/out

## Technical Details

The game is built using:
- Three.js for 3D rendering
- NippleJS for mobile joystick controls
- Vanilla JavaScript for game logic
- CSS for responsive design

## Setup

1. Clone the repository
2. Open `index.html` in a modern web browser
3. Enter your name and start playing!

## Physics Simulation

The game uses a simplified gravitational model:
- Earth's mass is normalized to 1
- Moon's mass is 0.0123 (relative to Earth)
- Gravitational forces are calculated using Newton's law of universal gravitation
- Lagrange points are positioned at their approximate locations in the Earth-Moon system

## Browser Support

The game works best in modern browsers that support WebGL:
- Chrome (recommended)
- Firefox
- Safari
- Edge 

Objective:
Balance your satellite at any Lagrange point for 30 seconds to win
The closer you stay to the center of a Lagrange point, the more points you earn
Scoring System:
Score increases while you're within the balance threshold of any Lagrange point
The closer you are to the exact Lagrange point, the faster you score
Maximum score rate is 10 points per second when perfectly centered
Winning Conditions:
Stay within 2 units of any Lagrange point for 30 consecutive seconds
You can switch between different Lagrange points, but the timer will reset
The game tracks your total time and score
UI Feedback:
Timer shows your total game time
Score display shows your current score
Balance status shows how long you've been balanced at the current point
Color indicators show when you're in a good position
Win Screen:
Shows congratulations message
Displays your final score
Offers a "Play Again" button to restart
To win the game:
Navigate to any Lagrange point (marked by green spheres)
Try to stay as close to the center as possible
Maintain position for 30 seconds
Use the gravitational forces to help maintain your position
The closer you stay to the center, the higher your score will be
The game is now more challenging and engaging with clear objectives and feedback. Would you like me to adjust any of these parameters (like the winning time or score rate) to make it easier or more challenging?