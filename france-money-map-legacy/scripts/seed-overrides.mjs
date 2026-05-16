export const extraSources = [
  {
    id: "campusfer-ch1cb1-percheur",
    title: "CampusFer — CH1CB1 / KH1KB1 initiale",
    url: "https://www.campusfer.com/formation/travaux-catenaires-percheur-catenaire-ch1-cb1-initiale/",
    note: "Prérequis TES M et aptitude médicale/psychologique ; 5 jours / 35 h ; gestes métier percheur 1500 V / 25 kV.",
    kind: "public-source",
    confidenceLevel: "high",
  },
  {
    id: "emploi-sncf-monteur-cables-aeriens",
    title: "Emploi SNCF — Monteur ou monteuse de câbles électriques aériens",
    url: "https://emploi.sncf.com/nos-metiers/maintenance-mecanique/monteur-cables-electriques-aeriens",
    note: "Horaires décalés, nuits, week-ends et jours fériés ; titre IV Opérateur caténaire à la prise de poste.",
    kind: "public-source",
    confidenceLevel: "high",
  },
  {
    id: "france-travail-offre-monteur-catenaire-204xctb",
    title: "France Travail — Offre monteur caténaire (204XCTB)",
    url: "https://candidat.francetravail.fr/offres/recherche/detail/204XCTB",
    note: "Travaux en hauteur ; horaires décalés de nuit ou week-end possibles selon les chantiers.",
    kind: "public-source",
    confidenceLevel: "high",
  },
  {
    id: "france-travail-pack-secufer-tesm-c0-lam-s9-ch1cb1",
    title: "France Travail — Pack sécurité ferroviaire + CH1 CB1",
    url: "https://monemploienidf.francetravail.fr/je-me-forme/formation/securite-ferroviaire-secufer-tes-m-c0-risques-catenaires-tsae-op-agent-lam-tsae-op-agent-prestataire-s9a1-tsae-op-ch1-cb1-7b8209f0",
    note: "Pack couvrant SECUFER, TES M, C0 risques caténaires, LAM, S9 et CH1-CB1 avec objectifs détaillés.",
    kind: "public-source",
    confidenceLevel: "high",
  },
  {
    id: "omnifer-monteur-catenaires-initiale",
    title: "Omnifer — Monteur caténaires initiale",
    url: "https://www.omnifer.fr/action/monteur-catenaires-initiale/",
    note: "Prérequis SECUFER, C0, CH1CB1, ASP et travail en hauteur ; 40 jours / 280 h ; délai d'accès 8 jours à 3 mois.",
    kind: "public-source",
    confidenceLevel: "high",
  },
  {
    id: "omnifer-tsae-ch1cb1-initiale",
    title: "Omnifer — TSAE CH1CB1 initiale",
    url: "https://www.omnifer.fr/action/tsae-ch1cb1-initiale/",
    note: "Prérequis 18 ans, français B1, SECUFER AAE, C0 et ASP ; 5 jours / 35 h ; perchage et connexions ligne/rail.",
    kind: "public-source",
    confidenceLevel: "high",
  },
  {
    id: "sferis-ch1cb1",
    title: "Sferis — CH1 CB1",
    url: "https://www.sferis.fr/wp-content/uploads/2025/02/01_CH1-CB1.pdf",
    note: "B1, aptitudes médicales/psychologiques, SECUFER, C0 et TES M requis ; durée 5 jours / 35 h.",
    kind: "public-source",
    confidenceLevel: "high",
  },
  {
    id: "sncf-reseau-operateur-catenaire",
    title: "SNCF Réseau — Titre opérateur caténaire",
    url: "https://www.sncf-reseau.com/medias-publics/2024-06/fiche_titre_catenaire_-_operateur_catenaire_-_decembre_2023_1_.pdf?VersionId=3kNvlFuSTEeyeZWrfMutXSKkoig_4eDi",
    note: "Formation certifiante en 14 mois en moyenne ; TES M, TES C, TES F et TSAE Agent LAM nécessaires pour exercer.",
    kind: "public-source",
    confidenceLevel: "high",
  },
];

