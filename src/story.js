'use strict';
const STORY = {
  grave: {
    title: 'Here Lies Andrew Vane',
    text: [
      'Heir of Vanehold. Taken in his twenty-third autumn.',
      'The earth over the grave is still soft. You remember the harvest feast, the candlelight, a glass of wine, and then a cold that never left.',
      'Someone at Vanehold put you in the ground. The house still burns its lamps. Walk the estate and learn who did it, before the last leaf falls.',
    ],
  },
  goblet: {
    clue: true,
    title: 'The Silver Goblet',
    text: [
      'Your goblet from the feast, flung into the roots beneath the willow.',
      'The dregs smell of bitter almonds. You drank, and you fell. Whoever poured this had the run of the wine cellar.',
    ],
    note: 'Poison in your wine. The poisoner could get into the cellar.',
  },
  ledger: {
    clue: true,
    title: "The Gardener's Ledger",
    text: [
      'Inside the shed, a ledger lies open beside the seed trays.',
      '"Rat poison: two tins." It is signed in a neat clerk\'s hand: "H." Old Tobin the gardener has never learned to write his own name.',
    ],
    note: 'Two tins of poison, signed for by someone marked "H." Not the gardener.',
  },
  letter: {
    clue: true,
    title: "Thomas's Letter",
    text: [
      'A letter is pinned under a stone on the gazebo rail. It is in your brother\'s hand.',
      '"Andrew — the coach has thrown a wheel at Carrow. I shan\'t reach Vanehold until the morning after the feast. Save me a glass. — T."',
      'Thomas always wanted the title. But he was forty miles away that night.',
    ],
    note: 'Thomas was stranded at Carrow the night of the feast.',
  },
  locket: {
    clue: true,
    title: "Lady Vesper's Locket",
    text: [
      'Your stepmother\'s locket lies open on the fountain rim.',
      'The portrait inside is of a young man who is not your father. A folded note: "Midnight, the fountain. Wear the grey cloak. — R."',
      'She was out here keeping secrets of her own, far from the feast table when you drank.',
    ],
    note: 'Lady Vesper was meeting a lover at the fountain during the feast.',
  },
  keys: {
    clue: true,
    title: "The Steward's Keys",
    text: [
      'A ring of iron keys lies dropped on the cellar stair.',
      'The cellar. The pantry. The strongroom where the will is kept. Only one man carries these: Halloway, steward for forty years.',
      'Your father\'s will names him guardian of Vanehold, should no heir survive.',
    ],
    note: "Halloway's keys: cellar, pantry, and the strongroom with the will.",
  },
  echo_willow: {
    echo: true,
    title: 'Two Boys and a Knife',
    text: [
      'Under the willow, laughter from years ago. Two boys are carving letters into the bark: A.C. and T.J.',
      '"When you\'re lord of Vanehold," says the younger one, "will you still let me climb this tree?"',
      '"I\'ll give you the whole tree, Thomas."',
    ],
    note: 'Thomas envied you. He also loved you.',
  },
  echo_gazebo: {
    echo: true,
    title: "Vesper's Confession",
    text: [
      'A woman\'s voice, low and shaking. "I married a man thirty years older because my family was drowning in debt."',
      '"I have kept his house and his name. Let me have one thing that is mine."',
      'She was talking to the moon. Or to you.',
    ],
    note: "Lady Vesper's secret was loneliness, not murder.",
  },
  echo_steward: {
    echo: true,
    title: "The Steward's Prayer",
    text: [
      'An old man whispers by the path, his breath fogging in the cold.',
      '"Forty years I have kept this house. I closed your father\'s eyes. I will not stand by while strangers carry the portraits out the door. Forgive me, old friend."',
    ],
    note: 'Halloway believed he was saving Vanehold.',
  },
  echo_heir: {
    echo: true,
    title: 'Your Own Voice',
    text: [
      'You hear yourself, the night before the feast.',
      '"The debts are too deep, Halloway. I\'ll sell Vanehold in the spring. Find yourself a cottage by the sea. You\'ve earned your rest."',
      'You meant it kindly. He did not hear it that way.',
    ],
    note: 'You told Halloway you would sell the house.',
  },
  echo_carousel: {
    echo: true,
    title: 'Hold On, Both of You',
    text: [
      'The carousel turns, though no one pushes it. Two boys sit on painted horses, and a thin young man runs alongside to catch whichever one falls.',
      '"Hold on, Master Andrew! Master Thomas, both hands!"',
      'It is Halloway, forty years younger, laughing.',
    ],
    note: 'Halloway loved you both, once.',
  },
  // ---- inside the house: relics (journal "The House") and echoes ----
  m_clock: {
    relic: true,
    title: 'The Stopped Clock',
    text: [
      'The grandfather clock stands at twenty to midnight, its pendulum still.',
      'Someone stopped it that night, or it simply gave up. Either way, the house has kept that minute ever since.',
    ],
    note: 'The clock stopped at twenty to midnight: the minute you fell.',
  },
  m_portraits: {
    relic: true,
    title: 'The Family Portraits',
    text: [
      'Lord Vane in his chain of office. Beside him, Lady Vesper, her smile painted on rather than worn.',
      'And two small boys on a grey pony. Brass plates below read A.C. and T.J. Thomas stands one step behind, so that you may look taller.',
    ],
    note: 'In every portrait Thomas stands a step behind you, so that you look taller.',
  },
  m_table: {
    relic: true,
    title: 'The Feast Table',
    text: [
      'The table is still laid. Grey linen, burned-down candles, and at the head your own chair, and the stain where the cup fell.',
      'Eleven places. Eleven goblets. Halloway filled every one himself before the toast, as he had for forty years.',
    ],
    note: 'Halloway filled every goblet himself before the toast.',
  },
  echo_toast: {
    echo: true,
    title: 'The Last Toast',
    text: [
      'Candlelight and voices. Lord Vane\'s chair is draped in black. Lady Vesper\'s seat is empty. So is Thomas\'s.',
      '"To the heir of Vanehold!" cries a cousin you barely knew. You lift your glass. Behind you, Halloway\'s hand shakes on the decanter.',
      '"Forgive me," says an old voice, so softly you almost think you imagined it. The wine tastes of bitter almonds.',
    ],
    note: 'At the toast, Halloway whispered, "Forgive me."',
  },
  m_sideboard: {
    relic: true,
    title: 'The Cellar Decanter',
    text: [
      'A crystal decanter, still a finger deep in dark wine. Its stopper is tied with a cellar tag: "Bin 14 — H."',
      'Bin fourteen. The bottle you were given had not come up from the cellar with the others.',
    ],
    note: 'Your wine came from cellar bin 14, tagged "H."',
  },
  m_debts: {
    relic: true,
    title: 'The Book of Debts',
    text: [
      'A heavy ledger, open to its last page. Page after page of red ink: the mortgage on Vanehold, due at Michaelmas.',
      'At the bottom, in another hand: "Advanced to the estate from the steward\'s own savings. Forty years of wages. — H." He had lent the house everything he owned.',
    ],
    note: 'Halloway lent the Vane debts every penny he had saved.',
  },
  m_atlas: {
    title: 'The Brass Atlas',
    text: [
      'The atlas is crooked on its shelf. When you push it straight, something clicks like a bolt, and an old lock slides open inside the wall.',
      'Across the room, the door to the steward\'s study swings ajar.',
    ],
    again: 'The atlas sits straight on its shelf. The study door stands open.',
  },
  m_desk: {
    title: "The Steward's Desk",
    locked: 'The drawers are locked tight, each with a small brass keyhole. A steward\'s keys would fit.',
    text: [
      'The third key on Halloway\'s ring opens the top drawer. A single sheet lies inside, the ink still dark.',
      '"If this is found, it means I did not have the courage to say it aloud. The young master meant to sell the house I kept for forty years, and I could not bear it. I put the poison in his cup. God forgive me. I shall tell the constable at dawn. — H."',
    ],
    note: "Halloway's unsent confession was in his desk drawer.",
  },
  m_strongroom: {
    title: 'The Strongroom',
    locked: 'A green iron door, set into the wall. The lock is the size of a fist. It wants a key you have not found yet.',
    text: [
      'The second key on the ring turns with a long, tired clunk. Inside, a single document is tied with black ribbon.',
      'Lord Vane\'s will. The house to his sons; and should neither live, "to Halloway, who loved this place as I did, and who may keep it but never own it."',
      'Keep it, but never own it. He could not stop you selling Vanehold. He could only be rid of the one who would.',
    ],
    note: 'The will makes Halloway the house\'s keeper, never its owner.',
  },
  m_cook: {
    title: 'Mrs. Pennywick',
    meet: [
      'Oh! A visitor! Nobody has set foot in my kitchen since the feast. Pennywick, cook, and I am afraid not quite alive.',
      'Halloway came down himself that night for a bottle from bin fourteen. Said the young master was to have the good one, personally. He never fetches wine. Not in forty years.',
      'Eat something, dear. A funeral biscuit. It won\'t do you any harm. You\'re past that.',
    ],
    again: [
      'Another biscuit, dear? They are always warm in here. Don\'t ask me how.',
      'He used to sit on that stool and cry into his tea, you know. Halloway. When the old lord was dying. Nobody saw but me.',
      'Mind the spirits in the dining hall. They have not been themselves since the toast.',
    ],
    note: 'Mrs. Pennywick saw Halloway fetch bin 14 himself.',
  },
  m_pantry: {
    relic: true,
    title: 'The Pantry',
    text: [
      'The shelves of tins are in order, apart from two rings in the dust where something stood.',
      'A neat paper label on the shelf edge: "Rat poison, two tins. Taken by H. and signed for."',
    ],
    note: 'Two tins of rat poison were signed out of the pantry by "H."',
  },
  m_window: {
    relic: true,
    title: 'The Gallery Window',
    text: [
      'From the gallery you can see the whole of the estate: the willow, the fountain, the crypt, and far to the east the fairground, dark and still.',
      'Beyond the fair, where the road runs out, you can just make out a lake, and on a hill above it a small chapel with one window lit. Somewhere out there a carousel waits for a rider.',
    ],
    note: 'From the gallery you saw the Hollow Reach: a lake, and a chapel with a lit window.',
  },
  m_beds: {
    relic: true,
    title: 'Two Small Beds',
    text: [
      'Two beds beneath the window. Carved into the bedposts in a child\'s clumsy hand: A.C. and T.J.',
      'Thomas\'s pillow still holds a hollow where he hugged it. He never slept without a candle. You never told anyone you didn\'t either.',
    ],
    note: 'Two beds, two candles, A.C. and T.J. carved in the posts.',
  },
  m_horse: {
    relic: true,
    title: 'The Rocking Horse',
    text: [
      'A dappled rocking horse with a worn patch on its neck, where two sets of small hands once held on.',
      'Tucked beneath the saddle is a ticket stub: "Vane Harvest Fair. Carousel. Admit one child." And pencilled beside it: "A.C. won the brass ring. T.J. cheated."',
    ],
    note: 'The brass ring on the carousel was a childhood contest: A.C. won, T.J. cheated.',
  },
  echo_father: {
    echo: true,
    title: "A Father's Last Night",
    text: [
      'The chamber is warm again. Lord Vane lies propped on his pillows, thin as paper, Halloway beside him with a basin.',
      '"Keep the boys together," the old man rasps. "Whatever the house costs. Promise me, Halloway."',
      '"Forty years, my lord. I have never broken my word." Neither of them sees you in the doorway.',
    ],
    note: 'Lord Vane made Halloway promise to keep his sons together, whatever the house cost.',
  },
  m_lordbox: {
    relic: true,
    title: "Lord Vane's Writing Box",
    text: [
      'A stack of letters to his sons, never sent.',
      'One begins: "A.C., I am sorry that the house will be yours. It is a heavy gift." Another: "T.J., you will think I loved him better. I loved you both the way a man loves two halves of his own hands."',
    ],
    note: 'Lord Vane wrote to both his sons and sent neither letter.',
  },
  m_vanity: {
    relic: true,
    title: "Lady Vesper's Vanity",
    text: [
      'Pots of powder gone to dust, a hairbrush with silver threads, a hand mirror laid face down.',
      'Under the mirror is a note: "Midnight at the fountain. Wear the grey cloak. I will take you away from here. — R." And beneath it, in her hand: "No. I will tell him tonight that I am staying."',
    ],
    note: 'Vesper meant to end her secret and stay at Vanehold.',
  },
  m_painting: {
    relic: true,
    title: 'The Unfinished Portrait',
    text: [
      'A half-finished portrait of Lady Vesper, painted with a lover\'s attention. In the corner, a tiny signature: "R. Hale."',
      'Robert Hale, the portraitist the family hired for one summer. A grey cloak still hangs over the chair. Somewhere there may be a studio with his name on the door.',
    ],
    note: 'The painter R. Hale was Vesper\'s secret. Look for a studio with his name on it.',
  },
  m_musicbox: {
    title: 'The Music Box',
    locked: n => [
      'A music box, its lid inscribed: "Three rings to wake the waltz." Three ring-shaped slots wait on the lid.',
      `You carry ${n} of 3 brass rings. At the fair, the carousel gives them to riders who reach out far enough.`,
    ],
    text: [
      'You press the brass rings into the slots: one, two, three. The lid springs open and a waltz begins.',
      'The attic fills with candlelight and the sound of two boys dancing badly. A.C. treads on T.J.\'s foot, and neither one stops laughing.',
      '"Promise we\'ll dance at each other\'s weddings." "Promise we\'ll still own a house to dance in."',
      'The music slows, and stops. Your lantern burns a little brighter, and for a moment you feel almost alive.',
    ],
    again: 'The little waltz plays itself once more, and the attic is warm.',
    note: 'The music box waltz: two boys dancing badly in the attic.',
  },
  // ---- the Hollow Reach ----
  mirrors: { title: 'The Hall of Mirrors' },
  patch: { title: 'Old Patch' },
  boathouse: { title: "R. Hale's Boathouse" },
  chapel: {
    echo: true,
    title: 'Beneath the Chapel',
    text: [
      'Candles burn in the crypt that nobody lit. Lord Vane\'s tomb stands open, as though waiting, and a thin man in a grey coat sits on the edge of it.',
      '"Andrew." He does not look surprised. "I asked a steward to keep two boys together and a house standing, and I never once asked what it would cost him. That was my crime, not his alone."',
      '"Whatever you decide at that door, decide it as my son. Not as a ghost."',
    ],
    note: 'Your father said: decide as his son, not as a ghost.',
  },
  bell: { title: 'The Chapel Bell' },
  vista: {
    relic: true,
    title: 'The Hollow Hill',
    text: [
      'From the end of the hill you can see everything. The lake like a dropped mirror, the orchard, the wheel, the carousel, the dark roofs of Vanehold with a handful of windows still lit.',
      'It is smaller than you thought. It was always only a house. You were the heir to a great deal of love and a great deal of debt, and the two had never been told apart.',
    ],
    note: 'From the Hollow Hill, Vanehold looks like what it always was: a house.',
  },
  door: {
    title: 'The Door of Vanehold',
    open: (n, t) => `The great door swings inward on its own, as though the house has been waiting. (${n} of ${t} clues found. You cannot name a killer until you understand.)`,
    ask: 'The lamps burn low. Speak the name, and Vanehold will hear it. Or step inside first.',
  },
};

