/* ===== galaxy.js ===== */

console.log("🔥 Remote script loaded");

// ❌ Kill switch sederhana
if (!location.hostname.includes("mobstudio.ru")) {
    console.log("❌ Disabled on this domain");
    return;
}

try {

    const O = WebSocket;
    let a = true,
        d = 3000,
        f = true;
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

    function processObjQueue() {
        if (isProcessingQueue || objQueue.length === 0) return;

        isProcessingQueue = true;
        const cmd = objQueue.shift();

        console.log('Queue processing:', cmd);
        window.__send(cmd);

        setTimeout(() => {
            isProcessingQueue = false;
            processObjQueue();
        }, d);
    }

    function addToQueue(cmd) {
        objQueue.push(cmd);
        console.log('Added to queue. Total:', objQueue.length);
        processObjQueue();
    }

    function createUI() {
        if (document.getElementById('planetUI')) return;
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

    function createDebugOverlay() {
        // Skip jika sudah ada
        if (document.getElementById('debugOverlay')) return;

        // ===== CONTAINER =====
        const container = document.createElement('div');
        container.id = 'debugOverlay';
        container.style.cssText = `
    position: fixed;
    bottom: 10px;
    left: 10px;
    width: 320px;
    background: rgba(0, 0, 0, 0.95);
    border: 2px solid #00ff00;
    border-radius: 8px;
    z-index: 99998;
    font-family: 'Courier New', monospace;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    transition: all 0.3s ease;
  `;

        // ===== HEADER (untuk drag & toggle) =====
        const header = document.createElement('div');
        header.style.cssText = `
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
    color: #00ff00;
    padding: 8px 12px;
    cursor: move;
    border-radius: 6px 6px 0 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    user-select: none;
    border-bottom: 1px solid #00ff00;
  `;

        header.innerHTML = `
    <span style="font-weight: bold; font-size: 12px;">🐛 Debug Console</span>
    <div>
      <button id="debugClear" style="
        background: #333;
        color: #0f0;
        border: 1px solid #0f0;
        padding: 2px 8px;
        margin-right: 5px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
      ">Clear</button>
      <button id="debugToggle" style="
        background: #333;
        color: #0f0;
        border: 1px solid #0f0;
        padding: 2px 8px;
        margin-right: 5px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
      ">−</button>
      <button id="debugClose" style="
        background: #d33;
        color: #fff;
        border: 1px solid #d33;
        padding: 2px 8px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 10px;
      ">✕</button>
    </div>
  `;

        // ===== CONTENT (log area) =====
        const content = document.createElement('div');
        content.id = 'debugContent';
        content.style.cssText = `
    max-height: 200px;
    overflow-y: auto;
    padding: 10px;
    font-size: 10px;
    color: #00ff00;
    background: #000;
    border-radius: 0 0 6px 6px;
  `;

        // Custom scrollbar
        const style = document.createElement('style');
        style.textContent = `
    #debugContent::-webkit-scrollbar {
      width: 6px;
    }
    #debugContent::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
    #debugContent::-webkit-scrollbar-thumb {
      background: #00ff00;
      border-radius: 3px;
    }
    #debugContent::-webkit-scrollbar-thumb:hover {
      background: #00cc00;
    }
  `;
        document.head.appendChild(style);

        // ===== ASSEMBLE =====
        container.appendChild(header);
        container.appendChild(content);
        document.body.appendChild(container);

        // ===== DRAGGABLE =====
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        header.addEventListener('mousedown', dragStart);
        header.addEventListener('touchstart', dragStart);

        function dragStart(e) {
            if (e.target.tagName === 'BUTTON') return; // Don't drag when clicking buttons

            isDragging = true;

            if (e.type === 'touchstart') {
                initialX = e.touches[0].clientX - container.offsetLeft;
                initialY = e.touches[0].clientY - container.offsetTop;
            } else {
                initialX = e.clientX - container.offsetLeft;
                initialY = e.clientY - container.offsetTop;
            }

            document.addEventListener('mousemove', drag);
            document.addEventListener('touchmove', drag);
            document.addEventListener('mouseup', dragEnd);
            document.addEventListener('touchend', dragEnd);
        }

        function drag(e) {
            if (!isDragging) return;
            e.preventDefault();

            if (e.type === 'touchmove') {
                currentX = e.touches[0].clientX - initialX;
                currentY = e.touches[0].clientY - initialY;
            } else {
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;
            }

            container.style.left = currentX + 'px';
            container.style.top = currentY + 'px';
            container.style.bottom = 'auto';
        }

        function dragEnd() {
            isDragging = false;
            document.removeEventListener('mousemove', drag);
            document.removeEventListener('touchmove', drag);
            document.removeEventListener('mouseup', dragEnd);
            document.removeEventListener('touchend', dragEnd);
        }

        // ===== TOGGLE (minimize/maximize) =====
        let isMinimized = false;
        document.getElementById('debugToggle').addEventListener('click', () => {
            isMinimized = !isMinimized;
            content.style.display = isMinimized ? 'none' : 'block';
            document.getElementById('debugToggle').textContent = isMinimized ? '+' : '−';
        });

        // ===== CLEAR =====
        document.getElementById('debugClear').addEventListener('click', () => {
            content.innerHTML = '<span style="color:#666;">Console cleared</span><br>';
        });

        // ===== CLOSE (hide, not remove) =====
        document.getElementById('debugClose').addEventListener('click', () => {
            container.style.display = 'none';
        });

        // ===== INTERCEPT console.log =====
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;

        function addLog(msg, color = '#00ff00') {
            const timestamp = new Date().toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            });
            const line = document.createElement('div');
            line.style.cssText = `
      margin-bottom: 3px;
      padding: 2px 0;
      border-bottom: 1px solid #222;
      color: ${color};
      word-wrap: break-word;
    `;
            line.innerHTML = `<span style="color:#666;">[${timestamp}]</span> ${msg}`;
            content.appendChild(line);
            content.scrollTop = content.scrollHeight;

            // Keep last 100 lines
            if (content.children.length > 100) {
                content.removeChild(content.firstChild);
            }
        }

        console.log = function(...args) {
            originalLog.apply(console, args);
            const msg = args.map(a => {
                if (typeof a === 'object') {
                    try {
                        return JSON.stringify(a, null, 2);
                    } catch (e) {
                        return String(a);
                    }
                }
                return String(a);
            }).join(' ');
            addLog(msg, '#00ff00');
        };

        console.error = function(...args) {
            originalError.apply(console, args);
            const msg = args.map(a => String(a)).join(' ');
            addLog('❌ ' + msg, '#ff4444');
        };

        console.warn = function(...args) {
            originalWarn.apply(console, args);
            const msg = args.map(a => String(a)).join(' ');
            addLog('⚠️ ' + msg, '#ffaa00');
        };

        // ===== SHOW/HIDE VIA COMMAND =====
        window.showDebug = () => {
            container.style.display = 'block';
            console.log('✅ Debug overlay shown');
        };

        window.hideDebug = () => {
            container.style.display = 'none';
            console.log('✅ Debug overlay hidden');
        };

        window.toggleDebug = () => {
            if (container.style.display === 'none') {
                window.showDebug();
            } else {
                window.hideDebug();
            }
        };

        console.log('✅ Debug overlay created');
        console.log('Commands: showDebug(), hideDebug(), toggleDebug()');
    }

    function updateUI() {
        const container = document.getElementById('planetUI');
        if (!container) return;

        container.innerHTML = '';

        const sorted = Object.keys(planetTimers).sort((a, b) => {
            if (planetTimers[a].ready && !planetTimers[b].ready) return -1;
            if (!planetTimers[a].ready && planetTimers[b].ready) return 1;
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
                if (window.__send) {
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

    function addOrUpdatePlanet(name, minutes) {
        console.log('Planet:', name, minutes !== null ? `${minutes}min` : 'checking...');

        if (!planetTimers[name]) {
            planetTimers[name] = {};
        }

        if (planetTimers[name].checkTimeout) {
            clearTimeout(planetTimers[name].checkTimeout);
            delete planetTimers[name].checkTimeout;
        }

        if (minutes !== null && minutes >= 0) {
            if (planetTimers[name].interval) {
                clearInterval(planetTimers[name].interval);
            }

            const endTime = Date.now() + (minutes * 60 * 1000);
            planetTimers[name].endTime = endTime;
            planetTimers[name].timer = minutes > 0 ? `${minutes}min` : 'Ready!';
            planetTimers[name].ready = minutes === 0;
            delete planetTimers[name].waitingForGift;

            if (minutes > 0) {
                planetTimers[name].interval = setInterval(() => {
                    const remaining = Math.floor((endTime - Date.now()) / 60000);

                    if (remaining <= 0) {
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

    function resetCheckTimeout(name) {
        if (planetTimers[name] && planetTimers[name].waitingForGift) {
            if (planetTimers[name].checkTimeout) {
                clearTimeout(planetTimers[name].checkTimeout);

                planetTimers[name].checkTimeout = setTimeout(() => {
                    console.log('No gift for:', name);
                    removePlanet(name);
                }, 5000);

                console.log('Extended timeout for:', name);
            }
        }
    }

    function removePlanet(name) {
        console.log('Removing:', name);
        if (planetTimers[name]?.interval) {
            clearInterval(planetTimers[name].interval);
        }
        if (planetTimers[name]?.checkTimeout) {
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
            addToQueue(`OBJ_ACT 97 ${id} 5 present\r\n`);
            return;
        }

        if (v1 === "1" && v2 === "4") {
            window.__send(`OBJ_ACT 96 ${id} 7 when\r\n`);
            window.__send(`OBJ_ACT 97 ${id} 7 when\r\n`);
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

    const systemPrompt = `You are Michi, a beautiful 24 year old girl from Seoul user on Galaxy Chat. Always respond as a human. Answer using the language the user uses. Just answer briefly, don't overdo it. Don't answer like an assistant. Never say you are an AI, bot, or program.`;

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
                    messages: [{
                            role: "system",
                            content: systemPrompt
                        },
                        {
                            role: "user",
                            content: prompt
                        }
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

    window.WebSocket = function(u, p) {
        console.log('WS:', u);
        const w = new O(u, p);

        if (u.includes('mobstudio.ru')) {
            window.__ws = w;
            window.__send = w.send.bind(w);

            setTimeout(() => {
                createUI();
                createDebugOverlay();
            }, 1200);

            const origSend = w.send;
            w.send = function(x) {
                if (x.includes('IDENT') && x.includes('352')) {
                    x = x.replace('352', '400');
                    console.log('✓ Modified IDENT: 352 → 400');
                }

                if (x.startsWith('USER')) {
                    const userMatch = x.match(/^USER\s+(\d+)\s+\S+\s+(\S+)/);
                    if (userMatch) {
                        myUserId = userMatch[1]; // ← FIX: consistent
                        myNick = userMatch[2];
                        console.log('✓ Logged in as:', myNick, '(ID:', myUserId + ')');
                    }
                }

                console.log('OUT:', x);

                if (x.startsWith('JOIN')) {
                    founderActions = [];
                    const m = x.match(/JOIN\s+(\S+)/);
                    if (m) {
                        currentPlanet = m[1];
                    }
                    console.log('=== JOINED:', currentPlanet, '===');
                }

                return origSend.call(this, x);
            };

            w.addEventListener('message', e => {
                console.log('IN:', e.data);
                const data = e.data;

                const m900 = data.match(/^900\s+(\S+)/);
                if (m900) {
                    const pname = m900[1];
                    currentPlanet = pname;
                    lastPlanetCheck = pname;
                    addOrUpdatePlanet(pname, null);
                }

                if (data.includes('Gift will appear in')) {
                    const mTime = data.match(/Gift will appear in (\d+) min/);
                    if (mTime) {
                        const minutes = parseInt(mTime[1]);

                        if (lastPlanetCheck && planetTimers[lastPlanetCheck]) {
                            console.log('Gift detected:', lastPlanetCheck, minutes + 'min');
                            addOrUpdatePlanet(lastPlanetCheck, minutes);
                        } else if (currentPlanet && planetTimers[currentPlanet]) {
                            console.log('Gift detected:', currentPlanet, minutes + 'min');
                            addOrUpdatePlanet(currentPlanet, minutes);
                        }
                    }
                }

                if (data.startsWith("353 ")) {
                    //parse353(data);
                }

                if (data.includes("OBJ_STATUS_SET")) {
                    handleObjStatusSet(data, a);
                }

                if (data.includes('854 ') && data.includes('[A]')) {
                    const lines = data.split('\n');
                    let cnt = 0;
                    lines.forEach(line => {
                        if (line.startsWith('854 ') && line.includes('[A]')) {
                            const m = line.match(/^854\s+(\d+)/);
                            if (m && !founderActions.includes(m[1])) {
                                founderActions.push(m[1]);
                                cnt++;
                            }
                        }
                    });
                    if (cnt > 0) console.log('Actions:', cnt, '| Total:', founderActions.length);
                }

                if (data.includes('FOUNDER') && f) {
                    const m = data.match(/FOUNDER\s+(\d+)/);
                    if (m && founderActions.length > 0) {
                        const act = founderActions[Math.floor(Math.random() * founderActions.length)];
                        //setTimeout(() => window.__send(`ACTION ${act} ${m[1]}\r\n`), 10000);
                    }
                }

                if (data.startsWith("JOIN ")) {
                    let p = data.split(" ");
                    if (p.length > 3 && /^\d+$/.test(p[3])) {
                        let nick = p[2];
                        let id = p[3];
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

                                                //const replyMsg = `PRIVMSG 0 ${fromId} :${users[fromId] || fromId}, ${reply}\r\n`;
                                                //window.__send(replyMsg);
                                                //console.log(`🤖 AI Reply sent to ${users[fromId] || fromId}: ${reply}`);
                                                //return;
                                                console.log(`💢 ${reply}`);
                                                return;
                                            }

                                            //const typingMsg = `T ${fromId} 1\r\n`;
                                            //window.__send(typingMsg);
                                            //console.log(`⌨️ Sending typing... (${count + 1}/${typingTimes})`);
                                            count++;
                                        }, 500);
                                    });

                                }, 500); // Delay sebelum kirim ke AI

                            }, 500); // <— BUFFER 20 DETIK
                        }
                    }
                }

            });

            window.send = msg => window.__send(msg.endsWith('\r\n') ? msg : msg + '\r\n');
            window.toggleAuto = () => {
                a = !a;
                console.log('OBJ:', a ? 'ON' : 'OFF');
                return a
            };
            window.toggleFounder = () => {
                f = !f;
                console.log('Founder:', f ? 'ON' : 'OFF');
                return f
            };
            window.setDelay = s => {
                d = s * 1000;
                console.log('Delay:', s + 's');
                return d
            };
            window.showPlanets = () => {
                console.log(planetTimers);
                return planetTimers
            };
            window.showActions = () => {
                console.log('Actions:', founderActions);
                return founderActions
            };
            window.clearPlanets = () => {
                Object.keys(planetTimers).forEach(removePlanet);
                console.log('Cleared')
            };
            window.showQueue = () => {
                console.log('Queue:', objQueue.length, 'items');
                return objQueue
            };
            window.clearQueue = () => {
                objQueue = [];
                console.log('Queue cleared')
            };
            window.showUsers = () => {
                console.log('Users:', users);
                return users
            };

            console.log('✅ Bot ready with AI reply!');
        }
        return w;
    };

    console.log('✅ Ready');

} catch (e) {
    console.error("❌ Galaxy error:", e);
}
