import { world } from "@minecraft/server";

const CONNECTIONS_KEY = "ff:connections";
let CACHE = null;

export function getConnections() {
  try {
    if (CACHE) return CACHE;
    const raw = world.getDynamicProperty(CONNECTIONS_KEY);
    CACHE = raw ? JSON.parse(raw) : [];
    return CACHE;
  } catch {
    CACHE = [];
    return CACHE;
  }
}

export function saveConnections(arr) {
  CACHE = arr;
  try {
    world.setDynamicProperty(CONNECTIONS_KEY, JSON.stringify(arr));
  } catch {}
}