const SUSPECTS = [
  { id: 'thomas', name: 'Thomas, your brother' },
  { id: 'vesper', name: 'Lady Vesper, your stepmother' },
  { id: 'halloway', name: 'Halloway, the steward' },
];
const CULPRIT = 'halloway';

const ENDINGS = {
  wrong: 'The name falls into silence. The house does not believe you. Think on what you have found.',
  confront: knows => [
    'In the steward\'s study, Halloway looks up from your father\'s will and sees you in the black glass of the window. The pen falls from his hand.',
    knows
      ? '"You were going to sell her," he whispers. "Forty years. I could not let them take her apart, stone by stone."'
      : '"Master Andrew," he whispers. "I did it for the house. Only for the house."',
    'He does not run. He waits to learn what you will do.',
  ],
  justice: {
    title: 'Justice',
    text: [
      'One by one, the lamps of Vanehold gutter out. Every mirror in the house fogs with your name.',
      'By dawn Halloway is shaking at the constable\'s door with the empty poison tins in his hands.',
      'The last leaf falls, and you go with it, light at last.',
    ],
  },
  mercy: {
    title: 'Mercy',
    text: [
      'You do not rattle the windows. You only stand at the foot of his bed, the way you did as a boy after a nightmare.',
      'Halloway weeps. At dawn he walks to the village by himself and tells the constable everything. Then he asks to see Thomas.',
      'Vanehold passes to your brother, who keeps the willow and the old servants both. The last leaf falls, and you go with it, lighter than you expected.',
    ],
  },
  understood: 'In the end you understood all of them: the brother, the stepmother, the steward. Even yourself.',
};

