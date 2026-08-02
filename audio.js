class AudioManager {
    constructor() {
        this.ctx = null;
        this.ready = false;
        this.engineNodes = null;
        this.squealNodes = null;
        this.currentType = null;
        
        // State tracking
        this.prevThrottle = 0;
        this.bovTimer = 0;
        
        // Hvit støy buffer (For Turbo BOV)
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

    createNoiseBuffer() {
        const bufferSize = this.ctx.sampleRate * 1.0; 
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        this.noiseBuffer = buffer;
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
            if(this.engineNodes.osc) this.engineNodes.osc.stop();
            if(this.engineNodes.subOsc) this.engineNodes.subOsc.stop();
            if(this.engineNodes.turboOsc) this.engineNodes.turboOsc.stop();
            if(this.engineNodes.lfo) this.engineNodes.lfo.stop();
            this.engineNodes.masterGain.disconnect();
        }

        this.currentType = type;
        this.engineNodes = {};

        // Felles Master Gain
        this.engineNodes.masterGain = this.ctx.createGain();
        this.engineNodes.masterGain.gain.value = 0;
        this.engineNodes.masterGain.connect(this.ctx.destination);

        // --- GOKART (2-TAKT) ---
        if (type === 'gokart') {
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

            this.engineNodes.osc.connect(this.engineNodes.hpf);
            this.engineNodes.hpf.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.masterGain);
            this.engineNodes.osc.start();
        } 
        // --- V8 (BRUTAL RUMBLE) ---
        else if (type === 'v8') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            
            // Sub-oscillator for bunndrag
            this.engineNodes.subOsc = this.ctx.createOscillator();
            this.engineNodes.subOsc.type = 'square';
            
            // LFO for krysplan "lopping" tomgang (Amplitudemodulasjon)
            this.engineNodes.lfo = this.ctx.createOscillator();
            this.engineNodes.lfo.type = 'sine';
            this.engineNodes.amGain = this.ctx.createGain();
            
            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'lowpass';
            this.engineNodes.dist = this.ctx.createWaveShaper();
            this.engineNodes.dist.curve = this.makeDistortionCurve(50);

            // Ruting
            this.engineNodes.osc.connect(this.engineNodes.dist);
            this.engineNodes.subOsc.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            
            this.engineNodes.lpf.connect(this.engineNodes.amGain);
            this.engineNodes.amGain.connect(this.engineNodes.masterGain);
            
            // LFO ruter til amGain.gain for å pulsere volumet
            this.engineNodes.lfoGain = this.ctx.createGain();
            this.engineNodes.lfoGain.gain.value = 0.6; // Dybde på puls
            this.engineNodes.lfo.connect(this.engineNodes.lfoGain);
            this.engineNodes.lfoGain.connect(this.engineNodes.amGain.gain);

            this.engineNodes.osc.start();
            this.engineNodes.subOsc.start();
            this.engineNodes.lfo.start();
        }
        // --- FORMEL 1 V10 (SKRIK) ---
        else if (type === 'v10') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            
            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'lowpass';
            this.engineNodes.lpf.Q.value = 8; // Kraftig resonans
            
            this.engineNodes.dist = this.ctx.createWaveShaper();
            this.engineNodes.dist.curve = this.makeDistortionCurve(40);

            this.engineNodes.osc.connect(this.engineNodes.dist);
            this.engineNodes.dist.connect(this.engineNodes.lpf);
            this.engineNodes.lpf.connect(this.engineNodes.masterGain);
            
            this.engineNodes.osc.start();
        }
        // --- ROTARY / WANKEL (BRAP BRAP) ---
        else if (type === 'rotary') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'square';
            
            this.engineNodes.lfo = this.ctx.createOscillator();
            this.engineNodes.lfo.type = 'sawtooth'; // Skarp brap
            this.engineNodes.amGain = this.ctx.createGain();
            this.engineNodes.lfoGain = this.ctx.createGain();

            this.engineNodes.lpf = this.ctx.createBiquadFilter();
            this.engineNodes.lpf.type = 'bandpass'; // Mer hvesende
            
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
        // --- I4 TURBO (SPOOL & BOV) ---
        else if (type === 'turbo') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'sawtooth';
            
            this.engineNodes.turboOsc = this.ctx.createOscillator();
            this.engineNodes.turboOsc.type = 'sine'; // Hylende turbo
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
        // --- V6 (RASP) ---
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
        // --- EV (ELBIL) ---
        else if (type === 'ev') {
            this.engineNodes.osc = this.ctx.createOscillator();
            this.engineNodes.osc.type = 'triangle';
            
            this.engineNodes.hpf = this.ctx.createBiquadFilter();
            this.engineNodes.hpf.type = 'highpass';
            this.engineNodes.hpf.frequency.value = 1000;
            
            this.engineNodes.osc.connect(this.engineNodes.hpf);
            this.engineNodes.hpf.connect(this.engineNodes.masterGain);
            
            this.engineNodes.osc.start();
        }
        // --- STANDARD / I4 ---
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
        bpFilter.frequency.value = 4500 + Math.random() * 1000; // Pshhh frekvens
        bpFilter.Q.value = 1.5;

        let gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3); // Skarp cut-off

        source.connect(bpFilter);
        bpFilter.connect(gainNode);
        gainNode.connect(this.ctx.destination);
        
        source.start();
        source.stop(this.ctx.currentTime + 0.35);
    }

    update(vehicleType, rpm, speedKmh, throttle, spinSeverity) {
        if (!this.ready) return;
        if (this.currentType !== vehicleType) this.buildEngine(vehicleType);

        let sRpm = isFinite(rpm) && rpm > 0 ? rpm : 0;
        let sSpd = isFinite(speedKmh) && speedKmh > 0 ? speedKmh : 0;
        let sThr = isFinite(throttle) ? Math.abs(throttle) : 0;
        let t = this.ctx.currentTime;

        // --- DSP MATEMATIKK PER PROFIL ---

        if (vehicleType === 'gokart') {
            let freq = sRpm / 60;
            this.engineNodes.osc.frequency.setTargetAtTime(freq, t, 0.05);

            let lpFreq = 400 + (sRpm * 0.5) + (sThr * 2000); 
            if (sRpm > 7000 && sThr > 0.5) lpFreq += 3000;

            let volTarget = 0.05 + (sThr * 0.15);
            let qTarget = 2;

            if (sThr < 0.1) {
                if (sRpm < 3000) {
                    qTarget = 10;
                    if (Math.random() > 0.5) {
                        volTarget = (Math.random() * 0.1); 
                        this.engineNodes.lpf.frequency.setValueAtTime(lpFreq + (Math.random() * 800), t);
                    } else volTarget = 0;
                } else {
                    qTarget = 6;
                    lpFreq = 2000 + (sRpm * 0.4);
                    if (Math.random() > 0.3) {
                        volTarget = (Math.random() * 0.3) + 0.15;
                        this.engineNodes.lpf.frequency.setValueAtTime(lpFreq + (Math.random() * 1500), t);
                    } else volTarget = 0;
                }
            }

            this.engineNodes.lpf.frequency.setTargetAtTime(lpFreq, t, 0.05);
            this.engineNodes.lpf.Q.setTargetAtTime(qTarget, t, 0.1);
            this.engineNodes.masterGain.gain.setTargetAtTime(volTarget, t, 0.01);
        } 
        
        else if (vehicleType === 'v8') {
            let freq = sRpm / 60 * 1.5;
            this.engineNodes.osc.frequency.setTargetAtTime(freq, t, 0.05);
            this.engineNodes.subOsc.frequency.setTargetAtTime(freq / 2, t, 0.05); // V8 bunndrag
            
            // Modulering for loping idle (Cross-plane V8 pulser)
            let lfoFreq = (sRpm / 120); 
            this.engineNodes.lfo.frequency.setTargetAtTime(lfoFreq, t, 0.05);
            
            // LFO dybde: Hard på tomgang, glattes ut på turtall
            let lfoDepth = sRpm < 3000 ? 0.7 : 0.1;
            this.engineNodes.lfoGain.gain.setTargetAtTime(lfoDepth, t, 0.1);

            let lpFreq = 800 + (sRpm * 0.6) + (sThr * 3000);
            this.engineNodes.lpf.frequency.setTargetAtTime(lpFreq, t, 0.05);
            
            let volTarget = 0.08 + (sThr * 0.2);
            this.engineNodes.masterGain.gain.setTargetAtTime(volTarget, t, 0.05);
        }

        else if (vehicleType === 'v10') {
            let freq = (sRpm / 60) * 3.5; // Skrikende frekvens
            this.engineNodes.osc.frequency.setTargetAtTime(freq, t, 0.05);
            
            let lpFreq = 1500 + (sRpm * 1.5) + (sThr * 4000);
            this.engineNodes.lpf.frequency.setTargetAtTime(lpFreq, t, 0.05);
            
            let volTarget = 0.05 + (sThr * 0.25);
            this.engineNodes.masterGain.gain.setTargetAtTime(volTarget, t, 0.05);
        }

        else if (vehicleType === 'rotary') {
            let freq = (sRpm / 60) * 2;
            this.engineNodes.osc.frequency.setTargetAtTime(freq, t, 0.05);
            
            // "Brap" modulasjon
            let lfoFreq = sRpm / 80;
            this.engineNodes.lfo.frequency.setTargetAtTime(lfoFreq, t, 0.05);
            let lfoDepth = sRpm < 4000 ? 0.9 : 0.0; // Forsvinner helt over 4000 rpm
            this.engineNodes.lfoGain.gain.setTargetAtTime(lfoDepth, t, 0.1);

            let bpFreq = 1200 + (sRpm * 0.8) + (sThr * 2500);
            this.engineNodes.lpf.frequency.setTargetAtTime(bpFreq, t, 0.05);
            this.engineNodes.lpf.Q.setTargetAtTime(1.5 + sThr * 2, t, 0.1); // Skarpere i powerbandet

            let volTarget = 0.06 + (sThr * 0.2);
            this.engineNodes.masterGain.gain.setTargetAtTime(volTarget, t, 0.05);
        }

        else if (vehicleType === 'turbo') {
            let freq = (sRpm / 60) * 2;
            this.engineNodes.osc.frequency.setTargetAtTime(freq, t, 0.05);
            
            let lpFreq = 600 + (sRpm * 0.7) + (sThr * 3000);
            this.engineNodes.lpf.frequency.setTargetAtTime(lpFreq, t, 0.05);

            // Turbo spooling
            let turboFreq = 2000 + (sRpm * 0.5) + (sThr * 4000);
            this.engineNodes.turboOsc.frequency.setTargetAtTime(turboFreq, t, 0.2);
            let turboVol = (sRpm > 3500 && sThr > 0.4) ? (sThr * 0.08) : 0;
            this.engineNodes.turboGain.gain.setTargetAtTime(turboVol, t, 0.5); // Spool delay

            // Blow-off Valve Logic (Slipper gassen brått under last)
            if (this.prevThrottle > 0.7 && sThr < 0.1 && sRpm > 4500 && (t - this.bovTimer > 0.5)) {
                this.playBlowoffValve();
                this.bovTimer = t;
                // Kutt turbovolum umiddelbart
                this.engineNodes.turboGain.gain.setTargetAtTime(0, t, 0.05);
            }

            let volTarget = 0.06 + (sThr * 0.15);
            this.engineNodes.masterGain.gain.setTargetAtTime(volTarget, t, 0.05);
        }

        else if (vehicleType === 'v6') {
            let freq = (sRpm / 60) * 2.5;
            this.engineNodes.osc.frequency.setTargetAtTime(freq, t, 0.05);
            this.engineNodes.subOsc.frequency.setTargetAtTime(freq / 1.5, t, 0.05);
            
            let lpFreq = 1000 + (sRpm * 0.8) + (sThr * 2500);
            this.engineNodes.lpf.frequency.setTargetAtTime(lpFreq, t, 0.05);
            
            let volTarget = 0.06 + (sThr * 0.18);
            this.engineNodes.masterGain.gain.setTargetAtTime(volTarget, t, 0.05);
        }

        else if (vehicleType === 'ev') {
            let freq = 100 + (sSpd * 12); // Følger hjulhastighet primært
            this.engineNodes.osc.frequency.setTargetAtTime(freq, t, 0.05);
            
            let volTarget = sSpd > 1 ? 0.05 + (sThr * 0.1) : 0;
            this.engineNodes.masterGain.gain.setTargetAtTime(volTarget, t, 0.1);
        }

        else {
            // Standard / I4 NA
            let freq = (sRpm / 60) * 2;
            this.engineNodes.osc.frequency.setTargetAtTime(freq, t, 0.05);
            let lpFreq = 800 + (sRpm * 0.6) + (sThr * 2000);
            this.engineNodes.lpf.frequency.setTargetAtTime(lpFreq, t, 0.05);
            let volTarget = 0.05 + (sThr * 0.15);
            this.engineNodes.masterGain.gain.setTargetAtTime(volTarget, t, 0.05);
        }

        // --- DEKKSKRIK FELLESLOGIKK ---
        if (this.squealNodes) {
            if(spinSeverity > 0.1 && sSpd > 5) { 
                this.squealNodes.gain.gain.setTargetAtTime(isFinite(spinSeverity) ? spinSeverity * 0.15 : 0, t, 0.05); 
                this.squealNodes.osc.frequency.setTargetAtTime(800 + Math.random()*200, t, 0.05); 
            } else { 
                this.squealNodes.gain.gain.setTargetAtTime(0, t, 0.1); 
            }
        }

        this.prevThrottle = sThr;
    }

    playBeep(freq, duration = 0.3) {
        if (!this.ready || this.ctx.state !== 'running' || !isFinite(freq)) return;
        let osc = this.ctx.createOscillator(); let gain = this.ctx.createGain();
        osc.frequency.value = freq; osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); gain.gain.setValueAtTime(0.5, this.ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration); osc.stop(this.ctx.currentTime + duration);
    }
}
window.audioManager = new AudioManager();
