// Sponsor configurations
const SPONSORS = {
    NASA: {
        name: 'NASA',
        description: 'Focus on precise scientific exploration and Lagrange point studies.',
        logo: 'https://www.nasa.gov/wp-content/themes/nasa/assets/images/nasa-logo@2x.png',
        colors: {
            primary: '#0B3D91',
            secondary: '#FC3D21',
            accent: '#FFFFFF'
        },
        satellite: {
            bodyColor: '#FFFFFF',
            panelColor: '#0B3D91',
            details: {
                instruments: true,
                antennaSize: 1.2,
                panelSize: 1
            }
        },
        special: {
            name: 'Enhanced Stability',
            effect: 'stabilityBonus',
            value: 1.5
        },
        objectives: {
            main: 'Maintain position within 1 unit of any Lagrange point',
            bonus: 'Visit all 5 Lagrange points',
            timeLimit: 180
        },
        scoring: {
            stabilityMultiplier: 2.0,
            precisionBonus: 100,
            timeBonus: 10
        }
    },
    ESA: {
        name: 'European Space Agency',
        description: 'Efficient exploration and sustainable space operations.',
        logo: 'https://www.esa.int/extension/pillars/design/pillars/images/ESA_Logo.svg',
        colors: {
            primary: '#003B6F',
            secondary: '#FFD700',
            accent: '#FFFFFF'
        },
        satellite: {
            bodyColor: '#003B6F',
            panelColor: '#FFD700',
            details: {
                instruments: false,
                antennaSize: 1,
                panelSize: 1.5
            }
        },
        special: {
            name: 'Energy Efficiency',
            effect: 'reducedDrift',
            value: 0.7
        },
        objectives: {
            main: 'Find the most efficient path between Lagrange points',
            bonus: 'Minimize total distance traveled',
            timeLimit: 240
        },
        scoring: {
            efficiencyMultiplier: 1.5,
            pathBonus: 150,
            timeBonus: 5
        }
    },
    SpaceX: {
        name: 'SpaceX',
        description: 'Push the boundaries of speed and innovation in space.',
        logo: 'https://www.spacex.com/static/images/share.jpg',
        colors: {
            primary: '#000000',
            secondary: '#FFFFFF',
            accent: '#FF0000'
        },
        satellite: {
            bodyColor: '#FFFFFF',
            panelColor: '#000000',
            details: {
                instruments: false,
                antennaSize: 0.8,
                panelSize: 0.8
            }
        },
        special: {
            name: 'Rapid Acceleration',
            effect: 'speedBoost',
            value: 1.3
        },
        objectives: {
            main: 'Reach all Lagrange points as quickly as possible',
            bonus: 'Achieve maximum velocity',
            timeLimit: 120
        },
        scoring: {
            speedMultiplier: 2.0,
            velocityBonus: 200,
            timeBonus: 20
        }
    }
};

class SponsorSystem {
    constructor() {
        this.currentSponsor = null;
        this.satisfaction = 100;
        this.achievements = new Map();
    }

    selectSponsor(sponsorKey) {
        if (!SPONSORS[sponsorKey]) {
            console.error('Invalid sponsor key:', sponsorKey);
            return null;
        }
        
        this.currentSponsor = SPONSORS[sponsorKey];
        this.satisfaction = 100;
        this.initializeAchievements();
        return this.currentSponsor;
    }

    initializeAchievements() {
        if (!this.currentSponsor) {
            console.error('No sponsor selected');
            return;
        }

        this.achievements.clear();
        const sponsor = this.currentSponsor;
        
        switch(sponsor.name) {
            case 'NASA':
                this.achievements.set('Precise Positioning', false);
                this.achievements.set('Multi-Point Explorer', false);
                this.achievements.set('Stability Master', false);
                break;
            case 'European Space Agency':
                this.achievements.set('Efficient Navigator', false);
                this.achievements.set('Path Optimizer', false);
                this.achievements.set('Energy Conservator', false);
                break;
            case 'SpaceX':
                this.achievements.set('Speed Demon', false);
                this.achievements.set('Quick Explorer', false);
                this.achievements.set('Momentum Master', false);
                break;
            default:
                console.error('Unknown sponsor:', sponsor.name);
        }
    }

    updateSatisfaction(performance) {
        // Update sponsor satisfaction based on performance metrics
        const base = performance.objective ? 1 : -1;
        const modifier = performance.bonus ? 1.5 : 1;
        const change = base * modifier * 5;
        
        this.satisfaction = Math.max(0, Math.min(100, this.satisfaction + change));
        return this.satisfaction;
    }

    checkAchievements(gameState) {
        const sponsor = this.currentSponsor;
        
        switch(sponsor.name) {
            case 'NASA':
                if (gameState.stabilityTime > 30) this.achievements.set('Stability Master', true);
                if (gameState.visitedPoints.size >= 5) this.achievements.set('Multi-Point Explorer', true);
                if (gameState.maxPrecision < 0.5) this.achievements.set('Precise Positioning', true);
                break;
            // Add similar checks for other sponsors
        }
    }

    getSpecialAbilityEffect() {
        return this.currentSponsor.special;
    }

    calculateScore(gameState) {
        const sponsor = this.currentSponsor;
        let score = 0;
        
        // Base score calculation based on sponsor-specific metrics
        if (sponsor.scoring.stabilityMultiplier) {
            score += gameState.stabilityTime * sponsor.scoring.stabilityMultiplier;
        }
        if (sponsor.scoring.efficiencyMultiplier) {
            score += (1000 - gameState.totalDistance) * sponsor.scoring.efficiencyMultiplier;
        }
        if (sponsor.scoring.speedMultiplier) {
            score += gameState.maxVelocity * sponsor.scoring.speedMultiplier;
        }
        
        // Add achievement bonuses
        this.achievements.forEach((achieved, name) => {
            if (achieved) score += 500;
        });
        
        return Math.floor(score);
    }
}

// Export the sponsor system
window.SponsorSystem = SponsorSystem;
window.SPONSORS = SPONSORS; 