(() => {
  "use strict";
  let owner = "", version = 0, pending = null, attached = false, days = [];
  const $ = id => document.getElementById(id);
  const node = (tag, text) => { const el = document.createElement(tag); if (text !== undefined) el.textContent = text; return el; };
  const count = value => value === null ? "—" : Number(value).toLocaleString("en-US");
  const style = node("style");
  style.textContent = `
    #overviewSection .card[role="button"]{cursor:pointer}
    #overviewSection .card[role="button"]:focus-visible{outline:2px solid #64f2b2;outline-offset:4px}
    #riDailyDialog{width:min(800px,calc(100vw - 28px));max-height:85vh;overflow:auto;padding:24px;border:1px solid #31543f;border-radius:18px;background:#071a12;color:#eaf7ed}
    #riDailyDialog::backdrop{background:rgba(0,0,0,.75)}
    #riDailyDialog header{display:flex;align-items:center;justify-content:space-between;gap:16px}
    #riDailyDialog h2{margin:0;font-size:23px}
    #riDailyDialog button{padding:8px 12px;border:1px solid #31543f;border-radius:8px;background:#102c1d;color:#eaf7ed;cursor:pointer}
    #riDailyDialog p{color:#a1baaa;font-size:12px}
    #riDailyDialog .ri-day-scroll{overflow:auto}
    #riDailyDialog table{width:100%;border-collapse:collapse;white-space:nowrap}
    #riDailyDialog th,#riDailyDialog td{padding:12px 10px;text-align:left;border-bottom:1px solid #234331;font-size:13px}
    #riDailyDialog th{color:#a1baaa;font-weight:500}
    #riDailyDialog tbody tr:first-child{color:#65f0b4}
  `;
  document.head.append(style);
  const dialog = node("dialog"); dialog.id = "riDailyDialog";
  const header = node("header");
  const title = node("h2", "Daily activity · last 14 days"); title.id = "riDailyTitle";
  dialog.setAttribute("aria-labelledby", title.id);
  const close = node("button", "Close"); close.type = "button"; close.onclick = () => dialog.close();
  header.append(title, close);
  const note = node("p", "Unique browsers per calendar day. Time zone: Europe/Bratislava. — = no saved history.");
  const scroll = node("div"); scroll.className = "ri-day-scroll";
  const table = node("table"), thead = node("thead"), tr = node("tr");
  for (const text of ["Date", "Visitors", "People searching", "Analyses"]) { const th = node("th", text); th.scope = "col"; tr.append(th); }
  thead.append(tr);
  const tbody = node("tbody"); table.append(thead, tbody); scroll.append(table);
  const status = node("p", "Loading history…"); status.setAttribute("role", "status");
  dialog.append(header, note, scroll, status); document.body.append(dialog);

  function render() {
    const today = days[0];
    $("visitors24").textContent = today ? count(today.visitors) : "—";
    $("searches24").textContent = today ? count(today.searchers) : "—";
    $("uniqueTokens").textContent = today && today.searches !== null
      ? count(today.searches) + " token searches today" : "Unique browsers searching today";
    tbody.replaceChildren();
    for (const day of days) {
      const row = node("tr");
      const date = day.day.slice(8,10) + "." + day.day.slice(5,7) + "." + day.day.slice(0,4);
      for (const value of [date,count(day.visitors),count(day.searchers),count(day.searches)]) row.append(node("td", value));
      tbody.append(row);
    }
  }
  function reset(next = "") {
    owner = next; version++; days = []; pending = null; render();
    status.textContent = "Loading history…";
    if (dialog.open) dialog.close();
  }
  async function refresh() {
    const client = window.BAGVYR_ADMIN_CLIENT, config = window.BAGVYR_SUPABASE;
    if (!client || !config) return;
    const initial = version;
    const auth = await client.auth.getSession();
    if (initial !== version) return;
    const session = auth.data?.session;
    if (auth.error || !session) { if (owner) reset(); return; }
    if (owner !== session.user.id) reset(session.user.id);
    if (pending) return pending;
    const current = version;
    const job = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(config.url.replace(/\/+$/, "") + "/rest/v1/rpc/ri_admin_daily_stats", {
          method: "POST", headers: { apikey: config.publishableKey, Authorization: "Bearer " + session.access_token, "Content-Type": "application/json" },
          body: "{}", signal: controller.signal
        });
        if (current !== version) return;
        if (response.status === 401 || response.status === 403) { days = []; render(); if (dialog.open) dialog.close(); throw new Error("Admin access required."); }
        if (!response.ok) throw new Error("Daily history unavailable.");
        const data = await response.json();
        if (current !== version) return;
        if (!Array.isArray(data.days) || data.days.length !== 14 || new Set(data.days.map(d => d.day)).size !== 14 || data.days.some(d =>
          !/^\d{4}-\d{2}-\d{2}$/.test(d.day) || [d.visitors,d.searchers,d.searches].some(v => v !== null && (!Number.isSafeInteger(v) || v < 0))
        )) throw new Error("Invalid daily history.");
        days = data.days; render();
        status.textContent = "Updated: " + new Date(data.updated_at).toLocaleString("en-GB", { timeZone: "Europe/Bratislava" });
      } catch (error) {
        if (current === version) status.textContent = (days.length ? "Showing the last successful load. " : "") + (error?.message || "Daily history unavailable.");
      } finally { clearTimeout(timer); if (pending === job) pending = null; }
    })();
    pending = job; return job;
  }
  window.RI_DAILY_STATS = { refresh: () => refresh().catch(() => {}) };
  for (const [id,label] of [["visitors24","Visitors · today"],["searches24","People searching · today"]]) {
    const card = $(id).closest(".card");
    card.querySelector(".card-label").textContent = label;
    card.tabIndex = 0; card.setAttribute("role", "button"); card.setAttribute("aria-haspopup", "dialog"); card.setAttribute("aria-controls", dialog.id);
    const open = () => { if (!dialog.open) dialog.showModal(); void refresh().catch(() => {}); };
    card.addEventListener("click", open);
    card.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); open(); } });
  }
  function attach() {
    if (attached || !window.BAGVYR_ADMIN_CLIENT) return;
    attached = true;
    window.BAGVYR_ADMIN_CLIENT.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || (owner && owner !== session?.user.id)) reset();
      setTimeout(() => void refresh().catch(() => {}), 0);
    });
    void refresh().catch(() => {});
  }
  window.addEventListener("bagvyr-admin-ready", attach);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) void refresh().catch(() => {}); });
  attach();
})();
