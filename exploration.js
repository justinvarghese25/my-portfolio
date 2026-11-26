'use strict';

// A small simulated unknown-world explorer for the illustration, not recorded project data.
window.createExploration = (requestedSeed) => {
  const seed=requestedSeed===undefined?crypto.getRandomValues(new Uint32Array(1))[0]:requestedSeed>>>0;
  let randomState=seed||1;
  const random=()=>{randomState^=randomState<<13;randomState^=randomState>>>17;randomState^=randomState<<5;return(randomState>>>0)/4294967296;};
  const occupied=(r,c)=>r===0||r===11||c===0||c===23||((c===8||c===16)&&![4,5,8,9].includes(r))||(r===6&&c===4)||(r===5&&(c===12||c===13))||(r===7&&c===20);
  function visible(c0,r0,c1,r1,blocked=occupied){
    let x=c0,y=r0;const dx=Math.abs(c1-c0),dy=-Math.abs(r1-r0),sx=c0<c1?1:-1,sy=r0<r1?1:-1;let error=dx+dy;
    while(x!==c1||y!==r1){const twice=2*error;if(twice>=dy){error+=dy;x+=sx;}if(twice<=dx){error+=dx;y+=sy;}if(x===c1&&y===r1)return true;if(blocked(y,x))return false;}
    return true;
  }
  const robots=Array.from({length:3},(_,robot)=>{
    const lower=robot*8,upper=lower+7,known=new Uint8Array(96),visited=new Uint8Array(96),discoveredAt=new Int16Array(96).fill(-1);
    const index=(c,r)=>r*8+c-lower;
    const within=(c,r)=>c>=lower&&c<=upper&&r>=0&&r<12;
    const frames=[{c:lower+2,r:9}];let current=frames[0];
    function sense(){
      for(let r=Math.max(0,current.r-2);r<=Math.min(11,current.r+2);r++)for(let c=Math.max(lower,current.c-2);c<=Math.min(upper,current.c+2);c++){
        if(Math.hypot(c-current.c,r-current.r)>2.4||!visible(current.c,current.r,c,r))continue;
        const i=index(c,r);if(!known[i])discoveredAt[i]=frames.length-1;known[i]=occupied(r,c)?2:1;
      }
      visited[index(current.c,current.r)]=1;
    }
    function neighbors(c,r){return[[c+1,r],[c-1,r],[c,r+1],[c,r-1]].filter(([x,y])=>within(x,y));}
    sense();
    for(let attempts=0;attempts<300&&known.some(value=>value===0);attempts++){
      // Plan only through sensed free cells. Choose a random reachable frontier, biased nearby.
      const queue=[current],parents=new Map([[index(current.c,current.r),null]]),distance=new Map([[index(current.c,current.r),0]]);
      for(let head=0;head<queue.length;head++){
        const point=queue[head];const adjacent=neighbors(point.c,point.r);if(random()<.5)adjacent.reverse();
        for(const[c,r]of adjacent){const i=index(c,r);if(known[i]!==1||parents.has(i))continue;parents.set(i,index(point.c,point.r));distance.set(i,distance.get(index(point.c,point.r))+1);queue.push({c,r});}
      }
      const candidates=queue.filter(p=>{
        for(let r=Math.max(0,p.r-2);r<=Math.min(11,p.r+2);r++)for(let c=Math.max(lower,p.c-2);c<=Math.min(upper,p.c+2);c++)if(!known[index(c,r)]&&Math.hypot(c-p.c,r-p.r)<=2.4&&visible(p.c,p.r,c,r,(y,x)=>known[index(x,y)]===2))return true;
        return false;
      });
      if(!candidates.length)break;
      const weights=candidates.map(p=>(visited[index(p.c,p.r)]?.6:2)/(1+distance.get(index(p.c,p.r))));
      let roll=random()*weights.reduce((a,b)=>a+b,0),chosen=candidates[candidates.length-1];
      for(let i=0;i<candidates.length;i++){roll-=weights[i];if(roll<=0){chosen=candidates[i];break;}}
      const route=[];let cursor=index(chosen.c,chosen.r);
      while(parents.get(cursor)!==null){route.push({c:lower+cursor%8,r:Math.floor(cursor/8)});cursor=parents.get(cursor);}
      if(!route.length){sense();break;}
      for(const point of route.reverse()){current=point;frames.push(point);sense();}
    }
    return{frames,discoveredAt,coverage:[...known].filter(Boolean).length/96,signature:frames.map(p=>`${p.c},${p.r}`).join(';')};
  });
  return{seed,robots,duration:32,occupied};
};
