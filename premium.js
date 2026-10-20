(() => {
  "use strict";

  function init() {
    const root =
      document.getElementById("riPremiumRoot");

    if (!root) return;

    const adminMode =
      root.hasAttribute("data-premium-admin");

    const API =
      "https://bagvyr-api.megafunhousetv.workers.dev";

    const modules = [
      [
        "lab",
        "Exit Lab",
        "Sell simulations and token value calculator."
      ],
      [
        "whale",
        "Whale X-Ray",
        "Inspect large token holders."
      ],
      [
        "volume",
        "Volume X-Ray",
        "Inspect token trading volume."
      ],
      [
        "early_buyers",
        "Early Buyers",
        "Inspect the first token buyers."
      ],
      [
        "telegram_bot",
        "Telegram bot",
        "Open RugInspect on Telegram."
      ]
    ];

    const keys = [
      "premium",
      ...modules.map(([key]) => key)
    ];

    const empty = () =>
      Object.fromEntries(
        keys.map(key => [key, false])
      );

    let flags = empty();
    let verified = false;
    let selected = null;
    let busy = false;
    let again = false;
    let generation = 0;
    let signature = "";
    let client = null;

    const $ = id =>
      root.querySelector(`#${id}`);

    const style =
      document.createElement("style");

    style.textContent = `
      #riPremiumRoot {
        max-width:1180px;
        margin:auto;
        padding:32px 20px;
        color:#edf7f1;
        font:15px/1.6 system-ui,sans-serif;
      }

      #riPremiumRoot [hidden],
      [data-premium-link][hidden],
      [data-premium-bot][hidden] {
        display:none!important;
      }

      #riPremiumRoot * {
        box-sizing:border-box;
      }

      #riPremiumRoot h1 {
        margin:0;
        font-size:36px;
      }

      #riPremiumRoot h2,
      #riPremiumRoot h3 {
        margin:0 0 8px;
      }

      #riPremiumRoot p {
        margin:8px 0;
        color:#a4b9ad;
      }

      #riPremiumRoot .rp-kicker {
        color:#79edaf;
        font-size:11px;
        letter-spacing:2px;
      }

      #riPremiumRoot .rp-grid {
        display:grid;
        grid-template-columns:
          repeat(auto-fit,minmax(235px,1fr));
        gap:16px;
        margin:24px 0;
      }

      #riPremiumRoot .rp-card,
      #riPremiumRoot .rp-master {
        padding:22px;
        border:1px solid #294337;
        border-radius:16px;
        background:rgba(8,23,17,.94);
      }

      #riPremiumRoot .rp-card {
        display:flex;
        flex-direction:column;
        gap:10px;
      }

      #riPremiumRoot .rp-card > p {
        flex:1;
      }

      #riPremiumRoot .rp-master {
        margin:20px 0;
      }

      #riPremiumRoot button,
      #riPremiumRoot .rp-link {
        display:inline-block;
        padding:10px 16px;
        border:1px solid #3c7356;
        border-radius:9px;
        background:#102c1e;
        color:#c5ffdd;
        font:inherit;
        cursor:pointer;
        text-decoration:none;
      }

      #riPremiumRoot button:disabled {
        opacity:.45;
        cursor:default;
      }

      #riPremiumRoot button[aria-checked="true"] {
        background:#225e3c;
        border-color:#7ceeb0;
      }

      #riPremiumRoot .rp-controls {
        padding-top:12px;
        border-top:1px solid #294337;
      }

      #riPremiumRoot .rp-controls small {
        display:block;
        margin-bottom:8px;
        color:#a4b9ad;
      }

      #riPremiumRoot .rp-tool {
        margin-top:24px;
        padding-top:24px;
        border-top:1px solid #294337;
      }

      #riPremiumRoot .lab-heading {
        margin:20px 0;
      }

      #riPremiumRoot .lab-card {
        margin:16px 0;
        padding:22px;
        background:#0c1d15;
        border:1px solid #294337;
        border-radius:14px;
      }

      #riPremiumRoot .lab-grid,
      #riPremiumRoot .lab-market {
        display:grid;
        grid-template-columns:
          repeat(auto-fit,minmax(230px,1fr));
        gap:16px;
      }

      #riPremiumRoot .lab-search,
      #riPremiumRoot .lab-own-inputs,
      #riPremiumRoot .lab-title {
        display:flex;
        flex-wrap:wrap;
        gap:12px;
        align-items:center;
      }

      #riPremiumRoot .lab-own-inputs label {
        flex:1;
        min-width:170px;
      }

      #riPremiumRoot input,
      #riPremiumRoot select {
        max-width:100%;
        padding:11px;
        background:#07110c;
        border:1px solid #355440;
        border-radius:8px;
        color:#eef8f1;
        font:inherit;
      }

      #riPremiumRoot .lab-search input {
        flex:1;
        min-width:180px;
      }

      #riPremiumRoot .lab-own-inputs input,
      #riPremiumRoot .lab-own-inputs select {
        display:block;
        width:100%;
      }

      #riPremiumRoot .lab-table-wrap {
        overflow:auto;
      }

      #riPremiumRoot table {
        width:100%;
        border-collapse:collapse;
        font-size:13px;
      }

      #riPremiumRoot th,
      #riPremiumRoot td {
        padding:10px;
        text-align:left;
        border-bottom:1px solid #294337;
      }

      #riPremiumRoot .lab-result {
        margin-top:16px;
        overflow-wrap:anywhere;
      }

      #riPremiumRoot .lab-muted {
        color:#a4b9ad;
        font-size:13px;
      }

      #riPremiumRoot .lab-market strong,
      #riPremiumRoot .lab-market small {
        display:block;
      }

      #riPremiumRoot .lab-result > div {
        display:flex;
        flex-wrap:wrap;
        justify-content:space-between;
        gap:12px;
        padding:8px 0;
      }

      @media(max-width:600px) {
        #riPremiumRoot {
          padding:24px 12px;
        }

        #riPremiumRoot .rp-grid,
        #riPremiumRoot .lab-grid {
          grid-template-columns:1fr;
        }

        #riPremiumRoot .lab-card {
          padding:14px;
        }
      }
    `;

    document.head.append(style);

    root.innerHTML = `
      <span class="rp-kicker">
        RUGINSPECT / PREMIUM
      </span>

      <h1>Premium</h1>

      <p>Explore advanced token analysis tools.</p>

      <p
        id="rpMessage"
        role="status"
        aria-live="polite"
      >Loading…</p>

      <div
        id="rpMaster"
        class="rp-master"
        hidden
      >
        <h3>Premium na webe</h3>

        <p id="rpMasterState"></p>

        <button
          type="button"
          role="switch"
          aria-checked="false"
          data-toggle="premium"
        >
          Zapnúť Premium
        </button>

        <button type="button" id="rpRefresh">
          Obnoviť stav
        </button>
      </div>

      <div id="rpBody" hidden>
        <div class="rp-grid">
          ${modules.map(
            ([key, title, description]) => `
              <article
                class="rp-card"
                data-card="${key}"
              >
                <h3>${title}</h3>

                <p>${description}</p>

                <button
                  type="button"
                  data-open="${key}"
                  aria-expanded="false"
                >
                  Open ${title}
                </button>

                <div
                  class="rp-controls"
                  data-admin-control
                  hidden
                >
                  <small data-state="${key}"></small>

                  <button
                    type="button"
                    role="switch"
                    aria-checked="false"
                    data-toggle="${key}"
                    aria-label="${title} na webe"
                  >
                    Zapnúť na webe
                  </button>
                </div>
              </article>
            `
          ).join("")}
        </div>

        <p id="rpEmpty" hidden>
          No tools are available yet.
        </p>

        ${modules.map(([key, title]) => `
          <section
            class="rp-tool"
            data-tool="${key}"
            hidden
          >
            ${
              key === "lab"
                ? '<div id="riLabRoot"></div>'
                : `
                  <h2>${title}</h2>

                  ${
                    key === "telegram_bot"
                      ? `
                        <a
                          class="rp-link"
                          href="https://t.me/RugInspect_Bot"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open Telegram bot
                        </a>
                      `
                      : `
                        <p>
                          This tool is in development.
                        </p>
                      `
                  }
                `
            }
          </section>
        `).join("")}
      </div>
    `;

    const available = key =>
      adminMode
        ? verified
        : flags.premium === true &&
          flags[key] === true;

    function publish() {
      if (
        selected &&
        !available(selected)
      ) {
        selected = null;
      }

      $("rpBody").hidden =
        adminMode
          ? !verified
          : !flags.premium;

      $("rpMaster").hidden =
        !adminMode || !verified;

      $("rpMasterState").textContent =
        flags.premium
          ? "Verejný web: ZAPNUTÉ"
          : "Verejný web: VYPNUTÉ";

      let count = 0;

      root.querySelectorAll(
        "[data-card]"
      ).forEach(card => {
        const allowed =
          available(card.dataset.card);

        card.hidden = !allowed;

        if (allowed) count++;
      });

      $("rpEmpty").hidden = count > 0;

      root.querySelectorAll(
        "[data-tool]"
      ).forEach(panel => {
        panel.hidden =
          panel.dataset.tool !== selected ||
          !available(panel.dataset.tool);
      });

      root.querySelectorAll(
        "[data-open]"
      ).forEach(button => {
        button.setAttribute(
          "aria-expanded",
          String(
            button.dataset.open === selected
          )
        );
      });

      root.querySelectorAll(
        "[data-admin-control]"
      ).forEach(panel => {
        panel.hidden =
          !adminMode || !verified;
      });

      root.querySelectorAll(
        "[data-toggle]"
      ).forEach(button => {
        const on =
          flags[button.dataset.toggle];

        button.disabled =
          busy || !verified;

        button.setAttribute(
          "aria-checked",
          String(on)
        );

        button.textContent =
          button.dataset.toggle === "premium"
            ? (
                on
                  ? "Vypnúť Premium"
                  : "Zapnúť Premium"
              )
            : (
                on
                  ? "Vypnúť na webe"
                  : "Zapnúť na webe"
              );
      });

      root.querySelectorAll(
        "[data-state]"
      ).forEach(label => {
        const on =
          flags[label.dataset.state];

        label.textContent = on
          ? (
              flags.premium
                ? "Verejný web: ZAPNUTÉ"
                : "ZAPNUTÉ · Premium na webe je vypnuté"
            )
          : "Verejný web: VYPNUTÉ";
      });

      $("rpRefresh").disabled = busy;

      if (!adminMode) {
        document.querySelectorAll(
          "[data-premium-link]"
        ).forEach(link => {
          link.hidden = !flags.premium;
        });

        document.querySelectorAll(
          "[data-premium-bot]"
        ).forEach(link => {
          link.hidden = !(
            flags.premium &&
            flags.telegram_bot
          );
        });
      }

      const next = JSON.stringify([
        flags,
        verified,
        selected
      ]);

      if (next !== signature) {
        signature = next;

        document.dispatchEvent(
          new Event("ri:premium-change")
        );
      }
    }

    async function headers() {
      if (!adminMode) return {};

      if (!verified) {
        throw new Error(
          "Admin access required."
        );
      }

      const { data, error } =
        await client.auth.getSession();

      if (error || !data?.session) {
        throw new Error(
          "Sign in again."
        );
      }

      return {
        Authorization:
          `Bearer ${data.session.access_token}`
      };
    }

    window.RI_PREMIUM = {
      isAvailable: available,

      isActive: key =>
        available(key) &&
        selected === key &&
        (
          adminMode
            ? (
                !root.closest(
                  ".admin-section"
                ).hidden &&
                !document.getElementById(
                  "dashboard"
                ).hidden
              )
            : location.hash === "#premium"
        ),

      getHeaders: headers
    };

    async function refresh(feature = null) {
      if (busy) {
        if (feature === null) {
          again = true;
        }

        return;
      }

      busy = true;

      const version = generation;

      publish();

      try {
        let authHeaders = {};
        let saved = null;

        if (adminMode) {
          client =
            window.BAGVYR_ADMIN_CLIENT;

          if (!client) {
            throw new Error(
              "Prihlás sa do admin panela."
            );
          }

          const { data, error } =
            await client.auth.getSession();

          if (error || !data?.session) {
            throw new Error(
              "Prihlás sa do admin panela."
            );
          }

          authHeaders = {
            Authorization:
              `Bearer ${data.session.access_token}`
          };

          const result = await client.rpc(
            "ri_premium_settings",
            {
              p_feature: feature,

              p_enabled:
                feature === null
                  ? null
                  : !flags[feature]
            }
          );

          if (result.error) {
            throw result.error;
          }

          saved = result.data;
        }

        const response = await fetch(
          API + (
            adminMode
              ? "/api/premium/admin/status"
              : "/api/premium/status"
          ),
          {
            headers: authHeaders,
            cache: "no-store",

            signal:
              AbortSignal.timeout(8000)
          }
        );

        let data =
          await response.json();

        if (saved) {
          data = {
            ...data,

            ...Object.fromEntries(
              keys.map(
                key => [key, saved[key]]
              )
            )
          };
        }

        if (
          !response.ok ||
          data.success !== true ||
          keys.some(
            key =>
              typeof data[key] !== "boolean"
          ) ||
          (
            adminMode &&
            data.admin !== true
          )
        ) {
          throw new Error(
            data.error ||
            "Premium settings unavailable."
          );
        }

        if (version !== generation) {
          return;
        }

        flags = Object.fromEntries(
          keys.map(
            key => [key, data[key]]
          )
        );

        verified =
          adminMode &&
          data.admin === true;

        $("rpMessage").textContent =
          adminMode
            ? "Admin prístup overený. Všetky nástroje sú dostupné bez ohľadu na verejné prepínače."
            : (
                flags.premium
                  ? ""
                  : "Premium is not available yet."
              );

      } catch (error) {
        if (version !== generation) {
          return;
        }

        verified = false;
        flags = empty();

        $("rpMessage").textContent =
          error.message ||
          "Premium unavailable. Try refreshing.";

      } finally {
        busy = false;

        publish();

        if (again) {
          again = false;
          void refresh();
        }
      }
    }

    root.addEventListener("click", event => {
      const open = event.target.closest(
        "[data-open]"
      );

      if (
        open &&
        available(open.dataset.open)
      ) {
        selected =
          selected === open.dataset.open
            ? null
            : open.dataset.open;

        publish();
      }

      const toggle = event.target.closest(
        "[data-toggle]"
      );

      if (
        toggle &&
        verified &&
        !busy
      ) {
        void refresh(
          toggle.dataset.toggle
        );
      }
    });

    $("rpRefresh").onclick =
      () => void refresh();

    let attached = false;

    function attachAuth() {
      if (
        attached ||
        !window.BAGVYR_ADMIN_CLIENT
      ) {
        return;
      }

      attached = true;

      window.BAGVYR_ADMIN_CLIENT.auth
        .onAuthStateChange(event => {
          if (
            [
              "INITIAL_SESSION",
              "SIGNED_IN",
              "SIGNED_OUT"
            ].includes(event)
          ) {
            generation++;

            verified = false;
            flags = empty();

            publish();
          }

          setTimeout(
            () => void refresh(),
            0
          );
        });

      void refresh();
    }

    if (adminMode) {
      window.addEventListener(
        "bagvyr-admin-ready",
        attachAuth
      );

      document.addEventListener(
        "bagvyr:admin-section",
        event => {
          document.dispatchEvent(
            new Event(
              "ri:premium-change"
            )
          );

          if (
            event.detail?.section ===
            "premium"
          ) {
            void refresh();
          }
        }
      );

      attachAuth();
    }

    window.addEventListener(
      "hashchange",
      () => {
        document.dispatchEvent(
          new Event("ri:premium-change")
        );
      }
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (!document.hidden) {
          void refresh();
        }
      }
    );

    setInterval(() => {
      if (!document.hidden) {
        void refresh();
      }
    }, 15000);

    publish();

    void refresh();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();