// Side quest: a rattling robot skeleton in a blue helmet, resting in the Vane mausoleum.
const BONES = {
  name: 'Blue Bones',
  meet: [
    'Rattle-rattle! A ghost! Easy there. I\'m not here to bust you.',
    'Name\'s Blue Bones. Long ago a good doctor built me to stop a mad scientist\'s robots. I won, mostly. Then my power ran out, and I ended up in here, keeping the Vanes company.',
    'When I fell, my three Energy Cells rolled out of my chest. Without them I can\'t even lift my buster.',
    'One is up on the tallest headstone in the graveyard. One floats above the fountain. The shades dragged the last one off toward the cellar. Jump, glide, and bring them back?',
  ],
  waiting: n => `${n} of 3 Energy Cells. My knees are already rattling less! Keep looking: the headstone, the fountain, and the shades by the cellar.`,
  done: [
    'Click, whirr. FULL POWER! Look at that, my eyes are blue again.',
    'Here, take this. A Bone Buster, refitted for a ghostly arm. Press F to fire. Hold F and let go for a charged shot. Those shades won\'t know what hit them.',
    'One more thing. The night of the feast I saw a man come down the cellar steps with a ring of keys and two tins. He never noticed me. Nobody ever notices me.',
  ],
  after: [
    'Go get \'em, ghost!',
    'Three shots on screen at once. That\'s the rule. Don\'t ask me why.',
    'If you see a mad scientist, you didn\'t see me.',
  ],
  already: 'Wait. Is that... you\'re already carrying all three? Rattle me sideways! Hold still...',
  cell: 'A humming capsule, warm to the touch. It feels like it belongs to someone.',
  ending: 'In the mausoleum, a skeleton in a blue helmet raises his buster in salute.',
};

