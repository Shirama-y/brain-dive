import {describe,it,expect} from 'vitest';
import {diveShotAt,DIVE_DURATION} from './DiveTransition';
describe('脳内へのザッピング',()=>{
 it('診療室・患者の顔・盤面を往復し、最後は盤面に着地する',()=>{expect([0,.8,1.3,1.7,2.1,2.5,2.9,3.4].map(t=>diveShotAt(t,false).image)).toEqual(['room','face','room','face','puzzle','face','room','puzzle']);expect(diveShotAt(DIVE_DURATION,false).image).toBe('puzzle');});
 it('動き軽減では4つの静かなカットにし、ノイズを出さない',()=>{expect([0,1.1,2.1,3.1].map(t=>diveShotAt(t,true).image)).toEqual(['room','face','room','puzzle']);for(let t=0;t<4;t+=.03)expect(diveShotAt(t,true).interference).toBe(false);});
 it('再入場の言葉は相談で得た手がかりへつなぎ、ノイズは切替直後だけ',()=>{expect(diveShotAt(0,false,true).caption).toContain('さっき話せたこと');expect(diveShotAt(.71,false).interference).toBe(true);expect(diveShotAt(.9,false).interference).toBe(false);});
});
