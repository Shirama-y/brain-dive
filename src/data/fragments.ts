export type FragmentId='reprimand'|'notification'|'overtime';
export interface MemoryFragment {id:FragmentId;topic:number;panel:number;title:string;line:string}
export const fragments:readonly MemoryFragment[]=[
 {id:'reprimand',topic:0,panel:3,title:'会議室の沈黙',line:'みんなの前で。誰も、何も言わなくて。'},
 {id:'notification',topic:1,panel:2,title:'返せなかった通知',line:'画面を閉じても、謝る言葉ばかり考えていました。'},
 {id:'overtime',topic:2,panel:1,title:'終電前のオフィス',line:'終わらないのは、努力が足りないせいだと……。'}
];
export const fragmentById=(id:FragmentId)=>fragments.find(f=>f.id===id)!;
