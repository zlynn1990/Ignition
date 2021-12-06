import './App.css';
import React, { useEffect, useRef } from 'react';
import { CanvasWidth, CanvasHeight, HorizontalCells, VerticalCells, CellSize } from './Constants';
import { FpsManager } from './FpsManager';
import { getBooleanFromQueryString, getNumberFromQueryString } from './Utilities';
import { drawCircle, drawRectangle, drawText, fill } from './Rendering/CanvasHelper';
import { CellType, WorldCell } from './WorldCell';
import { GasParticle, MoleculeType } from './GasParticle';
import { Vector2 } from './Primitives/Vector2';
import { VectorHelper } from './Common/VectorHelper';

// Total time of simulation
let elapsedTime: number = 0;
const burnTime = getNumberFromQueryString('burnTime', 0.02);

let deltaTime = getNumberFromQueryString('deltaTime', 0.000005);
let lastSprayTime = 0;

let context: CanvasRenderingContext2D | null;
let fpsManager = new FpsManager();

let worldCells: WorldCell[][] = [];

let energyHistory: number[] = [];

generateWorld();

function generateWorld() {
  const cellMap: number[][] = [
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 1, 2],
    [2, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 2],
    [2, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
  ];

  for (let y = 0; y < VerticalCells; y++) {
    worldCells.push([]);
    for (let x = 0; x < HorizontalCells; x++) {
      const bounds = {
        left: x * CellSize,
        right: (x + 1) * CellSize,
        top: y * CellSize,
        bottom: (y + 1) * CellSize
      };

      switch (cellMap[y][x]) {
        case 0:
          worldCells[y].push({
            type: CellType.Vacuum,
            color: '#000000',
            bounds,
            particles: []
          });
          break;
        case 1:
          worldCells[y].push({
            type: CellType.Metal,
            color: '#b0b0b0',
            bounds,
            particles: []
          });
          break;
        case 2:
          worldCells[y].push(
            {
              type: CellType.Boundary,
              color: '#272727',
              bounds,
              particles: []
            }
          );
          break;
      }
    }
  }
}

const scaleFactor: number = 200;

