(() => {
  "use strict";

  const root =
    document.getElementById(
      "telegramSection"
    );

  if (!root) return;

  const API =
    "https://bagvyr-api.megafunhousetv.workers.dev/api/admin/telegram";

  root.innerHTML = `
    <style>
      #telegramSection {
        color: #eaf7ed;
      }

      #telegramSection * {
        box-sizing: border-box;
      }

      #telegramSection .tg-stats {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 18px;
        margin-bottom: 22px;
      }

      #telegramSection .tg-card {
        background: #091b13;
        border: 1px solid #244c36;
        border-radius: 18px;
        padding: 24px;
        min-width: 0;
      }

      #telegramSection .tg-stats strong {
        display: block;
        color: #64f2b2;
        font-size: 30px;
        margin-top: 12px;
        overflow-wrap: anywhere;
      }

      #telegramSection .tg-stats strong.tg-bot {
        font-size: 23px;
      }

      #telegramSection .tg-columns {
        display: grid;
        grid-template-columns: 1.3fr 1fr;
        gap: 22px;
      }

      #telegramSection h2 {
        font-size: 23px;
        margin: 0 0 20px;
      }

      #telegramSection p,
      #telegramSection small {
        color: #9fb5a8;
        line-height: 1.6;
      }

      #telegramSection button,
      #telegramSection input[type=search],
      #telegramSection textarea {
        font: inherit;
        color: inherit;
        background: #10291c;
        border: 1px solid #31543f;
        border-radius: 10px;
        padding: 11px 13px;
      }

      #telegramSection button {
        cursor: pointer;
      }

      #telegramSection button:disabled {
        opacity: .45;
        cursor: default;
      }

      #telegramSection :focus-visible {
        outline: 2px solid #64f2b2;
        outline-offset: 3px;
      }

      #telegramSection .tg-search,
      #telegramSection textarea {
        width: 100%;
      }

      #telegramSection textarea {
        resize: vertical;
        min-height: 165px;
        margin-top: 9px;
        line-height: 1.6;
      }

      #telegramSection .tg-radios {
        display: flex;
        flex-wrap: wrap;
        gap: 15px;
        margin: 18px 0 24px;
      }

      #telegramSection input[type=checkbox],
      #telegramSection input[type=radio] {
        accent-color: #64f2b2;
        width: 17px;
        height: 17px;
        vertical-align: middle;
        cursor: pointer;
      }

      #telegramSection .tg-scroll {
        overflow-x: auto;
        margin-top: 16px;
      }

      #telegramSection table {
        border-collapse: collapse;
        width: 100%;
        white-space: nowrap;
        font-size: 13px;
      }

      #telegramSection th,
      #telegramSection td {
        padding: 15px 9px;
        border-bottom: 1px solid #24422f;
        text-align: left;
      }

      #telegramSection th {
        color: #9fb5a8;
        font-weight: 500;
      }

      #telegramSection td strong,
      #telegramSection td small {
        display: block;
      }

      #telegramSection .tg-footer {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-wrap: wrap;
        margin-top: 18px;
      }

      #telegramSection .tg-page {
        margin-left: auto;
      }

      #telegramSection .tg-preview {
        padding: 18px;
        border: 1px solid #244c36;
        border-radius: 12px;
        margin: 18px 0;
        background: #10291c;
      }

      #telegramSection .tg-preview-text {
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        margin: 10px 0 0;
      }

      #telegramSection .tg-send {
        width: 100%;
        background: #64f2b2;
        color: #052014;
        border: 0;
        font-weight: 750;
        margin-top: 14px;
      }

      #telegramSection .tg-history {
        margin-top: 22px;
      }

      #telegramSection .tg-campaign {
        border-top: 1px solid #24422f;
        padding: 16px 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 15px;
      }

      #telegramSection .tg-campaign p {
        margin: 4px 0;
        font-size: 13px;
        overflow-wrap: anywhere;
      }

      #telegramSection .tg-status {
        white-space: pre-wrap;
        margin-top: 16px;
      }

      @media (max-width: 1050px) {
        #telegramSection .tg-columns {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 650px) {
        #telegramSection .tg-stats {
          grid-template-columns: 1fr;
        }

        #telegramSection .tg-card {
          padding: 18px;
        }
      }
    </style>

    <div class="tg-stats">
      <div class="tg-card">
        Total users
        <strong data-total>—</strong>
      </div>

      <div class="tg-card">
        Selected users
        <strong data-selected>0</strong>
      </div>

      <div class="tg-card">
        Bot

        <strong class="tg-bot">
          @RugInspect_Bot
        </strong>
      </div>
    </div>

    <div class="tg-columns">
      <div class="tg-card">
        <h2>Bot users</h2>

        <input
          class="tg-search"
          type="search"
          placeholder="Search name, username or ID"
          aria-label="Search users"
        >

        <div class="tg-scroll">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    data-check-page
                    aria-label="Select this page"
                  >
                </th>

                <th>User</th>
                <th>Telegram ID</th>
                <th>Last active</th>
              </tr>
            </thead>

            <tbody></tbody>
          </table>
        </div>

        <div class="tg-footer">
          <span data-selection>
            0 selected
          </span>

          <button
            type="button"
            data-clear
          >Clear</button>

          <span
            class="tg-page"
            data-page
          ></span>

          <button
            type="button"
            data-prev
            aria-label="Previous page"
          >‹</button>

          <button
            type="button"
            data-next
            aria-label="Next page"
          >›</button>
        </div>

        <p>
          <small>
            Names appear after the user contacts
            the bot again. Unavailable accounts
            are excluded from sending.
          </small>
        </p>

        <button
          type="button"
          data-reload
        >Refresh users</button>
      </div>

      <div class="tg-card">
        <h2>Send message</h2>

        <p>From @RugInspect_Bot</p>

        <div class="tg-radios">
          <label>
            <input
              type="radio"
              name="tg-audience"
              value="all"
            >

            All reachable users
            (<span data-reachable>0</span>)
          </label>

          <label>
            <input
              type="radio"
              name="tg-audience"
              value="selected"
              checked
            >

            Selected users
            (<span data-selected-label>0</span>)
          </label>
        </div>

        <label>
          Message

          <textarea
            maxlength="4096"
            placeholder="Write your message…"
          ></textarea>
        </label>

        <small data-length>
          0 / 4096
        </small>

        <div class="tg-preview">
          <small>
            Message preview · @RugInspect_Bot
          </small>

          <p class="tg-preview-text"></p>
        </div>

        <div data-recipients>
          Recipients: 0
        </div>

        <button
          type="button"
          class="tg-send"
          data-send
          disabled
        >Send message</button>

        <p
          class="tg-status"
          data-status
          role="status"
          aria-live="polite"
        ></p>
      </div>
    </div>

    <div class="tg-card tg-history">
      <h2>Delivery history</h2>

      <p>
        Sending runs while this page is open.
        Use Continue after a refresh or interruption.
      </p>

      <div data-history></div>
    </div>
  `;

  const $ = selector =>
    root.querySelector(selector);

  const text = (selector, value) => {
    $(selector).textContent = value;
  };

  let client;
  let owner = "";
  let generation = 0;

  let users = [];
  let selected = new Set();
  let page = 1;

  let running = false;
  let loading = false;
  let operation = null;
  let runVersion = 0;

  const controllers = new Set();

  const input = $("textarea");
  const send = $("[data-send]");

  const date = value =>
    new Date(value).toLocaleString(
      "en-GB",
      {
        timeZone: "Europe/Bratislava"
      }
    );

  const audience = () =>
    $(
      'input[name="tg-audience"]:checked'
    ).value;

  const visible = () =>
    users.filter(user =>
      [
        user.name,
        user.username,
        user.id
      ].some(value =>
        String(value || "")
          .toLowerCase()
          .includes(
            $(".tg-search")
              .value
              .toLowerCase()
          )
      )
    );

  const reachable = () =>
    users.filter(user => !user.blocked);

  const recipients = () =>
    audience() === "all"
      ? reachable().length
      : selected.size;

  const element = (tag, value) => {
    const item =
      document.createElement(tag);

    if (value !== undefined) {
      item.textContent = value;
    }

    return item;
  };


  async function api(path, body = {}) {
    const current = generation;

    const auth =
      await client.auth.getSession();

    const session =
      auth.data?.session;

    if (
      current !== generation ||
      !session ||
      session.user.id !== owner
    ) {
      throw new Error("Sign in again.");
    }

    const controller =
      new AbortController();

    controllers.add(controller);

    const timer = setTimeout(
      () => controller.abort(),
      30000
    );

    try {
      const response = await fetch(
        API + path,
        {
          method: "POST",

          headers: {
            Authorization:
              "Bearer " +
              session.access_token,

            "Content-Type":
              "application/json"
          },

          body: JSON.stringify(body),

          signal: controller.signal
        }
      );

      const data =
        await response.json();

      if (current !== generation) {
        throw new Error(
          "Session changed."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || "Request failed."
        );
      }

      return data;

    } finally {
      clearTimeout(timer);
      controllers.delete(controller);
    }
  }


  function counts() {
    text(
      "[data-selected]",
      selected.size
    );

    text(
      "[data-selected-label]",
      selected.size
    );

    text(
      "[data-selection]",
      selected.size + " selected"
    );

    text(
      "[data-recipients]",
      "Recipients: " + recipients()
    );

    text(
      "[data-length]",
      input.value.length + " / 4096"
    );

    text(
      ".tg-preview-text",
      input.value ||
        "Your message will appear here."
    );

    send.disabled =
      running ||
      loading ||
      !input.value.trim() ||
      !recipients() ||
      !owner;

    send.textContent =
      "Send to " +
      recipients() +
      " users";

    input.disabled =
      running || !!operation;

    root.querySelectorAll(
      'input[name="tg-audience"]'
    ).forEach(item => {
      item.disabled =
        running || !!operation;
    });

    $(".tg-search").disabled =
      running || !!operation;

    $("[data-check-page]").disabled =
      running || !!operation;

    $("[data-clear]").disabled =
      running || !!operation;
  }


  function draw() {
    const filtered = visible();

    const pages = Math.max(
      1,
      Math.ceil(filtered.length / 10)
    );

    page = Math.min(page, pages);

    const rows = filtered.slice(
      (page - 1) * 10,
      page * 10
    );

    const tbody = $("tbody");
    tbody.replaceChildren();

    for (const user of rows) {
      const row = element("tr");
      const cell = element("td");
      const checkbox = element("input");

      checkbox.type = "checkbox";

      checkbox.checked =
        selected.has(user.id);

      checkbox.disabled =
        user.blocked ||
        running ||
        !!operation;

      checkbox.setAttribute(
        "aria-label",
        "Select " + (
          user.name || user.id
        )
      );

      checkbox.onchange = () => {
        if (checkbox.checked) {
          selected.add(user.id);
        } else {
          selected.delete(user.id);
        }

        draw();
      };

      cell.append(checkbox);

      const person = element("td");

      person.append(
        element(
          "strong",
          user.name || "Telegram user"
        ),

        element(
          "small",

          user.username
            ? "@" + user.username
            : user.blocked
              ? "Unavailable"
              : "Name unavailable"
        )
      );

      row.append(
        cell,
        person,
        element("td", user.id),
        element(
          "td",
          date(user.last_used_at)
        )
      );

      tbody.append(row);
    }

    if (!rows.length) {
      const row = element("tr");

      const cell = element(
        "td",
        "No users found."
      );

      cell.colSpan = 4;

      row.append(cell);
      tbody.append(row);
    }

    const eligible =
      rows.filter(user => !user.blocked);

    const checked =
      eligible.filter(user =>
        selected.has(user.id)
      ).length;

    $("[data-check-page]").checked =
      eligible.length > 0 &&
      checked === eligible.length;

    $("[data-check-page]").indeterminate =
      checked > 0 &&
      checked < eligible.length;

    text(
      "[data-page]",
      `Page ${page} of ${pages}`
    );

    $("[data-prev]").disabled =
      page === 1;

    $("[data-next]").disabled =
      page === pages;

    counts();
  }


  async function history() {
    const current = generation;

    const { campaigns } =
      await api("/campaigns");

    if (current !== generation) {
      return [];
    }

    const target =
      $("[data-history]");

    target.replaceChildren();

    for (const campaign of campaigns) {
      const row = element("div");

      row.className = "tg-campaign";

      const info = element("div");

      info.append(
        element(
          "strong",
          date(campaign.created_at)
        ),

        element(
          "p",
          campaign.preview
        ),

        element(
          "p",

          `Sent: ${campaign.sent} · ` +
          `Failed: ${campaign.failed} · ` +
          `Unconfirmed: ${campaign.unknown} · ` +
          "Remaining: " +
          (
            Number(campaign.pending) +
            Number(campaign.sending)
          ) +
          ` / ${campaign.total}`
        )
      );

      row.append(info);

      if (
        Number(campaign.pending) +
        Number(campaign.sending) > 0
      ) {
        const button = element(
          "button",
          "Continue"
        );

        button.type = "button";

        button.disabled =
          running || !!operation;

        button.onclick = () =>
          run(campaign.id);

        row.append(button);
      }

      target.append(row);
    }

    if (!campaigns.length) {
      target.append(
        element(
          "p",
          "No messages sent yet."
        )
      );
    }

    return campaigns;
  }


  async function load() {
    if (
      !owner ||
      root.hidden ||
      loading
    ) {
      return;
    }

    loading = true;
    counts();

    const current = generation;

    try {
      const result =
        await api("/users");

      if (current !== generation) {
        return;
      }

      if (!Array.isArray(result.users)) {
        throw new Error(
          "Invalid user list."
        );
      }

      users = result.users;

      selected = new Set(
        [...selected].filter(id =>
          users.some(user =>
            user.id === id &&
            !user.blocked
          )
        )
      );

      text(
        "[data-total]",
        users.length
      );

      text(
        "[data-reachable]",
        reachable().length
      );

      draw();

      await history();

    } catch (error) {
      if (current === generation) {
        text(
          "[data-status]",
          error.message
        );
      }

    } finally {
      if (current === generation) {
        loading = false;
        counts();
      }
    }
  }


  async function run(id) {
    if (running) return;

    const current = generation;
    const version = ++runVersion;

    running = true;
    draw();

    try {
      while (
        current === generation &&
        version === runVersion &&
        !root.hidden
      ) {
        await api("/next", { id });

        const campaigns =
          await history();

        if (
          current !== generation ||
          version !== runVersion
        ) {
          return;
        }

        const campaign =
          campaigns.find(item =>
            item.id === id
          );

        if (!campaign) {
          throw new Error(
            "Campaign unavailable."
          );
        }

        text(
          "[data-status]",

          `Sent ${campaign.sent} ` +
          `of ${campaign.total}. ` +
          `Failed: ${campaign.failed}. ` +
          `Unconfirmed: ${campaign.unknown}.`
        );

        if (
          Number(campaign.pending) +
          Number(campaign.sending) === 0
        ) {
          break;
        }

        await new Promise(resolve =>
          setTimeout(resolve, 1000)
        );
      }

    } catch (error) {
      if (current === generation) {
        text(
          "[data-status]",

          error.message +
          " Use Continue in delivery history; " +
          "do not create a duplicate message."
        );
      }

    } finally {
      if (current === generation) {
        running = false;
        draw();

        history().catch(() => {});
      }
    }
  }


  send.onclick = async () => {
    if (send.disabled || running) {
      return;
    }

    const current = generation;

    operation ||= {
      id: crypto.randomUUID(),
      text: input.value,
      all: audience() === "all",
      ids: [...selected]
    };

    running = true;
    draw();

    try {
      const result = await api(
        "/create",
        operation
      );

      if (current !== generation) {
        return;
      }

      operation = null;
      running = false;

      await run(result.id);

    } catch (error) {
      if (current === generation) {
        running = false;
        draw();

        text(
          "[data-status]",

          error.message +
          " Click Send to retry " +
          "the same request."
        );
      }
    }
  };


  input.oninput = counts;

  root.querySelectorAll(
    'input[name="tg-audience"]'
  ).forEach(item => {
    item.onchange = counts;
  });

  $(".tg-search").oninput = () => {
    page = 1;
    draw();
  };

  $("[data-clear]").onclick = () => {
    selected.clear();
    draw();
  };

  $("[data-prev]").onclick = () => {
    page--;
    draw();
  };

  $("[data-next]").onclick = () => {
    page++;
    draw();
  };

  $("[data-reload]").onclick =
    () => load();

  $("[data-check-page]").onchange =
    event => {
      const rows = visible().slice(
        (page - 1) * 10,
        page * 10
      ).filter(user => !user.blocked);

      for (const user of rows) {
        if (event.target.checked) {
          selected.add(user.id);
        } else {
          selected.delete(user.id);
        }
      }

      draw();
    };


  async function sessionChanged() {
    const result =
      await client.auth.getSession();

    const id =
      result.data?.session?.user?.id || "";

    if (id === owner) return;

    generation++;
    runVersion++;

    controllers.forEach(controller =>
      controller.abort()
    );

    controllers.clear();

    owner = id;
    running = false;
    loading = false;
    operation = null;

    users = [];
    selected.clear();
    page = 1;

    input.value = "";

    text("[data-total]", "—");
    text("[data-reachable]", 0);
    text("[data-status]", "");

    $("[data-history]").replaceChildren();

    draw();

    if (owner) load();
  }


  function init() {
    if (
      client ||
      !window.BAGVYR_ADMIN_CLIENT
    ) {
      return;
    }

    client =
      window.BAGVYR_ADMIN_CLIENT;

    client.auth.onAuthStateChange(() =>
      setTimeout(() => {
        sessionChanged().catch(() => {});
      }, 0)
    );

    const dashboard =
      document.getElementById(
        "dashboard"
      );

    if (dashboard) {
      new MutationObserver(() => {
        if (!dashboard.hidden) return;

        generation++;
        runVersion++;

        controllers.forEach(controller =>
          controller.abort()
        );

        owner = "";
        users = [];
        selected.clear();

        operation = null;
        running = false;
        loading = false;

        input.value = "";

        $("[data-history]")
          .replaceChildren();

        text("[data-total]", "—");
        text("[data-status]", "");

        draw();

      }).observe(dashboard, {
        attributes: true,

        attributeFilter: [
          "hidden"
        ]
      });
    }

    sessionChanged().catch(() => {
      text(
        "[data-status]",
        "Sign in again."
      );
    });
  }


  document.addEventListener(
    "bagvyr:admin-section",
    event => {
      if (
        event.detail?.section ===
        "telegram"
      ) {
        runVersion++;

        sessionChanged()
          .then(load)
          .catch(() => {});

      } else if (running) {
        runVersion++;
      }
    }
  );

  window.addEventListener(
    "bagvyr-admin-ready",
    init
  );

  init();
  draw();
})();