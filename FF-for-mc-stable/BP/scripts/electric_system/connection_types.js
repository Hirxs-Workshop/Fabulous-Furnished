import { world } from "@minecraft/server";

export const LIGHT_TYPES = new Set([
  "ff:ceiling_light_oak",
  "ff:ceiling_light_spruce",
  "ff:ceiling_light_dark_oak",
  "ff:ceiling_light_acacia",
  "ff:ceiling_light_birch",
  "ff:ceiling_light_warped",
  "ff:ceiling_light_crimson",
  "ff:ceiling_light_pale",
  "ff:ceiling_light_mangrove",
  "ff:ceiling_light_cherry",
  "ff:ceiling_light_spicewood",
  "ff:ceiling_light_cinder",

  "ff:wooden_ceiling_fan_oak",
  "ff:wooden_ceiling_fan_spruce",
  "ff:wooden_ceiling_fan_dark_oak",
  "ff:wooden_ceiling_fan_acacia",
  "ff:wooden_ceiling_fan_birch",
  "ff:wooden_ceiling_fan_warped",
  "ff:wooden_ceiling_fan_crimson",
  "ff:wooden_ceiling_fan_pale",
  "ff:wooden_ceiling_fan_mangrove",
  "ff:wooden_ceiling_fan_cherry",
  "ff:wooden_ceiling_fan_spicewood",
  "ff:wooden_ceiling_fan_cinder",
]);

export const SWITCH_TYPES = new Set([
  "ff:modern_switch"
]);

export const LIGHT_ALIASES = {
    "ff:ceiling_light_oak":              "Ceiling light oak",
    "ff:ceiling_light_spruce":           "Ceiling light spruce",
    "ff:ceiling_light_dark_oak":         "Ceiling light dark oak",
    "ff:ceiling_light_acacia":           "Ceiling light acacia",
    "ff:ceiling_light_birch":            "Ceiling light birch",
    "ff:ceiling_light_warped":           "Ceiling light warped",
    "ff:ceiling_light_crimson":          "Ceiling light crimson",
    "ff:ceiling_light_pale":             "Ceiling light pale",
    "ff:ceiling_light_mangrove":         "Ceiling light mangrove",
    "ff:ceiling_light_cherry":           "Ceiling light cherry",
    "ff:ceiling_light_spicewood":        "Ceiling light spicewood",
    "ff:ceiling_light_cinder":           "Ceiling light cinder",
  
    "ff:wooden_ceiling_fan_oak":         "Wooden ceiling fan oak",
    "ff:wooden_ceiling_fan_spruce":      "Wooden ceiling fan spruce",
    "ff:wooden_ceiling_fan_dark_oak":    "Wooden ceiling fan dark oak",
    "ff:wooden_ceiling_fan_acacia":      "Wooden ceiling fan acacia",
    "ff:wooden_ceiling_fan_birch":       "Wooden ceiling fan birch",
    "ff:wooden_ceiling_fan_warped":      "Wooden ceiling fan warped",
    "ff:wooden_ceiling_fan_crimson":     "Wooden ceiling fan crimson",
    "ff:wooden_ceiling_fan_pale":        "Wooden ceiling fan pale",
    "ff:wooden_ceiling_fan_mangrove":    "Wooden ceiling fan mangrove",
    "ff:wooden_ceiling_fan_cherry":      "Wooden ceiling fan cherry",
    "ff:wooden_ceiling_fan_spicewood":   "Wooden ceiling fan spicewood",
    "ff:wooden_ceiling_fan_cinder":      "Wooden ceiling fan cinder",
};

export const SWITCH_ALIASES = {
  "ff:modern_switch": "Modern switch"
};

export const CONNECTIONS_KEY = "ff_electric_system";
export const MAX_ENERGY = 500;
export const DEFAULT_CONSUMPTION_RATE = 0.2;
export const CONSUMPTION_MULTIPLIER = 0.1;
export const NEAR_DISTANCE = 64;
