import './styles.css';
import {bindTouchControls} from './game/TouchControls';
import {bindMapControls} from './game/MapControls';
import {questions} from './data/story';
import {memoryCards,interviewQuestions} from './data/memory01';
import {TILE_NAMES,CATEGORY_NAMES,type Category} from './excavation/TileTypes';
import {MAP} from './render/ExcavationRenderer';
import {Game} from './game/Game';
const element=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const canvas=element<HTMLCanvasElement>('game'),viewport=element('viewport'),consoleElement=document.querySelector<HTMLElement>('.console')!;
const game=new Game(canvas),mapRoot=element('map-controls');
const focus=()=>game.scene==='TITLE'?element('start-game').focus({preventScroll:true}):canvas.focus({preventScroll:true});
const action=(fn:()=>void)=>()=>{game.sound.unlock();fn();consoleElement.setAttribute('aria-busy',String(game.effects.remaining>0));focus();};
bindTouchControls(element('touch-controls'),game.input,focus,()=>game.sound.unlock());
// Overlay matches the displayed canvas, including letterboxing and fractional phone scaling.
for(let y=0;y<12;y++)for(let x=0;x<10;x++){const button=document.createElement('button');button.dataset.x=String(x);button.dataset.y=String(y);button.type='button';mapRoot.append(button);}
bindMapControls(mapRoot,p=>game.selectTile(p),actionPoint=>action(()=>game.dig(actionPoint))(),observePoint=>action(()=>game.observe(observePoint))());
const mapButtons=Array.from(mapRoot.querySelectorAll<HTMLButtonElement>('button'));
const mobile=window.matchMedia('(max-width:800px), (pointer:coarse)');
function resize(){const w=viewport.clientWidth,full=!!document.fullscreenElement;const maxHeight=full?Math.max(90,window.innerHeight-150):Math.max(180,window.innerHeight*.64);const scale=Math.min(w/320,maxHeight/180);const display=mobile.matches?scale:scale>=1?Math.floor(scale):scale;canvas.style.width=`${320*display}px`;canvas.style.height=`${180*display}px`;
 mapRoot.style.left=`${(w-320*display)/2+MAP.x*display}px`;mapRoot.style.top=`${(viewport.clientHeight-180*display)/2+MAP.y*display}px`;mapRoot.style.width=`${MAP.width*display}px`;mapRoot.style.height=`${MAP.height*display}px`;
}
for(const card of memoryCards){const box=document.createElement('fieldset'),legend=document.createElement('legend'),text=document.createElement('p'),review=document.createElement('button'),label=document.createElement('label'),select=document.createElement('select');
 legend.id=`card-title-${card.id}`;text.id=`card-text-${card.id}`;review.textContent='記憶を読む';review.id=`review-${card.id}`;review.addEventListener('click',action(()=>game.viewMemory(card.id)));
 label.textContent='この情報の種類';select.id=`category-${card.id}`;select.setAttribute('aria-label',`記憶${card.id}の分類`);select.add(new Option('選択してください',''));
 for(const [value,name]of Object.entries(CATEGORY_NAMES))select.add(new Option(name,value));
 select.addEventListener('change',()=>{if(select.value)game.assignments[card.id]=select.value as Category;else delete game.assignments[card.id];});
 label.append(select);box.append(legend,text,review,label);element('card-list').append(box);
 for(const id of ['boss-card','self-card'])element<HTMLSelectElement>(id).add(new Option(`${card.id} / ${card.title}`,String(card.id)));
}
interviewQuestions.forEach((q,i)=>{const b=document.createElement('button');b.textContent=q.title;b.addEventListener('click',action(()=>game.answerInterview(i)));element('interview-questions').append(b);});
const click=(id:string,fn:()=>void)=>element(id).addEventListener('click',action(fn));
click('pause-action',()=>{game.input.press('Escape');game.input.release('Escape');});
click('dig-action',()=>game.dig());click('observe-action',()=>game.observe());click('memory-action',()=>game.openCards());click('interview-action',()=>game.openInterview());click('close-cards',()=>game.closeCards());click('classify-action',()=>game.classify());click('connect-action',()=>game.connect());click('resume-action',()=>game.resumeExploration());
element<HTMLSelectElement>('boss-card').addEventListener('change',e=>game.bossCard=Number((e.target as HTMLSelectElement).value));element<HTMLSelectElement>('self-card').addEventListener('change',e=>game.selfCard=Number((e.target as HTMLSelectElement).value));
let targetOptions='';
element<HTMLSelectElement>('target-picker').addEventListener('change',e=>{const [x,y]=(e.target as HTMLSelectElement).value.split(',').map(Number);game.selectTile({x,y});});
const setText=(id:string,value:string)=>{const el=element(id);if(el.textContent!==value)el.textContent=value;};
let previousScene=game.scene;
function syncPresentation(){const title=game.scene==='TITLE';consoleElement.hidden=title;element('guide').hidden=title;document.querySelector<HTMLElement>('.hero')!.hidden=!title;document.querySelector<HTMLElement>('.session-heading')!.hidden=title;document.querySelector<HTMLElement>('.below')!.hidden=title;document.body.classList.toggle('is-playing',!title);if(title&&previousScene!=='TITLE'){element('start-game').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}previousScene=game.scene;}
function updateUI(){const b=game.board,puzzle=game.scene==='PUZZLE'&&!game.pause,cards=game.scene==='CARDS'&&!game.pause,interview=game.scene==='INTERVIEW'&&!game.pause;
 consoleElement.setAttribute('aria-busy',String(game.effects.remaining>0));
 const sound=element('sound');sound.setAttribute('aria-label',game.sound.muted?'音楽を有効にする':`音楽をミュート（${game.sound.playing?'再生中':'開始待ち'}：${game.sound.track}）`);sound.setAttribute('aria-pressed',String(!game.sound.muted));sound.title=game.sound.track;
 syncPresentation();setText('title-sound',game.sound.muted?'音楽 OFF':'音楽 ON');element('title-sound').setAttribute('aria-pressed',String(!game.sound.muted));
 element('excavation-ui').hidden=!puzzle;element('cards-panel').hidden=!cards;element('interview-panel').hidden=!interview;mapRoot.hidden=!puzzle;
 for(const button of mapButtons){const p={x:Number(button.dataset.x),y:Number(button.dataset.y)},t=b.tile(p)!;const state=b.state(p);const label=`${p.x+1}列${p.y+1}行 ${t.seen?TILE_NAMES[t.kind]:'未発見'} / ${{unknown:'未発見',discovered:'発見済み',diggable:'掘削可能',excavated:'通路',sealed:'封印中',released:'解放済み'}[state]}`;
 if(button.getAttribute('aria-label')!==label)button.setAttribute('aria-label',label);button.disabled=!t.seen;button.tabIndex=t.seen&&t.kind!=='WALL'?0:-1;
 }
 const targets=b.tiles.flat().filter(t=>t.seen&&t.kind!=='WALL'&&(t.open||b.adjacent(t)));const signature=targets.map(t=>`${t.x},${t.y}:${b.state(t)}`).join('|');const picker=element<HTMLSelectElement>('target-picker');if(signature!==targetOptions){targetOptions=signature;picker.replaceChildren(...targets.map(t=>new Option(`${t.x+1}列${t.y+1}行・${TILE_NAMES[t.kind]}・${t.open?'通路':b.state(t)==='sealed'?'封印中':'掘削可能'}`,`${t.x},${t.y}`)));}picker.value=`${b.selected.x},${b.selected.y}`;
 setText('pause-action',game.pause?'再開':'一時停止');element('pause-action').hidden=['TITLE','SETTINGS','COMPLETE'].includes(game.scene);
 setText('exploration-status',`CASE 01 · ${b.depth<3?'表層':b.depth<8?'中層':'深層'} · 発見した記憶 ${b.memories.size} / 3 · 集中力 ${b.focus} / 6`);setText('tile-description',b.describe(b.selected));setText('exploration-message',b.message);
 element<HTMLButtonElement>('dig-action').disabled=!b.canDig(b.selected)||game.effects.remaining>0;element<HTMLButtonElement>('observe-action').disabled=!b.accessible(b.selected)||b.focus===0||game.effects.remaining>0;
 element<HTMLButtonElement>('interview-action').disabled=game.effects.remaining>0;
 for(const card of memoryCards){const found=b.memories.has(card.id);setText(`card-title-${card.id}`,found?`${card.id} / ${card.title}`:`記憶 ${card.id} / 未発見`);setText(`card-text-${card.id}`,found?`${card.text} ${card.detail}`:'探索を続けると、輪郭が見えてきます。');element<HTMLButtonElement>(`review-${card.id}`).disabled=!found;const select=element<HTMLSelectElement>(`category-${card.id}`);select.disabled=!found||b.completed.has('classified');select.value=game.assignments[card.id]??'';}
 element<HTMLButtonElement>('classify-action').disabled=b.memories.size<3||b.completed.has('classified');setText('classify-action',b.completed.has('classified')?'分類済み：奥の防衛が解放された':'3つの記憶を分類する');
 element('source-puzzle').hidden=!b.sourceAvailable;element<HTMLButtonElement>('connect-action').disabled=b.completed.has('source');setText('connect-action',b.completed.has('source')?'出どころを整理できた':'出どころを結びつける');setText('cards-message',b.message);
 element<HTMLSelectElement>('boss-card').value=String(game.bossCard);element<HTMLSelectElement>('self-card').value=String(game.selfCard);
 element('interview-questions').hidden=!!game.interviewAnswer;setText('interview-caption',game.interviewAnswer.slice(0,Math.floor(game.typed)));element<HTMLButtonElement>('resume-action').disabled=!game.interviewAnswer;
 const novel=!(puzzle||cards||interview);element('touch-controls').hidden=!novel;const pause=element('touch-pause');pause.hidden=['TITLE','SETTINGS','COMPLETE'].includes(game.scene);pause.textContent=game.pause?'再開':'一時停止';
 element('touch-retry').hidden=!game.pause;setText('touch-confirm',game.pause?'再開':'決定 / 次へ');element('touch-menu').querySelectorAll<HTMLButtonElement>('[data-key^="Arrow"]').forEach(button=>{const vertical=['ArrowUp','ArrowDown'].includes(button.dataset.key!);button.hidden=vertical?!['TITLE','QUESTION','SETTINGS'].includes(game.scene)||game.pause:game.scene!=='SETTINGS'||game.pause;});
 let caption='決定でスタート。探索はクリック・タップで操作します。';
 if(game.pause)caption='一時停止中。Enter / 再開で続けられます。';
 else if(['DIALOGUE','ANSWER','OUTRO'].includes(game.scene)){const l=game.currentLine();caption=`${l.speaker}：${l.text.slice(0,Math.floor(game.typed))}`;}
 else if(game.scene==='QUESTION')caption=`質問 ${game.selected+1} / 3：${questions[game.selected]}`;
 else if(game.scene==='MEMORY'){const m=memoryCards[game.memory-1];caption=`${m.title}：${m.text.slice(0,Math.floor(game.typed))} ${m.detail}`;}
 else if(game.scene==='SETTINGS')caption='上下で項目選択、決定で変更。音量は − / ＋。';else if(game.scene==='ROOM_INTRO')caption='患者が入室しています。決定で進めます。';else if(game.scene==='DIVE')caption='声の奥へ。決定で演出をスキップ。';else if(game.scene==='RETURN')caption='出来事と言葉の出どころがつながった。診療室へ戻ります。';else if(game.scene==='REPORT')caption='架空のゲーム内書類。パズルの結果ではなく、院内医師の診察・評価・確認を経て発行されます。';else if(game.scene==='COMPLETE')caption='SESSION COMPLETE。決定でタイトルへ。';
 setText('mobile-caption',caption);requestAnimationFrame(updateUI);
}
updateUI();mobile.addEventListener('change',resize);new ResizeObserver(resize).observe(viewport);window.addEventListener('resize',resize);document.addEventListener('fullscreenchange',resize);resize();game.syncSound();focus();
click('sound',()=>game.toggleSound());element('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await consoleElement.requestFullscreen();}catch{}resize();focus();});
element('help').addEventListener('click',()=>{const guide=element<HTMLDetailsElement>('guide');guide.open=!guide.open;if(guide.open)guide.scrollIntoView({behavior:'smooth',block:'nearest'});});
function startSession(){game.sound.unlock();game.start();syncPresentation();resize();focus();requestAnimationFrame(()=>consoleElement.scrollIntoView({behavior:'instant',block:'start'}));}
element('start-game').addEventListener('click',startSession);
click('title-sound',()=>game.toggleSound());
element('open-settings').addEventListener('click',()=>{game.openSettings();syncPresentation();resize();focus();requestAnimationFrame(()=>consoleElement.scrollIntoView({behavior:'instant',block:'start'}));});
