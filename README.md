# SpanForge 🌉

**SpanForge** is an interactive emergency-bridge concept explorer, built entirely with **HTML, CSS, and JavaScript** and hosted directly on **GitHub Pages**.

**Live website:** https://notivanly.github.io/SpanForge/

## Features

- Responsive engineering dashboard
- Adjustable span, height, point-load equivalent, panel count, and example materials
- Custom browser-based **2D finite-element truss solver** (direct stiffness method)
- **46 distinct truss configurations**: ten original models plus 36 parametric combinations
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

`solver.js` computes the global stiffness matrix for an idealized 2D pin-jointed truss and solves the free-degree-of-freedom system using partial-pivot Gaussian elimination. It then computes each member's axial force, stress and estimated mass. The app explores 46 truss configurations with a discrete range of uniform member cross sections. All candidates, including those exceeding the simplified limits, appear in the comparison table. The panel slider supports 4–12 panels to keep all 46 modeled geometries distinct. Nominal height scales each profile; actual peak height may vary with the panel discretization.

### Configuration catalog

Original models: Pratt, Howe, Warren, Warren with verticals, X-braced, K-braced, Parker, Camelback-inspired, Bowstring-inspired, and Fan.

The 36 additional variants combine six upper-chord profiles (triangular, trapezoidal, sinusoidal, inverted polygonal, rising chord, double-hump) with six web patterns (Pratt, Howe, alternating, X-braced, K-braced, N-braced). These are distinct educational geometries, not 46 independently recognized historical bridge types. The model does not simulate bending-dominated beams, suspension cables, or true arches.

### Numerical checks

The expanded catalog was exercised across 9 panel counts, 2 example materials, and 4 span/height/load scenarios (3,312 candidate evaluations). All produced finite results with vertical reaction equilibrium within 0.000021 N. Geometry signatures confirmed 46 distinct configurations for each supported panel count. These checks are numerical consistency tests, not physical validation.

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