// The Vane Harvest Fair, past the manor's east wall.
const FAIR = {
  barker: 'Mister Lamb',
  meet: [
    'Step right up, step right up! Oh. A customer. It has been a long time.',
    'Lamb\'s the name. I ran the Vane Harvest Fair, back when your father paid for the lights. The rides have rusted and the prizes are dust, but the games still play, if you have a steady hand.',
    'Win at all five booths and I will punch you a golden ticket for the wheel.',
  ],
  progress: n => `${n} of 5 prizes. Keep at it! The ducks are slower than they look, and nobody wins the star on the first go.`,
  ticket: [
    'Five for five! I have not seen shooting like that since your father was a boy.',
    'Here, a golden ticket. The wheel has been waiting thirty years for a rider. Climb aboard at the boarding gate.',
  ],
  after: 'Come back any time. We never close.',
  wheelClosed: 'The great wheel creaks in the wind. A sign hangs from the gate: RIDE CLOSED. TICKETS FROM MR. LAMB.',
  wheelRide: [
    'The wheel lurches and climbs. Below you the fair shrinks to a ring of guttering bulbs.',
    'From the top you can see all of Vanehold at once: the graveyard, the willow, the fountain, the lit windows of the house. It looks small from up here, and very dear.',
    'When the gondola comes back down, your lantern burns brighter than before.',
  ],
  wheelAgain: 'The wheel turns slowly, lit for you alone.',
  ending: 'Past the manor, the great wheel turns once more, every bulb alight, for no one at all.',
  prizes: {
    game_duck: { name: 'a rubber duck with one eye', title: 'Rubber Duck', note: 'Thomas won it for you when you were nine. He soaked both his sleeves doing it.' },
    game_balloon: { name: 'a faded silk ribbon', title: 'Silk Ribbon', note: 'Lady Vesper pinned it to your coat on her first day at Vanehold. You never thanked her.' },
    game_rings: { name: 'a bottle with a note inside', title: 'Message in a Bottle', note: 'In your father\'s hand: "For my boys, when they are grown. The house is only stones. Keep each other."' },
    game_cans: { name: 'a tin soldier on a carved stand', title: 'Tin Soldier', note: 'Halloway carved the stand the winter you had the fever, and sat up with you every night.' },
    game_star: { name: 'a gold star pin', title: 'Gold Star', note: 'Mister Lamb pinned it on you once and called you a crack shot. You had missed every BB.' },
  },
};

