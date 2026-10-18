export type FragmentId='reprimand'|'notification'|'overtime';
export interface MemoryFragment {id:FragmentId;topic:number;panel:number;title:string;scene:string;patient:string;insight:string}
export const fragments:readonly MemoryFragment[]=[
 {id:'reprimand',topic:0,panel:3,title:'会議室の沈黙',scene:'机に置かれた資料。身を乗り出す上司。周りの人は、目を伏せていた。',patient:'『これくらい普通だろ』って、みんなの前で。誰も何も言わなくて……。',insight:'叱責の怖さに、助けを求められなかった孤独が重なっていた。'},
 {id:'notification',topic:1,panel:2,title:'返せなかった通知',scene:'休日の帰り道。通知を消しても、画面にあった言葉が頭から離れない。',patient:'すぐに返さないと迷惑になる気がして。画面を閉じても、謝る言葉ばかり考えていました。',insight:'職場を離れても、自分を責める声は続いていた。'},
 {id:'overtime',topic:2,panel:1,title:'終電前のオフィス',scene:'窓の外はもう夜。誰もいない机の列に、キーボードの音だけが残る。',patient:'気づくと、いつも最後の一人でした。終わらないのは、自分の努力が足りないからだと……。',insight:'仕事の量と、休んではいけないという気持ち。その両方が、疲れを積み重ねていた。'}
];
export const fragmentById=(id:FragmentId)=>fragments.find(f=>f.id===id)!;
