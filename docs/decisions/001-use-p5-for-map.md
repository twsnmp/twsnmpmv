# ADR-001: Use p5.js for Network Map Visualization

## Status
Accepted

## Date
2026-05-11

## Context
We need a visualization library to render interactive network maps. The maps include nodes (with icons and status colors), lines connecting nodes, status indicators (gauges, bars), and background images. Key requirements:
- Ability to handle a large number of elements (potentially hundreds of nodes/lines).
- Support for custom drawing (gauges, specialty status indicators).
- Interactivity (zooming, panning).
- Compatibility with mobile and web environments (Capacitor).
- Ease of integration with TypeScript and Svelte.

## Decision
Use [p5.js](https://p5js.org/) for the network map visualization.

## Alternatives Considered

### SVG (with D3.js or pure Svelte)
- Pros: Excellent for DOM-based interactivity, CSS styling, and accessibility.
- Cons: Performance can degrade with thousands of elements in a single SVG. Complex custom drawing (like the specific gauges used in this project) can be more verbose to implement in pure SVG.
- Rejected: p5.js (Canvas) offers better performance for high-frequency updates and large numbers of elements, and the imperative drawing API is well-suited for the complex status indicators already implemented.

### WebGL-based libraries (Three.js, PixiJS)
- Pros: Extremely high performance.
- Cons: Higher learning curve, potential overhead for a 2D network map, complexity in handling text and 2D icons.
- Rejected: Overkill for the current requirements. p5.js provides a simpler API that is sufficient for 2D visualization.

### OpenLayers / Leaflet
- Pros: Built-in support for geographic maps, zooming, and layers.
- Cons: Designed for geographical data (lat/long). The network map in TWSNMP is a logical coordinate system (2000x2000), not necessarily geographical.
- Rejected: While TWSNMP supports geographical views, the main network map is a custom coordinate space where p5.js gives more flexibility for non-geographical layouts.

## Consequences
- The map logic is imperative and resides in `src/lib/map.ts`.
- We need to manage the lifecycle of the p5 instance (init, update, remove) within Svelte components.
- p5.js handles the canvas rendering, which is efficient for status updates.
- Text rendering and icon handling (Material Design Icons) are managed via p5's font loading capabilities.
