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

// Helper to create a particle with state
function createParticle(x, y) {
  const body = Bodies.circle(x, y, 5, {
    restitution: 2,
    frictionAir: 0.2,
    render: { fillStyle: '#0ff' }
  });
  return {
    body,
    state: 'idle',
    energy: 0.5
  };
}

// Create particles with stateful information
const particles = [];
for (let i = 0; i < 100; i++) {
  const p = createParticle(Math.random() * width, Math.random() * height);
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
  const radius = 5;
  for (const p of particles) {
    const body = p.body;
    const dir = Vector.sub(mousePos, body.position);
    const dist = Vector.magnitude(dir);

    // Update state based on distance to mouse
    if (dist < 100) {
      p.state = 'active';
      p.energy = Math.min(1, p.energy + 0.02);
    } else {
      p.state = 'idle';
    }
    p.energy = Math.max(0, p.energy - 0.005);

    // Color based on energy level
    const color = Math.floor(p.energy * 255);
    body.render.fillStyle = `rgb(0, ${color}, 255)`;

    // Apply attraction force affected by energy
    if (dist > 0) {
      const norm = Vector.normalise(dir);
      const forceMag = 0.001 + p.energy * 0.002;
      const force = Vector.mult(norm, forceMag);
      Matter.Body.applyForce(body, body.position, force);
    }

    let { x, y } = body.position;

    if (x - radius < 0 || x + radius > width) {
      body.velocity.x *= -1;
      Matter.Body.setPosition(body, {
        x: Math.max(radius, Math.min(x, width - radius)),
        y
      });
    }
    if (y - radius < 0 || y + radius > height) {
      body.velocity.y *= -1;
      Matter.Body.setPosition(body, {
        x,
        y: Math.max(radius, Math.min(y, height - radius))
      });
    }
  }
});

