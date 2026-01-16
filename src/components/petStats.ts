import type { MoveType } from "./moveSet";

export type ComputedPetStats = {
  health: number;
  attack: number;
  defense: number;
  magic: number;
  energy: number;
  speed: number;
};

export function computePetStats(stage: "Baby" | "Teen" | "Adult", evolutions: number, type: MoveType): ComputedPetStats {
  const base: ComputedPetStats = { health: 40, attack: 12, defense: 10, magic: 12, energy: 14, speed: 11 };
  const stageMult: Record<typeof stage, number> = { Baby: 1, Teen: 1.2, Adult: 1.45 };
  const evoBonus: ComputedPetStats = {
    health: 3 * evolutions,
    attack: 2 * evolutions,
    defense: 2 * evolutions,
    magic: 2 * evolutions,
    energy: 2 * evolutions,
    speed: 1 * evolutions,
  };
  const typeBonus: ComputedPetStats = (() => {
    switch (type) {
      case "magic":
        return { health: 0, attack: 0, defense: 0, magic: 4, energy: 1, speed: 0 };
      case "physical":
        return { health: 0, attack: 4, defense: 1, magic: 0, energy: 0, speed: 0 };
      case "elemental":
        return { health: 0, attack: 0, defense: 0, magic: 1, energy: 3, speed: 0 };
      default:
        return { health: 0, attack: 0, defense: 0, magic: 0, energy: 0, speed: 0 };
    }
  })();

  const mult = stageMult[stage];
  return {
    health: Math.round(base.health * mult + evoBonus.health + typeBonus.health),
    attack: Math.round(base.attack * mult + evoBonus.attack + typeBonus.attack),
    defense: Math.round(base.defense * mult + evoBonus.defense + typeBonus.defense),
    magic: Math.round(base.magic * mult + evoBonus.magic + typeBonus.magic),
    energy: Math.round(base.energy * mult + evoBonus.energy + typeBonus.energy),
    speed: Math.round(base.speed * mult + evoBonus.speed + typeBonus.speed),
  };
}
