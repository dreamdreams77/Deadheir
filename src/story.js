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
  right: [
    'One by one, the lamps of Vanehold gutter out.',
    'In the steward\'s study, Halloway looks up from your father\'s will and sees you in the black glass of the window. The pen falls from his hand.',
    'By dawn he has confessed to the constable. The last leaf falls, and you go with it, light at last.',
  ],
  wrong: 'The name falls into silence. The house does not believe you. Think on what you have found.',
};
