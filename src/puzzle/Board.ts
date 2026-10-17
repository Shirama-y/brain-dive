import { WIDTH, HEIGHT, isAnchor, initialCells, MEMORY_THRESHOLDS, FIXED_PAIRS, type Cell, type Emotion, type Pair } from './level01';
export type Point = { x: number; y: number };
export type Piece = Point & { rotation: number; pair: Pair };
export const OFFSETS: Point[] = [{x:0,y:-1},{x:1,y:0},{x:0,y:1},{x:-1,y:0}];
export const isEmotion = (c: Cell): c is Emotion => c === 'ANXIETY' || c === 'GUILT' || c === 'FATIGUE' || c === 'ANGER';
const neighbors = ({x,y}: Point): Point[] => [{x:x-1,y},{x:x+1,y},{x,y:y-1},{x,y:y+1}].filter(p => p.x >= 0 && p.x < WIDTH && p.y >= 0 && p.y < HEIGHT);
export function pieceCells(p: Piece): Point[] { const d = OFFSETS[p.rotation]; return [{x:p.x,y:p.y},{x:p.x+d.x,y:p.y+d.y}]; }
export function findMatches(cells: Cell[][]): Point[] {
  const seen = new Set<string>(), result: Point[] = [];
  for (let y=0;y<HEIGHT;y++) for (let x=0;x<WIDTH;x++) {
    const color = cells[y][x], key = `${x},${y}`;
    if (!isEmotion(color) || seen.has(key)) continue;
    const group: Point[] = [], stack = [{x,y}]; seen.add(key);
    while (stack.length) {
      const point = stack.pop()!; group.push(point);
      for (const n of neighbors(point)) { const k = `${n.x},${n.y}`; if (!seen.has(k) && cells[n.y][n.x] === color) { seen.add(k); stack.push(n); } }
    }
    if (group.length >= 4) result.push(...group);
  }
  return result;
}
export function applyGravity(cells: Cell[][]): void {
  // Fixed memories and the core divide each column into independent gravity segments.
  for (let x=0;x<WIDTH;x++) {
    let target = HEIGHT-1;
    for (let y=HEIGHT-1;y>=0;y--) {
      if (isAnchor(cells[y][x])) { target = y-1; continue; }
      if (cells[y][x] !== null) { const c = cells[y][x]; cells[y][x] = null; cells[target][x] = c; target--; }
    }
  }
}
export function resolve(cells: Cell[][]): { waves: Point[][]; removed: number; released: number; reproaches: number } {
  const waves: Point[][] = []; let removed = 0, released = 0, reproaches = 0;
  for (;;) {
    const matches = findMatches(cells); if (!matches.length) break;
    const adjacent = new Map<string, Point>();
    for (const p of matches) for (const n of neighbors(p)) {
      if (['REPROACH','SEALED_MEMORY','CRACKED_MEMORY'].includes(cells[n.y][n.x] ?? '')) adjacent.set(`${n.x},${n.y}`,n);
    }
    // Multiple matching neighbors damage a seal only once per wave.
    const removedObstacles: Point[] = [];
    for (const p of adjacent.values()) {
      const kind = cells[p.y][p.x];
      if (kind === 'SEALED_MEMORY') cells[p.y][p.x] = 'CRACKED_MEMORY';
      else {
        if (kind === 'CRACKED_MEMORY') released++;
        if (kind === 'REPROACH') reproaches++;
        removedObstacles.push(p);
      }
    }
    const wave = [...matches,...removedObstacles]; waves.push(wave); removed += matches.length;
    for (const p of wave) cells[p.y][p.x] = null;
    applyGravity(cells);
  }
  return { waves, removed, released, reproaches };
}
export class Board {
  cells: Cell[][];
  active: Piece | null = null;
  queue: Pair[] = [];
  turns = 0; clears = 0; memories = 0; diagnosed = 0; reproachesCleared = 0;
  pendingMemories: number[] = [];
  boss = false; won = false; failed = false; angerUnlocked = false;
  lastWaves: Point[][] = [];
  lastReleased = 0; lastDamaged = 0; lastChain = 0;
  bossAttack = false;
  private randomState: number;
  private pairIndex = 0; private angerCount = 0;
  constructor(seed = 4107, cells = initialCells()) { this.cells = cells.map(r => [...r]); this.randomState = seed; this.queue = [this.nextPair(),this.nextPair(),this.nextPair()]; this.spawn(); }
  private random() { this.randomState = (Math.imul(this.randomState,1664525) + 1013904223) >>> 0; return this.randomState / 4294967296; }
  private nextPair(): Pair {
    if (this.angerUnlocked && this.angerCount++ % 3 === 0) return ['ANGER','ANGER'];
    const fixed = FIXED_PAIRS[this.pairIndex++]; if (fixed) return [...fixed];
    const pool: Emotion[] = ['ANXIETY','GUILT','FATIGUE']; return [pool[Math.floor(this.random()*3)],pool[Math.floor(this.random()*3)]];
  }
  valid(p: Piece) { return pieceCells(p).every(({x,y}) => x>=0 && x<WIDTH && y>=0 && y<HEIGHT && this.cells[y][x] === null); }
  spawn() {
    if (this.won || this.failed) return;
    const pair = this.queue.shift()!; this.queue.push(this.nextPair());
    const piece: Piece = { x:3,y:1,rotation:0,pair };
    if (!this.valid(piece)) { this.failed = true; this.active = null; } else this.active = piece;
  }
  move(dx: number, dy = 0) {
    if (!this.active || this.failed || this.won) return false;
    const next = {...this.active, x:this.active.x+dx,y:this.active.y+dy};
    if (!this.valid(next)) return false; this.active = next; return true;
  }
  rotate(direction: number) {
    if (!this.active) return false;
    const rotation = (this.active.rotation+direction+4)%4;
    for (const [dx,dy] of [[0,0],[-1,0],[1,0],[0,-1]]) {
      const p = {...this.active,rotation,x:this.active.x+dx,y:this.active.y+dy};
      if (this.valid(p)) { this.active = p; return true; }
    }
    return false;
  }
  ghost(): Piece | null { if (!this.active) return null; const p = {...this.active}; while (this.valid({...p,y:p.y+1})) p.y++; return p; }
  preview(): {affected:Point[];chain:number;released:number} {
    const piece=this.ghost();if(!piece)return {affected:[],chain:0,released:0};
    const copy=this.cells.map(row=>[...row]);pieceCells(piece).forEach((p,i)=>{copy[p.y][p.x]=piece.pair[i];});applyGravity(copy);
    const result=resolve(copy),affected:Point[]=[];
    for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++)if((this.cells[y][x]==='SEALED_MEMORY'||this.cells[y][x]==='CRACKED_MEMORY')&&copy[y][x]!==this.cells[y][x])affected.push({x,y});
    return {affected,chain:result.waves.length,released:result.released};
  }
  drop() { if (!this.active) return; this.active = this.ghost(); this.lock(); }
  step() { if (!this.move(0,1)) this.lock(); }
  lock() {
    if (!this.active || this.won || this.failed) return;
    const points = pieceCells(this.active), pair = this.active.pair;
    points.forEach((p,i) => { this.cells[p.y][p.x] = pair[i]; });
    this.active = null; this.turns++;
    this.lastReleased = 0; this.lastDamaged = 0; this.bossAttack = false;
    const sealedBefore = this.cells.flat().filter(c=>c==='SEALED_MEMORY').length;
    // Split a horizontal pair onto its individual landing heights before matching.
    applyGravity(this.cells);
    if (this.angerUnlocked && this.memories === 3 && this.diagnosed >= 6) {
      const core: Point[] = []; for (let y=0;y<HEIGHT;y++) for (let x=0;x<WIDTH;x++) if (this.cells[y][x] === 'CORE') core.push({x,y});
      if (core.some(p => neighbors(p).some(n => this.cells[n.y][n.x] === 'ANGER'))) {
        core.forEach(p => {this.cells[p.y][p.x] = null;}); this.won = this.memories === 3 && this.diagnosed >= 6;
      }
    }
    const result = resolve(this.cells); this.lastWaves = result.waves;
    this.lastReleased = result.released; this.lastChain = result.waves.length;
    this.lastDamaged = sealedBefore - this.cells.flat().filter(c=>c==='SEALED_MEMORY').length;
    this.clears += result.waves.length;
    this.diagnosed += result.released; this.reproachesCleared += result.reproaches;
    const wasBoss = this.boss;
    while (this.memories < 3 && this.diagnosed >= MEMORY_THRESHOLDS[this.memories]) { this.memories++; this.pendingMemories.push(this.memories); }
    this.boss = this.memories > 0;
    if (this.memories === 3 && !this.angerUnlocked) {
      this.angerUnlocked = true; this.angerCount = 1;
      // Rebuild lookahead so the first guaranteed anger and later refills are at most 3 pairs apart.
      this.queue = [['ANGER','ANGER'], this.nextPair(), this.nextPair()];
    }
    if (this.boss && !wasBoss) { this.addReproach(); this.addReproach(); this.bossAttack = true; }
    else if (this.boss && this.turns % 6 === 0 && !this.won) { this.bossAttack=this.addReproach(); }
    // Caller resumes spawning only after clear/memory animation has finished.
  }
  addReproach(): boolean {
    const candidates = Array.from({length:WIDTH},(_,x)=>x).filter(x => x !== 7 && this.cells[0][x] === null && this.cells[1][x] === null && this.cells[2][x] === null);
    // Keep the spawn lane usable and the core approach open; attacks create decisions, not instant losses.
    if (!candidates.length) return false;
    const x = candidates[Math.floor(this.random()*candidates.length)];
    this.cells[0][x] = 'REPROACH'; applyGravity(this.cells); return true;
  }
  height() { let max = 0; for (let x=0;x<WIDTH;x++) for (let y=0;y<HEIGHT;y++) if (this.cells[y][x] && this.cells[y][x] !== 'CORE') {max = Math.max(max,HEIGHT-y);break;} return max; }
  hint(): string {
    if (!this.active) return '記憶をたどってから、次の一手へ。';
    let best = {score:-Infinity,x:0,rotation:0};
    for (let x=0;x<WIDTH;x++) for (let rotation=0;rotation<4;rotation++) {
      let p: Piece = {...this.active,x,y:1,rotation}; if (!this.valid(p)) continue;
      while (this.valid({...p,y:p.y+1})) p.y++;
      const copy = this.cells.map(r=>[...r]); pieceCells(p).forEach((v,i)=>{copy[v.y][v.x]=p.pair[i];}); applyGravity(copy);
      let score = 0;
      for (let y=0;y<HEIGHT;y++) for (let xx=0;xx<WIDTH;xx++) if (isEmotion(copy[y][xx])) {
        const pt = {x:xx,y}; for (const n of neighbors(pt)) {
          if (copy[n.y][n.x]===copy[y][xx]) score += 2;
          if (copy[y][xx]==='ANGER' && copy[n.y][n.x]==='CORE') score += 1000;
        }
      }
      const preview = resolve(copy);
      score += preview.removed*20 + preview.released*120 + preview.reproaches*15 + p.y*.1;
      // Even an unbroken seal is useful progress toward a diagnostic memory.
      for (let y=0;y<HEIGHT;y++) for (let xx=0;xx<WIDTH;xx++) if (this.cells[y][xx] === 'SEALED_MEMORY' && copy[y][xx] === 'CRACKED_MEMORY') score += 50;
      if (score>best.score) best={score,x,rotation};
    }
    return `${best.x+1}列目へ。${['縦・上向き','横・右向き','縦・下向き','横・左向き'][best.rotation]}で置いてみよう。`;
  }
}
