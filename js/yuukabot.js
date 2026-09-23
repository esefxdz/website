// Yuuka Bot Dashboard — live Firestore reader
(() => {
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyDuSjEGEKx5FnWYnQq8f_owbpYRBRrl5x0",
        authDomain: "esef-514bf.firebaseapp.com",
        projectId: "esef-514bf",
        storageBucket: "esef-514bf.firebasestorage.app",
        messagingSenderId: "353969651290",
        appId: "1:353969651290:web:41e3aaf8e54c743702a263"
    };

    // The bot pushes every 10s; no update for this long means it's down
    // (generous so a visitor's slightly-off clock doesn't flip the dot).
    const STALE_MS = 60 * 1000;

    document.addEventListener("DOMContentLoaded", () => {
        const dash = document.getElementById("yuukabot");
        if (!dash) return;

        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        const db = firebase.firestore();

        const dot = document.getElementById("dash-status-dot");
        let online = false;
        let updatedAt = null;  // ms; null for bots that don't send updatedAt yet
        let loaded = false;    // keep the grey "pending" dot until first data

        function refreshDot() {
            if (!loaded) return;
            const fresh = updatedAt == null || Date.now() - updatedAt < STALE_MS;
            if (dot) dot.className = online && fresh ? "status-dot" : "status-dot offline";
        }
        // Re-check periodically: a crashed bot sends no more snapshots
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

            // CPU, RAM, Disk, Swap — value + bar
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
