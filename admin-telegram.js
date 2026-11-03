(() => {
  "use strict";

  const card = document
    .getElementById("telegramUsersTotal")
    ?.closest(".card");

  if (!card) return;

  const node = (tag, text) => {
    const element = document.createElement(tag);

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  };

  const style = node("style");

  style.textContent = `
    #overviewSection .ri-telegram-history-card {
      cursor: pointer;
    }

    #overviewSection .ri-telegram-history-card:focus-visible {
      outline: 2px solid #64f2b2;
      outline-offset: 4px;
    }

    #riTelegramDialog {
      width: min(680px, calc(100vw - 28px));
      max-height: 85vh;
      padding: 24px;
      overflow: auto;
      border: 1px solid #31543f;
      border-radius: 18px;
      background: #071a12;
      color: #eaf7ed;
    }

    #riTelegramDialog::backdrop {
      background: rgba(0, 0, 0, .75);
    }

    #riTelegramDialog .ri-tg-heading {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 18px;
    }

    #riTelegramDialog h2 {
      margin: 0;
      font-size: 23px;
      line-height: 1.3;
    }

    #riTelegramDialog button {
      padding: 8px 12px;
      border: 1px solid #31543f;
      border-radius: 8px;
      background: #102c1d;
      color: #eaf7ed;
      font: inherit;
      cursor: pointer;
    }

    #riTelegramDialog button:focus-visible {
      outline: 2px solid #64f2b2;
      outline-offset: 3px;
    }

    #riTelegramDialog p {
      margin: 12px 0;
      color: #a1baaa;
      font-size: 12px;
      line-height: 1.65;
    }

    #riTelegramDialog .ri-tg-scroll {
      overflow-x: auto;
    }

    #riTelegramDialog table {
      width: 100%;
      border-collapse: collapse;
      white-space: nowrap;
    }

    #riTelegramDialog th,
    #riTelegramDialog td {
      padding: 12px 10px;
      border-bottom: 1px solid #234331;
      text-align: left;
      font-size: 13px;
      font-variant-numeric: tabular-nums;
    }

    #riTelegramDialog th {
      color: #a1baaa;
      font-weight: 500;
    }

    #riTelegramDialog tbody tr:first-child {
      color: #65f0b4;
    }

    @media (max-width: 480px) {
      #riTelegramDialog {
        padding: 18px 14px;
      }

      #riTelegramDialog h2 {
        font-size: 19px;
      }
    }
  `;

  document.head.append(style);

  const dialog = node("dialog");
  dialog.id = "riTelegramDialog";

  const heading = node("div");
  heading.className = "ri-tg-heading";

  const title = node(
    "h2",
    "Telegram activity · last 14 days"
  );

  title.id = "riTelegramDialogTitle";

  dialog.setAttribute(
    "aria-labelledby",
    title.id
  );

  const close = node("button", "Close");
  close.type = "button";
  close.addEventListener("click", () => dialog.close());

  heading.append(title, close);

  const note = node(
    "p",
    "Users who received a successful analysis per calendar day. " +
    "Repeated requests count as separate analyses. " +
    "Time zone: Europe/Bratislava. — = no recorded history."
  );

  const scroll = node("div");
  scroll.className = "ri-tg-scroll";

  const table = node("table");
  const thead = node("thead");
  const headerRow = node("tr");

  for (const text of ["Date", "Users", "Analyses"]) {
    const cell = node("th", text);
    cell.scope = "col";
    headerRow.append(cell);
  }

  thead.append(headerRow);

  const tbody = node("tbody");
  table.append(thead, tbody);
  scroll.append(table);

  const status = node("p", "Open to load history.");
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");

  dialog.append(heading, note, scroll, status);
  document.body.append(dialog);

  let attached = false;
  let owner = "";
  let version = 0;
  let controller = null;

  const count = value =>
    value === null
      ? "—"
      : value.toLocaleString("en-US");

  const dateTime = value =>
    new Date(value).toLocaleString("en-GB", {
      timeZone: "Europe/Bratislava"
    });

  function reset() {
    version++;

    controller?.abort();
    controller = null;

    owner = "";
    tbody.replaceChildren();

    status.textContent = "Open to load history.";

    if (dialog.open) dialog.close();
  }

  async function load() {
    const client = window.BAGVYR_ADMIN_CLIENT;

    if (!client || !dialog.open) return;

    controller?.abort();

    const current = ++version;
    const requestController = new AbortController();

    controller = requestController;

    const timer = setTimeout(
      () => requestController.abort(),
      12000
    );

    tbody.replaceChildren();
    status.textContent = "Loading Telegram history…";

    try {
      const auth = await client.auth.getSession();

      if (current !== version) return;

      const session = auth.data?.session;

      if (auth.error || !session) {
        reset();
        return;
      }

      owner = session.user.id;

      const { data, error } = await client
        .rpc("ri_admin_telegram_daily_stats")
        .abortSignal(requestController.signal);

      if (current !== version) return;

      if (error) throw error;

      const validCount = value =>
        value === null ||
        (
          Number.isSafeInteger(value) &&
          value >= 0
        );

      if (
        !data ||
        !Array.isArray(data.days) ||
        data.days.length !== 14 ||
        new Set(data.days.map(day => day?.day)).size !== 14 ||
        !Number.isFinite(Date.parse(data.updated_at)) ||
        !Number.isFinite(Date.parse(data.tracking_started_at)) ||
        data.days.some(day =>
          !day ||
          !/^\d{4}-\d{2}-\d{2}$/.test(day.day) ||
          !validCount(day.users) ||
          !validCount(day.analyses) ||
          ((day.users === null) !== (day.analyses === null)) ||
          (
            day.users !== null &&
            day.users > day.analyses
          )
        )
      ) {
        throw new Error("Invalid Telegram history.");
      }

      const fragment = document.createDocumentFragment();

      for (const day of [...data.days].sort(
        (a, b) => b.day.localeCompare(a.day)
      )) {
        const row = node("tr");

        const date =
          day.day.slice(8, 10) + "." +
          day.day.slice(5, 7) + "." +
          day.day.slice(0, 4);

        row.append(
          node("td", date),
          node("td", count(day.users)),
          node("td", count(day.analyses))
        );

        fragment.append(row);
      }

      tbody.replaceChildren(fragment);

      status.textContent =
        "Updated: " + dateTime(data.updated_at) +
        " · Tracking started: " +
        dateTime(data.tracking_started_at) +
        ". The first tracking day may be partial.";

    } catch (error) {
      if (current !== version) return;

      tbody.replaceChildren();

      status.textContent =
        requestController.signal.aborted
          ? "Request timed out. Close and reopen to try again."
          : (
              error?.code === "42501" ||
              String(error?.code) === "401" ||
              String(error?.code) === "403"
            )
            ? "Admin access required. Please sign in again."
            : "Telegram history could not be loaded. Close and reopen to try again.";

    } finally {
      clearTimeout(timer);

      if (controller === requestController) {
        controller = null;
      }
    }
  }

  function open() {
    if (!dialog.open) dialog.showModal();

    void load();
  }

  card.classList.add("ri-telegram-history-card");
  card.tabIndex = 0;

  card.setAttribute("role", "button");
  card.setAttribute("aria-haspopup", "dialog");
  card.setAttribute("aria-controls", dialog.id);

  card.addEventListener("click", open);

  card.addEventListener("keydown", event => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  });

  dialog.addEventListener("close", () => {
    version++;
    controller?.abort();
    controller = null;
  });

  function attach() {
    const client = window.BAGVYR_ADMIN_CLIENT;

    if (attached || !client) return;

    attached = true;

    client.auth.onAuthStateChange((event, session) => {
      if (
        event === "SIGNED_OUT" ||
        (owner && owner !== session?.user.id)
      ) {
        reset();
      }
    });

    const dashboard = document.getElementById("dashboard");

    if (dashboard) {
      new MutationObserver(() => {
        if (dashboard.hidden) reset();
      }).observe(dashboard, {
        attributes: true,
        attributeFilter: ["hidden"]
      });
    }
  }

  window.addEventListener("bagvyr-admin-ready", attach);
  attach();
})();