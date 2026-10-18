import {afterEach,beforeEach,describe,expect,it,vi} from 'vitest';
import {Game,CUTIN_DURATION} from './Game';
import {MinesweeperBoard} from '../minesweeper/Board';
let win:EventTarget,canvas:HTMLCanvasElement;
beforeEach(()=>{vi.spyOn(Date,'now').mockReturnValue(81);win=new EventTarget();const context=new Proxy({measureText:(s:string)=>({width:s.length*7})},{get:(obj,k)=>k in obj?obj[k as keyof typeof obj]:(()=>{})});canvas=Object.assign(new EventTarget(),{getContext:()=>context}) as unknown as HTMLCanvasElement;vi.stubGlobal('window',win);vi.stubGlobal('document',Object.assign(new EventTarget(),{activeElement:canvas,querySelector:()=>({textContent:''})}));vi.stubGlobal('requestAnimationFrame',vi.fn());vi.stubGlobal('localStorage',{getItem:()=>null,setItem:vi.fn()});});
afterEach(()=>{vi.unstubAllGlobals();vi.restoreAllMocks();});
function tick(g:Game,dt=1/60){(g as unknown as {update(dt:number):void}).update(dt);}
function finishCutins(g:Game){for(let i=0;i<3&&g.scene==='CUTIN';i++)tick(g,CUTIN_DURATION+.01);}
function press(g:Game,code:string){for(const type of ['keydown','keyup'])win.dispatchEvent(Object.assign(new Event(type),{code,repeat:false}));tick(g);}
function enter(g:Game,choice=0,skip=true,bridgeOnly=false){press(g,'Enter');tick(g,3.1);for(let i=0;i<3;i++){press(g,'Enter');press(g,'Enter');}expect(g.scene).toBe('QUESTION');for(let i=0;i<choice;i++)press(g,'ArrowDown');press(g,'Enter');for(let i=0;i<2;i++){press(g,'Enter');press(g,'Enter');}expect(g.scene).toBe('ANSWER');expect(g.currentLine().speaker).toBe('カウンセラー');if(bridgeOnly)return;for(let i=0;i<4;i++){press(g,'Enter');press(g,'Enter');}expect(g.scene).toBe('DIVE');if(skip)press(g,'Enter');}
function counsel(g:Game,index=0){tick(g,.4);const before=g.board.cells.map(row=>row.map(c=>({...c})));g.openInterview();expect(g.scene).toBe('INTERVIEW');g.answerInterview(index);expect(g.interviewAnswer).toContain('安全ヒント');tick(g,4);g.resumeExploration();press(g,'Enter');tick(g,.4);expect(g.scene).toBe('PUZZLE');expect(g.board.cells).toEqual(before);}
describe('マインスイーパーのセッション',()=>{
 for(const choice of [0,1,2])it(`初回問診${choice+1}から相談・クリア・帰還・診断書・タイトルまで`,()=>{const g=new Game(canvas);enter(g,choice);g.openCell({x:4,y:5});tick(g,.2);finishCutins(g);counsel(g,choice);for(const cell of g.board.cells.flat().filter(c=>!c.mine&&!c.open)){g.openCell(cell);tick(g,.2);finishCutins(g);if(g.scene==='RETURN')break;}expect(g.board.won).toBe(true);expect(g.scene).toBe('RETURN');tick(g,2.6);for(let i=0;i<3;i++){press(g,'Enter');press(g,'Enter');}expect(g.scene).toBe('REPORT');press(g,'Enter');press(g,'Enter');expect(g.scene).toBe('COMPLETE');press(g,'Enter');expect(g.scene).toBe('TITLE');});
 it('爆発→患者のパニック演出→ゲームオーバーになり、Enterで再挑戦できる',()=>{const g=new Game(canvas);enter(g);g.openCell({x:4,y:5});tick(g,.2);finishCutins(g);const mine=g.board.cells.flat().find(c=>c.mine)!;g.openCell(mine);expect(g.scene).toBe('EXPLOSION');expect(g.board.failed).toBe(true);tick(g,1);expect(g.scene).toBe('EXPLOSION');tick(g,.9);expect(g.scene).toBe('GAMEOVER');press(g,'Enter');expect(g.scene).toBe('PUZZLE');expect(g.board.failed).toBe(false);expect(g.board.generated).toBe(false);expect(g.board.opened).toBe(0);});
 it('ゲームオーバーでEscから単一タイトルへ戻れる',()=>{const g=new Game(canvas);enter(g);g.openCell({x:4,y:5});tick(g,.2);finishCutins(g);g.openCell(g.board.cells.flat().find(c=>c.mine)!);tick(g,2);press(g,'Escape');expect(g.scene).toBe('TITLE');});
 it('旗モードのタップで開封せず、相談から戻ると開くモードでヒントを使える',()=>{const g=new Game(canvas);enter(g);g.toggleFlagMode();g.tap({x:4,y:5});expect(g.board.tile({x:4,y:5})!.flagged).toBe(true);expect(g.board.generated).toBe(false);g.openInterview();g.answerInterview(1);g.resumeExploration();press(g,'Enter');tick(g,.4);expect(g.flagMode).toBe(false);expect(g.board.view(g.board.selected)!.state).toBe('hint');g.tap(g.board.selected);expect(g.board.opened).toBeGreaterThan(0);expect(g.board.failed).toBe(false);});
 it('ポーズ中の開封・旗・カウンセリングを止め、爆発演出の時間も止まる',()=>{const g=new Game(canvas);enter(g);press(g,'Escape');const before=JSON.stringify(g.board);g.openCell({x:4,y:5});g.flag();g.openInterview();tick(g,20);expect(JSON.stringify(g.board)).toBe(before);press(g,'Escape');g.openCell({x:4,y:5});tick(g,.2);finishCutins(g);g.openCell(g.board.cells.flat().find(c=>c.mine)!);press(g,'Escape');const time=g.sceneTime;tick(g,10);expect(g.sceneTime).toBe(time);expect(g.scene).toBe('EXPLOSION');});
 it('Fで旗、Q/Hで相談、Enterで開封でき、Rでリセットできる',()=>{const g=new Game(canvas);enter(g);press(g,'KeyF');expect(g.board.flags).toBe(1);press(g,'KeyF');tick(g,.4);press(g,'Enter');expect(g.board.generated).toBe(true);finishCutins(g);press(g,'KeyQ');expect(g.scene).toBe('INTERVIEW');g.answerInterview(0);g.resumeExploration();press(g,'Enter');tick(g,.4);press(g,'KeyH');expect(g.scene).toBe('INTERVIEW');g.answerInterview(2);g.resumeExploration();press(g,'Enter');press(g,'KeyR');expect(g.board.generated).toBe(false);expect(g.board.opened).toBe(0);});
 it('設定保存と音声切替・動き軽減を維持する',()=>{const g=new Game(canvas);press(g,'KeyM');expect(g.sound.muted).toBe(true);expect(localStorage.setItem).toHaveBeenCalled();g.openSettings();press(g,'ArrowDown');press(g,'ArrowRight');expect(g.sound.volume).toBe(.6);press(g,'ArrowDown');press(g,'Enter');expect(g.reduced).toBe(false);});
 it('初回潜行中は盤面を生成せず、終わってから遊べる',()=>{const g=new Game(canvas);enter(g,0,false);tick(g,3.7);expect(g.board.generated).toBe(false);expect(g.scene).toBe('DIVE');tick(g,.2);expect(g.scene).toBe('PUZZLE');});
});

