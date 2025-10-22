import { world } from "@minecraft/server";

const ENERGY_TEMPLATES = {
  "ff.energy.linked_to": "§qLinked to: %s (%s, %s, %s)",
  "ff.energy.low_energy": "§6Generator low on energy (%s). Location: (%s, %s, %s)",
  "ff.energy.generator_full_attempts": "§cGenerator is full! %s attempts remaining before explosion!",
  "ff.energy.generator_exploding": "§4Generator is about to explode from overload!",
  "ff.energy.exploded": "§4Generator exploded from too many failed connection attempts!",
};

export const EnergyMsg = {
  msg(player, parts) {
    try {
      const rt = parts.map(p => (typeof p === "string" ? { text: p } : p));
      player.sendMessage({ rawtext: rt });
    } catch (e) {
      const text = parts.map(p => (typeof p === "string" ? p : (p?.text ?? ""))).join("");
      if (text) player.sendMessage(text);
    }
  },
  tr(player, key, withParts = []) {
    try {
      const withArr = withParts.map(v => (typeof v === "string" ? v : { text: String(v) }));
      player.sendMessage({ rawtext: [ { translate: key, with: withArr } ] });
    } catch (e) {
      const template = ENERGY_TEMPLATES[key];
      if (template) {
        let i = 0;
        const formatted = template.replace(/%s/g, () => String(withParts[i++] ?? ""));
        player.sendMessage(formatted);
      } else {
        player.sendMessage(key);
      }
    }
  }
};
