const captured = new Set(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','Enter','Escape','KeyX','KeyZ','KeyH','KeyR','KeyM']);
export class Input {
  held = new Set<string>(); private pressed: string[]=[]; private elapsed=new Map<string,number>();
  constructor(private canvas:HTMLCanvasElement) {
    window.addEventListener('keydown',e=>{if(document.activeElement!==canvas)return;if(captured.has(e.code))e.preventDefault();if(!e.repeat)this.press(e.code);});
    window.addEventListener('keyup',e=>{this.release(e.code);});
    window.addEventListener('blur',()=>this.clear());canvas.addEventListener('blur',()=>this.clear());
  }
  press(code:string) {if(!this.held.has(code))this.pressed.push(code);this.held.add(code);}
  release(code:string) {this.held.delete(code);this.elapsed.delete(code);}
  take() {const p=this.pressed;this.pressed=[];return p;}
  repeat(dt:number) {const result:string[]=[];for(const code of ['ArrowLeft','ArrowRight']){if(!this.held.has(code))continue;let elapsed=(this.elapsed.get(code)??0)+dt;if(elapsed>.24){result.push(code);elapsed=.19;}this.elapsed.set(code,elapsed);}return result;}
  clear(){this.held.clear();this.pressed=[];this.elapsed.clear();}
}
