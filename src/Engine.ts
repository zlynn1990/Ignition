import { MoleculeType } from "./GasParticle";

export interface Engine {
    cellMap: number[][]

    propellants: MoleculeType[];
}