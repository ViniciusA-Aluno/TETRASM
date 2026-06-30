// sound.js - Gerenciador de Efeitos Sonoros e Áudio
class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.volume = 1.0;
        this.audioContext = null;

        // Mapeamento dos arquivos de áudio em assets/audio/
        this.soundSources = {
            config: 'assets/audio/config.mp3',
            move: 'assets/audio/moving.mp3',
            snap: 'assets/audio/snap2.mp3',
            clack: 'assets/audio/clack.mp3',
            bip: 'assets/audio/bip.mp3',
            not: 'assets/audio/bip.mp3',
            win: 'assets/audio/victory.mp3',
            error: 'assets/audio/error.mp3',
            newgame: 'assets/audio/newgame.mp3'
        };

        this.preloadSounds();
    }

    preloadSounds() {
        for (const [key, path] of Object.entries(this.soundSources)) {
            const audio = new Audio();
            audio.src = path;
            audio.preload = 'auto';
            audio.volume = this.volume;
            this.sounds[key] = audio;
        }
    }

    setVolume(val) {
        this.volume = Math.max(0, Math.min(1, parseFloat(val)));
        for (const audio of Object.values(this.sounds)) {
            if (audio) audio.volume = this.volume;
        }
    }

    getVolume() {
        return this.volume;
    }

    getAudioContext() {
        if (!this.audioContext) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) {
                this.audioContext = new AudioCtx();
            }
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
        return this.audioContext;
    }

    play(soundName) {
        if (this.isMuted || this.volume <= 0) return;

        const audio = this.sounds[soundName];
        if (audio) {
            const clone = audio.cloneNode();
            clone.volume = this.volume;
            const playPromise = clone.play();
            if (playPromise !== undefined) {
                playPromise.catch(() => {
                    this.playSynthFallback(soundName);
                });
            }
        } else {
            this.playSynthFallback(soundName);
        }
    }

    playSynthFallback(type) {
        try {
            const ctx = this.getAudioContext();
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);

            const now = ctx.currentTime;
            const vol = this.volume;

            if (type === 'move') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(440, now + 0.15);
                gain.gain.setValueAtTime(0.15 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'snap' || type === 'clack') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.exponentialRampToValueAtTime(130, now + 0.08);
                gain.gain.setValueAtTime(0.2 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'not' || type === 'bip') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.setValueAtTime(300, now + 0.05);
                gain.gain.setValueAtTime(0.1 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'win') {
                const notes = [261.63, 329.63, 392.00, 523.25];
                notes.forEach((freq, i) => {
                    const noteOsc = ctx.createOscillator();
                    const noteGain = ctx.createGain();
                    noteOsc.connect(noteGain);
                    noteGain.connect(ctx.destination);
                    noteOsc.type = 'triangle';
                    noteOsc.frequency.setValueAtTime(freq, now + i * 0.1);
                    noteGain.gain.setValueAtTime(0.2 * vol, now + i * 0.1);
                    noteGain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.2);
                    noteOsc.start(now + i * 0.1);
                    noteOsc.stop(now + i * 0.1 + 0.2);
                });
            } else if (type === 'error') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(80, now + 0.2);
                gain.gain.setValueAtTime(0.25 * vol, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            }
        } catch (e) {
            // Silently ignore audio context issues
        }
    }
}

// Instância global do SoundManager
window.soundManager = new SoundManager();
