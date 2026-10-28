# Deadheir

A short gothic mystery told in painted 2.5D. You are the ghost of Andrew Vane, heir of Vanehold, poisoned at the harvest feast. Drift across the moonlit estate, find five clues, and name your killer at the manor door (or in the steward's study, once you can get in). Then decide what to do with the truth.

The two boys are Andrew (A.C.), the ghost you play, and his brother Thomas (T.J.).

**Play:** open `index.html` in a browser. No build step, no dependencies.

**On a phone:** turn it sideways. If your phone's rotation is locked, tap **Play sideways** on the title screen, or **Sideways** in the top bar during play. The game rotates itself to fill the screen; tap **Upright** to switch back.

| Action | Keys | Touch |
| --- | --- | --- |
| Drift | ← → / A D | ◀ ▶ |
| Jump (hold to glide) | Space / W / ↑ | ⤒ |
| Examine / continue / climb off the carousel | E, Enter | ✦ |
| Choose an answer | 1–3, or ↑ ↓ then Enter (Esc backs out) | tap |
| Reach for the carousel's brass ring | Space (while riding) | ⤒ |
| Fire Bone Buster (hold to charge) | F / X | ● |
| Journal | J | Journal button |
| Sound | M | Sound button |

## Echoes and endings

Eight optional **echoes** linger on the grounds, in the house and past the fair: pale blue memories you can listen to. They show what drove each suspect, and what you yourself set in motion. Once you name the killer, you choose between justice and mercy, and the ending changes with your choice and with what you heard.

## Hazards and the side quest

- **Shades** drift along parts of the path. Each touch dims your lantern by one flame. When all three go out, you wake at the last gas lamp you passed. You can jump over shades, and passing a lamp relights your lantern.
- **Blue Bones** rattles around in the Vane mausoleum: a robot skeleton in a battered blue helmet, an homage to a certain blue bomber. He has lost three Energy Cells. One is above the tallest headstone, one is high over the fountain (climb the basin rim, then the bowl), and one is out where the shades patrol by the cellar. Bring them back and he refits his **Bone Buster** for you. Three pellets can be on screen at once; a charged shot pierces. He also shares something he saw on the night of the feast.

## The Vane Harvest Fair

Past the manor's east wall lies the family's abandoned fairground: a slowly turning ferris wheel, a carousel whose horses still circle, a torn big top, a helter-skelter and a broken roller coaster. **Mister Lamb**, the ghostly barker, still runs five booths:

| Booth | How to play |
| --- | --- |
| Duck Shoot | Hold to spray the water gun; knock down 12 ducks in 25 seconds |
| Balloon Pop | Throw darts at swaying balloons; pop 7 with 10 darts |
| Ring Toss | Toss rings onto bottle necks (back rows are harder); ring 3 with 10 rings |
| Milk Cans | Knock all 6 cans off the shelf with 3 balls |
| Star Shootout | Hold to fire 100 BBs and shoot out the red star |

Aim with the mouse or a finger; on a keyboard, aim with the arrow keys and act with Space. Each prize holds a family memory and goes in the journal. Win all five and Mister Lamb punches a golden ticket for the wheel. The ride lifts you above the whole estate, and your lantern comes back with a fourth flame. Listen at the carousel for one more echo.

## The carousel

The carousel at the fair is big enough to ride. Press **E** beside it to climb onto a horse. The ride speeds up and the calliope waltz quickens; **← →** change the pace. Every lap the ring arm offers a ring as you sweep past its side: press **Space** while it is in reach. Most are tin, some are **brass**. Three brass rings wake a music box in the house. **E** climbs back down.

## Inside Vanehold

The great door is no longer just where you name your killer: you can now go in. The house has two storeys and ten rooms, all painted in the same brushwork as the grounds and lit by candle, hearth and moon.

- **Ground floor:** the Great Hall (with the stopped clock and the family portraits), the Dining Hall where you were poisoned, the Library, the Steward's Study and the Kitchen.
- **Upper floor:** the gallery, the nursery with two small beds marked A.C. and T.J., Lord Vane's chamber, Lady Vesper's boudoir and the music attic. Climb or descend the grand stair with **E**; you can also step off the balcony.
- **Spirits** still patrol the dining hall, library, nursery and boudoir. Shoot them with the Bone Buster, or jump them. Fireplaces rekindle your lantern and act as checkpoints.
- **A locked study:** pull the brass atlas in the library to open it. Halloway's desk and the strongroom both need the Steward's Keys you found on the cellar stair. With all five clues you can accuse from his desk.
- **Mrs. Pennywick**, the cook, hands out funeral biscuits that relight your lantern.
- **The music box** in the attic takes three brass rings. Wake it for a waltz and a fifth lantern flame.
- Small finds in the house and beyond are collected in the journal as **relics**.

## The Hollow Reach

The path now continues past the fair, through a wrought-iron gate into country that was never on the map.

- **The Hall of Mirrors:** three mirrors, three visions, and then your own face.
- **The cider orchard:** Old Patch, the scarecrow, has lost six silver Moon Apples. Climb the crates, the hay wagon, the well and the cider press to find them (each one rekindles a flame). Return all six for the boathouse key. Shades prowl by the wagon.
- **The mirror lake and the boathouse:** the painter Robert Hale has been waiting a long time to tell you what he saw on the night of the feast.
- **The chapel on the hill:** your father waits in the crypt. Ring the bell outside. Past the chapel is a lookout over the whole estate.
- **Lamplight travel:** every gas lamp is a waymarker. Press **E** at a lamp to walk to any lamp you have already lit.

## How the art works

Every image is painted at load time from code. There are no bitmap assets.

- **Brushwork** (`src/paint.js`): bristle strokes, dab clusters for foliage and clouds, and directional fills. Each one is seeded, so a shape paints the same way every time.
- **Depth**: seven parallax layers (mountains, far hills, back woods, mid grounds, near grounds, playfield, foreground). They shift horizontally, and vertically when you jump, each by its own depth. Atmospheric fog tints the distant layers. The far and near layers are painted at lower resolution, which blurs them like a camera's depth of field. Drifting mist bands sit between layers.
- **Light**: a darkness pass is cut open by the ghost's swinging lantern, the gas lamps and the manor windows. Warm additive bloom, moon rays with drifting dust, and rim light on every stroke facing the moon complete it. On top of that: light cones under the gas lamps, warm light pooling on the path and beneath the lantern, puddles that reflect lamps and the ghost, an animated fountain, and fireflies, bats and falling leaves at several depths.
- **Grounding**: soft contact shadows, cast away from the moon, sit under trees, headstones, statues and buildings.
- **Storm**: now and then distant lightning flashes. The far layers flare while the near ones stay dark silhouettes, and thunder follows a moment later.
- **Finish**: a vignette and a linen canvas-weave texture over the whole frame.
- **Performance**: layers are cut into 512px chunks that are painted on demand and cached (`src/world.js`). Chunks just ahead of the camera are painted in spare frame time.
