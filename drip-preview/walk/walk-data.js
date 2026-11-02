/* Récit de la visite au scroll, sur les photographies du café.
   Les clés pro-* sont conservées pour compatibilité ; elles pointent vers les originaux (docs/ORIGINAL-PHOTOS.json).
   Chaque photo remplit l'écran : un portrait se parcourt verticalement, un paysage horizontalement.
   shot : dérivé photo, ou { side, full } (ordinateur / mobile).
   cam  : étapes [fx, fy, zoom] parcourues pendant le plan ; fx/fy = point de la photo (0–1) placé au centre
          de l'écran (sur ordinateur un portrait n'utilise que fy, sur mobile un paysage n'utilise que fx).
   cut  : passage depuis le plan précédent.
          portal   : passage par une porte, lié au défilement. from = la porte dans l'image précédente,
                     to = la même porte dans l'image suivante (pixels de la photo originale).
          pan      : pivot latéral minuté (dir 1 = vers la droite).
          turn     : demi-tour minuté.
          dissolve : fondu minuté (défaut).
   len  : longueur de défilement du plan, en hauteurs d'écran ×100. */
window.DRIP_WALK = {
  // Reflet sur la vitre et lueur des ampoules réelles (pixels de l'original 1000188514.jpg).
  fx: [
    { source: '1000188514.jpg', items: [
      { kind: 'glow', rect: [825, 560, 355, 90] },
      { kind: 'glow', rect: [1265, 600, 50, 120] },
      { kind: 'glass', rect: [650, 540, 580, 250] }
    ] }
  ],

  beats: [
    { id: 'arrive', place: 'King William Street', len: 160,
      shot: { side: 'pro-street', full: 'pro-street-m' },
      cam: { side: [[0.5, 0.5, 1], [0.62, 0.5, 1.06]], full: [[0.12, 0.5, 1], [0.64, 0.5, 1]] },
      alt: 'Drip Expresso from the footpath: the maroon sign, a gold mural on a brown wall, the big window, the mustard door on the right and small tables among mustard planter boxes.',
      caption: { kind: 'hero', kicker: 'Bayswater · opposite the station', title: 'Drip Expresso', hint: 'Scroll to come in' } },

    { id: 'door', place: 'The door', len: 190,
      shot: 'pro-door',
      cut: { type: 'portal', from: [1250, 600, 175, 390], to: [316, 413, 607, 1393] },
      cam: [[0.55, 0.48, 1], [0.52, 0.64, 1.04]],
      alt: 'The open door in its mustard frame, looking into the café: hanging lamps, chairs and a long narrow room.',
      caption: { kind: 'word', title: 'Come in.' } },

    { id: 'inside', place: 'Inside', len: 180,
      shot: 'pro-threshold',
      cut: { type: 'portal', from: [316, 413, 607, 1393], to: [135, 200, 700, 1840] },
      cam: [[0.42, 0.54, 1], [0.5, 0.28, 1.04]],
      alt: 'Just inside: rope lights and a lantern under a ceiling fan, the counter on the left, the tables and banquette on the right.' },

    { id: 'window', place: 'By the window', len: 130,
      shot: { side: 'pro-window', full: 'pro-cabinet' },
      cut: { type: 'dissolve' },
      cam: { side: [[0.5, 0.28, 1], [0.5, 0.64, 1.03]], full: [[0.5, 0.5, 1], [0.48, 0.5, 1.04]] },
      alt: 'The front corner by the window: a chipped white cabinet of teapots, crates on the wall, a black ceiling fan and small tables.' },

    { id: 'counter', place: 'The blue counter', len: 110,
      shot: { side: 'pro-counter', full: 'pro-counter-m' },
      cut: { type: 'pan', dir: 1 },
      cam: { side: [[0.42, 0.5, 1], [0.5, 0.5, 1.02]], full: [[0.5, 0.5, 1], [0.45, 0.5, 1.03]] },
      alt: 'The blue counter, worn back to the wood: a brass basin with its own tap, an old copper extinguisher, cookbooks and the coffee machine behind.' },

    { id: 'menu', place: 'The blue counter', len: 170,
      shot: { side: 'pro-counter', full: 'pro-counter-m' },
      cam: { side: [[0.5, 0.5, 1.02], [0.56, 0.5, 1.04]], full: [[0.45, 0.5, 1.03], [0.4, 0.5, 1.05]] },
      alt: 'The blue counter with its brass basin.',
      caption: { kind: 'menu', kicker: 'At the counter', title: 'Vietnamese iced coffee' } },

    { id: 'cakes', place: 'The cake cabinet', len: 150,
      shot: 'pro-cakes',
      cut: { type: 'dissolve' },
      cam: [[0.55, 0.32, 1], [0.5, 0.62, 1.03]],
      alt: 'The glass cake cabinet on the counter, with the dark boards below.',
      caption: { kind: 'offer', kicker: 'With your coffee', title: 'A toastie and a coffee' } },

    { id: 'sconce', place: 'The banquette wall', len: 110,
      shot: 'pro-sconce',
      cut: { type: 'dissolve' },
      cam: [[0.5, 0.4, 1], [0.5, 0.56, 1.04]],
      alt: 'A wall lamp made of pipes and gears, with a small clock in the largest gear and three warm bulbs.' },

    { id: 'room', place: 'The long room', len: 160,
      shot: 'pro-room',
      cut: { type: 'dissolve' },
      cam: [[0.5, 0.1, 1], [0.49, 0.47, 1.04]],
      alt: 'The long room: a lantern under the ceiling fan, rope lights on the left, the banquette on the right and an open door at the far end.' },

    { id: 'back', place: 'The back door', len: 190,
      shot: 'pro-back',
      cut: { type: 'portal', from: [490, 790, 130, 320], to: [425, 790, 335, 765] },
      cam: [[0.51, 0.53, 1], [0.5, 0.22, 1.02], [0.51, 0.53, 1]],
      alt: 'At the back of the room: a clock in a painted cloud, a large painted figure, and the open door to a small covered nook.' },

    { id: 'nook', place: 'The back nook', len: 240,
      shot: 'pro-nook',
      // Le cliché suivant est déjà au seuil, sans cadre complet correspondant : pas de faux alignement de porte.
      cut: { type: 'dissolve' },
      cam: [[0.55, 0.53, 1], [0.52, 0.42, 1.03]],
      alt: 'The small covered nook out back: a reed ceiling, red brick painted with a round window onto the sea, a wooden table, a chair and a stove sprayed in every colour.',
      caption: { kind: 'pause', title: 'Stay a while.', text: 'A small covered corner out back.' } },

    { id: 'choose', place: 'Looking back toward the street', len: 160,
      shot: 'pro-lookback',
      cut: { type: 'turn', dir: -1 },
      cam: [[0.5, 0.62, 1.03], [0.5, 0.46, 1]],
      alt: 'The long room seen from the back: the banquette on the left, the counter on the right, daylight from the street at the far end.',
      caption: { kind: 'choose', kicker: 'Turn around', title: 'Where will you sit?' } },

    { id: 'visit', place: 'Drip Expresso', len: 150,
      shot: { side: 'pro-street', full: 'pro-street-m' },
      cut: { type: 'dissolve' },
      cam: { side: [[0.56, 0.5, 1.02], [0.5, 0.5, 1]], full: [[0.62, 0.5, 1], [0.6, 0.5, 1]] },
      alt: 'The shopfront of Drip Expresso: the gold mural and the mustard door.',
      caption: { kind: 'visit', kicker: 'Drip Expresso', title: 'See you soon.' } }
  ],

  // Coins réels proposés à la fin : la dernière scène prend la photo du coin choisi.
  corners: {
    window: { label: 'By the window', line: 'By the window, then.', shot: { side: 'pro-window', full: 'pro-cabinet' },
      cam: { side: [[0.5, 0.55, 1], [0.5, 0.6, 1.02]], full: [[0.5, 0.5, 1], [0.5, 0.5, 1.02]] },
      alt: 'The window corner with its white cabinet of teapots.' },
    banquette: { label: 'On the long banquette', line: 'On the long banquette, then.', shot: 'pro-room',
      cam: [[0.75, 0.68, 1.04], [0.75, 0.66, 1.06]],
      alt: 'The long banquette with patterned cushions and wooden tables.' },
    nook: { label: 'In the back nook', line: 'In the back nook, then.', shot: 'pro-nook',
      cam: [[0.55, 0.55, 1], [0.55, 0.58, 1.02]],
      alt: 'The back nook under its reed ceiling, with the painted window onto the sea.' },
    awning: { label: 'Under the awning', line: 'Under the awning, then.', shot: 'pro-awning',
      cam: [[0.5, 0.6, 1], [0.5, 0.62, 1.02]],
      alt: 'The tables under the awning outside, beside the gold mural.' }
  }
};
