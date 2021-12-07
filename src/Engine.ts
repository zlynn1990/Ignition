import { MoleculeType } from "./Molecules";

export interface Propellant {
    type: MoleculeType;
    fraction: number;
}

export interface Engine {
    cellMap: number[][]

    propellants: Propellant[];

    massFlow: number;
}