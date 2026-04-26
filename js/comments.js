const FIREBASE_CONFIG = {
    apiKey: "AIzaSyDuSjEGEKx5FnWYnQq8f_owbpYRBRrl5x0",
    authDomain: "esef-514bf.firebaseapp.com",
    projectId: "esef-514bf",
    storageBucket: "esef-514bf.firebasestorage.app",
    messagingSenderId: "353969651290",
    appId: "1:353969651290:web:41e3aaf8e54c743702a263"
};

// ================================================================

const MAX_CHARS = 300;
const COLLECTION = "comments";

document.addEventListener('DOMContentLoaded', () => {

    const configured = FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY";

    const form = document.getElementById('comment-form');
    const nameInput = document.getElementById('comment-name');
    const msgInput = document.getElementById('comment-message');
    const submitBtn = document.getElementById('comment-submit');
    const charCountEl = document.getElementById('char-count');
    const listEl = document.getElementById('comments-list');
    const titleEl = document.getElementById('comments-title');
    const colorInput = document.getElementById('comment-avatar-color');
    const b64Input = document.getElementById('comment-avatar-b64');
    const pfpUpload = document.getElementById('pfp-upload');
    const pfpPreview = document.getElementById('pfp-preview');
    const pfpClear = document.getElementById('pfp-clear');
    const warning = document.getElementById('firebase-setup-warning');

    if (!form || !listEl) return;

    // ── Avatar colour picker ─────────────────────────────────────
    document.querySelectorAll('.av-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.av-opt').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            colorInput.value = btn.dataset.color;
        });
    });

    // ── Custom PFP Upload ────────────────────────────────────────
    if (pfpUpload) {
        pfpUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    // Shrink to max 64x64 to save space
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = 64;
                    canvas.height = 64;
                    
                    // Center and crop
                    const size = Math.min(img.width, img.height);
                    const sx = (img.width - size) / 2;
                    const sy = (img.height - size) / 2;
                    
                    ctx.drawImage(img, sx, sy, size, size, 0, 0, 64, 64);
                    
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    b64Input.value = dataUrl;
                    pfpPreview.style.backgroundImage = `url(${dataUrl})`;
                    pfpPreview.style.display = 'block';
                    pfpClear.style.display = 'inline-flex';
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });
        
        pfpClear.addEventListener('click', () => {
            b64Input.value = '';
            pfpUpload.value = '';
            pfpPreview.style.display = 'none';
            pfpPreview.style.backgroundImage = 'none';
            pfpClear.style.display = 'none';
        });
    }

    // ── Char counter ─────────────────────────────────────────────
    charCountEl.textContent = MAX_CHARS;
    msgInput.addEventListener('input', () => {
        const left = MAX_CHARS - msgInput.value.length;
        charCountEl.textContent = left;
        charCountEl.style.color = left < 40 ? '#e05555' : '#364858';
    });

    // ── No Firebase → show demo + setup warning ──────────────────
    if (!configured) {
        if (warning) warning.style.display = 'block';
        showDemo(listEl);
        form.addEventListener('submit', e => {
            e.preventDefault();
            alert('Firebase is not connected yet!\n\nOpen js/comments.js and follow the setup instructions at the top of the file.');
        });
        return;
    }

    // ── Firebase init ────────────────────────────────────────────
    firebase.initializeApp(FIREBASE_CONFIG);
    const db = firebase.firestore();

    // ── Real-time feed ───────────────────────────────────────────
    db.collection(COLLECTION)
        .orderBy('timestamp', 'desc')
        .onSnapshot(snap => {
            listEl.innerHTML = '';

            if (titleEl) {
                titleEl.textContent = snap.size > 0 ? `(${snap.size})` : '';
            }

            if (snap.empty) {
                listEl.innerHTML = '<p class="no-comments">No messages yet — be the first!</p>';
                return;
            }
            snap.forEach(doc => listEl.appendChild(buildBubble(doc.data())));

        }, err => {
            console.error(err);
            listEl.innerHTML = '<p class="no-comments">Could not load comments. Check your Firebase config.</p>';
        });

    // ── Submit ───────────────────────────────────────────────────
    form.addEventListener('submit', async e => {
        e.preventDefault();

        const name = clean(nameInput.value.trim()).slice(0, 32) || 'Anonymous';
        const message = clean(msgInput.value.trim()).slice(0, MAX_CHARS);
        const color = colorInput.value || '#5b6fde';
        const avatarUrl = b64Input.value;

        if (!message) { msgInput.focus(); return; }

        submitBtn.disabled = true;
        submitBtn.textContent = 'Posting...';

        try {
            await db.collection(COLLECTION).add({
                name, message, color, avatarUrl,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            nameInput.value = '';
            msgInput.value = '';
            charCountEl.textContent = MAX_CHARS;
            charCountEl.style.color = '#364858';
        } catch (err) {
            console.error(err);
            alert('Failed to post. Try again!');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'POST';
        }
    });
});

// ── Build a single comment bubble (Steam layout) ─────────────────

function buildBubble(data) {
    const div = document.createElement('div');
    div.className = 'comment-bubble';

    const ts = data.timestamp ? data.timestamp.toDate() : new Date();
    const timeStr = ts.toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const color = data.color || '#64748b';
    const initial = (data.name || '?').charAt(0).toUpperCase();
    
    let avatarHtml = '';
    if (data.avatarUrl) {
        avatarHtml = `<img src="${esc(data.avatarUrl)}" class="comment-avatar" alt="Avatar">`;
    } else {
        avatarHtml = `
            <div class="comment-avatar" style="background:${esc(color)}">
                ${esc(initial)}
            </div>
        `;
    }

    div.innerHTML = `
        ${avatarHtml}
        <div class="comment-body">
            <div class="comment-header">
                <span class="comment-name">${esc(data.name)}</span>
                <span class="comment-time">${timeStr}</span>
            </div>
            <p class="comment-text">${esc(data.message)}</p>
        </div>
    `;
    return div;
}

// ── Demo bubbles shown before Firebase is set up ─────────────────

function showDemo(list) {
    const demos = [
        { name: 'Visitor', message: 'cool site lol', color: '#3b82f6', timestamp: { toDate: () => new Date(Date.now() - 60000) } },
        { name: 'Ahmet', message: 'when is the gallery getting updated', color: '#10b981', timestamp: { toDate: () => new Date(Date.now() - 300000) } },
        { name: 'Someone', message: 'Ahmet museum is peak', color: '#8b5cf6', timestamp: { toDate: () => new Date(Date.now() - 800000) } },
    ];
    list.innerHTML = '';
    demos.forEach(d => list.appendChild(buildBubble(d)));
}

// ── Helpers ──────────────────────────────────────────────────────

function clean(str) {
    return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function esc(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
