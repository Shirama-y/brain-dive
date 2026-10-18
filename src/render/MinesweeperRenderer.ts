import type {Art} from './Art';
import type {MinesweeperBoard} from '../minesweeper/Board';
import type {MinesweeperEffects} from './MinesweeperEffects';
export const MAP={x:100,y:31,cell:15,width:120,height:120};
export const NUMBER_COLORS=['#d7d6dd','#82b9f3','#89d6b1','#ef91ac','#b7a0fa','#f2bd79','#7ee0dd','#e3cbdc','#ffffff'];
export class MinesweeperRenderer {
 draw(a:Art,b:MinesweeperBoard,time:number,reduced:boolean,effects:MinesweeperEffects){
  const c=a.c;a.brain(time,reduced,false);a.rect(0,0,320,180,'#10132a55');a.rect(3,7,79,155,'#080c17d6');a.rect(227,7,90,155,'#080c17eb');
  a.text('CASE 01 / MINESWEEPER',9,13,'#b7a4c5',4);a.text('月曜の朝',9,25,'#eddfd4',9);
  a.text(b.mood,9,45,'#b4a3bc',6);a.text(`安心 ${b.calm}%`,9,59,'#e4cba6',10);a.rect(9,76,64,3,'#332b41');a.rect(9,76,64*b.opened/b.safeTotal,3,'#bda0d4');
  a.text(`不安の核 ${b.mineCount}`,9,91,'#d0bbcc',6);a.text(`カウンセリング ${b.counselings} 回`,9,110,'#ad9eb8',5);a.wrapped('上：叱責の記憶\n中：自責の声\n下：疲れ',9,125,70,'#b4a5c0',6,11);
  a.box(98,29,124,124,'#71617d','#080c19');
  for(const cell of b.cells.flat()){
   const v=b.view(cell)!,x=MAP.x+cell.x*15+2,y=MAP.y+cell.y*15+2;
   if(v.state==='open'){a.rect(x,y,11,11,cell.y<3?'#2c243b':cell.y<6?'#212f3b':'#24362f');if(v.adjacent)a.text(String(v.adjacent),x+5.5,y+1,NUMBER_COLORS[v.adjacent],8,'center');else a.rect(x+5,y+5,1,1,'#45465c');}
   else if(v.state==='mine'||v.state==='exploded'){a.box(x,y,11,11,v.state==='exploded'?'#ed8fa6':'#6d425a',v.state==='exploded'?'#9d2a4d':'#321b33');a.eye(x+5,y+5,4,0,'#f3beca');a.line([[x+5,y+1],[x+5,y+9]],'#1e1323');}
   else{a.box(x,y,11,11,v.state==='hint'?'#edcf96':'#655170',v.state==='hint'?'#584c40':'#342b48');a.rect(x+2,y+2,6,1,'#ffffff12');
    if(v.state==='flagged'){a.line([[x+4,y+2],[x+4,y+9],[x+8,y+9]],'#ddd0df');a.polygon([[x+4,y+2],[x+9,y+3],[x+4,y+6]],v.wrongFlag?'#77717d':'#e991ad');}
    if(v.state==='hint'){a.text('◇',x+5,y+1,'#ffe9b4',8,'center');}
   }
   if(b.selected.x===cell.x&&b.selected.y===cell.y){c.strokeStyle='#fff1c2';c.lineWidth=.8;c.strokeRect(x-.5,y-.5,12,12);}
  }
  a.text(b.failed?'爆発':b.view(b.selected)?.state==='hint'?'安全ヒント':'選択中',233,15,'#e6c8dc',8);a.wrapped(b.describe(b.selected),233,33,77,'#c0b1c9',6,10);
  a.text('左クリック：開く',233,113,'#cbb8d5',5);a.text('右クリック：旗',233,125,'#cbb8d5',5);a.text(`相談で安全${b.supportSize}マス`,233,146,'#d6c0a9',5);
  effects.draw(a,reduced);a.rect(4,166,312,12,'#080a14ee');a.text(b.message.length>50?b.message.slice(0,49)+'…':b.message,9,170,'#d6bfd3',5);
 }
}
