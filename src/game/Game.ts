import { Art, COLORS, NAMES } from '../render/Art';
import { Board, pieceCells } from '../puzzle/Board';
import { FALL_SECONDS, SOFT_SECONDS, type Emotion } from '../puzzle/level01';
import { intro, questions, replies, lastLine, memories, outro } from '../data/story';
import { Input } from './Input';
import { Sound } from './Audio';
type Scene = 'TITLE'|'SETTINGS'|'ROOM_INTRO'|'DIALOGUE'|'QUESTION'|'ANSWER'|'DIVE'|'PUZZLE'|'MEMORY'|'RETURN'|'OUTRO'|'REPORT'|'COMPLETE';
const confirm=(key:string)=>['Enter','Space','KeyZ'].includes(key);
const labels:Record<Scene,string>={TITLE:'待合室',SETTINGS:'設定',ROOM_INTRO:'患者入室',DIALOGUE:'問診',QUESTION:'問診',ANSWER:'問診',DIVE:'潜行中',PUZZLE:'月曜の朝',MEMORY:'記憶の断片',RETURN:'帰還中',OUTRO:'診療室',REPORT:'診断書',COMPLETE:'セッション終了'};
export class Game {
  art:Art; input:Input; sound=new Sound();
  scene:Scene='TITLE'; sceneTime=0; time=0; selected=0; question=0; line=0; typed=0;
  reduced=true; pause=false; board=new Board(); dropTime=0; resolveTime=0; memory=1;
  hintUsed=false; hintText=''; hintTime=0; titleSelected=0; settingsSelected=0;
  private previous=0; private accumulator=0; private stampPlayed=false;
  constructor(public canvas:HTMLCanvasElement) {
    this.art=new Art(canvas.getContext('2d')!);this.input=new Input(canvas);
    try{const s=JSON.parse(localStorage.getItem('brain-dive-settings')??'{}');this.reduced=typeof s.reduced==='boolean'?s.reduced:true;this.sound.muted=typeof s.muted==='boolean'?s.muted:true;this.sound.volume=typeof s.volume==='number'?Math.max(0,Math.min(1,s.volume)):.3;}catch{/* Storage can be disabled. */}
    window.addEventListener('blur',()=>{if(!['TITLE','SETTINGS','COMPLETE'].includes(this.scene)){this.pause=true;}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&!['TITLE','SETTINGS','COMPLETE'].includes(this.scene))this.pause=true;});
    canvas.addEventListener('pointerdown',()=>canvas.focus());this.change('TITLE');requestAnimationFrame(this.frame);
  }
  save(){try{localStorage.setItem('brain-dive-settings',JSON.stringify({reduced:this.reduced,muted:this.sound.muted,volume:this.sound.volume}));}catch{}this.syncSound();}
  syncSound(){document.querySelector('#sound')!.textContent=this.sound.muted?'SOUND OFF':'SOUND ON';}
  toggleSound(){this.sound.unlock();this.sound.muted=!this.sound.muted;this.save();}
  change(scene:Scene) {this.scene=scene;this.sceneTime=0;this.typed=0;this.input.clear();this.dropTime=0;document.querySelector('#scene-label')!.textContent=`BRAIN DIVE / ${labels[scene]}`;document.querySelector('#state-label')!.textContent=scene==='TITLE'?'SESSION READY':scene==='COMPLETE'?'SESSION COMPLETE':`CASE 001 · ${labels[scene]}`;}
  start(){this.board=new Board();this.line=0;this.selected=0;this.hintUsed=false;this.hintText='';this.pause=false;this.sound.play('confirm');this.change('ROOM_INTRO');}
  retry(){this.board=new Board();this.resolveTime=0;this.hintUsed=false;this.hintText='';this.pause=false;this.change('PUZZLE');}
  currentLine(){if(this.scene==='DIALOGUE')return intro[this.line];if(this.scene==='ANSWER')return {speaker:'田辺 悠介',text:this.line===0?replies[this.question]:lastLine};if(this.scene==='OUTRO')return outro[this.line];return {speaker:'',text:''};}
  advance(){const current=this.currentLine();if(this.typed<current.text.length){this.typed=current.text.length;return;}this.sound.play('confirm');if(this.scene==='DIALOGUE'){if(++this.line>=intro.length){this.selected=0;this.change('QUESTION');}else this.typed=0;}else if(this.scene==='ANSWER'){if(++this.line>1){this.sound.play('dive');this.change('DIVE');}else this.typed=0;}else if(this.scene==='OUTRO'){if(++this.line>=outro.length){this.stampPlayed=false;this.change('REPORT');}else this.typed=0;}}
  private key(key:string) {
    if(key==='KeyM'){this.toggleSound();return;}
    if(key==='Escape'){if(this.scene==='SETTINGS'){this.change('TITLE');return;}if(!['TITLE','COMPLETE'].includes(this.scene)){this.pause=!this.pause;this.input.clear();}return;}
    if(this.pause){if(key==='KeyR'){this.retry();}else if(key==='Enter')this.pause=false;return;}
    if(this.scene==='TITLE') {if(['ArrowUp','ArrowDown'].includes(key)){this.titleSelected=1-this.titleSelected;this.sound.play('step');}if(confirm(key)){if(this.titleSelected===0)this.start();else this.change('SETTINGS');}return;}
    if(this.scene==='SETTINGS'){
      if(key==='ArrowUp')this.settingsSelected=(this.settingsSelected+3)%4;if(key==='ArrowDown')this.settingsSelected=(this.settingsSelected+1)%4;
      if(['ArrowLeft','ArrowRight'].includes(key)&&this.settingsSelected===1){this.sound.volume=Math.round(Math.max(0,Math.min(1,this.sound.volume+(key==='ArrowRight'?.1:-.1)))*10)/10;this.save();}
      if(confirm(key)){if(this.settingsSelected===0)this.toggleSound();if(this.settingsSelected===1){this.sound.volume=Math.round((this.sound.volume+.1)%1.1*10)/10;this.save();}if(this.settingsSelected===2){this.reduced=!this.reduced;this.save();}if(this.settingsSelected===3)this.change('TITLE');}return;
    }
    if(this.scene==='ROOM_INTRO'){if(confirm(key)){this.line=0;this.change('DIALOGUE');}return;}
    if(['DIALOGUE','ANSWER','OUTRO'].includes(this.scene)){if(confirm(key))this.advance();return;}
    if(this.scene==='QUESTION'){if(key==='ArrowUp')this.selected=(this.selected+2)%3;if(key==='ArrowDown')this.selected=(this.selected+1)%3;if(confirm(key)){this.question=this.selected;this.line=0;this.change('ANSWER');}return;}
    if(this.scene==='DIVE'){if(confirm(key))this.change('PUZZLE');return;}
    if(this.scene==='MEMORY'){if(confirm(key)&&this.sceneTime>.25){if(this.board.pendingMemories.length){this.memory=this.board.pendingMemories.shift()!;this.change('MEMORY');}else {this.board.spawn();this.resolveTime=0;this.change('PUZZLE');}}return;}
    if(this.scene==='PUZZLE'){
      if(key==='KeyR'){this.retry();return;}
      if(this.board.failed){if(confirm(key))this.retry();return;}
      if(key==='KeyH'&&!this.hintUsed){this.hintText=this.board.hint();this.hintUsed=true;this.hintTime=8;return;}
      if(!this.board.active||this.resolveTime>0)return;
      if(key==='ArrowLeft')this.board.move(-1);if(key==='ArrowRight')this.board.move(1);
      if(key==='ArrowUp'||key==='KeyX'){this.board.rotate(1);this.sound.play('rotate');}
      if(key==='KeyZ'){this.board.rotate(-1);this.sound.play('rotate');}
      if(key==='Space'){this.board.drop();this.afterLock();}return;
    }
    if(this.scene==='REPORT'&&confirm(key)){if(this.sceneTime<9)this.sceneTime=9;else this.change('COMPLETE');return;}
    if(this.scene==='COMPLETE'&&confirm(key))this.change('TITLE');
  }
  private afterLock(){this.resolveTime=this.board.lastWaves.length?.38:.15;this.dropTime=0;this.sound.play(this.board.lastWaves.length?'clear':'land');}
  private update(dt:number){
    this.time+=dt;
    // Consume at most one action at a scene boundary; no input leaks into the next scene.
    for(const key of this.input.take()){const before=this.scene;this.sound.unlock();this.key(key);if(this.scene!==before)break;}
    if(this.pause)return;
    this.sceneTime+=dt;this.typed+=dt*25;this.hintTime=Math.max(0,this.hintTime-dt);
    if(this.scene==='ROOM_INTRO'&&this.sceneTime>3){this.line=0;this.change('DIALOGUE');}
    if(this.scene==='DIVE'&&this.sceneTime>3.8)this.change('PUZZLE');
    if(this.scene==='RETURN'&&this.sceneTime>2.5){this.line=0;this.change('OUTRO');}
    if(this.scene==='REPORT'&&this.sceneTime>8&&!this.stampPlayed){this.sound.play('stamp');this.stampPlayed=true;}
    if(this.scene!=='PUZZLE'||this.board.failed)return;
    if(this.resolveTime>0){this.resolveTime-=dt;if(this.resolveTime<=0){if(this.board.won){this.sound.play('clear');this.change('RETURN');}else if(this.board.pendingMemories.length){this.memory=this.board.pendingMemories.shift()!;this.change('MEMORY');}else this.board.spawn();}return;}
    for(const code of this.input.repeat(dt)){if(code==='ArrowLeft')this.board.move(-1);if(code==='ArrowRight')this.board.move(1);}
    if(!this.board.active)return;
    this.dropTime+=dt;
    const interval=this.input.held.has('ArrowDown')?SOFT_SECONDS:FALL_SECONDS;
    if(this.dropTime>=interval){this.dropTime=0;this.board.step();if(!this.board.active)this.afterLock();}
  }
  private frame=(now:number)=>{const dt=this.previous?Math.min((now-this.previous)/1000,.1):0;this.previous=now;this.accumulator+=dt;while(this.accumulator>=1/60){this.update(1/60);this.accumulator-=1/60;}this.draw();requestAnimationFrame(this.frame);};
  private dialogue() {const a=this.art,l=this.currentLine();a.box(7,123,306,51,'#c5bfcb','#0a0b13');a.text(l.speaker,16,129,'#c3a68c',6);a.wrapped(l.text.slice(0,Math.floor(this.typed)),17,141,279,'#e9e3da',7,11);if(this.typed>=l.text.length&&Math.floor(this.time*2)%2)a.text('▼',301,162,'#bda4be',6);}
  private puzzle(){const a=this.art,b=this.board;a.brain(this.time,this.reduced,b.boss);
    a.text('STAGE 01',10,12,'#a4a2bc',6);a.text('月曜の朝',10,23,'#eee3df',8);a.rect(10,39,56,1,'#514363');
    a.text('DIAGNOSIS',10,47,'#857991',5);for(let i=0;i<3;i++){a.box(10+i*18,57,13,11,i<b.memories?'#e7bb92':'#4c405e',i<b.memories?'#57405d':'#171423');a.text(`${i+1}`,16+i*18,59,i<b.memories?'#f5d6af':'#655b75',6,'center');}
    a.text(`${b.diagnosed} / 6 解放`,10,75,'#b5a3bc',5);a.block('SEALED_MEMORY',10,84);a.text('封印→ひび→解放',22,86,'#beab9a',4);a.text('NEXT',10,96,'#a9a0b8',5);
    b.queue.slice(0,2).forEach((pair,i)=>{a.box(10+i*27,101,22,27,'#43364f','#12101f');a.block(pair[1],17+i*27,104);a.block(pair[0],17+i*27,114);});
    a.text('PRESSURE',10,138,'#9f91ab',5);a.rect(10,148,53,3,'#2b263b');a.rect(10,148,Math.round(b.height()/12*53),3,b.height()>8?'#e57691':'#9c79b2');a.text(`TURN ${String(b.turns).padStart(2,'0')}`,10,157,'#71667f',5);
    if(b.boss){a.text('上司の残響',272,66,'#e5a6b9',6,'center');a.text(['「結果を出せ」','「まだなの？」','「代わりはいる」'][Math.floor(b.turns/6)%3],272,77,'#c87a9b',5,'center');a.text(this.question===2?'あの声は、ここにいる。':`次の叱責まで ${6-b.turns%6} 手`,272,87,'#8a607f',4,'center');}
    else {a.text('EMOTIONS',247,17,'#ac93b2',5);a.text('声と記憶を',247,32,'#7d6d8a',6);a.text('ほどいていく。',247,42,'#7d6d8a',6);}
    const kinds:Emotion[]=['ANXIETY','GUILT','FATIGUE','ANGER'];kinds.forEach((kind,i)=>{a.block(kind,249,101+i*13);a.text(kind==='ANGER'&&!b.angerUnlocked?'未解放':NAMES[kind],263,103+i*13,kind==='ANGER'&&!b.angerUnlocked?'#64566f':'#bbaac5',6);});
    const ghost=b.ghost();if(ghost)pieceCells(ghost).forEach((p,i)=>a.block(ghost.pair[i],121+p.x*10,25+p.y*10,true));
    b.cells.forEach((r,y)=>r.forEach((kind,x)=>{if(kind)a.block(kind,121+x*10,25+y*10);}));
    if(b.active){const piece=b.active;pieceCells(piece).forEach((p,i)=>a.block(piece.pair[i],121+p.x*10,25+p.y*10));}
    if(this.resolveTime>0&&b.lastWaves.length){for(const wave of b.lastWaves)for(const p of wave){a.c.globalAlpha=Math.max(0,this.resolveTime/.4)*.6;a.rect(121+p.x*10,25+p.y*10,9,9,'#e6c4e2');a.c.globalAlpha=1;}}
    a.rect(74,164,240,13,'#0b0914');let message=b.angerUnlocked?'怒りを、右下の黒い核の隣に。':b.clears===0?'記憶の塊の隣で4個消し。封印を解こう。':b.memories===0?'封印を2回ほどき、塊を取り除こう。':b.memories===1?'誰の声が、あなたを責めている？':'すべてを、一人で引き受けていた。';if(this.hintTime>0)message=this.hintText;a.text(message,79,168,'#c9b0c9',6);
    if(b.failed){a.c.globalAlpha=.85;a.rect(0,0,320,180,'#090912');a.c.globalAlpha=1;a.box(60,58,200,63,'#a480a6');a.text('脳内が飽和した',160,72,'#e2c4d3',10,'center');a.text('急がなくて大丈夫。もう一度、整理しよう。',160,92,'#a79bb4',6,'center');a.text('ENTER / R  再挑戦',160,106,'#dbc49e',6,'center');}
  }
  private draw(){const a=this.art,c=a.c;c.globalAlpha=1;c.setTransform(1,0,0,1,0,0);a.rect(0,0,320,180,'#090912');
    if(this.scene==='TITLE'){a.title(this.time,this.reduced);a.text(this.titleSelected===0?'◆':' ',23,139,'#e4ad9a',7);a.text('はじめる',37,139,this.titleSelected===0?'#f1dfc7':'#84798e',8);a.text(this.titleSelected===1?'◆':' ',105,140,'#e4ad9a',7);a.text('設定',119,140,this.titleSelected===1?'#f1dfc7':'#84798e',7);a.text('↑ ↓ 選択    ENTER 決定',21,157,'#71677f',4);}
    else if(this.scene==='SETTINGS'){a.title(this.time,this.reduced);a.box(48,26,224,129,'#b69db8','#12111e');a.text('SETTINGS / 設定',65,39,'#e5d1ba',8);const settings=[`サウンド：${this.sound.muted?'OFF':'ON'}`,`音量：${Math.round(this.sound.volume*100)}%  ← →`,`動き・点滅の軽減：${this.reduced?'ON':'OFF'}`,'タイトルへ戻る'];settings.forEach((s,i)=>{a.text(i===this.settingsSelected?'◆':'',64,63+i*18,'#e5acb0',7);a.text(s,78,63+i*18,i===this.settingsSelected?'#e9dccb':'#8a819a',7);});a.text('ENTER 変更 / ESC 戻る',160,143,'#8a819a',5,'center');}
    else if(['ROOM_INTRO','DIALOGUE','QUESTION','ANSWER','OUTRO'].includes(this.scene)){a.room(this.time,this.scene==='ROOM_INTRO'?65+Math.min(1,this.sceneTime/2.5)*46:111,this.scene!=='ROOM_INTRO'||this.sceneTime>2.5);if(['DIALOGUE','ANSWER','OUTRO'].includes(this.scene))this.dialogue();if(this.scene==='ROOM_INTRO'){a.box(7,135,306,39);a.text('扉が、静かに開く。',19,147,'#aca0b3',7);a.text('ENTER 進む',301,162,'#726b82',5,'right');}if(this.scene==='QUESTION'){a.box(7,115,306,59);a.text('どの言葉から、たどってみよう。',17,121,'#a58ba7',6);questions.forEach((s,i)=>{a.text(i===this.selected?'◆':'',18,135+i*11,'#e2a8aa',6);a.text(s,32,135+i*11,i===this.selected?'#efe2d2':'#8c819a',7);});}}
    else if(this.scene==='DIVE') {
      const t=this.sceneTime;
      const black=(alpha:number)=>{c.globalAlpha=Math.max(0,Math.min(1,alpha));a.rect(0,0,320,180,'#070911');c.globalAlpha=1;};
      if(t<.55){a.room(this.time);black(t/.55);}
      else if(t<.8){a.rect(0,0,320,180,'#070911');}
      else if(t<2.8){
        const opening=Math.max(0,(t-2)/.8);
        a.faceCloseup(4+Math.pow(opening,2)*225,!this.reduced&&t>1.8);
        if(t<1.3)black(1-(t-.8)/.5);
      }else if(t<3.05){a.rect(0,0,320,180,'#070911');}
      else{this.puzzle();black(1-(t-3.05)/.75);}
      if(t>=1.3&&t<2)a.text('……あの人の声が。',160,163,'#c2b2c5',6,'center');
    }
    else if(this.scene==='PUZZLE'||this.scene==='MEMORY'||this.scene==='RETURN') {this.puzzle();if(this.scene==='MEMORY'){c.globalAlpha=.78;a.rect(0,0,320,180,'#080912');c.globalAlpha=1;a.memory(this.memory);const m=memories[this.memory-1];a.text(m.time,86,20,'#d3a0c5',5);a.text(m.title,160,96,'#edcdb4',9,'center');a.text(m.text,160,112,'#e7dae0',7,'center');a.wrapped(m.detail,85,125,151,'#9f8fae',6,9);if(this.question===0)a.text('手がかり：朝の通知と、終わらない仕事。',160,143,'#bd9fbc',4,'center');if(this.question===1&&this.memory===1)a.text('会議室での声も、ここにつながっている。',160,143,'#bd9fbc',4,'center');a.text(this.memory===3?'怒りが解放された / ENTER 続ける':'ENTER 記憶を受けとめる',160,153,'#dac5a6',5,'center');}if(this.scene==='RETURN'){c.globalAlpha=Math.min(1,this.sceneTime/2);a.rect(0,0,320,180,'#171926');c.globalAlpha=1;a.text('声が、遠くなっていく。',160,83,'#d4bdc6',8,'center');}}
    else if(this.scene==='REPORT'){a.room(this.time);c.globalAlpha=.65;a.rect(0,0,320,180,'#0a0b15');c.globalAlpha=1;a.polygon([[62,9],[244,9],[259,24],[259,170],[62,170]],'#ddd1bb');a.polygon([[244,9],[244,24],[259,24]],'#afa38f');a.text('診 断 書',160,20,'#3a3541',11,'center');a.rect(77,38,165,1,'#ab9c8c');const lines=[['氏名　田辺 悠介（28）',48],['所見',66],['強い心理的負担に伴う心身の不調が',79],['認められる。職場での継続的な負荷が',90],['背景にある可能性があり、休養と',101],['継続的な評価が望ましい。',112],['院内医師確認済・署名　朝倉 灯',135]] as const;lines.forEach(([s,y],i)=>{const count=Math.max(0,Math.floor((this.sceneTime-i*.8-.5)*24));a.text(s.slice(0,count),78,y,'#403b47',7);});if(this.sceneTime>=8){a.box(222,132,24,24,'#ac4559','#ddd1bb');a.text('確認',234,136,'#ac4559',8,'center');a.text('済',234,145,'#ac4559',8,'center');a.text('架空のゲーム内文書',79,157,'#8a7b7c',4);}a.text(this.sceneTime>=9?'ENTER 書類を渡す':'ENTER 印字を完了',160,174,'#b9a8bb',5,'center');}
    else if(this.scene==='COMPLETE'){a.rect(0,0,320,180,'#10111b');a.rect(154,37,12,1,'#aa9475');a.text('SESSION COMPLETE',160,62,'#e7d3b7',13,'center');a.text('今日、ひとつの声に名前がついた。',160,91,'#b5a3bc',8,'center');a.text('整理することは、ここからも続いていく。',160,108,'#746c86',6,'center');a.text('ENTER タイトルへ',160,147,'#c3ac8b',6,'center');}
    if(this.pause){c.globalAlpha=.86;a.rect(0,0,320,180,'#090b15');c.globalAlpha=1;a.box(72,47,176,87,'#76647f','#11121e');a.text('PAUSED',160,61,'#ddcbb5',12,'center');a.text('急がなくて、大丈夫。',160,82,'#aa97b5',7,'center');a.text('ENTER / ESC 再開',160,102,'#d7bd9f',6,'center');a.text('R パズルを再挑戦    M 音',160,118,'#7e748c',5,'center');}
  }
}
