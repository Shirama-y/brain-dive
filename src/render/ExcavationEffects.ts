import type {Art} from './Art';
import type {Point} from '../excavation/TileTypes';
export class ExcavationEffects {
 remaining=0;point:Point={x:4,y:0};kind='dig';
 start(point:Point,kind:string){this.point={...point};this.kind=kind;this.remaining=kind==='dig'?.2:.45;}
 update(dt:number){this.remaining=Math.max(0,this.remaining-dt);}
 draw(a:Art,reduced:boolean){if(!this.remaining)return;const p=1-this.remaining/(this.kind==='dig'?.2:.45),x=111+this.point.x*10+5,y=25+this.point.y*10+5;
  a.c.save();a.c.globalAlpha=Math.min(1,this.remaining*5);
  if(this.kind==='dig'){for(let i=0;i<8;i++){const angle=i*Math.PI/4;a.rect(x+Math.cos(angle)*p*(reduced?4:13),y+Math.sin(angle)*p*(reduced?4:10)+p*p*4,1,1,i%2?'#bca9e9':'#ead9b7');}}
  else{a.c.strokeStyle='#f1d8a6';a.c.lineWidth=.7;a.c.strokeRect(x-5-p*3,y-5-p*3,9+p*6,9+p*6);}
  a.c.restore();
 }
}
