(function(){
  try {
    console.log("🔥 Remote script loaded");

    if (!window.__ALLOW_ERUDA__) return;

    // prevent double load
    if (window.__ERUDA_LOADING__) return;
    window.__ERUDA_LOADING__ = true;

    if (!window.eruda) {
        var s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/eruda";
        s.onload = function () {
            try {
                eruda.init();
                eruda.show();
                console.log("✅ ERUDA muncul");
            } catch(e) {
                console.log("❌ ERUDA init error:", e);
            }
        };
        (document.body || document.documentElement).appendChild(s);
    } else {
        eruda.show();
    }
  } catch(e) {
    console.log('❌ Inject error:', e.message, e.stack);
  }
})();
