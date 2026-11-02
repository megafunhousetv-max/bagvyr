(() => {
  "use strict";

  let owner = "";
  let version = 0;
  let pending = null;
  let attached = false;

  let days = [];
  let overall = null;
  let activeController = null;

  const $ = id =>
    document.getElementById(id);

  const node = (tag, text) => {
    const element =
      document.createElement(tag);

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  };

  const count = value =>
    value == null
      ? "—"
      : Number(value).toLocaleString("en-US");

  const percent = (returning, total) =>
    returning == null || !total
      ? "—"
      : (
          100 * returning / total
        ).toFixed(2) + "%";

  const dateText = value =>
    value.slice(8, 10) + "." +
    value.slice(5, 7) + "." +
    value.slice(0, 4);

  const validCount = value =>
    Number.isSafeInteger(value) &&
    value >= 0;

  const cards =
    $("overviewSection")?.querySelector(
      ".cards"
    );

  if (!cards) return;

  const style = node("style");

  style.textContent = `
    #overviewSection .card[role="button"] {
      cursor: pointer;
    }

    #overviewSection .card[role="button"]:focus-visible {
      outline: 2px solid #64f2b2;
      outline-offset: 4px;
    }

    #riDailyDialog {
      width: min(940px, calc(100vw - 28px));
      max-height: 85vh;
      overflow: auto;
      padding: 24px;

      border: 1px solid #31543f;
      border-radius: 18px;

      background: #071a12;
      color: #eaf7ed;
    }

    #riDailyDialog::backdrop {
      background: rgba(0, 0, 0, .75);
    }

    #riDailyDialog header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    #riDailyDialog h2 {
      margin: 0;
      font-size: 23px;
    }

    #riDailyDialog button,
    #riReturnDetail button {
      padding: 8px 12px;
      border: 1px solid #31543f;
      border-radius: 8px;

      background: #102c1d;
      color: #eaf7ed;
      cursor: pointer;
    }

    #riDailyDialog p {
      color: #a1baaa;
      font-size: 12px;
    }

    #riDailyDialog .ri-day-scroll {
      overflow: auto;
    }

    #riDailyDialog table {
      width: 100%;
      border-collapse: collapse;
      white-space: nowrap;
    }

    #riDailyDialog th,
    #riDailyDialog td {
      padding: 12px 10px;
      text-align: left;
      border-bottom: 1px solid #234331;
      font-size: 13px;
    }

    #riDailyDialog th {
      color: #a1baaa;
      font-weight: 500;
    }

    #riDailyDialog tbody tr:first-child {
      color: #65f0b4;
    }

    #riDailyDialog .ri-return-percent {
      padding: 5px 10px;
      border-color: #2a6547;
      border-radius: 8px;

      background: #123b29;
      color: #80f3bc;

      font-variant-numeric: tabular-nums;
    }

    #riReturningCard {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;

      margin-top: 24px;
      padding: 24px 26px;

      border: 1px solid #28543d;
      border-radius: 18px;

      background:
        linear-gradient(
          135deg,
          #0c2419,
          #08170f
        );
    }

    #riReturningCard .ri-return-icon {
      display: grid;
      place-items: center;

      flex: 0 0 48px;
      width: 48px;
      height: 48px;

      border: 1px solid #27543d;
      border-radius: 12px;

      color: #7bf0b7;
      background: #102c1d;
    }

    #riReturningCard .ri-return-icon svg {
      width: 29px;
      height: 29px;
    }

    #riReturningCard .ri-return-body {
      flex: 1;
      min-width: 190px;
    }

    #riReturningCard h2 {
      margin: 0 0 6px;
      font-size: 17px;
      color: #eaf7ed;
    }

    #riReturningCard #riReturningPercent {
      display: block;
      padding: 0;
      border: 0;
      background: transparent;

      color: #6cf3b2;
      font: inherit;
      font-size: 42px;
      font-weight: 750;
      line-height: 1.3;
      letter-spacing: -1px;

      text-decoration: underline;
      text-decoration-thickness: 1px;
      text-underline-offset: 5px;
    }

    #riReturningCard #riReturningPercent:disabled {
      opacity: 1;
      cursor: default;
      text-decoration: none;
    }

    #riReturningCard p {
      margin: 8px 0 0;
      color: #99b2a2;
      font-size: 12px;
    }

    #riReturningCard .ri-return-note {
      max-width: 300px;
      font-size: 12px;
      color: #a5bdaf;
    }

    #riReturnDetail {
      position: fixed;
      inset: auto;
      margin: 0;

      width: min(340px, calc(100vw - 28px));
      max-height: 80vh;
      overflow: auto;
      padding: 20px;

      border: 1px solid #69d99e;
      border-radius: 14px;

      background: #0b2418;
      color: #ecfff3;
      box-shadow: 0 15px 45px #0006;
    }

    #riReturnDetail::backdrop {
      background: transparent;
    }

    #riReturnDetail header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;

      padding: 0;
      border: 0;
    }

    #riReturnDetail h3 {
      margin: 0;
      font-size: 15px;
    }

    #riReturnDetail strong {
      display: block;
      margin-top: 12px;
      color: #83efb7;
      font-size: 21px;
      line-height: 1.4;
    }

    #riReturnDetail p {
      margin: 10px 0 0;
      color: #aec5b7;
      font-size: 12px;
    }

    #riDailyDialog button:focus-visible,
    #riReturningCard button:focus-visible,
    #riReturnDetail button:focus-visible {
      outline: 2px solid #6cf3b2;
      outline-offset: 3px;
    }

    @media (max-width: 600px) {
      #riReturningCard {
        padding: 20px 16px;
        gap: 14px;
      }

      #riReturningCard .ri-return-note {
        flex-basis: 100%;
        max-width: none;
      }

      #riDailyDialog {
        padding: 18px 12px;
      }
    }
  `;

  document.head.append(style);

  const returningCard =
    node("section");

  returningCard.id =
    "riReturningCard";

  returningCard.setAttribute(
    "aria-labelledby",
    "riReturningTitle"
  );

  returningCard.innerHTML = `
    <span
      class="ri-return-icon"
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.6"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="9" r="3"/>

        <path d="
          M6 20v-1a6 6 0 0 1 12 0v1
          M3 10a9 9 0 0 1 16-5
          M19 2v3h-3
          M21 14a9 9 0 0 1-16 5
          M5 22v-3h3
        "/>
      </svg>
    </span>

    <div class="ri-return-body">
      <h2 id="riReturningTitle">
        Returning visitors · All time
      </h2>

      <button
        id="riReturningPercent"
        type="button"
        disabled
        aria-haspopup="dialog"
        aria-controls="riReturnDetail"
      >—</button>

      <p>
        Across all recorded history ·
        Click the percentage for the exact count.
      </p>
    </div>

    <div class="ri-return-note">
      Visited on at least 2 different calendar days.
    </div>
  `;

  cards.after(returningCard);

  // Exact count popup.
  const detail = node("dialog");

  detail.id = "riReturnDetail";

  detail.setAttribute(
    "aria-labelledby",
    "riReturnDetailTitle"
  );

  const detailHeader =
    node("header");

  const detailTitle =
    node("h3", "Returning visitors");

  detailTitle.id =
    "riReturnDetailTitle";

  const detailClose =
    node("button", "Close");

  detailClose.type = "button";

  detailClose.onclick =
    () => detail.close();

  detailHeader.append(
    detailTitle,
    detailClose
  );

  const detailCount =
    node("strong");

  const detailNote =
    node("p");

  detail.append(
    detailHeader,
    detailCount,
    detailNote
  );

  document.body.append(detail);

  let detailTrigger = null;

  detail.addEventListener(
    "close",
    () => {
      detailTrigger?.setAttribute(
        "aria-expanded",
        "false"
      );

      detailTrigger = null;
    }
  );

  detail.addEventListener(
    "click",
    event => {
      const rect =
        detail.getBoundingClientRect();

      if (
        event.target === detail &&
        (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
      ) {
        detail.close();
      }
    }
  );

  function showDetail(
    button,
    returning,
    total,
    explanation
  ) {
    if (detail.open) {
      detail.close();
    }

    detailCount.textContent =
      count(returning) +
      " of " +
      count(total) +
      " visitors returned";

    detailNote.textContent =
      explanation;

    detailTrigger = button;

    button.setAttribute(
      "aria-expanded",
      "true"
    );

    detail.style.left = "14px";
    detail.style.top = "14px";

    detail.showModal();

    const anchor =
      button.getBoundingClientRect();

    const rect =
      detail.getBoundingClientRect();

    detail.style.left =
      Math.max(
        14,
        Math.min(
          anchor.left,
          window.innerWidth -
            rect.width -
            14
        )
      ) + "px";

    detail.style.top =
      Math.max(
        14,
        Math.min(
          anchor.bottom + 8,
          window.innerHeight -
            rect.height -
            14
        )
      ) + "px";
  }

  function returningButton(
    returning,
    total,
    explanation
  ) {
    const button = node(
      "button",
      percent(returning, total)
    );

    button.type = "button";

    button.className =
      "ri-return-percent";

    button.disabled =
      returning == null || !total;

    button.setAttribute(
      "aria-haspopup",
      "dialog"
    );

    button.setAttribute(
      "aria-controls",
      detail.id
    );

    button.setAttribute(
      "aria-expanded",
      "false"
    );

    button.setAttribute(
      "aria-label",

      "Returning visitors: " +
      percent(returning, total) +
      ". Show exact count."
    );

    button.onclick = () =>
      showDetail(
        button,
        returning,
        total,
        explanation
      );

    return button;
  }

  $("riReturningPercent").onclick = () => {
    if (overall?.visitors) {
      showDetail(
        $("riReturningPercent"),

        overall.returning_visitors,
        overall.visitors,

        "Visited on at least 2 different calendar days across all recorded history. Unique browsers, not verified people."
      );
    }
  };

  // Existing daily history dialog.
  const dialog =
    node("dialog");

  dialog.id =
    "riDailyDialog";

  const header =
    node("header");

  const title = node(
    "h2",
    "Daily activity · last 14 days"
  );

  title.id =
    "riDailyTitle";

  dialog.setAttribute(
    "aria-labelledby",
    title.id
  );

  const close =
    node("button", "Close");

  close.type = "button";

  close.onclick =
    () => dialog.close();

  header.append(
    title,
    close
  );

  const note = node(
    "p",

    "Unique browsers per calendar day. " +
    "Time zone: Europe/Bratislava. " +
    "Returning = visited on an earlier calendar day. " +
    "— = no saved history or no visitors."
  );

  const scroll =
    node("div");

  scroll.className =
    "ri-day-scroll";

  const table =
    node("table");

  const thead =
    node("thead");

  const headingRow =
    node("tr");

  for (const text of [
    "Date",
    "Visitors",
    "Returning",
    "People searching",
    "Analyses"
  ]) {
    const th =
      node("th", text);

    th.scope = "col";

    headingRow.append(th);
  }

  thead.append(headingRow);

  const tbody =
    node("tbody");

  table.append(
    thead,
    tbody
  );

  scroll.append(table);

  const status = node(
    "p",
    "Loading history…"
  );

  status.setAttribute(
    "role",
    "status"
  );

  dialog.append(
    header,
    note,
    scroll,
    status
  );

  document.body.append(dialog);

  function render() {
    if (detail.open) {
      detail.close();
    }

    const today = days[0];

    $("visitors24").textContent =
      today
        ? count(today.visitors)
        : "—";

    $("searches24").textContent =
      today
        ? count(today.searchers)
        : "—";

    $("uniqueTokens").textContent =
      today &&
      today.searches !== null
        ? count(today.searches) +
          " token searches today"
        : "Unique browsers searching today";

    $("riReturningPercent").textContent =
      overall
        ? percent(
            overall.returning_visitors,
            overall.visitors
          )
        : "—";

    $("riReturningPercent").disabled =
      !overall?.visitors;

    tbody.replaceChildren();

    for (const day of days) {
      const row =
        node("tr");

      const date =
        dateText(day.day);

      row.append(
        node("td", date),
        node(
          "td",
          count(day.visitors)
        )
      );

      const returning =
        node("td");

      returning.append(
        returningButton(
          day.returning_visitors,
          day.visitors,

          date +
          ": visited that day and on at least one earlier calendar day."
        )
      );

      row.append(
        returning,

        node(
          "td",
          count(day.searchers)
        ),

        node(
          "td",
          count(day.searches)
        )
      );

      tbody.append(row);
    }
  }

  function reset(next = "") {
    owner = next;
    version++;

    activeController?.abort();
    activeController = null;

    days = [];
    overall = null;
    pending = null;

    render();

    status.textContent =
      "Loading history…";

    if (dialog.open) {
      dialog.close();
    }
  }

  async function refresh() {
    const client =
      window.BAGVYR_ADMIN_CLIENT;

    const config =
      window.BAGVYR_SUPABASE;

    if (!client || !config) return;

    const initial = version;

    const auth =
      await client.auth.getSession();

    if (initial !== version) return;

    const session =
      auth.data?.session;

    if (auth.error || !session) {
      if (owner) reset();
      return;
    }

    if (
      owner !== session.user.id
    ) {
      reset(session.user.id);
    }

    if (pending) return pending;

    const current = version;

    const job = Promise.resolve().then(
      async () => {
        if (current !== version) return;

        const controller =
          new AbortController();

        activeController = controller;

        const timer = setTimeout(
          () => controller.abort(),
          12000
        );

        try {
          const response = await fetch(
            config.url.replace(/\/+$/, "") +
              "/rest/v1/rpc/ri_admin_daily_stats",
            {
              method: "POST",

              headers: {
                apikey:
                  config.publishableKey,

                Authorization:
                  "Bearer " +
                  session.access_token,

                "Content-Type":
                  "application/json"
              },

              body: "{}",

              signal:
                controller.signal,

              cache: "no-store"
            }
          );

          if (current !== version) {
            return;
          }

          if (
            response.status === 401 ||
            response.status === 403
          ) {
            reset();

            status.textContent =
              "Admin access required.";

            return;
          }

          if (!response.ok) {
            throw new Error(
              "Daily history unavailable."
            );
          }

          const data =
            await response.json();

          if (current !== version) {
            return;
          }

          if (
            !Array.isArray(data.days) ||
            data.days.length !== 14 ||
            new Set(
              data.days.map(
                day => day?.day
              )
            ).size !== 14 ||
            data.days.some(day =>
              !day ||
              !/^\d{4}-\d{2}-\d{2}$/.test(
                day.day
              ) ||
              [
                day.visitors,
                day.searchers,
                day.searches
              ].some(value =>
                value !== null &&
                !validCount(value)
              ) ||
              (
                day.visitors === null
                  ? day.returning_visitors !== null
                  : !validCount(
                      day.returning_visitors
                    ) ||
                    day.returning_visitors >
                      day.visitors
              )
            )
          ) {
            throw new Error(
              "Invalid daily history."
            );
          }

          const total =
            data.returning_all_time;

          if (
            !total ||
            !validCount(total.visitors) ||
            !validCount(
              total.returning_visitors
            ) ||
            total.returning_visitors >
              total.visitors
          ) {
            throw new Error(
              "Invalid returning visitor summary."
            );
          }

          days = data.days;
          overall = total;

          render();

          status.textContent =
            "Updated: " +
            new Date(
              data.updated_at
            ).toLocaleString(
              "en-GB",
              {
                timeZone:
                  "Europe/Bratislava"
              }
            );

        } catch (error) {
          if (current === version) {
            status.textContent =
              (
                days.length
                  ? "Showing the last successful load. "
                  : ""
              ) +
              (
                error?.message ||
                "Daily history unavailable."
              );
          }

        } finally {
          clearTimeout(timer);

          if (
            activeController ===
            controller
          ) {
            activeController = null;
          }

          if (pending === job) {
            pending = null;
          }
        }
      }
    );

    pending = job;

    return job;
  }

  window.RI_DAILY_STATS = {
    refresh: () =>
      refresh().catch(() => {})
  };

  for (const [id, label] of [
    [
      "visitors24",
      "Visitors · today"
    ],

    [
      "searches24",
      "People searching · today"
    ]
  ]) {
    const card =
      $(id).closest(".card");

    card.querySelector(
      ".card-label"
    ).textContent = label;

    card.tabIndex = 0;

    card.setAttribute(
      "role",
      "button"
    );

    card.setAttribute(
      "aria-haspopup",
      "dialog"
    );

    card.setAttribute(
      "aria-controls",
      dialog.id
    );

    const open = () => {
      if (!dialog.open) {
        dialog.showModal();
      }

      void refresh().catch(
        () => {}
      );
    };

    card.addEventListener(
      "click",
      open
    );

    card.addEventListener(
      "keydown",
      event => {
        if (
          event.key === "Enter" ||
          event.key === " "
        ) {
          event.preventDefault();
          open();
        }
      }
    );
  }

  function attach() {
    if (
      attached ||
      !window.BAGVYR_ADMIN_CLIENT
    ) {
      return;
    }

    attached = true;

    window.BAGVYR_ADMIN_CLIENT.auth
      .onAuthStateChange(
        (event, session) => {
          if (
            event === "SIGNED_OUT" ||
            (
              owner &&
              owner !== session?.user.id
            )
          ) {
            reset();
          }

          setTimeout(() => {
            void refresh().catch(
              () => {}
            );
          }, 0);
        }
      );

    void refresh().catch(
      () => {}
    );
  }

  window.addEventListener(
    "bagvyr-admin-ready",
    attach
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        void refresh().catch(
          () => {}
        );
      }
    }
  );

  attach();
})();