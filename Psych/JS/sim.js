const { Engine, Render, Runner, Bodies, World, Vector } = Matter;

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
const PARTICLE_COUNT = 200;
const DEFAULT_PARTICLE_OPTIONS = {
  radius: 10,
  restitution: 1.1,
  frictionAir: 0.25,
  initialEnergy: 5
};

class Particle {
  constructor(x, y, options = {}) {
    const opts = { ...DEFAULT_PARTICLE_OPTIONS, ...options };
    this.radius = opts.radius;
    this.energy = opts.initialEnergy;
    this.state = 'idle';
    this.body = Bodies.circle(x, y, this.radius, {
      restitution: opts.restitution,
      frictionAir: opts.frictionAir,
      render: { fillStyle: '#0ff' }
    });
  }

  update(mousePos, bounds) {
    const { width, height } = bounds;
    const body = this.body;
    const dir = Vector.sub(mousePos, body.position);
    const dist = Vector.magnitude(dir);

    if (dist < 100) {
      this.state = 'active';
      this.energy = Math.min(1, this.energy + 0.02);
    } else {
      this.state = 'idle';
    }
    this.energy = Math.max(0, this.energy - 0.005);

    const color = Math.floor(this.energy * 255);
    body.render.fillStyle = `rgb(0, ${color}, 255)`;

    if (dist > 0) {
      const norm = Vector.normalise(dir);
      const forceMag = 0.001 + this.energy * 0.002;
      const force = Vector.mult(norm, forceMag);
      Matter.Body.applyForce(body, body.position, force);
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
}

// Create particles using the Particle class
const particles = [];
for (let i = 0; i < PARTICLE_COUNT; i++) {
  const p = new Particle(Math.random() * width, Math.random() * height);
  particles.push(p);
  World.add(world, p.body);
}

// Mouse tracking
let mousePos = { x: width / 2, y: height / 2 };
document.addEventListener('mousemove', e => {
  mousePos = { x: e.clientX, y: e.clientY };
});

// Apply attraction force
Matter.Events.on(engine, 'beforeUpdate', () => {
  for (const p of particles) {
    p.update(mousePos, { width, height });
  }
});
