import { Point } from "./Primitives/Point";
import { Vector2 } from "./Primitives/Vector2";

export interface GasParticle {
    symbol: string;

    mass: number;
    radius: number;

    position: Point;
    velocity: Vector2;

    moved: boolean;
    collided: boolean;

    color: string;
}