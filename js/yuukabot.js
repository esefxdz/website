// ═══════════════════════════════════════════════════════════
// YUUKA BOT DASHBOARD — live Firestore reader
// ═══════════════════════════════════════════════════════════

const YUUKA_FIREBASE_CONFIG = {
    apiKey: "AIzaSyDuSjEGEKx5FnWYnQq8f_owbpYRBRrl5x0",
    authDomain: "esef-514bf.firebaseapp.com",
    projectId: "esef-514bf",
    storageBucket: "esef-514bf.firebasestorage.app",
    messagingSenderId: "353969651290",
    appId: "1:353969651290:web:41e3aaf8e54c743702a263"
};

document.addEventListener("DOMContentLoaded", () => {
    const dash = document.getElementById("yuukabot");
    if (!dash) return;

    // Init Firebase (skip if already done by comments.js)
    if (!firebase.apps.length) {
        firebase.initializeApp(YUUKA_FIREBASE_CONFIG);
    }
    const db = firebase.firestore();

    // Live listener: updates the dashboard whenever Firestore changes
    db.collection("sysinfo").doc("server").onSnapshot(
        (doc) => {
            if (!doc.exists) return;
            const d = doc.data();

            // Online status
            const dot = document.getElementById("dash-status-dot");
            if (dot) {
                dot.className = d.online ? "status-dot" : "status-dot offline";
            }

            // Uptime
            const uptimeEl = document.getElementById("dash-uptime");
            if (uptimeEl && d.uptime) uptimeEl.textContent = d.uptime;

            // CPU
            setBar("dash-cpu-val", "dash-cpu-bar", "dash-cpu-detail", d.cpu, "%", "cpu");

            // RAM
            const ramEl = document.getElementById("dash-ram-detail");
            if (ramEl && d.ramUsed && d.ramTotal) {
                ramEl.textContent = d.ramUsed + " / " + d.ramTotal;
            }
            setBar("dash-ram-val", "dash-ram-bar", null, d.ram, "%", "ram");

            // Disk
            const diskEl = document.getElementById("dash-disk-detail");
            if (diskEl && d.diskUsed && d.diskTotal) {
                diskEl.textContent = d.diskUsed + " / " + d.diskTotal;
            }
            setBar("dash-disk-val", "dash-disk-bar", null, d.disk, "%", "disk");
        },
        (err) => {
            // Firestore unreachable — show offline
            const dot = document.getElementById("dash-status-dot");
            if (dot) dot.className = "status-dot offline";
        }
    );
});

function setBar(valId, barId, detailId, value, suffix, barClass) {
    const valEl = document.getElementById(valId);
    const barEl = document.getElementById(barId);
    if (valEl && value != null) {
        valEl.innerHTML = value + '<span>' + suffix + '</span>';
    }
    if (barEl) {
        barEl.style.width = Math.min(Math.max(value || 0, 0), 100) + "%";
        barEl.className = "card-bar-fill " + barClass;
    }
}