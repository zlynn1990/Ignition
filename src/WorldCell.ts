import { GasParticle } from "./GasParticle";

export interface WorldCell {
    solid: boolean;

    bounds: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };

    particles: GasParticle[];
}