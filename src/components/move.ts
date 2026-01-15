export class Move {
    dammageDealt: number;
    statRaised: string;
    statIncreaser: number;
    energyCost: number;
    tag: "magic" | "physical" | "elemental";
    effectTiming: number;

    constructor(
        dammageDealt: number,
        statRaised: string,
        statIncreaser: number,
        energyCost: number,
        tag: "magic" | "physical" | "elemental",
        effectTiming: number,

    ) {
        this.dammageDealt = dammageDealt,
        this.statRaised = statRaised,
        this.statIncreaser = statIncreaser,
        this.energyCost= energyCost,
        this.tag = tag,
        this.effectTiming = effectTiming
    }

    getDammageDealt(){
        return this.dammageDealt;
    }

    getStatRaised(){
        return this.statRaised;
    }
    getStatIncreaser(){
        return this.statIncreaser;
    }

    getEnergyCost(){
        return this.energyCost;
    }

    getTag(){
        return this.tag;
    }
}