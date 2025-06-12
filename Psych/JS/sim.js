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

// Create particles
const particles = [];
for (let i = 0; i < 100; i++) {
  const particle = Bodies.circle(Math.random() * width, Math.random() * height, 5, {
    restitution: 2,
    frictionAir: 0.2,
    render: { fillStyle: '#0ff' }
  });
  particles.push(particle);
  World.add(world, particle);
}

// Mouse tracking
let mousePos = { x: width / 2, y: height / 2 };
document.addEventListener('mousemove', e => {
  mousePos = { x: e.clientX, y: e.clientY };
});

// Apply attraction force
Matter.Events.on(engine, 'beforeUpdate', () => {
  const radius = 5;
  for (const p of particles) {
    const dir = Vector.sub(mousePos, p.position);
    const dist = Vector.magnitude(dir);
    if (dist > 0) {
      const norm = Vector.normalise(dir);
      const force = Vector.mult(norm, 0.001);
      Matter.Body.applyForce(p, p.position, force);
    }

    let { x, y } = p.position;

    if (x - radius < 0 || x + radius > width) {
      p.velocity.x *= -1;
      Matter.Body.setPosition(p, {
        x: Math.max(radius, Math.min(x, width - radius)),
        y
      });
    }
    if (y - radius < 0 || y + radius > height) {
      p.velocity.y *= -1;
      Matter.Body.setPosition(p, {
        x,
        y: Math.max(radius, Math.min(y, height - radius))
      });
    }
  }
});

