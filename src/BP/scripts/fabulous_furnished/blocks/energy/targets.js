export const switchTargets = [
  "ff:ceiling_light_oak", "ff:ceiling_light_maple","ff:ceiling_light_spruce","ff:ceiling_light_dark_oak",
  "ff:ceiling_light_acacia","ff:ceiling_light_birch","ff:ceiling_light_warped",
  "ff:ceiling_light_crimson","ff:ceiling_light_pale","ff:ceiling_light_mangrove",
  "ff:ceiling_light_cherry","ff:ceiling_light_spicewood","ff:ceiling_light_cinder","ff:ceiling_light_jungle",
  "ff:wooden_ceiling_fan_oak", "ff:wooden_ceiling_fan_maple","ff:wooden_ceiling_fan_spruce","ff:wooden_ceiling_fan_dark_oak",
  "ff:wooden_ceiling_fan_acacia","ff:wooden_ceiling_fan_birch","ff:wooden_ceiling_fan_warped",
  "ff:wooden_ceiling_fan_crimson","ff:wooden_ceiling_fan_pale","ff:wooden_ceiling_fan_mangrove",
  "ff:wooden_ceiling_fan_cherry","ff:wooden_ceiling_fan_spicewood","ff:wooden_ceiling_fan_cinder","ff:wooden_ceiling_fan_jungle",
  "fb:light_off","fb:office_light_off","fb:light_roof_off"
];

export const outletTargets = [
  "ff:plasma_tv","ff:wooden_rustic_cherry_tv","ff:wooden_rustic_dark_oak_tv",
  "ff:wooden_rustic_pale_tv","ff:wooden_rustic_crimson_tv","ff:wooden_rustic_warped_tv",
  "ff:wooden_rustic_jungle_tv","ff:wooden_rustic_acacia_tv","ff:wooden_rustic_birch_tv",
  "ff:wooden_rustic_cinder_tv","ff:wooden_rustic_spicewood_tv","ff:wooden_rustic_mangrove_tv",
  "ff:wooden_rustic_spruce_tv","ff:wooden_rustic_oak_tv", "ff:wooden_rustic_maple_tv",
  "ff:lamp_off_oak","ff:lamp_off_maple","ff:lamp_off_spruce","ff:lamp_off_spicewood","ff:lamp_off_cinder","ff:lamp_off_pale",
  "ff:lamp_off_mangrove","ff:lamp_off_dark_oak","ff:lamp_off_jungle","ff:lamp_off_acacia","ff:lamp_off_crimson",
  "ff:lamp_off_warped","ff:lamp_off_cherry","ff:lamp_off_birch",
  "fb:light_off","fb:office_light_off","fb:light_roof_off"
];

export const ceilingLightTargets = switchTargets.filter(i=>i.includes("ceiling_light"));
export const ceilingFanTargets   = switchTargets.filter(i=>i.includes("ceiling_fan"));

const woodTypes = [
  "oak","spruce","spicewood","cinder","pale","mangrove",
  "dark_oak","jungle","acacia","crimson","warped","cherry","birch", "maple"
];

export function getWoodType(block) {
  return woodTypes.find(w => block.typeId.endsWith(`_${w}`));
}
