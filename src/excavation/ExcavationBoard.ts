import {createLevel,WIDTH,HEIGHT} from './level01';
import {keyOf,TILE_NAMES,type Tile,type Point,type Requirement,type Category,type TileState} from './TileTypes';
import {memoryCards,interviewQuestions} from '../data/memory01';
export interface ActionResult {ok:boolean;message:string;memory?:number;kind?:'dig'|'observe'|'unlock'|'win';at?:Point}
/** No timers, gravity, randomization, or renderer state in the excavation model. */
export class ExcavationBoard {
 readonly width=WIDTH;readonly height=HEIGHT;tiles=createLevel();
 focus=6;readonly maxFocus=6;memories=new Set<number>();clues=new Set<string>();completed=new Set<string>();
 interviews=0;gateOpen=false;won=false;selected:Point={x:4,y:1};message='光の縁を掘り、通路を広げよう。中央で3方向に分かれます。';
 get sourceAvailable(){return this.completed.has('classified')&&this.tiles[8][4].open&&this.tiles[9][4].seen;}
 get boss(){return this.completed.has('classified');}
 get depth(){return Math.max(...this.tiles.flat().filter(t=>t.open).map(t=>t.y));}
 constructor(){this.revealFrontier();}
 tile(p:Point){return this.tiles[p.y]?.[p.x];}
 neighbors(p:Point){return [{x:p.x-1,y:p.y},{x:p.x+1,y:p.y},{x:p.x,y:p.y-1},{x:p.x,y:p.y+1}].map(v=>this.tile(v)).filter((t):t is Tile=>!!t);}
 adjacent(p:Point){return this.neighbors(p).some(t=>t.open);}
 accessible(p:Point){const t=this.tile(p);return !!t&&t.seen&&(t.open||this.adjacent(p));}
 unlocked(requirement?:Requirement){return !requirement||requirement==='observe'&&this.clues.has('hiddenRoute')||requirement==='interview'&&this.clues.has('interview')||requirement==='workNote'&&this.clues.has('workNote')||requirement==='classified'&&this.completed.has('classified')||requirement==='source'&&this.completed.has('source');}
 state(p:Point):TileState{const t=this.tile(p);if(!t?.seen)return 'unknown';if(t.open)return t.released?'released':'excavated';if(t.requires&&!this.unlocked(t.requires))return 'sealed';return this.adjacent(p)&&t.kind!=='WALL'?'diggable':'discovered';}
 canDig(p:Point){const t=this.tile(p);return !!t&&t.seen&&!t.open&&t.kind!=='WALL'&&this.adjacent(p)&&this.unlocked(t.requires)&&this.focus>0&&!this.won;}
 revealFrontier(){for(const t of this.tiles.flat().filter(t=>t.open))for(const n of this.neighbors(t))n.seen=true;}
 describe(p:Point){const t=this.tile(p);if(!t?.seen)return '未発見：通路を広げるか、近くで観察してください。';
 if(t.open)return t.released?'解放済みの通路。記憶と手がかりは保持されています。':'掘削済みの通路。ここから隣を観察できます。';
 if(t.kind==='WALL')return '思考の壁：ここは掘れません。光の縁のある道を探しましょう。';
 if(!this.adjacent(p))return `${TILE_NAMES[t.kind]}：通路と上下左右で接する場所まで進んでください。`;
 if(!this.unlocked(t.requires))return this.requirementHint(t.requires!);
 if(this.focus===0)return '集中力が尽きました。「問診」で回復できます。掘った場所は残ります。';
 return t.kind==='MEMORY'?'記憶の輪郭：掘って、この場面を受けとめます。':`${TILE_NAMES[t.kind]}：掘ることで通路になります（集中力 −1）。`;}
 requirementHint(r:Requirement){return {observe:'隠れた通路：このマスを選び「観察」。光の切れ目を探します。',interview:'防衛：問診の「会議室では、何がありましたか？」で手がかりを得ます。',workNote:'防衛：中心の通路にある「業務メモ」を掘って調べてください。',classified:'防衛：記憶3枚を集め、「記憶」で出来事・他者の言葉・本人の解釈に整理します。',source:'残響：「記憶」で上司の言葉と本人の解釈の出どころを結びつけてください。'}[r];}
 private result(result:ActionResult){this.message=result.message;return result;}
 dig(p:Point):ActionResult{
 this.selected={...p};if(!this.canDig(p))return this.result({ok:false,message:this.describe(p)});
 const t=this.tile(p)!;this.focus--;t.open=true;t.released=!!t.requires;this.revealFrontier();let message='通路が開いた。隣の輪郭が見えてきた。';
 if(t.kind==='CLUE'){this.clues.add('workNote');message='業務メモ：「担当が一人分ではない」。中心の防衛にひびが入った。';}
 if(t.kind==='MEMORY'){this.memories.add(t.memory!);message=this.memories.size===3?'3つの記憶が揃った。「記憶」で整理しよう。':'記憶の断片を発見。順番は自由です。';}
 if(t.kind==='GATE'){this.gateOpen=true;this.won=true;message='出来事と言葉の出どころがつながった。診療室へ戻ろう。';}
 if(this.focus===0&&!this.won)message+=' 集中力0。「問診」で回復できます。';
 return this.result({ok:true,message,memory:t.memory,kind:this.won?'win':t.requires?'unlock':'dig',at:{...p}});
 }
 observe(p:Point):ActionResult{
 if(this.won||!this.accessible(p))return this.result({ok:false,message:'観察は、通路または通路に接する発見済みの場所で行います。'});
 if(!this.focus)return this.result({ok:false,message:'「問診」で集中力を回復してから観察しましょう。'});
 this.focus--;const t=this.tile(p)!;let message='周囲を観察した。';
 if(t.kind==='HIDDEN'&&this.adjacent(t)){this.clues.add('hiddenRoute');message='光の切れ目を発見。この隠れた通路を掘れます。';}
 const candidates=this.tiles.flat().filter(n=>!n.seen&&Math.abs(n.x-p.x)+Math.abs(n.y-p.y)<=2).sort((a,b)=>Number(a.kind==='WALL')-Number(b.kind==='WALL'));
 for(const n of candidates.slice(0,3))n.seen=true;
 const nearby=this.tiles.flat().some(n=>n.kind==='MEMORY'&&!n.open&&Math.abs(n.x-p.x)+Math.abs(n.y-p.y)<=2);
 if(nearby)message+=' 近くに、白金の光と微かな音の気配。';else if(!candidates.length&&t.kind!=='HIDDEN')message+=' 新しい輪郭はない。別の分岐も調べよう。';
 return this.result({ok:true,message,kind:t.kind==='HIDDEN'?'unlock':'observe',at:{...p}});
 }
 interview(index:number):ActionResult{
 const q=interviewQuestions[index];if(!q||this.won)return {ok:false,message:'質問を選んでください。'};
 this.clues.add(q.clue);this.interviews++;this.focus=this.maxFocus;
 return this.result({ok:true,kind:q.clue==='interview'?'unlock':'observe',message:`${q.answer} 集中力が6に回復。探索した道は残っています。`});
 }
 classify(assignments:Partial<Record<number,Category>>):ActionResult{
 if(this.memories.size<3)return this.result({ok:false,message:'3つの記憶を見つけると、分類できます。'});
 if(!memoryCards.every(m=>assignments[m.id]===m.category))return this.result({ok:false,message:'時刻の記録は出来事。引用された声は他者の言葉。「自分が悪い」は本人の解釈です。もう一度整理しましょう。'});
 this.completed.add('classified');return this.result({ok:true,kind:'unlock',message:'「全部、自分のせいだと思っていました」——奥の防衛がひび割れた。次は言葉の出どころを結ぼう。'});
 }
 connect(bossCard:number,selfCard:number):ActionResult{
 if(!this.sourceAvailable)return this.result({ok:false,message:'分類した記憶を持って、地図の奥の防衛を開き、残響に近づきましょう。'});
 if(bossCard!==2||selfCard!==3)return this.result({ok:false,message:'会議室で上司が言った言葉と、帰り道に本人が考えた言葉を区別しましょう。何度でも選び直せます。'});
 this.completed.add('source');return this.result({ok:true,kind:'unlock',message:'「あの声」と「自分の考え」は同じではない。残響は奥へ退き、深層ゲートの封印がほどけた。'});
 }
 get excavated(){return this.tiles.flat().filter(t=>t.open).map(keyOf);}
 get discovered(){return this.tiles.flat().filter(t=>t.seen).map(keyOf);}
}
