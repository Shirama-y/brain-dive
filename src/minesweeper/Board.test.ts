import {describe,it,expect} from 'vitest';
import {MinesweeperBoard,MINE_COUNT} from './Board';
import {keyOf,type Point} from './types';
const first={x:4,y:5};
describe('マインスイーパーの基本',()=>{
 it('8×8・地雷6個で最初に開くマスと周囲8マスを必ず安全にする',()=>{for(let seed=0;seed<60;seed++){for(const p of [first,{x:0,y:0},{x:7,y:7}]){const b=new MinesweeperBoard(seed);expect(b.generated).toBe(false);b.open(p);expect(b.failed).toBe(false);expect(b.tile(p)!.adjacent).toBe(0);expect(b.cells.flat().filter(c=>c.mine)).toHaveLength(MINE_COUNT);expect(b.neighbors(p).every(c=>!c.mine)).toBe(true);}}});
 it('数字は斜めを含む周囲8マスを正しく数え、外側のマスは数えない',()=>{const b=new MinesweeperBoard(42);b.open(first);for(const c of b.cells.flat()){const expected=b.cells.flat().filter(n=>n.mine&&Math.abs(n.x-c.x)<=1&&Math.abs(n.y-c.y)<=1&&(n.x!==c.x||n.y!==c.y)).length;expect(c.adjacent).toBe(expected);}expect(b.neighbors(first)).toHaveLength(8);expect(b.neighbors({x:0,y:0})).toHaveLength(3);});
 it('空白の自動展開は連続した0と周囲の数字だけを開き、地雷を開かない',()=>{const b=new MinesweeperBoard(17);b.open(first);const expected=new Set<string>(),queue=[first];while(queue.length){const p=queue.pop()!,k=keyOf(p);if(expected.has(k))continue;expected.add(k);if(!b.tile(p)!.adjacent)for(const n of b.neighbors(p))if(!n.mine)queue.push(n);}expect(new Set(b.cells.flat().filter(c=>c.open).map(keyOf))).toEqual(expected);expect(b.cells.flat().some(c=>c.mine&&c.open)).toBe(false);expect(b.opened).toBeGreaterThan(1);});
 it('未開封の地雷・数字を表示用データや説明文へ漏らさない',()=>{const b=new MinesweeperBoard(42);b.open(first);for(const c of b.cells.flat().filter(c=>!c.open)){expect(b.view(c)).toEqual({x:c.x,y:c.y,state:'closed'});expect(b.describe(c)).toContain('未開封');}const mine=b.cells.flat().find(c=>c.mine)!;b.toggleFlag(mine);expect(b.view(mine)).toEqual({x:mine.x,y:mine.y,state:'flagged',wrongFlag:false});});
 it('旗は開封を防ぎ、開いたマスには置けず、最初の旗では盤面を生成しない',()=>{const b=new MinesweeperBoard(1);b.toggleFlag(first);expect(b.generated).toBe(false);expect(b.open(first).ok).toBe(false);expect(b.moves).toBe(0);b.toggleFlag(first);b.open(first);expect(b.tile(first)!.open).toBe(true);expect(b.toggleFlag(first).ok).toBe(false);});
 it('地雷1個で失敗し、爆発座標と全地雷を表示する。失敗後は操作不能',()=>{const b=new MinesweeperBoard(23);b.open(first);const mine=b.cells.flat().find(c=>c.mine)!;expect(b.open(mine).kind).toBe('explode');expect(b.failed).toBe(true);expect(b.won).toBe(false);expect(b.view(mine)!.state).toBe('exploded');for(const c of b.cells.flat().filter(c=>c.mine&&keyOf(c)!==keyOf(mine)))expect(b.view(c)!.state).toBe('mine');const before=JSON.stringify(b);expect(b.open({x:0,y:0}).ok).toBe(false);expect(b.toggleFlag({x:0,y:0}).ok).toBe(false);expect(b.counsel().ok).toBe(false);expect(b.opened).toBe(JSON.parse(before).cells.flat().filter((c:{open:boolean;mine:boolean})=>c.open&&!c.mine).length);});
 it('旗を立てただけではクリアせず、すべての安全マスの開封で勝つ',()=>{const b=new MinesweeperBoard(4);b.open(first);for(const c of b.cells.flat().filter(c=>c.mine))b.toggleFlag(c);expect(b.won).toBe(false);for(const c of b.cells.flat().filter(c=>!c.mine))b.open(c);expect(b.won).toBe(true);expect(b.opened).toBe(58);expect(b.failed).toBe(false);});
 it('同じシード・初手は再現可能で、異なるシードは別の盤面になる',()=>{const a=new MinesweeperBoard(10),b=new MinesweeperBoard(10),c=new MinesweeperBoard(11);for(const board of [a,b,c])board.open(first);const mines=(board:MinesweeperBoard)=>board.cells.flat().filter(c=>c.mine).map(keyOf);expect(mines(a)).toEqual(mines(b));expect(mines(a)).not.toEqual(mines(c));});
 it('不正座標・開封済み・連打によって地雷や開封数を変えない',()=>{const b=new MinesweeperBoard(9);expect(b.open({x:-1,y:0}).ok).toBe(false);expect(b.generated).toBe(false);b.open(first);const count=b.opened,moves=b.moves;expect(b.open(first).ok).toBe(false);expect(b.opened).toBe(count);expect(b.moves).toBe(moves);});
});
describe('カウンセリングの安全ヒント',()=>{
 it('盤面を開いたり作り直したりせず、安全な未開封マスを見せる',()=>{const b=new MinesweeperBoard(81);b.open(first);const cellsBefore=JSON.stringify(b.cells),opened=b.opened;const hint=b.counsel();expect(hint.ok).toBe(true);expect(b.tile(hint.at!)!.mine).toBe(false);expect(b.view(hint.at!)!.state).toBe('hint');expect(b.opened).toBe(opened);expect(JSON.stringify(b.cells)).toBe(cellsBefore);expect(b.message).toContain('安全ヒント');});
 it('最初の開封前のヒントも約束を守り、別の場所を初手に選んでも安全',()=>{for(let seed=0;seed<40;seed++){const b=new MinesweeperBoard(seed);b.selected={x:7,y:7};const hint=b.counsel();b.counsel();expect(b.hints.size).toBe(3);expect(b.generated).toBe(false);b.open({x:0,y:0});expect(b.tile(hint.at!)!.mine).toBe(false);expect(b.tile({x:0,y:0})!.mine).toBe(false);}});
 it('誤った旗で安全マスをすべて塞いでも、相談で旗を外して進める',()=>{const b=new MinesweeperBoard(6);b.open(first);for(const c of b.cells.flat().filter(c=>!c.open))b.toggleFlag(c);const hint=b.counsel();expect(hint.ok).toBe(true);expect(b.tile(hint.at!)!.flagged).toBe(false);expect(b.canOpen(hint.at!)).toBe(true);expect(b.tile(hint.at!)!.mine).toBe(false);});
 it('100種類の盤面すべてで、繰り返し相談するだけでも推測なしでクリアできる',()=>{for(let seed=0;seed<100;seed++){const b=new MinesweeperBoard(seed);for(let i=0;i<120&&!b.won;i++){const hint=b.counsel();expect(hint.ok).toBe(true);expect(b.open(hint.at!).ok).toBe(true);expect(b.failed).toBe(false);}expect(b.won,`seed ${seed}`).toBe(true);expect(b.opened).toBe(58);expect(b.foundFragments).toHaveLength(3);}});
});

