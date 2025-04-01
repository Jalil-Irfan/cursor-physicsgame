export class AudioManager {
    constructor() {
        this.sounds = {};
        this.music = null;
        this.isMuted = false;
        this.volume = 0.5;

        // Initialize audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Create default sounds
        this.createDefaultSounds();
        
        // Load audio assets
        this.loadAudioAssets();
    }

    createDefaultSounds() {
        // Create a simple beep sound as default
        const sampleRate = this.audioContext.sampleRate;
        const duration = 0.1; // seconds
        const numSamples = Math.floor(sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
        const channelData = buffer.getChannelData(0);

        for (let i = 0; i < numSamples; i++) {
            const t = i / sampleRate;
            channelData[i] = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-t * 10);
        }

        // Set as default sound for all effects
        ['collect', 'jump', 'portal', 'levelComplete', 'gameOver'].forEach(sound => {
            this.sounds[sound] = buffer;
        });
    }

    async loadAudioAssets() {
        try {
            // Load background music
            try {
                const musicResponse = await fetch('/audio/background.mp3');
                if (musicResponse.ok) {
                    const musicArrayBuffer = await musicResponse.arrayBuffer();
                    const musicAudioBuffer = await this.audioContext.decodeAudioData(musicArrayBuffer);
                    
                    this.music = {
                        buffer: musicAudioBuffer,
                        source: null,
                        gainNode: null
                    };
                } else {
                    console.warn('Background music file not found, using default sound');
                    // Create a simple background music loop
                    const sampleRate = this.audioContext.sampleRate;
                    const duration = 2; // seconds
                    const numSamples = Math.floor(sampleRate * duration);
                    const buffer = this.audioContext.createBuffer(1, numSamples, sampleRate);
                    const channelData = buffer.getChannelData(0);

                    for (let i = 0; i < numSamples; i++) {
                        const t = i / sampleRate;
                        channelData[i] = Math.sin(2 * Math.PI * 220 * t) * 0.5;
                    }

                    this.music = {
                        buffer: buffer,
                        source: null,
                        gainNode: null
                    };
                }
            } catch (error) {
                console.warn('Error loading background music:', error);
                // Use default sound as fallback
                this.createDefaultSounds();
            }

            // Load sound effects
            const soundEffects = [
                'collect',
                'jump',
                'portal',
                'levelComplete',
                'gameOver'
            ];

            for (const sound of soundEffects) {
                try {
                    const response = await fetch(`/audio/${sound}.mp3`);
                    if (response.ok) {
                        const arrayBuffer = await response.arrayBuffer();
                        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                        this.sounds[sound] = audioBuffer;
                    } else {
                        console.warn(`Sound effect ${sound} not found, using default sound`);
                    }
                } catch (error) {
                    console.warn(`Error loading sound effect ${sound}:`, error);
                }
            }
        } catch (error) {
            console.warn('Error in audio asset loading:', error);
        }
    }

    playBackgroundMusic() {
        if (!this.music || this.isMuted) return;

        // Stop existing music if playing
        if (this.music.source) {
            this.music.source.stop();
        }

        // Create new source and gain node
        this.music.source = this.audioContext.createBufferSource();
        this.music.gainNode = this.audioContext.createGain();

        // Set up audio graph
        this.music.source.buffer = this.music.buffer;
        this.music.source.loop = true;
        this.music.gainNode.gain.value = this.volume;

        // Connect nodes
        this.music.source.connect(this.music.gainNode);
        this.music.gainNode.connect(this.audioContext.destination);

        // Start playing
        this.music.source.start(0);
    }

    playSound(soundName) {
        if (!this.sounds[soundName] || this.isMuted) return;

        const source = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();

        source.buffer = this.sounds[soundName];
        gainNode.gain.value = this.volume;

        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        source.start(0);
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        
        if (this.music?.gainNode) {
            this.music.gainNode.gain.value = this.volume;
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        
        if (this.isMuted) {
            if (this.music?.source) {
                this.music.source.stop();
            }
        } else {
            this.playBackgroundMusic();
        }
    }

    stopAll() {
        // Stop background music
        if (this.music?.source) {
            this.music.source.stop();
            this.music.source = null;
        }

        // Stop all sound effects
        Object.values(this.sounds).forEach(sound => {
            if (sound.source) {
                sound.source.stop();
            }
        });
    }

    dispose() {
        this.stopAll();
        this.audioContext.close();
    }
} 