function render(timeStamp: number) {
  if (context === null) return;

  // Clear the frame the ambient intensity
  fill(context, '#000000');

  let kineticEnergy = 0;

  if (lastSprayTime > 0.0002 && elapsedTime < burnTime) {
    lastSprayTime = 0;

    // H2/LOX Fuel injectors
    // for (let y = 7; y < 15; y++) {
    //   worldCells[y][18].particles.push(
    //     {
    //       type: MoleculeType.DiHydrogen,
    //       color: '#FF0000',
    //       radius: 0.015,
    //       mass: 2.016,
    //       position: { x: 18 * CellSize, y: y * CellSize },
    //       velocity: { x: -400 * Math.random(), y: 100 * (Math.random() - 0.5) },
    //       moved: false,
    //       collided: false
    //     },
    //     {
    //       type: MoleculeType.DiOxygen,
    //       color: '#FFFFFF',
    //       radius: 0.025,
    //       mass: 16,
    //       position: { x: 18 * CellSize, y: y * CellSize },
    //       velocity: { x: -400 * Math.random(), y: 100 * (Math.random() - 0.5) },
    //       moved: false,
    //       collided: false
    //     });
    // }

    // Fuel injectors
    for (let y = 7; y < 15; y++) {
      worldCells[y][18].particles.push(
        {
          type: MoleculeType.Methane,
          color: '#cda77b',
          radius: 0.02,
          mass: 16.04,
          position: { x: 18 * CellSize, y: (y + 0.5) * CellSize },
          velocity: { x: -500 * Math.random(), y: 100 * (Math.random() - 0.5) },
          moved: false,
          collided: false
        },
        {
          type: MoleculeType.DiOxygen,
          color: '#FFFFFF',
          radius: 0.03,
          mass: 63.998,
          position: { x: 18 * CellSize, y: y * CellSize },
          velocity: { x: -500 * Math.random(), y: 100 * (Math.random() - 0.5) },
          moved: false,
          collided: false
        }
      );
    }
  }

  // Spark ignition
  if (elapsedTime > 0.003 && elapsedTime < 0.005) {
    worldCells[6][14].particles.push(
      {
        type: MoleculeType.Helium,
        color: '#ff9e9e',
        radius: 0.02,
        mass: 4.002602,
        position: { x: 12 * CellSize, y: 6 * CellSize },
        velocity: { x: 600 * (Math.random() - 0.5), y: 2000 },
        moved: false,
        collided: false
      }
    );
  }

  // Reset all particles before moving and collision detection
  for (let y = 0; y < VerticalCells; y++) {
    for (let x = 0; x < HorizontalCells; x++) {
      const cell: WorldCell = worldCells[y][x];

      for (let particle of cell.particles) {
        particle.moved = false;
        particle.collided = false;
      }
    }
  }

  // Update particles
  for (let y = 0; y < VerticalCells; y++) {
    for (let x = 0; x < HorizontalCells; x++) {
      const cell: WorldCell = worldCells[y][x];

      for (let i = 0; i < cell.particles.length; i++) {
        const particle: GasParticle = cell.particles[i];

        // Skip particles already updated
        if (particle.moved) continue;

        // Step by the velocity
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        particle.moved = true;

        // Test if the particle moved to the left out of the cell
        if (particle.position.x < cell.bounds.left) {
          const leftCell: WorldCell = worldCells[y][x - 1];

          switch (leftCell.type) {
            case CellType.Vacuum: // Move it to the next cell
              cell.particles.splice(i--, 1);
              leftCell.particles.push(particle);
              break;
            case CellType.Metal: // Reflect velocity for a metal wall
              particle.position.x = cell.bounds.left;
              particle.velocity.x = -particle.velocity.x;
              break;
            case CellType.Boundary: // Remove a particle on the boundary

              cell.particles.splice(i--, 1);
              break;
          }

          continue;
        }

        // Test if the particle moved to the right out of the cell
        if (particle.position.x > cell.bounds.right) {
          const rightCell: WorldCell = worldCells[y][x + 1];

          switch (rightCell.type) {
            case CellType.Vacuum: // Move it to the next cell
              cell.particles.splice(i--, 1);
              rightCell.particles.push(particle);
              break;
            case CellType.Metal: // Reflect velocity for a metal wall

              let speed = VectorHelper.Length(particle.velocity);
              kineticEnergy += 0.5 * (particle.mass / 1000) * speed * speed;

              particle.position.x = cell.bounds.right;
              particle.velocity.x = -particle.velocity.x;
              break;
            case CellType.Boundary: // Remove a particle on the boundary
              cell.particles.splice(i--, 1);
              break;
          }

          continue;
        }

        // Test if the particle moved to the top out of the cell
        if (particle.position.y < cell.bounds.top) {
          const topCell: WorldCell = worldCells[y - 1][x];

          switch (topCell.type) {
            case CellType.Vacuum: // Move it to the next cell
              cell.particles.splice(i--, 1);
              topCell.particles.push(particle);
              break;
            case CellType.Metal: // Reflect velocity for a metal wall
              particle.position.y = cell.bounds.top;
              particle.velocity.y = -particle.velocity.y;
              break;
            case CellType.Boundary: // Remove a particle on the boundary
              cell.particles.splice(i--, 1);
              break;
          }

          continue;
        }

        // Test if the particle moved to the bottom out of the cell
        if (particle.position.y > cell.bounds.bottom) {
          const bottomCell: WorldCell = worldCells[y + 1][x];

          switch (bottomCell.type) {
            case CellType.Vacuum: // Move it to the next cell
              cell.particles.splice(i--, 1);
              bottomCell.particles.push(particle);
              break;
            case CellType.Metal: // Reflect velocity for a metal wall
              particle.position.y = cell.bounds.bottom;
              particle.velocity.y = -particle.velocity.y;
              break;
            case CellType.Boundary: // Remove a particle on the boundary
              cell.particles.splice(i--, 1);
              break;
          }

          continue;
        }

        // Detect and resolve collisions when the particle hasn't already collided
        // and there are at least two particles in the cell to test
        if (!particle.collided && cell.particles.length > 1) {
          for (let j = 0; j < cell.particles.length; j++) {
            // Don't check for the same particle or other particles that have already collided
            if (i === j || cell.particles[j].collided) continue;

            const particle2: GasParticle = cell.particles[j];

            const positionDelta: Vector2 = {
              x: particle.position.x - particle2.position.x,
              y: particle.position.y - particle2.position.y
            };

            const distance: number = VectorHelper.Length(positionDelta);
            const radiiSum = particle.radius + particle2.radius;

            // If the distance between the particles is less than their combined radii they have collided
            // https://stackoverflow.com/questions/35211114/2d-elastic-ball-collision-physics
            // https://stackoverflow.com/questions/345838/ball-to-ball-collision-detection-and-handling
            if (distance < radiiSum && distance > 0.005) {

              // Minimum translation distance to push balls apart after intersecting
              const mtd: Vector2 = VectorHelper.Multiply(positionDelta, ((radiiSum) - distance) / distance);
              const mtdNormal: Vector2 = VectorHelper.Normalize(mtd);

              // Impact speed
              const impactVelocity: Vector2 = VectorHelper.Subtract(particle.velocity, particle2.velocity);
              const impactSpeed: number = VectorHelper.Dot(impactVelocity, mtdNormal);

              // Decide if combustion occurs
              if (Math.abs(impactSpeed) > 1300) {

                // Hydrogen combustion
                // H2 + 0.5 O2 −→ H2O + 286,000 joules
                if ((particle.type === MoleculeType.DiHydrogen && particle2.type === MoleculeType.DiOxygen) ||
                  (particle.type === MoleculeType.DiOxygen && particle2.type === MoleculeType.DiHydrogen)) {
                  // Convert to water
                  particle.type = MoleculeType.DiHydrogenMonoxide;
                  particle.color = '#4ea2ea'
                  particle.mass = 18.01528;
                  particle.radius = 0.03;

                  const randomNormal: Vector2 = VectorHelper.Random();

                  particle.velocity = VectorHelper.Add(particle.velocity, VectorHelper.Multiply(randomNormal, 2000));
                  particle.collided = true;

                  // Remove other particle
                  cell.particles.splice(j, 1);
                  break;
                }

                // Methane combustion
                // CH4 + 2O2 −→ CO2 + 2H2O + 890,000 joules
                if ((particle.type === MoleculeType.Methane && particle2.type === MoleculeType.DiOxygen) ||
                  (particle.type === MoleculeType.DiOxygen && particle2.type === MoleculeType.Methane)) {
                  // Generate one CO2 molecule
                  particle.type = MoleculeType.CarbonDiOxide;
                  particle.color = '#93ffaf'
                  particle.mass = 44.01;
                  particle.radius = 0.03;

                  const randomNormal: Vector2 = VectorHelper.Random();

                  // Each CO2 molecule takes 56% (200,324 joules) of the kinetic energy 44.01 / 80.038
                  particle.velocity = VectorHelper.Add(particle.velocity, VectorHelper.Multiply(randomNormal, 2500));
                  particle.collided = true;

                  // Remove other particle
                  cell.particles.splice(j, 1);

                  // Generate two water molecules
                  for (let o = 0; o < 2; o++) {
                    const randomNormal: Vector2 = VectorHelper.Random();

                    // Each water molecule takes 22% (200,324 joules) of the kinetic energy 18.01528 / 80.038
                    let waterParticle: GasParticle = {
                      type: MoleculeType.DiHydrogenMonoxide,
                      color: '#4ea2ea',
                      mass: 18.01528,
                      radius: 0.03,
                      position: particle.position,
                      velocity: VectorHelper.Add(particle.velocity, VectorHelper.Multiply(randomNormal, 2500)),
                      collided: true,
                      moved: true
                    };

                    cell.particles.push(waterParticle);
                  }
                  break;
                }
              }

              // Inverse mass quantities
              const iMass1: number = 1.0 / particle.mass;
              const iMass2: number = 1.0 / particle2.mass;

              // Push-pull them apart based off their mass
              particle.position = VectorHelper.Add(particle.position, VectorHelper.Multiply(mtd, iMass1 / (iMass1 + iMass2)));
              particle2.position = VectorHelper.Subtract(particle2.position, VectorHelper.Multiply(mtd, iMass2 / (iMass1 + iMass2)));

              // Collision impulse
              const impulse: number = -2.0 * impactSpeed / (iMass1 + iMass2);
              const impulseVector: Vector2 = VectorHelper.Multiply(mtdNormal, impulse);

              const particleImpulse: Vector2 = VectorHelper.Multiply(impulseVector, iMass1);
              const particle2Impulse: Vector2 = VectorHelper.Multiply(impulseVector, iMass2);

              // Change in momentum
              particle.velocity = VectorHelper.Add(particle.velocity, particleImpulse);
              particle2.velocity = VectorHelper.Subtract(particle2.velocity, particle2Impulse);
            }

            particle.collided = true;
            particle2.collided = true;
          }
        }
      }
    }
  }

  // Draw BG cells
  for (let y = 0; y < VerticalCells; y++) {
    for (let x = 0; x < HorizontalCells; x++) {
      const cell: WorldCell = worldCells[y][x];

      drawRectangle(context,
        {
          x: cell.bounds.left * scaleFactor,
          y: cell.bounds.top * scaleFactor
        },
        {
          x: cell.bounds.right * scaleFactor,
          y: cell.bounds.bottom * scaleFactor
        },
        cell.color);

      if (getBooleanFromQueryString('debug', 'false') && cell.type === CellType.Vacuum) {
        drawText(context,
          {
            x: (x + 0.25) * CellSize * scaleFactor,
            y: (y + 0.5) * CellSize * scaleFactor
          },
          `${cell.particles.length}`, 'white');
      }
    }
  }

  // Draw particles
  for (let y = 0; y < VerticalCells; y++) {
    for (let x = 0; x < HorizontalCells; x++) {
      const cell: WorldCell = worldCells[y][x];

      for (let particle of cell.particles) {
        drawCircle(context,
          {
            x: particle.position.x * scaleFactor,
            y: particle.position.y * scaleFactor
          },
          particle.radius * scaleFactor, particle.color);
      }
    }
  }

  energyHistory.unshift(kineticEnergy);

  if (energyHistory.length > 100) {
    energyHistory.pop();
  }

  let avgEnergy = energyHistory.reduce((a, b) => a + b, 0) / 1000;

  elapsedTime += deltaTime;
  lastSprayTime += deltaTime;

  fpsManager.update(timeStamp);

  if (getBooleanFromQueryString('debug', 'false')) {
    let fps: number = fpsManager.Current;

    drawText(context, { x: 10, y: CanvasHeight - 20 }, `FPS: ${fps}`, 'white');
  }

  drawText(context, { x: 10, y: 20 }, `Time: ${elapsedTime.toFixed(3)} seconds`, 'white');
  drawText(context, { x: 350, y: 20 }, `Kinetic Energy: ${avgEnergy.toFixed(1)} KJ`, 'white');

  // Use in debug for stepping by much smaller frame intervals
  //setTimeout(() => window.requestAnimationFrame(render), 10);

  window.requestAnimationFrame(render);
}

function App() {
  const outputCanvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (outputCanvas.current) {
      context = outputCanvas.current.getContext('2d');
      if (context) {
        window.requestAnimationFrame(render);
      }
    }
  }, [outputCanvas]);

  return (
    <div className="App">
      <canvas ref={outputCanvas} width={CanvasWidth} height={CanvasHeight} />
    </div>
  );
}

export default App;
