# SpanForge 🌉

**SpanForge** is an interactive emergency-bridge concept explorer, built entirely with **HTML, CSS, and JavaScript** and hosted directly on **GitHub Pages**.

**Live website:** https://notivanly.github.io/SpanForge/

## Features

- Responsive engineering dashboard
- Adjustable span, height, point-load equivalent, panel count, and example materials
- Custom browser-based **2D finite-element truss solver** (direct stiffness method)
- Pratt and Howe truss comparisons
- Calculated axial stresses, joint displacements, support reactions and approximate truss member mass
- Discrete uniform-member-area screening
- Interactive SVG bridge diagram with exaggerated deformation
- No build tools, external services, or package installation needed

## Tech stack

- **HTML5** — dashboard structure
- **CSS3** — dark responsive interface
- **JavaScript (ES6)** — custom finite-element solver, linear algebra, SVG visualization and controls

## Running locally

Open `index.html` in a browser. No installation is required.

## GitHub Pages

In repository **Settings → Pages**, choose **Deploy from a branch**, **main**, **/(root)**. The home page is `index.html`. GitHub publishes the site at:

https://notivanly.github.io/SpanForge/

## The solver

`solver.js` computes the global stiffness matrix for an idealized 2D pin-jointed truss and solves the free-degree-of-freedom system using partial-pivot Gaussian elimination. It then computes each member's axial force, stress and estimated mass. The app explores two truss topologies with a discrete range of uniform member cross sections.

**Modeling assumptions:** linear elasticity, small displacement, 2D truss elements, perfectly pinned connections, a pinned and roller support, and loads divided among interior bottom joints. The example material properties and stress limits are *illustrative*, not verified allowable material properties. The span/300 movement threshold is an example screening choice only.

## IMPORTANT SAFETY LIMITATION

**SpanForge is an educational demonstration, not a certified structural design, construction plan or safety analysis. Never build or load a bridge based on these results.** It does not assess member buckling, joint failure, lateral stability, foundations, environmental loads, dynamic loads, construction details, material variability, or required load and resistance factors. Physical bridge projects require verified materials, applicable standards, and a qualified structural engineer.

## Project files

- `index.html` — app page
- `style.css` — styling
- `solver.js` — mathematical analysis
- `app.js` — interface and interactive SVG rendering

## License

MIT
