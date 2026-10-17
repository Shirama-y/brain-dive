export class Sound {
  context?: AudioContext;
  muted = true;
  volume = .3;
  unlock() { try {this.context ??= new AudioContext();void this.context.resume().catch(()=>{});}catch {/* Audio is optional. */} }
  play(kind:'step'|'confirm'|'clear'|'dive'|'stamp'|'rotate'|'land') {
    if(this.muted || !this.context)return;
    const c=this.context, o=c.createOscillator(), g=c.createGain(), now=c.currentTime;
    const params={step:[100,70,.035],confirm:[330,520,.1],clear:[660,220,.28],dive:[150,35,.6],stamp:[90,40,.15],rotate:[260,340,.045],land:[150,75,.065]}[kind];
    o.type=kind==='clear'?'sine':'triangle';o.frequency.setValueAtTime(params[0],now);o.frequency.exponentialRampToValueAtTime(params[1],now+params[2]);g.gain.setValueAtTime(this.volume*.12,now);g.gain.exponentialRampToValueAtTime(.0001,now+params[2]);o.connect(g);g.connect(c.destination);o.start(now);o.stop(now+params[2]);
  }
}
