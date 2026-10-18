export type Emotion = 'ANXIETY'|'GUILT'|'FATIGUE';
export type TileKind = Emotion|'WALL'|'PATH'|'HIDDEN'|'DEFENSE'|'CLUE'|'MEMORY'|'ECHO'|'GATE';
export type Requirement = 'observe'|'interview'|'workNote'|'classified'|'source';
export type Category = 'event'|'others'|'interpretation';
export interface Point {x:number;y:number}
export interface Tile extends Point {kind:TileKind;memory?:number;requires?:Requirement;seen:boolean;open:boolean;released:boolean}
export type TileState = 'unknown'|'discovered'|'diggable'|'excavated'|'sealed'|'released';
export const TILE_NAMES:Record<TileKind,string>={ANXIETY:'不安',GUILT:'自責',FATIGUE:'疲労',WALL:'思考の壁',PATH:'通路',HIDDEN:'隠れた通路',DEFENSE:'防衛',CLUE:'業務メモ',MEMORY:'記憶の輪郭',ECHO:'残響',GATE:'深層ゲート'};
export const CATEGORY_NAMES:Record<Category,string>={event:'出来事',others:'他者の言葉',interpretation:'本人の解釈'};
export const keyOf=({x,y}:Point)=>`${x},${y}`;
