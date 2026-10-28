# Deadheir

A short gothic mystery told in painted 2.5D. You are the ghost of Aldric Vane, heir of Vanehold, poisoned at the harvest feast. Drift across the moonlit estate, find five clues, and name your killer at the manor door.

**Play:** open `index.html` in a browser. No build step, no dependencies.

| Action | Keys | Touch |
| --- | --- | --- |
| Drift | ← → / A D | ◀ ▶ |
| Examine / continue | E, Space, Enter | ✦ |
| Journal | J | Journal button |
| Sound | M | Sound button |

## How the art works

Every image is painted at load time from code. There are no bitmap assets.

- **Brushwork** (`src/paint.js`): bristle strokes, dab clusters for foliage and clouds, and directional fills. Each one is seeded, so a shape paints the same way every time.
- **Depth**: six parallax layers (mountains, far hills, back woods, mid grounds, playfield, foreground). Atmospheric fog tints the distant layers. The far and near layers are painted at lower resolution, which blurs them like a camera's depth of field. Drifting mist bands sit between layers.
- **Light**: a darkness pass is cut open by the ghost's swinging lantern, the gas lamps and the manor windows. Warm additive bloom, moon rays, rim light on every stroke facing the moon, and fireflies and falling leaves at several depths complete it.
- **Finish**: a vignette and a linen canvas-weave texture over the whole frame.
- **Performance**: layers are cut into 512px chunks that are painted on demand and cached (`src/world.js`). Chunks just ahead of the camera are painted in spare frame time.