export const manualTickets = [
  {
    id: "secuferAAE",
    name: "SECUFER / AAE",
    type: "Accès emprises ferroviaires",
    sectorLinks: ["ferro"],
    branchLinks: [
      "Sécurité chantier ferro",
      "Métiers du train / trains travaux",
      "Voie",
      "Caténaire / ITE",
      "Signalisation",
      "Télécoms / courants faibles ferro",
      "Sous-stations / EALE / alimentation",
      "Encadrement travaux ferro",
    ],
    duration: "1 jour (4 à 7 h) + délai dossier / autorisation",
    costRange: "souvent 150 à 170 € TTC en solo ; souvent porté par employeur",
    prerequisite:
      "Avoir un projet réel en emprise ferroviaire et être capable de comprendre les consignes de sécurité.",
    opensLaneIds: [
      "ferro_sec",
      "ferro_attx",
      "ferro_voie",
      "ferro_cat",
      "ferro_sig",
      "ferro_tel",
      "ferro_eale",
      "ferro_ct",
    ],
    notes:
      "Socle d'accès aux emprises ferroviaires avant TES M, C0, CH1-CB1 ou d'autres habilitations métier.",
    confidenceLevel: "high",
    providerExamples: [
      "organismes SECUFER",
      "employeur ferro",
      "France Travail via pack ciblé",
    ],
    summary:
      "Premier verrou d'entrée: tu apprends le risque ferroviaire et tu sécurises ton accès aux emprises.",
    accessMode:
      "Très souvent sponsorisé par l'employeur ; faisable en solo mais rarement suffisant seul pour décrocher un chantier.",
    jobReadiness:
      "Ne donne pas un job à lui seul. Il prépare les vrais tickets chantier qui viennent juste après.",
    validity: "AAE et pratiques à confirmer ensuite avec l'employeur / le donneur d'ordre.",
    accessChecks: [
      "Comprendre et suivre des consignes de sécurité strictes",
      "Accepter l'environnement voie / emprise",
      "Être disponible pour compléter vite avec TES M ou autre ticket métier",
    ],
    capacityChecks: [
      "Lecture / compréhension du français opérationnelle",
      "Discipline procédure",
      "Concentration en environnement risqué",
    ],
    modules: [
      "repérage et déplacement en emprise",
      "risques ferroviaires",
      "cadre réglementaire SECUFER / AAE",
      "risque électrique de base en emprise",
    ],
    doesNotOpen: [
      "Ne te rend pas ASP, LAM, S9 ou CH1-CB1",
      "Ne t'autorise pas à sécuriser seul un chantier",
    ],
    nextTicketIds: ["asp", "05001", "c0cat"],
    targetRoles: [
      "socle d'entrée chantier ferro",
      "base caténaire / voie / sécurité",
    ],
    sourceIds: ["france-travail-pack-secufer-tesm-c0-lam-s9-ch1cb1"],
  },
  {
    id: "c0cat",
    name: "C0 risques caténaires",
    type: "Caténaire / risque électrique",
    sectorLinks: ["ferro"],
    branchLinks: [
      "Caténaire / ITE",
      "Sous-stations / EALE / alimentation",
      "Télécoms / courants faibles ferro",
    ],
    duration: "1 à 2 jours",
    costRange: "souvent employeur / organisme ferro",
    prerequisite:
      "SECUFER / AAE puis contexte chantier électrique ferroviaire à viser.",
    opensLaneIds: ["ferro_cat", "ferro_eale", "ferro_tel"],
    notes:
      "Socle risque électrique caténaire avant CH1-CB1 ou d'autres niveaux d'habilitation.",
    confidenceLevel: "high",
    providerExamples: ["Omnifer", "Sferis", "centres caténaires"],
    summary:
      "Bloc passerelle vers la caténaire: tu apprends le risque ITE avant de passer sur les gestes de protection électrique.",
    accessMode:
      "Souvent pris dans un pack employeur ou centre ferro ; rarement vendu comme solution emploi autonome.",
    jobReadiness:
      "Utile pour entrer sur la voie caténaire, mais insuffisant seul pour percher ou monter une installation.",
    validity: "Recyclage et maintien selon politique employeur et référentiel appliqué.",
    accessChecks: [
      "Avoir déjà le socle emprise ferroviaire",
      "Comprendre le risque électrique ferroviaire",
      "Viser une voie caténaire / ITE réelle",
    ],
    capacityChecks: [
      "Rigueur sécurité",
      "Capacité à suivre un chargé de travaux",
      "Repérage terrain / documents",
    ],
    modules: [
      "risques électriques caténaires",
      "zones d'encadrement",
      "outillage de sécurité électrique",
      "repérage des arrivées de courant",
    ],
    doesNotOpen: [
      "Ne permet pas de percher sans CH1-CB1",
      "Ne remplace pas un vrai parcours monteur caténaire",
    ],
    nextTicketIds: ["ch1cb1", "monteurCatInitial"],
    targetRoles: [
      "préparation aide monteur caténaire",
      "préparation percheur",
    ],
    sourceIds: ["omnifer-tsae-ch1cb1-initiale", "sferis-ch1cb1"],
  },
  {
    id: "ch1cb1",
    name: "CH1 / CB1 percheur caténaire",
    type: "Protection électrique caténaire",
    sectorLinks: ["ferro"],
    branchLinks: ["Caténaire / ITE"],
    duration: "5 jours / 35 h",
    costRange: "souvent sponsorisé ; tarifs inter/intra sur devis ou plusieurs k€ HT en intra",
    prerequisite:
      "18 ans, B1, aptitudes médicales / psychologiques, SECUFER / AAE, C0 et ASP / TES M selon organisme.",
    opensLaneIds: ["ferro_cat"],
    notes:
      "Ticket métier clef pour le perchage: pose de CLR / CLRS / CV sous ordre d'un CH3-CB3.",
    confidenceLevel: "high",
    providerExamples: ["CampusFer", "Omnifer", "Sferis"],
    summary:
      "C'est le ticket ferro qui te fait réellement entrer sur la protection électrique caténaire côté exécutant / percheur.",
    accessMode:
      "Très souvent obtenu via un employeur ou un centre ciblé. En solo, il faut déjà avoir aligné les prérequis sécurité et être crédible pour une embauche derrière.",
    jobReadiness:
      "Rend éligible à un premier poste aide monteur / percheur sous supervision. Ne fait pas de toi un monteur autonome.",
    validity: "Recyclages et maintien d'habilitation à prévoir selon pratique et employeur.",
    accessChecks: [
      "18 ans minimum",
      "Français B1 lu, écrit, parlé",
      "SECUFER / AAE validé",
      "C0 caténaire validé",
      "ASP / TES M validé",
    ],
    capacityChecks: [
      "Aptitude médicale et psychologique rail",
      "Exécution stricte sous ordre d'un CH3-CB3",
      "Extérieur, nuit, procédures, matériel de sécurité électrique",
    ],
    modules: [
      "principes de base d'une installation caténaire",
      "outillage et EPI de sécurité électrique",
      "pose de connexions ligne / rail et d'équipotentialité",
      "lecture de documentation et des plans utiles",
      "repérage terrain, schémas et interlocuteurs chantier",
    ],
    doesNotOpen: [
      "Ne remplace pas le métier complet de monteur caténaire",
      "Ne donne pas le niveau CH3-CB3 encadrement",
      "N'ouvre pas la signalisation ou les sous-stations par magie",
    ],
    nextTicketIds: ["travailHauteur", "monteurCatInitial", "operateurCat"],
    targetRoles: [
      "percheur caténaire",
      "aide monteur caténaire",
      "agent de protection électrique caténaire",
    ],
    sourceIds: [
      "campusfer-ch1cb1-percheur",
      "omnifer-tsae-ch1cb1-initiale",
      "sferis-ch1cb1",
    ],
  },
  {
    id: "travailHauteur",
    name: "Travail en hauteur / harnais",
    type: "Sécurité terrain",
    sectorLinks: ["ferro", "renewables", "special"],
    branchLinks: [
      "Caténaire / ITE",
      "Maintenance éolienne",
      "Travaux sur cordes",
      "Levage / rigging / grues mobiles",
    ],
    duration: "1 à 2 jours",
    costRange: "organisme HSE / employeur",
    prerequisite:
      "Absence de contre-indication au travail en hauteur et besoin terrain réel.",
    opensLaneIds: ["ferro_cat", "ren_eol", "spec_rope", "spec_levage"],
    notes:
      "Ticket sécurité complémentaire très fréquent avant les postes hauteur et nacelle.",
    confidenceLevel: "high",
    providerExamples: ["organismes HSE", "employeur", "centre technique"],
    summary:
      "Ce n'est pas le métier, mais sans ça beaucoup de postes terrain hauteur se ferment immédiatement.",
    accessMode:
      "Facile à passer, souvent ajouté par l'employeur ou le centre technique dans un parcours plus large.",
    jobReadiness:
      "Renforce la crédibilité terrain, mais ne suffit pas sans ticket métier principal.",
    validity: "Recyclages fréquents selon site et employeur.",
    accessChecks: [
      "Absence de vertige bloquant",
      "Aptitude médicale si demandée",
      "Acceptation des EPI et procédures antichute",
    ],
    capacityChecks: [
      "Travail en hauteur",
      "Respect des ancrages et procédures",
      "Extérieur / météo variable",
    ],
    modules: [
      "harnais et antichute",
      "ancrages / lignes de vie",
      "déplacement sécurisé en hauteur",
      "secours de base",
    ],
    doesNotOpen: [
      "Ne remplace pas CH1-CB1, GWO ou un ticket corde",
      "Ne valide pas une compétence métier technique",
    ],
    nextTicketIds: ["ch1cb1", "gwo", "corde1"],
    targetRoles: [
      "complément hauteur caténaire",
      "complément éolien",
      "complément cordes",
    ],
    sourceIds: ["omnifer-monteur-catenaires-initiale"],
  },
  {
    id: "monteurCatInitial",
    name: "Monteur caténaires initiale",
    type: "Formation métier caténaire",
    sectorLinks: ["ferro"],
    branchLinks: ["Caténaire / ITE"],
    duration: "40 jours / 280 h",
    costRange: "souvent employeur ou dispositif lourd ; délai d'accès 8 jours à 3 mois",
    prerequisite:
      "18 ans, français B1, SECUFER, C0, CH1-CB1, ASP et travail en hauteur.",
    opensLaneIds: ["ferro_cat"],
    notes:
      "Formation complète de chantier caténaire pour passer du simple geste de protection au montage / réglage réel.",
    confidenceLevel: "high",
    providerExamples: ["Omnifer", "centres caténaires"],
    summary:
      "La vraie route métier pour arrêter d'être juste 'ticketé' et commencer à devenir monteur caténaire exploitable.",
    accessMode:
      "Plus lourd, plus long, plus crédible. Typiquement financé par employeur, alternance ou dispositif de reconversion sérieux.",
    jobReadiness:
      "Ouvre une meilleure employabilité que CH1-CB1 seul et accélère la progression vers monteur confirmé / chef d'équipe.",
    validity: "Montée en compétence métier plus que simple habilitation ; maintien par pratique.",
    accessChecks: [
      "Dossier complet et prérequis sécurité déjà validés",
      "Disponibilité plusieurs semaines",
      "Projet métier caténaire assumé",
    ],
    capacityChecks: [
      "Travail en hauteur",
      "Travail extérieur et de nuit possible",
      "Endurance terrain / équipe chantier",
    ],
    modules: [
      "fondamentaux sécurité ferroviaire",
      "fondamentaux caténaire",
      "mise en oeuvre des composants",
      "réglage / montage",
      "mise en pratique sur plateforme pédagogique",
    ],
    doesNotOpen: [
      "Ne remplace pas l'expérience chantier réelle",
      "Ne donne pas automatiquement l'encadrement travaux",
    ],
    nextTicketIds: ["operateurCat"],
    targetRoles: [
      "monteur caténaire junior",
      "aide monteur confirmé",
      "base vers chef d'équipe caténaire",
    ],
    sourceIds: ["omnifer-monteur-catenaires-initiale"],
  },
  {
    id: "operateurCat",
    name: "Titre opérateur caténaire",
    type: "Titre métier caténaire",
    sectorLinks: ["ferro"],
    branchLinks: ["Caténaire / ITE"],
    duration: "14 mois en moyenne",
    costRange: "souvent voie interne / alternance / parcours employeur structuré",
    prerequisite:
      "Aptitudes réglementaires et ensemble des TES / habilitations nécessaires selon l'employeur.",
    opensLaneIds: ["ferro_cat"],
    notes:
      "Voie longue et solide pour maintenance / exploitation caténaire, notamment en environnement SNCF Réseau.",
    confidenceLevel: "high",
    providerExamples: ["SNCF Réseau", "École des métiers SNCF"],
    summary:
      "Le parcours robuste long terme: moins 'cash rapide', plus vrai socle métier et progression durable.",
    accessMode:
      "Pas la route courte. Il faut une embauche structurée, une alternance ou un parcours interne.",
    jobReadiness:
      "Très bon upside long terme, mais ce n'est pas la route la plus rapide vers le cash chantier privé.",
    validity: "Titre métier / progression interne, pas juste un ticket court à recycler.",
    accessChecks: [
      "Aptitude physique et psychologique réglementaire",
      "Appétence maintenance / tournée / surveillance",
      "Engagement sur un parcours long",
    ],
    capacityChecks: [
      "Horaires décalés",
      "Travail extérieur",
      "Suivi de parcours théorique + pratique sur longue durée",
    ],
    modules: [
      "tournées de surveillance",
      "maintenance préventive des caténaires",
      "dispositif de sécurité électrique",
      "pédagogie inversée + stages pratiques",
    ],
    doesNotOpen: [
      "Pas une solution express pour du cash immédiat",
      "Ne remplace pas l'expérience terrain chantier privé si c'est ta cible",
    ],
    nextTicketIds: [],
    targetRoles: [
      "opérateur caténaire",
      "maintenance caténaire",
      "progression technique caténaire",
    ],
    sourceIds: ["sncf-reseau-operateur-catenaire", "emploi-sncf-monteur-cables-aeriens"],
  },
];

