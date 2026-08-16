window.vehicleGarage = {
    selected: 'jaguar',
    visible: false,
    locked: false,
    gridBuilt: false,
    panelTimer: null,
    lastGamepad: { up: false, down: false, left: false, right: false, l1: false, r1: false },
    gamepadRaf: 0,

    catalog: [
        { id: 'jaguar', name: 'Jaguar I-PACE EV400', maker: 'Jaguar', group: 'Elbil', year: '2018', flag: '🇬🇧' },
        { id: 'r34', name: 'Nissan Skyline R34', maker: 'Nissan', group: 'Japan', year: '1999', flag: '🇯🇵' },
        { id: 'r32', name: 'Nissan Skyline GT-R BNR32', maker: 'Nissan', group: 'Japan', year: '1989', flag: '🇯🇵' },
        { id: 's15', name: 'Nissan Silvia S15', maker: 'Nissan', group: 'Japan', year: '1999', flag: '🇯🇵' },
        { id: 'mx5', name: 'Mazda MX-5', maker: 'Mazda', group: 'Japan', year: '1989', flag: '🇯🇵' },
        { id: 'nsxr', name: 'Honda NSX-R NA1', maker: 'Honda', group: 'Japan', year: '1992', flag: '🇯🇵' },
        { id: 'm3e30', name: 'BMW M3 E30 Sport Evo', maker: 'BMW', group: 'Historisk', year: '1990', flag: '🇩🇪' },
        { id: 'quattro', name: 'Audi Sport Quattro S1 E2', maker: 'Audi', group: 'Rally', year: '1985', flag: '🇩🇪' },
        { id: 'delta', name: 'Lancia Delta Integrale Evo', maker: 'Lancia', group: 'Rally', year: '1992', flag: '🇮🇹' },
        { id: 'gt40', name: 'Ford GT40 Mk II', maker: 'Ford', group: 'Historisk', year: '1966', flag: '🇺🇸' },
        { id: 'porsche917', name: 'Porsche 917K', maker: 'Porsche', group: 'Historisk', year: '1970', flag: '🇩🇪' },
        { id: 'f40', name: 'Ferrari F40', maker: 'Ferrari', group: 'Superbil', year: '1987', flag: '🇮🇹' },
        { id: 'mclarenf1', name: 'McLaren F1', maker: 'McLaren', group: 'Superbil', year: '1994', flag: '🇬🇧' },
        { id: 'alfa33', name: 'Alfa Romeo 33 Stradale', maker: 'Alfa Romeo', group: 'Superbil', year: '1967', flag: '🇮🇹' },
        { id: 'c8z06', name: 'Corvette C8 Z06', maker: 'Chevrolet', group: 'Superbil', year: '2023', flag: '🇺🇸' },
        { id: 'gt3rs', name: 'Porsche 911 GT3 RS 992', maker: 'Porsche', group: 'Bane', year: '2023', flag: '🇩🇪' },
        { id: 'amggt', name: 'Mercedes-AMG GT Black', maker: 'Mercedes', group: 'Bane', year: '2021', flag: '🇩🇪' },
        { id: 'valkyrie', name: 'Aston Martin Valkyrie', maker: 'Aston Martin', group: 'Hypercar', year: '2022', flag: '🇬🇧' },
        { id: 'jesko', name: 'Koenigsegg Jesko Attack', maker: 'Koenigsegg', group: 'Hypercar', year: '2020', flag: '🇸🇪' },
        { id: 'gokart', name: 'Proff Go-Kart', maker: 'Kart', group: 'Lett', year: '2020', flag: '🏁' },
        { id: 'kartrent', name: 'Utleiekart Honda GX390', maker: 'Kart', group: 'Lett', year: '2018', flag: '🏁' },
        { id: 'kartrace', name: 'Race-Kart Tuned GX390', maker: 'Kart', group: 'Lett', year: '2022', flag: '🏁' },
        { id: 'f1', name: 'Formel 1', maker: 'Open Wheel', group: 'Motorsport', year: '2024', flag: '🏁' },
        { id: 'type49', name: 'Lotus Type 49', maker: 'Lotus', group: 'Motorsport', year: '1967', flag: '🇬🇧' },
        { id: 'mazda787b', name: 'Mazda 787B', maker: 'Mazda', group: 'Motorsport', year: '1991', flag: '🇯🇵' },
        { id: 'elise', name: 'Lotus Elise S1', maker: 'Lotus', group: 'Lett', year: '1996', flag: '🇬🇧' },
        { id: 'caterham', name: 'Caterham Seven 620R', maker: 'Caterham', group: 'Lett', year: '2013', flag: '🇬🇧' },
        { id: 'yaris', name: 'Toyota GR Yaris', maker: 'Toyota', group: 'Rally', year: '2020', flag: '🇯🇵' }
    ],

    clamp10(n) {
        return Math.round(Math.max(0.5, Math.min(10, n)) * 10) / 10;
    },

    estimate0100(pre) {
        let hpPerTon = (pre.power / Math.max(pre.mass, 1)) * 1000;
        let launch = Math.sqrt(Math.max(0.7, pre.grip) / 1.8);
        let seconds = 850 / Math.max(80, hpPerTon * launch);
        if (pre.ev) seconds *= 0.88;
        return Math.round(Math.max(1.9, Math.min(13.5, seconds)) * 10) / 10;
    },

    estimateTopSpeed(pre) {
        let ratio = pre.power / Math.max(pre.mass, 1);
        return Math.round(90 + Math.sqrt(ratio) * 190);
    },

    ratings(pre) {
        let hpPerTon = (pre.power / Math.max(pre.mass, 1)) * 1000;
        let accelSec = this.estimate0100(pre);
        let turn = pre.turn ?? 4.5;
        let roll = pre.roll ?? 0.04;
        let grip = pre.grip ?? 1.6;
        let cornerBoost = turn > 2 ? turn * 0.45 : 2.5;
        let stab = 4.5;
        if (pre.drivetrain === 'AWD') stab += 1.4;
        stab += (0.06 - roll) * 40;
        stab += Math.min(2, pre.mass / 1200);
        return {
            speed: this.clamp10(Math.sqrt(hpPerTon) / 3.8),
            accel: this.clamp10(10 * (13.5 - accelSec) / 11.6),
            brake: this.clamp10(grip * 2.7),
            corner: this.clamp10(grip * 2.2 + cornerBoost),
            stab: this.clamp10(stab)
        };
    },

    stats(id) {
        let pre = (window.vehiclePresets || {})[id];
        if (!pre) return null;
        let meta = this.catalog.find(c => c.id === id) || { name: id, maker: '', group: '', year: '', flag: '' };
        return {
            id: id,
            name: meta.name,
            maker: meta.maker,
            group: meta.group,
            year: meta.year || '',
            flag: meta.flag || '',
            drivetrain: pre.drivetrain,
            hk: Math.round(pre.power),
            kg: Math.round(pre.mass),
            grip: pre.grip,
            accel: this.estimate0100(pre),
            topSpeed: this.estimateTopSpeed(pre),
            ratings: this.ratings(pre)
        };
    },

    visibleCars() {
        return this.catalog.filter(c => window.vehiclePresets && window.vehiclePresets[c.id]);
    },

    color() {
        return document.getElementById('car-color')?.value || document.getElementById('garage-color')?.value || '#3498db';
    },

    setSelects(id) {
        ['preset-selector', 'ingame-preset-selector'].forEach(selId => {
            let el = document.getElementById(selId);
            if (el) el.value = id;
        });
    },

    carName(id) {
        let meta = this.catalog.find(c => c.id === id);
        return meta ? meta.name : id;
    },

    paintThumbs(root) {
        if (!root) return;
        root.querySelectorAll('canvas[data-car]').forEach(canvas => {
            this.drawPreview(canvas, canvas.getAttribute('data-car'), canvas.getAttribute('data-color') || '#3498db');
        });
    },

    drawPreview(canvas, id, color, light) {
        if (!canvas || !window.Vehicles || !window.vehiclePresets) return;
        let pre = window.vehiclePresets[id];
        if (!pre) return;
        let ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        let floor = ctx.createLinearGradient(0, 0, 0, h);
        if (light) {
            floor.addColorStop(0, '#f3f3f5');
            floor.addColorStop(1, '#c8c8ce');
        } else {
            floor.addColorStop(0, '#1a1d26');
            floor.addColorStop(1, '#0c0d12');
        }
        ctx.fillStyle = floor;
        ctx.fillRect(0, 0, w, h);
        ctx.save();
        ctx.translate(w / 2, h / 2 + 4);
        ctx.rotate(-Math.PI / 2);
        let scale = Math.min(w, h) / Math.max(pre.l, pre.w) * 0.7;
        ctx.scale(scale, scale);
        let hl = pre.l / 2, hw = pre.w / 2;
        Vehicles.draw(ctx, pre, { color: color, appliesBrake: false }, {
            hl: hl, hw: hw, wheelW: 6, wheelThick: 3.2, wheelOffset: hw - 1, delta: 0.18
        });
        ctx.restore();
    },

    yearShort(year) {
        return year && year.length >= 2 ? year.slice(-2) : '';
    },

    renderFooter(id) {
        let foot = document.getElementById('vehicle-garage-footer');
        if (!foot) return;
        let s = this.stats(id);
        if (!s) { foot.innerHTML = ''; return; }
        foot.innerHTML = `
            <strong>${s.name}</strong>
            <span>${s.maker}</span>
            <span>${s.drivetrain}</span>
            <span>Grip ${s.grip.toFixed(2)}</span>
            <span>${s.hk} hk</span>
            <span>${s.kg} kg</span>
            <span>0–100 ${s.accel.toFixed(1)} s</span>
        `;
    },

    setText(id, text) {
        let el = document.getElementById(id);
        if (el) el.textContent = text;
    },

    setBar(id, rating) {
        let el = document.getElementById(id);
        if (el) el.style.width = `${(rating / 10) * 100}%`;
    },

    resetBars() {
        ['garage-bar-speed', 'garage-bar-accel', 'garage-bar-brake', 'garage-bar-corner', 'garage-bar-stab']
            .forEach(id => this.setBar(id, 0));
    },

    setPanelHidden(on) {
        ['garage-anim-hero', 'garage-anim-stats', 'garage-anim-highlights'].forEach(id => {
            let el = document.getElementById(id);
            if (el) el.classList.toggle('anim-hide', on);
        });
    },

    fillPanel(id) {
        let s = this.stats(id);
        if (!s) return;
        this.setText('garage-spec-logo', (s.maker || s.name).substring(0, 3).toUpperCase());
        this.setText('garage-spec-title', s.name);
        this.setText('garage-spec-year', s.year ? `${s.year} · ${s.drivetrain}` : s.drivetrain);
        this.setText('garage-val-speed', s.ratings.speed.toFixed(1));
        this.setText('garage-val-accel', s.ratings.accel.toFixed(1));
        this.setText('garage-val-brake', s.ratings.brake.toFixed(1));
        this.setText('garage-val-corner', s.ratings.corner.toFixed(1));
        this.setText('garage-val-stab', s.ratings.stab.toFixed(1));
        this.setText('garage-hl-power', `${s.hk} HK`);
        this.setText('garage-hl-topspeed', `${s.topSpeed} KM/T`);
        this.setText('garage-hl-weight', `${s.kg.toLocaleString('nb-NO')} KG`);
        this.drawPreview(document.getElementById('garage-hero-canvas'), id, this.color(), true);
        this.renderFooter(id);
    },

    playBars(id) {
        let s = this.stats(id);
        if (!s) return;
        this.setBar('garage-bar-speed', s.ratings.speed);
        this.setBar('garage-bar-accel', s.ratings.accel);
        this.setBar('garage-bar-brake', s.ratings.brake);
        this.setBar('garage-bar-corner', s.ratings.corner);
        this.setBar('garage-bar-stab', s.ratings.stab);
    },

    schedulePanel(id, immediate) {
        if (this.panelTimer) clearTimeout(this.panelTimer);
        if (immediate) {
            this.fillPanel(id);
            this.setPanelHidden(false);
            this.playBars(id);
            return;
        }
        this.setPanelHidden(true);
        this.resetBars();
        this.panelTimer = setTimeout(() => {
            this.fillPanel(id);
            this.setPanelHidden(false);
            setTimeout(() => this.playBars(id), 50);
        }, 150);
    },

    markActive() {
        let grid = document.getElementById('vehicle-garage-grid');
        if (!grid) return;
        grid.querySelectorAll('.garage-card').forEach(card => {
            let on = card.getAttribute('data-car') === this.selected;
            card.classList.toggle('is-selected', on);
            if (on) card.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
        });
    },

    paintCards() {
        let grid = document.getElementById('vehicle-garage-grid');
        if (!grid) return;
        let color = this.color();
        grid.querySelectorAll('.garage-card').forEach(card => {
            this.drawPreview(card.querySelector('canvas'), card.getAttribute('data-car'), color, false);
        });
        this.drawPreview(document.getElementById('garage-hero-canvas'), this.selected, color, true);
    },

    buildGrid() {
        let grid = document.getElementById('vehicle-garage-grid');
        if (!grid) return;
        let cars = this.visibleCars();
        grid.innerHTML = cars.map((c, index) => {
            let s = this.stats(c.id);
            let yy = this.yearShort(s.year);
            let on = c.id === this.selected ? ' is-selected' : '';
            return `<button type="button" class="garage-card${on}" data-car="${c.id}" data-index="${index}">
                <div class="card-border-wrapper"><div class="garage-glass">
                    <div class="garage-card-top">
                        <div class="brand-logo">${(s.maker || '?').charAt(0)}</div>
                        <div class="specs-right">
                            <span class="garage-flag">${s.flag || ''}</span>
                            <div>${s.hk} HK</div>
                            <div>${s.drivetrain}</div>
                        </div>
                    </div>
                    <div class="car-img-container">
                        <canvas class="garage-preview" width="220" height="110"></canvas>
                    </div>
                    <div class="card-brand">${s.maker}</div>
                </div></div>
                <div class="model-name">${s.name}${yy ? " '" + yy : ''}</div>
            </button>`;
        }).join('');
        this.gridBuilt = true;
        this.paintCards();
        this.schedulePanel(this.selected, true);
    },

    render() {
        this.buildGrid();
    },

    select(id, emit) {
        if (this.locked) return;
        if (!id || !window.vehiclePresets || !window.vehiclePresets[id]) return;
        let changed = id !== this.selected;
        this.selected = id;
        this.setSelects(id);
        if (!this.gridBuilt) {
            this.buildGrid();
        } else {
            this.markActive();
            if (changed) this.schedulePanel(id, false);
        }
        if (emit && typeof emitLocalProfile === 'function') emitLocalProfile();
    },

    currentIndex() {
        return this.visibleCars().findIndex(c => c.id === this.selected);
    },

    getColumns() {
        let items = document.querySelectorAll('#vehicle-garage-grid .garage-card');
        if (items.length <= 1) return 1;
        let firstY = items[0].getBoundingClientRect().top;
        for (let i = 1; i < items.length; i++) {
            if (items[i].getBoundingClientRect().top > firstY + 10) return i;
        }
        return items.length;
    },

    moveBy(delta) {
        let cars = this.visibleCars();
        if (!cars.length) return;
        let i = this.currentIndex();
        if (i < 0) i = 0;
        let next = Math.max(0, Math.min(cars.length - 1, i + delta));
        this.select(cars[next].id, true);
    },

    isTypingTarget(el) {
        if (!el) return false;
        let tag = (el.tagName || '').toLowerCase();
        return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable;
    },

    onKey(e) {
        if (!this.visible || this.locked) return;
        if (this.isTypingTarget(e.target)) return;
        let cols = this.getColumns();
        if (e.key === 'ArrowRight') { this.moveBy(1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft') { this.moveBy(-1); e.preventDefault(); }
        else if (e.key === 'ArrowDown') { this.moveBy(cols); e.preventDefault(); }
        else if (e.key === 'ArrowUp') { this.moveBy(-cols); e.preventDefault(); }
    },

    pollGamepad() {
        this.gamepadRaf = 0;
        if (this.visible && !this.locked && typeof navigator !== 'undefined' && navigator.getGamepads) {
            let gp = navigator.getGamepads()[0];
            if (gp) {
                let cols = this.getColumns();
                let up = !!(gp.buttons[12]?.pressed || gp.axes[1] < -0.5);
                let down = !!(gp.buttons[13]?.pressed || gp.axes[1] > 0.5);
                let left = !!(gp.buttons[14]?.pressed || gp.axes[0] < -0.5);
                let right = !!(gp.buttons[15]?.pressed || gp.axes[0] > 0.5);
                let l1 = !!gp.buttons[4]?.pressed;
                let r1 = !!gp.buttons[5]?.pressed;
                let prev = this.lastGamepad;
                if (right && !prev.right) this.moveBy(1);
                if (left && !prev.left) this.moveBy(-1);
                if (down && !prev.down) this.moveBy(cols);
                if (up && !prev.up) this.moveBy(-cols);
                if (r1 && !prev.r1) this.moveBy(cols);
                if (l1 && !prev.l1) this.moveBy(-cols);
                this.lastGamepad = { up, down, left, right, l1, r1 };
            }
        }
        if (this.visible && typeof requestAnimationFrame === 'function') {
            this.gamepadRaf = requestAnimationFrame(() => this.pollGamepad());
        }
    },

    startGamepad() {
        if (this.gamepadRaf || typeof requestAnimationFrame !== 'function') return;
        this.gamepadRaf = requestAnimationFrame(() => this.pollGamepad());
    },

    setVisible(on) {
        this.visible = !!on;
        let box = document.getElementById('vehicle-garage');
        if (box) box.style.display = on ? 'flex' : 'none';
        if (on) {
            let current = document.getElementById('preset-selector')?.value || this.selected;
            this.selected = current;
            if (!this.gridBuilt) this.buildGrid();
            else {
                this.markActive();
                this.paintCards();
                this.schedulePanel(this.selected, true);
            }
            this.startGamepad();
        }
    },

    setLocked(on) {
        this.locked = !!on;
        let box = document.getElementById('vehicle-garage');
        if (box) box.classList.toggle('is-locked', this.locked);
    },

    bind() {
        let grid = document.getElementById('vehicle-garage-grid');
        if (grid) {
            grid.addEventListener('click', e => {
                let card = e.target.closest('.garage-card');
                if (!card) return;
                this.select(card.getAttribute('data-car'), true);
            });
        }
        let colorEl = document.getElementById('garage-color');
        if (colorEl) {
            colorEl.addEventListener('input', () => {
                if (this.locked) return;
                ['car-color', 'ingame-car-color'].forEach(id => {
                    let el = document.getElementById(id);
                    if (el) el.value = colorEl.value;
                });
                this.paintCards();
                if (typeof emitLocalProfile === 'function') emitLocalProfile();
            });
        }
        if (typeof window.addEventListener === 'function') {
            window.addEventListener('keydown', e => this.onKey(e));
            window.addEventListener('gamepadconnected', () => {
                if (this.visible) this.startGamepad();
            });
        }
        let current = document.getElementById('preset-selector')?.value;
        if (current) this.selected = current;
    }
};

window.vehicleGarage.bind();
