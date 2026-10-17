import { describe, expect, it } from 'vitest';
import { Board, applyGravity, findMatches, pieceCells, resolve, type Piece } from './Board';
import { HEIGHT, WIDTH, type Cell } from './level01';
const empty = (): Cell[][] => Array.from({length:HEIGHT},()=>Array<Cell>(WIDTH).fill(null));
function place(board:Board,x:number,rotation=0){expect(board.active).not.toBeNull();board.active={...board.active!,x,rotation};expect(board.valid(board.active)).toBe(true);board.drop();}
function resume(board:Board){board.pendingMemories=[];board.spawn();}
describe('4連結と連鎖',()=>{
  it('縦と横の4連結を消す。斜めと3個は消さない',()=>{
    const c=empty();for(let i=0;i<4;i++){c[11][i]='GUILT';c[i][7]='ANXIETY';c[i+3][i]='FATIGUE';}c[9][1]='ANGER';c[9][2]='ANGER';c[9][3]='ANGER';
    expect(findMatches(c)).toHaveLength(8);
  });
  it('5個以上のグループもまとめて消す',()=>{const c=empty();for(let i=0;i<6;i++)c[11][i]='GUILT';expect(findMatches(c)).toHaveLength(6);});
  it('固定核を越えず、各区間で重力をかける',()=>{const c=empty();c[8][0]='CORE';c[1][0]='GUILT';c[5][0]='ANXIETY';c[9][0]='FATIGUE';applyGravity(c);expect(c[6][0]).toBe('GUILT');expect(c[7][0]).toBe('ANXIETY');expect(c[8][0]).toBe('CORE');expect(c[11][0]).toBe('FATIGUE');expect(c.flat().filter(Boolean)).toHaveLength(4);});
  it('消去後の重力で2連鎖を起こす',()=>{const c=empty();for(let x=0;x<4;x++)c[11][x]='ANXIETY';c[10][0]='GUILT';c[10][1]='GUILT';c[10][2]='GUILT';c[9][3]='GUILT';const r=resolve(c);expect(r.waves).toHaveLength(2);expect(r.removed).toBe(8);expect(c.flat().filter(Boolean)).toHaveLength(0);});
  it('隣接叱責を除去するが、核と遠い叱責を残す',()=>{const c=empty();for(let x=0;x<4;x++)c[11][x]='FATIGUE';c[10][1]='REPROACH';c[11][5]='REPROACH';c[10][2]='CORE';resolve(c);expect(c.flat().filter(v=>v==='REPROACH')).toHaveLength(1);expect(c[10][2]).toBe('CORE');});
  it('叱責は4つつながっても消えない',()=>{const c=empty();for(let i=0;i<4;i++)c[11][i]='REPROACH';expect(findMatches(c)).toHaveLength(0);});
});
describe('ペア操作と出現',()=>{
  it('左右端で盤面外へ出ず、壁蹴りで回転する',()=>{const b=new Board(1,empty());b.active={x:0,y:3,rotation:0,pair:['ANXIETY','GUILT']};expect(b.move(-1)).toBe(false);expect(b.rotate(-1)).toBe(true);expect(pieceCells(b.active!).every(p=>p.x>=0)).toBe(true);b.active={...b.active!,x:7,rotation:0};expect(b.move(1)).toBe(false);expect(b.rotate(1)).toBe(true);expect(pieceCells(b.active!).every(p=>p.x<8)).toBe(true);});
  it('塞がった回転と移動を拒否する',()=>{const b=new Board(1,empty());b.active={x:3,y:2,rotation:0,pair:['GUILT','GUILT']};for(let y=0;y<5;y++)for(let x=0;x<8;x++)if(!pieceCells(b.active).some(p=>p.x===x&&p.y===y))b.cells[y][x]='REPROACH';expect(b.rotate(1)).toBe(false);expect(b.move(1)).toBe(false);});
  it('出現位置が塞がれば即失敗',()=>{const c=empty();c[0][3]='REPROACH';const b=new Board(1,c);expect(b.failed).toBe(true);expect(b.active).toBeNull();});
  it('ゴーストと実際の着地点が一致し、水平ペアが分離落下する',()=>{const c=empty();c[11][4]='CORE';const b=new Board(1,c);b.active={x:3,y:1,rotation:1,pair:['GUILT','FATIGUE']};const g=b.ghost()!;expect(g.y).toBe(10);b.drop();expect(b.cells[11][3]).toBe('GUILT');expect(b.cells[10][4]).toBe('FATIGUE');expect(b.turns).toBe(1);});
  it('同じシードで同じ出現順',()=>{const a=new Board(932),b=new Board(932);for(let i=0;i<30;i++){expect(a.active?.pair).toEqual(b.active?.pair);a.cells=empty();b.cells=empty();a.drop();b.drop();resume(a);resume(b);}});
});
describe('ステージ進行',()=>{
  it('記憶1以降のみ、6ターンごとに叱責を落とす',()=>{const b=new Board(1,empty());b.turns=5;place(b,0);expect(b.cells.flat().includes('REPROACH')).toBe(false);b.memories=1;b.diagnosed=2;b.boss=true;resume(b);b.turns=11;place(b,1);expect(b.cells.flat().filter(c=>c==='REPROACH')).toHaveLength(1);resume(b);place(b,2);expect(b.cells.flat().filter(c=>c==='REPROACH')).toHaveLength(1);});
  it('空き列がなければ妨害を省略する',()=>{const b=new Board(1,empty());b.cells[0].fill('REPROACH');expect(b.addReproach()).toBe(false);});
  it('通常色や未解放の怒りでは勝利しない',()=>{const b=new Board(1,empty());b.cells[11][7]='CORE';place(b,6);expect(b.won).toBe(false);expect(b.cells[11][7]).toBe('CORE');const c=new Board(1,empty());c.cells[11][7]='CORE';c.active={...c.active!,x:6,pair:['ANGER','ANGER']};c.drop();expect(c.won).toBe(false);expect(c.cells[11][7]).toBe('CORE');});
  it('固定手順でおじゃま2・4・6個の解放、怒り解放、核無力化まで完走できる',()=>{
    const b=new Board();const triggered:number[]=[];
    for(const x of [0,2,4,0,0,2,2,4,4]){place(b,x);triggered.push(...b.pendingMemories);if(b.pendingMemories.length)expect(b.active).toBeNull();resume(b);expect(b.failed).toBe(false);}
    expect(triggered).toEqual([1,2,3]);expect(b.clears).toBe(6);expect(b.diagnosed).toBe(6);expect(b.memories).toBe(3);expect(b.active!.pair).toEqual(['ANGER','ANGER']);place(b,7);expect(b.won).toBe(true);expect(b.cells.flat().includes('CORE')).toBe(false);
  });
  it('解放後も3ペアごとに怒りが補充される',()=>{const b=new Board(1,empty());b.memories=3;b.diagnosed=6;place(b,0);resume(b);const angerIndices:number[]=[];for(let i=0;i<13;i++){if(b.active!.pair.includes('ANGER'))angerIndices.push(i);b.cells=empty();place(b,i%6);resume(b);}expect(angerIndices[0]).toBe(0);for(let i=1;i<angerIndices.length;i++)expect(angerIndices[i]-angerIndices[i-1]).toBeLessThanOrEqual(3);});
  it('ヒントは盤面やペアを変更せず、核の隣を案内する',()=>{const b=new Board();b.angerUnlocked=true;b.memories=3;b.active!.pair=['ANGER','ANGER'];const before=JSON.stringify(b.cells);expect(b.hint()).toContain('7列目');expect(JSON.stringify(b.cells)).toBe(before);});
});

