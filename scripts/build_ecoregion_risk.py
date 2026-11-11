"""
Usage: python3 build_ecoregion_risk.py us_eco_l3.shp public/data/ecoregions.json 0.04 0.01
All EPA Level III ecoregions (CONUS): Anderegg et al. 2022 reversal risk, Version C.
  fire: full projected (mean of 2020s-2050s, SSP2-4.5)
  drought/insects: max(0, projected - 1980s)
  combined = 1 - (1-fire)(1-max(d_ex, i_ex));  perm30 = (1-combined)^30
  sensitivity: independent = 1 - (1-fire)(1-d_ex)(1-i_ex)
Forested cells = cells where all three CarbonPlan web layers are non-NaN
(the published layers are only populated over the authors' forest mask).
Writes public/data/ecoregions.json (FeatureCollection, WGS84, simplified).
"""
import sys, json, ssl, urllib.request
import numpy as np, numcodecs, geopandas as gpd
import shapely
from shapely import contains_xy

import certifi
ctx = ssl.create_default_context(cafile=certifi.where())
BASE = 'https://carbonplan.blob.core.windows.net/carbonplan-forests/risks/results/web'
CT, CY, CX = 3, 196, 303
NR, NC = 783, 1209
X0, Y0, RES = -2493045.0, 3310005.0, 4000.0
ALBERS = '+proj=aea +lat_1=29.5 +lat_2=45.5 +lat_0=23 +lon_0=-96 +x_0=0 +y_0=0 +datum=WGS84'
SHP = sys.argv[1]
OUT = sys.argv[2]
TOL = float(sys.argv[3]) if len(sys.argv) > 3 else 0.02

def chunk(ds, ct, cy, cx):
    url = f'{BASE}/{ds}.zarr/ssp245/{ct}.{cy}.{cx}'
    for attempt in range(4):
        try:
            with urllib.request.urlopen(url, context=ctx, timeout=90) as r:
                raw = r.read()
            return np.frombuffer(numcodecs.blosc.decompress(raw), dtype='<f8').reshape(CT, CY, CX)
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None  # missing chunk = all fill (NaN)
        except Exception as e:
            print('retry', url, e, file=sys.stderr)
    raise RuntimeError(url)

def read_all(ds):
    out = np.full((12, NR, NC), np.nan)
    for ct in range(3):  # t idx 0..8 cover 1980s..2060s; we need 0 and 4..7
        for cy in range((NR + CY - 1) // CY):
            for cx in range((NC + CX - 1) // CX):
                c = chunk(ds, ct, cy, cx)
                if c is None:
                    continue
                r0, r1 = cy * CY, min((cy + 1) * CY, NR)
                c0, c1 = cx * CX, min((cx + 1) * CX, NC)
                out[ct*CT:(ct+1)*CT, r0:r1, c0:c1] = c[:, :r1-r0, :c1-c0]
    return out

import os
CACHE = os.path.join(os.path.dirname(OUT), 'zarr_cache.npz')
if os.path.exists(CACHE):
    z = np.load(CACHE); data = {k: z[k] for k in ('fire', 'drought', 'insects')}
else:
    data = {}
    for ds in ('fire', 'drought', 'insects'):
        print('reading', ds, file=sys.stderr)
        data[ds] = read_all(ds)
    np.savez(CACHE, **data)

base = {k: v[0] for k, v in data.items()}
with np.errstate(all='ignore'):
    proj = {k: np.nanmean(v[4:8], axis=0) for k, v in data.items()}
valid = np.ones((NR, NC), bool)
for k in data:
    valid &= ~np.isnan(base[k]) & ~np.isnan(proj[k])
print(f'forested valid cells: {valid.sum()} of {NR*NC}', file=sys.stderr)

fire = proj['fire']
dex = np.maximum(0.0, proj['drought'] - base['drought'])
iex = np.maximum(0.0, proj['insects'] - base['insects'])
comb = 1 - (1 - fire) * (1 - np.maximum(dex, iex))
comb_ind = 1 - (1 - fire) * (1 - dex) * (1 - iex)
perm = (1 - comb) ** 30
perm_ind = (1 - comb_ind) ** 30
all_perm = perm[valid]

gdf = gpd.read_file(SHP)
diss = gdf.dissolve(by='US_L3CODE', aggfunc='first').reset_index()
alb = diss.to_crs(ALBERS)
cx_ = X0 + np.arange(NC) * RES + RES / 2
cy_ = Y0 - np.arange(NR) * RES - RES / 2
MX, MY = np.meshgrid(cx_, cy_)

props = {}
for _, row in alb.iterrows():
    code = str(row['US_L3CODE'])
    inside = contains_xy(row.geometry, MX, MY)
    m = inside & valid
    n = int(m.sum())
    p = {'code': code, 'name': row['US_L3NAME'], 'nCells': n}
    if n > 0:
        v = perm[m]; vi = perm_ind[m]
        med = float(np.median(v))
        p['perm30'] = {'p25': round(float(np.percentile(v, 25)), 4),
                       'median': round(med, 4),
                       'p75': round(float(np.percentile(v, 75)), 4)}
        p['perm30Independent'] = {'p25': round(float(np.percentile(vi, 25)), 4),
                                  'median': round(float(np.median(vi)), 4),
                                  'p75': round(float(np.percentile(vi, 75)), 4)}
        # share of CONUS forested cells with lower risk (higher perm30) than this region's median
        p['riskPercentile'] = round(float((all_perm > med).mean() * 100), 1)
    props[code] = p
    print(code, p.get('name'), n, p.get('perm30'), file=sys.stderr)

wgs = diss.to_crs('EPSG:4326')
geoms = shapely.coverage_simplify(np.array(wgs.geometry.values), TOL)
geoms = shapely.set_precision(geoms, float(sys.argv[4]) if len(sys.argv) > 4 else 0.001)
features = []
for code, g in zip(wgs['US_L3CODE'].astype(str), geoms):
    if g is None or g.is_empty:
        continue
    features.append({'type': 'Feature', 'properties': props[code], 'geometry': json.loads(shapely.to_geojson(g))})

fc = {'type': 'FeatureCollection', 'features': features}
with open(OUT, 'w') as f:
    json.dump(fc, f, separators=(',', ':'))
print(f'wrote {OUT} {len(json.dumps(fc, separators=(",", ":")))/1024:.0f} KB, {len(features)} features', file=sys.stderr)

for code in ('4', '5', '58', '59'):
    print('CHECK', code, props[code].get('perm30'), props[code].get('perm30Independent'), file=sys.stderr)
# combined 58+59 check (matches earlier N.Appalachians definition)
m = (contains_xy(alb[alb.US_L3CODE.isin(['58', '59'])].union_all(), MX, MY)) & valid
print('CHECK 58+59', np.median(perm[m]), np.percentile(perm[m], 25), np.percentile(perm[m], 75),
      'indep', np.median(perm_ind[m]), np.percentile(perm_ind[m], 25), np.percentile(perm_ind[m], 75), file=sys.stderr)
