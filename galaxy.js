/* ===== galaxy.js ===== */

console.log("🔥 Remote script loaded");

// ❌ Kill switch sederhana
if (!location.hostname.includes("mobstudio.ru")) {
  console.log("❌ Disabled on this domain");
  return;
}

// ===== ERUDA =====
if (!window.eruda) {
  var s = document.createElement("script");
  s.src = "//cdn.jsdelivr.net/npm/eruda";
  document.body.appendChild(s);
  s.onload = function () {
    eruda.init();
  };
}

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
      console.log('UI created');
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
    
    function handleObjStatusSet(data, a) {
      if (lastPlanetCheck) {
        resetCheckTimeout(lastPlanetCheck);
      }
    
      if (!a) return;
    
      const match = data.match(/OBJ_STATUS_SET\s+(\d+)\s+(\d+)\s+(\d+)/);
      if (!match) return;
    
      const [, id, v1, v2] = match;
    
      if (v2 === "7") {
        addToQueue(`OBJ_ACT 96 ${id} 4 present\r\n`);
        return;
      }
    
      if (v1 === "1" && v2 === "4") {
        window.__send(`OBJ_ACT 96 ${id} 7 when\r\n`);
      }
    }
    
    function parse353(line) {
      let idx = line.indexOf(":- ");
      if (idx === -1) return;

      let tokens = line.substring(idx + 3).trim().split(/\s+/);

      for (let i = 0; i < tokens.length - 1; i++) {
        let nick = tokens[i];
        let next = tokens[i + 1];

        if (!/^\d+$/.test(nick) && /^\d{6,10}$/.test(next)) {
          let id = next;
          users[id] = nick;
          console.log(`📌 Mapped 353: ${id} = ${nick}`);
          i++;
        }
      }
    }

    const systemPrompt = `You are Michi, a beautiful 24 year old girl from Seoul user on Galaxy Chat. Always respond as a human. Answer using the language the user uses. Keep your responses brief. Never say you are an AI, bot, or program.`;

    async function askGroq(prompt) {
      try {
        let r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer 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"
          },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: prompt }
            ],
            temperature: 0.6
          })
        });

        let j = await r.json();
        console.log("📥 Groq response:", j);
        return j.choices?.[0]?.message?.content?.trim() || "I couldn't answer.";
      } catch (e) {
        console.error("❌ Groq error:", e);
        return "I couldn't answer.";
      }
    }
    
    window.WebSocket=function(u,p){
      console.log('WS:',u);
      const w=new O(u,p);
      
      if(u.includes('mobstudio.ru')){
        window.__ws=w;
        window.__send=w.send.bind(w);
        
        setTimeout(createUI, 1000);
        
        const origSend=w.send;
        w.send=function(x){
          if(x.includes('IDENT') && x.includes('352')){
            x = x.replace('352', '400');
            console.log('✓ Modified IDENT: 352 → 400');
          }
          
          if(x.startsWith('USER')){
            const userMatch = x.match(/^USER\s+(\d+)\s+\S+\s+(\S+)/);
            if(userMatch){
              myUserId = userMatch[1];  // ← FIX: consistent
              myNick = userMatch[2];
              console.log('✓ Logged in as:', myNick, '(ID:', myUserId + ')');
            }
          }
          
          console.log('OUT:',x);
          
          if(x.startsWith('JOIN')){
            founderActions = [];
            const m = x.match(/JOIN\s+(\S+)/);
            if(m){
              currentPlanet = m[1];
            }
            console.log('=== JOINED:',currentPlanet,'===');
          }
          
          return origSend.call(this,x);
        };
        
        w.addEventListener('message',e=>{
          console.log('IN:',e.data);
          const data=e.data;
          
          const m900 = data.match(/^900\s+(\S+)/);
          if(m900){
            const pname = m900[1];
            currentPlanet = pname;
            lastPlanetCheck = pname;
            addOrUpdatePlanet(pname, null);
          }
          
          if(data.includes('Gift will appear in')){
            const mTime = data.match(/Gift will appear in (\d+) min/);
            if(mTime){
              const minutes = parseInt(mTime[1]);
              
              if(lastPlanetCheck && planetTimers[lastPlanetCheck]){
                console.log('Gift detected:', lastPlanetCheck, minutes + 'min');
                addOrUpdatePlanet(lastPlanetCheck, minutes);
              } else if(currentPlanet && planetTimers[currentPlanet]){
                console.log('Gift detected:', currentPlanet, minutes + 'min');
                addOrUpdatePlanet(currentPlanet, minutes);
              }
            }
          }
          
          if (data.startsWith("353 ")) {
            parse353(data);
          }
          
          if (data.includes("OBJ_STATUS_SET")) {
            handleObjStatusSet(data, a);
          }
          
          if(data.includes('854 ')&&data.includes('[A]')){
            const lines=data.split('\n');
            let cnt=0;
            lines.forEach(line=>{
              if(line.startsWith('854 ')&&line.includes('[A]')){
                const m=line.match(/^854\s+(\d+)/);
                if(m&&!founderActions.includes(m[1])){
                  founderActions.push(m[1]);
                  cnt++;
                }
              }
            });
            if(cnt>0)console.log('Actions:',cnt,'| Total:',founderActions.length);
          }
          
          if(data.includes('FOUNDER')&&f){
            const m=data.match(/FOUNDER\s+(\d+)/);
            if(m&&founderActions.length>0){
              const act=founderActions[Math.floor(Math.random()*founderActions.length)];
              setTimeout(()=>window.__send(`ACTION ${act} ${m[1]}\r\n`), 10000);
            }
          }
          
          if (data.startsWith("JOIN ")) {
            let p = data.split(" ");
            if (p.length > 3 && /^\d+$/.test(p[3])) {
              let nick = p[2];
              let id   = p[3];
              users[id] = nick;
              console.log(`👤 JOIN → ${id} = ${nick}`);
            }
          }

 if (data.startsWith('PRIVMSG') && myNick && myUserId) {
  const msgMatch = data.match(/^PRIVMSG\s+(\d+)\s+\d+\s+(\d+)\s+:(.+)/);
  if (msgMatch) {
    const fromId = msgMatch[1];
    const toId = msgMatch[2];
    const message = msgMatch[3];

    if (message.includes(myNick) && toId === myUserId) {

      console.log('🔔 Mentioned by:', fromId);
      console.log('📨 Message:', message);

      // ==========================
      //  BUFFER PER USER (20 DETIK)
      // ==========================
      if (!userMessageBuffer[fromId]) {
        userMessageBuffer[fromId] = {
          timer: null,
          lastMessage: ""
        };
      }

      // Timpa pesan sebelumnya → hanya ambil yang terbaru
      userMessageBuffer[fromId].lastMessage = message;

      // Reset timer jika ada
      if (userMessageBuffer[fromId].timer) {
        clearTimeout(userMessageBuffer[fromId].timer);
      }

      // Set timer baru 20 detik
      userMessageBuffer[fromId].timer = setTimeout(() => {
        const finalMsg = userMessageBuffer[fromId].lastMessage;

        console.log(`⏳ 20s passed — processing last message from ${fromId}:`, finalMsg);

        // Panggil AI setelah 10 detik
        setTimeout(() => {
          askGroq(finalMsg).then(reply => {

            const typingTimes = Math.max(1, Math.ceil(reply.length / 10));
            let count = 0;

            const typingInterval = setInterval(() => {
              if (count >= typingTimes) {
                clearInterval(typingInterval);

                const replyMsg = `PRIVMSG 0 ${fromId} :${users[fromId] || fromId}, ${reply}\r\n`;
                window.__send(replyMsg);
                console.log(`🤖 AI Reply sent to ${users[fromId] || fromId}: ${reply}`);
                return;
              }

              const typingMsg = `T ${fromId} 1\r\n`;
              window.__send(typingMsg);
              console.log(`⌨️ Sending typing... (${count + 1}/${typingTimes})`);
              count++;
            }, 3000);
          });

        }, 7000); // Delay sebelum kirim ke AI

      }, 20000); // <— BUFFER 20 DETIK
    }
  }
}
         
        });
        
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
        
        console.log('✅ Bot ready with AI reply!');
      }
      return w;
    };
    
    console.log('✅ Ready');

} catch (e) {
  console.error("❌ Galaxy error:", e);
}