describe('気持ちと安心のつながり',()=>{
 it('声かけに対応する領域を優先し、相談の継続で3→5→7マスの安心が見える',()=>{
  const b=new MinesweeperBoard(8);b.generated=true;
  for(let x=0;x<6;x++)b.cells[7][x].mine=true;
  for(const c of b.cells.flat())c.adjacent=b.neighbors(c).filter(n=>n.mine).length;
  b.open({x:0,y:6});const before=JSON.stringify(b.cells);
  for(const [topic,count] of [[0,3],[1,5],[2,7]]){
   const previous=new Set(b.hints);const r=b.counsel(topic);expect(r.ok).toBe(true);
   const added=b.cells.flat().filter(c=>b.hints.has(keyOf(c))&&!previous.has(keyOf(c)));
   expect(added).toHaveLength(count);expect(added.every(c=>!c.mine&&!c.open)).toBe(true);
   expect(added.every(c=>topic===0?c.y<3:topic===1?c.y>=3&&c.y<6:c.y>=6)).toBe(true);
  }
  expect(JSON.stringify(b.cells)).toBe(before);expect(b.supportSize).toBe(7);
 });
 it('開いた安心マスに応じて患者の心理状態が変わり、相談だけでは回復扱いにならない',()=>{
  const b=new MinesweeperBoard(42);expect(b.calm).toBe(0);expect(b.mood).toBe('緊張している');
  b.counsel(1);expect(b.calm).toBe(0);b.open({x:0,y:0});
  const earlier=b.calm;for(const c of b.cells.flat().filter(c=>!c.mine))b.open(c);
  expect(b.calm).toBeGreaterThanOrEqual(earlier);expect(b.calm).toBe(100);expect(b.mood).toBe('少し落ち着いている');
 });
});

