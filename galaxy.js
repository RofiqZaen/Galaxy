(function () {
    console.log("🔥 Remote script loaded");

    if (!window.__ALLOW_ERUDA__) return;

    if (!window.eruda) {
        var s = document.createElement("script");
        s.src = "https://cdn.jsdelivr.net/npm/eruda";
        s.onload = function () {
            eruda.init();
            eruda.show(); // 👈 DI SINI
            console.log("✅ ERUDA muncul");
        };
        document.body.appendChild(s);
    } else {
        // Kalau ERUDA sudah ada
        eruda.show();
    }
})();
