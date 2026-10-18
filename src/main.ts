import './styles.css';
import {fragments} from './data/fragments';
import {bindTouchControls} from './game/TouchControls';
import {bindMapControls} from './game/MapControls';
import {questions} from './data/story';
import {counselingQuestions} from './data/counseling';
import {MAP,NUMBER_COLORS} from './render/MinesweeperRenderer';
import {Game} from './game/Game';
import {WIDTH,HEIGHT,FEELINGS,feelingAt} from './minesweeper/Board';
const element=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=element<HTMLCanvasElement>('game'),viewport=element('viewport'),consoleElement=document.querySelector<HTMLElement>('.console')!;
const game=new Game(canvas),mapRoot=element('map-controls'),mobileRoot=element('mobile-minefield');
const focus=()=>game.scene==='TITLE'?element('start-game').focus({preventScroll:true}):canvas.focus({preventScroll:true});
const action=(fn:()=>void)=>()=>{game.sound.unlock();fn();consoleElement.setAttribute('aria-busy',String(game.effects.remaining>0));focus();};
bindTouchControls(element('touch-controls'),game.input,focus,()=>game.sound.unlock());
const grids=[mapRoot,mobileRoot];
for(const root of grids){for(let y=0;y<HEIGHT;y++)for(let x=0;x<WIDTH;x++){const button=document.createElement('button');button.dataset.x=String(x);button.dataset.y=String(y);button.type='button';root.append(button);}
 bindMapControls(root,p=>game.selectTile(p),p=>action(()=>game.tap(p))(),p=>action(()=>game.flag(p))());}
const mapButtons=grids.map(root=>Array.from(root.querySelectorAll<HTMLButtonElement>('button')));
const mobile=window.matchMedia('(max-width:800px), (pointer:coarse)');
function resize(){const w=viewport.clientWidth,full=!!document.fullscreenElement;const maxHeight=full?Math.max(90,window.innerHeight-150):Math.max(180,window.innerHeight*.64);const scale=Math.min(w/320,maxHeight/180);const display=mobile.matches?scale:scale>=1?Math.floor(scale):scale;canvas.style.width=`${320*display}px`;canvas.style.height=`${180*display}px`;
 mapRoot.style.left=`${(w-320*display)/2+MAP.x*display}px`;mapRoot.style.top=`${(viewport.clientHeight-180*display)/2+MAP.y*display}px`;mapRoot.style.width=`${MAP.width*display}px`;mapRoot.style.height=`${MAP.height*display}px`;}
