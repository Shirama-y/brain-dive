export const DIVE_DURATION=3.8;
export type DiveImage='room'|'face'|'brain'|'puzzle';
// Cut between fixed, full-frame illustrations. No growing mask or camera zoom.
const standard:readonly [number,DiveImage][]=[
 [0,'room'],[.7,'face'],[1.2,'room'],[1.55,'face'],[2,'brain'],[2.35,'face'],[2.7,'brain'],[3.15,'puzzle']
];
const gentle:readonly [number,DiveImage][]=[[0,'room'],[1,'face'],[2,'brain'],[2.9,'puzzle']];
export function diveShotAt(time:number,reduced:boolean,returning=false){
 const shots=reduced?gentle:standard;let index=0;
 for(let i=1;i<shots.length;i++)if(time>=shots[i][0])index=i;
 const image=shots[index][1],sinceCut=Math.max(0,time-shots[index][0]);
 const caption=image==='room'?(returning?'さっき話せたことを、手がかりに。':'ここにいるまま、声の奥へ。'):image==='face'?(returning?'……今度は、少し見えそうです。':'……声が、景色になっていく。'):image==='brain'?'急がなくて大丈夫。見えるところから。':'迷ったら、また話を聞きましょう。';
 return {image,index,caption,interference:!reduced&&index>0&&sinceCut<.09};
}
