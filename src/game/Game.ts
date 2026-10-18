import { Art } from '../render/Art';
import { ExcavationBoard } from '../excavation/ExcavationBoard';
import { ExcavationRenderer } from '../render/ExcavationRenderer';
import { ExcavationEffects } from '../render/ExcavationEffects';
import { memoryCards, interviewQuestions } from '../data/memory01';
import type { Point, Category } from '../excavation/TileTypes';
import type { ActionResult } from '../excavation/ExcavationBoard';
import { intro, questions, replies, lastLine, outro } from '../data/story';
import { Input } from './Input';
import { Sound } from './Audio';
type Scene = 'TITLE'|'SETTINGS'|'ROOM_INTRO'|'DIALOGUE'|'QUESTION'|'ANSWER'|'DIVE'|'PUZZLE'|'CARDS'|'INTERVIEW'|'MEMORY'|'RETURN'|'OUTRO'|'REPORT'|'COMPLETE';
const confirm=(key:string)=>['Enter','Space'].includes(key);
const labels:Record<Scene,string>={TITLE:'待合室',SETTINGS:'設定',ROOM_INTRO:'患者入室',DIALOGUE:'問診',QUESTION:'問診',ANSWER:'問診',DIVE:'潜行中',PUZZLE:'月曜の朝',MEMORY:'記憶の断片',CARDS:'記憶の整理',INTERVIEW:'追加の問診',RETURN:'帰還中',OUTRO:'診療室',REPORT:'診断書',COMPLETE:'セッション終了'};
export class Game {
  art:Art; input:Input; sound=new Sound();
  scene:Scene='TITLE'; sceneTime=0; time=0; selected=0; question=0; line=0; typed=0;
  reduced=true; pause=false; board=new ExcavationBoard(); memory=1;
  renderer=new ExcavationRenderer();effects=new ExcavationEffects();
  assignments:Partial<Record<number,Category>>={};bossCard=0;selfCard=0;
  interviewAnswer='';private interviewPoint:Point={x:8,y:4};private memoryReturn:'PUZZLE'|'CARDS'='PUZZLE';
  titleSelected=0; settingsSelected=0;private lastGlyph=0;
  private previous=0; private accumulator=0; private stampPlayed=false;
  constructor(public canvas:HTMLCanvasElement) {
    this.art=new Art(canvas.getContext('2d')!);this.input=new Input(canvas);
    try{const s=JSON.parse(localStorage.getItem('brain-dive-settings')??'{}');this.reduced=typeof s.reduced==='boolean'?s.reduced:true;this.sound.muted=typeof s.muted==='boolean'?s.muted:false;this.sound.volume=typeof s.volume==='number'?Math.max(0,Math.min(1,s.volume)):.45;}catch{/* Storage can be disabled. */}
    window.addEventListener('blur',()=>{if(!['TITLE','SETTINGS','COMPLETE'].includes(this.scene)){this.pause=true;}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&!['TITLE','SETTINGS','COMPLETE'].includes(this.scene))this.pause=true;});
    canvas.addEventListener('pointerdown',()=>{this.sound.unlock();canvas.focus();});
    window.addEventListener('keydown',()=>{if(document.activeElement===canvas)this.sound.unlock();});this.change('TITLE');requestAnimationFrame(this.frame);
  }
  save(){try{localStorage.setItem('brain-dive-settings',JSON.stringify({reduced:this.reduced,muted:this.sound.muted,volume:this.sound.volume}));}catch{}this.syncSound();}
  syncSound(){document.querySelector('#sound')!.textContent=this.sound.muted?'SOUND OFF':'SOUND ON';}
  toggleSound(){this.sound.unlock();this.sound.muted=!this.sound.muted;this.save();}
  change(scene:Scene) {this.scene=scene;if(scene==='MEMORY')this.sound.play('memory');if(scene==='RETURN')this.sound.play('win');this.sceneTime=0;this.typed=0;this.input.clear();document.querySelector('#scene-label')!.textContent=`BRAIN DIVE / ${labels[scene]}`;document.querySelector('#state-label')!.textContent=scene==='TITLE'?'SESSION READY':scene==='COMPLETE'?'SESSION COMPLETE':`CASE 001 · ${labels[scene]}`;}
  start(){this.board=new ExcavationBoard();this.assignments={};this.bossCard=0;this.selfCard=0;this.effects.remaining=0;this.line=0;this.selected=0;this.pause=false;this.sound.play('confirm');this.change('ROOM_INTRO');}
  retry(){this.board=new ExcavationBoard();this.assignments={};this.bossCard=0;this.selfCard=0;this.effects.remaining=0;this.pause=false;this.change('PUZZLE');}
  selectTile(p:Point){if(this.scene==='PUZZLE'&&!this.pause)this.board.selected={...p};}
  dig(p=this.board.selected){if(this.scene!=='PUZZLE'||this.pause||this.effects.remaining>0)return;this.accept(this.board.dig(p));}
  observe(p=this.board.selected){if(this.scene!=='PUZZLE'||this.pause||this.effects.remaining>0)return;this.board.selected={...p};this.accept(this.board.observe(p));}
  private accept(result:ActionResult){if(!result.ok){this.sound.play('step');return;}
    this.effects.start(result.at??this.board.selected,result.kind??'unlock');this.sound.play(result.kind==='dig'?'dig':result.kind==='observe'?'observe':'release');
    if(result.memory){this.memory=result.memory;this.memoryReturn='PUZZLE';this.change('MEMORY');}
    else if(result.kind==='win'){this.sound.play('breath');this.change('RETURN');}
  }
  openCards(){if(this.scene==='PUZZLE'&&!this.pause){this.change('CARDS');this.selected=0;}}
  closeCards(){if(this.scene==='CARDS')this.change('PUZZLE');}
  viewMemory(id:number){if(this.scene!=='CARDS'||!this.board.memories.has(id))return;this.memory=id;this.memoryReturn='CARDS';this.change('MEMORY');}
  classify(){if(this.scene!=='CARDS'||this.pause)return;const r=this.board.classify(this.assignments);if(r.ok){this.sound.play('boss');this.effects.start({x:4,y:8},'unlock');}else this.sound.play('step');}
  connect(){if(this.scene!=='CARDS'||this.pause)return;const r=this.board.connect(this.bossCard,this.selfCard);if(r.ok)this.sound.play('win');else this.sound.play('step');}
  openInterview(){if(this.scene!=='PUZZLE'||this.pause||this.effects.remaining>0)return;this.interviewAnswer='';this.selected=0;this.change('INTERVIEW');}
  answerInterview(index:number){if(this.scene!=='INTERVIEW'||this.pause||this.interviewAnswer)return;const result=this.board.interview(index);if(!result.ok)return;this.interviewAnswer=result.message;this.interviewPoint=index===0?{x:8,y:4}:index===1?{x:4,y:4}:index===2?{x:4,y:7}:{...this.board.selected};this.typed=0;this.sound.play('confirm');}
  resumeExploration(){if(this.scene!=='INTERVIEW'||this.pause)return;this.change('DIVE');this.sceneTime=2.9;this.effects.start(this.interviewPoint,'unlock');}
  currentLine(){if(this.scene==='DIALOGUE')return intro[this.line];if(this.scene==='ANSWER')return {speaker:'田辺 悠介',text:this.line===0?replies[this.question]:lastLine};if(this.scene==='OUTRO')return outro[this.line];return {speaker:'',text:''};}
  advance(){const current=this.currentLine();if(this.typed<current.text.length){this.typed=current.text.length;return;}this.sound.play('confirm');if(this.scene==='DIALOGUE'){if(++this.line>=intro.length){this.selected=0;this.change('QUESTION');}else this.typed=0;}else if(this.scene==='ANSWER'){if(++this.line>1){this.sound.play('dive');this.change('DIVE');}else this.typed=0;}else if(this.scene==='OUTRO'){if(++this.line>=outro.length){this.stampPlayed=false;this.change('REPORT');}else this.typed=0;}}
  private key(key:string) {
    if(key==='KeyM'){this.toggleSound();return;}
    if(key==='Escape'){if(this.scene==='CARDS'&&!this.pause){this.closeCards();return;}if(this.scene==='SETTINGS'){this.change('TITLE');return;}if(!['TITLE','COMPLETE'].includes(this.scene)){this.pause=!this.pause;this.input.clear();}return;}
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
    if(this.scene==='CARDS'){if(key==='KeyC'||confirm(key))this.closeCards();return;}
    if(this.scene==='INTERVIEW'){if(this.interviewAnswer){if(confirm(key)){if(this.typed<this.interviewAnswer.length)this.typed=this.interviewAnswer.length;else this.resumeExploration();}}else{if(key==='ArrowUp')this.selected=(this.selected+3)%4;if(key==='ArrowDown')this.selected=(this.selected+1)%4;if(confirm(key))this.answerInterview(this.selected);}return;}
    if(this.scene==='DIVE'){if(confirm(key))this.change('PUZZLE');return;}
    if(this.scene==='MEMORY'){if(confirm(key)&&this.sceneTime>.25){if(this.typed<memoryCards[this.memory-1].text.length)this.typed=memoryCards[this.memory-1].text.length;else this.change(this.memoryReturn);}return;}
    if(this.scene==='PUZZLE'){
      if(key==='KeyR'){this.retry();return;}if(key==='KeyO'){this.observe();return;}if(key==='KeyC'){this.openCards();return;}if(key==='KeyQ'){this.openInterview();return;}
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)){const p=this.board.selected;this.selectTile({x:Math.max(0,Math.min(9,p.x+(key==='ArrowLeft'?-1:key==='ArrowRight'?1:0))),y:Math.max(0,Math.min(11,p.y+(key==='ArrowUp'?-1:key==='ArrowDown'?1:0)))});}
      if(confirm(key))this.dig();return;
    }
    if(this.scene==='REPORT'&&confirm(key)){if(this.sceneTime<9)this.sceneTime=9;else this.change('COMPLETE');return;}
    if(this.scene==='COMPLETE'&&confirm(key))this.change('TITLE');
  }
  private update(dt:number){
    this.time+=dt;
    if(!this.art.ready&&!['TITLE','SETTINGS'].includes(this.scene)){this.input.clear();this.sound.update('TITLE',this.pause);return;}
    // Consume at most one action at a scene boundary; no input leaks into the next scene.
    for(const key of this.input.take()){const before=this.scene;this.sound.unlock();this.key(key);if(this.scene!==before)break;}
    this.sound.update(['CARDS'].includes(this.scene)?'MEMORY':this.scene==='INTERVIEW'?'DIALOGUE':this.scene,this.pause,this.board.boss&&!this.board.completed.has('source'),this.board.depth);
    if(this.pause)return;
    this.effects.update(dt);
    this.sceneTime+=dt;this.typed+=dt*25;
    if(['DIALOGUE','ANSWER','OUTRO'].includes(this.scene)&&Math.floor(this.typed/3)!==this.lastGlyph&&this.typed<this.currentLine().text.length){this.lastGlyph=Math.floor(this.typed/3);this.sound.play('type');}
    if(this.scene==='ROOM_INTRO'&&this.sceneTime>3){this.line=0;this.change('DIALOGUE');}
    if(this.scene==='DIVE'&&this.sceneTime>3.8)this.change('PUZZLE');
    if(this.scene==='RETURN'&&this.sceneTime>2.5){this.line=0;this.change('OUTRO');}
    if(this.scene==='REPORT'&&this.sceneTime>8&&!this.stampPlayed){this.sound.play('stamp');this.stampPlayed=true;}
  }
  private frame=(now:number)=>{const dt=this.previous?Math.min((now-this.previous)/1000,.1):0;this.previous=now;this.accumulator+=dt;while(this.accumulator>=1/60){this.update(1/60);this.accumulator-=1/60;}this.draw();requestAnimationFrame(this.frame);};
  private dialogue() {const a=this.art,l=this.currentLine();a.box(7,123,306,51,'#c5bfcb','#0a0b13');a.text(l.speaker,16,129,'#c3a68c',6);a.wrapped(l.text.slice(0,Math.floor(this.typed)),17,141,279,'#e9e3da',7,11);if(this.typed>=l.text.length&&Math.floor(this.time*2)%2)a.text('▼',301,162,'#bda4be',6);}
  private puzzle(){this.renderer.draw(this.art,this.board,this.time,this.reduced,this.effects);}
  private draw(){const a=this.art,c=a.c;c.globalAlpha=1;const scale=(this.canvas.width||320)/320;c.setTransform(scale,0,0,scale,0,0);a.rect(0,0,320,180,'#090912');
    if(!this.art.ready&&!['TITLE','SETTINGS'].includes(this.scene)){a.text('記憶の輪郭を、読み込んでいます。',160,82,'#d6bdcf',9,'center');return;}
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
        if(t>1.3)a.intrusion(t,this.reduced,Math.min(1,(t-1.3)/.7));
        if(t<1.3)black(1-(t-.8)/.5);
      }else if(t<3.05){a.rect(0,0,320,180,'#070911');}
      else{this.puzzle();black(1-(t-3.05)/.75);}
      if(t>=1.3&&t<2)a.text('……あの人の声が。',160,163,'#c2b2c5',6,'center');
    }
    else if(this.scene==='INTERVIEW'){
      a.room(this.time);a.box(7,106,306,68,'#bcb5c8','#090b14');a.text('追加の問診 / 探索状態は保持されています',16,112,'#b69ebd',6);
      if(this.interviewAnswer)a.wrapped(this.interviewAnswer.slice(0,Math.floor(this.typed)),16,125,286,'#eee0d6',7,11);
      else interviewQuestions.forEach((q,i)=>a.text(`${i===this.selected?'◆':' '} ${q.title}`,17,124+i*11,i===this.selected?'#ead9c1':'#a298b0',6));
    }
    else if(['PUZZLE','MEMORY','CARDS','RETURN'].includes(this.scene)){
      this.puzzle();
      if(this.scene==='MEMORY'){c.globalAlpha=.8;a.rect(0,0,320,180,'#080912');c.globalAlpha=Math.min(1,.5+this.sceneTime*2);a.memory(this.memory);c.globalAlpha=1;const m=memoryCards[this.memory-1];a.text(m.time,80,20,'#d3a0c5',5);a.text(m.title,160,96,'#edcdb4',9,'center');a.wrapped(m.text.slice(0,Math.floor(this.typed)),80,111,163,'#e7dae0',7,10);a.wrapped(m.detail,80,134,163,'#b8a8c5',5,8);a.text('ENTER 受けとめる / 記憶から再閲覧できます',160,154,'#dac5a6',4,'center');}
      if(this.scene==='CARDS'){c.globalAlpha=.9;a.rect(0,0,320,180,'#080a13');c.globalAlpha=1;a.text('記憶を結びつける',160,21,'#e4cbb5',12,'center');a.text(`発見 ${this.board.memories.size} / 3 ・ 閲覧と整理は集中力を消費しません`,160,45,'#ac9bb9',6,'center');
        memoryCards.forEach((m,i)=>{a.box(29+i*91,62,82,47,'#5d4d6d','#181624');a.text(this.board.memories.has(m.id)?m.title:'まだ見えない記憶',34+i*91,72,'#cdb7cd',7);a.text(this.assignments[m.id]?({event:'出来事',others:'他者の言葉',interpretation:'本人の解釈'}[this.assignments[m.id]!]):'未分類',34+i*91,92,'#b098ba',5);});
        a.wrapped(this.board.message,27,121,267,'#ddc5db',7,11);a.text('画面下のカードで分類・関連づけ / ESC 地図へ',160,166,'#9a8ca6',5,'center');}
      if(this.scene==='RETURN'){c.globalAlpha=Math.min(1,this.sceneTime/2);a.rect(0,0,320,180,'#13141e');c.globalAlpha=1;a.text('声の出どころが、見えてきた。',160,83,'#d4bdc6',8,'center');}
    }
    else if(this.scene==='REPORT'){a.room(this.time);c.globalAlpha=.65;a.rect(0,0,320,180,'#0a0b15');c.globalAlpha=1;a.polygon([[62,9],[244,9],[259,24],[259,170],[62,170]],'#ddd1bb');a.polygon([[244,9],[244,24],[259,24]],'#afa38f');a.text('診 断 書',160,20,'#3a3541',11,'center');a.rect(77,38,165,1,'#ab9c8c');const lines=[['氏名　田辺 悠介（28）',48],['所見',66],['強い心理的負担に伴う心身の不調が',79],['認められる。職場での継続的な負荷が',90],['背景にある可能性があり、休養と',101],['継続的な評価が望ましい。',112],['院内医師確認済・署名　朝倉 灯',135]] as const;lines.forEach(([s,y],i)=>{const count=Math.max(0,Math.floor((this.sceneTime-i*.8-.5)*24));a.text(s.slice(0,count),78,y,'#403b47',7);});if(this.sceneTime>=8){a.box(222,132,24,24,'#ac4559','#ddd1bb');a.text('確認',234,136,'#ac4559',8,'center');a.text('済',234,145,'#ac4559',8,'center');a.text('架空のゲーム内文書',79,157,'#8a7b7c',4);}a.text(this.sceneTime>=9?'ENTER 書類を渡す':'ENTER 印字を完了',160,174,'#b9a8bb',5,'center');}
    else if(this.scene==='COMPLETE'){a.rect(0,0,320,180,'#10111b');a.rect(154,37,12,1,'#aa9475');a.text('SESSION COMPLETE',160,62,'#e7d3b7',13,'center');a.text('今日、ひとつの声に名前がついた。',160,91,'#b5a3bc',8,'center');a.text('整理することは、ここからも続いていく。',160,108,'#746c86',6,'center');a.text('ENTER タイトルへ',160,147,'#c3ac8b',6,'center');}
    if(this.pause){c.globalAlpha=.86;a.rect(0,0,320,180,'#090b15');c.globalAlpha=1;a.box(72,47,176,87,'#76647f','#11121e');a.text('PAUSED',160,61,'#ddcbb5',12,'center');a.text('急がなくて、大丈夫。',160,82,'#aa97b5',7,'center');a.text('ENTER / ESC 再開',160,102,'#d7bd9f',6,'center');a.text('R 探索を最初から    M 音',160,118,'#7e748c',5,'center');}
  }
}
