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

  function geometry(span, panels, height, topology) {
    if(!(span>0 && height>0 && Number.isInteger(panels) && panels>=2))
      throw Error("Invalid geometry");
    if(!["Pratt","Howe"].includes(topology)) throw Error("Unknown topology");
    const nodes=[];
    for(let i=0;i<=panels;i++) nodes.push([i*span/panels,0]);
    for(let i=0;i<=panels;i++) nodes.push([i*span/panels,height]);
    const top=panels+1, members=[];
    for(let i=0;i<panels;i++) members.push([i,i+1],[top+i,top+i+1]);
    for(let i=0;i<=panels;i++) members.push([i,top+i]);
    for(let i=0;i<panels;i++) members.push(topology==="Pratt"?[i,top+i+1]:[top+i,i+1]);
    return {nodes,members};
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
    const {nodes,members}=geometry(span,panels,height,topology);
    const external=Array(nodes.length*2).fill(0);
    for(let i=1;i<panels;i++) external[2*i+1]=-totalLoad/(panels-1);
    const model=analyze(nodes,members,Array(members.length).fill(area),material,external,
      [0,1,2*panels+1]);
    const stressRatio=model.maxStress/material.allowable;
    const movementRatio=model.maxDisplacement/(span/300);
    return {...model,nodes,members,topology,area,stressRatio,movementRatio,
      passes:stressRatio<=1 && movementRatio<=1};
  }

  function screen(span,totalLoad,panels,height,material){
    const candidates=[];
    for(const topology of ["Pratt","Howe"]){
      for(let j=0;j<55;j++){
        const area=0.0005*Math.pow(100,j/54);
        const r=evaluate(span,totalLoad,panels,height,topology,material,area);
        if(r.passes){candidates.push(r);break;}
      }
    }
    return candidates.sort((a,b)=>a.mass-b.mass);
  }

  global.SpanForgeSolver={materials,geometry,analyze,evaluate,screen};
})(window);
