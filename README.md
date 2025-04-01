# 3D Physics Puzzle Game

A modern 3D physics-based puzzle game built with Three.js and Cannon.js, featuring portal mechanics and cross-game connectivity.

## Features

- Physics-based gameplay using Cannon.js
- 3D graphics with Three.js
- Mobile-friendly controls with Nipple.js
- Portal system for cross-game connectivity
- Global leaderboard using Firebase
- Responsive UI with modern design
- Sound effects and background music
- Multiple levels with increasing difficulty

## Technical Stack

- Three.js for 3D rendering
- Cannon.js for physics engine
- Nipple.js for mobile controls
- Firebase for leaderboard/storage
- Web Audio API for sound management
- Vite for build tooling

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/physics-puzzle-game.git
cd physics-puzzle-game
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Build for production:
```bash
npm run build
```

### Project Structure

```
physics-puzzle-game/
├── public/
│   ├── audio/           # Sound effects and music
│   ├── levels/          # Level definitions
│   └── models/          # 3D models
├── src/
│   ├── core/           # Core game components
│   │   ├── Game.js
│   │   ├── Player.js
│   │   └── Portal.js
│   ├── managers/       # Game managers
│   │   ├── AudioManager.js
│   │   ├── LevelManager.js
│   │   └── UIManager.js
│   └── index.js        # Entry point
├── index.html
├── package.json
└── vite.config.js
```

## Game Controls

### Desktop
- WASD/Arrow keys: Movement
- Spacebar: Jump
- Mouse: Camera control
- ESC: Pause menu

### Mobile
- Virtual joystick: Movement
- Tap: Jump
- Swipe: Camera control
- Menu button: Pause menu

## Portal System

The game features a portal system that allows players to connect with other games in the Vibeverse. When entering a portal, the game will redirect to the next game while preserving player data such as:
- Username
- Player color
- Movement speed
- Reference to the previous game

## Level Design

Levels are defined using JSON files in the `public/levels` directory. Each level includes:
- Ground configuration
- Obstacle placement
- Collectible items
- Portal locations
- Lighting setup
- Time limit

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Three.js team for the amazing 3D library
- Cannon.js team for the physics engine
- Nipple.js creator for mobile controls
- Firebase team for the backend services
- Vite team for the build tooling 