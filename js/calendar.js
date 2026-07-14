// Calendar tab — timezone-aware (auto-converts to your local time)
const CAL_FB_CONFIG = {
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

function fmtTime(utcIso) {
    if (utcIso) {
        try {
            var d = new Date(utcIso);
            if (!isNaN(d.getTime())) {
                return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            }
        } catch (e) {}
    }
    return "";
}

document.addEventListener("DOMContentLoaded", () => {
    const tab = document.getElementById("calendar");
    if (!tab) return;

    if (!firebase.apps.length) firebase.initializeApp(CAL_FB_CONFIG);
    const db = firebase.firestore();

    let allEvents = [];
    let viewDate = new Date();

    const gridEl = document.getElementById("cal-grid");
    const navEl = document.getElementById("cal-nav-title");
    const sidebarEl = document.getElementById("cal-sidebar-list");

    db.collection("calendar_events").onSnapshot(snap => {
        allEvents = [];
        snap.forEach(doc => {
            const d = doc.data();
            allEvents.push({
                id: doc.id,
                title: d.title || "",
                date: d.date || "",
                time: d.time || "",
                utc: d.utc || "",
                description: d.description || "",
                _sort: d.utc || (d.date + "T" + (d.time || "00:00"))
            });
        });
        allEvents.sort((a, b) => a._sort.localeCompare(b._sort));
        render();
    }, () => {
        if (gridEl) gridEl.innerHTML = '<p class="cal-side-empty">Could not load.</p>';
    });

    document.getElementById("cal-prev").onclick = () => { viewDate.setMonth(viewDate.getMonth()-1); render(); };
    document.getElementById("cal-next").onclick = () => { viewDate.setMonth(viewDate.getMonth()+1); render(); };

    // Auto-refresh every 60s so "Upcoming" stays current as time passes
    setInterval(render, 60000);

    function render() {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        navEl.textContent = MONTHS[month] + " " + year;

        const byDate = {};
        allEvents.forEach(e => {
            if (!byDate[e.date]) byDate[e.date] = [];
            byDate[e.date].push(e);
        });

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const today = new Date();
        const todayStr = today.getFullYear() + "-" +
            String(today.getMonth()+1).padStart(2,"0") + "-" +
            String(today.getDate()).padStart(2,"0");

        let html = "";
        WEEKDAYS.forEach(d => html += '<div class="cal-day-header">' + d + "</div>");

        for (let i = 0; i < firstDay; i++) {
            html += '<div class="cal-day other-month"><div class="day-num"></div></div>';
        }

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = year + "-" +
                String(month+1).padStart(2,"0") + "-" +
                String(d).padStart(2,"0");
            const dayEvents = byDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            const hasEvents = dayEvents.length > 0;

            html += '<div class="cal-day' +
                (isToday ? " today" : "") +
                (hasEvents ? " has-events" : "") + '">';
            html += '<div class="day-num">' + d + "</div>";

            if (hasEvents) {
                dayEvents.forEach(() => html += '<span class="day-dot"></span>');
                html += '<div class="cal-popup"><h4>' + dateStr + "</h4>";
                dayEvents.forEach(e => {
                    html += '<div class="cal-popup-item">';
                    if (e.time) {
                        html += '<span class="pop-time">' + fmtTime(e.utc) + "</span> ";
                    }
                    html += esc(e.title);
                    if (e.description) html += '<div class="pop-desc">' + esc(e.description) + "</div>";
                    html += "</div>";
                });
                html += "</div>";
            }
            html += "</div>";
        }

        gridEl.innerHTML = html;

        const nowISO = new Date().toISOString();
        const upcoming = allEvents.filter(e => e._sort >= nowISO);
        if (upcoming.length === 0) {
            sidebarEl.innerHTML = '<p class="cal-side-empty">No upcoming events.<br>Use !book in Discord.</p>';
        } else {
            sidebarEl.innerHTML = upcoming.slice(0, 15).map(e =>
                '<div class="cal-side-event">' +
                '<div class="se-date">' + e.date +
                (e.time ? " " + fmtTime(e.utc) : "") + "</div>" +
                '<div class="se-title">' + esc(e.title) + "</div>" +
                (e.description ? '<div class="se-desc">' + esc(e.description) + "</div>" : "") +
                "</div>"
            ).join("");
        }
    }

    function esc(s) {
        if (!s) return "";
        return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;")
            .replace(/>/g,"&gt;").replace(/"/g,"&quot;");
    }
});
