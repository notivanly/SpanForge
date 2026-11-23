"""Educational 2D pin-jointed truss finite-element solver (not construction validation)."""
from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class Material:
    name: str
    youngs_modulus_pa: float
    density_kg_m3: float
    allowable_stress_pa: float


MATERIALS = {
    "Bamboo (illustrative)": Material("Bamboo (illustrative)", 12e9, 700, 8e6),
    "Timber (illustrative)": Material("Timber (illustrative)", 10e9, 500, 6e6),
}


def analyze(nodes, members, areas, material, loads, fixed_dofs):
    """Return axial forces/stresses, nodal movements, support reactions, and mass.

    All units SI: m, N, Pa, kg. Members are pin-ended axial truss elements.
    fixed_dofs is an iterable of (node_index, component_index) with x=0,y=1.
    """
    xy = np.asarray(nodes, dtype=float)
    n = len(xy)
    if xy.ndim != 2 or xy.shape[1] != 2 or n < 2:
        raise ValueError("nodes must be a list of 2D coordinates")
    if len(members) != len(areas) or not len(members):
        raise ValueError("One positive area is required per member")
    if np.any(np.asarray(areas) <= 0):
        raise ValueError("Areas must be positive")
    K = np.zeros((2*n, 2*n))
    member_data = []
    for (a,b),A in zip(members,areas):
        d = xy[b]-xy[a]
        L = np.linalg.norm(d)
        if L <= 1e-10:
            raise ValueError("Zero-length truss member")
        c,s = d/L
        t = np.array([-c,-s,c,s])
        ke = (material.youngs_modulus_pa*A/L)*np.outer(t,t)
        dof = np.array([2*a,2*a+1,2*b,2*b+1])
        K[np.ix_(dof,dof)] += ke
        member_data.append((L,t,dof,A))
    f = np.asarray(loads, dtype=float).reshape(2*n)
    fixed = sorted(set(2*i+component for i,component in fixed_dofs))
    if any(j < 0 or j >= 2*n for j in fixed):
        raise ValueError("Invalid fixed degree of freedom")
    free = np.array([j for j in range(2*n) if j not in fixed], dtype=int)
    u = np.zeros(2*n)
    try:
        u[free] = np.linalg.solve(K[np.ix_(free,free)], f[free])
    except np.linalg.LinAlgError as exc:
        raise ValueError("Unstable truss: check connectivity and supports") from exc
    reactions = K @ u - f
    forces = np.array([material.youngs_modulus_pa*A/L*(t @ u[dof]) for L,t,dof,A in member_data])
    stresses = forces / np.asarray(areas)
    mass = sum(material.density_kg_m3 * A * L for L,_,_,A in member_data)
    return {"displacements_m":u.reshape((n,2)), "reactions_n":reactions.reshape((n,2)),
            "forces_n":forces, "stresses_pa":stresses, "mass_kg":mass,
            "max_displacement_m":float(np.max(np.linalg.norm(u.reshape(n,2),axis=1))),
            "max_stress_pa":float(np.max(np.abs(stresses)))}


def bridge(span_m, panels, height_m, layout):
    """Create two-chord triangulated bridge, panel count >= 2."""
    if panels < 2 or span_m <= 0 or height_m <= 0:
        raise ValueError("Span/height must be positive; at least 2 panels required")
    x = np.linspace(0,span_m,panels+1)
    nodes = [(v,0) for v in x]+[(v,height_m) for v in x]
    top = panels+1
    members = []
    for i in range(panels):
        members += [(i,i+1),(top+i,top+i+1)]
    for i in range(panels+1):
        members.append((i,top+i))
    for i in range(panels):
        if layout == "Pratt":
            members.append((i,top+i+1))
        elif layout == "Howe":
            members.append((top+i,i+1))
        else:
            raise ValueError("Choose Pratt or Howe")
    return nodes,members


def evaluate_bridge(span_m, total_load_n, panels, height_m, layout, material, area_m2):
    nodes,members = bridge(span_m,panels,height_m,layout)
    loads = np.zeros((len(nodes),2))
    # Equal downward point loads at interior lower nodes; this is a simplified load case.
    loads[1:panels,1] = -total_load_n/(panels-1)
    result = analyze(nodes,members,[area_m2]*len(members),material,loads,
                     fixed_dofs=[(0,0),(0,1),(panels,1)])
    limit_disp = span_m/300
    result.update({"nodes":nodes,"members":members,"loads_n":loads,
                   "stress_utilization":result["max_stress_pa"]/material.allowable_stress_pa,
                   "deflection_utilization":result["max_displacement_m"]/limit_disp,
                   "passes_simplified_checks":result["max_stress_pa"] <= material.allowable_stress_pa
                    and result["max_displacement_m"] <= limit_disp})
    return result


def screen_designs(span_m,total_load_n,panels,height_m,material):
    """Compare two truss layouts and discrete uniform areas. NOT full safety optimization."""
    candidates=[]
    for layout in ("Pratt","Howe"):
        for area in np.geomspace(0.0005,0.05,55):
            result=evaluate_bridge(span_m,total_load_n,panels,height_m,layout,material,float(area))
            if result["passes_simplified_checks"]:
                candidates.append((layout,float(area),result))
                break
    return sorted(candidates,key=lambda entry:entry[2]["mass_kg"])
