import {describe,it,expect} from 'vitest';
import {midiToHz,scoreStep,Sound} from './Audio';
describe('オリジナルBGM',()=>{
 it('音階を正しい周波数へ変換する',()=>{expect(midiToHz(69)).toBe(440);expect(midiToHz(57)).toBe(220);});
 it('上司の登場で脳内BGMのテンポを上げる',()=>{expect(scoreStep('brain',0,true).bpm).toBeGreaterThan(scoreStep('brain',0,false).bpm);expect(scoreStep('room',0).beat).toBe(false);expect(scoreStep('brain',0).beat).toBe(true);});
 it('64ステップでコード進行が循環し、毎ステップは鳴らさない',()=>{expect(scoreStep('room',0)).toEqual(scoreStep('room',64));expect(scoreStep('room',1).melodic).toBe(false);expect(scoreStep('room',16).root).not.toBe(scoreStep('room',0).root);});
 it('AudioContext未解放・非対応でもゲームを止めない',()=>{const sound=new Sound();expect(()=>{sound.update('PUZZLE',false,true);sound.play('boss');sound.unlock();}).not.toThrow();});
});
