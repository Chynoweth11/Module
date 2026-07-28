# Aurora Ridge Residence — construction time‑lapse

A cinematic, procedurally generated construction time‑lapse of a custom
mountain residence, built with three.js. No build step, no assets — every
texture is generated in canvas at boot.

## Run it
```
npm install
npm start        # serves on http://localhost:8080 and opens your browser
```
Or just open `index.html` directly — three.js is vendored locally in
`vendor/`, so no network is required at all.

## Controls
- **Play / space** — run the 412‑day schedule (≈112 s at 1×)
- **Drag** — orbit · **wheel / pinch** — zoom (the shot recovers on its own)
- **Scrub** the timeline; hover it for day + phase
- **Click** any piece of the building, equipment or material stack to
  identify it and read how it's actually built
- **Gear** — playback speed, cutaway mode, sun cycle, weather, crew toggles
- **← / →** — step 2 days (shift: 14)

## Files
```
index.html          markup + script load order
css/app.css         all styles (scoped under #ct)
js/00-core.js       schedule, phases, milestones, weather, helpers
js/10-textures.js   procedural canvas textures + normal maps
js/20-scene.js      renderer, sky, lights, terrain system
js/30-plan.js       floor plan: walls, openings, roofs, materials
js/40-build.js      every construction phase, instancing, cutaway
js/50-actors.js     equipment, crew, temp facilities, weather/dust FX
js/60-camera.js     directed cinematic camera
js/70-ui.js         transport, scrubber, settings, click‑to‑identify
js/80-main.js       sun/sky cycle, frame loop, adaptive quality, boot
```
