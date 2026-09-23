// comment wall + click counter on the about tab
(() => {
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyDuSjEGEKx5FnWYnQq8f_owbpYRBRrl5x0",
        authDomain: "esef-514bf.firebaseapp.com",
        projectId: "esef-514bf",
        storageBucket: "esef-514bf.firebasestorage.app",
        messagingSenderId: "353969651290",
        appId: "1:353969651290:web:41e3aaf8e54c743702a263"
    };

    const MAX_CHARS = 300;
    const MAX_NAME = 32;
    const COMMENTS_PER_PAGE = 5;
    const COLLECTION = "comments";
    const DEFAULT_COLOR = "#5b6fde";
    const COUNT_COLOR = "#364858";
    const COUNT_LOW_COLOR = "#e05555";

    document.addEventListener('DOMContentLoaded', () => {
        const form = document.getElementById('comment-form');
        const nameInput = document.getElementById('comment-name');
        const msgInput = document.getElementById('comment-message');
        const submitBtn = document.getElementById('comment-submit');
        const charCountEl = document.getElementById('char-count');
        const listEl = document.getElementById('comments-list');
        const titleEl = document.getElementById('comments-title');
        const paginationEl = document.getElementById('comments-pagination');
        const colorInput = document.getElementById('comment-avatar-color');
        const b64Input = document.getElementById('comment-avatar-b64');
        const pfpUpload = document.getElementById('pfp-upload');
        const pfpPreview = document.getElementById('pfp-preview');
        const pfpClear = document.getElementById('pfp-clear');

        if (!form || !listEl) return;

        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        const db = firebase.firestore();

        // avatar colour picker
        const colorOpts = document.querySelectorAll('.av-opt');
        colorOpts.forEach(btn => {
            btn.addEventListener('click', () => {
                colorOpts.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                colorInput.value = btn.dataset.color;
            });
        });

        // pfp upload, cropped to a 64x64 square
        pfpUpload.addEventListener('change', () => {
            const file = pfpUpload.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 64;
                    canvas.height = 64;

                    const size = Math.min(img.width, img.height);
                    const sx = (img.width - size) / 2;
                    const sy = (img.height - size) / 2;
                    canvas.getContext('2d').drawImage(img, sx, sy, size, size, 0, 0, 64, 64);

                    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
                    b64Input.value = dataUrl;
                    pfpPreview.style.backgroundImage = `url(${dataUrl})`;
                    pfpPreview.style.display = 'block';
                    pfpClear.style.display = 'inline-flex';
                };
                img.src = reader.result;
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

        function updateCharCount() {
            const left = MAX_CHARS - msgInput.value.length;
            charCountEl.textContent = left;
            charCountEl.style.color = left < 40 ? COUNT_LOW_COLOR : COUNT_COLOR;
        }
        msgInput.addEventListener('input', updateCharCount);
        updateCharCount();

        // comments feed + pages
        let allComments = [];
        let currentPage = 1;

        function renderPage() {
            listEl.innerHTML = '';
            paginationEl.innerHTML = '';

            if (allComments.length === 0) {
                listEl.innerHTML = '<p class="no-comments">No messages yet — be the first!</p>';
                return;
            }

            const totalPages = Math.ceil(allComments.length / COMMENTS_PER_PAGE);
            currentPage = Math.min(Math.max(currentPage, 1), totalPages);

            const start = (currentPage - 1) * COMMENTS_PER_PAGE;
            allComments.slice(start, start + COMMENTS_PER_PAGE)
                .forEach(data => listEl.appendChild(buildBubble(data)));

            if (totalPages > 1) {
                for (let i = 1; i <= totalPages; i++) {
                    const btn = document.createElement('button');
                    btn.className = 'steam-page-btn' + (i === currentPage ? ' active' : '');
                    btn.textContent = i;
                    btn.onclick = () => {
                        currentPage = i;
                        renderPage();
                    };
                    paginationEl.appendChild(btn);
                }
            }
        }

        db.collection(COLLECTION)
            .orderBy('timestamp', 'desc')
            .onSnapshot(snap => {
                titleEl.textContent = snap.size > 0 ? `(${snap.size})` : '';
                allComments = snap.docs.map(doc => doc.data());
                renderPage();
            }, err => {
                console.error(err);
                listEl.innerHTML = '<p class="no-comments">Could not load comments.</p>';
            });

        // click counter
        const clickBtn = document.getElementById('yuuka-click-btn');
        const clickDisplay = document.getElementById('click-counter-display');
        const clickSound = new Audio('sounds/yuuka_click.mp3');

        if (clickBtn && clickDisplay) {
            const statsRef = db.collection('stats').doc('global_clicks');

            statsRef.onSnapshot(doc => {
                const count = doc.exists ? doc.data().count : 0;
                clickDisplay.textContent = (count || 0).toLocaleString();
            }, err => {
                console.error("Click counter error:", err);
                clickDisplay.textContent = 'Error';
            });

            clickBtn.addEventListener('click', () => {
                clickSound.currentTime = 0; // so spam clicking plays every time
                clickSound.play().catch(() => {});

                statsRef.set({
                    count: firebase.firestore.FieldValue.increment(1)
                }, { merge: true }).catch(err => console.error("Failed to click:", err));
            });
        }

        form.addEventListener('submit', async e => {
            e.preventDefault();

            const name = nameInput.value.trim().slice(0, MAX_NAME) || 'Anonymous';
            const message = msgInput.value.trim().slice(0, MAX_CHARS);
            const color = colorInput.value || DEFAULT_COLOR;
            const avatarUrl = b64Input.value;

            if (!message) { msgInput.focus(); return; }

            const label = submitBtn.textContent;
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';

            try {
                await db.collection(COLLECTION).add({
                    name, message, color, avatarUrl,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });
                nameInput.value = '';
                msgInput.value = '';
                updateCharCount();
            } catch (err) {
                console.error(err);
                alert('Failed to post. Try again!');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = label;
            }
        });
    });

    function buildBubble(data) {
        const div = document.createElement('div');
        div.className = 'comment-bubble';

        // timestamp is null for a sec right after posting
        const ts = data.timestamp ? data.timestamp.toDate() : new Date();
        const timeStr = ts.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const name = legacyUnescape(data.name) || 'Anonymous';
        const message = legacyUnescape(data.message);

        let avatarHtml;
        if (typeof data.avatarUrl === 'string' && data.avatarUrl.startsWith('data:image/')) {
            avatarHtml = `<img src="${esc(data.avatarUrl)}" class="comment-avatar" alt="">`;
        } else {
            const color = /^#[0-9a-f]{6}$/i.test(data.color) ? data.color : '#64748b';
            avatarHtml = `<div class="comment-avatar" style="background:${color}">${esc(name.charAt(0).toUpperCase())}</div>`;
        }

        div.innerHTML = `
            ${avatarHtml}
            <div class="comment-body">
                <div class="comment-header">
                    <span class="comment-name">${esc(name)}</span>
                    <span class="comment-time">${timeStr}</span>
                </div>
                <p class="comment-text">${esc(message)}</p>
            </div>
        `;
        return div;
    }

    // old comments were saved already escaped, this stops them showing "&lt;"
    function legacyUnescape(str) {
        if (!str) return '';
        return String(str).replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    }

    function esc(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }
})();
