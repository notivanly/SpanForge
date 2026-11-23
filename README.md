# SpanForge 🌉

**SpanForge** is an educational prototype for comparing the material usage of simple bamboo and timber emergency-bridge **truss concepts** using a custom 2D finite-element solver.

> **Not for construction.** The tool is not a validated structural design program, does not certify safety, and cannot generate a buildable bridge. Consult qualified structural engineers and relevant standards for any physical application.

## Features

- Interactive span, vertical load, geometry, and illustrative material controls
- Custom direct-stiffness finite-element solver for **2D pin-jointed trusses**
- Pratt and Howe truss comparisons
- Displacement, axial force, and elastic axial-stress calculations
- Discrete uniform-member-area screening for simplified stress and deflection thresholds
- Visualization of calculated displacement (exaggerated for readability)
- Unit tests against a hand-checkable single-bar analytical result and global force equilibrium

## Tech stack

- **Python** — finite-element calculations and candidate screening
- **NumPy** — linear algebra and numerical arrays
- **Streamlit** — interactive web interface
- **Matplotlib** — bridge visualizations
- **pytest** — solver tests

## Run locally

Requires Python 3.10+.

```bash
python -m venv .venv
# macOS/Linux: source .venv/bin/activate
# Windows: .venv\Scripts\activate
pip install -r requirements.txt
streamlit run app.py
```

## Test

```bash
python -m pytest -q
```

## Model assumptions and limitations

- Small-displacement, linear-elastic **2D truss** behavior; axial forces only
- Members are idealized as perfectly pin connected
- One pinned support and one roller support
- Total vertical load split equally among interior bottom nodes
- All members use the same area; only two topology families are compared
- Example material properties and permissible stress limits are illustrative and **not** established design values
- Simplified displacement threshold = span / 300 (illustrative only)
- No buckling, joint design, lateral stability, bracing, footing capacity, live-load dynamics, flood or wind actions, durability, partial safety factors, or building-code compliance

Therefore an on-screen screening result **must not** be described as a safe bridge design.

## How it works

For each truss member, axial element stiffness scales with `E*A/L`. The solver assembles the transformed global stiffness matrix `K`, solves `K*u = F` for free displacements, and computes axial member forces and reactions. Candidate topology and area combinations are filtered using the **simplified** stress and displacement checks; the surviving lowest-mass candidate is shown.

## Suggested future work

1. Add compressive member buckling and connection failure checks.
2. Add verified property databases with uncertainty and code-based load combinations.
3. Add more structure families and true size/topology optimization.
4. Validate numerical results against published benchmark models, then independent engineering review.

## License

MIT
