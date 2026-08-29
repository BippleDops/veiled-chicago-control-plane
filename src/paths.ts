export const VAULT_PATHS = {
  campaignRoot: "1-Campaign",
  dmRoot: "1-Campaign/DM",
  partyRoot: "1-Campaign/Party",
  sessionsRoot: "1-Campaign/Sessions",
  handoutsRoot: "1-Campaign/Handouts",
  operationsInboxRoot: "1-Campaign/DM/Operations Inbox",
  worldRoot: "2-World/Chicago",
  mechanicsRoot: "3-Library/Mechanics",
  modulesRoot: "3-Library/Modules/Chicago",
  templatesRoot: "3-Library/Templates",
  systemRoot: "9-System",
  automationRoot: "9-System/Automation",
  automationScriptsRoot: "9-System/Automation/scripts",
  mapAppRoot: "9-System/Apps/veiled-chicago-map",
  currentState: "1-Campaign/DM/Current State of Affairs.md",
  currentLeads: "1-Campaign/Party/Current Leads.md",
  campaignLedger: "1-Campaign/Party/Campaign State Ledger.md",
  canonDecisions: "1-Campaign/DM/Canon Decisions Log.md",
  dmControlDeck: "1-Campaign/DM/DM Control Deck.md",
  combatDashboard: "1-Campaign/DM/Combat Dashboard.md",
  campaignBoard: "1-Campaign/DM/Open-World Campaign Board.md",
  factionFronts: "1-Campaign/DM/Faction Fronts.md",
  npcReference: "1-Campaign/DM/NPC Quick Reference.md",
  mapRegistry: "1-Campaign/DM/Map Bundles/Map Bundle Registry.md",
  playerPortal: "1-Campaign/Party/Player Portal.md",
  quickSearch: "1-Campaign/DM/Quick Search.md",
  vaultHealth: "1-Campaign/DM/Vault Health.md",
  quickCapture: "1-Campaign/DM/Operations Inbox/Quick Capture.md",
  controlWrapper: "9-System/Automation/scripts/vcg_control.py"
} as const;

export const MANAGED_NOTE_ROOTS = {
  npc: "2-World/Chicago/People/NPCs",
  location: "2-World/Chicago/Places",
  faction: "2-World/Chicago/Factions",
  item: "2-World/Chicago/Items",
  clue: "1-Campaign/DM/Operations Inbox/Clues",
  ruling: "1-Campaign/DM/Operations Inbox/Rulings",
  playerKnowledge: "1-Campaign/Party/Knowledge",
  research: "1-Campaign/DM/Operations Inbox/Research",
  correction: "1-Campaign/DM/Operations Inbox/Corrections"
} as const;

export const PROTECTED_CANON_PATHS = [
  VAULT_PATHS.canonDecisions,
  VAULT_PATHS.currentState,
  VAULT_PATHS.campaignLedger,
  VAULT_PATHS.currentLeads
] as const;

export function sessionRoomPath(session: number): string {
  return `${VAULT_PATHS.sessionsRoot}/Session ${session}`;
}

export function sessionControlRoomPath(session: number): string {
  return `${sessionRoomPath(session)}/Session ${session} Control Room.md`;
}

export function automationScriptPath(name: string): string {
  if (!/^[a-z0-9_]+\.(?:py|sh)$/i.test(name)) throw new Error(`Invalid automation script name: ${name}`);
  return `${VAULT_PATHS.automationScriptsRoot}/${name}`;
}