// The Hall of Mirrors: three visions, then your own face.
const MIRRORS = {
  intro: [
    'The Hall of Mirrors was the Vane Fair\'s most loved attraction. Inside, the passage twists between warped glass and a hundred pale reflections of nothing.',
    'Three mirrors stand apart from the rest, and each one is looking back at you.',
  ],
  menu: 'Which mirror will you look into?',
  views: {
    was: {
      label: 'The mirror of what was',
      text: [
        'You see yourself alive, flushed with wine and certain of tomorrow, at the head of the feast table.',
        'The reflection raises a glass to you, then sets it down untouched and shakes its head. "I should have asked why the steward was crying," it says.',
      ],
    },
    thomas: {
      label: 'The mirror of the road',
      text: [
        'Thomas, on the road to Carrow, rain running down his collar. The coach is crooked in a ditch, a broken wheel in his hands.',
        'He is trying to light a lantern in the wet. "Hold on, Andrew," he mutters. "I\'m coming. Don\'t you dare start without me."',
      ],
    },
    is: {
      label: 'The mirror of what is',
      text: [
        'A pale ghost in a hood, lantern swinging. Behind it in the glass, thirty more ghosts, every one holding a lantern, every one a little older.',
        '"You are not the first Vane to walk here," says a voice from the glass. "Only the first to be asked."',
      ],
    },
  },
  leave: 'Step away from the mirrors.',
  done: [
    'The mirrors fog, and clear. In the last of them, you see your own face, unhooded, for the first time since the feast.',
    'You look tired, and kind. It is a face you could forgive.',
  ],
  title: 'The Thousand Faces',
  note: 'In the Hall of Mirrors you looked at your own face and did not look away.',
  ending: 'In the Hall of Mirrors, a thousand pale faces smile at once, and then none.',
};

