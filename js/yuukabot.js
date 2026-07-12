// Yuuka Bot Dashboard — live Firestore reader
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

    if (!firebase.apps.length) firebase.initializeApp(YUUKA_FIREBASE_CONFIG);
    const db = firebase.firestore();

    db.collection("sysinfo").doc("server").onSnapshot(
        (doc) => {
            if (!doc.exists) return;
            const d = doc.data();

            // Online dot
            const dot = document.getElementById("dash-status-dot");
            if (dot) dot.className = d.online ? "status-dot" : "status-dot offline";

            // Uptime
            setText("dash-uptime", d.uptime);

            // CPU, RAM, Disk, Swap — bars
            setBar("dash-cpu-val", "dash-cpu-bar", null, d.cpu, "%", "cpu");
            setBar("dash-ram-val", "dash-ram-bar", null, d.ram, "%", "ram");
            setText("dash-ram-detail", d.ramUsed ? d.ramUsed + " / " + d.ramTotal : "");
            setBar("dash-disk-val", "dash-disk-bar", null, d.disk, "%", "disk");
            setText("dash-disk-detail", d.diskUsed ? d.diskUsed + " / " + d.diskTotal : "");
            setBar("dash-swap-val", "dash-swap-bar", null, d.swap, "%", "swap");
            setText("dash-swap-detail", d.swapUsed ? d.swapUsed + " / " + d.swapTotal : "");

            // Load average
            if (d.load1 != null) {
                setText("dash-load", d.load1 + " / " + d.load5 + " / " + d.load15);
            }

            // Network
            if (d.netSent) {
                setText("dash-net", "sent " + d.netSent);
                setText("dash-net-detail", "recv " + (d.netRecv || "—"));
            }

            // Processes
            // Fastfetch
            setText("dash-fetch", d.fetch);

            if (d.processes != null) {
                setText("dash-procs", d.processes.toLocaleString());
            }
        },
        () => {
            const dot = document.getElementById("dash-status-dot");
            if (dot) dot.className = "status-dot offline";
        }
    );
});

function setText(id, value) {
    const el = document.getElementById(id);
    if (el && value != null) el.textContent = value;
}

function setBar(valId, barId, _detailId, value, suffix, barClass) {
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