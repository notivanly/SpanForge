"use strict";
const $=id=>document.getElementById(id);
const defaults={span:"12",load:"20",height:"2.5",panels:"6",material:"bamboo"};
const ids=["span","load","height","panels","material"];
function fmt(n,d=1){return Number.isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:d,minimumFractionDigits:d}):"—";}
function svgDrawing(r){
  const W=920,H=340,padX=68,padY=65;
  const coords=r.nodes, xs=coords.map(p=>p[0]), ys=coords.map(p=>p[1]);
  const dx=r.u.filter((_,i)=>i%2===0),dy=r.u.filter((_,i)=>i%2===1);
  const exaggeration=20;
  const allX=xs.concat(xs.map((x,i)=>x+exaggeration*dx[i]));
  const allY=ys.concat(ys.map((y,i)=>y+exaggeration*dy[i]));
  const minX=Math.min(...allX),maxX=Math.max(...allX),minY=Math.min(...allY),maxY=Math.max(...allY);
  const sx=(W-2*padX)/Math.max(maxX-minX,1),sy=(H-2*padY)/Math.max(maxY-minY,1);
  const scale=Math.min(sx,sy),centerX=(minX+maxX)/2,centerY=(minY+maxY)/2;
  const project=(x,y)=>[(W/2+(x-centerX)*scale),(H/2-(y-centerY)*scale)];
  const line=(a,b,def,stroke,width,dash)=> {
    const A=project(coords[a][0]+(def?exaggeration*dx[a]:0),coords[a][1]+(def?exaggeration*dy[a]:0));
    const B=project(coords[b][0]+(def?exaggeration*dx[b]:0),coords[b][1]+(def?exaggeration*dy[b]:0));
    return '<line x1="'+A[0].toFixed(2)+'" y1="'+A[1].toFixed(2)+'" x2="'+B[0].toFixed(2)+'" y2="'+B[1].toFixed(2)+'" stroke="'+stroke+'" stroke-width="'+width+'"'+(dash?' stroke-dasharray="6 5"':'')+'/>';
  };
  let markup='<svg viewBox="0 0 '+W+' '+H+'" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">';
  markup+='<text x="28" y="32" fill="#829fab" font-size="12" font-family="sans-serif" letter-spacing="2">STRUCTURAL MODEL / SIDE ELEVATION</text>';
  for(const [a,b] of r.members) markup+=line(a,b,false,"#9db5c4",2.7,false);
  for(const [a,b] of r.members) markup+=line(a,b,true,"#84ebbb",1.7,true);
  for(let i=0;i<coords.length;i++){
    const [x,y]=project(...coords[i]);
    markup+='<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="3.8" fill="#c5d8e2"/>';
  }
  const panels=(coords.length/2)-1;
  for(let i=1;i<panels;i++){
    const [x,y]=project(...coords[i]);
    markup+='<circle cx="'+x.toFixed(2)+'" cy="'+y.toFixed(2)+'" r="5" fill="#ffcf8a"/>';
  }
  for(const i of [0,panels]){
    const [x,y]=project(...coords[i]);
    markup+='<path d="M '+(x-11).toFixed(2)+' '+(y+16).toFixed(2)+' L '+x.toFixed(2)+' '+(y+2).toFixed(2)+' L '+(x+11).toFixed(2)+' '+(y+16).toFixed(2)+' Z" fill="none" stroke="#d3e5ee" stroke-width="2"/>';
  }
  return markup+'</svg>';
}
function clearResult(msg){
  $("status").textContent="NO PASSING DESIGN";
  $("status").style.color="#ffd59c";
  $("topology").textContent="—";
  $("bridge-plot").textContent=msg;
  $("mass").textContent=$("stress").textContent=$("deflection").textContent="—";
  $("candidate-rows").replaceChildren();
  $("message").textContent=msg;
}
function recalc(){
  $("span-val").textContent=Number($("span").value).toFixed(1)+" m";
  $("load-val").textContent=$("load").value+" kN";
  $("height-val").textContent=Number($("height").value).toFixed(2)+" m";
  $("panels-val").textContent=$("panels").value;
  try {
    const span=Number($("span").value), load=Number($("load").value)*1000;
    const panels=Number($("panels").value),height=Number($("height").value);
    const material=SpanForgeSolver.materials[$("material").value];
    const candidates=SpanForgeSolver.screen(span,load,panels,height,material);
    if(!candidates.length){
      clearResult("No candidate meets both simplified thresholds within the tested area range. Try another span, height or load.");
      return;
    }
    const r=candidates[0];
    $("status").textContent="MODEL SOLVED";
    $("status").style.color="#8ce9b9";
    $("topology").textContent=r.topology.toUpperCase()+" TRUSS";
    $("mass").textContent=fmt(r.mass,1);
    $("stress").textContent=fmt(r.maxStress/1e6,2);
    $("deflection").textContent=fmt(r.maxDisplacement*1000,2);
    $("bridge-plot").innerHTML=svgDrawing(r);
    $("candidate-rows").innerHTML=candidates.map(c=>
      "<tr><td>"+c.topology+"</td><td>"+fmt(c.area*10000,1)+" cm²</td><td>"+fmt(c.mass,1)+" kg</td><td>"+fmt(c.stressRatio*100,1)+"%</td><td>"+fmt(c.movementRatio*100,1)+"%</td></tr>"
    ).join("");
    $("message").textContent="These are idealized axial-stress and displacement screens, not comprehensive safety checks or construction approval.";
  }catch(err){clearResult("Calculation error: "+err.message);}
}
for(const id of ids) $(id).addEventListener("input",recalc);
$("reset").addEventListener("click",()=>{for(const [id,value] of Object.entries(defaults)) $(id).value=value;recalc();});
recalc();
