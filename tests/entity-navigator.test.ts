import assert from "node:assert/strict";

import {
  buildEntityIndex,
  deriveEntityType,
  ENTITY_RESULT_LIMIT,
  ENTITY_ROOT_REGISTRY,
  filterEntityIndex,
  type CachedFrontmatterFile
} from "../src/entity-navigator";
import { MANAGED_NOTE_ROOTS, VAULT_PATHS } from "../src/paths";

assert.deepEqual(
  ENTITY_ROOT_REGISTRY.map(({ type, root }) => [type, root]),
  [
    ["npc", MANAGED_NOTE_ROOTS.npc],
    ["location", MANAGED_NOTE_ROOTS.location],
    ["faction", MANAGED_NOTE_ROOTS.faction],
    ["item", MANAGED_NOTE_ROOTS.item],
    ["session", VAULT_PATHS.sessionsRoot]
  ]
);

assert.equal(deriveEntityType(`${MANAGED_NOTE_ROOTS.npc}/ada-ward.md`), "npc");
assert.equal(deriveEntityType(`${MANAGED_NOTE_ROOTS.location}/The Loop/Archive.md`), "location");
assert.equal(deriveEntityType(`${MANAGED_NOTE_ROOTS.faction}/Grey Court.md`), "faction");
assert.equal(deriveEntityType(`${MANAGED_NOTE_ROOTS.item}/Bronze Leaf Pin.md`), "item");
assert.equal(deriveEntityType(`${VAULT_PATHS.sessionsRoot}/Session 8/Session 8 Table Log.md`), "session");
assert.equal(deriveEntityType(`${MANAGED_NOTE_ROOTS.npc}-Archive/not-an-npc.md`), null);
assert.equal(deriveEntityType(`${MANAGED_NOTE_ROOTS.npc}/../People/not-an-npc.md`), null);
assert.equal(deriveEntityType("2-World/Chicago/People/Player Characters/Linda.md"), null);
assert.equal(deriveEntityType(`${MANAGED_NOTE_ROOTS.npc}/portrait.png`), null);
assert.equal(deriveEntityType(`/absolute/${MANAGED_NOTE_ROOTS.npc}/bad.md`), null);

const bodyTrap = {
  path: `${MANAGED_NOTE_ROOTS.npc}/ada-ward.md`,
  basename: "ada-ward",
  frontmatter: {
    title: "The Archivist",
    aliases: ["Ada", "The Needle", "ada"],
    alias: "Archivist Prime",
    tags: ["#Category/NPC", "Faction/Grey"],
    tag: "active, chicago",
    char_status: "Active",
    status: "Ignored fallback",
    audience: ["dm", "players"],
    canon_status: "canonical"
  }
} as CachedFrontmatterFile & { readonly body?: string };
Object.defineProperty(bodyTrap, "body", {
  enumerable: true,
  get(): never {
    throw new Error("note bodies must not be read");
  }
});

const inheritedFrontmatter = Object.assign(Object.create({ title: "Inherited title" }) as Record<string, unknown>, {
  location_status: "Unknown"
});

const files: CachedFrontmatterFile[] = [
  bodyTrap,
  {
    path: `${MANAGED_NOTE_ROOTS.location}/lakefront-warehouse.md`,
    basename: "lakefront-warehouse",
    frontmatter: inheritedFrontmatter
  },
  {
    path: `${MANAGED_NOTE_ROOTS.faction}/grey-court.md`,
    basename: "grey-court",
    frontmatter: { title: "Grey Court", faction_status: "active", audience: "dm", canon_status: "draft" }
  },
  {
    path: `${MANAGED_NOTE_ROOTS.item}/bronze-leaf-pin.md`,
    basename: "bronze-leaf-pin",
    frontmatter: { title: "Bronze Leaf Pin", item_status: "Missing", tags: "Category/Item magical" }
  },
  {
    path: `${VAULT_PATHS.sessionsRoot}/Session 8/Session 8 Table Log.md`,
    basename: "Session 8 Table Log",
    frontmatter: { session_status: "played", aliases: "S8 log" }
  },
  {
    path: `${MANAGED_NOTE_ROOTS.npc}/ada-ward.md`,
    basename: "duplicate-must-not-win",
    frontmatter: { title: "Duplicate" }
  },
  {
    path: "9-System/Docs/not-an-entity.md",
    basename: "not-an-entity",
    frontmatter: { title: "Must not be indexed" }
  },
  {
    path: `${MANAGED_NOTE_ROOTS.npc}/../escaped.md`,
    basename: "escaped",
    frontmatter: { title: "Must not escape" }
  }
];

