window.vehicleGarage = {
    selected: 'jaguar',
    visible: false,
    locked: false,

    catalog: [
        { id: 'jaguar', name: 'Jaguar I-PACE EV400', maker: 'Jaguar', group: 'Elbil' },
        { id: 'r34', name: 'Nissan Skyline R34', maker: 'Nissan', group: 'Japan' },
        { id: 'r32', name: 'Nissan Skyline GT-R BNR32', maker: 'Nissan', group: 'Japan' },
        { id: 's15', name: 'Nissan Silvia S15', maker: 'Nissan', group: 'Japan' },
        { id: 'mx5', name: 'Mazda MX-5', maker: 'Mazda', group: 'Japan' },
        { id: 'nsxr', name: 'Honda NSX-R NA1', maker: 'Honda', group: 'Japan' },
        { id: 'm3e30', name: 'BMW M3 E30 Sport Evo', maker: 'BMW', group: 'Historisk' },
        { id: 'quattro', name: 'Audi Sport Quattro S1 E2', maker: 'Audi', group: 'Rally' },
        { id: 'delta', name: 'Lancia Delta Integrale Evo', maker: 'Lancia', group: 'Rally' },
        { id: 'gt40', name: 'Ford GT40 Mk II', maker: 'Ford', group: 'Historisk' },
        { id: 'porsche917', name: 'Porsche 917K', maker: 'Porsche', group: 'Historisk' },
        { id: 'f40', name: 'Ferrari F40', maker: 'Ferrari', group: 'Superbil' },
        { id: 'mclarenf1', name: 'McLaren F1', maker: 'McLaren', group: 'Superbil' },
        { id: 'alfa33', name: 'Alfa Romeo 33 Stradale', maker: 'Alfa Romeo', group: 'Superbil' },
        { id: 'c8z06', name: 'Corvette C8 Z06', maker: 'Chevrolet', group: 'Superbil' },
        { id: 'gt3rs', name: 'Porsche 911 GT3 RS 992', maker: 'Porsche', group: 'Bane' },
        { id: 'amggt', name: 'Mercedes-AMG GT Black', maker: 'Mercedes', group: 'Bane' },
        { id: 'valkyrie', name: 'Aston Martin Valkyrie', maker: 'Aston Martin', group: 'Hypercar' },
        { id: 'jesko', name: 'Koenigsegg Jesko Attack', maker: 'Koenigsegg', group: 'Hypercar' },
        { id: 'gokart', name: 'Proff Go-Kart', maker: 'Kart', group: 'Lett' },
        { id: 'kartrent', name: 'Utleiekart Honda GX390', maker: 'Kart', group: 'Lett' },
        { id: 'kartrace', name: 'Race-Kart Tuned GX390', maker: 'Kart', group: 'Lett' },
        { id: 'f1', name: 'Formel 1', maker: 'Open Wheel', group: 'Motorsport' },
        { id: 'type49', name: 'Lotus Type 49', maker: 'Lotus', group: 'Motorsport' },
        { id: 'mazda787b', name: 'Mazda 787B', maker: 'Mazda', group: 'Motorsport' },
        { id: 'elise', name: 'Lotus Elise S1', maker: 'Lotus', group: 'Lett' },
        { id: 'caterham', name: 'Caterham Seven 620R', maker: 'Caterham', group: 'Lett' },
        { id: 'yaris', name: 'Toyota GR Yaris', maker: 'Toyota', group: 'Rally' }
    ],

    estimate0100(pre) {
        let hpPerTon = (pre.power / Math.max(pre.mass, 1)) * 1000;
        let launch = Math.sqrt(Math.max(0.7, pre.grip) / 1.8);
        let seconds = 850 / Math.max(80, hpPerTon * launch);
        if (pre.ev) seconds *= 0.88;
        return Math.round(Math.max(1.9, Math.min(13.5, seconds)) * 10) / 10;
    },

    stats(id) {
        let pre = (window.vehiclePresets || {})[id];
        if (!pre) return null;
        let meta = this.catalog.find(c => c.id === id) || { name: id, maker: '', group: '' };
        return {
            id: id,
            name: meta.name,
            maker: meta.maker,
            group: meta.group,
            drivetrain: pre.drivetrain,
            hk: Math.round(pre.power),
            kg: Math.round(pre.mass),
            grip: pre.grip,
            accel: this.estimate0100(pre)
        };
    },

    color() {
        return document.getElementById('car-color')?.value || '#3498db';
    },

    setSelects(id) {
        ['preset-selector', 'ingame-preset-selector'].forEach(selId => {
            let el = document.getElementById(selId);
            if (el) el.value = id;
        });
    },

    drawPreview(canvas, id, color) {
        if (!canvas || !window.Vehicles || !window.vehiclePresets) return;
        let pre = vehiclePresets[id];
        if (!pre) return;
        let ctx = canvas.getContext('2d');
        let w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        let floor = ctx.createLinearGradient(0, 0, 0, h);
        floor.addColorStop(0, '#1a1d26');
        floor.addColorStop(1, '#0c0d12');
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

    render() {
        let grid = document.getElementById('vehicle-garage-grid');
        if (!grid) return;
        let color = this.color();
        grid.innerHTML = this.catalog.filter(c => window.vehiclePresets && vehiclePresets[c.id]).map(c => {
            let s = this.stats(c.id);
            let on = c.id === this.selected ? ' is-selected' : '';
            return `<button type="button" class="garage-card${on}" data-car="${c.id}">
                <span class="garage-card-top">
                    <span class="garage-maker">${s.maker}</span>
                    <span class="garage-quick">${s.hk} hk · ${s.drivetrain}</span>
                </span>
                <canvas class="garage-preview" width="220" height="110"></canvas>
                <span class="garage-model">${s.name}</span>
                <span class="garage-mini">Grip ${s.grip.toFixed(2)} · ${s.kg} kg · 0–100 ${s.accel.toFixed(1)}s</span>
            </button>`;
        }).join('');
        grid.querySelectorAll('.garage-card').forEach(card => {
            let id = card.getAttribute('data-car');
            this.drawPreview(card.querySelector('canvas'), id, color);
        });
        this.renderFooter(this.selected);
        let colorEl = document.getElementById('garage-color');
        if (colorEl && !colorEl.value) colorEl.value = color;
    },

    select(id, emit) {
        if (this.locked) return;
        if (!id || !window.vehiclePresets || !vehiclePresets[id]) return;
        this.selected = id;
        this.setSelects(id);
        this.render();
        if (emit && typeof emitLocalProfile === 'function') emitLocalProfile();
    },

    setVisible(on) {
        this.visible = !!on;
        let box = document.getElementById('vehicle-garage');
        if (box) box.style.display = on ? 'block' : 'none';
        if (on) {
            let current = document.getElementById('preset-selector')?.value || this.selected;
            this.selected = current;
            this.render();
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
                this.render();
                if (typeof emitLocalProfile === 'function') emitLocalProfile();
            });
        }
        let current = document.getElementById('preset-selector')?.value;
        if (current) this.selected = current;
    }
};

window.vehicleGarage.bind();
