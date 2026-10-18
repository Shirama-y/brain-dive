import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Input } from './Input';
import { bindTouchControls } from './TouchControls';
let input: Input, buttons: HTMLElement[], root: HTMLElement;
let unlock=vi.fn(()=>{});
beforeEach(()=>{
  vi.stubGlobal('window',new EventTarget());
  const canvas=new EventTarget() as HTMLCanvasElement;
  vi.stubGlobal('document',{activeElement:canvas});
  input=new Input(canvas);
  buttons=['ArrowLeft','ArrowDown','Enter'].map(code=>Object.assign(new EventTarget(),{dataset:{key:code},setPointerCapture:vi.fn()}) as unknown as HTMLElement);
  root=Object.assign(new EventTarget(),{querySelectorAll:()=>buttons}) as unknown as HTMLElement;
  unlock=vi.fn(()=>{});
  bindTouchControls(root,input,vi.fn(),unlock);
});
afterEach(()=>vi.unstubAllGlobals());
function pointer(index:number,type:string,id=1){buttons[index].dispatchEvent(Object.assign(new Event(type),{button:0,pointerId:id}));}
describe('タッチ操作',()=>{
  it('指を押した時に1回入力し、長押しで移動、離せば停止する',()=>{
    pointer(0,'pointerdown');expect(input.take()).toEqual(['ArrowLeft']);expect(input.repeat(.3)).toEqual(['ArrowLeft']);expect(unlock).toHaveBeenCalled();
    pointer(0,'pointerup');expect(input.repeat(.3)).toEqual([]);expect(input.held.size).toBe(0);
  });
  it('複数の指でメニューの上下を同時に操作でき、キャンセルでも解除する',()=>{
    pointer(0,'pointerdown',1);pointer(1,'pointerdown',2);expect(input.held.has('ArrowDown')).toBe(true);
    pointer(0,'pointercancel',1);expect(input.held.has('ArrowLeft')).toBe(false);expect(input.held.has('ArrowDown')).toBe(true);
    pointer(1,'lostpointercapture',2);expect(input.held.size).toBe(0);
  });
  it('同じボタンに2本の指があっても、最後の指を離すまで保持する',()=>{
    pointer(0,'pointerdown',1);pointer(0,'pointerdown',2);expect(input.take()).toEqual(['ArrowLeft']);
    pointer(0,'pointerup',1);expect(input.held.has('ArrowLeft')).toBe(true);pointer(0,'pointerup',2);expect(input.held.size).toBe(0);
  });
  it('画面切替時に保持入力を消し、ポインターなしの決定操作にも対応する',()=>{
    pointer(0,'pointerdown');input.clear();expect(input.take()).toEqual([]);expect(input.held.size).toBe(0);
    buttons[2].dispatchEvent(Object.assign(new Event('click'),{detail:0}));expect(input.take()).toEqual(['Enter']);expect(input.held.size).toBe(0);
  });
});