describe('おじゃまの解放が診断の根拠になる',()=>{
  it('感情を何回消しても、記憶のおじゃまを取り除かなければ診断は進まない',()=>{
    const b=new Board(1,empty());b.clears=20;
    for(let x=0;x<2;x++){b.cells[10][x]='ANXIETY';b.cells[11][x]='ANXIETY';}
    place(b,5);expect(b.clears).toBe(21);expect(b.diagnosed).toBe(0);expect(b.memories).toBe(0);expect(b.boss).toBe(false);
  });
  it('封印は隣接消去で一度だけひびになり、2回目で解放される',()=>{
    const c=empty();for(let x=0;x<4;x++)c[11][x]='ANXIETY';c[10][1]='SEALED_MEMORY';
    const first=resolve(c);expect(first.released).toBe(0);expect(c[11][1]).toBe('CRACKED_MEMORY');
    for(let y=8;y<12;y++)c[y][0]='GUILT';const second=resolve(c);expect(second.released).toBe(1);expect(c.flat().includes('CRACKED_MEMORY')).toBe(false);
  });
  it('隣接する同色が複数あっても、1波で封印を二重に削らない',()=>{
    const c=empty();c[11][1]='SEALED_MEMORY';c[10][1]='FATIGUE';c[10][0]='FATIGUE';c[11][0]='FATIGUE';c[9][0]='FATIGUE';
    expect(resolve(c).released).toBe(0);expect(c[11][1]).toBe('CRACKED_MEMORY');
  });
  it('最初の診断記憶を解放すると上司が現れ、その場でおじゃまを増やす',()=>{
    const b=new Board();place(b,0);resume(b);expect(b.memories).toBe(0);place(b,2);
    expect(b.diagnosed).toBe(2);expect(b.memories).toBe(1);expect(b.boss).toBe(true);expect(b.cells.flat().filter(c=>c==='REPROACH')).toHaveLength(2);
  });
  it('上司が増やした叱責だけを消しても診断記憶は増えない',()=>{
    const b=new Board(1,empty());for(let y=8;y<12;y++)b.cells[y][0]='ANXIETY';b.cells[11][1]='REPROACH';place(b,5);
    expect(b.reproachesCleared).toBe(1);expect(b.diagnosed).toBe(0);expect(b.memories).toBe(0);
  });
  it('封印ブロックは同種4個でも消えず、診断前に核を壊せない',()=>{
    const b=new Board(1,empty());for(let x=0;x<4;x++)b.cells[11][x]='SEALED_MEMORY';expect(findMatches(b.cells)).toHaveLength(0);
    b.angerUnlocked=true;b.memories=3;b.cells[11][7]='CORE';b.active!.pair=['ANGER','ANGER'];place(b,7);expect(b.won).toBe(false);expect(b.cells[11][7]).toBe('CORE');
  });
});