counselingQuestions.forEach((q,i)=>{const button=document.createElement('button');button.textContent=q.title;button.addEventListener('click',action(()=>game.answerInterview(i)));element('interview-questions').append(button);});
const memoryTabs=fragments.map(f=>{const button=document.createElement('button');button.type='button';button.addEventListener('click',action(()=>game.readFragment(f.id)));element('memory-tabs').append(button);return button;});
const click=(id:string,fn:()=>void)=>element(id).addEventListener('click',action(fn));
click('read-memory',()=>{element<HTMLDetailsElement>('memory-journal-details').open=true;element('memory-journal').scrollIntoView({behavior:'smooth',block:'start'});});
click('pause-action',()=>{game.input.press('Escape');game.input.release('Escape');});click('open-action',()=>game.openCell());click('flag-action',()=>game.flag());click('tap-mode',()=>game.toggleFlagMode());click('counsel-action',()=>game.openInterview());click('resume-action',()=>game.resumeExploration());click('retry-action',()=>game.retry());click('home-action',()=>game.returnToTitle());
element<HTMLSelectElement>('target-picker').addEventListener('change',e=>{const [x,y]=(e.target as HTMLSelectElement).value.split(',').map(Number);game.selectTile({x,y});});
const setText=(id:string,value:string)=>{const el=element(id);if(el.textContent!==value)el.textContent=value;};
let previousScene=game.scene;
function syncPresentation(){const title=game.scene==='TITLE';consoleElement.hidden=title;element('guide').hidden=title;document.querySelector<HTMLElement>('.hero')!.hidden=!title;document.querySelector<HTMLElement>('.session-heading')!.hidden=title;document.querySelector<HTMLElement>('.below')!.hidden=title;document.body.classList.toggle('is-playing',!title);document.body.classList.toggle('is-minesweeper',game.scene==='PUZZLE'&&!game.pause);if(title&&previousScene!=='TITLE'){element('start-game').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}previousScene=game.scene;}
let pickerSignature='';
function updateUI(){const b=game.board,puzzle=game.scene==='PUZZLE'&&!game.pause,interview=game.scene==='INTERVIEW'&&!game.pause,over=game.scene==='GAMEOVER';
 consoleElement.setAttribute('aria-busy',String(game.effects.remaining>0));const sound=element('sound');sound.setAttribute('aria-label',game.sound.muted?'音楽を有効にする':`音楽をミュート（${game.sound.playing?'再生中':'開始待ち'}：${game.sound.track}）`);sound.setAttribute('aria-pressed',String(!game.sound.muted));
 syncPresentation();setText('title-sound',game.sound.muted?'音楽 OFF':'音楽 ON');element('title-sound').setAttribute('aria-pressed',String(!game.sound.muted));
 element('minesweeper-ui').hidden=!puzzle;element('interview-panel').hidden=!interview;element('gameover-panel').hidden=!over;mapRoot.hidden=!puzzle;
 const optionLabels:string[]=[];
 for(let i=0;i<WIDTH*HEIGHT;i++){const p={x:i%WIDTH,y:Math.floor(i/WIDTH)},v=b.view(p)!;const stateLabel=v.state==='open'?(v.adjacent?`周囲の地雷 ${v.adjacent}`:'空白'):v.state==='flagged'?'旗':v.state==='hint'?'安全ヒント':['mine','exploded'].includes(v.state)?'地雷':'未開封';const label=`${p.x+1}列${p.y+1}行 ${FEELINGS[feelingAt(p)]} ${stateLabel}${v.memoryId?' 記憶を発見済み':''}`;optionLabels.push(label);
  mapButtons.forEach((buttons,index)=>{const button=buttons[i];if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);button.disabled=b.finished;button.setAttribute('aria-pressed',String(b.selected.x===p.x&&b.selected.y===p.y));if(index===1){const text=v.state==='open'?(v.adjacent?String(v.adjacent):''):v.state==='flagged'?'⚑':v.state==='hint'?'◇':['mine','exploded'].includes(v.state)?'✹':'';if(button.textContent!==text)button.textContent=text;button.dataset.memory=String(!!v.memoryId);button.dataset.state=v.state;button.dataset.feeling=String(feelingAt(p));button.style.color=NUMBER_COLORS[v.adjacent??0];}});
 }
 const signature=optionLabels.join('|'),picker=element<HTMLSelectElement>('target-picker');if(signature!==pickerSignature){pickerSignature=signature;picker.replaceChildren(...optionLabels.map((label,i)=>new Option(label,`${i%WIDTH},${Math.floor(i/WIDTH)}`)));}picker.value=`${b.selected.x},${b.selected.y}`;
 setText('puzzle-status',`安心 ${b.calm}% · 開いたマス ${b.opened}/${b.safeTotal} · 不安の核 ${b.mineCount}`);setText('mind-state',`${b.mood} — 「${b.voice}」`);setText('support-size',`話を聞く · 安全${b.supportSize}マス`);setText('tile-description',b.describe(b.selected));setText('puzzle-message',b.message);
 element<HTMLButtonElement>('open-action').disabled=!b.canOpen(b.selected)||game.effects.remaining>0;element<HTMLButtonElement>('flag-action').disabled=!!b.tile(b.selected)?.open;setText('flag-action',b.tile(b.selected)?.flagged?'旗を外す':'旗を立てる');setText('tap-mode',game.flagMode?'マスタップ：旗を立てる / 外す':'マスタップ：開く');element('tap-mode').setAttribute('aria-pressed',String(game.flagMode));
 element('interview-questions').hidden=!!game.interviewAnswer;setText('interview-caption',game.interviewAnswer.slice(0,Math.floor(game.typed)));element<HTMLButtonElement>('resume-action').disabled=!game.interviewAnswer;
 const fragment=game.currentFragment,found=b.foundFragments.length;
 element('discovery-teaser').hidden=!puzzle||!fragment;
 element('memory-journal').hidden=!found||game.pause||!['PUZZLE','RETURN','OUTRO','REPORT','COMPLETE','GAMEOVER'].includes(game.scene);
 setText('memory-count',`見つけた記憶 ${found} / ${fragments.length} · 読み返す`);
 fragments.forEach((f,i)=>{const unlocked=b.foundFragments.includes(f.id),button=memoryTabs[i];button.disabled=!unlocked;const text=unlocked?f.title:`${['叱責','自責','疲れ'][f.topic]} · まだ見えない記憶`;if(button.textContent!==text)button.textContent=text;button.setAttribute('aria-pressed',String(fragment?.id===f.id));});
 element('memory-record').hidden=!fragment;
 if(fragment){
  setText('discovery-title',`✦ 記憶 ${found} / 3 — ${fragment.title}`);setText('discovery-quote',`田辺「${fragment.patient.length>44?fragment.patient.slice(0,43)+'…':fragment.patient}」`);
  for(const id of ['discovery-thumb','memory-art']){element(id).style.backgroundPosition=`${fragment.panel%2?'100%':'0%'} ${fragment.panel>=2?'100%':'0%'}`;element(id).setAttribute('aria-label',fragment.scene);}
  setText('memory-title',fragment.title);setText('memory-scene',fragment.scene);setText('memory-patient',`田辺 悠介「${fragment.patient}」`);setText('memory-insight',fragment.insight);
 }
 setText('failure-status' ,`開いた安全なマス：${b.opened} / ${b.safeTotal}。再挑戦では盤面を作り直します。`);
 const novel=!(puzzle||interview||over||game.scene==='EXPLOSION');element('touch-controls').hidden=!novel;element('touch-pause').hidden=true;setText('pause-action',game.pause?'再開':'一時停止');element('pause-action').hidden=['TITLE','SETTINGS','COMPLETE','GAMEOVER'].includes(game.scene);
 element('touch-retry').hidden=!game.pause;setText('touch-confirm',game.pause?'再開':'決定 / 次へ');element('touch-menu').querySelectorAll<HTMLButtonElement>('[data-key^="Arrow"]').forEach(button=>{const vertical=['ArrowUp','ArrowDown'].includes(button.dataset.key!);button.hidden=vertical?!['TITLE','QUESTION','SETTINGS'].includes(game.scene)||game.pause:game.scene!=='SETTINGS'||game.pause;});
 let caption='数字は周囲8マスの地雷の数です。';
 if(game.pause)caption='一時停止中。Enter / 再開で続けられます。';else if(['DIALOGUE','ANSWER','OUTRO'].includes(game.scene)){const l=game.currentLine();caption=`${l.speaker}：${l.text.slice(0,Math.floor(game.typed))}`;}else if(game.scene==='QUESTION')caption=`質問 ${game.selected+1} / 3：${questions[game.selected]}`;else if(game.scene==='SETTINGS')caption='上下で項目選択、決定で変更。音量は − / ＋。';else if(game.scene==='ROOM_INTRO')caption='患者が入室しています。';else if(game.scene==='DIVE')caption=`${game.diveCaption} 決定で演出をスキップ。`;else if(game.scene==='RETURN')caption='安全なマスをすべて開いた。患者の呼吸が落ち着いてきた。';else if(game.scene==='REPORT')caption='架空のゲーム内書類。医師の診察・評価・確認を経て発行されます。';else if(game.scene==='COMPLETE')caption='SESSION COMPLETE。決定でタイトルへ。';setText('mobile-caption',caption);
 requestAnimationFrame(updateUI);
}
updateUI();mobile.addEventListener('change',resize);new ResizeObserver(resize).observe(viewport);window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);resize();game.syncSound();focus();
click('sound',()=>game.toggleSound());element('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await consoleElement.requestFullscreen();}catch{}resize();focus();});element('help').addEventListener('click',()=>{const guide=element<HTMLDetailsElement>('guide');guide.open=!guide.open;if(guide.open)guide.scrollIntoView({behavior:'smooth',block:'nearest'});});
function startSession(){game.sound.unlock();game.start();syncPresentation();resize();focus();requestAnimationFrame(()=>consoleElement.scrollIntoView({behavior:'instant',block:'start'}));}element('start-game').addEventListener('click',startSession);click('title-sound',()=>game.toggleSound());element('open-settings').addEventListener('click',()=>{game.openSettings();syncPresentation();resize();focus();requestAnimationFrame(()=>consoleElement.scrollIntoView({behavior:'instant',block:'start'}));});
