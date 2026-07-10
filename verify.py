"""Verify oll.json / pll.json: every grid matches its setup, every alg solves it.

    python3 verify.py oll.json pll.json
"""
import sys, json
from cube import solved, parse, apply, normalize, f2l_solved, grid, COLOR


def state(setup):
    st = solved(); apply(st, parse(setup)); normalize(st); return st


def check(path):
    data = json.load(open(path)); errs = 0
    for c in data["cases"]:
        st = state(c["setup"])
        if not f2l_solved(st):
            print(f"{path} {c['id']}: setup breaks F2L"); errs += 1; continue
        g = grid(st)
        # OLL grids are booleans (is this sticker yellow); PLL grids are colours.
        if isinstance(c["grid"][1][1], bool):
            g = [[None if x is None else (x == "Y") for x in row] for row in g]
        if g != c["grid"]:
            print(f"{path} {c['id']}: grid mismatch"); errs += 1
        for alg in c["algs"]:
            st2 = state(c["setup"]); apply(st2, parse(alg)); normalize(st2)
            if not all(COLOR[n] == col for _, n, col in st2):
                print(f"{path} {c['id']}: alg does not solve -> {alg}"); errs += 1
    print(f"{path}: {len(data['cases'])} cases, {errs} error(s)")
    return errs


if __name__ == "__main__":
    paths = sys.argv[1:] or ["oll.json", "pll.json"]
    sys.exit(1 if sum(check(p) for p in paths) else 0)