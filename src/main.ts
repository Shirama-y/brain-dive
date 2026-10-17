import './styles.css';
import { bindTouchControls } from './game/TouchControls';
import { memories, questions } from './data/story';
import { Game } from './game/Game';
const canvas=document.querySelector<HTMLCanvasElement>('#game')!;
const viewport=document.querySelector<HTMLElement>('#viewport')!;
const game=new Game(canvas);
const consoleElement=document.querySelector<HTMLElement>('.console')!;
const touchRoot=document.querySelector<HTMLElement>('#touch-controls')!;
bindTouchControls(touchRoot, game.input, ()=>canvas.focus({preventScroll:true}), ()=>game.sound.unlock());
const mobile = window.matchMedia('(max-width: 800px), (pointer: coarse)');
function resize(){
  const availableWidth=viewport.clientWidth;
  const fullscreen=!!document.fullscreenElement;
  const controlsHeight=fullscreen?consoleElement.clientHeight-viewport.clientHeight:0;
  const maxHeight=fullscreen?Math.max(90,window.innerHeight-controlsHeight):Math.max(180,window.innerHeight*.64);
  const scale=Math.min(availableWidth/320,maxHeight/180);
  // Phones fill their available width; desktop retains integer pixel scaling.
  const displayScale=mobile.matches?scale:scale>=1?Math.floor(scale):scale;
  canvas.style.width=`${320*displayScale}px`;canvas.style.height=`${180*displayScale}px`;
}
function updateTouchUI(){
  const puzzle=game.scene==='PUZZLE'&&!game.pause&&!game.board.failed;
  document.querySelector<HTMLElement>('#touch-puzzle')!.hidden=!puzzle;
  document.querySelector<HTMLElement>('#touch-menu')!.hidden=puzzle;
  const retry=document.querySelector<HTMLElement>('#touch-retry')!;
  retry.hidden=!(game.pause||game.scene==='PUZZLE');
  const pause=document.querySelector<HTMLButtonElement>('#touch-pause')!;
  pause.hidden=['TITLE','SETTINGS','COMPLETE'].includes(game.scene);
  pause.textContent=game.pause?'再開':'一時停止';
  const confirm=document.querySelector<HTMLButtonElement>('#touch-confirm')!;
  confirm.textContent=game.pause?'再開':game.board.failed&&game.scene==='PUZZLE'?'再挑戦':'決定 / 次へ';
  const menu=document.querySelector<HTMLElement>('#touch-menu')!;
  menu.querySelectorAll<HTMLButtonElement>('[data-key^="Arrow"]').forEach(button=>{
    const vertical=['ArrowUp','ArrowDown'].includes(button.dataset.key!);
    button.hidden=vertical?!['TITLE','QUESTION','SETTINGS'].includes(game.scene)||game.pause:game.scene!=='SETTINGS'||game.pause;
  });
  let caption='画面のボタンで操作できます。決定でスタート。';
  if(game.pause)caption='一時停止中。再開ボタンで続けられます。';
  else if(['DIALOGUE','ANSWER','OUTRO'].includes(game.scene)){
    const line=game.currentLine();caption=`${line.speaker}：${line.text.slice(0,Math.floor(game.typed))}`;
  }else if(game.scene==='QUESTION')caption=`質問 ${game.selected+1} / 3：${questions[game.selected]}`;
  else if(game.scene==='MEMORY'){const memory=memories[game.memory-1];caption=`${memory.title}：${memory.text} ${memory.detail}${game.memory===1?' 上司の声が現れ、叱責のおじゃまを2個増やした。':''}`;}
  else if(game.scene==='PUZZLE')caption=game.board.failed?'脳内が飽和した。再挑戦できます。':game.hintTime>0?game.hintText:game.board.angerUnlocked?'橙の怒りを、右下の黒い核の隣に置こう。':`記憶の解放 ${game.board.diagnosed} / 6。灰色の塊の隣で同じ感情を4つ消し、封印→ひび→解放。普通の消去だけでは診断は進みません。`;
  else if(game.scene==='SETTINGS')caption='上下で項目を選び、決定で変更。音量は − / ＋。';
  else if(game.scene==='ROOM_INTRO')caption='患者が入室しています。決定で進めます。';
  else if(game.scene==='DIVE')caption='声の奥へ。決定で演出をスキップ。';
  else if(game.scene==='RETURN')caption='声が、遠くなっていく。';
  else if(game.scene==='REPORT')caption='診断書：田辺 悠介（28）。強い心理的負担に伴う心身の不調が認められる。職場での継続的な負荷が背景にある可能性があり、休養と継続的な評価が望ましい。院内医師確認済。';
  else if(game.scene==='COMPLETE')caption='セッション終了。決定でタイトルへ。';
  const output=document.querySelector<HTMLElement>('#mobile-caption')!;
  if(output.textContent!==caption)output.textContent=caption;
  requestAnimationFrame(updateTouchUI);
}
updateTouchUI();mobile.addEventListener('change',resize);
new ResizeObserver(resize).observe(viewport);window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);resize();game.syncSound();
document.querySelector('#sound')!.addEventListener('click',()=>{game.toggleSound();canvas.focus();});
document.querySelector('#fullscreen')!.addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await consoleElement.requestFullscreen();}catch{/* Browser can decline fullscreen; the normal view remains playable. */}resize();canvas.focus();});
document.querySelector('#help')!.addEventListener('click',()=>{const guide=document.querySelector<HTMLDetailsElement>('#guide')!;guide.open=!guide.open;if(guide.open)guide.scrollIntoView({behavior:'smooth',block:'nearest'});});
canvas.focus({preventScroll:true});
