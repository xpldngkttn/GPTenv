# GPTenv

This project contains a minimal particle simulation built with Matter.js.
Particles follow the mouse cursor and bounce off the browser window edges.

Each particle is an instance of a `Particle` class that stores its Matter.js
body, current state, and an **energy** value. Energy changes based on proximity
to the mouse and influences both color and the pull toward the cursor.

Particle properties like radius and restitution can be tweaked in
`DEFAULT_PARTICLE_OPTIONS` inside `Psych/JS/sim.js`.

Open `Psych/index.html` in a browser to see the simulation.
