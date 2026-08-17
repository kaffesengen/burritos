function distToSeg(px, py, ax, ay, bx, by) {
    let dx = bx - ax;
    let dy = by - ay;
    let l2 = dx * dx + dy * dy;
    if (l2 < 1e-8) return Math.hypot(px - ax, py - ay);
    let t = ((px - ax) * dx + (py - ay) * dy) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function cubicPoint(p0, p1, p2, p3, t) {
    let u = 1 - t;
    return {
        x: u * u * u * p0.x + 3 * u * u * t * p1.x + 3 * u * t * t * p2.x + t * t * t * p3.x,
        y: u * u * u * p0.y + 3 * u * u * t * p1.y + 3 * u * t * t * p2.y + t * t * t * p3.y
    };
}

class PolyStroke {
    constructor(width) {
        this.half = width / 2;
        this.pts = [];
    }

    moveTo(x, y) {
        this.pts.push({ x: x, y: y, brk: true });
    }

    lineTo(x, y) {
        this.pts.push({ x: x, y: y });
    }

    bezierCurveTo(c1x, c1y, c2x, c2y, x, y) {
        let last = this.pts[this.pts.length - 1];
        if (!last) {
            this.moveTo(x, y);
            return;
        }
        let p0 = last;
        let p1 = { x: c1x, y: c1y };
        let p2 = { x: c2x, y: c2y };
        let p3 = { x: x, y: y };
        let n = 22;
        for (let i = 1; i <= n; i++) this.pts.push(cubicPoint(p0, p1, p2, p3, i / n));
    }

    closePath() {
        if (!this.pts.length) return;
        let first = this.pts[0];
        this.pts.push({ x: first.x, y: first.y });
    }

    contains(x, y) {
        let min = Infinity;
        for (let i = 1; i < this.pts.length; i++) {
            let a = this.pts[i - 1];
            let b = this.pts[i];
            if (b.brk) continue;
            let d = distToSeg(x, y, a.x, a.y, b.x, b.y);
            if (d < min) min = d;
        }
        return min <= this.half;
    }
}

function strokeFromCmds(cmds, width) {
    let s = new PolyStroke(width);
    for (let c of cmds) {
        if (c[0] === 'M') s.moveTo(c[1], c[2]);
        else if (c[0] === 'L') s.lineTo(c[1], c[2]);
        else if (c[0] === 'C') s.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]);
        else if (c[0] === 'Z') s.closePath();
    }
    return s;
}

function makeProbe(stroke, boundsStroke) {
    return {
        probe: (x, y) => stroke.contains(x, y),
        boundsProbe: (x, y) => (boundsStroke || stroke).contains(x, y)
    };
}

module.exports = { PolyStroke, strokeFromCmds, makeProbe, distToSeg };