// The cider orchard's scarecrow.
const PATCH = {
  name: 'Old Patch',
  meet: [
    'Crackle-crick. Pay the crows no mind. They are the only ones who ever listened.',
    'Old Patch, scarecrow of the Vane orchard. Forty harvests I stood here, and one night something came out of the house with a lantern and asked me the road. It had no shadow. That was the night you died, I think.',
    'The wind has scattered my Moon Apples, and they have gone silver in the moonlight. Six of them. Bring them back and I will give you the boathouse key, which I have kept in my coat since the painter left.',
  ],
  waiting: n => `${n} of 6 Moon Apples. The high ones want a jump from the hay wagon, and a glide from the cider press.`,
  done: [
    'Six! And each one still humming. Here, the boathouse key. Mister Hale gave it to me to hold until "the lady" came for it. She never did.',
    'Tell him the crows still ask after him.',
  ],
  after: 'Mind the shades by the wagon. They like apples too.',
  apple: n => `Moon Apple ${n} / 6`,
};

// The boathouse studio and the painter.
const HALE = {
  locked: [
    'The boathouse door is padlocked. A card in the window reads: "R. HALE, PORTRAITS. KEY WITH THE SCARECROW."',
  ],
  scene: [
    'The padlock opens to Old Patch\'s key. Inside: easels, jars of dried brushes, the smell of linseed oil and lake water.',
    'A man in a paint-stiff smock sits on an upturned boat, facing the water. He turns when you enter. He has been waiting a long time.',
    '"Robert Hale. Portraits." He looks at your hooded shape without surprise. "You will be the young master. I am sorry. I painted your stepmother for a summer and I loved her, and on the night of the feast she told me she was staying."',
    '"I was on the pier at midnight when I saw him. The steward, coming up from the cellar steps with a ring of keys, burying two empty tins under the roses. I did not understand until morning. I said nothing. A painter does not accuse a steward."',
    'He gives you a sketch, drawn that night by lantern light: an old man bent over a spade, weeping.',
  ],
  again: 'Robert Hale paints the lake from memory, and does not turn around. "She was staying," he says to the water. "It is enough."',
  title: "The Painter's Sketch",
  note: 'Robert Hale saw Halloway bury two empty poison tins under the roses.',
};

