javascript:(function(){
if(document.getElementById("controlSliderBox")) return;

let nightEnabled=true;
let commentsDB=JSON.parse(localStorage.getItem("ytSliderComments")||"{}");

// Helper to wait for video element
function waitForVideo(callback){
    let v=document.querySelector('video');
    if(v) callback(v);
    else setTimeout(()=>waitForVideo(callback),500);
}

// Make an element draggable
function makeDraggable(el,handle,onClick){
    let dragging=false,moved=false,ox=0,oy=0;
    handle.addEventListener("mousedown",e=>{
        if(e.button!==0) return;
        dragging=true;moved=false;
        ox=e.clientX-el.offsetLeft; oy=e.clientY-el.offsetTop;
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

// Slider container
const c=document.createElement("div");
c.id="controlSliderBox";
Object.assign(c.style,{
    position:"fixed",top:"120px",left:"20px",zIndex:"9999",
    background:"rgba(0,0,0,0.85)",color:"white",padding:"12px",
    borderRadius:"8px",fontFamily:"sans-serif",minWidth:"190px"
});

// Top bar with title, minimize & close
const top=document.createElement("div");
Object.assign(top.style,{display:"flex",justifyContent:"space-between",alignItems:"center",cursor:"move"});
const title=document.createElement("div"); title.innerText="Controls"; title.style.fontSize="13px";
const btnBox=document.createElement("div");
const minimize=document.createElement("span"); minimize.innerText="–"; minimize.style.cursor="pointer"; minimize.style.marginRight="10px";
const close=document.createElement("span"); close.innerText="✕"; close.style.cursor="pointer";
btnBox.append(minimize,close); top.append(title,btnBox);

// Dropdown for mode
const select=document.createElement("select");
["Speed","Volume","Night Filter","Add Comment"].forEach(m=>{
    const o=document.createElement("option"); o.value=m; o.innerText=m; select.appendChild(o);
});
Object.assign(select.style,{marginTop:"6px",marginBottom:"6px",width:"100%",background:"black",color:"white",border:"1px solid #555",borderRadius:"4px",padding:"3px"});

// Toggle for Night filter
const toggle=document.createElement("button"); toggle.innerText="ON";
Object.assign(toggle.style,{display:"none",marginBottom:"6px",background:"#222",color:"white",border:"1px solid #555",borderRadius:"4px",cursor:"pointer"});

// Label & slider input
const l=document.createElement("div"); l.innerText="Speed: 1x";
const s=document.createElement("input");
Object.assign(s,{type:"range",min:0.01,max:13,step:0.01,value:1}); s.style.width="180px"; s.style.accentColor="red";

// Apply night filter
function applyNight(val){
    if(!nightEnabled){document.body.style.filter=""; return;}
    const warmth=val*4;
    document.body.style.filter="sepia("+(val/13)+") hue-rotate(-"+warmth+"deg) brightness(0.95)";
}

// Update function based on mode
function update(){
    waitForVideo(v=>{
        const mode=select.value; const val=Number(s.value);
        if(mode==="Speed"){v.playbackRate=val; l.innerText="Speed: "+val+"x";}
        if(mode==="Volume"){v.volume=Math.min(1,val/13); l.innerText="Volume: "+Math.round((val/13)*100)+"%";}
        if(mode==="Night Filter"){applyNight(val); l.innerText="Night Filter";}
    });
}

// Handle toggle button
toggle.onclick=()=>{nightEnabled=!nightEnabled; toggle.innerText=nightEnabled?"ON":"OFF"; applyNight(Number(s.value));};

// Handle slider changes
s.oninput=update;

// Handle dropdown changes
select.onchange=()=>{
    toggle.style.display="none";
    if(select.value==="Speed"){s.min=0.01;s.max=13;s.step=0.01;s.value=1;l.innerText="Speed: 1x";}
    if(select.value==="Volume"){s.min=0;s.max=13;s.value=7;l.innerText="Volume";}
    if(select.value==="Night Filter"){s.min=1;s.max=13;s.value=6;toggle.style.display="block";l.innerText="Night Filter";}
    if(select.value==="Add Comment"){s.min=0;s.max=1;s.value=0;l.innerText="Click slider to add comment";}
    update();
};

// Handle close & minimize
close.onclick=()=>{c.remove();document.getElementById("speedMiniBtn")?.remove();};
minimize.onclick=()=>{
    c.style.display="none";
    const mini=document.createElement("div");
    mini.id="speedMiniBtn"; mini.innerText="S";
    Object.assign(mini.style,{position:"fixed",top:c.style.top,left:c.style.left,width:"32px",height:"32px",
        background:"red",color:"white",display:"flex",alignItems:"center",justifyContent:"center",
        fontWeight:"bold",borderRadius:"6px",cursor:"move",zIndex:"9999"});
    makeDraggable(mini,mini,()=>{c.style.left=mini.offsetLeft+"px"; c.style.top=mini.offsetTop+"px"; c.style.display="block"; mini.remove();});
    document.body.appendChild(mini);
};

// Add comment logic
s.onclick=function(){
    if(select.value!=="Add Comment") return;
    waitForVideo(v=>{
        let time=v.currentTime.toFixed(2);
        let videoId=location.href.split("v=")[1]?.split("&")[0]||location.href;
        let comment=prompt(`Add your comment at ${time}s:`);
        if(!comment) return;
        commentsDB[videoId]=commentsDB[videoId]||{};
        commentsDB[videoId][time]=commentsDB[videoId][time]||[];
        commentsDB[videoId][time].push(comment);
        localStorage.setItem("ytSliderComments",JSON.stringify(commentsDB));
        // Show green dot for 5s
        const dot=document.createElement("div");
        Object.assign(dot.style,{position:"fixed",width:"12px",height:"12px",background:"green",borderRadius:"50%",
            top:"60px",right:"20px",zIndex:"9999"});
        document.body.appendChild(dot);
        setTimeout(()=>dot.remove(),5000);
    });
};

// Summary button
const summaryBtn=document.createElement("span");
summaryBtn.innerText="📄"; summaryBtn.title="Comments Summary";
Object.assign(summaryBtn.style,{cursor:"pointer",marginLeft:"5px"});
summaryBtn.onclick=function(){
    let w=window.open("","Comments Summary","width=400,height=600");
    let html="<h2>Comments Summary</h2>";
    for(let vid in commentsDB){
        html+="<h3><a href='https://www.youtube.com/watch?v="+vid+"' target='_blank'>"+vid+"</a></h3><ul>";
        for(let t in commentsDB[vid]){
            html+="<li>"+t+"s: "+commentsDB[vid][t].join("; ")+"</li>";
        }
        html+="</ul>";
    }
    w.document.body.innerHTML=html;
};
btnBox.appendChild(summaryBtn);

c.append(top,select,toggle,l,s);
document.body.appendChild(c);
makeDraggable(c,top);
})();
