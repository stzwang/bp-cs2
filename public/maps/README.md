# Minimap radar images

Drop 1024×1024 CS2 radar PNGs here, named by the GRID map key:

```
dust2.png  mirage.png  nuke.png  inferno.png  overpass.png
ancient.png  anubis.png  vertigo.png  train.png
```

The minimap (`app/match/[id]/Minimap.tsx`) loads `/maps/<map>.png` automatically.
If a file is missing, player positions still render on a relative grid using the
calibration in `lib/maps.ts`.

If dots look offset against a radar image, tune `posX` / `posY` / `scale` for that
map in `lib/maps.ts` — those values come from the map's overview `.txt` and must
match the resolution/crop of the PNG you drop in here (standard SimpleRadar 1024px).
