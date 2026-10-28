'use strict';
const STORY = {
  grave: {
    title: 'Here Lies Aldric Vane',
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
    title: "Edmund's Letter",
    text: [
      'A letter is pinned under a stone on the gazebo rail. It is in your brother\'s hand.',
      '"Aldric — the coach has thrown a wheel at Carrow. I shan\'t reach Vanehold until the morning after the feast. Save me a glass. — E."',
      'Edmund always wanted the title. But he was forty miles away that night.',
    ],
    note: 'Edmund was stranded at Carrow the night of the feast.',
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
      'Under the willow, laughter from years ago. Two boys are carving letters into the bark: A.V. and E.V.',
      '"When you\'re lord of Vanehold," says the younger one, "will you still let me climb this tree?"',
      '"I\'ll give you the whole tree, Edmund."',
    ],
    note: 'Edmund envied you. He also loved you.',
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
  door: {
    title: 'The Door of Vanehold',
    locked: 'The great door does not open for you. The house knows you do not yet understand.',
    ask: 'The lamps burn low. Speak the name, and Vanehold will hear it.',
  },
};

const SUSPECTS = [
  { id: 'edmund', name: 'Edmund, your brother' },
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
      : '"Master Aldric," he whispers. "I did it for the house. Only for the house."',
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
      'Halloway weeps. At dawn he walks to the village by himself and tells the constable everything. Then he asks to see Edmund.',
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
