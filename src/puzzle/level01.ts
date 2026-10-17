export const WIDTH = 8;
export const HEIGHT = 12;
export type Emotion = 'ANXIETY' | 'GUILT' | 'FATIGUE' | 'ANGER';
export type Cell = Emotion | 'REPROACH' | 'SEALED_MEMORY' | 'CRACKED_MEMORY' | 'CORE' | null;
export type Pair = [Emotion, Emotion];
export const CORE_POSITION = { x: 7, y: 11 };
export const FIXED_PAIRS: Pair[] = [
  ['ANXIETY','ANXIETY'], ['GUILT','GUILT'], ['FATIGUE','FATIGUE'],
  ['ANXIETY','ANXIETY'], ['ANXIETY','ANXIETY'],
  ['GUILT','GUILT'], ['GUILT','GUILT'],
  ['FATIGUE','FATIGUE'], ['FATIGUE','FATIGUE'],
  ['ANXIETY','ANXIETY'], ['ANXIETY','ANXIETY'], ['GUILT','GUILT']
];
// Number of released memory obstacles, never the number of color matches.
export const MEMORY_THRESHOLDS = [2, 4, 6];
export const FALL_SECONDS = .8;
export const SOFT_SECONDS = .07;
export function initialCells(): Cell[][] {
  const cells: Cell[][] = Array.from({length: HEIGHT}, () => Array<Cell>(WIDTH).fill(null));
  for (const [x, kind] of [[0,'ANXIETY'],[2,'GUILT'],[4,'FATIGUE']] as const) {
    cells[11][x] = kind; cells[10][x] = kind;
  }
  for (const x of [1,3,5]) { cells[10][x] = 'SEALED_MEMORY'; cells[11][x] = 'SEALED_MEMORY'; }
  cells[CORE_POSITION.y][CORE_POSITION.x] = 'CORE';
  return cells;
}
