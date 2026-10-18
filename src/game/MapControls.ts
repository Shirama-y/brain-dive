import type {Point} from '../excavation/TileTypes';
/** Real map buttons are transparent but accessible. A swipe/cancel never excavates. */
export function bindMapControls(root:HTMLElement,select:(p:Point)=>void,activate:(p:Point)=>void,observe:(p:Point)=>void){
 const touches=new Map<number,{x:number;y:number;point:Point}>();
 root.querySelectorAll<HTMLButtonElement>('[data-x]').forEach(button=>{
  const point={x:Number(button.dataset.x),y:Number(button.dataset.y)};
  button.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&e.buttons===0)select(point);});
  button.addEventListener('focus',()=>select(point));
  button.addEventListener('pointerdown',e=>{if(e.button!==0)return;touches.set(e.pointerId,{x:e.clientX,y:e.clientY,point});button.setPointerCapture(e.pointerId);});
  button.addEventListener('pointerup',e=>{const start=touches.get(e.pointerId);touches.delete(e.pointerId);if(start&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<=8){e.preventDefault();activate(start.point);}});
  for(const event of ['pointercancel','lostpointercapture'])button.addEventListener(event,e=>touches.delete((e as PointerEvent).pointerId));
  button.addEventListener('click',e=>{if(e.detail===0)activate(point);});
  button.addEventListener('contextmenu',e=>{e.preventDefault();observe(point);});
 });
 window.addEventListener('blur',()=>touches.clear());
}
