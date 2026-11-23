import numpy as np
import pytest
from spanforge.solver import Material, analyze, evaluate_bridge, MATERIALS, screen_designs


def test_one_bar_matches_hand_calculation():
    # 2 m bar, EA = 2 million N. A 1000 N axial force should elongate it 0.001 m.
    mat=Material("test",2e9,1000,1e9)
    r=analyze([(0,0),(2,0)],[(0,1)],[0.001],mat,[0,0,1000,0],[(0,0),(0,1),(1,1)])
    assert r["displacements_m"][1,0] == pytest.approx(0.001)
    assert r["forces_n"][0] == pytest.approx(1000)
    assert r["reactions_n"][0,0] == pytest.approx(-1000)


def test_bridge_vertical_equilibrium():
    r=evaluate_bridge(12,20000,6,2.5,"Pratt",MATERIALS["Timber (illustrative)"],0.01)
    assert np.sum(r["reactions_n"][:,1]) == pytest.approx(20000,abs=1e-5)
    assert np.isfinite(r["max_displacement_m"])


def test_comparative_screening():
    designs=screen_designs(12,20000,6,2.5,MATERIALS["Bamboo (illustrative)"])
    assert len(designs) >= 1
    assert all(v["passes_simplified_checks"] for _,_,v in designs)
