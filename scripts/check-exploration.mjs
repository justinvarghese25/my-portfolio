import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {createContext,runInContext} from 'node:vm';
import assert from 'node:assert/strict';

const context=createContext({window:{},crypto:webcrypto});
runInContext(readFileSync(new URL('../exploration.js',import.meta.url),'utf8'),context);
const signatures=new Set();
for(let seed=1;seed<=100;seed++){
  const run=context.window.createExploration(seed);
  signatures.add(run.robots[0].signature);
  run.robots.forEach((robot,index)=>{
    assert.equal(robot.coverage,1,`Incomplete observable coverage for seed ${seed}`);
    robot.frames.forEach((point,step)=>{
      assert.ok(!run.occupied(point.r,point.c),'Robot entered an occupied cell');
      assert.ok(point.c>=index*8&&point.c<index*8+8,'Robot left its assigned region');
      if(step){const previous=robot.frames[step-1];assert.equal(Math.abs(point.c-previous.c)+Math.abs(point.r-previous.r),1,'Non-adjacent exploration movement');}
    });
    for(const step of robot.discoveredAt)assert.ok(step>=0&&step<robot.frames.length);
  });
}
assert.ok(signatures.size>95,'Random seeds should produce different exploration routes');
console.log('100 exploration seeds passed: observable coverage, collision avoidance, adjacent moves, and varied routes.');
