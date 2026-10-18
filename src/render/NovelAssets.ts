export type NovelImage = 'scenes'|'clinic'|'closeup'|'brain';
const files:Record<NovelImage,string>={scenes:'novel-scenes.png',clinic:'clinic-seated-v2.png',closeup:'novel-closeup.png',brain:'novel-brain.png'};
/** Original illustration layers remain high resolution; puzzle coordinates stay 320×180. */
export class NovelAssets {
  private images:Partial<Record<NovelImage,HTMLImageElement>>={};
  constructor(){
    if(typeof Image==='undefined')return;
    for(const [key,file]of Object.entries(files)){
      const image=new Image();image.decoding='async';image.src=new URL(`assets/${file}`,document.baseURI).href;this.images[key as NovelImage]=image;
    }
  }
  get ready(){return Object.values(this.images).every(image=>image.complete);}
  get(key:NovelImage){const image=this.images[key];return image?.complete&&image.naturalWidth?image:undefined;}
  draw(c:CanvasRenderingContext2D,key:NovelImage,x:number,y:number,w:number,h:number,panel?:number){
    const image=this.get(key);if(!image)return false;c.save();c.imageSmoothingEnabled=true;
    if(panel===undefined)c.drawImage(image,x,y,w,h);
    else{const sw=image.naturalWidth/2,sh=image.naturalHeight/2;c.drawImage(image,(panel%2)*sw,Math.floor(panel/2)*sh,sw,sh,x,y,w,h);}
    c.restore();return true;
  }
}
