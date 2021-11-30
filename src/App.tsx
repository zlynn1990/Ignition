import './App.css';
import React, { useEffect, useRef } from 'react';
import { CanvasWidth, CanvasHeight, HorizontalCells, VerticalCells, CellSize } from './Constants';
import { FpsManager } from './FpsManager';
import { getBooleanFromQueryString } from './Utilities';
import { drawCircle, drawRectangle, drawText, fill } from './Rendering/CanvasHelper';
import { WorldCell } from './WorldCell';
import { GasParticle } from './GasParticle';
import { Vector2 } from './Primitives/Vector2';
import { VectorHelper } from './Common/VectorHelper';

// Total time of simulation
let elapsedTime: number = 0;
let deltaTime = 0.00001;

let context: CanvasRenderingContext2D | null;
let fpsManager = new FpsManager();

let worldCells: WorldCell[][] = [];

generateWorld();

function generateWorld() {
  for (let y = 0; y < VerticalCells; y++) {
    worldCells.push([]);
    for (let x = 0; x < HorizontalCells; x++) {
      const solid: boolean = y === 0 || y === VerticalCells - 1 || x === 0 || x === HorizontalCells - 1 || (y === 8 && x !== 5);

      const bounds = {
        left: x * CellSize,
        right: (x + 1) * CellSize,
        top: y * CellSize,
        bottom: (y + 1) * CellSize
      };

      if (solid) {
        worldCells[y].push({
          solid: true,
          bounds,
          particles: []
        });
      } else if (y > 8) {
        worldCells[y].push({
          solid: false,
          bounds,
         // particles: []
          particles: [
            {
              symbol: 'N2',
              mass: 1,
              radius: 0.02,
              position: { x: (x + 0.5) * CellSize, y: (y + 0.5) * CellSize },
              velocity: { x: 200 * (Math.random() - 0.5), y: 500 * (Math.random() - 0.5) },
              moved: true,
              collided: false,
              color: '#b9ee8e'
            },
            {
              symbol: 'N2',
              mass: 1,
              radius: 0.02,
              position: { x: (x + 0.5) * CellSize, y: (y + 0.5) * CellSize },
              velocity: { x: 200 * (Math.random() - 0.5), y: 500 * (Math.random() - 0.5) },
              moved: true,
              collided: false,
              color: '#b9ee8e'
            },
            {
              symbol: 'N2',
              mass: 1,
              radius: 0.02,
              position: { x: (x + 0.5) * CellSize, y: (y + 0.5) * CellSize },
              velocity: { x: 2000 * (Math.random() - 0.5), y: 500 * (Math.random() - 0.5) },
              moved: true,
              collided: false,
              color: '#b9ee8e'
            },
            {
              symbol: 'N2',
              mass: 1,
              radius: 0.02,
              position: { x: (x + 0.5) * CellSize, y: (y + 0.5) * CellSize },
              velocity: { x: 200 * (Math.random() - 0.5), y: 5000 * (Math.random() - 0.5) },
              moved: true,
              collided: false,
              color: '#b9ee8e'
            }
          ]
        });
      } else {
        worldCells[y].push({
          solid: false,
          bounds,
          particles: []
        });
      }
    }
  }

  // worldCells[5][1].particles.push({
  //   symbol: 'N2',
  //   mass: 1,
  //   radius: 0.02,
  //   position: { x: 5.5 * CellSize, y: 1.2 * CellSize },
  //   velocity: { x: 0, y: 500 },
  //   moved: true,
  //   collided: false,
  //   color: '#b9ee8e'
  // });

  // worldCells[5][5].particles.push({
  //   symbol: 'N2',
  //   mass: 1,
  //   radius: 0.02,
  //   position: { x: 5.5 * CellSize, y: 5 * CellSize },
  //   velocity: { x: 0, y: -200 },
  //   moved: true,
  //   collided: false,
  //   color: '#FF0000'
  // });

  // worldCells[5][5].particles.push({
  //   symbol: 'N2',
  //   mass: 1,
  //   radius: 0.02,
  //   position: { x: 5 * CellSize, y: (5 + 0.5) * CellSize },
  //   velocity: { x: -2000, y: 0 },
  //   moved: true,
  //   collided: false,
  //   color: '#b9ee8e'
  // });

  // worldCells[6][5].particles.push({
  //   symbol: 'N2',
  //   mass: 1,
  //   radius: 0.02,
  //   position: { x: (6 + 0.5) * CellSize, y: (5 + 0.5) * CellSize },
  //   velocity: { x: 300, y: 0 },
  //   moved: true,
  //   collided: false,
  //   color: '#FF0000'
  // });
}

const scaleFactor: number = 200;

