import type {Art} from './Art';
import type {Point} from '../minesweeper/types';
export class MinesweeperEffects {
 remaining=0;point:Point={x:4,y:5};kind='open';
 start(point:Point,kind:string){this.point={...point};this.kind=kind;this.remaining=kind==='open'?.12:.35;}
 update(dt:number){this.remaining=Math.max(0,this.remaining-dt);}
 draw(a:Art,reduced:boolean){if(!this.remaining)return;const p=1-this.remaining/(this.kind==='open'?.12:.35),x=106+this.point.x*12,y=25+this.point.y*12;a.c.save();a.c.globalAlpha=Math.min(1,this.remaining*6);for(let i=0;i<8;i++){const angle=i*Math.PI/4;a.rect(x+Math.cos(angle)*p*(reduced?4:12),y+Math.sin(angle)*p*(reduced?4:12),1,1,this.kind==='hint'?'#ffe3aa':'#b4a5d8');}a.c.restore();}
}
