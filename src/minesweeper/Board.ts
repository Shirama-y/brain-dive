import {keyOf,type Point,type Cell,type CellView,type MoveResult} from './types';
export const WIDTH=8,HEIGHT=8,MINE_COUNT=6;
export const FEELINGS=['叱責の記憶','自分を責める声','疲れ'];
export const feelingAt=(p:Point)=>p.y<3?0:p.y<6?1:2;
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
 get supportSize(){return Math.min(7,3+this.counselings*2);}
 get calm(){return Math.round(this.opened/this.safeTotal*100);}
 get mood(){return this.calm<35?'緊張している':this.calm<75?'呼吸が整ってきた':'少し落ち着いている';}
 get voice(){return this.calm<35?'また叱られる気がして、胸が苦しいです。':this.calm<75?'ひとつずつなら、向き合えそうです。':'全部を自分のせいにしなくても、いいのかもしれません。';}
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
  return `${FEELINGS[feelingAt(p)]}：未開封。数字は近くの不安の核の数。迷ったら話を聞き、金色の安心マスを開きましょう。最初の一手は安全です。`;
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
 counsel(topic=0):MoveResult{
  if(this.finished)return {ok:false,message:'再挑戦してからカウンセリングを行ってください。'};
  topic=Math.max(0,Math.min(2,Math.floor(topic)));const count=this.supportSize;this.counselings++;
  // Before generation, repeat the existing promise so six mine slots always remain available.
  const existing=[...this.hints].map(k=>this.cells.flat().find(c=>keyOf(c)===k)!).filter(c=>!c.open);
  let targets:Cell[];
  if(!this.generated&&existing.length)targets=existing;
  else {
   const safe=this.cells.flat().filter(c=>!c.open&&!c.mine&&!this.hints.has(keyOf(c)));
   safe.sort((a,b)=>Number(feelingAt(b)===topic)-Number(feelingAt(a)===topic)||Number(a.flagged)-Number(b.flagged)||Number(this.neighbors(b).some(n=>n.open))-Number(this.neighbors(a).some(n=>n.open))||Math.abs(a.x-this.selected.x)+Math.abs(a.y-this.selected.y)-Math.abs(b.x-this.selected.x)-Math.abs(b.y-this.selected.y));
   targets=safe.slice(0,count);
   if(!targets.length)targets=this.cells.flat().filter(c=>!c.mine&&!c.open).slice(0,count);
  }
  if(!targets.length)return {ok:false,message:'安心できるマスはすべて開いています。'};
  for(const c of targets){this.hints.add(keyOf(c));c.flagged=false;}
  const c=targets[0];this.selected={x:c.x,y:c.y};
  return this.result({ok:true,kind:'hint',at:{x:c.x,y:c.y},message:`「${FEELINGS[topic]}」について話せた。安全ヒント：金色の ${targets.length} マスは安心して開けます。${c.x+1}列${c.y+1}行から。相談を重ねると最大7マス見えてきます。`});
 }
}