it('患者への説明と了承を読み進めるまで、初回の潜行を始めない',()=>{const g=new Game(canvas);enter(g,0,false,true);tick(g,30);expect(g.scene).toBe('ANSWER');expect(g.board.generated).toBe(false);expect(g.currentLine().text).toContain('一緒に眺めて');for(let i=0;i<3;i++){press(g,'Enter');press(g,'Enter');}expect(g.currentLine().speaker).toBe('田辺 悠介');expect(g.currentLine().text).toContain('やってみたい');press(g,'Enter');expect(g.scene).toBe('DIVE');});
it('相談からの再入場も言葉と3.8秒の遷移を挟み、ポーズ中は進まない',()=>{const g=new Game(canvas);enter(g);g.openInterview();g.answerInterview(0);g.resumeExploration();expect(g.sceneTime).toBe(0);expect(g.diveCaption).toContain('さっき話せたこと');press(g,'Escape');const t=g.sceneTime;tick(g,10);expect(g.sceneTime).toBe(t);press(g,'Escape');tick(g,3.6);expect(g.scene).toBe('DIVE');tick(g,.3);expect(g.scene).toBe('PUZZLE');});

function triggerCutin(g:Game){
 enter(g);g.openCell({x:4,y:5});
 for(const c of g.board.cells.flat().filter(c=>!c.mine&&!c.open)){if(g.scene==='CUTIN')break;tick(g,.4);g.openCell(c);}
 expect(g.scene).toBe('CUTIN');
}
it('開いた記憶をカットインで見せ、演出中の開封・旗・相談を受け付けない',()=>{
 const g=new Game(canvas);triggerCutin(g);expect(g.currentFragment!.line.length).toBeGreaterThan(10);
 const before=JSON.stringify(g.board);g.openCell(g.board.cells.flat().find(c=>c.mine)!);g.flag();g.openInterview();expect(JSON.stringify(g.board)).toBe(before);expect(g.scene).toBe('CUTIN');
 const remaining=g.cutinsLeft;g.advanceCutin();expect(g.cutinsLeft).toBe(remaining);tick(g,.36);g.advanceCutin();expect(g.cutinsLeft).toBe(remaining-1);
 finishCutins(g);expect(g.scene).not.toBe('CUTIN');
});
it('最後の安全マスの記憶を見せ終えてから帰還し、再挑戦では記憶を消す',()=>{
 const g=new Game(canvas);enter(g);g.openCell({x:4,y:5});tick(g,.4);finishCutins(g);
 const reference=new MinesweeperBoard(81);reference.open({x:4,y:5});for(const c of reference.cells.flat().filter(c=>!c.mine))reference.open(c);
 const last=reference.cells.flat().find(c=>reference.view(c)?.memoryId&&!g.board.tile(c)!.open)!;expect(last).toBeDefined();g.flag(last);tick(g,.4);
 for(const c of g.board.cells.flat().filter(c=>!c.mine&&!c.open&&!c.flagged)){g.openCell(c);tick(g,.4);finishCutins(g);}
 expect(g.board.won).toBe(false);g.flag(last);tick(g,.4);g.openCell(last);
 expect(g.board.won).toBe(true);expect(g.board.foundFragments).toHaveLength(3);expect(g.scene).toBe('CUTIN');expect(g.currentFragment!.id).toBe(reference.view(last)!.memoryId);
 finishCutins(g);expect(g.scene).toBe('RETURN');g.retry();expect(g.board.foundFragments).toHaveLength(0);expect(g.currentFragment).toBeUndefined();expect(g.cutinsLeft).toBe(0);
});
it('空白展開で複数の記憶が現れても、順番に一度ずつカットインする',()=>{
 let seed=0;for(;seed<100;seed++){const b=new MinesweeperBoard(seed);if((b.open({x:4,y:5}).discoveries?.length??0)>1)break;}expect(seed).toBeLessThan(100);
 const g=new Game(canvas);enter(g);g.board=new MinesweeperBoard(seed);g.openCell({x:4,y:5});const ids=[...g.board.foundFragments],seen:string[]=[];
 expect(ids.length).toBeGreaterThan(1);
 while(g.scene==='CUTIN'){seen.push(g.currentFragment!.id);tick(g,.36);g.advanceCutin();}
 expect(seen).toEqual(ids);expect(new Set(seen).size).toBe(seen.length);
});
it('ポーズでカットインの時間も止まり、再開後は自動的にパズルへ戻る',()=>{
 const g=new Game(canvas);triggerCutin(g);press(g,'Escape');const t=g.sceneTime;tick(g,10);expect(g.sceneTime).toBe(t);expect(g.scene).toBe('CUTIN');
 press(g,'Escape');finishCutins(g);expect(['PUZZLE','RETURN']).toContain(g.scene);expect(g.board.failed).toBe(false);
});