describe('マスに隠れた記憶',()=>{
 it('100種類の盤面で各領域に安全な記憶が1つずつあり、開くと一度だけ発見する',()=>{
  for(let seed=0;seed<100;seed++){
   const b=new MinesweeperBoard(seed),events:string[]=[];const firstMove=b.open(first);events.push(...(firstMove.discoveries??[]));
   for(const c of b.cells.flat().filter(c=>!c.mine&&!c.open))events.push(...(b.open(c).discoveries??[]));
   expect(events).toHaveLength(3);expect(new Set(events).size).toBe(3);expect(b.foundFragments).toEqual(events);
   const memory=b.cells.flat().filter(c=>b.view(c)?.memoryId);expect(memory).toHaveLength(3);
   expect(memory.every(c=>!c.mine&&c.open)).toBe(true);
   expect(memory.find(c=>b.view(c)?.memoryId==='reprimand')!.y).toBeLessThan(3);
   expect(memory.find(c=>b.view(c)?.memoryId==='notification')!.y).toBeGreaterThanOrEqual(3);
   expect(memory.find(c=>b.view(c)?.memoryId==='notification')!.y).toBeLessThan(6);
   expect(memory.find(c=>b.view(c)?.memoryId==='overtime')!.y).toBeGreaterThanOrEqual(6);
   for(const c of memory)expect(b.open(c).discoveries).toBeUndefined();
  }
 });
 it('未開封の記憶を表示へ漏らさず、空白の自動展開で開いた断片も取りこぼさない',()=>{
  let floodFinds=0;
  for(let seed=0;seed<30;seed++){
   const b=new MinesweeperBoard(seed);expect(b.foundFragments).toHaveLength(0);b.counsel(1);expect(b.foundFragments).toHaveLength(0);
   const r=b.open(first);floodFinds+=r.discoveries?.length??0;
   expect(b.cells.flat().filter(c=>b.view(c)?.memoryId).length).toBe(b.foundFragments.length);
   for(const c of b.cells.flat().filter(c=>!c.open))expect(b.view(c)).not.toHaveProperty('memoryId');
  }
  expect(floodFinds).toBeGreaterThan(0);
 });
 it('旗や相談だけでは発見せず、ヒントから実際に開いた時点で記録する',()=>{
  const b=new MinesweeperBoard(81),reference=new MinesweeperBoard(81);b.open(first);reference.open(first);
  for(const c of reference.cells.flat().filter(c=>!c.mine))reference.open(c);
  const target=reference.cells.flat().find(c=>reference.view(c)?.memoryId&&!b.tile(c)!.open)!;
  expect(target).toBeDefined();const before=[...b.foundFragments];b.toggleFlag(target);expect(b.open(target).ok).toBe(false);
  b.counsel(target.y<3?0:target.y<6?1:2);expect(b.foundFragments).toEqual(before);
  if(b.tile(target)!.flagged)b.toggleFlag(target);
  const r=b.open(target);expect(r.discoveries).toContain(reference.view(target)!.memoryId);
 });
 it('地雷と失敗後の入力では記憶を増やさず、再挑戦の盤面には記録を持ち越さない',()=>{
  const b=new MinesweeperBoard(7);b.open(first);const before=[...b.foundFragments];b.open(b.cells.flat().find(c=>c.mine)!);
  expect(b.foundFragments).toEqual(before);b.counsel();b.open({x:0,y:0});expect(b.foundFragments).toEqual(before);
  expect(new MinesweeperBoard(7).foundFragments).toHaveLength(0);
 });
});
