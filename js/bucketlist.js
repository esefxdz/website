// Bucketlist tab — real-time Firestore list
const BL_FB_CONFIG = {
    apiKey: "AIzaSyDuSjEGEKx5FnWYnQq8f_owbpYRBRrl5x0",
    authDomain: "esef-514bf.firebaseapp.com",
    projectId: "esef-514bf",
    storageBucket: "esef-514bf.firebasestorage.app",
    messagingSenderId: "353969651290",
    appId: "1:353969651290:web:41e3aaf8e54c743702a263"
};

document.addEventListener("DOMContentLoaded", () => {
    const tab = document.getElementById("bucketlist");
    if (!tab) return;

    if (!firebase.apps.length) firebase.initializeApp(BL_FB_CONFIG);
    const db = firebase.firestore();

    const listEl = document.getElementById("bl-list");
    if (!listEl) return;

    db.collection("bucketlist_items").onSnapshot(snap => {
        const items = [];
        snap.forEach(doc => {
            const d = doc.data();
            items.push({
                id: doc.id,
                title: d.title || "",
                description: d.description || "",
                date: d.date || "",
                utc: d.utc || "",
                done: d.done || false
            });
        });
        items.sort((a, b) => (a.utc || "").localeCompare(b.utc || ""));
        render(items);
    }, () => {
        if (listEl) listEl.innerHTML = '<p class="bl-empty">Could not load.</p>';
    });

    function render(items) {
        if (items.length === 0) {
            listEl.innerHTML = '<p class="bl-empty">Nothing here yet.</p>';
            return;
        }

        listEl.innerHTML = items.map(item =>
            '<div class="bl-item' + (item.done ? ' bl-done' : '') + '">' +
            '<div class="bl-title">' + esc(item.title) + '</div>' +
            (item.date ? '<div class="bl-date">' + esc(item.date) + '</div>' : '') +
            (item.description ? '<div class="bl-desc">' + esc(item.description) + '</div>' : '') +
            '</div>'
        ).join("");
    }

    function esc(s) {
        if (!s) return "";
        return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");
    }
});
