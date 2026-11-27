/* SpanForge: original educational 2D pin-jointed finite-element truss solver. */
(function(global) {
  "use strict";
  const materials = Object.freeze({
    bamboo: {name:"Bamboo (illustrative)", E:12e9, density:700, allowable:8e6},
    timber: {name:"Timber (illustrative)", E:10e9, density:500, allowable:6e6}
  });

  function solveLinear(Ain, bin) {
    const n=bin.length, A=Ain.map(row=>row.slice()), b=bin.slice();
    for(let k=0;k<n;k++){
      let pivot=k;
      for(let r=k+1;r<n;r++) if(Math.abs(A[r][k])>Math.abs(A[pivot][k])) pivot=r;
      if(!Number.isFinite(A[pivot][k]) || Math.abs(A[pivot][k])<1e-12)
        throw Error("Unstable truss model. Adjust the supports or geometry.");
      [A[k],A[pivot]]=[A[pivot],A[k]]; [b[k],b[pivot]]=[b[pivot],b[k]];
      for(let r=k+1;r<n;r++){
        const f=A[r][k]/A[k][k]; A[r][k]=0;
        for(let c=k+1;c<n;c++) A[r][c]-=f*A[k][c];
        b[r]-=f*b[k];
      }
    }
    const x=Array(n).fill(0);
    for(let i=n-1;i>=0;i--){
      let s=b[i];
      for(let j=i+1;j<n;j++) s-=A[i][j]*x[j];
      x[i]=s/A[i][i];
    }
    if(x.some(v=>!Number.isFinite(v))) throw Error("Numerical model failure.");
    return x;
  }

  const topologies=Object.freeze(["Pratt","Howe","Warren","Warren with verticals","X-braced","K-braced","Parker","Camelback-inspired","Bowstring-inspired","Fan"]);

  function geometry(span, panels, height, topology) {
    if(!(span>0 && height>0 && Number.isInteger(panels) && panels>=2))
      throw Error("Invalid geometry");
    if(!topologies.includes(topology)) throw Error("Unknown topology");
    const nodes=[], members=[];
    const add=(a,b)=>members.push([a,b]);
    for(let i=0;i<=panels;i++) nodes.push([i*span/panels,0]);
    for(let i=0;i<panels;i++) add(i,i+1);
    const top=nodes.length;
    const pratt=(i)=>i<panels/2 ? [top+i,i+1] : [i,top+i+1];
    const howe=(i)=>i<panels/2 ? [i,top+i+1] : [top+i,i+1];

    if(topology==="Warren"){
      for(let i=0;i<panels;i++) nodes.push([(i+0.5)*span/panels,height]);
      for(let i=0;i<panels;i++){
        add(i,top+i); add(i+1,top+i);
        if(i<panels-1) add(top+i,top+i+1);
      }
    } else if(topology==="Fan"){
      nodes.push([span/2,height]);
      for(let i=0;i<=panels;i++) add(i,top);
    } else if(topology==="Bowstring-inspired"){
      // Tied, polygonal upper chord: end joints coincide with deck supports.
      const upper=[0];
      for(let i=1;i<panels;i++){
        upper.push(nodes.length);
        const t=i/panels;
        nodes.push([t*span,4*height*t*(1-t)]);
      }
      upper.push(panels);
      for(let i=0;i<panels;i++) add(upper[i],upper[i+1]);
      for(let i=1;i<panels;i++) add(i,upper[i]);
      for(let i=1;i<panels-1;i++){
        if(i<panels/2) add(upper[i],i+1);
        else add(i,upper[i+1]);
      }
    } else {
      for(let i=0;i<=panels;i++){
        const t=i/panels, s=Math.min(t,1-t);
        let y=height;
        if(topology==="Parker") y=height*(0.45+0.55*4*t*(1-t));
        if(topology==="Camelback-inspired"){
          // Five upper-chord regions: steep, shallow, level, shallow, steep.
          y=height*(s<=0.2?0.4+2*s:s<=0.4?0.8+(s-0.2):1);
        }
        nodes.push([t*span,y]);
      }
      for(let i=0;i<panels;i++) add(top+i,top+i+1);
      if(topology==="K-braced"){
        for(let i=0;i<panels;i++){
          const mid=nodes.length;
          nodes.push([nodes[i][0],nodes[top+i][1]/2]);
          add(i,mid); add(mid,top+i);
          add(mid,i+1); add(mid,top+i+1);
        }
        add(panels,top+panels);
      } else {
        for(let i=0;i<=panels;i++) add(i,top+i);
        for(let i=0;i<panels;i++){
          if(topology==="Howe") add(...howe(i));
          else if(topology==="Warren with verticals") add(...(i%2===0?[i,top+i+1]:[top+i,i+1]));
          else if(topology==="X-braced"){add(i,top+i+1);add(top+i,i+1);}
          else add(...pratt(i));
        }
      }
    }
    return {nodes,members,loadNodes:Array.from({length:panels-1},(_,i)=>i+1),supportNodes:[0,panels]};
  }

  function analyze(nodes,members,areas,material,forces,fixedDofs){
    const n=nodes.length, size=2*n;
    if(members.length!==areas.length) throw Error("Area list mismatch");
    const K=Array.from({length:size},()=>Array(size).fill(0));
    const elements=[];
    for(let m=0;m<members.length;m++){
      const [a,b]=members[m], A=areas[m];
      if(!(A>0)) throw Error("Invalid area");
      const dx=nodes[b][0]-nodes[a][0], dy=nodes[b][1]-nodes[a][1];
      const L=Math.hypot(dx,dy);
      if(!(L>1e-10)) throw Error("Zero-length member");
      const t=[-dx/L,-dy/L,dx/L,dy/L], dofs=[2*a,2*a+1,2*b,2*b+1];
      const factor=material.E*A/L;
      for(let i=0;i<4;i++) for(let j=0;j<4;j++)
        K[dofs[i]][dofs[j]]+=factor*t[i]*t[j];
      elements.push({L,t,dofs,A});
    }
    const locked=new Set(fixedDofs);
    const free=Array.from({length:size},(_,i)=>i).filter(i=>!locked.has(i));
    const subK=free.map(i=>free.map(j=>K[i][j]));
    const subF=free.map(i=>forces[i]);
    const uf=solveLinear(subK,subF),u=Array(size).fill(0);
    free.forEach((index,i)=>{u[index]=uf[i]});
    const reactions=K.map((row,i)=>row.reduce((sum,v,j)=>sum+v*u[j],0)-forces[i]);
    const axial=elements.map(e=>material.E*e.A/e.L*e.t.reduce((s,v,i)=>s+v*u[e.dofs[i]],0));
    const stresses=axial.map((f,i)=>f/elements[i].A);
    const mass=elements.reduce((s,e)=>s+e.L*e.A*material.density,0);
    let movement=0;
    for(let i=0;i<n;i++) movement=Math.max(movement,Math.hypot(u[2*i],u[2*i+1]));
    return {u,forces:axial,stresses,reactions,mass,
      maxStress:Math.max(...stresses.map(Math.abs)),maxDisplacement:movement};
  }

  function evaluate(span,totalLoad,panels,height,topology,material,area){
    const {nodes,members,loadNodes,supportNodes}=geometry(span,panels,height,topology);
    const external=Array(nodes.length*2).fill(0);
    for(let i=1;i<panels;i++) external[2*i+1]=-totalLoad/(panels-1);
    const model=analyze(nodes,members,Array(members.length).fill(area),material,external,
      [0,1,2*panels+1]);
    const stressRatio=model.maxStress/material.allowable;
    const movementRatio=model.maxDisplacement/(span/300);
    return {...model,nodes,members,loadNodes,supportNodes,topology,area,stressRatio,movementRatio,
      passes:stressRatio<=1 && movementRatio<=1};
  }

  function screen(span,totalLoad,panels,height,material){
    const candidates=[];
    const minArea=0.0005, maxArea=minArea*100;
    const levels=Array.from({length:55},(_,j)=>minArea*Math.pow(100,j/54));
    for(const topology of topologies){
      try{
        // With fixed geometry, material and uniform area, stress and
        // displacement both scale inversely with area in this linear model.
        const first=evaluate(span,totalLoad,panels,height,topology,material,minArea);
        const required=minArea*Math.max(1,first.stressRatio,first.movementRatio);
        let index=levels.findIndex(a=>a>=required*(1-1e-12));
        if(index<0) index=levels.length-1;
        let result=index===0?first:evaluate(span,totalLoad,panels,height,topology,material,levels[index]);
        if(!result.passes && index<levels.length-1)
          result=evaluate(span,totalLoad,panels,height,topology,material,levels[index+1]);
        candidates.push(result);
      }catch(error){
        candidates.push({topology,passes:false,error:error.message});
      }
    }
    return candidates.sort((a,b)=>Number(b.passes)-Number(a.passes)||
      (a.error?1:0)-(b.error?1:0)||(a.mass??Infinity)-(b.mass??Infinity));
  }

  global.SpanForgeSolver={materials,topologies,geometry,analyze,evaluate,screen};
})(window);
