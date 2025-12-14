/* ===== galaxy.js - Production Version ===== */

console.log("🔥 Remote script loaded");

// ❌ Kill switch
if (!location.hostname.includes("mobstudio.ru")) {
  console.log("❌ Disabled on this domain");
  return;
}

// ===== ERUDA (OPTIONAL - COMMENT OUT UNTUK PRODUCTION) =====
/*
if (!window.eruda) {
  var s = document.createElement("script");
  s.src = "//cdn.jsdelivr.net/npm/eruda";
  document.body.appendChild(s);
  s.onload = function () {
    eruda.init();
  };
}
*/

// ===== MAIN SCRIPT =====
try {

const O=WebSocket;
    let a=true, d=3000, f=true;
    let founderActions = [];
    let planetTimers = {};
    let currentPlanet = null;
    let lastPlanetCheck = null;
    let users = {};
    let myUserId = null;
    let myNick = null;
    let objQueue = [];
    let isProcessingQueue = false;
    const userMessageBuffer = {};
    
    function processObjQueue(){
      if(isProcessingQueue || objQueue.length === 0) return;
      
      isProcessingQueue = true;
      const cmd = objQueue.shift();
      
      console.log('Queue processing:', cmd);
      window.__send(cmd);
      
      setTimeout(() => {
        isProcessingQueue = false;
        processObjQueue();
      }, d);
    }
    
    function addToQueue(cmd){
      objQueue.push(cmd);
      console.log('Added to queue. Total:', objQueue.length);
      processObjQueue();
    }
    
    // ===== UI PLANET (TIDAK BUTUH ERUDA) =====
    function createUI(){
      if(document.getElementById('planetUI')) return;
      const container = document.createElement('div');
      container.id = 'planetUI';
      container.style.cssText = `
        position: fixed;
        top: 60px;
        right: 10px;
        z-index: 99999;
        font-family: monospace;
        max-width: 250px;
        max-height: 240px;
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 5px;
      `;
      
      const style = document.createElement('style');
      style.textContent = `
        #planetUI::-webkit-scrollbar {
          width: 6px;
        }
        #planetUI::-webkit-scrollbar-track {
          background: #0d1117;
          border-radius: 3px;
        }
        #planetUI::-webkit-scrollbar-thumb {
          background: #aaa;
          border-radius: 3px;
        }
        #planetUI::-webkit-scrollbar-thumb:hover {
          background: #484f58;
        }
      `;
      document.head.appendChild(style);
      
      document.body.appendChild(container);
      console.log('✅ UI Planet created');
    }
    
    function updateUI(){
      const container = document.getElementById('planetUI');
      if(!container) return;
      
      container.innerHTML = '';
      
      const sorted = Object.keys(planetTimers).sort((a, b) => {
        if(planetTimers[a].ready && !planetTimers[b].ready) return -1;
        if(!planetTimers[a].ready && planetTimers[b].ready) return 1;
        return 0;
      });
      
      sorted.forEach(planetName => {
        const planet = planetTimers[planetName];
        
        const btn = document.createElement('div');
        btn.style.cssText = `
          background: ${planet.ready ? '#0d3d0d' : '#1a1a2e'};
          color: #fff;
          padding: 10px 15px;
          margin: 5px 0;
          border-radius: 8px;
          cursor: pointer;
          border: 2px solid ${planet.ready ? '#0f3' : '#16213e'};
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          transition: all 0.3s;
          min-height: 30px;
        `;
        
        btn.innerHTML = `
          <div style="font-weight:bold;font-size:14px;word-wrap:break-word;">${planetName}</div>
          ${planet.timer ? `<div style="font-size:11px;color:${planet.ready?'#0f3':'#aaa'};">${planet.timer}</div>` : ''}
        `;
        
        btn.onmouseover = () => btn.style.transform = 'scale(1.05)';
        btn.onmouseout = () => btn.style.transform = 'scale(1)';
        
        btn.onclick = () => {
          if(window.__send){
            console.clear();
            clearQueue();
            window.__send(`JOIN ${planetName}\r\n`);
            console.log('JOINING:', planetName);
            removePlanet(planetName);
            console.log('Commands: showQueue() clearQueue() showPlanets() clearPlanets() showActions() toggleAuto() toggleFounder() setDelay()');
          }
        };
        
        container.appendChild(btn);
      });
    }
    
    function addOrUpdatePlanet(name, minutes){
      console.log('Planet:', name, minutes !== null ? `${minutes}min` : 'checking...');
      
      if(!planetTimers[name]){
        planetTimers[name] = {};
      }
      
      if(planetTimers[name].checkTimeout){
        clearTimeout(planetTimers[name].checkTimeout);
        delete planetTimers[name].checkTimeout;
      }
      
      if(minutes !== null && minutes >= 0){
        if(planetTimers[name].interval){
          clearInterval(planetTimers[name].interval);
        }
        
        const endTime = Date.now() + (minutes * 60 * 1000);
        planetTimers[name].endTime = endTime;
        planetTimers[name].timer = minutes > 0 ? `${minutes}min` : 'Ready!';
        planetTimers[name].ready = minutes === 0;
        delete planetTimers[name].waitingForGift;
        
        if(minutes > 0){
          planetTimers[name].interval = setInterval(() => {
            const remaining = Math.floor((endTime - Date.now()) / 60000);
            
            if(remaining <= 0){
              planetTimers[name].timer = 'Ready!';
              planetTimers[name].ready = true;
              clearInterval(planetTimers[name].interval);
              updateUI();
            } else {
              planetTimers[name].timer = `${remaining}min`;
              updateUI();
            }
          }, 10000);
        }
        
        updateUI();
      } else {
        planetTimers[name].timer = 'Checking...';
        planetTimers[name].waitingForGift = true;
        updateUI();
        
        planetTimers[name].checkTimeout = setTimeout(() => {
          console.log('No gift for:', name);
          removePlanet(name);
        }, 10000);
      }
    }
    
    function resetCheckTimeout(name){
      if(planetTimers[name] && planetTimers[name].waitingForGift){
        if(planetTimers[name].checkTimeout){
          clearTimeout(planetTimers[name].checkTimeout);
          
          planetTimers[name].checkTimeout = setTimeout(() => {
            console.log('No gift for:', name);
            removePlanet(name);
          }, 5000);
          
          console.log('Extended timeout for:', name);
        }
      }
    }
    
    function removePlanet(name){
      console.log('Removing:', name);
      if(planetTimers[name]?.interval){
        clearInterval(planetTimers[name].interval);
      }
      if(planetTimers[name]?.checkTimeout){
        clearTimeout(planetTimers[name].checkTimeout);
      }
      delete planetTimers[name];
      updateUI();
    }
    
    // ... (SISANYA SAMA SEPERTI SCRIPT ASLI ANDA)
    
    // WebSocket override
    window.WebSocket=function(u,p){
      console.log('WS:',u);
      const w=new O(u,p);
      
      if(u.includes('mobstudio.ru')){
        window.__ws=w;
        window.__send=w.send.bind(w);
        
        setTimeout(createUI, 1000); // ← CREATE UI (TANPA ERUDA)
        
        // ... rest of WebSocket handling
      }
      return w;
    };
    
    // Helper commands
    window.send=msg=>window.__send(msg.endsWith('\r\n')?msg:msg+'\r\n');
    window.toggleAuto=()=>{a=!a;console.log('OBJ:',a?'ON':'OFF');return a};
    window.toggleFounder=()=>{f=!f;console.log('Founder:',f?'ON':'OFF');return f};
    window.setDelay=s=>{d=s*1000;console.log('Delay:',s+'s');return d};
    window.showPlanets=()=>{console.log(planetTimers);return planetTimers};
    window.showActions=()=>{console.log('Actions:',founderActions);return founderActions};
    window.clearPlanets=()=>{Object.keys(planetTimers).forEach(removePlanet);console.log('Cleared')};
    window.showQueue=()=>{console.log('Queue:',objQueue.length,'items');return objQueue};
    window.clearQueue=()=>{objQueue=[];console.log('Queue cleared')};
    window.showUsers=()=>{console.log('Users:', users);return users};
    
    console.log('✅ Bot ready (UI active, Eruda disabled)');

} catch (e) {
  console.error("❌ Galaxy error:", e);
}
