javascript:(function(){

if(document.getElementById("controlSliderBox")) return;

let nightEnabled=true;
let notifyActive=false;

function formatTime(sec){
sec=Math.floor(sec);
let h=Math.floor(sec/3600);
let m=Math.floor((sec%3600)/60);
let s=sec%60;
if(h>0) return h+":"+(m+"").padStart(2,"0")+":"+(s+"").padStart(2,"0");
return m+":"+(s+"").padStart(2,"0");
}

function getVideoId(){
return new URLSearchParams(location.search).get("v");
}

function getStorage(){
return JSON.parse(localStorage.getItem("ytCommentBook")||"{}");
}

function saveStorage(d){
localStorage.setItem("ytCommentBook",JSON.stringify(d));
}

function showNotify(){
if(notifyActive) return;
notifyActive=true;
const dot=document.createElement("div");
dot.innerText="● Comment moment";
Object.assign(dot.style,{
position:"absolute",
bottom:"8px",
left:"10px",
color:"#0f0",
fontSize:"12px"
});
c.appendChild(dot);
setTimeout(()=>{dot.remove();notifyActive=false},5000);
}

function checkTime(){
const v=document.querySelector("video");
if(!v) return;
const id=getVideoId();
const data=getStorage();
if(!data[id]) return;
const t=Math.floor(v.currentTime);

data[id].forEach(cm=>{
if(Math.abs(cm.time-t)<=1){
showNotify();
}
});
}

setInterval(checkTime,1000);

function addComment(){

const v=document.querySelector("video");
if(!v) return alert("No video found");

const id=getVideoId();
const title=document.title.replace(" - YouTube","");
const time=Math.floor(v.currentTime);
const t=formatTime(time);

const text=prompt("Comment at "+t);
if(!text) return;

let data=getStorage();
if(!data[id]) data[id]=[];

data[id].push({
time:time,
text:text,
title:title
});

saveStorage(data);

alert("Saved comment at "+t);

}

function openSummary(){

const data=getStorage();

const box=document.createElement("div");

Object.assign(box.style,{
position:"fixed",
top:"120px",
right:"20px",
background:"#111",
color:"#fff",
padding:"12px",
zIndex:"999999",
maxHeight:"400px",
overflow:"auto",
borderRadius:"8px",
fontSize:"13px",
width:"260px"
});

const close=document.createElement("div");
close.innerText="✕";
close.style.cursor="pointer";
close.style.float="right";
close.onclick=()=>box.remove();
box.appendChild(close);

for(let vid in data){

const title=data[vid][0].title;

const link=document.createElement("div");
link.innerHTML="<b>"+title+"</b>";
link.style.cursor="pointer";
link.onclick=()=>{
window.open("https://www.youtube.com/watch?v="+vid,"_blank");
};
box.appendChild(link);

data[vid].forEach(cm=>{

const item=document.createElement("div");
item.style.marginLeft="10px";

const time=formatTime(cm.time);

item.innerHTML="• "+time+" – "+cm.text;

item.style.cursor="pointer";

item.onclick=()=>{
window.open("https://www.youtube.com/watch?v="+vid+"&t="+cm.time+"s","_blank");
};

box.appendChild(item);

});

box.appendChild(document.createElement("hr"));

}

document.body.appendChild(box);

}

function makeDraggable(el,handle,onClick){
let dragging=false;
let moved=false;
let ox=0,oy=0;
handle.addEventListener("mousedown",e=>{
if(e.button!==0) return;
dragging=true;
moved=false;
ox=e.clientX-el.offsetLeft;
oy=e.clientY-el.offsetTop;
document.body.style.userSelect="none";
});
document.addEventListener("mousemove",e=>{
if(!dragging) return;
moved=true;
el.style.left=(e.clientX-ox)+"px";
el.style.top=(e.clientY-oy)+"px";
});
document.addEventListener("mouseup",()=>{
if(dragging && !moved && onClick) onClick();
dragging=false;
document.body.style.userSelect="";
});
}

const c=document.createElement("div");
c.id="controlSliderBox";

Object.assign(c.style,{
position:"fixed",
top:"120px",
left:"20px",
zIndex:"9999",
background:"rgba(0,0,0,0.85)",
color:"white",
padding:"12px",
borderRadius:"8px",
fontFamily:"sans-serif",
minWidth:"190px"
});

const top=document.createElement("div");

Object.assign(top.style,{
display:"flex",
justifyContent:"space-between",
alignItems:"center",
cursor:"move"
});

const title=document.createElement("div");
title.innerText="Controls";
title.style.fontSize="13px";

const btnBox=document.createElement("div");

const summary=document.createElement("span");
summary.innerText="☰";
summary.style.cursor="pointer";
summary.style.marginRight="10px";
summary.onclick=openSummary;

const minimize=document.createElement("span");
minimize.innerText="–";
minimize.style.cursor="pointer";
minimize.style.marginRight="10px";

const close=document.createElement("span");
close.innerText="✕";
close.style.cursor="pointer";

btnBox.append(summary,minimize,close);
top.append(title,btnBox);

const select=document.createElement("select");

["Speed","Volume","Night Filter","Add Comment"].forEach(m=>{
const o=document.createElement("option");
o.value=m;
o.innerText=m;
select.appendChild(o);
});

Object.assign(select.style,{
marginTop:"6px",
marginBottom:"6px",
width:"100%",
background:"black",
color:"white",
border:"1px solid #555",
borderRadius:"4px",
padding:"3px"
});

const l=document.createElement("div");
l.innerText="Speed: 1x";

const s=document.createElement("input");

Object.assign(s,{
type:"range",
min:0.01,
max:13,
step:0.01,
value:1
});

s.style.width="180px";
s.style.accentColor="red";

function applyNight(val){
if(!nightEnabled){
document.body.style.filter="";
return;
}
const warmth=val*4;
document.body.style.filter="sepia("+(val/13)+") hue-rotate(-"+warmth+"deg) brightness(0.95)";
}

function update(){

const v=document.querySelector("video");
const mode=select.value;
const val=Number(s.value);

if(mode==="Speed"){
if(v) v.playbackRate=val;
l.innerText="Speed: "+val+"x";
}

if(mode==="Volume"){
if(v) v.volume=Math.min(1,val/13);
l.innerText="Volume: "+Math.round((val/13)*100)+"%";
}

if(mode==="Night Filter"){
applyNight(val);
l.innerText="Night Filter";
}

}

select.onchange=()=>{

if(select.value==="Add Comment"){
addComment();
select.value="Speed";
return;
}

update();
};

s.oninput=update;

close.onclick=()=>{
c.remove();
document.getElementById("speedMiniBtn")?.remove();
};

minimize.onclick=()=>{
c.style.display="none";
const mini=document.createElement("div");
mini.id="speedMiniBtn";
mini.innerText="S";
Object.assign(mini.style,{
position:"fixed",
top:c.style.top,
left:c.style.left,
width:"32px",
height:"32px",
background:"red",
color:"white",
display:"flex",
alignItems:"center",
justifyContent:"center",
fontWeight:"bold",
borderRadius:"6px",
cursor:"move",
zIndex:"9999"
});
makeDraggable(mini,mini,()=>{
c.style.left=mini.offsetLeft+"px";
c.style.top=mini.offsetTop+"px";
c.style.display="block";
mini.remove();
});
document.body.appendChild(mini);
};

c.append(top,select,l,s);

document.body.appendChild(c);

makeDraggable(c,top);

})();