export const ticketOverrides = {
  "05001": {
    summary:
      "Qualification chantier très spécifique à l'annonce manuelle des circulations. C'est une tâche d'exécution utile, pas un passeport universel ferro.",
    accessMode:
      "Souvent montée via employeur sécurité ferro ou pack sponsorisé ; rarement le meilleur premier achat en solo isolé.",
    jobReadiness:
      "Peut déclencher un premier poste annonceur / sentinelle si l'employeur te suit derrière.",
    validity: "Maintien et recyclage à suivre selon pratique / référentiel.",
    accessChecks: [
      "Socle SECUFER / emprise ferro réaliste",
      "Permis B très fréquent",
      "Mobilité nationale fréquente côté prestataires",
    ],
    capacityChecks: [
      "Concentration longue",
      "Travail extérieur jour / nuit",
      "Gestion du stress et discipline",
    ],
    modules: [
      "annonce humaine des circulations",
      "mesures d'annonce",
      "procédures incident / reprise",
    ],
    doesNotOpen: [
      "Ne te rend pas ASP autonome",
      "Ne t'ouvre pas la caténaire, la signalisation ou la conduite de travaux",
    ],
    nextTicketIds: ["lam", "s9pn", "aattx"],
    targetRoles: ["annonceur", "sentinelle"],
    sourceIds: ["prestafer"],
  },
  aattx: {
    summary:
      "Spécialisation train travaux. Valeur surtout si tu es déjà dans l'environnement sécurité chantier et mobilité ferro.",
    accessMode:
      "Souvent via employeur ferro déjà installé sur les chantiers. Plus rare comme ticket sec en solo.",
    jobReadiness:
      "Peut t'amener vers l'environnement trains travaux, mais il faut déjà une base sécurité chantier crédible.",
    validity: "Maintien par pratique et référentiel employeur.",
    accessChecks: [
      "Base sécurité chantier ferro",
      "Disponibilité terrain / nuit / mobilité",
    ],
    capacityChecks: [
      "Procédure",
      "Coordination chantier",
      "Stress opérationnel",
    ],
    modules: [
      "environnement train travaux",
      "procédures d'annonce / protection associées",
      "coordination liée au chantier",
    ],
    doesNotOpen: [
      "Ne t'ouvre pas automatiquement caténaire, signalisation ou conduite de travaux",
    ],
    nextTicketIds: ["lam"],
    targetRoles: ["AATTX", "environnement trains travaux"],
  },
  asp: {
    name: "TES M / ASP / Annonceur-Sentinelle",
    duration: "5 jours à 2 semaines selon centre et modules",
    prerequisite:
      "SECUFER / AAE réaliste, permis B fréquent, aptitudes médicales / psychologiques et forte rigueur sécurité.",
    summary:
      "Vrai ticket de base sécurité chantier: tu apprends à annoncer, protéger et reprendre le travail selon les consignes chantier.",
    accessMode:
      "Beaucoup plus crédible via un employeur sécurité ferro ou un pack ciblé France Travail / centre spécialisé.",
    jobReadiness:
      "Peut suffire pour un premier poste sécurité chantier si l'employeur accepte les débutants ; sert aussi de prérequis à CH1-CB1.",
    validity: "Habilitation à maintenir ; plusieurs acteurs annoncent une validité max de 36 mois avant recyclage.",
    accessChecks: [
      "Permis B fréquent",
      "Mobilité nationale fréquente",
      "Aptitudes médicales / psychologiques rail",
      "Socle français opérationnel",
    ],
    capacityChecks: [
      "Extérieur jour / nuit",
      "Concentration",
      "Gestion du stress",
      "Discipline procédure",
    ],
    modules: [
      "annonce des circulations",
      "mise en oeuvre des mesures d'annonce",
      "application des mesures de sécurité et reprise",
      "procédures incident / danger grave",
    ],
    doesNotOpen: [
      "Ne te fait pas LAM, S9 ou CH1-CB1 automatiquement",
      "N'ouvre pas la signalisation ou la conduite de travaux",
    ],
    nextTicketIds: ["05001", "lam", "s9pn", "c0cat", "ch1cb1"],
    targetRoles: [
      "annonceur-sentinelle",
      "ASP",
      "socle sécurité chantier caténaire / voie",
    ],
    sourceIds: ["prestafer", "france-travail-pack-secufer-tesm-c0-lam-s9-ch1cb1"],
  },
  habelFerro: {
    name: "Bloc élec ferro (C0 / CH1-CB1 / autres selon poste)",
    summary:
      "Libellé parapluie, pas un ticket unique. En vrai tu dois identifier le bon niveau électrique ferro selon la branche visée.",
    accessMode:
      "Toujours recaler le sous-module exact: percheur = CH1-CB1 ; encadrement = autres niveaux ; sous-station = HTA/HTB selon périmètre.",
    jobReadiness:
      "Seul, ce bloc ne dit rien. Il faut regarder le sous-ticket concret exigé sur le poste.",
    validity: "Recyclages fréquents et variations selon référentiel / employeur.",
    accessChecks: [
      "Cibler la branche exacte avant d'acheter une formation",
      "Avoir un socle sécurité chantier si présence en emprise",
    ],
    capacityChecks: ["Rigueur électrique", "lecture de documents", "respect des ordres"],
    modules: [
      "C0 caténaires",
      "CH1-CB1 exécutant / percheur",
      "niveaux supérieurs si encadrement ou autre périmètre",
    ],
    doesNotOpen: [
      "N'est pas un ticket interchangeable avec toute la filière élec ferro",
      "Ne remplace pas le métier complet ou l'expérience chantier",
    ],
    nextTicketIds: ["c0cat", "ch1cb1", "hta"],
    targetRoles: [
      "caténaire",
      "EALE",
      "télécoms / courants faibles selon contexte",
    ],
    sourceIds: ["campusfer-ch1cb1-percheur", "omnifer-tsae-ch1cb1-initiale", "sferis-ch1cb1"],
  },
  lam: {
    name: "TSAE LAM / 09301",
    summary:
      "Évolution sécurité chantier plus crédible quand tu as déjà tourné en ASP / annonceur et que tu sais tenir un dispositif sur le terrain.",
    accessMode:
      "Très souvent porté par employeur après premières missions sécurité chantier.",
    jobReadiness:
      "Pas un premier ticket pur débutant dans la majorité des cas ; c'est plutôt l'étape d'après.",
    validity: "Maintien par pratique / recyclage selon référentiel.",
    accessChecks: [
      "Base sécurité chantier déjà solide",
      "Capacité à encadrer et coordonner",
    ],
    capacityChecks: [
      "Autonomie terrain",
      "gestion d'équipe",
      "sang-froid sur aléas chantier",
    ],
    modules: [
      "gestion opérationnelle des LAM",
      "encadrement du dispositif",
      "prise de décision sécurité",
    ],
    doesNotOpen: [
      "Ne te transforme pas en conducteur de travaux ou en technicien signalisation",
    ],
    nextTicketIds: ["aattx"],
    targetRoles: ["agent LAM", "coordination sécurité chantier"],
    sourceIds: ["prestafer", "france-travail-pack-secufer-tesm-c0-lam-s9-ch1cb1"],
  },
  secuferro: {
    name: "Pack d'entrée chantier ferro",
    summary:
      "Pack pratique pour aller plus vite, mais son contenu change selon la voie visée. Il faut regarder les modules exacts, pas acheter un mot-valise.",
    accessMode:
      "Souvent packagé par employeur, centre privé ou dispositif de reconversion. Très variable selon le poste cible.",
    jobReadiness:
      "Peut compresser le délai d'entrée, mais seulement si le pack contient vraiment les bons modules pour la branche ciblée.",
    validity:
      "Chaque sous-module vit sa propre vie: recyclages, maintien et niveaux changent selon la tâche.",
    accessChecks: [
      "Demander la liste exacte des modules inclus",
      "Vérifier la branche cible avant inscription",
      "Refuser les packs flous sans séquence claire",
    ],
    capacityChecks: [
      "Disponibilité pour enchaîner plusieurs modules",
      "mobilité",
      "rigueur sécurité",
    ],
    modules: [
      "SECUFER / AAE",
      "TES M / ASP",
      "C0 risques caténaires",
      "LAM / S9 selon voie",
      "CH1-CB1 selon voie caténaire",
    ],
    doesNotOpen: [
      "N'ouvre pas automatiquement toute la filière ferro",
      "Un pack sécurité n'est pas un diplôme métier complet",
    ],
    nextTicketIds: ["secuferAAE", "asp", "lam", "s9pn", "c0cat", "ch1cb1"],
    targetRoles: [
      "entrée sécurité chantier",
      "socle voie / caténaire / train travaux selon modules",
    ],
    sourceIds: ["france-travail-pack-secufer-tesm-c0-lam-s9-ch1cb1"],
  },
  s9pn: {
    summary:
      "Spécialisation chantier mobile / passage à niveau. À prendre quand tu sais déjà quelle configuration chantier tu vises.",
    accessMode:
      "Souvent employeur ou montée interne après premières missions sécurité.",
    jobReadiness:
      "Utile pour se spécialiser, mais pas le meilleur premier ticket si tu n'as pas encore le socle ASP / annonceur.",
    validity: "Maintien par pratique / recyclage selon référentiel.",
    accessChecks: [
      "Base sécurité chantier existante",
      "Mobilité et discipline procédure",
    ],
    capacityChecks: [
      "Travail mobile",
      "lecture consignes spécifiques",
      "vigilance forte",
    ],
    modules: [
      "prestations S9 / PN",
      "chantier mobile / itinérant",
      "consignes spécifiques",
    ],
    doesNotOpen: [
      "Ne remplace pas ASP / annonceur de base",
      "N'ouvre pas la caténaire ou la signalisation",
    ],
    nextTicketIds: ["lam"],
    targetRoles: ["prestataire S9", "prestataire PN"],
    sourceIds: ["prestafer", "france-travail-pack-secufer-tesm-c0-lam-s9-ch1cb1"],
  },
};

