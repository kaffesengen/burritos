const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');

[
    'vehicle-garage',
    'vehicle-garage-grid',
    'vehicle-garage-specs',
    'garage-hero-canvas',
    'garage-bar-speed',
    'garage-hl-power',
    'garage-color'
].forEach(id => {
    assert.ok(html.includes(`id="${id}"`), 'missing ' + id);
});

assert.ok(html.includes('id="lobby-session"'));
assert.ok(html.includes('Velg kjøretøy'));
assert.ok(html.includes('Piltaster'));
assert.ok(html.includes('garasjen til høyre'));
assert.ok(css.includes('.garage-specs'));
assert.ok(css.includes('.garage-gt-grid'));
assert.ok(css.includes('anim-hide'));
assert.ok(css.includes('#lobby.is-session .lobby-session'));
assert.ok(css.includes('flex-direction: row'));

console.log('vehicle-garage-ui tests ok');
