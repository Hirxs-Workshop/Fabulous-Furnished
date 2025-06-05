import { world } from '@minecraft/server';

export function registerTvWeatherChannel(registry) {
  registry.registerCustomComponent("ff:tv_weather_channel", {
    onTick({ block }) {
      const current = block.permutation.getState("ff:channels");
      const perms = {
        clear:   block.permutation.withState("ff:channels", 1),
        rain:    block.permutation.withState("ff:channels", 2),
        thunder: block.permutation.withState("ff:channels", 3),
        snow:    block.permutation.withState("ff:channels", 4),
      };
      const weather = world.getDynamicProperty("ff:dynamic_weather_system");
      if (weather === "Rain"    && (current === 1 || current === 3)) block.setPermutation(perms.rain);
      else if (weather === "Thunder" && (current === 1 || current === 2)) block.setPermutation(perms.thunder);
      else if (weather === "Snow"    &&  current === 1)                      block.setPermutation(perms.snow);
      else if (weather === "Clear"   && (current >= 2 && current <= 4))      block.setPermutation(perms.clear);
    }
  });
} 