// password locked bucketlist
(() => {
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyDuSjEGEKx5FnWYnQq8f_owbpYRBRrl5x0",
        authDomain: "esef-514bf.firebaseapp.com",
        projectId: "esef-514bf",
        storageBucket: "esef-514bf.firebasestorage.app",
        messagingSenderId: "353969651290",
        appId: "1:353969651290:web:41e3aaf8e54c743702a263"
    };

    async function sha256(text) {
        const buf = new TextEncoder().encode(text);
        const hash = await crypto.subtle.digest("SHA-256", buf);
        return Array.from(new Uint8Array(hash))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    }

    function showLock(container) {
        container.innerHTML = `
            <div class="bl-lock">
                <form class="bl-lock-box" id="bl-form">
                    <h2>Bucketlist</h2>
                    <input type="text" id="bl-user" placeholder="Username" autocomplete="username">
                    <input type="password" id="bl-pass" placeholder="Password" autocomplete="current-password">
                    <button type="submit" id="bl-submit">Unlock</button>
                    <p id="bl-err"></p>
                </form>
            </div>
        `;
    }

    function unlock(container, db, hash) {
        container.innerHTML = `
            <div class="bl-panel">
                <div class="bl-list" id="bl-list">
                    <p class="bl-empty">Loading...</p>
                </div>
            </div>
        `;

        const listEl = document.getElementById("bl-list");
        if (!listEl) return;

        // the hash is the doc id, no hash no items
        db.collection("bucketlist_data").doc(hash).collection("items").onSnapshot(snap => {
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
            render(listEl, items);
        }, () => {
            if (listEl) listEl.innerHTML = '<p class="bl-empty">Could not load.</p>';
        });
    }

    function render(listEl, items) {
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

    document.addEventListener("DOMContentLoaded", () => {
        const tab = document.getElementById("bucketlist");
        if (!tab) return;

        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        const db = firebase.firestore();

        const container = tab;

        // already logged in this session
        const savedHash = sessionStorage.getItem("bl_hash");
        if (savedHash) {
            unlock(container, db, savedHash);
            return;
        }

        showLock(container);

        const userInput = document.getElementById("bl-user");
        const passInput = document.getElementById("bl-pass");
        const submitBtn = document.getElementById("bl-submit");
        const errEl = document.getElementById("bl-err");

        async function tryUnlock() {
            const user = userInput.value.trim();
            const pass = passInput.value;
            if (!user || !pass) {
                (user ? passInput : userInput).focus();
                return;
            }

            submitBtn.disabled = true;
            errEl.textContent = "";

            // sha256 of "user:pass" has to match a doc in bucketlist_auth
            const hash = await sha256(user + ":" + pass);
            try {
                const doc = await db.collection("bucketlist_auth").doc(hash).get();
                if (doc.exists) {
                    sessionStorage.setItem("bl_hash", hash);
                    unlock(container, db, hash);
                } else {
                    errEl.textContent = "Wrong credentials.";
                    passInput.value = "";
                    passInput.focus();
                }
            } catch (e) {
                errEl.textContent = "Could not verify. Try again.";
            }
            submitBtn.disabled = false;
        }

        document.getElementById("bl-form").onsubmit = e => {
            e.preventDefault();
            tryUnlock();
        };
    });
})();
