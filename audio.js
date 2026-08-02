// audio.js
class AudioManager {
    constructor() {
        this.ctx = null;
        this.ready = false;
        this.engineNodes = null;
        this.squealNodes = null;
        this.currentType = null;
    }

    init() {
        if (this.ready) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.setupSqueal();
            this.ready = true;
        } catch(e) { console.error("Kunne ikke starte AudioContext", e); }
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    }

    makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        for (let i = 0; i < n_samples; ++i) {
            let x = i * 2 / n_samples - 1;
            curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
        }
        return curve;
    }

    setupSqueal() {
        this.squealNodes = {
            osc: this.ctx.createOscillator(),
            gain: this.ctx.createGain()
        };
        this.squealNodes.osc.type = 'triangle';
        this.squealNodes.gain.gain.value = 0;
        this.squealNodes.osc.connect(this.squealNodes.gain);
        this.squealNodes.gain.connect(this.ctx.destination);
        this.squealNodes.osc.start();
    }

    buildEngine(type) {
        if (this.engineNodes) {
            this.engineNodes.osc.stop();
            this.engineNodes.osc.disconnect();
            this.engineNodes.masterGain.disconnect();
        }

        this.currentType = type;
        this.engineNodes = {};

        if (type === 'gokart') {
            // 2-Takt Profil
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';

            this.engineNodes.hpf = this.ctx.createBiquadFilter();
            this.engineNodes.hpf.type = 'highpass';
            this.engineNodes.hpf.frequency.value = 150; 

            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'lowpass';

            this.engineNodes.dist = this.ctx.createWaveShaper();
            this.engineNodes.dist.curve = this.makeDistortionCurve(80); 
            this.engineNodes.dist.oversample = '4x';

            this.engineNodes.masterGain = this.ctx.createGain();
            this.engineNodes.masterGain.gain.value = 0;

            this.engineNodes.osc.connect(this.engineNodes.hpf);
            this.engineNodes.hpf.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.masterGain);
            this.engineNodes.masterGain.connect(this.ctx.destination);

            this.engineNodes.osc.start();
        } else {
            // Generisk 4-Takt (Standard)
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            this.engineNodes.masterGain = this.ctx.createGain();
            this.engineNodes.masterGain.gain.value = 0;
            this.engineNodes.osc.connect(this.engineNodes.masterGain);
            this.engineNodes.masterGain.connect(this.ctx.destination);
            this.engineNodes.osc.start();
        }
    }

    update(vehicleType, rpm, speedKmh, throttle, spinSeverity) {
        if (!this.ready) return;
        
        if (this.currentType !== vehicleType) {
            this.buildEngine(vehicleType);
        }

        let sRpm = isFinite(rpm) && rpm > 0 ? rpm : 0;
        let sSpd = isFinite(speedKmh) && speedKmh > 0 ? speedKmh : 0;
        let sThr = isFinite(throttle) ? Math.abs(throttle) : 0;

        if (vehicleType === 'gokart') {
            let freq = sRpm / 60;
            this.engineNodes.osc.frequency.setTargetAtTime(freq, this.ctx.currentTime, 0.05);

            let lpFreq = 400 + (sRpm * 0.5) + (sThr * 2000); 
            if (sRpm > 7000 && sThr > 0.5) lpFreq += 3000;

            let volTarget = 0.05 + (sThr * 0.15);
            let qTarget = 2;

            if (sThr < 0.1) {
                if (sRpm < 3000) {
                    qTarget = 10;
                    if (Math.random() > 0.5) {
                        volTarget = (Math.random() * 0.1); 
                        this.engineNodes.lpf.frequency.setValueAtTime(lpFreq + (Math.random() * 800), this.ctx.currentTime);
                    } else { volTarget = 0; }
                } else {
                    qTarget = 6;
                    lpFreq = 2000 + (sRpm * 0.4);
                    if (Math.random() > 0.3) {
                        volTarget = (Math.random() * 0.3) + 0.15;
                        this.engineNodes.lpf.frequency.setValueAtTime(lpFreq + (Math.random() * 1500), this.ctx.currentTime);
                    } else { volTarget = 0; }
                }
            }

            this.engineNodes.lpf.frequency.setTargetAtTime(lpFreq, this.ctx.currentTime, 0.05);
            this.engineNodes.lpf.Q.setTargetAtTime(qTarget, this.ctx.currentTime, 0.1);
            this.engineNodes.masterGain.gain.setTargetAtTime(volTarget, this.ctx.currentTime, 0.01);
        } else {
            this.engineNodes.osc.frequency.value = Math.max(10, 40 + (sRpm / 22)); 
            this.engineNodes.masterGain.gain.value = sRpm < 100 ? 0 : 0.08 + (sThr * 0.2);
        }

        // Dekkskrik
        if (this.squealNodes) {
            if(spinSeverity > 0.1 && sSpd > 5) { 
                this.squealNodes.gain.gain.value = isFinite(spinSeverity) ? spinSeverity * 0.15 : 0; 
                this.squealNodes.osc.frequency.value = 800 + Math.random()*200; 
            } else { 
                this.squealNodes.gain.gain.value = 0; 
            }
        }
    }

    playBeep(freq, duration = 0.3) {
        if (!this.ready || this.ctx.state !== 'running' || !isFinite(freq)) return;
        let osc = this.ctx.createOscillator(); let gain = this.ctx.createGain();
        osc.frequency.value = freq; osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); gain.gain.setValueAtTime(0.5, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration); osc.stop(this.ctx.currentTime + duration);
    }
}
window.audioManager = new AudioManager();
