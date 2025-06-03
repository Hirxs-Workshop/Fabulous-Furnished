import { world } from "@minecraft/server";

export const DEVICE_TYPES = new Set([
    "ff:plasma_tv",
    "ff:wooden_rustic_cherry_tv",
"ff:wooden_rustic_dark_oak_tv",
"ff:wooden_rustic_pale_tv",
"ff:wooden_rustic_crimson_tv",
"ff:wooden_rustic_warped_tv",
"ff:wooden_rustic_jungle_tv",
"ff:wooden_rustic_acacia_tv",
"ff:wooden_rustic_birch_tv",
"ff:wooden_rustic_cinder_tv",
"ff:wooden_rustic_spicewood_tv",
"ff:wooden_rustic_mangrove_tv",
"ff:wooden_rustic_spruce_tv",
"ff:wooden_rustic_oak_tv",
"ff:wooden_rustic_maple_tv",
    "ff:lamp_on_oak",
    "ff:lamp_off_oak",
    "ff:lamp_on_spruce",
    "ff:lamp_off_spruce",
    "ff:lamp_on_spicewood",
    "ff:lamp_off_spicewood",
    "ff:lamp_on_cinder",
    "ff:lamp_off_cinder",
    "ff:lamp_on_pale",
    "ff:lamp_off_pale",
    "ff:lamp_on_mangrove",
    "ff:lamp_off_mangrove",
    "ff:lamp_on_dark_oak",
    "ff:lamp_off_dark_oak",
    "ff:lamp_on_jungle",
    "ff:lamp_off_jungle",
    "ff:lamp_on_acacia",
    "ff:lamp_off_acacia",
    "ff:lamp_on_crimson",
    "ff:lamp_off_crimson",
    "ff:lamp_on_warped",
    "ff:lamp_off_warped",
    "ff:lamp_on_cherry",
    "ff:lamp_off_cherry",
    "ff:lamp_on_birch",
    "ff:lamp_off_birch"
]);

export const OUTLET_TYPES = new Set([
    "ff:outlet"
]);

export const DEVICE_ALIASES = {
    "ff:plasma_tv": "Plasma TV",
    "ff:wooden_rustic_oak_tv": "Wooden rustic oak TV",
"ff:wooden_rustic_cherry_tv": "Wooden rustic cherry TV",
"ff:wooden_rustic_dark_oak_tv": "Wooden rustic dark oak TV",
"ff:wooden_rustic_pale_tv": "Wooden rustic pale TV",
"ff:wooden_rustic_crimson_tv": "Wooden rustic crimson TV",
"ff:wooden_rustic_warped_tv": "Wooden rustic warped TV",
"ff:wooden_rustic_jungle_tv": "Wooden rustic jungle TV",
"ff:wooden_rustic_acacia_tv": "Wooden rustic acacia TV",
"ff:wooden_rustic_birch_tv": "Wooden rustic birch TV",
"ff:wooden_rustic_cinder_tv": "Wooden rustic cinder TV",
"ff:wooden_rustic_spicewood_tv": "Wooden rustic spicewood TV",
"ff:wooden_rustic_mangrove_tv": "Wooden rustic mangrove TV",
"ff:wooden_rustic_spruce_tv": "Wooden rustic spruce TV",
"ff:wooden_rustic_maple_tv": "Wooden rustic maple TV",
    "ff:lamp_on_oak": "Lamp oak",
    "ff:lamp_off_oak": "Lamp oak",
    "ff:lamp_on_spruce": "Lamp spruce",
    "ff:lamp_off_spruce": "Lamp spruce",
    "ff:lamp_on_spicewood": "Lamp spicewood",
    "ff:lamp_off_spicewood": "Lamp spicewood",
    "ff:lamp_on_cinder": "Lamp cinder",
    "ff:lamp_off_cinder": "Lamp cinder",
    "ff:lamp_on_pale": "Lamp pale",
    "ff:lamp_off_pale": "Lamp pale",
    "ff:lamp_on_mangrove": "Lamp mangrove",
    "ff:lamp_off_mangrove": "Lamp mangrove",
    "ff:lamp_on_dark_oak": "Lamp dark oak",
    "ff:lamp_off_dark_oak": "Lamp dark oak",
    "ff:lamp_on_jungle": "Lamp jungle",
    "ff:lamp_off_jungle": "Lamp jungle",
    "ff:lamp_on_acacia": "Lamp acacia",
    "ff:lamp_off_acacia": "Lamp acacia",
    "ff:lamp_on_crimson": "Lamp crimson",
    "ff:lamp_off_crimson": "Lamp crimson",
    "ff:lamp_on_warped": "Lamp warped",
    "ff:lamp_off_warped": "Lamp warped",
    "ff:lamp_on_cherry": "Lamp cherry",
    "ff:lamp_off_cherry": "Lamp cherry",
    "ff:lamp_on_birch": "Lamp birch",
    "ff:lamp_off_birch": "Lamp birch"
};

export const OUTLET_ALIASES = {
    "ff:outlet": "Outlet"
};

export const DEVICE_CONNECTIONS_KEY = "ff_devices_system_key";
export const MAX_DEVICES_PER_OUTLET = 2;
export const NEAR_DISTANCE = 64; 