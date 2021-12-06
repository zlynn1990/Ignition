import { Point } from "./Primitives/Point";
import { Vector2 } from "./Primitives/Vector2";

export enum MoleculeType {
    DiHydrogen = 0,
    DiOxygen = 1,
    DiHydrogenMonoxide = 2,
    Helium = 3,
    Methane = 4,
    CarbonDiOxide = 5
}

export interface GasParticle {
    type: MoleculeType;
    color: string;

    mass: number;
    radius: number;

    position: Point;
    velocity: Vector2;

    moved: boolean;
    collided: boolean;
}