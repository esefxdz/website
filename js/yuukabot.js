// bot status dashboard
(() => {
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyDuSjEGEKx5FnWYnQq8f_owbpYRBRrl5x0",
        authDomain: "esef-514bf.firebaseapp.com",
        projectId: "esef-514bf",
        storageBucket: "esef-514bf.firebasestorage.app",
        messagingSenderId: "353969651290",
        appId: "1:353969651290:web:41e3aaf8e54c743702a263"
    };

    // bot updates every 10s, nothing for a minute means it's probably dead
    const STALE_MS = 60 * 1000;

    document.addEventListener("DOMContentLoaded", () => {
        const dash = document.getElementById("yuukabot");
        if (!dash) return;

        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        const db = firebase.firestore();

        const dot = document.getElementById("dash-status-dot");
        let online = false;
        let updatedAt = null;
        let loaded = false; // dot stays grey until the first data

        function refreshDot() {
            if (!loaded) return;
            const fresh = updatedAt == null || Date.now() - updatedAt < STALE_MS;
            if (dot) dot.className = online && fresh ? "status-dot" : "status-dot offline";
        }
        // a crashed bot stops sending updates so keep checking
        setInterval(refreshDot, 5000);

        db.collection("sysinfo").doc("server").onSnapshot(doc => {
            loaded = true;
            const d = doc.exists ? doc.data() : {};
            online = !!d.online;
            updatedAt = d.updatedAt ? d.updatedAt.toMillis() : null;
            refreshDot();
            if (!doc.exists) return;

            setText("dash-uptime", d.uptime);
            setText("dash-bot-uptime", d.botUptime ? "bot up " + d.botUptime : "");

            setBar("dash-cpu-val", "dash-cpu-bar", d.cpu);
            setBar("dash-ram-val", "dash-ram-bar", d.ram);
            setBar("dash-disk-val", "dash-disk-bar", d.disk);
            setBar("dash-swap-val", "dash-swap-bar", d.swap);
            setText("dash-ram-detail", usedOfTotal(d.ramUsed, d.ramTotal));
            setText("dash-disk-detail", usedOfTotal(d.diskUsed, d.diskTotal));
            setText("dash-swap-detail", usedOfTotal(d.swapUsed, d.swapTotal));

            if (d.load1 != null) {
                setText("dash-load", d.load1 + " / " + d.load5 + " / " + d.load15);
            }

            if (d.netSent) {
                setText("dash-net", "sent " + d.netSent);
                setText("dash-net-detail", "recv " + (d.netRecv || "—"));
            }

            if (d.processes != null) {
                setText("dash-procs", d.processes.toLocaleString());
            }

            setText("dash-fetch", d.fetch);
        }, () => {
            loaded = true;
            online = false;
            refreshDot();
        });
    });

    function usedOfTotal(used, total) {
        return used ? used + " / " + total : "";
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el && value != null) el.textContent = value;
    }

    function setBar(valId, barId, value) {
        const valEl = document.getElementById(valId);
        const barEl = document.getElementById(barId);
        if (valEl && value != null) {
            valEl.textContent = value;
            const unit = document.createElement("span");
            unit.textContent = "%";
            valEl.appendChild(unit);
        }
        if (barEl) {
            barEl.style.width = Math.min(Math.max(value || 0, 0), 100) + "%";
        }
    }
})();
