(() => {
  "use strict";

  if (window.RI_DEV_HISTORY) return;

  const API =
    "https://bagvyr-api.megafunhousetv.workers.dev/api/dev-history";

  const contexts = new WeakMap();

  const valid = value =>
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value || "");

  const escape = value =>
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

  const icon = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      aria-hidden="true"
    >
      <path d="M3 7V5l12-2v4M3 7h16v7M3 7v13h9"/>
      <circle cx="17" cy="18" r="5"/>
      <path d="M17 15v3l2 1"/>
    </svg>
  `;

  const style = document.createElement("style");

  style.textContent = `
    .dh {
      padding: 24px;
      margin: 18px 0;
      border: 1px solid #214d3e;
      border-radius: 18px;
      background: #03160f;
      color: #edfff7;
      font: inherit;
    }

    .dh * {
      box-sizing: border-box;
    }

    .dh [hidden] {
      display: none !important;
    }

    .dh-head,
    .dh-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }

    .dh-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .dh-title svg {
      width: 34px;
      height: 34px;
      color: #69edbb;
      flex: 0 0 auto;
    }

    .dh h3 {
      margin: 0;
      font-size: 22px;
    }

    .dh p {
      color: #a7c6b8;
      line-height: 1.6;
      margin: 10px 0;
    }

    .dh small {
      color: #9bbcaf;
    }

    .dh-badge {
      display: inline-block;
      font-size: 10px;
      letter-spacing: 1px;
      color: #39edb1;
      border: 1px solid #22674d;
      border-radius: 6px;
      padding: 4px 7px;
      margin-left: 8px;
      vertical-align: middle;
    }

    .dh button {
      border: 1px solid #28604b;
      border-radius: 10px;
      background: #09271b;
      color: #bafbdc;
      padding: 12px 16px;
      font: inherit;
      cursor: pointer;
    }

    .dh button.dh-primary {
      background: #22e6ac;
      color: #002a1d;
      font-weight: 700;
    }

    .dh button:disabled {
      opacity: .5;
      cursor: wait;
    }

    .dh-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin: 22px 0;
    }

    .dh-metric {
      border: 1px solid #20503c;
      border-radius: 13px;
      padding: 22px;
      background: #061e14;
    }

    .dh-label {
      font-size: 11px;
      letter-spacing: 1px;
      color: #a2c6b5;
    }

    .dh-value {
      font-size: 40px;
      font-weight: 750;
      margin: 8px 0;
    }

    .dh-amber {
      color: #ffcc6a;
    }

    .dh-track {
      height: 6px;
      border-radius: 9px;
      background: #1c4030;
      margin-top: 18px;
      overflow: hidden;
    }

    .dh-fill {
      height: 100%;
      background: #ffcc6a;
    }

    .dh-status {
      border-top: 1px solid #173e2e;
      padding-top: 14px;
      margin-top: 18px !important;
      overflow-wrap: anywhere;
    }

    .dh-error {
      color: #ffb695 !important;
    }

    .dh-list {
      margin-top: 18px;
      max-height: 400px;
      overflow: auto;
    }

    .dh-row {
      display: flex;
      gap: 16px;
      justify-content: space-between;
      padding: 14px 0;
      border-top: 1px solid #193c2d;
    }

    .dh-row a {
      color: #40eeb4;
      text-decoration: none;
      overflow-wrap: anywhere;
    }

    .dh-row small {
      display: block;
      margin-top: 5px;
    }

    .dh input[type=number],
    .dh input[type=text] {
      background: #061c13;
      color: #e8fff2;
      border: 1px solid #285640;
      border-radius: 9px;
      padding: 12px;
      font: inherit;
      width: 100%;
      margin: 8px 0;
    }

    .dh-settings {
      display: grid;
      grid-template-columns: 1fr 180px;
      gap: 20px;
      margin: 20px 0;
    }

    .dh input[type=checkbox] {
      width: auto !important;
      display: inline-block !important;
      accent-color: #20e5ac;
    }

    @media (max-width: 650px) {
      .dh {
        padding: 18px;
      }

      .dh-grid,
      .dh-settings {
        grid-template-columns: 1fr;
      }

      .dh h3 {
        font-size: 19px;
      }

      .dh-value {
        font-size: 34px;
      }

      .dh-head > button {
        width: 100%;
      }
    }
  `;

  document.head.append(style);

  function client() {
    return (
      window.BAGVYR_ADMIN_CLIENT ||
      window.RI_ACCOUNT_CLIENT
    );
  }

  async function request(path, body) {
    const session = (
      await client()?.auth.getSession()
    )?.data?.session;

    const response = await fetch(API + path, {
      method: body === undefined ? "GET" : "POST",

      cache: "no-store",

      headers: {
        "Content-Type": "application/json",

        ...(session?.access_token
          ? {
              Authorization:
                "Bearer " + session.access_token
            }
          : {})
      },

      ...(body === undefined
        ? {}
        : {
            body: JSON.stringify(body)
          }),

      signal: AbortSignal.timeout(115000)
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.error || "Request failed."
      );
    }

    return data;
  }

  function draw(box, context) {
    const data = context.data;
    const done = data?.phase === "done";

    const previousCount = done
      ? data.items.filter(
          item => item.mint !== context.mint
        ).length
      : 0;

    const money = value =>
      typeof value === "number"
        ? "$" + value.toLocaleString(
            "en-US",
            {
              maximumFractionDigits: 0
            }
          )
        : "MC unavailable";

    box.className = "dh";

    box.innerHTML = `
      <div class="dh-head">
        <div class="dh-title">
          ${icon}

          <div>
            <h3>
              Developer History
              <span class="dh-badge">
                PREMIUM
              </span>
            </h3>

            <p>
              Verified Pump.fun launches by this wallet.
            </p>
          </div>
        </div>

        <button
          type="button"
          class="dh-primary"
          data-start
          ${
            context.busy || !valid(context.mint)
              ? "disabled"
              : ""
          }
        >
          ${
            context.busy
              ? "Scanning…"
              : context.id && !done
                ? "Resume scan →"
                : done
                  ? "Run a new scan →"
                  : "Load developer history →"
          }
        </button>
      </div>

      ${
        done
          ? `
            <div class="dh-grid">
              <div class="dh-metric">
                <div class="dh-label">
                  LAUNCHES FOUND
                </div>

                <div class="dh-value">
                  ${data.count}
                </div>

                <small>
                  ${
                    data.verified_current
                      ? "Includes this token"
                      : "Current launch was not found in the available history"
                  }
                </small>
              </div>

              <div class="dh-metric">
                <div class="dh-label">
                  PAST LAUNCHES BELOW $10K
                </div>

                <div class="dh-value dh-amber">
                  ${
                    data.percentage === null
                      ? `
                        <span style="
                          display:block;
                          font-size:20px;
                          line-height:1.4;
                        ">
                          ${
                            previousCount === 0
                              ? "No previous launches found"
                              : "Market cap unavailable"
                          }
                        </span>
                      `
                      : data.percentage + "%"
                  }
                </div>

                <small>
                  ${
                    previousCount === 0
                      ? "No earlier launches were found in the scanned history."
                      : data.known === 0
                        ? "Previous launches were found, but their market caps are unavailable."
                        : `${data.low} of ${data.known} previous tokens with known MC`
                  }
                </small>

                <div
                  class="dh-track"
                  ${
                    data.percentage === null
                      ? "hidden"
                      : ""
                  }
                >
                  <div
                    class="dh-fill"
                    style="width:${
                      Math.min(
                        100,
                        Math.max(
                          0,
                          data.percentage || 0
                        )
                      )
                    }%"
                  ></div>
                </div>
              </div>
            </div>

            <p>
              <small>
                Based on the last ${data.checked}
                wallet transactions (maximum 500).
              </small>
            </p>

            <p>
              Current token excluded from the percentage
              · ${data.unknown} with unavailable MC excluded.
            </p>

            <div class="dh-actions">
              <button
                type="button"
                data-list
              >
                View previous tokens ↓
              </button>

              <small>
                ${
                  data.finished_at
                    ? "Checked " +
                      escape(
                        new Date(
                          data.finished_at
                        ).toLocaleString()
                      )
                    : ""
                }
              </small>
            </div>

            <div class="dh-list" hidden>
              ${
                data.items
                  .filter(
                    item => item.mint !== context.mint
                  )
                  .map(item => `
                    <div class="dh-row">
                      <div>
                        <a
                          href="https://solscan.io/token/${
                            escape(item.mint)
                          }"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          ${
                            escape(
                              item.name ||
                              item.mint.slice(0, 6) +
                              "…" +
                              item.mint.slice(-4)
                            )
                          } ↗
                        </a>

                        <small>
                          ${escape(item.mint)}
                        </small>
                      </div>

                      <strong
                        class="${
                          item.mc !== null &&
                          item.mc < 10000
                            ? "dh-amber"
                            : ""
                        }"
                      >
                        ${money(item.mc)}
                      </strong>
                    </div>
                  `)
                  .join("") ||
                "No previous verified launches found."
              }
            </div>

            <p>
              <small>
                Available Pump.fun creation transactions only.
                Low market cap does not prove a developer sell.
              </small>
            </p>
          `
          : `
            <p>
              Explore previous launches and their current
              market caps. The scan starts only when you click.
            </p>

            ${
              data
                ? `
                  <p>
                    ${data.checked} transactions checked
                    · ${data.count} launches found so far
                    ${
                      data.phase === "market"
                        ? " · Checking market caps…"
                        : ""
                    }
                  </p>
                `
                : ""
            }
          `
      }

      <p
        class="dh-status ${
          context.error ? "dh-error" : ""
        }"
        role="status"
      >
        ${
          escape(
            context.error ||
            (
              context.busy
                ? "Checking available history. You can leave and resume this scan."
                : context.note ||
                  "Premium access required. Admin has unlimited scans."
            )
          )
        }
      </p>
    `;

    box.querySelector("[data-start]").onclick =
      () => run(box, context);

    box.querySelector("[data-list]")
      ?.addEventListener("click", event => {
        const list =
          box.querySelector(".dh-list");

        list.hidden = !list.hidden;

        event.currentTarget.textContent =
          list.hidden
            ? "View previous tokens ↓"
            : "Hide previous tokens ↑";
      });
  }

  async function run(box, context) {
    if (context.busy) return;

    context.busy = true;
    context.error = "";

    draw(box, context);

    const active = () =>
      contexts.get(box) === context &&
      box.isConnected;

    try {
      if (
        !context.id ||
        context.data?.phase === "done"
      ) {
        const session = (
          await client()?.auth.getSession()
        )?.data?.session;

        if (!session) {
          throw new Error(
            "Please sign in to use Developer History."
          );
        }

        context.key =
          "ri-dh:v2:" +
          session.user.id +
          ":" +
          context.mint;

        let pending;

        try {
          pending = JSON.parse(
            sessionStorage.getItem(
              context.key
            ) || "null"
          );
        } catch {}

        if (
          pending &&
          Date.now() - pending.at <
            23 * 3600000 &&
          !context.data
        ) {
          context.id = pending.id;
        } else {
          context.id =
            crypto.randomUUID();
        }

        sessionStorage.setItem(
          context.key,
          JSON.stringify({
            id: context.id,
            at: Date.now()
          })
        );

        const data = await request(
          "/start",
          {
            id: context.id,
            mint: context.mint
          }
        );

        if (!active()) return;

        context.data = data;

        context.note =
          data.limit === null
            ? "Admin · Unlimited scans"
            : `${data.used} / ${data.limit} scans used today`;
      }

      /*
       * Continue at most 250 small pages per click.
       * Resume uses the same scan and credit.
       */
      for (
        let index = 0;
        index < 250 &&
        context.data?.phase !== "done" &&
        active();
        index++
      ) {
        draw(box, context);

        const data = await request(
          "/next",
          {
            id: context.id
          }
        );

        if (!active()) return;

        context.data = data;

        if (data.phase !== "done") {
          await new Promise(resolve => {
            setTimeout(resolve, 800);
          });
        }
      }

      if (
        context.data?.phase === "done" &&
        context.key
      ) {
        sessionStorage.removeItem(
          context.key
        );
      } else if (active()) {
        context.note =
          "History is large. Click Resume scan to continue without using another scan.";
      }
    } catch (error) {
      context.error =
        error.name === "TimeoutError"
          ? "Request timed out. Resume the same scan shortly."
          : error.message;

      if (!context.data) {
        /*
         * Retry /start using the saved request ID.
         * This prevents duplicate credit consumption.
         */
        context.id = null;
      }

      if (/expired/i.test(context.error)) {
        if (context.key) {
          sessionStorage.removeItem(
            context.key
          );
        }

        context.id = null;
        context.data = null;
      }
    } finally {
      context.busy = false;

      if (active()) {
        draw(box, context);
      }
    }
  }

  function mount(box, mint) {
    if (!box) return;

    const context = {
      mint,
      busy: false,
      id: null,
      data: null,
      error: ""
    };

    contexts.set(box, context);
    draw(box, context);
  }

  window.RI_DEV_HISTORY = {
    mount
  };

  function initAdmin() {
    const section =
      document.getElementById(
        "premiumSection"
      );

    if (
      !section ||
      section.querySelector("#dhAdmin")
    ) {
      return;
    }

    const card =
      document.createElement("div");

    card.className = "dh";
    card.id = "dhAdmin";

    card.innerHTML = `
      <h3>
        Developer History
        <span class="dh-badge">
          PREMIUM
        </span>
      </h3>

      <div class="dh-settings">
        <label>
          <input
            type="checkbox"
            data-enabled
          >
          Enable for Premium users
        </label>

        <label>
          Scans per user / day

          <input
            type="number"
            min="0"
            max="1000000"
            step="1"
            data-limit
          >
        </label>
      </div>

      <button
        type="button"
        class="dh-primary"
        data-save
        disabled
      >
        Save settings
      </button>

      <p
        data-status
        role="status"
      >
        Sign in, then load settings.
      </p>

      <button
        type="button"
        data-reload
      >
        Load settings
      </button>

      <p>
        0 blocks new Premium scans.
        Admin stays unlimited.
        Resuming a scan uses no additional credit.
      </p>

      <label>
        Test a token

        <input
          type="text"
          data-mint
          placeholder="Solana contract address"
          autocomplete="off"
        >
      </label>

      <button
        type="button"
        data-preview
      >
        Show developer history
      </button>

      <div data-preview-root></div>
    `;

    section.prepend(card);

    const query = selector =>
      card.querySelector(selector);

    async function load() {
      query("[data-status]").textContent =
        "Loading…";

      try {
        const data =
          await request("/config");

        if (!data.admin) {
          throw new Error(
            "Admin access required."
          );
        }

        query("[data-enabled]").checked =
          data.enabled;

        query("[data-limit]").value =
          data.daily_limit;

        query("[data-save]").disabled =
          false;

        query("[data-status]").textContent =
          "Settings loaded.";
      } catch (error) {
        query("[data-status]").textContent =
          error.message;
      }
    }

    query("[data-reload]").onclick =
      load;

    query("[data-save]").onclick =
      async () => {
        const button =
          query("[data-save]");

        button.disabled = true;

        try {
          const input =
            query("[data-limit]");

          if (
            !input.value.trim() ||
            !input.checkValidity()
          ) {
            throw new Error(
              "Enter a whole number from 0 to 1000000."
            );
          }

          await request("/config", {
            enabled:
              query("[data-enabled]")
                .checked,

            daily_limit:
              Number(input.value)
          });

          query(
            "[data-status]"
          ).textContent =
            "Saved. New limits apply immediately.";
        } catch (error) {
          query(
            "[data-status]"
          ).textContent =
            error.message;
        } finally {
          button.disabled = false;
        }
      };

    query("[data-preview]").onclick =
      () => {
        const mint =
          query("[data-mint]")
            .value.trim();

        if (!valid(mint)) {
          query(
            "[data-status]"
          ).textContent =
            "Enter a valid Solana address.";

          return;
        }

        mount(
          query("[data-preview-root]"),
          mint
        );
      };

    if (client()) {
      client().auth.onAuthStateChange(
        () => {
          setTimeout(load, 0);
        }
      );

      void load();
    }
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      initAdmin
    );
  } else {
    initAdmin();
  }
})();