// Lamplight travel
const LAMPLIGHT = {
  intro: 'The gas flame leans toward you, and far across Vanehold other flames lean back. Which lamp will you walk to?',
  regions: [
    { label: 'The grounds, graveyard to the manor', from: 0, to: 5000 },
    { label: 'The fair', from: 5000, to: 8450 },
    { label: 'The Hollow Reach', from: 8450, to: 99999 },
  ],
  stay: 'Stay here.',
  back: 'Never mind.',
};

// The chapel bell
const BELL = {
  toll: [
    'You take the bell rope in both ghostly hands and pull.',
    'The sound rolls out across the lake and the orchard and the dark fairground, and every lamp in Vanehold leans toward it. Far away, you think you hear a carousel answer.',
  ],
  again: 'The bell tolls once more, low and kind, and all the lamps lean.',
  ending: 'On the hill, the chapel bell rings once for the heir of Vanehold, and everyone who hears it forgives a little.',
};

// small additions to the ending, for what you found in the house and beyond
const HOUSE_ENDINGS = {
  musicbox: 'Up in the attic, a music box plays its waltz for two brothers who are not there.',
  robert: 'On the lake, a painter finally finishes a portrait of a woman who stayed.',
  father: 'In the lamplight at the door, a thin man in a grey coat nods once, as a father does.',
};

// journal entries for finds that have their own scenes
Object.assign(STORY.m_desk, { relic: true });
Object.assign(STORY.m_strongroom, { relic: true });
Object.assign(STORY.m_cook, { relic: true, title: 'Mrs. Pennywick' });
Object.assign(STORY.m_musicbox, { relic: true });
Object.assign(STORY.mirrors, { relic: true, title: MIRRORS.title, note: MIRRORS.note });
Object.assign(STORY.boathouse, { relic: true, title: HALE.title, note: HALE.note });
