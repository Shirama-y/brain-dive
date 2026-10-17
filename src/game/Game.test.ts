import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SOLUTION_01 } from '../puzzle/solution01.testdata';
import { Game } from './Game';
let win: EventTarget, canvas: HTMLCanvasElement;
beforeEach(()=>{
  win=new EventTarget();
  const context=new Proxy({measureText:(s:string)=>({width:s.length*7})},{get:(obj,k)=>k in obj?obj[k as keyof typeof obj]:(()=>{})});
  canvas=Object.assign(new EventTarget(),{getContext:()=>context}) as unknown as HTMLCanvasElement;
  vi.stubGlobal('window',win);
  vi.stubGlobal('document',Object.assign(new EventTarget(),{activeElement:canvas,querySelector:()=>({textContent:''})}));
  vi.stubGlobal('requestAnimationFrame',vi.fn());
  vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});
});
afterEach(()=>vi.unstubAllGlobals());
function tick(g:Game,dt=1/60){(g as unknown as {update(dt:number):void}).update(dt);}
function press(g:Game,code:string){for(const type of ['keydown','keyup']){const e=Object.assign(new Event(type),{code,repeat:false});win.dispatchEvent(e);}tick(g);}
function enterPuzzle(g:Game,choice:number,skipDive=true){
  press(g,'Enter');expect(g.scene).toBe('ROOM_INTRO');tick(g,3.1);expect(g.scene).toBe('DIALOGUE');
  for(let i=0;i<3;i++){press(g,'Enter');press(g,'Enter');}expect(g.scene).toBe('QUESTION');
  for(let i=0;i<choice;i++)press(g,'ArrowDown');press(g,'Enter');expect(g.question).toBe(choice);
  for(let i=0;i<2;i++){press(g,'Enter');press(g,'Enter');}expect(g.scene).toBe('DIVE');if(skipDive){press(g,'Enter');if(g.scene==='MEMORY')tick(g,.3);}
}
describe('セッションの通し体験',()=>{
  for(const timed of [false,true])for(const choice of [0,1,2])it(`${timed?"落下":"思考"}・質問${choice+1}から記憶3枚・帰還・診断書・タイトルまで到達`,()=>{
    const g=new Game(canvas);if(timed)g.toggleMode();enterPuzzle(g,choice);const shown:number[]=[];
    for(const {x,rotation} of SOLUTION_01){
      const dx=x-g.board.active!.x;for(let i=0;i<Math.abs(dx);i++)press(g,dx<0?'ArrowLeft':'ArrowRight');
      for(let i=0;i<(rotation===3?1:rotation);i++)press(g,rotation===3?'KeyZ':'KeyX');
      press(g,'Space');tick(g,.8);
      while(g.scene==='MEMORY'){
        shown.push(g.memory);const before=JSON.stringify(g.board);tick(g,5);expect(JSON.stringify(g.board)).toBe(before);
        press(g,'Enter');if(g.scene==='MEMORY')tick(g,.3);
      }
    }
    expect(shown).toEqual([1,2,3]);expect(g.scene).toBe('RETURN');tick(g,2.6);expect(g.scene).toBe('OUTRO');
    for(let i=0;i<3;i++){press(g,'Enter');press(g,'Enter');}expect(g.scene).toBe('REPORT');press(g,'Enter');expect(g.scene).toBe('REPORT');press(g,'Enter');expect(g.scene).toBe('COMPLETE');press(g,'Enter');expect(g.scene).toBe('TITLE');
  });
  it('ポーズ中に重力・ターン・演出が進まず、復帰時に入力が漏れない',()=>{
    const g=new Game(canvas);enterPuzzle(g,0);press(g,'Escape');const before=JSON.stringify(g.board),sceneTime=g.sceneTime;
    press(g,'Space');tick(g,10);expect(JSON.stringify(g.board)).toBe(before);expect(g.sceneTime).toBe(sceneTime);
    press(g,'Escape');expect(g.pause).toBe(false);expect(g.board.turns).toBe(0);press(g,'Space');expect(g.board.turns).toBe(1);
  });
  it('失敗後にRですぐ初期状態から再挑戦できる',()=>{const g=new Game(canvas);enterPuzzle(g,0);g.board.failed=true;press(g,'KeyR');expect(g.scene).toBe('PUZZLE');expect(g.board.failed).toBe(false);expect(g.board.turns).toBe(0);expect(g.board.active).not.toBeNull();});
  it('Hのヒントは1回限り、設定はゲーム外へ保存する',()=>{const g=new Game(canvas);enterPuzzle(g,0);press(g,'KeyH');expect(g.hintUsed).toBe(true);const text=g.hintText;press(g,'ArrowRight');press(g,'KeyH');expect(g.hintText).toBe(text);press(g,'KeyM');expect(g.sound.muted).toBe(true);expect(localStorage.setItem).toHaveBeenCalled();});
});

it('暗転・専用アップ・脳内の遷移が終わるまで盤面を進めない',()=>{
  const g=new Game(canvas);enterPuzzle(g,0,false);const before=JSON.stringify(g.board);
  tick(g,1.5);expect(g.scene).toBe('DIVE');expect(JSON.stringify(g.board)).toBe(before);
  tick(g,2.2);expect(g.scene).toBe('DIVE');expect(JSON.stringify(g.board)).toBe(before);
  tick(g,.2);expect(g.scene).toBe('PUZZLE');expect(g.board.turns).toBe(0);
});

it('思考モードは時間経過で落下せず、比較用の落ちものへ切り替えられる',()=>{
 const g=new Game(canvas);enterPuzzle(g,0);const before=g.board.active!.y;tick(g,5);expect(g.board.active!.y).toBe(before);
 g.toggleMode();tick(g,.9);expect(g.board.active!.y).toBe(before+1);g.toggleMode();tick(g,5);expect(g.board.active!.y).toBe(before+1);
});
