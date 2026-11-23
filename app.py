import matplotlib.pyplot as plt
import numpy as np
import streamlit as st
from spanforge.solver import MATERIALS, screen_designs

st.set_page_config(page_title="SpanForge", page_icon="🌉", layout="wide")
st.title("SpanForge")
st.caption("Preliminary bamboo & timber truss exploration | Educational prototype, not a certified bridge design")
st.warning("Do not build a bridge from these results. This 2D pin-jointed model omits buckling, joints, lateral stability, foundations, impact, environmental loads, and code-required safety factors.")

with st.sidebar:
    st.header("Crossing requirements")
    span = st.slider("Span (m)", 3.0, 30.0, 12.0, 0.5)
    load_kn = st.slider("Total vertical load (kN)", 1.0, 100.0, 20.0, 1.0)
    panels = st.slider("Panels", 2, 12, 6)
    height = st.slider("Truss height (m)", 0.5, 8.0, 2.5, 0.25)
    matname = st.selectbox("Illustrative material", list(MATERIALS))
    st.caption("Material properties are placeholders, not verified design values.")

material = MATERIALS[matname]
try:
    ranked = screen_designs(span, load_kn * 1000, panels, height, material)
    if not ranked:
        st.error("No candidate passed the simplified stress and displacement screening in the tested section-area range.")
        st.stop()
    layout, area, r = ranked[0]
    a, b, c = st.columns(3)
    a.metric("Lowest screened mass", f"{r['mass_kg']:.1f} kg")
    b.metric("Selected topology", layout)
    c.metric("Uniform member area", f"{area * 1e4:.1f} cm²")
    st.subheader("Preliminary truss geometry and calculated deformation")
    fig, ax = plt.subplots(figsize=(11, 4))
    coords = np.asarray(r["nodes"])
    deformed = coords + r["displacements_m"] * 20
    for i, j in r["members"]:
        ax.plot(coords[[i, j], 0], coords[[i, j], 1], color="#64748b", lw=2)
        ax.plot(deformed[[i, j], 0], deformed[[i, j], 1], color="#0d9488", lw=1.2, ls="--")
    ax.set_aspect("equal", adjustable="datalim")
    ax.grid(alpha=0.2)
    ax.set_xlabel("Horizontal position (m)")
    ax.set_ylabel("Height (m)")
    ax.set_title("Solid: undeformed | Dashed: displacement exaggerated 20x")
    st.pyplot(fig)
    d, e = st.columns(2)
    d.metric("Max computed axial stress", f"{r['max_stress_pa'] / 1e6:.2f} MPa")
    e.metric("Max nodal displacement", f"{r['max_displacement_m'] * 1000:.2f} mm")
    st.write(f"Simplified stress utilization: **{r['stress_utilization']:.1%}** | Displacement utilization: **{r['deflection_utilization']:.1%}**")
    st.subheader("Screened candidates")
    st.dataframe([
        {"Topology": ly, "Mass (kg)": round(v["mass_kg"], 2),
         "Uniform area (cm²)": round(ar * 1e4, 2),
         "Stress utilization": round(v["stress_utilization"], 3),
         "Deflection utilization": round(v["deflection_utilization"], 3)}
        for ly, ar, v in ranked
    ], hide_index=True)
    st.info("A 'pass' means only that the specified simplified elastic stress and displacement thresholds passed. It is not a safety verdict or construction approval.")
except ValueError as err:
    st.error(str(err))
