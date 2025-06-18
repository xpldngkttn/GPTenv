# GPTenv

This project contains a minimal particle simulation built with Matter.js.
Particles are attracted to each other and to the mouse cursor based on
randomly generated tag, knockback resistance, and attraction coefficient
values for each particle. Default ranges and visual properties still come from
`Psych/config/particles.json`. Particles bounce off the browser window edges.

Each particle is an instance of a `Particle` class that stores its Matter.js
body, current state, and an **energy** value. Energy changes based on proximity
to the mouse and influences both color and attraction strength. The visible
color of a particle is automatically generated from its six tag values: each
tag maps to a single hexadecimal digit in the `#RRGGBB` code, so different tag
combinations produce different colors.

Particle properties like radius and restitution can be tweaked in
`DEFAULT_PARTICLE_OPTIONS` inside `Psych/JS/sim.js`. Each tag now has two
attraction radii: an inner radius and an outer radius. Values for these are
randomly generated for each particle but can be overridden per class in
`Psych/config/particles.json`. Attraction is reversed when particles are within
the inner radius, normal between the inner and outer radii, and ignored
entirely outside the outer radius.

Open `Psych/index.html` in a browser to see the simulation.
