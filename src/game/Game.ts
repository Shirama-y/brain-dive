import { Art } from '../render/Art';
import { MinesweeperBoard } from '../minesweeper/Board';
import { MinesweeperRenderer } from '../render/MinesweeperRenderer';
import { MinesweeperEffects } from '../render/MinesweeperEffects';
import { counselingQuestions } from '../data/counseling';
import type { Point, MoveResult } from '../minesweeper/types';
import { intro, questions, replies, lastLine, outro, diveIntroduction } from '../data/story';
import {diveShotAt,DIVE_DURATION} from '../render/DiveTransition';
import { Input } from './Input';
import { Sound } from './Audio';
type Scene = 'TITLE'|'SETTINGS'|'ROOM_INTRO'|'DIALOGUE'|'QUESTION'|'ANSWER'|'DIVE'|'PUZZLE'|'INTERVIEW'|'EXPLOSION'|'GAMEOVER'|'RETURN'|'OUTRO'|'REPORT'|'COMPLETE';
const confirm=(key:string)=>['Enter','Space'].includes(key);
const labels:Record<Scene,string>={TITLE:'待合室',SETTINGS:'設定',ROOM_INTRO:'患者入室',DIALOGUE:'問診',QUESTION:'問診',ANSWER:'問診',DIVE:'潜行中',PUZZLE:'月曜の朝',EXPLOSION:'爆発',GAMEOVER:'ゲームオーバー',INTERVIEW:'カウンセリング',RETURN:'帰還中',OUTRO:'診療室',REPORT:'診断書',COMPLETE:'セッション終了'};
export class Game {
  art:Art; input:Input; sound=new Sound();
  scene:Scene='TITLE'; sceneTime=0; time=0; selected=0; question=0; line=0; typed=0;
  reduced=true;pause=false;board=new MinesweeperBoard();flagMode=false;
  renderer=new MinesweeperRenderer();effects=new MinesweeperEffects();
  interviewAnswer='';private interviewPoint:Point={x:4,y:5};
  settingsSelected=0;private lastGlyph=0;private returningToMind=false;private lastDiveShot=0;
  get diveCaption(){return diveShotAt(this.sceneTime,this.reduced,this.returningToMind).caption;}
  private previous=0; private accumulator=0; private stampPlayed=false;
  constructor(public canvas:HTMLCanvasElement) {
    this.art=new Art(canvas.getContext('2d')!);this.input=new Input(canvas);
    try{const s=JSON.parse(localStorage.getItem('brain-dive-settings')??'{}');this.reduced=typeof s.reduced==='boolean'?s.reduced:true;this.sound.muted=typeof s.muted==='boolean'?s.muted:false;this.sound.volume=typeof s.volume==='number'?Math.max(0,Math.min(1,s.volume)):.45;}catch{/* Storage can be disabled. */}
    window.addEventListener('blur',()=>{if(!['TITLE','SETTINGS','COMPLETE','GAMEOVER'].includes(this.scene)){this.pause=true;}});
    document.addEventListener('visibilitychange',()=>{if(document.hidden&&!['TITLE','SETTINGS','COMPLETE','GAMEOVER'].includes(this.scene))this.pause=true;});
    canvas.addEventListener('pointerdown',()=>{this.sound.unlock();canvas.focus();});
    window.addEventListener('keydown',()=>{if(document.activeElement===canvas)this.sound.unlock();});this.change('TITLE');requestAnimationFrame(this.frame);
  }
  save(){try{localStorage.setItem('brain-dive-settings',JSON.stringify({reduced:this.reduced,muted:this.sound.muted,volume:this.sound.volume}));}catch{}this.syncSound();}
  syncSound(){document.querySelector('#sound')!.textContent=this.sound.muted?'SOUND OFF':'SOUND ON';}
  openSettings(){this.settingsSelected=0;this.change('SETTINGS');}
  toggleSound(){this.sound.unlock();this.sound.muted=!this.sound.muted;this.save();}
  change(scene:Scene) {this.scene=scene;if(scene==='DIVE')this.lastDiveShot=0;if(scene==='RETURN')this.sound.play('win');this.sceneTime=0;this.typed=0;this.input.clear();document.querySelector('#scene-label')!.textContent=`BRAIN DIVE / ${labels[scene]}`;document.querySelector('#state-label')!.textContent=scene==='TITLE'?'SESSION READY':scene==='COMPLETE'?'SESSION COMPLETE':`CASE 001 · ${labels[scene]}`;}
  start(){this.returningToMind=false;this.board=new MinesweeperBoard();this.effects.remaining=0;this.flagMode=false;this.line=0;this.selected=0;this.pause=false;this.sound.play('confirm');this.change('ROOM_INTRO');}
  retry(){this.board=new MinesweeperBoard();this.effects.remaining=0;this.flagMode=false;this.pause=false;this.change('PUZZLE');}
  returnToTitle(){this.pause=false;this.change('TITLE');}
  selectTile(p:Point){if(this.scene==='PUZZLE'&&!this.pause&&this.board.tile(p))this.board.selected={...p};}
  tap(p:Point){if(this.flagMode)this.flag(p);else this.openCell(p);}
  toggleFlagMode(){if(this.scene==='PUZZLE'&&!this.pause)this.flagMode=!this.flagMode;}
  openCell(p=this.board.selected){if(this.scene!=='PUZZLE'||this.pause||this.effects.remaining>0)return;this.accept(this.board.open(p));}
  flag(p=this.board.selected){if(this.scene!=='PUZZLE'||this.pause)return;this.accept(this.board.toggleFlag(p));}
  private accept(result:MoveResult){if(!result.ok){this.sound.play('step');return;}
    this.effects.start(result.at??this.board.selected,result.kind??'open');
    if(result.kind==='explode'){this.sound.play('blast');this.sound.play('boss');this.change('EXPLOSION');}
    else if(result.kind==='win'){this.sound.play('breath');this.change('RETURN');}
    else this.sound.play(result.kind==='flag'?'step':'dig');
  }
  openInterview(){if(this.scene!=='PUZZLE'||this.pause||this.board.finished)return;this.interviewAnswer='';this.selected=0;this.change('INTERVIEW');}
  answerInterview(index:number){if(this.scene!=='INTERVIEW'||this.pause||this.interviewAnswer)return;const q=counselingQuestions[index];if(!q)return;const result=this.board.counsel(index);if(!result.ok)return;this.interviewAnswer=`${q.answer} ${result.message}`;this.interviewPoint=result.at!;this.typed=0;this.sound.play('memory');}
  resumeExploration(){if(this.scene!=='INTERVIEW'||this.pause||!this.interviewAnswer)return;this.flagMode=false;this.returningToMind=true;this.sound.play('breath');this.change('DIVE');this.effects.start(this.interviewPoint,'hint');}
  currentLine(){if(this.scene==='DIALOGUE')return intro[this.line];if(this.scene==='ANSWER')return this.line<2?{speaker:'田辺 悠介',text:this.line===0?replies[this.question]:lastLine}:diveIntroduction[this.line-2];if(this.scene==='OUTRO')return outro[this.line];return {speaker:'',text:''};}
  advance(){const current=this.currentLine();if(this.typed<current.text.length){this.typed=current.text.length;return;}this.sound.play('confirm');if(this.scene==='DIALOGUE'){if(++this.line>=intro.length){this.selected=0;this.change('QUESTION');}else this.typed=0;}else if(this.scene==='ANSWER'){if(++this.line>=2+diveIntroduction.length){this.sound.play('dive');this.change('DIVE');}else this.typed=0;}else if(this.scene==='OUTRO'){if(++this.line>=outro.length){this.stampPlayed=false;this.change('REPORT');}else this.typed=0;}}
  private key(key:string) {
    if(key==='KeyM'){this.toggleSound();return;}
    if(this.scene==='GAMEOVER'){if(confirm(key)||key==='KeyR')this.retry();else if(key==='Escape')this.returnToTitle();return;}
    if(key==='Escape'){if(this.scene==='SETTINGS'){this.change('TITLE');return;}if(!['TITLE','COMPLETE'].includes(this.scene)){this.pause=!this.pause;this.input.clear();}return;}
    if(this.pause){if(key==='KeyR'){this.retry();}else if(key==='Enter')this.pause=false;return;}
    if(this.scene==='TITLE'){if(confirm(key))this.start();return;}
    if(this.scene==='SETTINGS'){
      if(key==='ArrowUp')this.settingsSelected=(this.settingsSelected+3)%4;if(key==='ArrowDown')this.settingsSelected=(this.settingsSelected+1)%4;
      if(['ArrowLeft','ArrowRight'].includes(key)&&this.settingsSelected===1){this.sound.volume=Math.round(Math.max(0,Math.min(1,this.sound.volume+(key==='ArrowRight'?.1:-.1)))*10)/10;this.save();}
      if(confirm(key)){if(this.settingsSelected===0)this.toggleSound();if(this.settingsSelected===1){this.sound.volume=Math.round((this.sound.volume+.1)%1.1*10)/10;this.save();}if(this.settingsSelected===2){this.reduced=!this.reduced;this.save();}if(this.settingsSelected===3)this.change('TITLE');}return;
    }
    if(this.scene==='ROOM_INTRO'){if(confirm(key)){this.line=0;this.change('DIALOGUE');}return;}
    if(['DIALOGUE','ANSWER','OUTRO'].includes(this.scene)){if(confirm(key))this.advance();return;}
    if(this.scene==='QUESTION'){if(key==='ArrowUp')this.selected=(this.selected+2)%3;if(key==='ArrowDown')this.selected=(this.selected+1)%3;if(confirm(key)){this.question=this.selected;this.line=0;this.change('ANSWER');}return;}
    if(this.scene==='INTERVIEW'){if(this.interviewAnswer){if(confirm(key)){if(this.typed<this.interviewAnswer.length)this.typed=this.interviewAnswer.length;else this.resumeExploration();}}else{if(key==='ArrowUp')this.selected=(this.selected+2)%3;if(key==='ArrowDown')this.selected=(this.selected+1)%3;if(confirm(key))this.answerInterview(this.selected);}return;}
    if(this.scene==='DIVE'){if(confirm(key))this.change('PUZZLE');return;}
    if(this.scene==='PUZZLE'){
      if(key==='KeyR'){this.retry();return;}if(key==='KeyF'){this.flag();return;}if(key==='KeyQ'||key==='KeyH'){this.openInterview();return;}
      if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(key)){const p=this.board.selected;this.selectTile({x:Math.max(0,Math.min(this.board.width-1,p.x+(key==='ArrowLeft'?-1:key==='ArrowRight'?1:0))),y:Math.max(0,Math.min(this.board.height-1,p.y+(key==='ArrowUp'?-1:key==='ArrowDown'?1:0)))});}
      if(confirm(key))this.openCell();return;
    }
    if(this.scene==='REPORT'&&confirm(key)){if(this.sceneTime<9)this.sceneTime=9;else this.change('COMPLETE');return;}
    if(this.scene==='COMPLETE'&&confirm(key))this.change('TITLE');
  }
  private update(dt:number){
    this.time+=dt;
    if(!this.art.ready&&!['TITLE','SETTINGS'].includes(this.scene)){this.input.clear();this.sound.update('TITLE',this.pause);return;}
    // Consume at most one action at a scene boundary; no input leaks into the next scene.
    for(const key of this.input.take()){const before=this.scene;this.sound.unlock();this.key(key);if(this.scene!==before)break;}
    this.sound.update(this.scene==='INTERVIEW'?'DIALOGUE':['EXPLOSION','GAMEOVER'].includes(this.scene)?'DIVE':this.scene,this.pause||this.scene==='GAMEOVER',this.board.failed);
    if(this.pause)return;
    this.effects.update(dt);
    this.sceneTime+=dt;this.typed+=dt*25;
    if(['DIALOGUE','ANSWER','OUTRO'].includes(this.scene)&&Math.floor(this.typed/3)!==this.lastGlyph&&this.typed<this.currentLine().text.length){this.lastGlyph=Math.floor(this.typed/3);this.sound.play('type');}
    if(this.scene==='ROOM_INTRO'&&this.sceneTime>3){this.line=0;this.change('DIALOGUE');}
    if(this.scene==='DIVE'){const shot=diveShotAt(this.sceneTime,this.reduced,this.returningToMind);if(shot.index!==this.lastDiveShot){this.sound.play('zap');this.lastDiveShot=shot.index;}if(this.sceneTime>DIVE_DURATION)this.change('PUZZLE');}
    if(this.scene==='EXPLOSION'&&this.sceneTime>1.8)this.change('GAMEOVER');
    if(this.scene==='RETURN'&&this.sceneTime>2.5){this.line=0;this.change('OUTRO');}
    if(this.scene==='REPORT'&&this.sceneTime>8&&!this.stampPlayed){this.sound.play('stamp');this.stampPlayed=true;}
  }
  private frame=(now:number)=>{const dt=this.previous?Math.min((now-this.previous)/1000,.1):0;this.previous=now;this.accumulator+=dt;while(this.accumulator>=1/60){this.update(1/60);this.accumulator-=1/60;}this.draw();requestAnimationFrame(this.frame);};
  private dialogue() {const a=this.art,l=this.currentLine();a.box(7,123,306,51,'#c5bfcb','#0a0b13');a.text(l.speaker,16,129,'#c3a68c',6);a.wrapped(l.text.slice(0,Math.floor(this.typed)),17,141,279,'#e9e3da',7,11);if(this.typed>=l.text.length&&Math.floor(this.time*2)%2)a.text('▼',301,162,'#bda4be',6);}
  private puzzle(){this.renderer.draw(this.art,this.board,this.time,this.reduced,this.effects);}
  private draw(){const a=this.art,c=a.c;c.globalAlpha=1;const scale=(this.canvas.width||320)/320;c.setTransform(scale,0,0,scale,0,0);a.rect(0,0,320,180,'#090912');
    if(!this.art.ready&&!['TITLE','SETTINGS'].includes(this.scene)){a.text('記憶の輪郭を、読み込んでいます。',160,82,'#d6bdcf',9,'center');return;}
    if(this.scene==='TITLE')return;
    else if(this.scene==='SETTINGS'){a.room(this.time);c.globalAlpha=.7;a.rect(0,0,320,180,'#080b14');c.globalAlpha=1;a.box(48,26,224,129,'#b69db8','#12111e');a.text('SETTINGS / 設定',65,39,'#e5d1ba',8);const settings=[`サウンド：${this.sound.muted?'OFF':'ON'}`,`音量：${Math.round(this.sound.volume*100)}%  ← →`,`動き・点滅の軽減：${this.reduced?'ON':'OFF'}`,'タイトルへ戻る'];settings.forEach((s,i)=>{a.text(i===this.settingsSelected?'◆':'',64,63+i*18,'#e5acb0',7);a.text(s,78,63+i*18,i===this.settingsSelected?'#e9dccb':'#8a819a',7);});a.text('ENTER 変更 / ESC 戻る',160,143,'#8a819a',5,'center');}
    else if(['ROOM_INTRO','DIALOGUE','QUESTION','ANSWER','OUTRO'].includes(this.scene)){a.room(this.time,this.scene==='ROOM_INTRO'?65+Math.min(1,this.sceneTime/2.5)*46:111,this.scene!=='ROOM_INTRO'||this.sceneTime>2.5);if(['DIALOGUE','ANSWER','OUTRO'].includes(this.scene))this.dialogue();if(this.scene==='ROOM_INTRO'){a.box(7,135,306,39);a.text('扉が、静かに開く。',19,147,'#aca0b3',7);a.text('ENTER 進む',301,162,'#726b82',5,'right');}if(this.scene==='QUESTION'){a.box(7,115,306,59);a.text('どの言葉から、たどってみよう。',17,121,'#a58ba7',6);questions.forEach((s,i)=>{a.text(i===this.selected?'◆':'',18,135+i*11,'#e2a8aa',6);a.text(s,32,135+i*11,i===this.selected?'#efe2d2':'#8c819a',7);});}}
    else if(this.scene==='DIVE') {
      const shot=diveShotAt(this.sceneTime,this.reduced,this.returningToMind);
      if(shot.image==='room')a.room(this.time);
      else if(shot.image==='face')a.faceCloseup(false);
      else if(shot.image==='brain')a.brain(this.time,this.reduced);
      else this.puzzle();
      if(shot.interference){
        // Brief horizontal signal breaks, confined to dark tinted bands.
        for(let i=0;i<5;i++){const y=(i*37+shot.index*13)%151;a.rect(0,y,320,2+i%3,i%2?'#331d475c':'#14394c66');a.rect((i*71+shot.index*29)%270,y+3,38,1,'#ba7ea66b');}
      }
      a.rect(0,155,320,25,'#0a0c16d9');a.text(shot.caption,160,159,'#d8c8d8',7,'center');a.text('決定でスキップ',307,173,'#9b8ca4',4,'right');
    }
    else if(this.scene==='INTERVIEW'){
      a.room(this.time);a.box(7,106,306,68,'#bcb5c8','#090b14');a.text('カウンセリング / 安全なマスが見えてきます',16,112,'#b69ebd',6);
      if(this.interviewAnswer)a.wrapped(this.interviewAnswer.slice(0,Math.floor(this.typed)),16,125,286,'#eee0d6',7,11);
      else counselingQuestions.forEach((q,i)=>a.text(`${i===this.selected?'◆':' '} ${q.title}`,17,124+i*11,i===this.selected?'#ead9c1':'#a298b0',6));
    }
    else if(['PUZZLE','RETURN'].includes(this.scene)){
      this.puzzle();
      if(this.scene==='RETURN'){c.globalAlpha=Math.min(1,this.sceneTime/2);a.rect(0,0,320,180,'#13141e');c.globalAlpha=1;a.text('呼吸が、少しずつ落ち着いていく。',160,83,'#d4bdc6',8,'center');}
    }
    else if(this.scene==='EXPLOSION'||this.scene==='GAMEOVER'){
      c.save();if(!this.reduced&&this.scene==='EXPLOSION')c.translate(Math.sin(this.time*35)*1.6,Math.cos(this.time*27));a.faceCloseup(false);c.globalAlpha=.55;a.rect(0,0,320,180,'#340c29');c.globalAlpha=1;
      if(this.scene==='EXPLOSION'){
        const t=this.sceneTime;for(let i=0;i<18;i++){const angle=i*2.399,x=160+Math.cos(angle)*(t*90+i*2),y=85+Math.sin(angle)*(t*65+i);a.rect(x,y,2,1,i%2?'#d57caa':'#c64a67');}
        if(!this.reduced)a.intrusion(this.time,false,.4);
        a.box(37,117,246,49,'#c27c9b','#190d1fea');a.text('「いやだ……声が、止まらない……！」',160,130,'#f3d0db',8,'center');a.text('地雷が爆発した',160,149,'#c997ab',6,'center');
      }else{
        c.globalAlpha=.6;a.rect(0,0,320,180,'#0a0812');c.globalAlpha=1;a.text('GAME OVER',160,48,'#f1d2dc',20,'center');a.text('患者がパニックに陥った。',160,86,'#dfb3c9',9,'center');a.text('一度、呼吸を整えてから。',160,105,'#bba5bb',7,'center');a.text('ENTER / R もう一度    ESC タイトルへ',160,145,'#d2bd9d',6,'center');
      }
      c.restore();
    }
    else if(this.scene==='REPORT'){a.room(this.time);c.globalAlpha=.65;a.rect(0,0,320,180,'#0a0b15');c.globalAlpha=1;a.polygon([[62,9],[244,9],[259,24],[259,170],[62,170]],'#ddd1bb');a.polygon([[244,9],[244,24],[259,24]],'#afa38f');a.text('診 断 書',160,20,'#3a3541',11,'center');a.rect(77,38,165,1,'#ab9c8c');const lines=[['氏名　田辺 悠介（28）',48],['所見',66],['強い心理的負担に伴う心身の不調が',79],['認められる。職場での継続的な負荷が',90],['背景にある可能性があり、休養と',101],['継続的な評価が望ましい。',112],['院内医師確認済・署名　朝倉 灯',135]] as const;lines.forEach(([s,y],i)=>{const count=Math.max(0,Math.floor((this.sceneTime-i*.8-.5)*24));a.text(s.slice(0,count),78,y,'#403b47',7);});if(this.sceneTime>=8){a.box(222,132,24,24,'#ac4559','#ddd1bb');a.text('確認',234,136,'#ac4559',8,'center');a.text('済',234,145,'#ac4559',8,'center');a.text('架空のゲーム内文書',79,157,'#8a7b7c',4);}a.text(this.sceneTime>=9?'ENTER 書類を渡す':'ENTER 印字を完了',160,174,'#b9a8bb',5,'center');}
    else if(this.scene==='COMPLETE'){a.rect(0,0,320,180,'#10111b');a.rect(154,37,12,1,'#aa9475');a.text('SESSION COMPLETE',160,62,'#e7d3b7',13,'center');a.text('頭の中に、少し静けさが戻った。',160,91,'#b5a3bc',8,'center');a.text('整理することは、ここからも続いていく。',160,108,'#746c86',6,'center');a.text('ENTER タイトルへ',160,147,'#c3ac8b',6,'center');}
    if(this.pause){c.globalAlpha=.86;a.rect(0,0,320,180,'#090b15');c.globalAlpha=1;a.box(72,47,176,87,'#76647f','#11121e');a.text('PAUSED',160,61,'#ddcbb5',12,'center');a.text('急がなくて、大丈夫。',160,82,'#aa97b5',7,'center');a.text('ENTER / ESC 再開',160,102,'#d7bd9f',6,'center');a.text('R パズルを最初から    M 音',160,118,'#7e748c',5,'center');}
  }
}
