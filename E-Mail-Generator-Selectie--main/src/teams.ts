export type TeamConfig = {
  /** URL-safe id used in paths + storage keys, e.g. "ipu15" */
  id: string;
  /** What trainers see in the team picker */
  label: string;
  /** Optional subtitle (bv. club) */
  subtitle?: string;
  /** Folder in /public where squad_players.txt & keepers.txt live */
  publicFolder: string;
  /** Mail signature shown at the bottom of the generated mail */
  signatureLines: string[];
};

/**
 * 👇 Voeg hier teams toe.
 * Voor elk team maak je in /public een map aan: /public/teams/<id>/
 * met daarin:
 *   - squad_players.txt (1 speler per regel)
 *   - keepers.txt (1 keeper per regel)
 */
export const TEAMS: TeamConfig[] = [
  {
    id: "ipu15",
    label: "IPU15",
    subtitle: "KVE Drongen",
    publicFolder: "/teams/ipu15",
    signatureLines: [
      "Yannick Deraedt",
      "Trainer IPU15 – KVE Drongen",
      "0487888086",
    ],
  },
  // Voorbeeld – pas aan of verwijder
  {
    id: "ipu14",
    label: "IPU14",
    subtitle: "KVE Drongen",
    publicFolder: "/teams/ipu14",
    signatureLines: [
      "Voornaam Achternaam",
      "Trainer IPU14 – KVE Drongen",
      "0xxxxxxxxx",
    ],
  },
];

export function getTeamById(teamId: string) {
  return TEAMS.find((t) => t.id === teamId) ?? TEAMS[0];
}
