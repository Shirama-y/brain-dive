import {describe,it,expect} from 'vitest';
import {ExcavationBoard} from './ExcavationBoard';
import type {Category,Point} from './TileTypes';
const p=(x:number,y:number)=>({x,y});
const classification:Record<number,Category>={1:'event',2:'others',3:'interpretation'};
function replenish(b:ExcavationBoard){if(!b.focus)b.interview(3);}
function dig(b:ExcavationBoard,x:number,y:number){if(b.tile(p(x,y))!.open)return;replenish(b);expect(b.dig(p(x,y)).ok,`dig ${x},${y}: ${b.message}`).toBe(true);}
function branch(b:ExcavationBoard,id:number){
 dig(b,4,1);dig(b,4,2);
 if(id===1){for(const [x,y]of [[3,2],[2,2],[1,2],[1,3]])dig(b,x,y);replenish(b);expect(b.observe(p(1,4)).ok).toBe(true);dig(b,1,4);dig(b,1,5);}
 if(id===2){for(const [x,y]of [[5,2],[6,2],[7,2],[8,2],[8,3]])dig(b,x,y);b.interview(0);dig(b,8,4);dig(b,8,5);}
 if(id===3){for(const [x,y]of [[4,3],[4,4],[4,5],[4,6],[4,7]])dig(b,x,y);}
}
const orders=[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]];
describe('探索の境界と可視性',()=>{
 it('10×12固定マップ、未発見の内容を説明せず上下左右だけ掘れる',()=>{const b=new ExcavationBoard();expect(b.tiles).toHaveLength(12);expect(b.tiles[0]).toHaveLength(10);expect(b.state(p(1,5))).toBe('unknown');expect(b.describe(p(1,5))).toContain('未発見');expect(b.canDig(p(4,1))).toBe(true);expect(b.canDig(p(5,1))).toBe(false);expect(b.dig(p(1,5)).ok).toBe(false);expect(b.focus).toBe(6);});
 it('掘ると通路と隣の輪郭が残り、壁・遠方・掘削済みを連打しても消費しない',()=>{const b=new ExcavationBoard();dig(b,4,1);expect(b.state(p(4,1))).toBe('excavated');expect(b.tile(p(4,2))!.seen).toBe(true);const f=b.focus;for(const point of [p(4,1),p(3,0),p(4,7),p(-1,2)])expect(b.dig(point).ok).toBe(false);expect(b.focus).toBe(f);});
 it('観察は近くの最大3マスだけ発見し、遠方では消費しない',()=>{const b=new ExcavationBoard();const before=b.discovered.length;expect(b.observe(p(4,1)).ok).toBe(true);expect(b.discovered.length-before).toBeLessThanOrEqual(3);expect(b.focus).toBe(5);expect(b.observe(p(8,9)).ok).toBe(false);expect(b.focus).toBe(5);});
 it('観察で見えた記憶や遠方タイルも隣接するまでは掘れない',()=>{const b=new ExcavationBoard();dig(b,4,1);b.observe(p(4,2));expect(b.canDig(p(4,3))).toBe(false);expect(b.memories.size).toBe(0);});
});
describe('手がかりと集中力',()=>{
 it('隠れた道には観察、会議室の防衛には問診が必要',()=>{const b=new ExcavationBoard();for(const [x,y]of [[4,1],[4,2],[3,2],[2,2],[1,2],[1,3]])dig(b,x,y);expect(b.state(p(1,4))).toBe('sealed');expect(b.dig(p(1,4)).ok).toBe(false);expect(b.message).toContain('観察');replenish(b);b.observe(p(1,4));expect(b.state(p(1,4))).toBe('diggable');dig(b,1,4);expect(b.state(p(1,4))).toBe('released');expect(b.unlocked('interview')).toBe(false);b.interview(0);expect(b.unlocked('interview')).toBe(true);});
 it('業務メモは記憶ではなく防衛をほどく手がかりになる',()=>{const b=new ExcavationBoard();for(const [x,y]of [[4,1],[4,2],[4,3],[4,4]])dig(b,x,y);expect(b.clues.has('workNote')).toBe(true);expect(b.memories.size).toBe(0);expect(b.canDig(p(4,5))).toBe(true);});
 it('集中力0でも何度でも問診で回復し、探索・記憶・謎解きの状態を保持する',()=>{const b=new ExcavationBoard();branch(b,3);while(b.focus)b.observe(p(4,7));const before={open:b.excavated,seen:b.discovered,cards:[...b.memories],clues:[...b.clues]};expect(b.dig(p(4,8)).ok).toBe(false);for(let i=0;i<4;i++){expect(b.interview(i).ok).toBe(true);expect(b.focus).toBe(6);}expect(b.excavated).toEqual(before.open);expect(b.discovered).toEqual(before.seen);expect([...b.memories]).toEqual(before.cards);expect([...b.clues]).toEqual(expect.arrayContaining(before.clues));});
 it('無効な問診・誤答で状態や集中力を壊さず、足りない情報を説明する',()=>{const b=new ExcavationBoard();expect(b.interview(99).ok).toBe(false);expect(b.classify(classification).ok).toBe(false);expect(b.connect(2,3).ok).toBe(false);expect(b.focus).toBe(6);expect(b.completed.size).toBe(0);});
});
describe('記憶の自由な発見順と最後までの到達性',()=>{
 for(const order of orders)it(`${order.join('→')} の順でも分類・残響・深層ゲートまで到達`,()=>{const b=new ExcavationBoard();for(const id of order)branch(b,id);expect([...b.memories]).toEqual(order);const focus=b.focus;expect(b.classify({1:'others',2:'event',3:'event'}).ok).toBe(false);expect(b.classify(classification).ok).toBe(true);expect(b.focus).toBe(focus);expect(b.connect(2,3).ok).toBe(false);dig(b,4,8);expect(b.sourceAvailable).toBe(true);expect(b.connect(3,2).ok).toBe(false);expect(b.connect(2,3).ok).toBe(true);dig(b,4,9);dig(b,4,10);expect(b.won).toBe(true);expect(b.gateOpen).toBe(true);expect(b.focus).toBeGreaterThanOrEqual(0);});
 it('観察で奥の残響を先に見ても、防衛を開くまでは関連づけを始めない',()=>{const b=new ExcavationBoard();for(const id of [1,2,3])branch(b,id);b.classify(classification);replenish(b);b.observe(p(4,8));expect(b.tiles[9][4].seen).toBe(true);expect(b.sourceAvailable).toBe(false);expect(b.connect(2,3).ok).toBe(false);dig(b,4,8);expect(b.sourceAvailable).toBe(true);});
 it('掘削の総当たりでは分類前の防衛・残響・ゲートを突破できない',()=>{const b=new ExcavationBoard();for(let pass=0;pass<15;pass++){b.interview(3);for(const t of b.tiles.flat())if(b.canDig(t))b.dig(t);}expect(b.completed.size).toBe(0);expect(b.won).toBe(false);expect(b.tile(p(4,8))!.open).toBe(false);expect(b.tile(p(8,4))!.open).toBe(false);expect(b.tile(p(1,4))!.open).toBe(false);});
 it('任意の通常マスを先に掘りつくしても、すべての発見順で復帰できる',()=>{for(const order of orders){const b=new ExcavationBoard();for(let pass=0;pass<20;pass++){b.interview(3);for(const t of b.tiles.flat())if(['ANXIETY','GUILT','FATIGUE','CLUE'].includes(t.kind)&&b.canDig(t))b.dig(t);}for(const id of order)branch(b,id);expect(b.classify(classification).ok).toBe(true);dig(b,4,8);b.connect(2,3);dig(b,4,9);dig(b,4,10);expect(b.won).toBe(true);}});
});
