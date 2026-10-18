import type {Tile,Emotion} from './TileTypes';
export const WIDTH=10,HEIGHT=12;
/** Three independent branches prevent memory-order prerequisites. Walls cannot be bypassed. */
export function createLevel():Tile[][]{
 const rows:Tile[][]=Array.from({length:HEIGHT},(_,y)=>Array.from({length:WIDTH},(_,x)=>({x,y,kind:'WALL',seen:false,open:false,released:false})));
 const put=(x:number,y:number,kind:Tile['kind'],extra:Partial<Tile>={})=>Object.assign(rows[y][x],{kind},extra);
 const emotions:Emotion[]=['ANXIETY','GUILT','FATIGUE'];
 put(4,0,'PATH',{open:true,seen:true});put(4,1,'ANXIETY');
 for(let x=1;x<=8;x++)put(x,2,emotions[x%3]);
 put(1,3,'FATIGUE');put(1,4,'HIDDEN',{requires:'observe'});put(1,5,'MEMORY',{memory:1});
 put(8,3,'GUILT');put(8,4,'DEFENSE',{requires:'interview'});put(8,5,'MEMORY',{memory:2});
 put(4,3,'FATIGUE');put(4,4,'CLUE');put(4,5,'DEFENSE',{requires:'workNote'});put(4,6,'GUILT');put(4,7,'MEMORY',{memory:3});
 put(8,6,'ECHO',{requires:'source'});put(3,7,'ECHO',{requires:'source'});
 put(4,8,'DEFENSE',{requires:'classified'});put(4,9,'ECHO',{requires:'source'});put(4,10,'GATE',{requires:'source'});put(4,11,'PATH');
 // Small optional pockets provide observation choices, not mandatory filler.
 put(2,3,'ANXIETY');put(7,3,'FATIGUE');put(5,3,'GUILT');
 return rows;
}
