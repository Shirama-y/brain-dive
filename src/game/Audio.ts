export type MusicMood = 'waiting'|'room'|'dive'|'brain'|'memory'|'return'|'report';
export type SoundCue = 'step'|'confirm'|'clear'|'dive'|'stamp'|'crack'|'release'|'memory'|'boss'|'win'|'type'|'dig'|'observe'|'breath'|'blast';
export const midiToHz = (midi:number) => 440*Math.pow(2,(midi-69)/12);
const ROOTS=[45,41,48,43];
const MOTIF=[12,19,24,22,19,15,14,19,12,19,27,24,22,19,15,14];
export function scoreStep(mood:MusicMood,step:number,boss=false){
  const root=ROOTS[Math.floor(step/16)%4];
  return {root,melody:root+MOTIF[step%16],bpm:mood==='brain'?(boss?92:78):mood==='dive'?64:56,
    pad:step%16===0,bass:step%4===0,melodic:step%(mood==='brain'?2:4)===0,beat:mood==='brain'&&step%4===0};
}
/** Original generative score: felt-like bells, minor pads, a pulse, and tape-delay space. */
export class Sound {
  context?: AudioContext;
  muted=false; volume=.45;
  private master?:GainNode; private music?:GainNode; private effects?:GainNode;
  private next=0; private step=0; private mood:MusicMood='waiting';
  private lastLevel=-1; private lastVolume=-1; private boss=false;
  get playing(){return !!this.context&&this.context.state==='running'&&!this.muted;}
  get track(){return this.mood==='brain'?(this.boss?'脳内 / 上司の残響':'脳内 / 残響の迷路'):this.mood==='room'?'診療室 / 九時の雨':this.mood==='memory'?'記憶 / ほどける糸':this.mood==='dive'?'潜行 / 声の奥':this.mood==='waiting'?'待合室 / 微かな輪郭':'帰還 / 名前のある朝';}
  unlock(){
    try{
      if(!this.context){
        const c=this.context=new AudioContext();this.master=c.createGain();this.music=c.createGain();this.effects=c.createGain();
        this.master.gain.value=this.muted?0:this.volume;this.music.gain.value=.75;this.effects.gain.value=.7;
        const limiter=c.createDynamicsCompressor();limiter.threshold.value=-18;limiter.ratio.value=5;
        this.music.connect(this.master);this.effects.connect(this.master);this.master.connect(limiter);limiter.connect(c.destination);
        const echo=c.createDelay(2), feedback=c.createGain(), wet=c.createGain(), filter=c.createBiquadFilter();
        echo.delayTime.value=.42;feedback.gain.value=.24;wet.gain.value=.3;filter.type='lowpass';filter.frequency.value=1800;
        this.music.connect(echo);echo.connect(filter);filter.connect(feedback);feedback.connect(echo);filter.connect(wet);wet.connect(this.master);
        this.next=c.currentTime+.08;
      }
      void this.context.resume().catch(()=>{});
    }catch{/* Silent play remains available on unsupported browsers. */}
  }
  private note(midi:number,start:number,duration:number,amplitude:number,type:OscillatorType='sine',effects=false,detune=0){
    if(!this.context)return;const c=this.context,o=c.createOscillator(),g=c.createGain();
    o.type=type;o.frequency.value=midiToHz(midi);o.detune.value=detune;
    g.gain.setValueAtTime(.0001,start);g.gain.exponentialRampToValueAtTime(Math.max(.0002,amplitude),start+Math.min(.08,duration*.15));g.gain.exponentialRampToValueAtTime(.0001,start+duration);
    o.connect(g);g.connect((effects?this.effects:this.music)!);o.start(start);o.stop(start+duration+.02);
    o.onended=()=>{o.disconnect();g.disconnect();};
  }
  update(scene:string,paused:boolean,boss=false,pressure=0){
    if(!this.context||!this.master||!this.music)return;
    const c=this.context;const volume=this.muted?0:this.volume;
    if(volume!==this.lastVolume){this.master.gain.setTargetAtTime(volume,c.currentTime,.12);this.lastVolume=volume;}
    const level=paused?0:scene==='RETURN'?.04:.75;if(level!==this.lastLevel){this.music.gain.setTargetAtTime(level,c.currentTime,.2);this.lastLevel=level;}
    if(paused||this.muted||c.state!=='running'){this.next=c.currentTime+.08;return;}
    const mood:MusicMood=scene==='TITLE'||scene==='SETTINGS'?'waiting':['ROOM_INTRO','DIALOGUE','QUESTION','ANSWER','OUTRO'].includes(scene)?'room':scene==='DIVE'?'dive':scene==='PUZZLE'?'brain':scene==='MEMORY'?'memory':scene==='RETURN'?'return':'report';
    if(mood!==this.mood){this.mood=mood;this.step=0;this.next=c.currentTime+.08;}
    this.boss=boss;
    if(this.next<c.currentTime)this.next=c.currentTime+.03;
    while(this.next<c.currentTime+.18){
      const s=scoreStep(mood,this.step,this.boss), beat=60/s.bpm, t=this.next;
      if(s.pad){for(const [i,interval]of [0,7,10,14].entries()){this.note(s.root+12+interval,t+i*.025,beat*7,.022,'sine',false,i%2?5:-5);}}
      if(s.bass)this.note(s.root,t,beat*1.8,mood==='brain'?.06:.025,'sine');
      if(s.melodic){this.note(s.melody+(mood==='memory'?12:0),t,beat*(mood==='brain'?1.4:3),mood==='room'?.022:.032,'sine');this.note(s.melody+12,t+.004,beat*.7,.006,'triangle');}
      if(s.beat){this.note(29,t,.2,.065,'sine');if(pressure>7||boss)this.note(40,t+beat*.22,.09,.017,'triangle');}
      if(mood==='dive')this.note(33+this.step%8,t,beat*1.5,.025,'triangle');
      if(mood==='waiting'&&this.step%8===6)this.note(s.root+31,t,beat*3,.012,'sine');
      this.next+=beat/2;this.step++;
    }
  }
  play(kind:SoundCue){
    if(this.muted||!this.context||!this.effects)return;
    const c=this.context,now=c.currentTime;
    if(kind==='breath'){const buffer=c.createBuffer(1,c.sampleRate*2.4,c.sampleRate),data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*Math.sin(Math.PI*i/data.length)*.07;const source=c.createBufferSource(),filter=c.createBiquadFilter();filter.type='lowpass';filter.frequency.value=550;source.buffer=buffer;source.connect(filter);filter.connect(this.effects);source.start();source.onended=()=>{source.disconnect();filter.disconnect();};return;}
    if(['memory','release','win'].includes(kind)){
      const notes=kind==='memory'?[69,76,79,83]:kind==='win'?[57,64,69,72,76]:[64,69,76];
      notes.forEach((note,i)=>this.note(note,now+i*.095,1.5,.05,'sine',true));return;
    }
    if(kind==='boss'){[33,34,45].forEach((note,i)=>this.note(note,now+i*.05,.8,.04,'triangle',true));return;}
    const params:Record<string,number[]>={blast:[75,24,.55,.12],dig:[115,38,.2,.09],observe:[420,630,.18,.035],step:[100,70,.035,.035],confirm:[330,520,.1,.07],clear:[660,220,.35,.09],dive:[150,35,.9,.075],stamp:[90,40,.15,.1],crack:[430,180,.2,.065],type:[720,600,.02,.01]};
    const p=params[kind]??params.clear,o=c.createOscillator(),g=c.createGain();
    o.type=kind==='clear'?'sine':'triangle';o.frequency.setValueAtTime(p[0],now);o.frequency.exponentialRampToValueAtTime(p[1],now+p[2]);g.gain.setValueAtTime(p[3],now);g.gain.exponentialRampToValueAtTime(.0001,now+p[2]);o.connect(g);g.connect(this.effects);o.start(now);o.stop(now+p[2]);o.onended=()=>{o.disconnect();g.disconnect();};
  }
}
