export enum MoleculeType {
    DiHydrogen = 0,
    DiOxygen = 1,
    DiHydrogenMonoxide = 2,
    Helium = 3,
    Methane = 4,
    CarbonDiOxide = 5
}

// Gets the mass (grams) for each molecule based on mole amount
export function MolecularMass(type: MoleculeType, moles: number): number {
    switch (type) {
        case MoleculeType.DiHydrogen:
            return 2.01568 * moles;
        case MoleculeType.DiOxygen:
            return 31.999 * moles;
        case MoleculeType.DiHydrogenMonoxide:
            return 18.01528 * moles;
        case MoleculeType.Helium:
            return 4.002602 * moles;
        case MoleculeType.Methane:
            return 16.04 * moles;
        case MoleculeType.CarbonDiOxide:
            return 44.01 * moles;
        default:
            throw new Error(`Cannot compute the mass of unknown molecule ${type}!`);
    }
}