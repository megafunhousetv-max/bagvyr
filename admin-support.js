(() => {
  "use strict";

  const section =
    document.getElementById("supportSection");

  const root =
    document.getElementById("riAdminSupport");

  if (!section || !root || root.dataset.ready) {
    return;
  }

  root.dataset.ready = "1";

  root.innerHTML = `
    <style>
      #riAdminSupport {
        color:#e5f5ec;
        min-width:0;
      }

      #riAdminSupport [hidden] {
        display:none!important;
      }

      #riAdminSupport .rs-toolbar {
        display:flex;
        align-items:center;
        justify-content:space-between;
        flex-wrap:wrap;
        gap:14px;
        margin:0 0 20px;
      }

      #riAdminSupport h2 {
        margin:0 0 5px;
        font-size:24px;
      }

      #riAdminSupport .rs-muted {
        color:#94ad9f;
        font-size:12px;
      }

      #riAdminSupport .rs-actions {
        display:flex;
        align-items:center;
        flex-wrap:wrap;
        gap:9px;
      }

      #riAdminSupport button,
      #riAdminSupport select {
        font:inherit;
        color:#d9f7e8;
        background:#0c2117;
        border:1px solid #31533f;
        border-radius:9px;
        padding:10px 13px;
        min-height:42px;
        cursor:pointer;
      }

      #riAdminSupport button:disabled,
      #riAdminSupport select:disabled {
        opacity:.5;
        cursor:default;
      }

      #riAdminSupport .rs-layout {
        display:grid;
        grid-template-columns:
          minmax(260px,.85fr)
          minmax(0,1.3fr);
        gap:18px;
        align-items:start;
      }

      #riAdminSupport .rs-list {
        display:grid;
        gap:10px;
      }

      #riAdminSupport .rs-ticket {
        display:block;
        width:100%;
        text-align:left;
        padding:16px;
        background:#081b12;
        overflow-wrap:anywhere;
      }

      #riAdminSupport
      .rs-ticket[aria-pressed="true"] {
        border-color:#2eeeb0;
        background:#103324;
      }

      #riAdminSupport .rs-ticket strong {
        display:block;
        margin:6px 0;
      }

      #riAdminSupport .rs-ticket small {
        display:block;
        color:#94ad9f;
        font-size:11px;
      }

      #riAdminSupport .rs-badge {
        display:inline-block;
        border:1px solid #345540;
        border-radius:6px;
        padding:3px 7px;
        font-size:10px;
        color:#ade3c8;
      }

      #riAdminSupport
      .rs-badge[data-status="new"] {
        color:#39efb4;
        border-color:#287e5c;
      }

      #riAdminSupport .rs-detail {
        padding:22px;
        border:1px solid #294b38;
        border-radius:14px;
        background:#081a12;
        min-width:0;
      }

      #riAdminSupport .rs-field {
        margin:18px 0;
        overflow-wrap:anywhere;
      }

      #riAdminSupport .rs-field > small {
        display:block;
        color:#94ad9f;
        font-size:11px;
        margin-bottom:5px;
      }

      #riAdminSupport .rs-message {
        white-space:pre-wrap;
        line-height:1.7;
        font-size:14px;
      }

      #riAdminSupport a {
        color:#45efb7;
        overflow-wrap:anywhere;
      }

      #riAdminSupport img {
        display:block;
        width:100%;
        max-height:420px;
        object-fit:contain;
        margin-top:12px;
        border-radius:10px;
        background:#041008;
      }

      #riAdminSupport .rs-page {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:12px;
        margin-top:18px;
        font-size:12px;
        color:#94ad9f;
      }

      #riAdminSupport #rsMessage {
        margin:14px 0;
        color:#b9d9c7;
        font-size:13px;
        overflow-wrap:anywhere;
      }

      @media(max-width:1000px) {
        #riAdminSupport .rs-layout {
          grid-template-columns:minmax(0,1fr);
        }
      }
    </style>

    <div class="rs-toolbar">
      <div>
        <h2>Support tickets</h2>

        <div id="rsCount" class="rs-muted">
          Správy z verejného formulára
        </div>
      </div>

      <div class="rs-actions">
        <select
          id="rsFilter"
          aria-label="Stav ticketov"
        >
          <option value="all">Všetky tickety</option>
          <option value="new">Nové</option>
          <option value="in_progress">Rieši sa</option>
          <option value="resolved">Vyriešené</option>
        </select>

        <button id="rsReload" type="button">
          Obnoviť
        </button>
      </div>
    </div>

    <p
      id="rsMessage"
      role="status"
      aria-live="polite"
    ></p>

    <div class="rs-layout">
      <div>
        <div id="rsList" class="rs-list"></div>

        <div class="rs-page">
          <button id="rsPrev" type="button">
            Späť
          </button>

          <span id="rsPage">1 / 1</span>

          <button id="rsNext" type="button">
            Ďalej
          </button>
        </div>
      </div>

      <div id="rsDetail" class="rs-detail">
        Vyber ticket zo zoznamu.
      </div>
    </div>
  `;

  const $ = id =>
    root.querySelector("#" + id);

  const labels = {
    new: "Nový",
    in_progress: "Rieši sa",
    resolved: "Vyriešený"
  };

  const topics = {
    technical: "Technický problém",
    token: "Údaje tokenu",
    account: "Účet / Premium",
    other: "Iná otázka"
  };

  const esc = value =>
    String(value ?? "").replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
    );

  const date = value =>
    new Date(value).toLocaleString("sk-SK");

  const visible = () =>
    !section.hidden &&
    !document.getElementById("dashboard")?.hidden;

  let client = null;
  let attached = null;
  let rows = [];
  let page = 1;
  let pages = 1;
  let selected = null;
  let busy = false;
  let generation = 0;
  let fileGeneration = 0;
  let userId = null;

  function controls() {
    $("rsPrev").disabled =
      busy || page <= 1;

    $("rsNext").disabled =
      busy || page >= pages;

    $("rsReload").disabled = busy;
    $("rsFilter").disabled = busy;

    $("rsPage").textContent =
      page + " / " + pages;
  }

  function clear() {
    generation++;
    fileGeneration++;

    rows = [];
    selected = null;
    busy = false;
    page = 1;
    pages = 1;

    $("rsList").replaceChildren();

    $("rsDetail").textContent =
      "Vyber ticket zo zoznamu.";

    $("rsCount").textContent =
      "Správy z verejného formulára";

    $("rsMessage").textContent = "";

    controls();
  }

  function renderList() {
    $("rsList").innerHTML =
      rows.map(ticket => `
        <button
          type="button"
          class="rs-ticket"
          data-ticket="${esc(ticket.id)}"
          aria-pressed="${ticket.id === selected}"
        >
          <span
            class="rs-badge"
            data-status="${esc(ticket.status)}"
          >
            ${esc(
              labels[ticket.status] ||
              ticket.status
            )}
          </span>

          <strong>${esc(ticket.email)}</strong>

          <small>
            ${esc(
              topics[ticket.topic] ||
              ticket.topic
            )}
            ·
            ${esc(date(ticket.created_at))}
          </small>
        </button>
      `).join("") ||
      '<p class="rs-muted">Žiadne tickety pre tento filter.</p>';
  }

  async function showDetail(id) {
    const ticket =
      rows.find(item => item.id === id);

    if (!ticket) return;

    selected = id;
    renderList();

    const version = ++fileGeneration;
    const owner = client;

    $("rsDetail").innerHTML = `
      <span class="rs-muted">
        Ticket
        ${esc(ticket.id.slice(0, 8).toUpperCase())}
        ·
        ${esc(date(ticket.created_at))}
      </span>

      <div class="rs-field">
        <small>E-mail</small>

        <a href="mailto:${esc(
          encodeURIComponent(ticket.email)
        )}">
          ${esc(ticket.email)}
        </a>
      </div>

      <div class="rs-field">
        <small>Téma</small>
        ${esc(
          topics[ticket.topic] ||
          ticket.topic
        )}
      </div>

      <div class="rs-field">
        <small>Správa</small>
        <div class="rs-message">${esc(ticket.message)}</div>
      </div>

      ${
        ticket.contract
          ? `
            <div class="rs-field">
              <small>Token CA</small>
              ${esc(ticket.contract)}
            </div>
          `
          : ""
      }

      ${
        ticket.source_path
          ? `
            <div class="rs-field">
              <small>Odoslané zo stránky</small>
              ${esc(ticket.source_path)}
            </div>
          `
          : ""
      }

      <div class="rs-field">
        <small>Stav požiadavky</small>

        <div class="rs-actions">
          <select
            id="rsNewStatus"
            aria-label="Nový stav"
          >
            ${
              Object.entries(labels).map(
                ([value, label]) => `
                  <option
                    value="${value}"
                    ${
                      value === ticket.status
                        ? "selected"
                        : ""
                    }
                  >${label}</option>
                `
              ).join("")
            }
          </select>

          <button id="rsSave" type="button">
            Uložiť stav
          </button>
        </div>
      </div>

      <div
        id="rsAttachment"
        class="rs-field"
      >
        ${
          ticket.screenshot_path
            ? "Načítavam screenshot…"
            : "Bez prílohy."
        }
      </div>
    `;

    $("rsSave").onclick = async () => {
      if (busy) return;

      busy = true;
      controls();
      $("rsSave").disabled = true;

      const requestVersion = generation;

      try {
        const { data, error } =
          await client.rpc(
            "ri_admin_support",
            {
              p_action: "set_status",
              p_ticket_id: id,
              p_new_status:
                $("rsNewStatus").value
            }
          );

        if (requestVersion !== generation) {
          return;
        }

        if (error || data?.success !== true) {
          throw error || new Error(
            "Stav sa nepodarilo uložiť."
          );
        }

        busy = false;
        await load(page);
      } catch (error) {
        if (requestVersion === generation) {
          $("rsMessage").textContent =
            error.message;

          busy = false;
          controls();

          if ($("rsSave")) {
            $("rsSave").disabled = false;
          }
        }
      }
    };

    if (!ticket.screenshot_path) return;

    try {
      const { data, error } =
        await owner.storage
          .from("ri-support-attachments")
          .createSignedUrl(
            ticket.screenshot_path,
            300
          );

      if (
        version !== fileGeneration ||
        !visible() ||
        selected !== id ||
        owner !== client
      ) {
        return;
      }

      if (error || !data?.signedUrl) {
        throw new Error(
          "Screenshot sa nepodarilo otvoriť."
        );
      }

      const url = new URL(data.signedUrl);

      if (url.protocol !== "https:") {
        throw new Error(
          "Neplatný odkaz na prílohu."
        );
      }

      const link =
        document.createElement("a");

      link.href = url.href;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Otvoriť screenshot";

      const img =
        document.createElement("img");

      img.src = url.href;
      img.alt = "Priložený screenshot";
      img.referrerPolicy = "no-referrer";

      $("rsAttachment").replaceChildren(
        link,
        img
      );
    } catch (error) {
      if (
        version === fileGeneration &&
        selected === id &&
        visible()
      ) {
        $("rsAttachment").textContent =
          error.message;
      }
    }
  }

  async function load(nextPage = 1) {
    if (!visible() || busy) return;

    client = window.BAGVYR_ADMIN_CLIENT;

    if (!client) {
      $("rsMessage").textContent =
        "Najprv sa prihlás do admin panelu.";

      return;
    }

    busy = true;

    const version = ++generation;

    controls();

    $("rsMessage").textContent =
      "Načítavam tickety…";

    try {
      const { data, error } =
        await client.rpc(
          "ri_admin_support",
          {
            p_action: "list",
            p_page: nextPage,
            p_status: $("rsFilter").value
          }
        );

      if (
        version !== generation ||
        !visible()
      ) {
        return;
      }

      if (
        error ||
        data?.success !== true ||
        !Array.isArray(data.rows)
      ) {
        throw error || new Error(
          "Tickety sa nepodarilo načítať."
        );
      }

      rows = data.rows;
      page = data.page;
      pages = data.pages;

      $("rsCount").textContent =
        data.total +
        " ticketov · 10 na stranu";

      $("rsMessage").textContent = "";

      renderList();

      const id = rows.some(
        ticket => ticket.id === selected
      )
        ? selected
        : rows[0]?.id;

      if (id) {
        void showDetail(id);
      } else {
        fileGeneration++;

        $("rsDetail").textContent =
          "Žiadny ticket.";
      }
    } catch (error) {
      if (version === generation) {
        fileGeneration++;
        rows = [];
        selected = null;

        renderList();

        $("rsDetail").textContent =
          "Tickety nie sú dostupné.";

        $("rsMessage").textContent =
          error.message;
      }
    } finally {
      if (version === generation) {
        busy = false;
        controls();
      }
    }
  }

  $("rsList").addEventListener(
    "click",
    event => {
      const button =
        event.target.closest("[data-ticket]");

      if (button && !busy) {
        void showDetail(
          button.dataset.ticket
        );
      }
    }
  );

  $("rsReload").onclick = () =>
    void load(page);

  $("rsFilter").onchange = () =>
    void load(1);

  $("rsPrev").onclick = () =>
    void load(page - 1);

  $("rsNext").onclick = () =>
    void load(page + 1);

  document.addEventListener(
    "bagvyr:admin-section",
    event => {
      if (
        event.detail?.section === "support"
      ) {
        void load(1);
      } else {
        clear();
      }
    }
  );

  function attach() {
    client = window.BAGVYR_ADMIN_CLIENT;

    if (!client || client === attached) {
      return;
    }

    attached = client;

    client.auth.onAuthStateChange(
      (event, session) => {
        const nextUser =
          session?.user?.id || null;

        if (
          event === "SIGNED_OUT" ||
          (
            userId &&
            nextUser !== userId
          )
        ) {
          clear();
        }

        userId = nextUser;
      }
    );

    if (visible()) {
      void load(1);
    }
  }

  window.addEventListener(
    "bagvyr-admin-ready",
    attach
  );

  attach();
  controls();
})();