function render(timeStamp: number) {
  if (context === null) return;

  // Clear the frame the ambient intensity
  fill(context, `#000000`);

  // Reset all particles before moving and collision detection
  for (let y = 0; y < VerticalCells; y++) {
    for (let x = 0; x < HorizontalCells; x++) {
      const cell: WorldCell = worldCells[y][x];

      for (let particle of cell.particles) {
        particle.moved = true;
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
        if (!particle.moved) continue;

        // Step by the velocity
        particle.position.x += particle.velocity.x * deltaTime;
        particle.position.y += particle.velocity.y * deltaTime;
        particle.moved = false;

        // Test if the particle moved to the left out of the cell
        if (particle.position.x < cell.bounds.left) {
          const leftCell: WorldCell = worldCells[y][x - 1];

          // Reflect velocity for a solid cell
          if (leftCell.solid) {
            particle.position.x = cell.bounds.left;
            particle.velocity.x = -particle.velocity.x;
          } else { // Otherwise move it to the next cell
            cell.particles.splice(i--, 1);
            leftCell.particles.push(particle);
          }

          continue;
        }

        // Test if the particle moved to the right out of the cell
        if (particle.position.x > cell.bounds.right) {
          const rightCell: WorldCell = worldCells[y][x + 1];

          // Reflect velocity for a solid cell
          if (rightCell.solid) {
            particle.position.x = cell.bounds.right;
            particle.velocity.x = -particle.velocity.x;
          } else { // Otherwise move it to the next cell
            cell.particles.splice(i--, 1);
            rightCell.particles.push(particle);
          }

          continue;
        }

        // Test if the particle moved to the top out of the cell
        if (particle.position.y < cell.bounds.top) {
          const topCell: WorldCell = worldCells[y - 1][x];

          // Reflect velocity for a solid cell
          if (topCell.solid) {
            particle.position.y = cell.bounds.top;
            particle.velocity.y = -particle.velocity.y;
          } else { // Otherwise move it to the next cell
            cell.particles.splice(i--, 1);
            topCell.particles.push(particle);
          }

          continue;
        }

        // Test if the particle moved to the bottom out of the cell
        if (particle.position.y > cell.bounds.bottom) {
          const bottomCell: WorldCell = worldCells[y + 1][x];

          // Reflect velocity for a solid cell
          if (bottomCell.solid) {
            particle.position.y = cell.bounds.bottom;
            particle.velocity.y = -particle.velocity.y;
          } else { // Otherwise move it to the next cell
            cell.particles.splice(i--, 1);
            bottomCell.particles.push(particle);
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
            if (distance < radiiSum && distance > 0.0001) {
              // Minimum translation distance to push balls apart after intersecting
              const mtd: Vector2 = VectorHelper.Multiply(positionDelta, ((radiiSum) - distance) / distance);
              const mtdNormal: Vector2 = VectorHelper.Normalize(mtd);

              // Inverse mass quantities
              const iMass1: number = 1.0 / particle.mass;
              const iMass2: number = 1.0 / particle2.mass;

              // Push-pull them apart based off their mass
              particle.position = VectorHelper.Add(particle.position, VectorHelper.Multiply(mtd, iMass1 / (iMass1 + iMass2)));
              particle2.position = VectorHelper.Subtract(particle2.position, VectorHelper.Multiply(mtd, iMass2 / (iMass1 + iMass2)));

              // Impact speed
              const impactVelocity: Vector2 = VectorHelper.Subtract(particle.velocity, particle2.velocity);
              const impactSpeed: number = VectorHelper.Dot(impactVelocity, mtdNormal);

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

      let color: string = cell.solid ? '#d6d6d6' : '#676767';

      drawRectangle(context,
        {
          x: cell.bounds.left * scaleFactor,
          y: cell.bounds.top * scaleFactor
        },
        {
          x: cell.bounds.right * scaleFactor,
          y: cell.bounds.bottom * scaleFactor
        },
        color);

      // drawText(context,
      //   {
      //     x: (x + 0.25) * CellSize * scaleFactor,
      //     y: (y + 0.5) * CellSize * scaleFactor
      //   },
      //   `${cell.particles.length}`, 'white');
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

  elapsedTime += deltaTime;

  fpsManager.update(timeStamp);

  if (getBooleanFromQueryString('debug', 'true')) {
    let fps: number = fpsManager.Current;

    //drawText(context, { x: 10, y: 30 }, `FPS: ${fps}`, 'white');
    drawText(context, { x: 10, y: 20 }, `Time: ${elapsedTime.toFixed(3)} seconds`, 'black');
  }

  //setTimeout(() => window.requestAnimationFrame(render), 50);

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
