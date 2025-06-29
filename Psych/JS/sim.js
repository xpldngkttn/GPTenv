const { Engine, Render, Runner, Bodies, World, Vector } = Matter;

const TAG_NAMES = Array.from({ length: 6 }, (_, i) => `tag${i}`);

function tagValueToHex(val) {
  const clamped = Math.max(-1, Math.min(1, val));
  const scaled = Math.round(((clamped + 1) / 2) * 15);
  return scaled.toString(16);
}

function computeColorFromTags(tags) {
  const digits = TAG_NAMES.map(t => tagValueToHex(tags[t] || 0));
  return `#${digits.join('')}`;
}

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 0;

// Global simulation speed multiplier (1 = normal speed)
let simSpeed = 1;
engine.timing.timeScale = simSpeed;

// Expose setter for convenience in console and UI
window.setSimSpeed = speed => {
  simSpeed = speed;
  engine.timing.timeScale = simSpeed;
  const input = document.getElementById('speedControl');
  const display = document.getElementById('speedDisplay');
  if (input) input.value = simSpeed;
  if (display) display.textContent = simSpeed.toFixed(1);
};

const width = window.innerWidth;
const height = window.innerHeight;

const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: width,
    height: height,
    wireframes: false,
    background: '#111'
  }
});

Render.run(render);
const runner = Runner.create();
Runner.run(runner, engine);

const PARTICLE_COUNT = 100;

// Map Matter bodies to their owning Particle for easy lookup during events
const bodyToParticle = new Map();

function blankTagMap() {
  return TAG_NAMES.reduce((o, t) => { o[t] = 0; return o; }, {});
}

function randomTagMap(min, max) {
  return TAG_NAMES.reduce((o, t) => {
    o[t] = Math.random() * (max - min) + min;
    return o;
  }, {});
}

// Return a copy of tags for simple formulas
function identityTagMap(tags) {
  return TAG_NAMES.reduce((o, t) => {
    o[t] = tags[t] || 0;
    return o;
  }, {});
}

function addParticleWithTags(tags) {
  if (!config) return;
  const cls = config.classes && config.classes[0] ? config.classes[0] : {};
  const opts = {
    ...cls,
    tags: identityTagMap(tags),
    knockRes: identityTagMap(0.0001 + (tags-1)/99 * 0.0019),
    attractCoef: identityTagMap(-0.001 + (tags-1)/99 * 0.002),
    suscept: randomTagMap(-1, 1),
    outerAttractRadius: randomTagMap(400, 600),
    innerAttractRadius: randomTagMap(20, 50),
    mouseAttract: Math.random(),
  };
  const p = new Particle(
    Math.random() * width,
    Math.random() * height,
    opts
  );
  console.log("Creating Particle", p);
  particles.push(p);
  bodyToParticle.set(p.body, p);
  World.add(world, p.body);
}

class Particle {
  constructor(x, y, options = {}) {
    const opts = options;
    this.radius = opts.radius;
    this.tags = opts.tags;
    this.color = computeColorFromTags(this.tags);
    this.knockRes = opts.knockRes;
    this.mouseAttract = opts.mouseAttract;
    this.attractCoef = opts.attractCoef;
    this.outerAttractRadius = opts.outerAttractRadius;
    this.innerAttractRadius = opts.innerAttractRadius;
    this.mouseAttractradius = opts.mouseAttractRadius;
    this.suscept = opts.suscept;
    this.state = 'idle';
    this.body = Bodies.circle(x, y, this.radius, {
      restitution: opts.restitution,
      frictionAir: opts.frictionAir,
      render: { fillStyle: this.color }
    });
    
  }

  update(mousePos, bounds) {
    const { width, height } = bounds;
    const body = this.body;
    const dir = Vector.sub(mousePos, body.position);
    const dist = Vector.magnitude(dir);

    this.color = computeColorFromTags(this.tags);
    body.render.fillStyle = this.color;

    if (mousePressed && dist < 300 && this.mouseAttract) {
      const norm = Vector.normalise(dir);
      const forceMag = this.mouseAttract * 0.01;
      Matter.Body.applyForce(body, body.position, Vector.mult(norm, forceMag));
    }

    let { x, y } = body.position;
    const r = this.radius;

    if (x - r > width) {
      Matter.Body.setPosition(body, { x: -r, y });
    } else if (x + r < 0) {
      Matter.Body.setPosition(body, { x: width + r, y });
    }

    if (y - r > height) {
      Matter.Body.setPosition(body, { x, y: -r });
    } else if (y + r < 0) {
      Matter.Body.setPosition(body, { x, y: height + r });
    }
  }