const index = buildEntityIndex(files);
assert.equal(index.length, 5);

const ada = index.find((entry) => entry.path.endsWith("/ada-ward.md"));
assert.ok(ada);
assert.equal(ada.title, "The Archivist");
assert.equal(ada.basename, "ada-ward");
assert.deepEqual(ada.aliases, ["Ada", "The Needle", "Archivist Prime"]);
assert.deepEqual(ada.tags, ["Category/NPC", "Faction/Grey", "active", "chicago"]);
assert.equal(ada.status, "Active");
assert.equal(ada.audience, "dm, players");
assert.equal(ada.canonStatus, "canonical");

const warehouse = index.find((entry) => entry.path.endsWith("/lakefront-warehouse.md"));
assert.ok(warehouse);
assert.equal(warehouse.title, "lakefront-warehouse");
assert.equal(warehouse.status, "Unknown");

for (const query of [
  "archivist",
  "ada-ward",
  "needle",
  "#category/npc",
  "active",
  "2-world/chicago/people/npcs"
]) {
  const result = filterEntityIndex(index, { query });
  assert.equal(result.total, query === "active" ? 2 : 1, `search field query ${query}`);
  assert.ok(result.items.some((entry) => entry.path === ada.path));
}

assert.equal(filterEntityIndex(index, { query: "archivist needle active" }).total, 1);
assert.equal(filterEntityIndex(index, { query: "body-only secret" }).total, 0);
assert.equal(filterEntityIndex(index, { query: "active", types: ["npc"] }).total, 1);
assert.equal(filterEntityIndex(index, { statuses: ["ACTIVE"] }).total, 2);
assert.equal(filterEntityIndex(index, { types: ["session"], statuses: ["played"] }).total, 1);
assert.equal(filterEntityIndex(index, { types: ["npc", "npc"], statuses: ["Active", "active"] }).total, 1);
assert.equal(filterEntityIndex(index, { types: ["unknown" as never] }).total, 0);
assert.equal(filterEntityIndex(index, { statuses: [""] }).total, 0);

const activeResult = filterEntityIndex(index, { query: "active", types: ["npc"] });
assert.equal(activeResult.total, 1);
assert.equal(activeResult.shown, 1);
assert.equal(activeResult.truncated, false);
assert.deepEqual(
  activeResult.facets.types.map(({ value, count }) => [value, count]),
  [
    ["npc", 1],
    ["location", 0],
    ["faction", 1],
    ["item", 0],
    ["session", 0]
  ]
);
assert.deepEqual(activeResult.facets.statuses, [{ value: "active", label: "Active", count: 2 }]);

const manySessions: CachedFrontmatterFile[] = Array.from({ length: 125 }, (_, indexNumber) => ({
  path: `${VAULT_PATHS.sessionsRoot}/Session ${indexNumber}/Record ${indexNumber}.md`,
  basename: `Record ${indexNumber}`,
  frontmatter: { title: `Record ${String(indexNumber).padStart(3, "0")}`, session_status: "played" }
}));
const manyIndex = buildEntityIndex(manySessions);
const capped = filterEntityIndex(manyIndex, { limit: 1_000 });
assert.equal(capped.total, 125);
assert.equal(capped.shown, ENTITY_RESULT_LIMIT);
assert.equal(capped.items.length, ENTITY_RESULT_LIMIT);
assert.equal(capped.limit, ENTITY_RESULT_LIMIT);
assert.equal(capped.truncated, true);

const limited = filterEntityIndex(manyIndex, { limit: 7 });
assert.equal(limited.total, 125);
assert.equal(limited.shown, 7);
assert.equal(limited.limit, 7);
assert.equal(limited.truncated, true);

console.log("entity-navigator-tests PASS fixed-root cached-frontmatter index");
