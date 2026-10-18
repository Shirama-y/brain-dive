import type {FragmentId} from '../data/fragments';
export interface Point {x:number;y:number}
export interface Cell extends Point {mine:boolean;open:boolean;flagged:boolean;adjacent:number}
export interface CellView extends Point {state:'closed'|'flagged'|'open'|'mine'|'exploded'|'hint';adjacent?:number;wrongFlag?:boolean;memoryId?:FragmentId}
export interface MoveResult {ok:boolean;kind?:'open'|'flag'|'hint'|'explode'|'win';at?:Point;message:string;discoveries?:FragmentId[]}
export const keyOf=({x,y}:Point)=>`${x},${y}`;
