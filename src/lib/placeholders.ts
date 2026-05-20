export const dashboardCards = [
  {
    label: "Min placering",
    value: "#12",
    detail: "Du ligger midt i feltet før første kamp.",
    tone: "gold" as const
  },
  {
    label: "Mine point",
    value: "0",
    detail: "Pointberegning kobles på senere.",
    tone: "green" as const
  },
  {
    label: "Manglende kampbud",
    value: "48",
    detail: "Alle kampe er placeholders i denne version."
  },
  {
    label: "Manglende udsagn",
    value: "15",
    detail: "Udsagn kan først besvares, når auth er klar."
  },
  {
    label: "Næste kamp",
    value: "Mexico - Sydafrika",
    detail: "Dato og kickoff bliver dynamisk senere."
  },
  {
    label: "Deadline",
    value: "Ikke sat",
    detail: "Deadline-logik kommer med kampbud."
  }
];

export const matches = [
  {
    group: "Gruppe A",
    home: "Mexico",
    away: "Sydafrika",
    date: "11. juni 2026",
    status: "Åbner snart"
  },
  {
    group: "Gruppe A",
    home: "Canada",
    away: "Qatar",
    date: "12. juni 2026",
    status: "Afventer bud"
  },
  {
    group: "Gruppe B",
    home: "Danmark",
    away: "Japan",
    date: "13. juni 2026",
    status: "Afventer bud"
  },
  {
    group: "Gruppe C",
    home: "Argentina",
    away: "Portugal",
    date: "14. juni 2026",
    status: "Topkamp"
  }
];

export const statements = [
  "Danmark går videre fra gruppen.",
  "Turneringen får mindst én straffesparkskonkurrence.",
  "Der kommer et hattrick i gruppespillet.",
  "En målmand scorer eller assisterer et mål.",
  "Finalen afgøres efter forlænget spilletid.",
  "Mindst fem røde kort bliver uddelt i turneringen.",
  "En debutantnation når ottendedelsfinalen.",
  "Der scores over 160 mål samlet.",
  "Topscoreren laver mindst syv mål.",
  "Værtsnationerne vinder tilsammen mindst fire kampe.",
  "En kamp ender 0-0 efter ordinær tid.",
  "VAR annullerer mindst ti mål.",
  "Danmark scorer i alle sine gruppekampe.",
  "En gruppe afgøres på målforskel.",
  "Vinderen af VM 2026 kommer fra Europa."
];

export const leaderboard = [
  { rank: 1, name: "Maja", points: 0, badge: "Klar" },
  { rank: 2, name: "Jonas", points: 0, badge: "Klar" },
  { rank: 3, name: "Nick", points: 0, badge: "Klar" },
  { rank: 4, name: "Sara", points: 0, badge: "Mangler bud" },
  { rank: 5, name: "Emil", points: 0, badge: "Ny spiller" }
];