export const laneOverrides = {
  ferro_sec: {
    ticketsRequired: ["secuferAAE", "asp", "05001"],
    ticketsRecommended: ["lam", "s9pn"],
    entryPath: [
      "SECUFER / AAE pour entrer proprement en emprise",
      "TES M / ASP / annonceur-sentinelle",
      "05001 annonce manuelle puis premières missions terrain",
      "LAM / S9 ensuite selon chantier et boîte",
    ],
    entryTimeline: {
      trainingDuration: "1 à 3 semaines de modules utiles selon pack",
      firstJobWindow: "2 à 8 semaines si une boîte te porte ; souvent plus long si tu achètes les tickets sans réseau",
      accessMode: "Route courte surtout viable via employeur sécurité ferro ou pack France Travail ciblé",
    },
    fitChecks: [
      "Permis B quasi obligatoire",
      "Mobilité nationale fréquente",
      "Extérieur jour / nuit / week-end",
      "Concentration et gestion du stress",
      "Aptitudes médicales / psychologiques rail",
    ],
    careerQuest: [
      "Niveau 1 · sécuriser l'accès emprise avec SECUFER / AAE",
      "Niveau 2 · passer TES M / ASP et poser ton premier pied sur chantier",
      "Niveau 3 · décrocher des missions annonceur / sentinelle / 05001",
      "Niveau 4 · monter LAM, S9 ou train-travaux pour élargir la paie et la stabilité",
      "Niveau 5 · basculer vers coordination sécurité ou vers une branche chantier adjacente",
    ],
    workPattern: {
      summary:
        "Sécurité chantier ferro = mobilité nationale, horaires jour/nuit/week-end et cash surtout tiré par les déplacements, pas par la base.",
      stablePreset:
        "Preset stable recalé pour un mois missionné: 16 GD, 16 paniers, 10 nuits, 3 week-ends, 12 h sup.",
      maxPreset:
        "Preset max = mois très chargé terrain: 24 GD, 24 paniers, 16 nuits, 4 week-ends, 20 h sup.",
    },
    sourceIds: ["prestafer", "france-travail-pack-secufer-tesm-c0-lam-s9-ch1cb1"],
  },
  ferro_attx: {
    ticketsRequired: ["secuferAAE", "asp", "aattx"],
    ticketsRecommended: ["05001", "lam"],
    entryPath: [
      "SECUFER / AAE",
      "TES M / ASP pour la base chantier",
      "AATTX / ATTX pour entrer sur l'environnement trains travaux",
      "Montée en coordination chantier / sécurité train travaux",
    ],
    entryTimeline: {
      trainingDuration: "2 à 6 semaines selon base sécurité déjà acquise ou non",
      firstJobWindow: "souvent plus rapide si tu viens déjà de la sécurité chantier",
      accessMode: "Voie plus crédible via employeur déjà exposé aux trains travaux",
    },
    fitChecks: [
      "Mobilité chantier",
      "nuit et disponibilité opérationnelle",
      "procédure et vigilance",
    ],
    careerQuest: [
      "Niveau 1 · base sécurité chantier",
      "Niveau 2 · spécialisation train travaux",
      "Niveau 3 · coordination plus large sur opérations ferro nocturnes",
    ],
    workPattern: {
      summary:
        "Le cash vient surtout des fenêtres travaux, des nuits et des déplacements, pas d'une base délirante.",
      stablePreset:
        "Preset stable: 18 GD, 18 paniers, 10 nuits, 3 week-ends, 12 h sup.",
      maxPreset:
        "Preset max: 26 GD, 24 paniers, 16 nuits, 4 week-ends, 20 h sup.",
    },
    sourceIds: ["prestafer"],
  },
  ferro_voie: {
    ticketsRequired: ["secuferAAE", "asp"],
    ticketsRecommended: ["s9pn"],
    entryPath: [
      "SECUFER / AAE",
      "Base TES M / ASP selon chantier",
      "Premiers chantiers voie / réglage / maintenance",
      "Montée appareils de voie / chef d'équipe",
    ],
    entryTimeline: {
      trainingDuration: "1 à 4 semaines selon parcours sponsorisé",
      firstJobWindow: "souvent assez rapide si tu acceptes mobilité + physique",
      accessMode: "Route employeur / sous-traitant plus réaliste qu'empilement de tickets solo",
    },
    fitChecks: [
      "Physique solide",
      "nuit fréquente",
      "mobilité nationale",
      "travail extérieur répétitif",
    ],
    careerQuest: [
      "Niveau 1 · base chantier ferro",
      "Niveau 2 · première expérience voie",
      "Niveau 3 · appareils de voie / réglage / responsabilités",
    ],
    workPattern: {
      summary:
        "Voie = cash de chantier: nuits régulières, mobilité et pénibilité plus hautes que la moyenne.",
      stablePreset:
        "Preset stable: 18 GD, 18 paniers, 12 nuits, 2 week-ends, 14 h sup.",
      maxPreset:
        "Preset max: 26 GD, 26 paniers, 18 nuits, 4 week-ends, 24 h sup.",
    },
  },
  ferro_cat: {
    ticketsRequired: ["secuferAAE", "asp", "c0cat", "ch1cb1"],
    ticketsRecommended: ["travailHauteur", "monteurCatInitial", "operateurCat"],
    entryPath: [
      "SECUFER / AAE pour entrer sur emprise ferro",
      "TES M / ASP pour tenir proprement le chantier et comprendre la sécurité voie",
      "C0 risques caténaires puis CH1-CB1 percheur",
      "Première mission aide monteur / percheur sous ordre d'un CH3-CB3",
      "Monteur caténaire initial puis chef d'équipe / maintenance / conduite travaux",
    ],
    entryTimeline: {
      trainingDuration:
        "Route courte percheur: 2 à 4 semaines de modules utiles ; route monteur solide: 40 jours / 280 h ; route titre caténaire: 14 mois en moyenne",
      firstJobWindow:
        "2 à 12 semaines si une boîte te porte ; acheter CH1-CB1 seul sans suite métier te laisse souvent sur le carreau",
      accessMode:
        "La route crédible passe par un employeur, un centre caténaire ou un pack structuré. CH1-CB1 seul n'est pas une stratégie complète.",
    },
    fitChecks: [
      "Permis B quasi indispensable",
      "Français B1 lu / écrit / parlé",
      "Aptitudes médicales et psychologiques rail",
      "Travail en hauteur / nacelle / extérieur",
      "Mobilité nationale et découchés lourds",
      "Acceptation des nuits et week-ends chantier",
    ],
    careerQuest: [
      "Niveau 1 · verrouiller l'accès emprise et la base sécurité chantier",
      "Niveau 2 · passer C0 puis CH1-CB1 pour devenir crédible sur la protection électrique caténaire",
      "Niveau 3 · viser un premier poste aide monteur / percheur en grand déplacement",
      "Niveau 4 · consolider avec une vraie formation monteur caténaires et 6 à 18 mois de terrain",
      "Niveau 5 · monter sur maintenance caténaire, chef d'équipe, EALE ou conduite travaux",
    ],
    workPattern: {
      summary:
        "Caténaire chantier = lignes coupées, travail de nuit très fréquent, grands déplacements nationaux et retour maison parfois limité à un week-end par mois.",
      stablePreset:
        "Preset stable recalé pour un mois terrain cohérent: 20 GD, 20 paniers, 16 nuits, 3 week-ends, 14 h sup.",
      maxPreset:
        "Preset max = mois très chargé terrain: 29 GD, 29 paniers, 24 nuits, 4 week-ends, 24 h sup.",
    },
    doesNotOpen: [
      "CH1-CB1 seul ne fait pas de toi un monteur caténaire autonome ; il te place sur un rôle exécutant / percheur sous supervision.",
    ],
    sourceIds: [
      "campusfer-ch1cb1-percheur",
      "omnifer-tsae-ch1cb1-initiale",
      "omnifer-monteur-catenaires-initiale",
      "emploi-sncf-monteur-cables-aeriens",
      "sncf-reseau-operateur-catenaire",
      "france-travail-offre-monteur-catenaire-204xctb",
    ],
  },
  ferro_sig: {
    entryTimeline: {
      trainingDuration:
        "Souvent 3 à 12 mois si tu dois construire un vrai socle signalisation ; peu crédible via simple ticket court isolé.",
      firstJobWindow:
        "Plus rapide si tu as déjà électrotechnique, lecture de schémas et sécurité chantier ferro.",
      accessMode:
        "Voie plus fermée que voie / sécurité ; employer-led recommandé.",
    },
    fitChecks: [
      "Lecture schémas / câblage",
      "rigueur documentaire",
      "patience technique",
      "fenêtres travaux nocturnes probables",
    ],
    careerQuest: [
      "Niveau 1 · socle électrique / signalisation",
      "Niveau 2 · premières opérations terrain ou essais",
      "Niveau 3 · montée maintenance / essais / encadrement",
    ],
    workPattern: {
      summary:
        "Technique plus verrouillée que la sécurité chantier. Les nuits existent, mais la vraie barrière est la montée en compétence technique.",
      stablePreset:
        "Preset stable: 16 GD, 16 paniers, 10 nuits, 2 week-ends, 10 h sup.",
      maxPreset:
        "Preset max: 24 GD, 22 paniers, 16 nuits, 4 week-ends, 18 h sup.",
    },
  },
  ferro_tel: {
    ticketsRequired: ["secuferAAE", "signalBase", "habelFerro"],
    entryTimeline: {
      trainingDuration:
        "2 à 6 mois si tu pars d'un socle courant faible / élec ; plus si tu pars de zéro.",
      firstJobWindow:
        "Bon fit si tu as déjà CFa, fibre, vidéosurveillance, contrôle d'accès ou GTB.",
      accessMode:
        "Le recyclage d'un passé courant faible fonctionne souvent mieux que l'achat de tickets ferro seuls.",
    },
    fitChecks: [
      "Socle courant faible / télécom",
      "mobilité chantier",
      "nuit possible selon fenêtres travaux",
    ],
    careerQuest: [
      "Niveau 1 · socle télécom / CFa",
      "Niveau 2 · base sécurité ferro + accès terrain",
      "Niveau 3 · déploiement / maintenance ferro spécialisée",
    ],
    workPattern: {
      summary:
        "Moins brutal physiquement que voie/caténaire, mais très dépendant d'un vrai bagage technique réutilisable.",
      stablePreset:
        "Preset stable: 14 GD, 14 paniers, 8 nuits, 2 week-ends, 10 h sup.",
      maxPreset:
        "Preset max: 22 GD, 20 paniers, 14 nuits, 3 week-ends, 16 h sup.",
    },
  },
  ferro_eale: {
    ticketsRequired: ["secuferAAE", "c0cat", "habelFerro", "hta"],
    entryTimeline: {
      trainingDuration:
        "2 à 6 mois si tu viens déjà de l'électricité industrielle / HTA ; plus long si tu repars de zéro.",
      firstJobWindow:
        "Mieux vaut arriver avec un vrai socle élec que miser sur une seule habilitation ferro.",
      accessMode:
        "Route plus crédible via électricien industriel / HTA qui bascule ferro.",
    },
    fitChecks: [
      "Socle électricité / HTA",
      "travail chantier et mobilité",
      "nuit possible selon coupures / possessions",
    ],
    careerQuest: [
      "Niveau 1 · base élec et sécurité ferro",
      "Niveau 2 · HTA / EALE terrain",
      "Niveau 3 · maintenance / encadrement alimentation ferro",
    ],
    workPattern: {
      summary:
        "Cash surtout tiré par chantier, mobilité et technicité élec, avec moins de 'ticket miracle' que ne le laissent croire les pubs formation.",
      stablePreset:
        "Preset stable: 18 GD, 18 paniers, 10 nuits, 2 week-ends, 12 h sup.",
      maxPreset:
        "Preset max: 26 GD, 26 paniers, 16 nuits, 4 week-ends, 20 h sup.",
    },
  },
  ferro_ct: {
    entryTimeline: {
      trainingDuration:
        "Pas une vraie porte d'entrée débutant. Compter plutôt 1 à 3 ans de terrain avant de devenir crédible.",
      firstJobWindow:
        "Route naturelle après voie, caténaire, sécurité chantier ou signalisation.",
      accessMode:
        "Progression interne / promotion après terrain, plus que formation courte isolée.",
    },
    fitChecks: [
      "terrain déjà vécu",
      "lecture planning / sécurité",
      "management équipe",
      "mobilité nationale",
    ],
    careerQuest: [
      "Niveau 1 · faire tes armes terrain",
      "Niveau 2 · prendre du lead sécurité / technique",
      "Niveau 3 · encadrement travaux puis conduite travaux",
    ],
    workPattern: {
      summary:
        "Toujours beaucoup de mobilité et d'horaires chantier, mais la valeur vient davantage du pilotage que du simple ticket.",
      stablePreset:
        "Preset stable: 16 GD, 16 paniers, 8 nuits, 2 week-ends, 8 h sup.",
      maxPreset:
        "Preset max: 24 GD, 22 paniers, 12 nuits, 4 week-ends, 14 h sup.",
    },
  },
};

