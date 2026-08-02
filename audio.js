class AudioManager {
    constructor() {
        this.ctx = null;
        this.ready = false;
        this.engineNodes = null;
        this.squealNodes = null;
        this.currentType = null;
        
        this.prevThrottle = 0;
        this.bovTimer = 0;
        this.noiseBuffer = null;
    }

    init() {
        if (this.ready) return;
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.setupSqueal();
            this.createNoiseBuffer();
            this.ready = true;
        } catch(e) { console.error("Kunne ikke starte AudioContext", e); }
    }

    resume() {
        if (!this.ready) this.init();
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
    }

    // Fikset matematikk: Normaliserer utsignalet tilbake til -1.0 til 1.0
    makeDistortionCurve(amount) {
        const k = typeof amount === 'number' ? amount : 50;
        const n_samples = 44100;
        const curve = new Float32Array(n_samples);
        const deg = Math.PI / 180;
        
        // Finner maksverdien for å unngå signal-kvelning
        const max_x = 1;
        const max_val = (3 + k) * max_x * 20 * deg / (Math.PI + k * Math.abs(max_x));

        for (let i = 0; i < n_samples; ++i) {
            let x = i * 2 / n_samples - 1;
            let val = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
            curve[i] = val / max_val; 
        }
        return curve;
    }

    createNoiseBuffer() {
        if (!this.ctx) return;
        const bufferSize = this.ctx.sampleRate * 1.0; 
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
    }

    setupSqueal() {
        if (!this.ctx) return;
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
            try { if(this.engineNodes.osc) this.engineNodes.osc.stop(); } catch(e){}
            try { if(this.engineNodes.subOsc) this.engineNodes.subOsc.stop(); } catch(e){}
            try { if(this.engineNodes.turboOsc) this.engineNodes.turboOsc.stop(); } catch(e){}
            try { if(this.engineNodes.lfo) this.engineNodes.lfo.stop(); } catch(e){}
            try { this.engineNodes.masterGain.disconnect(); } catch(e){}
        }

        this.currentType = type;
        this.engineNodes = {};

        this.engineNodes.masterGain = this.ctx.createGain();
        this.engineNodes.masterGain.gain.value = 0;
        this.engineNodes.masterGain.connect(this.ctx.destination);

        if (type === 'gokart') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            this.engineNodes.hpf = this.ctx.createBiquadFilter();
            this.engineNodes.hpf.type = 'highpass';
            this.engineNodes.hpf.frequency.value = 80; // Senket fra 150 for å la bassen komme frem
            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'lowpass';
            this.engineNodes.dist = this.ctx.createWaveShaper();
            this.engineNodes.dist.curve = this.makeDistortionCurve(80); 

            this.engineNodes.osc.connect(this.engineNodes.hpf);
            this.engineNodes.hpf.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.masterGain);
            this.engineNodes.osc.start();
        } 
        else if (type === 'v8') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            this.engineNodes.subOsc = this.ctx.createOscillator();
            this.engineNodes.subOsc.type = 'square';
            this.engineNodes.lfo = this.ctx.createOscillator();
            this.engineNodes.lfo.type = 'sine';
            this.engineNodes.amGain = this.ctx.createGain();
            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'lowpass';
            this.engineNodes.dist = this.ctx.createWaveShaper();
            this.engineNodes.dist.curve = this.makeDistortionCurve(60);

            this.engineNodes.osc.connect(this.engineNodes.dist);
            this.engineNodes.subOsc.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.amGain);
            this.engineNodes.amGain.connect(this.engineNodes.masterGain);
            
            this.engineNodes.lfoGain = this.ctx.createGain();
            this.engineNodes.lfo.connect(this.engineNodes.lfoGain);
            this.engineNodes.lfoGain.connect(this.engineNodes.amGain.gain);

            this.engineNodes.osc.start();
            this.engineNodes.subOsc.start();
            this.engineNodes.lfo.start();
        }
        else if (type === 'v10') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'lowpass';
            this.engineNodes.lpf.Q.value = 6;
            this.engineNodes.dist = this.ctx.createWaveShaper();
            this.engineNodes.dist.curve = this.makeDistortionCurve(40);

            this.engineNodes.osc.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.masterGain);
            this.engineNodes.osc.start();
        }
        else if (type === 'rotary') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'square';
            this.engineNodes.lfo = this.ctx.createOscillator();
            this.engineNodes.lfo.type = 'sawtooth';
            this.engineNodes.amGain = this.ctx.createGain();
            this.engineNodes.lfoGain = this.ctx.createGain();
            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'bandpass';
            this.engineNodes.dist = this.ctx.createWaveShaper();
            this.engineNodes.dist.curve = this.makeDistortionCurve(90);

            this.engineNodes.osc.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.amGain);
            this.engineNodes.amGain.connect(this.engineNodes.masterGain);

            this.engineNodes.lfo.connect(this.engineNodes.lfoGain);
            this.engineNodes.lfoGain.connect(this.engineNodes.amGain.gain);

            this.engineNodes.osc.start();
            this.engineNodes.lfo.start();
        }
        else if (type === 'turbo') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            this.engineNodes.turboOsc = this.ctx.createOscillator();
            this.engineNodes.turboOsc.type = 'sine';
            this.engineNodes.turboGain = this.ctx.createGain();
            this.engineNodes.turboGain.gain.value = 0;
            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'lowpass';
            this.engineNodes.dist = this.ctx.createWaveShaper();
            this.engineNodes.dist.curve = this.makeDistortionCurve(60);

            this.engineNodes.osc.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.masterGain);
            
            this.engineNodes.turboOsc.connect(this.engineNodes.turboGain);
            this.engineNodes.turboGain.connect(this.engineNodes.masterGain);

            this.engineNodes.osc.start();
            this.engineNodes.turboOsc.start();
        }
        else if (type === 'v6') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            this.engineNodes.subOsc = this.ctx.createOscillator();
            this.engineNodes.subOsc.type = 'triangle';
            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'lowpass';
            this.engineNodes.lpf.Q.value = 4;
            this.engineNodes.dist = this.ctx.createWaveShaper();
            this.engineNodes.dist.curve = this.makeDistortionCurve(40);

            this.engineNodes.osc.connect(this.engineNodes.dist);
            this.engineNodes.subOsc.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.masterGain);
            
            this.engineNodes.osc.start();
            this.engineNodes.subOsc.start();
        }
        else if (type === 'ev') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'triangle';
            this.engineNodes.hpf = this.ctx.createBiquadFilter();
            this.engineNodes.hpf.type = 'highpass';
            this.engineNodes.hpf.frequency.value = 800;
            
            this.engineNodes.osc.connect(this.engineNodes.hpf);
            this.engineNodes.hpf.connect(this.engineNodes.masterGain);
            this.engineNodes.osc.start();
        }
        else {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'lowpass';
            
            this.engineNodes.osc.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.masterGain);
            this.engineNodes.osc.start();
        }
    }

    playBlowoffValve() {
        if (!this.noiseBuffer || !this.ready) return;
        let source = this.ctx.createBufferSource();
        source.buffer = this.noiseBuffer;
        let bpFilter = this.ctx.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.value = 4000 + Math.random() * 1500;
        bpFilter.Q.value = 2.0;

        let gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(1.5, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);

        source.connect(bpFilter);
        bpFilter.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        source.start();
        source.stop(this.ctx.currentTime + 0.35);
    }

    update(vehicleType, rpm, speedKmh, throttle, spinSeverity) {
        if (!this.ready || !this.ctx) return;
        
        // Tvinger resume under oppdateringsloopen hvis context har sovnet
        if (this.ctx.state !== 'running') this.resume();

        if (this.currentType !== vehicleType) this.buildEngine(vehicleType);

        let sRpm = isFinite(rpm) && rpm > 0 ? rpm : 0;
        let sSpd = isFinite(speedKmh) && speedKmh > 0 ? speedKmh : 0;
        let sThr = isFinite(throttle) ? Math.abs(throttle) : 0;

        // Fysikk-korrekte frekvens-multiplikatorer
        let baseFreq = sRpm / 60; 

        if (vehicleType === 'gokart') {
            this.engineNodes.osc.frequency.value = baseFreq; // 1 cyl, 1 puls per rotasjon
            let lpFreq = 400 + (sRpm * 0.5) + (sThr * 2500); 
            if (sRpm > 7000 && sThr > 0.5) lpFreq += 3000;
            
            let volTarget = 0.2 + (sThr * 0.5);
            let qTarget = 2;

            if (sThr < 0.1) {
                if (sRpm < 3000) {
                    qTarget = 10;
                    if (Math.random() > 0.5) {
                        volTarget = 0.1;
                        lpFreq += Math.random() * 800;
                    } else volTarget = 0;
                } else {
                    qTarget = 6;
                    lpFreq = 2000 + (sRpm * 0.4);
                    if (Math.random() > 0.3) {
                        volTarget = 0.3 + (Math.random() * 0.2);
                        lpFreq += Math.random() * 1500;
                    } else volTarget = 0;
                }
            }
            this.engineNodes.lpf.frequency.value = lpFreq;
            this.engineNodes.lpf.Q.value = qTarget;
            this.engineNodes.masterGain.gain.value = volTarget;
        } 
        else if (vehicleType === 'v8') {
            this.engineNodes.osc.frequency.value = baseFreq * 4; // V8 = 4 pulser
            this.engineNodes.subOsc.frequency.value = baseFreq * 2;
            this.engineNodes.lfo.frequency.value = baseFreq / 2; // Krysplan pulsering
            this.engineNodes.lfoGain.gain.value = sRpm < 3500 ? 0.7 : 0.1;
            this.engineNodes.lpf.frequency.value = 800 + (sRpm * 0.6) + (sThr * 3000);
            this.engineNodes.masterGain.gain.value = 0.25 + (sThr * 0.5);
        }
        else if (vehicleType === 'v10') {
            this.engineNodes.osc.frequency.value = baseFreq * 5; // V10 = 5 pulser
            this.engineNodes.lpf.frequency.value = 1500 + (sRpm * 1.5) + (sThr * 4500);
            this.engineNodes.masterGain.gain.value = 0.2 + (sThr * 0.6);
        }
        else if (vehicleType === 'rotary') {
            this.engineNodes.osc.frequency.value = baseFreq * 3; // Wankel = 3 pulser per hovedrotasjon
            this.engineNodes.lfo.frequency.value = baseFreq / 1.5;
            this.engineNodes.lfoGain.gain.value = sRpm < 4000 ? 0.8 : 0.0;
            this.engineNodes.lpf.frequency.value = 1200 + (sRpm * 0.8) + (sThr * 2500);
            this.engineNodes.lpf.Q.value = 1.5 + sThr * 2;
            this.engineNodes.masterGain.gain.value = 0.2 + (sThr * 0.5);
        }
        else if (vehicleType === 'turbo') {
            this.engineNodes.osc.frequency.value = baseFreq * 2; // I4 = 2 pulser
            this.engineNodes.lpf.frequency.value = 600 + (sRpm * 0.7) + (sThr * 3000);
            this.engineNodes.turboOsc.frequency.value = 2000 + (sRpm * 0.5) + (sThr * 4000);
            
            let turboVol = (sRpm > 3500 && sThr > 0.4) ? (sThr * 0.2) : 0;
            this.engineNodes.turboGain.gain.value = turboVol;

            let t = this.ctx.currentTime;
            if (this.prevThrottle > 0.7 && sThr < 0.1 && sRpm > 4500 && (t - this.bovTimer > 0.5)) {
                this.playBlowoffValve();
                this.bovTimer = t;
                this.engineNodes.turboGain.gain.value = 0;
            }
            this.engineNodes.masterGain.gain.value = 0.25 + (sThr * 0.5);
        }
        else if (vehicleType === 'v6') {
            this.engineNodes.osc.frequency.value = baseFreq * 3; // V6 = 3 pulser
            this.engineNodes.subOsc.frequency.value = baseFreq * 1.5;
            this.engineNodes.lpf.frequency.value = 1000 + (sRpm * 0.8) + (sThr * 2500);
            this.engineNodes.masterGain.gain.value = 0.25 + (sThr * 0.5);
        }
        else if (vehicleType === 'ev') {
            this.engineNodes.osc.frequency.value = 100 + (sSpd * 12);
            this.engineNodes.masterGain.gain.value = sSpd > 1 ? 0.1 + (sThr * 0.3) : 0;
        }
        else {
            this.engineNodes.osc.frequency.value = baseFreq * 2;
            this.engineNodes.lpf.frequency.value = 800 + (sRpm * 0.6) + (sThr * 2000);
            this.engineNodes.masterGain.gain.value = 0.25 + (sThr * 0.5);
        }

        if (this.squealNodes) {
            if(spinSeverity > 0.1 && sSpd > 5) { 
                this.squealNodes.gain.gain.value = isFinite(spinSeverity) ? spinSeverity * 0.3 : 0; 
                this.squealNodes.osc.frequency.value = 800 + Math.random()*200; 
            } else { 
                this.squealNodes.gain.gain.value = 0; 
            }
        }

        this.prevThrottle = sThr;
    }

    playBeep(freq, duration = 0.3) {
        this.resume();
        if (!this.ready || !this.ctx || this.ctx.state !== 'running' || !isFinite(freq)) return;
        let osc = this.ctx.createOscillator(); let gain = this.ctx.createGain();
        osc.frequency.value = freq; osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); gain.gain.setValueAtTime(0.5, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration); osc.stop(this.ctx.currentTime + duration);
    }
}
window.audioManager = new AudioManager();
