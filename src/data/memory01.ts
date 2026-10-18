import type {Category} from '../excavation/TileTypes';
export const memoryCards = [
 {id:1,title:'21:47',time:'MEMORY 01 / FRIDAY',text:'21:47。まだ仕事が終わらない。',detail:'記録には、追加された担当業務と退勤時刻が残っていた。',category:'event' as Category,panel:1},
 {id:2,title:'会議室',time:'MEMORY 02 / MONDAY',text:'「これくらい普通だ。代わりはいくらでもいる」',detail:'人前で上司から向けられた言葉。悠介自身が選んだ言葉ではない。',category:'others' as Category,panel:3},
 {id:3,title:'自分への言葉',time:'MEMORY 03 / INNER VOICE',text:'「仕事ができない自分が悪い」',detail:'帰り道、上司の言葉を思い返しながら、自分の中で生まれた解釈。',category:'interpretation' as Category,panel:2}
];
export const interviewQuestions=[
 {title:'会議室では、何がありましたか？',answer:'みんなの前で、上司に責められました。あの場では何も言えなくて……。',clue:'interview'},
 {title:'遅い時間、何をしていましたか？',answer:'金曜日の業務メモに、増えた担当を書きました。頭の中心あたりに、まだ残っています。',clue:'noteHint'},
 {title:'「自分が悪い」は、誰の言葉ですか？',answer:'同じ言葉を言われたわけではなくて……帰り道、自分でそう考えました。',clue:'selfHint'},
 {title:'いま分かったことを、少し確認しましょう。',answer:'はい。急いで全部思い出さなくても、いいんですね。続きをお願いします。',clue:'rest'}
];
