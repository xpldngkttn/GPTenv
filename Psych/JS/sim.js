const { Engine, Render, Runner, Bodies, World, Vector } = Matter;

const TAG_NAMES = Array.from({ length: 10 }, (_, i) => `tag${i}`);

const engine = Engine.create();
const world = engine.world;
engine.gravity.y = 0;

const width = window.innerWidth + 50;
const height = window.innerHeight + 50;

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

// ----- Simulation options -----
const PARTICLE_COUNT = 100;
const DEFAULT_PARTICLE_OPTIONS = {
  radius: 5,
  restitution: 2,
  frictionAir: 0.2,
};

function blankTagMap() {
  return TAG_NAMES.reduce((o, t) => { o[t] = 0; return o; }, {});
}

function randomTagMap() {
  return TAG_NAMES.reduce((o, t) => {
    o[t] = Math.random();
    return o;
  }, {});
}

class Particle {
  constructor(x, y, options = {}) {
    const opts = { ...DEFAULT_PARTICLE_OPTIONS, ...options };
    this.radius = opts.radius;
    this.color = opts.color;
    this.tags = { ...blankTagMap(), ...opts.tags };
    this.knockRes = { ...blankTagMap(), ...opts.knockRes };
    this.attractCoef = { ...blankTagMap(), ...opts.attractCoef };
    this.opscale = { ...blankTagMap(), ...opts.opscale };
    this.mouseAttract = opts.mouseAttract ?? 1;
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

    body.render.fillStyle = this.color;

    if (dist > 30 && this.mouseAttract) {
      const norm = Vector.normalise(dir);
      const forceMag = this.mouseAttract * 0.001;
      Matter.Body.applyForce(body, body.position, Vector.mult(norm, forceMag));
    }

    let { x, y } = body.position;
    const r = this.radius;

    if (x - r < 0 || x + r > width) {
      body.velocity.x *= -1;
      Matter.Body.setPosition(body, {
        x: Math.max(r, Math.min(x, width - r)),
        y
      });
    }
    if (y - r < 0 || y + r > height) {
      body.velocity.y *= -1;
      Matter.Body.setPosition(body, {
        x,
        y: Math.max(r, Math.min(y, height - r))
      });
    }
  }

  interactWith(other) {
    const toOther = Vector.sub(other.body.position, this.body.position);
    const dist = Vector.magnitude(toOther);
    TAG_NAMES.forEach(tag => {
      const val = other.tags[tag] || 0;
      const kb = val * (this.knockRes[tag] || 0);
      if (kb && dist < this.radius + other.radius + 20) {
        const norm = Vector.normalise(Vector.mult(toOther, -1));
        Matter.Body.applyForce(this.body, this.body.position, Vector.mult(norm, kb));
      }
      const att = val * (this.attractCoef[tag] || 0);
      if (att) {
        const norm = Vector.normalise(toOther);
        Matter.Body.applyForce(this.body, this.body.position, Vector.mult(norm, att));
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
        tags: randomTagMap(),
        knockRes: randomTagMap(),
        attractCoef: randomTagMap(),
      };
      const p = new Particle(
        Math.random() * width,
        Math.random() * height,
        randOpts
      );
      particles.push(p);
      World.add(world, p.body);
      console.log("Particle Created")
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

