// Calendar tab — timezone-aware (auto-converts to your local time)
(() => {
    const FIREBASE_CONFIG = {
        apiKey: "AIzaSyDuSjEGEKx5FnWYnQq8f_owbpYRBRrl5x0",
        authDomain: "esef-514bf.firebaseapp.com",
        projectId: "esef-514bf",
        storageBucket: "esef-514bf.firebasestorage.app",
        messagingSenderId: "353969651290",
        appId: "1:353969651290:web:41e3aaf8e54c743702a263"
    };

    const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const MONTHS = ["January","February","March","April","May","June",
                    "July","August","September","October","November","December"];

    document.addEventListener("DOMContentLoaded", () => {
        const tab = document.getElementById("calendar");
        if (!tab) return;

        if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
        const db = firebase.firestore();

        let allEvents = [];
        const now = new Date();
        let viewYear = now.getFullYear();
        let viewMonth = now.getMonth();

        const gridEl = document.getElementById("cal-grid");
        const navEl = document.getElementById("cal-nav-title");
        const sidebarEl = document.getElementById("cal-sidebar-list");

        db.collection("calendar_events").onSnapshot(snap => {
            allEvents = snap.docs.map(doc => toEvent(doc.data()));
            allEvents.sort((a, b) => a.when - b.when);
            render();
        }, () => {
            gridEl.innerHTML = '<p class="cal-side-empty">Could not load.</p>';
        });

        document.getElementById("cal-prev").onclick = () => shiftMonth(-1);
        document.getElementById("cal-next").onclick = () => shiftMonth(1);

        // Auto-refresh every 60s so "Upcoming" stays current as time passes
        setInterval(render, 60000);

        function shiftMonth(delta) {
            // Day 1 avoids overflow (e.g. Jan 31 + 1 month → Mar 3)
            const d = new Date(viewYear, viewMonth + delta, 1);
            viewYear = d.getFullYear();
            viewMonth = d.getMonth();
            render();
        }

        function render() {
            navEl.textContent = MONTHS[viewMonth] + " " + viewYear;

            const byDate = {};
            allEvents.forEach(e => {
                (byDate[e.date] = byDate[e.date] || []).push(e);
            });

            const firstDay = new Date(viewYear, viewMonth, 1).getDay();
            const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
            const todayStr = ymd(new Date());

            let html = "";
            WEEKDAYS.forEach(d => html += '<div class="cal-day-header">' + d + "</div>");

            for (let i = 0; i < firstDay; i++) {
                html += '<div class="cal-day other-month"><div class="day-num"></div></div>';
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const dateStr = ymd(new Date(viewYear, viewMonth, d));
                const dayEvents = byDate[dateStr] || [];
                const hasEvents = dayEvents.length > 0;

                html += '<div class="cal-day' +
                    (dateStr === todayStr ? " today" : "") +
                    (hasEvents ? " has-events" : "") + '">';
                html += '<div class="day-num">' + d + "</div>";

                if (hasEvents) {
                    dayEvents.forEach(() => html += '<span class="day-dot"></span>');
                    html += '<div class="cal-popup"><h4>' + dateStr + "</h4>";
                    dayEvents.forEach(e => {
                        html += '<div class="cal-popup-item">';
                        if (e.time) html += '<span class="pop-time">' + esc(e.time) + "</span> ";
                        html += esc(e.title);
                        if (e.description) html += '<div class="pop-desc">' + esc(e.description) + "</div>";
                        html += "</div>";
                    });
                    html += "</div>";
                }
                html += "</div>";
            }

            gridEl.innerHTML = html;

            const nowMs = Date.now();
            const upcoming = allEvents.filter(e => e.when >= nowMs);
            if (upcoming.length === 0) {
                sidebarEl.innerHTML = '<p class="cal-side-empty">No upcoming events.<br>Use !book in Discord.</p>';
            } else {
                sidebarEl.innerHTML = upcoming.slice(0, 15).map(e =>
                    '<div class="cal-side-event">' +
                    '<div class="se-date">' + esc(e.date) + (e.time ? " " + esc(e.time) : "") + "</div>" +
                    '<div class="se-title">' + esc(e.title) + "</div>" +
                    (e.description ? '<div class="se-desc">' + esc(e.description) + "</div>" : "") +
                    "</div>"
                ).join("");
            }
        }
    });

    // Normalise a Firestore doc into local date/time. Timed events use the
    // `utc` timestamp so they land on the viewer's local day; date-only events
    // keep their `date` (converting their midnight could shift them a day).
    // Falls back to the raw fields when `utc` is missing or unparseable.
    function toEvent(d) {
        const utc = d.utc ? new Date(d.utc) : null;
        const hasUtc = utc && !isNaN(utc.getTime());
        const localize = hasUtc && d.time;
        const date = localize ? ymd(utc) : (d.date || "");
        const time = !d.time ? "" : localize
            ? utc.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
            : d.time;
        return {
            title: d.title || "",
            description: d.description || "",
            date,
            time,
            // 0 for malformed events keeps the sort stable and hides them from "Upcoming"
            when: (hasUtc ? utc.getTime() : new Date(date + "T" + (d.time || "00:00")).getTime()) || 0
        };
    }

    function ymd(d) {
        return d.getFullYear() + "-" +
            String(d.getMonth() + 1).padStart(2, "0") + "-" +
            String(d.getDate()).padStart(2, "0");
    }

    function esc(s) {
        if (!s) return "";
        return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }
})();
