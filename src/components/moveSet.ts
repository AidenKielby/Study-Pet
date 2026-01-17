import { Move } from "./move";

export type MoveId =
	| "plasma-bite"
	| "nebula-pulse"
	| "gravity-slam"
	| "ion-siphon"
	| "warp-feint"
	| "comet-lance"
	| "aurora-shell"
	| "quasar-burst"
	| "stellar-mend"
	| "luminous-bloom";

export type MoveDefinition = {
	id: MoveId;
	name: string;
	description: string;
	move: Move;
};

export type MoveType = "any" | "magic" | "physical" | "elemental";

// Lightweight catalogue of premade alien-pet style moves.
export const moveSet: Record<MoveId, MoveDefinition> = {
	"plasma-bite": {
		id: "plasma-bite",
		name: "Plasma Bite",
		description: "Superheated fangs leave a charged burn and boost bite strength.",
		move: new Move(18, "attack", 2, 6, "physical", 1),
	},
	"nebula-pulse": {
		id: "nebula-pulse",
		name: "Nebula Pulse",
		description: "Ripples of cosmic dust erode foes while priming magic control.",
		move: new Move(15, "magic", 3, 7, "magic", 2),
	},
	"gravity-slam": {
		id: "gravity-slam",
		name: "Gravity Slam",
		description: "Compress the target under sudden gravity, raising own defense.",
		move: new Move(22, "defense", 4, 8, "physical", 3),
	},
	"ion-siphon": {
		id: "ion-siphon",
		name: "Ion Siphon",
		description: "Drain ionized energy to damage and slightly refill stamina.",
		move: new Move(14, "energy", 2, 4, "elemental", 2),
	},
	"warp-feint": {
		id: "warp-feint",
		name: "Warp Feint",
		description: "Short warps make strikes unpredictable, boosting evasion.",
		move: new Move(12, "speed", 3, 3, "physical", 1),
	},
	"comet-lance": {
		id: "comet-lance",
		name: "Comet Lance",
		description: "Piercing comet tip hits hard and leaves a shimmering trail.",
		move: new Move(28, "attack", 1, 10, "elemental", 3),
	},
	"aurora-shell": {
		id: "aurora-shell",
		name: "Aurora Shell",
		description: "Wraps the pet in aurora light, reducing damage next turn.",
		move: new Move(8, "defense", 5, 5, "magic", 0),
	},
	"quasar-burst": {
		id: "quasar-burst",
		name: "Quasar Burst",
		description: "High-cost star core blast that amplifies spell potency after use.",
		move: new Move(34, "magic", 4, 12, "elemental", 4),
	},
	"stellar-mend": {
		id: "stellar-mend",
		name: "Stellar Mend",
		description: "Pulls radiant dust into wounds for a mid-battle heal.",
		move: new Move(0, "health", 24, 6, "magic", 2),
	},
	"luminous-bloom": {
		id: "luminous-bloom",
		name: "Luminous Bloom",
		description: "Photosynthetic flare chips foes while rejuvenating the caster.",
		move: new Move(10, "health", 14, 5, "elemental", 2),
	},
};

export const moveList: MoveDefinition[] = Object.values(moveSet);

// Returns up to `numMoves` unique random moves filtered by tag; `any` ignores tag filtering.
export function getRandomMove(
	type: MoveType,
	numMoves: number
): MoveDefinition[] {
	if (numMoves <= 0) return [];

	const pool = type === "any" ? moveList : moveList.filter(m => m.move.tag === type);
	if (pool.length === 0) return [];

	const shuffled = [...pool];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}

	return shuffled.slice(0, Math.min(numMoves, shuffled.length));
}

// Builds a five-move set: four from the pet's main type, one from a random other type.
export function buildPetMoveIds(petType: MoveType): MoveId[] {
	const primaryType = petType === "any" ? pickRandomType(["magic", "physical", "elemental"]) : petType;
	const otherTypes = ["magic", "physical", "elemental"].filter(t => t !== primaryType);

	const primaryPool = moveList.filter(m => m.move.tag === primaryType);
	const otherPool = moveList.filter(m => otherTypes.includes(m.move.tag));
	const anyPool = moveList;

	const takeFromPool = (pool: MoveDefinition[], count: number): MoveId[] => {
		if (pool.length === 0) return [];
		const shuffled = shuffle([...pool]);
		const result: MoveId[] = [];
		for (let i = 0; i < count; i++) {
			result.push(shuffled[i % shuffled.length].id);
		}
		return result;
	};

	const primary = takeFromPool(primaryPool, 4);
	const offTypeSource = otherPool.length > 0 ? otherPool : anyPool;
	const offType = takeFromPool(offTypeSource, 1);

	return [...primary, ...offType];
}

function shuffle<T>(arr: T[]): T[] {
	for (let i = arr.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[arr[i], arr[j]] = [arr[j], arr[i]];
	}
	return arr;
}

function pickRandomType(types: MoveType[]): MoveType {
	const filtered = types.filter(Boolean);
	if (filtered.length === 0) return "any";
	return filtered[Math.floor(Math.random() * filtered.length)] as MoveType;
}
