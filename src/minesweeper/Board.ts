import {keyOf,type Point,type Cell,type CellView,type MoveResult} from './types';
export const WIDTH=10,HEIGHT=12,MINE_COUNT=18;
/** Pure Minesweeper model. Hidden mine locations never enter the UI projection. */
export class MinesweeperBoard {
 readonly width=WIDTH;readonly height=HEIGHT;readonly mineCount=MINE_COUNT;
 cells:Cell[][]=Array.from({length:HEIGHT},(_,y)=>Array.from({length:WIDTH},(_,x)=>({x,y,mine:false,open:false,flagged:false,adjacent:0})));
 generated=false;failed=false;won=false;moves=0;counselings=0;selected:Point={x:4,y:5};exploded?:Point;
 hints=new Set<string>();message='数字は周囲8マスの地雷の数。地雷以外をすべて開こう。最初の一手は安全です。';
 private randomState:number;
 constructor(seed=Date.now()){this.randomState=seed>>>0;}
 tile(p:Point){return this.cells[p.y]?.[p.x];}
 neighbors(p:Point){const result:Cell[]=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const c=this.tile({x:p.x+dx,y:p.y+dy});if(c)result.push(c);}return result;}
 get safeTotal(){return this.width*this.height-this.mineCount;}
 get opened(){return this.cells.flat().filter(c=>c.open&&!c.mine).length;}
 get flags(){return this.cells.flat().filter(c=>c.flagged).length;}
 get finished(){return this.failed||this.won;}
 private random(){this.randomState=(Math.imul(1664525,this.randomState)+1013904223)>>>0;return this.randomState/4294967296;}
 private generate(first:Point){
  const protectedCells=new Set([keyOf(first),...this.neighbors(first).map(keyOf),...this.hints]);
  const candidates=this.cells.flat().filter(c=>!protectedCells.has(keyOf(c)));
  for(let i=candidates.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[candidates[i],candidates[j]]=[candidates[j],candidates[i]];}
  for(const c of candidates.slice(0,this.mineCount))c.mine=true;
  for(const c of this.cells.flat())c.adjacent=this.neighbors(c).filter(n=>n.mine).length;
  this.generated=true;
 }
 view(p:Point):CellView|undefined{const c=this.tile(p);if(!c)return;
  if(this.failed&&c.mine)return {x:p.x,y:p.y,state:this.exploded&&keyOf(this.exploded)===keyOf(c)?'exploded':'mine'};
  if(c.open)return {x:p.x,y:p.y,state:'open',adjacent:c.adjacent};
  if(c.flagged)return {x:p.x,y:p.y,state:'flagged',wrongFlag:this.failed&&!c.mine};
  return {x:p.x,y:p.y,state:this.hints.has(keyOf(c))?'hint':'closed'};
 }
 canOpen(p:Point){const c=this.tile(p);return !!c&&!this.finished&&!c.open&&!c.flagged;}
 describe(p:Point){const v=this.view(p);if(!v)return '盤面の中を選んでください。';
  if(v.state==='exploded'||v.state==='mine')return '地雷。患者がパニックに陥り、セッションを続けられなくなった。';
  if(v.state==='flagged')return v.wrongFlag?'安全なマスに置かれていた旗です。':'旗：地雷と思う場所の印。旗を外すまで開きません。';
  if(v.state==='hint')return '安全ヒント：カウンセリングで見えた、地雷のないマスです。開いて大丈夫。';
  if(v.state==='open')return v.adjacent?`周囲8マスに地雷が ${v.adjacent} 個あります。斜めも数えます。`:'周囲8マスに地雷はありません。';
  return this.generated?'未開封：数字を手がかりに開くか、地雷と思う場所に旗を立てましょう。':'未開封：最初に開くマスとその周囲には地雷を置きません。';
 }
 private result(r:MoveResult){this.message=r.message;return r;}
 open(p:Point):MoveResult{
  this.selected={x:p.x,y:p.y};if(!this.canOpen(p))return this.result({ok:false,message:this.describe(p)});
  if(!this.generated)this.generate(p);const first=this.tile(p)!;this.moves++;
  if(first.mine){first.open=true;this.exploded={x:p.x,y:p.y};this.failed=true;return this.result({ok:true,kind:'explode',at:{x:p.x,y:p.y},message:'地雷が爆発した。患者の中で、抑えていた声があふれ出す。'});}
  const queue=[first];while(queue.length){const c=queue.pop()!;if(c.open||c.flagged||c.mine)continue;c.open=true;if(c.adjacent===0)for(const n of this.neighbors(c))if(!n.open&&!n.mine&&!n.flagged)queue.push(n);}
  this.won=this.opened===this.safeTotal;
  return this.result({ok:true,kind:this.won?'win':'open',at:{x:p.x,y:p.y},message:this.won?'安全なマスをすべて開いた。患者の呼吸が落ち着いてきた。':`${this.opened} / ${this.safeTotal} マスを開いた。迷ったらカウンセリングで安全なヒントを得られます。`});
 }
 toggleFlag(p:Point):MoveResult{const c=this.tile(p);this.selected={x:p.x,y:p.y};if(!c||c.open||this.finished)return {ok:false,message:'未開封のマスに旗を立てられます。'};
  c.flagged=!c.flagged;return this.result({ok:true,kind:'flag',at:{x:p.x,y:p.y},message:c.flagged?'旗を立てた。旗は印なので、正解とは限りません。':'旗を外した。このマスを開けるようになりました。'});
 }
 counsel():MoveResult{
  if(this.finished)return {ok:false,message:'再挑戦してからカウンセリングを行ってください。'};
  this.counselings++;
  // Before the first reveal, promise one safe cell without generating or leaking a board.
  if(!this.generated){const existing=[...this.hints][0];let target=existing?this.cells.flat().find(c=>keyOf(c)===existing)!:this.tile(this.selected)??this.cells[5][4];this.hints.add(keyOf(target));target.flagged=false;this.selected={x:target.x,y:target.y};return this.hintResult(target);}
  const safe=this.cells.flat().filter(c=>!c.mine&&!c.open&&!this.hints.has(keyOf(c)));
  // Prefer the frontier next to numbers, but guarantee a hint even behind mistaken flags.
  safe.sort((a,b)=>Number(a.flagged)-Number(b.flagged)||Number(this.neighbors(b).some(n=>n.open))-Number(this.neighbors(a).some(n=>n.open))||Math.abs(a.x-this.selected.x)+Math.abs(a.y-this.selected.y)-Math.abs(b.x-this.selected.x)-Math.abs(b.y-this.selected.y));
  const target=safe[0]??this.cells.flat().find(c=>!c.mine&&!c.open);
  if(!target)return {ok:false,message:'安全なマスはすべて開いています。'};
  this.hints.add(keyOf(target));target.flagged=false;this.selected={x:target.x,y:target.y};return this.hintResult(target);
 }
 private hintResult(c:Cell){return this.result({ok:true,kind:'hint',at:{x:c.x,y:c.y},message:`安全ヒント：${c.x+1}列${c.y+1}行。金色のマスには地雷がありません。旗があれば外しました。`});}
}
