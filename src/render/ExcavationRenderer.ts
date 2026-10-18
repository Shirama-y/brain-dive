import type {Art} from './Art';
import type {ExcavationBoard} from '../excavation/ExcavationBoard';
import {TILE_NAMES} from '../excavation/TileTypes';
import type {ExcavationEffects} from './ExcavationEffects';
export const MAP={x:111,y:25,cell:10,width:100,height:120};
export class ExcavationRenderer {
 draw(a:Art,b:ExcavationBoard,time:number,reduced:boolean,effects:ExcavationEffects){
 const c=a.c;a.brain(time,reduced,false);a.rect(0,0,320,180,b.depth<4?'#09183855':b.depth<8?'#39133555':'#24061577');
 a.rect(3,7,101,155,'#080c17e8');a.rect(218,7,99,155,'#080c17ed');
 a.text('CASE 01 / EXCAVATION',9,14,'#b0a6bf',5);a.text('月曜の朝',9,25,'#eee0d5',9);
 a.text(b.depth<3?'表層 / 感情の輪郭':b.depth<8?'中層 / 日常の記憶':'深層 / 声の出どころ',9,43,'#c99abb',6);
 a.text(`記憶 ${b.memories.size} / 3`,9,60,'#e9cc96',8);a.text('集中力 / カウンセラー',9,78,'#ae9cac',5);
 for(let i=0;i<6;i++)a.box(9+i*13,89,10,6,i<b.focus?'#b6b8df':'#3b354b',i<b.focus?'#7469ab':'#131221');
 a.text(`${b.focus} / 6`,9,101,'#d8d2e4',7);a.wrapped(b.focus?'光の縁を選んで掘る。\n通路は残ります。':'問診で集中力を回復。\n探索はいつでも再開。',9,117,88,'#a69aae',6,10);
 a.text(`探索 ${b.excavated.length} マス`,9,147,'#81748d',5);
 a.box(109,23,104,124,'#6d5878','#0a0d19');
 for(const t of b.tiles.flat()){
 const x=MAP.x+t.x*10,y=MAP.y+t.y*10,state=b.state(t);a.rect(x,y,9,9,'#11111e');
 if(state==='unknown'){a.rect(x+4,y+4,1,1,'#242238');continue;}
 if(t.open){a.rect(x,y,9,9,t.released?'#423849':'#25283f');a.rect(x+4,y+4,1,1,'#a09ab3');}
 else if(['ANXIETY','GUILT','FATIGUE'].includes(t.kind))a.block(t.kind as 'ANXIETY'|'GUILT'|'FATIGUE',x,y);
 else if(t.kind==='WALL'){a.rect(x,y,9,9,'#242031');a.line([[x+2,y+2],[x+5,y+3],[x+4,y+6]],'#40384d');}
 else if(t.kind==='MEMORY'){a.box(x,y,9,9,'#ecd9a1','#8a7260');a.rect(x+3,y+2,3,5,'#fff0cb');}
 else if(t.kind==='CLUE'){a.rect(x+2,y+1,6,7,'#b8d8da');for(let j=0;j<3;j++)a.rect(x+3,y+2+j*2,3,1,'#455565');}
 else if(t.kind==='ECHO'){a.rect(x,y,9,9,'#63263e');a.eye(x+4,y+4,4,reduced?0:time*1.2,'#da8b9b');}
 else if(t.kind==='GATE'){a.box(x,y,9,9,'#e0bfd8','#241a33');a.rect(x+4,y+1,1,7,'#ede3d5');}
 else{a.box(x,y,9,9,state==='sealed'?'#5f476c':'#baa4df','#30213f');if(state==='sealed'){a.rect(x+3,y+2,3,5,'#6d5481');a.rect(x+4,y+5,1,1,'#ead5e4');}else a.line([[x+5,y+1],[x+3,y+4],[x+5,y+7]],'#e1cda2');}
 if(state==='diggable'){c.strokeStyle='#e5d4f0';c.lineWidth=.45;c.strokeRect(x+.3,y+.3,8.4,8.4);}
 if(b.selected.x===t.x&&b.selected.y===t.y){c.strokeStyle='#fff0b2';c.lineWidth=.8;c.strokeRect(x-.6,y-.6,10.2,10.2);}
 }
 const selected=b.tile(b.selected);a.text(selected?.seen?TILE_NAMES[selected.kind]:'未発見',224,15,'#e1c6dc',8);
 a.wrapped(b.describe(b.selected),224,31,86,'#c2b2cb',6,10);
 if(b.boss){c.save();c.globalAlpha=b.completed.has('source')?.22:.72;
  // A large original face remains in the background; it is an obstacle, never an enemy.
  c.translate(268,108);c.scale(b.completed.has('source')?.7:1.35,b.completed.has('source')?.7:1.35);a.polygon([[-20,-18],[-10,-27],[15,-24],[24,-10],[18,16],[0,27],[-18,14]],'#73334b');
  a.eye(-8,-5,7,reduced?0:time*.7,'#deb1bd');a.eye(10,-6,7,reduced?0:time*.53,'#d8a8b1');a.rect(-5,11,13,reduced?3:3+Math.round(Math.sin(time*1.7)), '#180f20');c.restore();
  a.text(b.completed.has('source')?'遠ざかる残響':'「代わりはいくらでも」',268,148,'#b8849c',5,'center');
 }else{a.text('掘る / 観察',224,114,'#c9b4d5',6);a.text('記憶 / 問診',224,128,'#c9b4d5',6);}
 if(b.completed.has('source')){a.line([[126,80],[156,100],[196,80]],'#c5bed9',.6);a.line([[156,100],[156,130]],'#c5bed9',.6);}
 effects.draw(a,reduced);a.rect(4,164,312,14,'#080a14ef');a.text(b.message.length>48?b.message.slice(0,47)+'…':b.message,9,168,'#d6c3d5',5);
 }
}
