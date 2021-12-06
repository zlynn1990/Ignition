import { GasParticle } from "./GasParticle";

export enum CellType {
    Vacuum = 0,
    Metal = 1,
    Boundary = 2
}

export interface WorldCell {
    type: CellType;
    color: string;

    bounds: {
        top: number;
        bottom: number;
        left: number;
        right: number;
    };

    particles: GasParticle[];
}