export const scenarioPresetOverrides = {
  ferro_sec: {
    low: { gdDays: 8, panierDays: 8, nightShifts: 4, weekendShifts: 2, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 16, panierDays: 16, nightShifts: 10, weekendShifts: 3, overtimeHours: 12, zone: "province", riskEnabled: true },
    max: { gdDays: 24, panierDays: 24, nightShifts: 16, weekendShifts: 4, overtimeHours: 20, zone: "province", riskEnabled: true },
  },
  ferro_attx: {
    low: { gdDays: 8, panierDays: 8, nightShifts: 4, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 18, panierDays: 18, nightShifts: 10, weekendShifts: 3, overtimeHours: 12, zone: "province", riskEnabled: true },
    max: { gdDays: 26, panierDays: 24, nightShifts: 16, weekendShifts: 4, overtimeHours: 20, zone: "province", riskEnabled: true },
  },
  ferro_voie: {
    low: { gdDays: 10, panierDays: 10, nightShifts: 5, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 18, panierDays: 18, nightShifts: 12, weekendShifts: 2, overtimeHours: 14, zone: "province", riskEnabled: true },
    max: { gdDays: 26, panierDays: 26, nightShifts: 18, weekendShifts: 4, overtimeHours: 24, zone: "province", riskEnabled: true },
  },
  ferro_cat: {
    low: { gdDays: 14, panierDays: 14, nightShifts: 8, weekendShifts: 2, overtimeHours: 8, zone: "province", riskEnabled: true },
    stable: { gdDays: 20, panierDays: 20, nightShifts: 16, weekendShifts: 3, overtimeHours: 14, zone: "province", riskEnabled: true },
    max: { gdDays: 29, panierDays: 29, nightShifts: 24, weekendShifts: 4, overtimeHours: 24, zone: "province", riskEnabled: true },
  },
  ferro_sig: {
    low: { gdDays: 8, panierDays: 8, nightShifts: 4, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 16, panierDays: 16, nightShifts: 10, weekendShifts: 2, overtimeHours: 10, zone: "province", riskEnabled: true },
    max: { gdDays: 24, panierDays: 22, nightShifts: 16, weekendShifts: 4, overtimeHours: 18, zone: "province", riskEnabled: true },
  },
  ferro_tel: {
    low: { gdDays: 8, panierDays: 8, nightShifts: 3, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 14, panierDays: 14, nightShifts: 8, weekendShifts: 2, overtimeHours: 10, zone: "province", riskEnabled: true },
    max: { gdDays: 22, panierDays: 20, nightShifts: 14, weekendShifts: 3, overtimeHours: 16, zone: "province", riskEnabled: true },
  },
  ferro_eale: {
    low: { gdDays: 10, panierDays: 10, nightShifts: 4, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 18, panierDays: 18, nightShifts: 10, weekendShifts: 2, overtimeHours: 12, zone: "province", riskEnabled: true },
    max: { gdDays: 26, panierDays: 26, nightShifts: 16, weekendShifts: 4, overtimeHours: 20, zone: "province", riskEnabled: true },
  },
  ferro_ct: {
    low: { gdDays: 8, panierDays: 8, nightShifts: 3, weekendShifts: 1, overtimeHours: 4, zone: "province", riskEnabled: true },
    stable: { gdDays: 16, panierDays: 16, nightShifts: 8, weekendShifts: 2, overtimeHours: 8, zone: "province", riskEnabled: true },
    max: { gdDays: 24, panierDays: 22, nightShifts: 12, weekendShifts: 4, overtimeHours: 14, zone: "province", riskEnabled: true },
  },
  nuc_rp: {
    low: { gdDays: 8, panierDays: 10, nightShifts: 1, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 16, panierDays: 18, nightShifts: 4, weekendShifts: 1, overtimeHours: 12, zone: "province", riskEnabled: true },
    max: { gdDays: 24, panierDays: 24, nightShifts: 8, weekendShifts: 2, overtimeHours: 20, zone: "province", riskEnabled: true },
  },
  nuc_cnd: {
    low: { gdDays: 10, panierDays: 10, nightShifts: 1, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 18, panierDays: 18, nightShifts: 4, weekendShifts: 1, overtimeHours: 10, zone: "province", riskEnabled: true },
    max: { gdDays: 26, panierDays: 24, nightShifts: 8, weekendShifts: 2, overtimeHours: 18, zone: "province", riskEnabled: true },
  },
  nuc_meca: {
    low: { gdDays: 10, panierDays: 10, nightShifts: 2, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 18, panierDays: 18, nightShifts: 5, weekendShifts: 1, overtimeHours: 12, zone: "province", riskEnabled: true },
    max: { gdDays: 26, panierDays: 24, nightShifts: 9, weekendShifts: 2, overtimeHours: 20, zone: "province", riskEnabled: true },
  },
  nuc_log: {
    low: { gdDays: 8, panierDays: 10, nightShifts: 1, weekendShifts: 0, overtimeHours: 4, zone: "province", riskEnabled: true },
    stable: { gdDays: 16, panierDays: 18, nightShifts: 3, weekendShifts: 1, overtimeHours: 8, zone: "province", riskEnabled: true },
    max: { gdDays: 24, panierDays: 24, nightShifts: 6, weekendShifts: 2, overtimeHours: 14, zone: "province", riskEnabled: true },
  },
  nuc_echaf: {
    low: { gdDays: 10, panierDays: 12, nightShifts: 2, weekendShifts: 1, overtimeHours: 8, zone: "province", riskEnabled: true },
    stable: { gdDays: 18, panierDays: 20, nightShifts: 8, weekendShifts: 2, overtimeHours: 14, zone: "province", riskEnabled: true },
    max: { gdDays: 26, panierDays: 26, nightShifts: 12, weekendShifts: 3, overtimeHours: 22, zone: "province", riskEnabled: true },
  },
  ind_tsmi: {
    low: { gdDays: 0, panierDays: 0, nightShifts: 6, weekendShifts: 1, overtimeHours: 4, zone: "province", riskEnabled: true },
    stable: { gdDays: 0, panierDays: 0, nightShifts: 12, weekendShifts: 2, overtimeHours: 6, zone: "province", riskEnabled: true },
    max: { gdDays: 0, panierDays: 0, nightShifts: 18, weekendShifts: 4, overtimeHours: 10, zone: "province", riskEnabled: true },
  },
  ind_auto: {
    low: { gdDays: 8, panierDays: 8, nightShifts: 1, weekendShifts: 0, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 14, panierDays: 14, nightShifts: 3, weekendShifts: 1, overtimeHours: 10, zone: "province", riskEnabled: true },
    max: { gdDays: 22, panierDays: 22, nightShifts: 5, weekendShifts: 2, overtimeHours: 18, zone: "province", riskEnabled: true },
  },
  ind_cvc: {
    low: { gdDays: 4, panierDays: 6, nightShifts: 2, weekendShifts: 1, overtimeHours: 4, zone: "province", riskEnabled: true },
    stable: { gdDays: 8, panierDays: 10, nightShifts: 4, weekendShifts: 1, overtimeHours: 8, zone: "province", riskEnabled: true },
    max: { gdDays: 14, panierDays: 16, nightShifts: 8, weekendShifts: 2, overtimeHours: 14, zone: "province", riskEnabled: true },
  },
  ren_eol: {
    low: { gdDays: 10, panierDays: 12, nightShifts: 1, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 18, panierDays: 20, nightShifts: 3, weekendShifts: 1, overtimeHours: 10, zone: "province", riskEnabled: true },
    max: { gdDays: 26, panierDays: 26, nightShifts: 6, weekendShifts: 2, overtimeHours: 18, zone: "province", riskEnabled: true },
  },
  ren_hta: {
    low: { gdDays: 10, panierDays: 12, nightShifts: 2, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 18, panierDays: 18, nightShifts: 6, weekendShifts: 2, overtimeHours: 12, zone: "province", riskEnabled: true },
    max: { gdDays: 26, panierDays: 26, nightShifts: 10, weekendShifts: 3, overtimeHours: 20, zone: "province", riskEnabled: true },
  },
  spec_rope: {
    low: { gdDays: 10, panierDays: 12, nightShifts: 2, weekendShifts: 1, overtimeHours: 6, zone: "province", riskEnabled: true },
    stable: { gdDays: 16, panierDays: 18, nightShifts: 4, weekendShifts: 2, overtimeHours: 10, zone: "province", riskEnabled: true },
    max: { gdDays: 24, panierDays: 24, nightShifts: 8, weekendShifts: 3, overtimeHours: 18, zone: "province", riskEnabled: true },
  },
  spec_levage: {
    low: { gdDays: 8, panierDays: 10, nightShifts: 1, weekendShifts: 1, overtimeHours: 8, zone: "province", riskEnabled: true },
    stable: { gdDays: 14, panierDays: 16, nightShifts: 2, weekendShifts: 2, overtimeHours: 14, zone: "province", riskEnabled: true },
    max: { gdDays: 22, panierDays: 24, nightShifts: 4, weekendShifts: 3, overtimeHours: 22, zone: "province", riskEnabled: true },
  },
  spec_tuyaut: {
    low: { gdDays: 10, panierDays: 12, nightShifts: 1, weekendShifts: 0, overtimeHours: 8, zone: "province", riskEnabled: true },
    stable: { gdDays: 18, panierDays: 22, nightShifts: 4, weekendShifts: 1, overtimeHours: 14, zone: "province", riskEnabled: true },
    max: { gdDays: 26, panierDays: 28, nightShifts: 8, weekendShifts: 2, overtimeHours: 22, zone: "province", riskEnabled: true },
  },
  crit_dc: {
    low: { gdDays: 0, panierDays: 0, nightShifts: 8, weekendShifts: 1, overtimeHours: 4, zone: "province", riskEnabled: true },
    stable: { gdDays: 0, panierDays: 0, nightShifts: 12, weekendShifts: 2, overtimeHours: 6, zone: "province", riskEnabled: true },
    max: { gdDays: 0, panierDays: 0, nightShifts: 18, weekendShifts: 4, overtimeHours: 10, zone: "province", riskEnabled: true },
  },
  crit_fac: {
    low: { gdDays: 2, panierDays: 2, nightShifts: 4, weekendShifts: 1, overtimeHours: 2, zone: "province", riskEnabled: true },
    stable: { gdDays: 4, panierDays: 4, nightShifts: 6, weekendShifts: 1, overtimeHours: 4, zone: "province", riskEnabled: true },
    max: { gdDays: 8, panierDays: 8, nightShifts: 10, weekendShifts: 2, overtimeHours: 8, zone: "province", riskEnabled: true },
  },
};
