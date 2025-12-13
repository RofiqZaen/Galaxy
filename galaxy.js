(function () {
    console.log("🔥 Remote script loaded");

    // ❌ Kill switch
    if (!location.hostname.includes("mobstudio.ru")) {
        console.log("❌ Disabled on this domain");
        return;
    }

    // ===== ERUDA =====
    try {
        if (!window.eruda) {
            var s = document.createElement("script");
            s.src = "https://cdn.jsdelivr.net/npm/eruda";
            s.onload = function () {
                eruda.init();
                console.log("✅ ERUDA loaded");
            };
            document.body.appendChild(s);
        }
    } catch (e) {
        console.error("❌ Galaxy error:", e);
    }
})();
