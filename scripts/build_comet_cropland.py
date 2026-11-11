"""Usage: python3 build_comet_cropland.py US_COMETPlanner_data.xlsx public/data/comet_cropland.json"""
import json, sys, pandas as pd
df = pd.read_excel(sys.argv[1], sheet_name='Emissions Reductions', dtype={'fips': str})
df = df[df['class'] == 'Cropland Management']
V = {
 '329': 'Intensive Till to No Till or Strip Till on {I} Cropland',
 '345': 'Intensive Till to Reduced Till on {I} Cropland',
 '340': 'Add Non-Legume Seasonal Cover Crop to Intensive Till {I} Cropland',
 '590': 'Improved N Fertilizer Management on Intensive Till {I} Croplands - Reduce Fertilizer Application Rate by 15%',
 '336': 'Add 3 tons/ac of Compost (C:N 20) Annually to Intensive Till {I} Croplands',
 '888': 'Intensive Till to No Till or Strip Till (CPS 329) + Synthetic N Fertilizer Reductions of 15% (CPS 590) on {I} Croplands',
}
out = {}
for cps, tmpl in V.items():
    for key, irr in (('ni', 'Non-Irrigated'), ('ir', 'Irrigated')):
        impl = tmpl.format(I=irr)
        sub = df[(df.cpsnum == int(cps)) & (df.planner_implementation == impl)]
        assert len(sub) > 0, impl
        assert sub.fips.is_unique, impl
        nm = (sub.total_ghg_co2 == -999).sum()
        print(f'{cps} {key}: {len(sub)} counties, {nm} not-estimated, median {sub[sub.total_ghg_co2!=-999].total_ghg_co2.median():.3f}', file=sys.stderr)
        for f, v in zip(sub.fips.str.zfill(5), sub.total_ghg_co2):
            out.setdefault(f, {}).setdefault(cps, {})[key] = None if v == -999 else round(float(v), 4)
ORDER = ['329', '345', '340', '590', '336', '888']  # must match COMET_PRACTICE_ORDER in constants.ts
packed = {'order': ORDER, 'variants': ['ni', 'ir'],
          'counties': {f: [out[f].get(c, {}).get(k) for c in ORDER for k in ('ni', 'ir')] for f in out}}
json.dump(packed, open(sys.argv[2], 'w'), separators=(',', ':'))
print(len(out), 'counties', file=sys.stderr)
# sample parcel: Marshall County IA (19127)
print('19127', out.get('19127'), file=sys.stderr)
