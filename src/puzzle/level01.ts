export const WIDTH = 8;
export const HEIGHT = 12;
export type Emotion = 'ANXIETY' | 'GUILT' | 'FATIGUE' | 'ANGER';
export type Cell = Emotion | 'REPROACH' | 'SEALED_MEMORY' | 'CRACKED_MEMORY' | 'CORE' | null;
export type Pair = [Emotion, Emotion];
export const CORE_POSITION = { x: 7, y: 11 };
// A central memory cluster, approached from the surrounding space.
export const MEMORY_POSITIONS = [
  {x:2,y:9}, {x:5,y:9}, {x:3,y:8},
  {x:4,y:8}, {x:2,y:6}, {x:5,y:6}
];
export const FIXED_PAIRS: Pair[] = [
  ['ANXIETY','ANXIETY'], ['GUILT','FATIGUE'], ['GUILT','GUILT'],
  ['FATIGUE','FATIGUE'], ['ANXIETY','GUILT'], ['ANXIETY','ANXIETY'],
  ['FATIGUE','GUILT'], ['GUILT','GUILT'], ['FATIGUE','FATIGUE'],
  ['ANXIETY','FATIGUE'], ['ANXIETY','ANXIETY'], ['GUILT','GUILT'],
  ['FATIGUE','FATIGUE'], ['ANXIETY','GUILT'], ['FATIGUE','ANXIETY'],
  ['GUILT','GUILT'], ['ANXIETY','ANXIETY'], ['FATIGUE','FATIGUE']
];
export const MEMORY_THRESHOLDS = [2, 4, 6];
export const FALL_SECONDS = .8;
export const SOFT_SECONDS = .07;
export const isAnchor = (cell: Cell) => cell === 'CORE' || cell === 'SEALED_MEMORY' || cell === 'CRACKED_MEMORY';
export function initialCells(): Cell[][] {
  const cells: Cell[][] = Array.from({length: HEIGHT}, () => Array<Cell>(WIDTH).fill(null));
  // Uneven foundations: players can choose a quick release or build a higher chain.
  const foundations: [number, number, Emotion][] = [
    [0,11,'ANXIETY'],[0,10,'ANXIETY'],[2,11,'GUILT'],[2,10,'GUILT'],
    [3,11,'FATIGUE'],[4,11,'FATIGUE'],[4,10,'FATIGUE'],
    [6,11,'GUILT'],[6,10,'ANXIETY'],[6,9,'ANXIETY'],
    [3,10,'ANXIETY'],[4,9,'GUILT'],[3,9,'GUILT']
  ];
  for (const [x,y,kind] of foundations) cells[y][x]=kind;
  for (const {x,y} of MEMORY_POSITIONS) cells[y][x] = 'SEALED_MEMORY';
  cells[CORE_POSITION.y][CORE_POSITION.x] = 'CORE';
  return cells;
}
