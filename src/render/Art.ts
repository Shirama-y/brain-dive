import { NovelAssets } from './NovelAssets';
type Emotion = 'ANXIETY'|'GUILT'|'FATIGUE';
const COLORS:Record<Emotion,string>={ANXIETY:'#a378e0',GUILT:'#e36d91',FATIGUE:'#54accc'};
export class Art {
  private novel=new NovelAssets();
  get ready(){return this.novel.ready;}
  constructor(public c: CanvasRenderingContext2D) { c.imageSmoothingEnabled = false; }
  rect(x:number,y:number,w:number,h:number,color:string) {this.c.fillStyle=color;this.c.fillRect(Math.round(x),Math.round(y),w,h);}
  text(s:string,x:number,y:number,color='#eee9df',size=7,align:CanvasTextAlign='left') { const c=this.c; c.font=size>=7?`${size}px "Hiragino Mincho ProN", "Yu Mincho", serif`:`${size}px "Hiragino Kaku Gothic ProN", "Yu Gothic", monospace`; c.textBaseline='top'; c.textAlign=align; c.fillStyle=color;c.fillText(s,Math.round(x),Math.round(y)); }
  line(points:number[][],color:string,width=1) {const c=this.c;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  polygon(points:number[][],color:string) {const c=this.c;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(Math.round(x),Math.round(y)):c.moveTo(Math.round(x),Math.round(y)));c.closePath();c.fillStyle=color;c.fill();}
  box(x:number,y:number,w:number,h:number,border='#bfb9b9',fill='#0c0c15') {this.rect(x,y,w,h,border);this.rect(x+1,y+1,w-2,h-2,fill);this.rect(x+3,y+3,1,1,'#55515d');}
  wrapped(s:string,x:number,y:number,max:number,color='#eee9df',size=7,lineHeight=11) {let line='',row=0; for(const ch of s){this.c.font=size>=7?`${size}px "Hiragino Mincho ProN", "Yu Mincho", serif`:`${size}px "Hiragino Kaku Gothic ProN", "Yu Gothic", monospace`;if(ch==='\n'||this.c.measureText(line+ch).width>max){this.text(line,x,y+row*lineHeight,color,size);line=ch==='\n'?'':ch;row++;}else line+=ch;}if(line)this.text(line,x,y+row*lineHeight,color,size);}
  eye(x:number,y:number,size:number,t:number,color='#f1b976') {this.polygon([[x-size,y],[x-size/2,y-size/2],[x+size/2,y-size/2],[x+size,y],[x+size/2,y+size/2],[x-size/2,y+size/2]],'#5b285e');this.polygon([[x-size+2,y],[x-size/2,y-size/3],[x+size/2,y-size/3],[x+size-2,y],[x+size/2,y+size/3],[x-size/2,y+size/3]],color);this.rect(x-2+Math.round(Math.sin(t)*1),y-size/3,4,Math.max(2,Math.round(size*2/3)),'#171323');this.rect(x+1,y-1,1,1,'#fff0d0');}
  patient(x:number,y:number,scale=1,walk=0) {
    const c=this.c;c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
    const r=(a:number,b:number,w:number,h:number,col:string)=>this.rect(a,b,w,h,col);
    r(-8,-5,18,18,'#10121e');r(-10,-1,21,10,'#151726');r(-6,4,14,11,'#d3b6a8');r(-8,1,17,5,'#181b29');r(-9,2,6,9,'#181b29');r(1,2,3,7,'#181b29');r(8,4,3,6,'#181b29');r(-3,9,2,2,'#292333');r(5,9,2,2,'#292333');r(2,13,3,1,'#a5797b');r(-3,15,8,4,'#b89891');r(-9,18,20,21,'#77798d');r(-10,20,4,15,'#5b6077');r(8,20,4,15,'#555c75');r(-3,18,3,10,'#a0a0aa');r(1,18,2,20,'#41485c');r(-8,33,5,3,'#bca69f');r(7,33,4,3,'#bca69f');r(-6,39,6,13,'#292c42');r(3,39,6,13,'#25283c');r(-7+(walk?Math.sin(walk)*2:0),51,7,3,'#161925');r(3-(walk?Math.sin(walk)*2:0),51,7,3,'#161925');c.restore();
  }
  /** A separate seated pose: hips on the cushion, horizontal thighs and feet on the floor. */
  seatedPatient(x:number,y:number,scale=1) {
    const c=this.c;c.save();c.translate(Math.round(x),Math.round(y));c.scale(scale,scale);
    const r=(a:number,b:number,w:number,h:number,col:string)=>this.rect(a,b,w,h,col);
    this.polygon([[-9,1],[-6,-5],[4,-7],[11,-3],[13,5],[9,14],[-6,14]],'#141725');
    r(-5,4,14,11,'#cbb0a4');r(-7,1,18,5,'#1a1d2b');r(-7,4,4,8,'#1a1d2b');r(3,3,3,5,'#1a1d2b');r(9,5,3,6,'#1a1d2b');r(-2,10,2,1,'#292333');r(6,10,2,1,'#292333');r(3,14,3,1,'#9c737b');r(-2,15,7,4,'#aa8e89');
    this.polygon([[-6,18],[5,17],[10,21],[11,34],[4,38],[-8,36],[-10,25]],'#73768b');
    this.polygon([[-3,18],[1,21],[5,18],[6,28],[1,31]],'#a0a0aa');r(1,24,2,12,'#454b60');
    // Bent arms rest across the lap, independently of the walking sprite.
    r(-10,22,5,10,'#555d75');r(-9,30,10,4,'#696d83');r(-1,32,6,3,'#c5aaa0');
    r(9,22,4,10,'#555c75');r(4,31,8,4,'#666c82');r(1,33,5,3,'#c5aaa0');
    r(-7,36,13,6,'#30334b');r(3,36,15,6,'#393a51');r(-5,41,6,13,'#292c42');r(11,41,6,12,'#292c42');r(-7,53,10,3,'#151925');r(10,52,10,3,'#151925');
    r(-4,42,1,8,'#42465e');r(12,42,1,7,'#42465e');c.restore();
  }
  /** Close-up artwork drawn at native resolution; never a scaled walking sprite. */
  faceCloseup(pupil=4,psychedelic=false) {
    if(this.novel.draw(this.c,'closeup',0,0,320,180)){
      if(psychedelic)this.intrusion(1,false,.17);
      this.c.fillStyle='#070911';this.c.beginPath();this.c.arc(185,58,Math.max(0,pupil-4),0,Math.PI*2);this.c.fill();return;
    }
    this.rect(0,0,320,180,'#10121e');
    this.polygon([[39,180],[57,150],[102,131],[216,132],[267,153],[285,180]],'#484d64');
    this.polygon([[116,124],[192,125],[204,156],[165,176],[109,152]],'#947e85');
    this.polygon([[113,146],[157,173],[143,180],[90,154]],'#777b91');
    this.polygon([[202,144],[169,174],[185,180],[224,158]],'#777b91');
    this.polygon([[88,37],[112,18],[183,15],[221,35],[234,71],[226,117],[209,143],[175,155],[137,149],[109,131],[91,100]],'#b69d98');
    this.polygon([[193,32],[222,40],[234,72],[226,117],[208,140],[178,152],[171,136],[202,119],[212,82]],'#927f89');
    this.polygon([[94,80],[110,106],[119,131],[140,145],[134,130],[114,105],[106,73]],'#9b8490');
    this.polygon([[78,64],[80,37],[96,16],[124,5],[160,1],[196,8],[224,23],[239,48],[235,88],[222,109],[218,67],[206,45],[192,72],[182,75],[184,47],[162,74],[147,78],[151,48],[134,70],[112,84],[116,56],[102,83],[100,112],[84,95]],'#171b2b');
    this.line([[90,43],[112,22],[143,14],[169,17]],'#242a40',3);this.line([[184,19],[212,33],[222,51]],'#292b42',2);
    this.line([[120,78],[139,74],[151,77]],'#453849',2);this.line([[165,74],[190,72],[207,78]],'#453849',2);
    this.polygon([[115,85],[128,80],[143,81],[153,86],[140,92],[125,92]],'#c9bbb6');
    this.polygon([[161,84],[174,77],[195,78],[211,85],[195,94],[175,94]],'#d8c8bf');
    this.rect(132,82,8,10,'#635d70');this.rect(135,83,3,8,'#171a29');this.rect(134,82,2,2,'#d8c8bf');
    for(let dy=-10;dy<=10;dy+=2){const w=Math.floor(Math.sqrt(100-dy*dy));this.rect(185-w,85+dy,w*2+1,2,psychedelic?(dy%4?'#a67eb9':'#62a1b4'):'#6b647b');}
    this.line([[162,84],[174,78],[195,79],[211,85]],'#332b3e',2);this.line([[174,98],[192,100],[203,96]],'#7d6476');this.line([[121,96],[136,98],[146,95]],'#8c7080');
    this.line([[157,90],[152,111],[157,115],[166,113]],'#8a6d7b');this.line([[146,132],[160,130],[174,132]],'#75596a');this.line([[151,136],[167,137]],'#a1848d');
    for(const [x,y] of [[120,107],[123,110],[126,112],[198,110],[201,107],[135,123],[207,91]])this.rect(x,y,2,1,'#a48a91');
    this.rect(187,80,2,2,'#dcd3ca');
    // Only the dark opening expands; the face and its pixels stay fixed.
    const radius=Math.max(4,Math.round(pupil));
    for(let dy=-radius;dy<=radius;dy+=2){const w=Math.floor(Math.sqrt(radius*radius-dy*dy));this.rect(185-w,85+dy,w*2+1,2,'#070911');}
  }
  room(t:number,patientX=106,seated=true) {
    if(this.novel.draw(this.c,'scenes',0,0,320,180,0)){
      const progress=seated?1:Math.max(0,Math.min(1,(patientX-65)/46));
      this.c.save();this.c.globalAlpha=progress;
      const image=this.novel.get('patient');if(image){const h=174,w=h*image.naturalWidth/image.naturalHeight;this.novel.draw(this.c,'patient',39-(1-progress)*18,6,w,h);}
      this.c.restore();
      this.c.save();this.c.globalAlpha=.22;for(let i=0;i<15;i++)this.rect(204+(i*29)%104,25+(i*19+Math.floor(t*2))%88,1,1,'#e2bd8b');this.c.restore();
      return;
    }
    this.rect(0,0,320,180,'#0b101c');this.rect(0,0,320,14,'#10121e');this.rect(0,14,320,85,'#1c2030');
    for(let x=0;x<320;x+=17){this.rect(x,15,1,84,'#2b2c3d');this.rect(x+2,15,1,84,'#141b2a');}
    this.rect(0,97,320,5,'#111522');this.rect(0,102,320,78,'#262638');
    for(let y=104;y<180;y+=12){this.rect(0,y,320,1,'#1a1d2e');for(let x=(y%24?20:0);x<320;x+=43)this.rect(x,y,1,12,'#1b1d2d');}
    // Shelves, door, window, clock, framed print: spare, quiet geometry.
    this.rect(9,23,35,77,'#111523');for(let y=28;y<97;y+=22){for(let x=13;x<40;x+=5){const h=10+(x+y)%8;this.rect(x,y+16-h,3,h,['#626075','#41485f','#7e6866'][x%3]);}this.rect(10,y+17,33,3,'#4e4656');}
    this.rect(52,25,37,77,'#111422');this.rect(55,28,31,72,'#8e776c');this.rect(58,32,25,64,'#9e8373');this.rect(79,66,2,4,'#d7b880');this.rect(63,36,15,8,'#bca68a');this.text('診療室',64,38,'#4d4350',4);
    this.rect(213,22,71,62,'#111625');this.rect(217,25,63,55,'#c48c6b');for(let y=26;y<78;y+=5){this.rect(218,y,61,3,'#131d2c');this.rect(219,y+3,58,1,'#e2a375');}this.rect(246,23,2,60,'#171c2b');
    this.rect(144,30,25,25,'#101422');this.rect(146,32,21,21,'#a19b91');this.rect(149,35,15,15,'#d0c2a8');this.line([[157,37],[157,43],[162,44]],'#393747');this.rect(155,41,2,2,'#655c5a');
    // Slatted amber light and reflections anchor the quiet nocturnal room.
    for(let i=0;i<8;i++){this.c.globalAlpha=.10-i*.007;this.polygon([[218,49+i*5],[277,49+i*5],[250-i*9,122+i*2],[194-i*7,122+i*2]],'#e0ac7c');}this.c.globalAlpha=1;
    for(let i=0;i<70;i++){const x=(i*31+19)%320,y=104+(i*7)%68;this.rect(x,y,2+i%8,1,i%3===0?'#75505a44':'#51546a22');}
    this.rect(144,33,25,26,'#302b3a');this.rect(146,35,21,22,'#9b876f');this.rect(148,37,17,18,'#bca487');this.text('CERTIFIED',156,41,'#655448',3,'center');this.line([[151,47],[162,47],[152,50],[161,51]],'#7e6958');
    // Plant.
    this.rect(180,78,13,18,'#696178');this.rect(178,77,17,3,'#8b7a8c');this.line([[186,80],[186,56]],'#4f8c7e',2);
    for(const [x,y,dir] of [[179,61,-1],[190,59,1],[176,68,-1],[191,69,1],[185,54,1]])this.polygon([[186,y+7],[x+dir*4,y],[x,y-2],[186,y+2]],'#47766e');
    // Chairs, patient and clinician.
    this.rect(95,87,32,31,'#151827');this.rect(98,89,26,22,'#4a455b');this.rect(97,111,30,7,'#575164');this.rect(99,117,3,14,'#131725');this.rect(122,117,3,14,'#131725');
    if(seated)this.seatedPatient(111,73);else this.patient(patientX,59,1,t*10);
    this.rect(233,91,37,38,'#101320');this.rect(236,94,31,32,'#5c5060');
    this.polygon([[234,91],[235,77],[241,69],[256,66],[268,73],[271,87],[267,98],[238,98]],'#161724');
    this.polygon([[238,87],[240,77],[247,72],[257,72],[266,80],[266,91],[261,96],[242,94]],'#77717d');this.rect(242,80,4,14,'#5a5464');this.rect(261,78,4,16,'#555060');
    this.polygon([[240,97],[263,97],[272,121],[233,124]],'#303044');
    this.rect(137,111,160,9,'#766674');this.rect(140,120,155,6,'#3d354c');this.rect(145,126,6,32,'#272536');this.rect(280,126,6,32,'#242233');
    this.polygon([[151,108],[174,107],[178,111],[154,112]],'#c5b8a7');this.rect(161,107,10,1,'#6d6570');this.rect(201,106,5,5,'#a18f8c');this.rect(202,104,3,2,'#cabba3');
    this.rect(293,83,2,28,'#b59872');this.rect(285,109,18,3,'#9b826e');this.polygon([[288,71],[300,71],[306,84],[282,84]],'#dfb881');this.rect(286,84,16,2,'#a7886d');
    this.c.globalAlpha=.035+Math.sin(t)*.006;this.polygon([[282,85],[306,85],[320,123],[260,123]],'#ffe3ac');this.c.globalAlpha=1;
    // Warm lamp bloom, dust, and subdued edge shadows; no strobing.
    for(let i=0;i<8;i++){this.c.globalAlpha=.012;this.rect(269-i*6,60-i*4,46+i*12,49+i*9,'#efbc83');}this.c.globalAlpha=1;
    for(let i=0;i<22;i++){const x=202+(i*29)%104,y=25+(i*19+Math.floor(t*2))%88;this.rect(x,y,1,1,i%3?'#e2bd8b44':'#efe0c555');}
    this.rect(0,0,14,180,'#060a1255');this.rect(306,0,14,180,'#060a1255');
    this.rect(0,0,320,9,'#11131e');this.text('INTERIOR CLINIC',12,3,'#777489',4);this.text('月曜日 / 09:00',306,3,'#777489',4,'right');
  }
  headPath() {const c=this.c;c.beginPath();c.moveTo(126,13);c.lineTo(159,6);c.lineTo(198,12);c.lineTo(225,27);c.lineTo(236,51);c.lineTo(235,86);c.lineTo(225,108);c.lineTo(221,135);c.lineTo(237,153);c.lineTo(231,169);c.lineTo(145,171);c.lineTo(141,157);c.lineTo(121,155);c.lineTo(112,148);c.lineTo(110,137);c.lineTo(104,132);c.lineTo(110,126);c.lineTo(100,121);c.lineTo(95,112);c.lineTo(83,109);c.lineTo(81,104);c.lineTo(95,88);c.lineTo(97,68);c.lineTo(102,41);c.lineTo(113,24);c.closePath();}
  brain(t:number,reduced:boolean,boss=false) {
    if(this.novel.draw(this.c,'brain',0,0,320,180)){
      this.intrusion(t,reduced,.17);if(boss)this.boss(264,28,t);return;
    }
    this.rect(0,0,320,180,'#0a0812');const c=this.c;
    for(let i=0;i<80;i++){const x=(i*83+7)%320,y=(i*37+11)%180;this.rect(x,y,1,1,i%3?'#332041':'#63506c');}
    this.intrusion(t,reduced,.42);
    // Outermost branching nerves, drawn on integer coordinates.
    for(let i=0;i<24;i++) {const a=i/24*Math.PI*2;const x=159+Math.cos(a)*87,y=87+Math.sin(a)*78;const w=reduced?0:Math.sin(t*.8+i)*2;this.line([[159,85],[x,y],[x+Math.cos(a+.4)*15,y+Math.sin(a+.4)*15],[x+Math.cos(a)*25+w,y+Math.sin(a)*22]],i%3===0?'#793c99':i%3===1?'#343375':'#9c326b');}
    c.save();this.headPath();c.fillStyle='#282044';c.fill();c.strokeStyle='#a24d9e';c.lineWidth=3;c.stroke();c.clip();
    // Pixel terrain and folds. Keep all ornament behind the dark rectangular board.
    for(let y=8;y<171;y+=3) for(let x=82;x<239;x+=3) {const n=Math.sin(x*.12+Math.sin(y*.13)*2+(reduced?0:t*.25))*Math.cos(y*.09+x*.035);if(n>.32)this.rect(x,y,3,3,['#7841ad','#cf3a96','#3b707e','#b25486'][Math.abs(Math.floor(n*13+y/9))%4]);else if(n<-.5)this.rect(x,y,3,2,'#111a36');}
    for(let i=0;i<12;i++){let pts:number[][]=[];for(let j=0;j<17;j++)pts.push([95+j*9,17+i*12+Math.sin(j*.8+i+(reduced?0:t*.2))*5]);this.line(pts,i%2?'#df6296':'#49b7c1');}
    this.eye(115,45,10,t,'#f7c16f');this.eye(191,20,8,t+2,'#52d0c7');this.eye(222,62,7,t,'#f0a2c7');this.eye(218,125,8,t,'#b98cf1');this.eye(154,156,9,t,'#eba866');
    // Tiny office fragments embedded in the brain.
    this.rect(207,81,17,16,'#1a2234');this.rect(209,83,13,9,'#486d83');this.rect(212,96,8,2,'#5d557a');this.rect(203,100,25,3,'#9d718b');for(let i=0;i<4;i++)this.rect(103+i*3,137-i*2,2,12,'#66518a');
    c.restore();this.line([[97,71],[106,75],[114,74]],'#e395b4',2);this.eye(104,78,5,t,'#dbc2c7');this.line([[97,83],[96,91],[84,105],[97,108]],'#dca5b3');this.line([[101,120],[110,122],[106,127]],'#b278a4');
    for(const [x,y] of [[225,91],[106,146]]){this.rect(x,y,8,15,'#702b75');this.rect(x+1,y+1,6,13,'#cf5187');this.rect(x+5,y+8,1,1,'#f8c8b3');}
    if(boss)this.boss(264,28,t);
  }
  boss(x:number,y:number,t:number) {
    if(this.novel.get('scenes')){
      this.c.save();this.c.globalAlpha=.86+Math.sin(t*1.5)*.08;this.box(x-23,y-7,64,45,'#b16593','#110d21');this.novel.draw(this.c,'scenes',x-22,y-6,62,43,3);this.c.globalAlpha=.14;this.rect(x-22,y-6,62,43,'#ea3e9a');this.c.restore();return;
    }
    const c=this.c;c.save();c.translate(x,y);
    this.polygon([[-15,0],[-6,-7],[11,-6],[21,2],[19,20],[13,31],[2,35],[-13,25],[-19,13]],'#3a1b37');
    this.polygon([[-10,0],[7,-2],[15,4],[13,21],[5,29],[-8,22],[-14,10]],'#bf526b');this.polygon([[-17,3],[-13,-5],[4,-10],[17,-5],[21,5],[9,2],[1,-2],[-11,5]],'#151323');
    this.line([[-12,7],[-4,10]],'#25142d',2);this.line([[3,9],[13,5]],'#25142d',2);this.rect(-10,11,5,2,'#f1bdad');this.rect(5,11,5,2,'#f1bdad');this.rect(-6,11,1,3,'#20142a');this.rect(5,10,1,3,'#20142a');
    this.polygon([[-4,19],[7,17],[10,23],[5,28],[-3,26]],'#261425');this.rect(-1,19,6,2,'#e5c9b6');this.rect(1,24,5,2,'#e08a9b');
    for(let i=0;i<4;i++)this.line([[-17,6+i*5],[-22-Math.sin(t+i)*3,9+i*4]],'#79345b');c.restore();
  }
  block(kind:Emotion,x:number,y:number) {
    const color=COLORS[kind];
    this.rect(x,y,9,9,'#0b0b16');this.rect(x+1,y,7,9,color);this.rect(x,y+1,9,7,color);this.rect(x+1,y+1,7,1,'#ffffff44');this.rect(x+1,y+7,7,1,'#00000035');
    const ink='#242033';this.rect(x+2,y+3,1,2,ink);this.rect(x+6,y+3,1,2,ink);
    if(kind==='ANXIETY'){this.rect(x+3,y+6,3,1,ink);this.rect(x+4,y+5,1,1,ink);this.rect(x+7,y+1,1,1,'#eee5ff');}
    if(kind==='GUILT'){this.rect(x+1,y+2,2,1,ink);this.rect(x+6,y+2,2,1,ink);this.rect(x+4,y+6,1,1,ink);}
    if(kind==='FATIGUE'){this.rect(x+2,y+3,2,1,ink);this.rect(x+5,y+3,2,1,ink);this.rect(x+3,y+6,3,1,ink);}

  }
  title(t:number,reduced:boolean) {
    // A waiting-room title rather than an enlarged copy of the puzzle board.
    this.room(t,65,false);const c=this.c;
    c.globalAlpha=.72;this.rect(0,0,320,180,'#070a14');c.globalAlpha=1;
    this.rect(17,15,128,148,'#080c17cc');
    this.rect(180,15,116,150,'#080c1777');
    this.eye(243,44,15,t,'#bb8baa');
    this.text('CASE FILE 001',28,27,'#c3a88b',5);this.text('BRAIN',26,44,'#eee4dc',23);this.text('DIVE',26,70,'#eee4dc',23);
    this.text('— 診 断 書 —',30,103,'#ceb8c6',8);this.text('その声を、ほどく。',30,119,'#9d899e',6);
    this.text('月曜の朝',237,99,'#d5b7aa',8,'center');this.text('田辺 悠介 / 28',237,114,'#8c8296',5,'center');
    if(!reduced){for(let i=0;i<10;i++){const y=24+(i*17)%120;this.rect(191+(i*11)%87,y,2+((i*13+Math.floor(t*4))%12),1,'#b93c8c66');}}
    this.text('HEADPHONES RECOMMENDED',21,171,'#7c6d88',4);
  }
  intrusion(t:number,reduced:boolean,strength:number) {
    const c=this.c;c.save();c.globalAlpha=strength;
    for(let i=0;i<36;i++){
      const x=(i*73+13)%320,y=(i*37+Math.floor(reduced?0:t*7))%180;
      this.rect(x,y,2+(i*11)%16,i%5===0?3:1,['#dc348e','#5a3287','#337b98'][i%3]);
      if(i%5===0)this.line([[x,y],[x-9,y+7],[x+6,y+18]],'#7c337b');
    }
    for(const [x,y,size]of [[28,31,13],[278,134,12],[291,18,9],[42,144,8]])this.eye(x,y,size,reduced?0:t,'#b67cbd');
    c.restore();
  }
  memory(index:number) {
    if(this.novel.get('scenes')){this.box(66,12,188,151,'#b9a0b3','#11101f');this.novel.draw(this.c,'scenes',73,31,174,58,[1,3,2][index-1]);return;}
    const x=87,y=31;this.box(70,12,181,151,'#c99abf','#161324');this.rect(x,y,147,58,'#24263c');
    if(index===1){this.rect(x+7,y+6,132,26,'#111c31');for(let i=0;i<16;i++){this.rect(x+10+i*8,y+9,2,2,'#b9957177');this.rect(x+10+i*8,y+19,3,2,'#69748d');}this.seatedPatient(x+73,y+21,.5);this.rect(x+41,y+45,65,4,'#75657f');this.rect(x+79,y+29,17,13,'#5b7891');this.rect(x+81,y+31,13,9,'#20394c');this.text('21:47',x+5,y+50,'#dda982',5);}
    if(index===3){this.rect(x+57,y+3,35,52,'#0b0c19');this.rect(x+60,y+6,29,45,'#4c5267');for(let i=0;i<4;i++){this.rect(x+63,y+10+i*9,23,6,i%2?'#777388':'#c17d9a');this.rect(x+65,y+12+i*9,17,1,'#2d243e');}this.rect(x+72,y+51,5,2,'#858299');this.text('7 NEW MESSAGES',x+5,y+51,'#b78ba8',4);}
    if(index===2){for(let i=0;i<4;i++){this.rect(x+12+i*33,y+6,17,31,'#3b3e55');this.eye(x+20+i*33,y+18,7,0,'#9b8d9f');}this.rect(x+13,y+40,121,8,'#746176');this.boss(x+116,y+10,0);this.seatedPatient(x+52,y+29,.48);for(let i=0;i<7;i++)this.rect(x+72+i*5,y+38-i,4,2,'#b7a6a1');}
  }
}