  interactWith(other) {
    const toOther = Vector.sub(other.body.position, this.body.position);
    const dist = Vector.magnitude(toOther);
    TAG_NAMES.forEach(tag => {
      const val = other.tags[tag];
      const kb = val * (this.knockRes[tag]);
      if (kb && dist < this.radius + other.radius) {
        const norm = Vector.normalise(Vector.mult(toOther, -1));
        Matter.Body.applyForce(this.body, this.body.position, Vector.mult(norm, kb));
      }
      const att = val * (this.attractCoef[tag]);
      const inner = this.innerAttractRadius[tag];
      const outer = this.outerAttractRadius[tag];
      if (att && dist < outer) {
        const norm = Vector.normalise(toOther);
        const force = dist < inner ? -3 * Math.abs(att) : att;
        Matter.Body.applyForce(
          this.body,
          this.body.position,
          Vector.mult(norm, force)
        );
      }
    });
  }
}

const particles = [];
let config;

async function loadConfig() {
  const res = await fetch('config/particles.json');
  config = await res.json();
}

function createParticles() {
  if (!config) return;
  const classes = config.classes || [];
  const perClass = Math.max(1, Math.floor(PARTICLE_COUNT / classes.length));
  for (const cls of classes) {
    for (let i = 0; i < perClass; i++) {
      const randOpts = {
        ...cls,
        tags: randomTagMap(-1,1),
        knockRes: randomTagMap(0.0001,0.002),
        attractCoef: randomTagMap(-0.001, 0.001),
        suscept: randomTagMap(-1, 1),
        outerAttractRadius: randomTagMap(400, 600),
        innerAttractRadius: randomTagMap(20, 50),
        mouseAttract: Math.random(),
      };
      const p = new Particle(
        Math.random() * width,
        Math.random() * height,
        randOpts
      );
      console.log("Creating Particle", p);
      particles.push(p);
      bodyToParticle.set(p.body, p);
      World.add(world, p.body);
    }
  }
}

let mousePos = { x: width / 2, y: height / 2 };
document.addEventListener('mousemove', e => {
  mousePos = { x: e.clientX, y: e.clientY };
});

Matter.Events.on(engine, 'beforeUpdate', () => {
  for (const p of particles) {
    p.update(mousePos, { width, height });
  }
  processInteractions();
});

// Update tag values when particles collide
function handleCollision(a, b) {
  TAG_NAMES.forEach(tag => {
    const aTag = a.tags[tag];
    const bTag = b.tags[tag];
    const aSus = a.suscept[tag];
    const bSus = b.suscept[tag];
    a.tags[tag] = Math.min(1, Math.max(-1, aTag + aSus * (bTag - aTag)));
    b.tags[tag] = Math.min(1, Math.max(-1, bTag + bSus * (aTag - bTag)));
  });
}

let mousePressed = false;
document.addEventListener('mousedown', () => { mousePressed = true; });
document.addEventListener('mouseup', () => { mousePressed = false; });

// Listen for collisions from Matter.js
Matter.Events.on(engine, 'collisionStart', event => {
  event.pairs.forEach(({ bodyA, bodyB }) => {
    const a = bodyToParticle.get(bodyA);
    const b = bodyToParticle.get(bodyB);
    if (a && b) {
      handleCollision(a, b);
    }
  });
});

function processInteractions() {
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i];
      const b = particles[j];
      a.interactWith(b);
      b.interactWith(a);
    }
  }
}

loadConfig().then(createParticles);

// Hook up speed slider after DOM loads
window.addEventListener('DOMContentLoaded', () => {
  const ctrl = document.getElementById('speedControl');
  const display = document.getElementById('speedDisplay');
  if (!ctrl) return;
  ctrl.value = simSpeed;
  if (display) display.textContent = simSpeed.toFixed(1);
  ctrl.addEventListener('input', e => {
    const val = parseFloat(e.target.value);
    setSimSpeed(val);
  });

  const btn = document.getElementById('createParticleBtn');
  if (btn) {
    btn.addEventListener('click', () => {
      const vals = [
        document.getElementById('ieInput'),
        document.getElementById('snInput'),
        document.getElementById('tfInput'),
        document.getElementById('jpInput'),
        document.getElementById('atInput'),
        document.getElementById('extraInput'),
      ].map(inp => parseFloat(inp.value) || 0);
      const toTagVal = p => Math.max(-1, Math.min(1, (p - 50) / 50));
      const tagMap = TAG_NAMES.reduce((o, t, i) => {
        o[t] = toTagVal(vals[i] || 0);
        return o;
      }, {});
      addParticleWithTags(tagMap);
    });
  }
});

