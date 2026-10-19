(() => {
  "use strict";

  const API =
    "https://bagvyr-api.megafunhousetv.workers.dev";

  const ADDRESS =
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  const U64 = 18446744073709551615n;

  const $ = id =>
    document.getElementById(id);

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

  const finite = value =>
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= 0;

  const money = value =>
    finite(value)
      ? value.toLocaleString("en-US", {
          style: "currency",
          currency: "USD",

          maximumFractionDigits:
            value > 0 && value < 0.01
              ? 10
              : 2
        })
      : "—";

  const number = value =>
    finite(value)
      ? value.toLocaleString("en-US", {
          maximumFractionDigits: 6
        })
      : "—";

  const time = value =>
    Number.isFinite(Date.parse(value))
      ? new Date(value).toLocaleTimeString()
      : "unavailable";

  function toRaw(value, decimals) {
    if (
      !Number.isInteger(decimals) ||
      decimals < 0 ||
      decimals > 18
    ) {
      throw new Error(
        "Token decimals unavailable."
      );
    }

    const text = String(value).trim();

    if (
      !/^\d+(?:\.\d+)?$/.test(text) ||
      text.length > 80
    ) {
      throw new Error(
        "Enter a positive decimal amount."
      );
    }

    const [whole, fraction = ""] =
      text.split(".");

    if (/[1-9]/.test(fraction.slice(decimals))) {
      throw new Error(
        `This token supports ${decimals} decimals.`
      );
    }

    const raw =
      BigInt(whole) * 10n ** BigInt(decimals) +
      BigInt(
        fraction
          .slice(0, decimals)
          .padEnd(decimals, "0") || "0"
      );

    if (raw <= 0n || raw > U64) {
      throw new Error(
        "Amount is outside the supported range."
      );
    }

    return raw;
  }

  /* =====================================================
     ADMIN
     ===================================================== */

  function startAdmin() {
    const panel = $("riLabAdmin");

    if (!panel) return;

    let busy = false;

    async function settings(enabled = null) {
      if (busy) return;

      const client =
        window.BAGVYR_ADMIN_CLIENT;

      if (!client) {
        $("riLabAdminState").textContent =
          "First sign in to the admin panel.";

        return;
      }

      busy = true;

      panel.querySelectorAll("button").forEach(
        button => {
          button.disabled = true;
        }
      );

      try {
        if (enabled !== null) {
          const { data, error } =
            await client.auth.getSession();

          if (error || !data?.session) {
            throw new Error(
              "First sign in to the admin panel."
            );
          }
        }

        const { data, error } = await client.rpc(
          "ri_lab_settings",
          {
            p_enabled: enabled
          }
        );

        if (error) throw error;

        if (typeof data?.enabled !== "boolean") {
          throw new Error(
            "Invalid Lab configuration."
          );
        }

        $("riLabAdminState").textContent =
          data.enabled
            ? "ON — Exit Lab is available to visitors."
            : "OFF — Exit Lab is locked.";

        $("riLabAdminTime").textContent =
          `Updated: ${data.updated_at || "—"}. ` +
          "Server changes apply within 5 seconds; " +
          "navigation within 20 seconds.";
      } catch (error) {
        $("riLabAdminState").textContent =
          error.message ||
          "Lab settings could not be saved.";
      } finally {
        busy = false;

        panel.querySelectorAll("button").forEach(
          button => {
            button.disabled = false;
          }
        );
      }
    }

    $("riLabOn").onclick =
      () => settings(true);

    $("riLabOff").onclick =
      () => settings(false);

    $("riLabRead").onclick =
      () => settings();

    document.addEventListener(
      "bagvyr:admin-section",
      event => {
        if (event.detail?.section === "lab") {
          void settings();
        }
      }
    );

    window.addEventListener(
      "bagvyr-admin-ready",
      () => {
        if (!$("labSection").hidden) {
          void settings();
        }
      }
    );
  }

  /* =====================================================
     PUBLIC LAB
     ===================================================== */

  function startPublic() {
    const root = $("riLabRoot");

    if (!root) return;

    root.innerHTML = `
      <div class="lab-heading">
        <span class="lab-kicker">
          RUGINSPECT / TOOLS
        </span>

        <h1>Exit Lab</h1>

        <p>
          See how a hypothetical sell could affect a token.
        </p>
      </div>

      <div
        id="labLocked"
        class="lab-card"
        role="status"
      >
        Checking availability…
      </div>

      <div id="labOpen" hidden>
        <form id="labForm" class="lab-search">
          <input
            id="labCA"
            aria-label="Solana contract address"
            placeholder="Paste a Solana contract address"
            autocomplete="off"
            spellcheck="false"
            required
          >

          <button id="labLoad" type="submit">
            Load token
          </button>
        </form>

        <p
          id="labStatus"
          class="lab-muted"
          role="status"
          aria-live="polite"
        >
          Enter a CA to begin.
        </p>

        <div id="labToken" hidden>
          <div class="lab-market lab-card">
            <div>
              <strong id="labName">—</strong>

              <button
                id="labCopy"
                class="lab-quiet"
                type="button"
              >
                Copy CA
              </button>

              <small id="labSymbol"></small>
            </div>

            <div>
              <small>PRICE</small>
              <strong id="labPrice">—</strong>
            </div>

            <div>
              <small>MARKET CAP</small>
              <strong id="labMC">—</strong>
            </div>

            <div>
              <small>LIQUIDITY</small>
              <strong id="labLiquidity">—</strong>
            </div>

            <p
              id="labMarketTime"
              class="lab-muted"
            >
              Loading market…
            </p>
          </div>

          <div class="lab-grid">
            <section class="lab-card">
              <div class="lab-title">
                <h2>Top 10 holders</h2>

                <div>
                  <button
                    id="labAll"
                    type="button"
                    class="lab-quiet"
                  >
                    Select all
                  </button>

                  <button
                    id="labClear"
                    type="button"
                    class="lab-quiet"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <p
                id="labHolderNote"
                class="lab-muted"
              ></p>

              <p
                id="labHolderTime"
                class="lab-muted"
              ></p>

              <div class="lab-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Select</th>
                      <th>Wallet</th>
                      <th>Tokens ≈</th>
                      <th>Supply</th>
                      <th>Sell</th>
                    </tr>
                  </thead>

                  <tbody id="labRows"></tbody>
                </table>
              </div>

              <p class="lab-muted">
                Only available reported owners are listed.
                Missing holders are not treated as zero.
              </p>
            </section>

            <section class="lab-card">
              <span class="lab-kicker">
                HOLDER SCENARIO
              </span>

              <h2>What if they sell?</h2>

              <p id="labSelection">
                Choose one or more wallets.
              </p>

              <button
                id="labRun"
                type="button"
              >
                Run simulation
              </button>

              <div
                id="labCombinedResult"
                class="lab-result"
                role="status"
                aria-live="polite"
              >
                Your estimate will appear here.
              </div>
            </section>
          </div>

          <section class="lab-card lab-personal">
            <div>
              <span class="lab-kicker">
                YOUR POSITION
              </span>

              <h2>What if I sell?</h2>

              <p class="lab-muted">
                Independent scenario.
                No wallet connection needed.
              </p>
            </div>

            <form
              id="labOwnForm"
              class="lab-own-inputs"
            >
              <label>
                Amount

                <input
                  id="labOwnAmount"
                  inputmode="decimal"
                  autocomplete="off"
                  placeholder="e.g. 100000"
                  required
                >
              </label>

              <label>
                Unit

                <select id="labOwnMode">
                  <option value="tokens">
                    Tokens
                  </option>

                  <option value="usd">
                    USD at reference price
                  </option>
                </select>
              </label>

              <label>
                Sell portion

                <select id="labOwnPortion">
                  <option value="100">100%</option>
                  <option value="50">50%</option>
                  <option value="25">25%</option>
                </select>
              </label>

              <button
                id="labOwnRun"
                type="submit"
              >
                Check sell value
              </button>
            </form>

            <div
              id="labOwnResult"
              class="lab-result"
              role="status"
              aria-live="polite"
            >
              Enter your position to estimate the sale.
            </div>
          </section>

<section class="lab-card">
  <span class="lab-kicker">
    POSITION CALCULATOR
  </span>

  <h2>What would my tokens be worth?</h2>

  <form
    id="labTargetForm"
    class="lab-own-inputs"
  >
    <label>
      Tokens I hold

      <input
        id="labTargetTokens"
        inputmode="decimal"
        autocomplete="off"
        placeholder="e.g. 1000000"
        required
      >
    </label>

    <label>
      Target market cap (USD)

      <input
        id="labTargetMC"
        inputmode="decimal"
        autocomplete="off"
        placeholder="e.g. 5000000"
        required
      >
    </label>

    <button type="submit">
      Calculate value
    </button>
  </form>

  <div
    class="lab-result"
    role="status"
    aria-live="polite"
  >
    <div>
      <span>Token price at target MC</span>
      <strong id="labTargetPrice">—</strong>
    </div>

    <div>
      <span>Your position at target MC</span>
      <strong id="labTargetValue">—</strong>
    </div>

    <div>
      <span>Current position value</span>
      <strong id="labTargetCurrent">—</strong>
    </div>

    <div>
      <span>Change from current value</span>
      <strong id="labTargetChange">—</strong>
    </div>
  </div>

  <p
    id="labTargetStatus"
    class="lab-muted"
  >
    Enter your token amount and a target market cap.
  </p>

  <p class="lab-muted">
    Estimated position value assuming unchanged circulating supply.
    Actual sale proceeds depend on liquidity, fees and price impact.
    Use a decimal point and enter numbers without thousands separators.
  </p>
</section>

          <p class="lab-muted">
            Hypothetical estimates only.
            No trades are executed.
            Combined holders are quoted as one aggregate sale,
            not a prediction of their trading order.
            Prices, liquidity and holder balances can change.
            Quotes do not guarantee execution.
          </p>
        </div>
      </div>
    `;

    const state = {
      enabled: false,
      token: null,
      ca: "",
      market: null,
      selected: new Set(),
      portions: new Map(),
      generation: 0,

      revisions: {
        own: 0,
        combined: 0
      },

      controllers: new Set(),
      marketTimer: null,
      marketBusy: false,
      marketFailures: 0,
      statusBusy: false,
      combinedBusy: false,
      ownBusy: false
    };

    const active = () =>
      state.enabled &&
      location.hash === "#lab" &&
      !document.hidden;

    const text = (id, value) => {
      $(id).textContent = value;
    };

    async function api(
      path,
      params = {},
      timeout = 15000
    ) {
      const controller = new AbortController();

      state.controllers.add(controller);

      const timer = setTimeout(
        () => controller.abort(),
        timeout
      );

      try {
        const response = await fetch(
          `${API}${path}?${new URLSearchParams(params)}`,
          {
            headers: {
              Accept: "application/json"
            },

            cache: "no-store",
            signal: controller.signal
          }
        );

        const data = await response.json();

        if (data?.enabled === false) {
          setEnabled(false);
        }

        if (
          !response.ok ||
          data?.success !== true
        ) {
          throw new Error(
            data?.error || "Request failed."
          );
        }

        return data;
      } finally {
        clearTimeout(timer);
        state.controllers.delete(controller);
      }
    }

    function stop() {
      if (state.combinedBusy) {
        resetResult("combined");
      }

      if (state.ownBusy) {
        resetResult("own");
      }

      state.generation++;

      clearTimeout(state.marketTimer);

      state.marketTimer = null;

      state.controllers.forEach(
        controller => controller.abort()
      );

      state.marketBusy = false;
      state.combinedBusy = false;
      state.ownBusy = false;

      $("labLoad").disabled = false;
      $("labRun").disabled = false;
      $("labOwnRun").disabled = false;
    }

    function setEnabled(enabled) {
      const changed =
        state.enabled !== enabled;

      state.enabled = enabled;

      document.querySelectorAll(
        "[data-lab-link]"
      ).forEach(element => {
        element.hidden = !enabled;
      });

      $("labLocked").hidden = enabled;
      $("labOpen").hidden = !enabled;

      text(
        "labLocked",
        "Exit Lab is not available yet. Come back after launch."
      );

      if (!enabled) {
        stop();

        state.token = null;
        state.market = null;

        $("labToken").hidden = true;
      } else if (
        changed &&
        active() &&
        state.token
      ) {
        scheduleMarket(0);
      }
    }

    async function checkStatus() {
      if (
        state.statusBusy ||
        document.hidden
      ) {
        return;
      }

      state.statusBusy = true;

      try {
        const response = await fetch(
          `${API}/api/lab/status`,
          {
            cache: "no-store",

            signal: AbortSignal.timeout(7000)
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          data.success !== true ||
          typeof data.enabled !== "boolean"
        ) {
          throw new Error();
        }

        setEnabled(data.enabled);
      } catch {
        setEnabled(false);

        text(
          "labLocked",
          "Unable to check Lab availability. Retrying automatically…"
        );
      } finally {
        state.statusBusy = false;
      }
    }

    function resetResult(kind) {
      text(
        kind === "own"
          ? "labOwnResult"
          : "labCombinedResult",

        "Inputs changed. Run the simulation for a new estimate."
      );
    }

    function selectedRaw() {
      let sum = 0n;

      for (
        const row of state.token?.holders || []
      ) {
        if (
          state.selected.has(row.owner) &&
          row.amount_raw
        ) {
          const portion =
            state.portions.get(row.owner) || 100;

          sum +=
            BigInt(row.amount_raw) *
            BigInt(portion) /
            100n;
        }
      }

      return sum;
    }

    function selectionChanged() {
      state.revisions.combined++;

      resetResult("combined");

      const raw = selectedRaw();

      const quantity =
        Number(raw) /
        10 ** state.token.token.decimals;

      text(
        "labSelection",

        `${state.selected.size} selected · ` +
        `≈ ${number(quantity)} tokens to sell`
      );
    }

    function renderRows() {
      const rows = state.token.holders;

      $("labRows").innerHTML = rows.length
        ? rows.map((row, index) => {
            const portion =
              state.portions.get(row.owner) || 100;

            const quantity = row.amount_raw
              ? Number(row.amount_raw) /
                10 ** state.token.token.decimals
              : null;

            return `
              <tr>
                <td>
                  <input
                    type="checkbox"
                    data-holder="${esc(row.owner)}"
                    aria-label="Select holder ${index + 1}"
                    ${row.amount_raw ? "" : "disabled"}
                    ${state.selected.has(row.owner) ? "checked" : ""}
                  >
                </td>

                <td>
                  <a
                    href="https://solscan.io/account/${esc(row.owner)}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    ${index + 1}.
                    ${esc(row.owner.slice(0, 5))}…${esc(row.owner.slice(-5))}
                  </a>
                </td>

                <td>
                  ${
                    row.amount_raw
                      ? number(quantity)
                      : "Unavailable"
                  }
                </td>

                <td>
                  ${
                    finite(row.percentage)
                      ? row.percentage.toFixed(2) + "%"
                      : "—"
                  }
                </td>

                <td>
                  <select
                    data-portion="${esc(row.owner)}"
                    aria-label="Sell portion for holder ${index + 1}"
                    ${row.amount_raw ? "" : "disabled"}
                  >
                    ${
                      [100, 50, 25].map(value => `
                        <option
                          value="${value}"
                          ${portion === value ? "selected" : ""}
                        >
                          ${value}%
                        </option>
                      `).join("")
                    }
                  </select>
                </td>
              </tr>
            `;
          }).join("")

        : `
          <tr>
            <td colspan="5">
              Holder data unavailable for this token.
              You can still check your own position.
            </td>
          </tr>
        `;
    }

    async function loadToken(event) {
      event.preventDefault();

      const ca = $("labCA").value.trim();

      if (!ADDRESS.test(ca)) {
        text(
          "labStatus",
          "Enter a valid Solana contract address."
        );

        return;
      }

      if (!active()) return;

      stop();

      const generation = state.generation;

state.ca = ca;
state.token = null;
state.market = null;

$("labTargetTokens").value = "";
$("labTargetMC").value = "";

updateTargetValue();
      state.selected.clear();
      state.portions.clear();
      state.marketFailures = 0;
      state.revisions.own++;
      state.revisions.combined++;

      $("labToken").hidden = true;
      $("labLoad").disabled = true;

      text(
        "labStatus",
        "Loading token and reported holders…"
      );

      try {
        const data = await api(
          "/api/lab/token",
          { ca },
          60000
        );

        if (
          generation !== state.generation ||
          !active()
        ) {
          return;
        }

        if (
          data.contract !== ca ||
          !data.token ||
          !Array.isArray(data.holders)
        ) {
          throw new Error(
            "Invalid token response."
          );
        }

        state.token = data;

        data.holders = data.holders
          .filter(row =>
            ADDRESS.test(row.owner) &&
            (
              row.amount_raw === null ||
              /^\d{1,20}$/.test(row.amount_raw)
            )
          )
          .slice(0, 10);

        text(
          "labName",
          data.token.name || "Unknown token"
        );

        text("labCopy", "Copy CA");

        text(
          "labSymbol",
          data.token.symbol || "—"
        );

        text(
          "labHolderNote",

          data.holder_note ||
          "Provider balance snapshot. Known infrastructure excluded."
        );

        text(
          "labHolderTime",

          `Snapshot received: ${time(data.holders_as_of)} · ` +
          "Load token again to refresh holders."
        );

        [
          "labPrice",
          "labMC",
          "labLiquidity"
        ].forEach(id => text(id, "—"));

        text(
          "labMarketTime",
          "Loading market…"
        );

        text(
          "labCombinedResult",
          "Your estimate will appear here."
        );

        text(
          "labOwnResult",
          "Enter your position to estimate the sale."
        );

        text(
          "labSelection",
          "Choose one or more wallets."
        );

        renderRows();

        $("labToken").hidden = false;

        text(
          "labStatus",
          "Token loaded. Choose holders or enter your position."
        );

        scheduleMarket(0);
      } catch (error) {
        if (generation === state.generation) {
          text(
            "labStatus",

            error.name === "AbortError"
              ? "Loading stopped or timed out. Try again."
              : error.message
          );
        }
      } finally {
        if (generation === state.generation) {
          $("labLoad").disabled = false;
        }
      }
    }

    function scheduleMarket(delay = 1000) {
      clearTimeout(state.marketTimer);

      if (
        active() &&
        state.token &&
        !state.marketBusy
      ) {
        state.marketTimer = setTimeout(
          pollMarket,
          delay
        );
      }
    }

    async function pollMarket() {
      if (
        !active() ||
        !state.token ||
        state.marketBusy
      ) {
        return;
      }

      state.marketBusy = true;

      const generation = state.generation;
      const ca = state.ca;
      const started = Date.now();

      try {
        const data = await api(
          "/api/lab/market",
          { ca }
        );

        if (
          generation !== state.generation ||
          !active()
        ) {
          return;
        }

        if (
          data.contract !== ca ||
          !finite(data.price) ||
          data.price <= 0
        ) {
          throw new Error(
            "Market data unavailable."
          );
        }

state.market = data;
state.marketFailures = 0;

updateTargetValue();

        text(
          "labPrice",
          money(data.price)
        );

        text(
          "labMC",
          money(data.market_cap)
        );

        text(
          "labLiquidity",
          money(data.liquidity)
        );

        text(
          "labMarketTime",

          `DexScreener fetched ${time(data.fetched_at)} · ` +
          "Refresh target 1s; provider may update slower."
        );
      } catch {
        if (generation === state.generation) {
          state.marketFailures++;
          updateTargetValue();

          text(
            "labMarketTime",

            "Market refresh failed · " +
            `Last fetch ${time(state.market?.fetched_at)} · ` +
            "Retrying with backoff."
          );
        }
      } finally {
        if (generation === state.generation) {
          state.marketBusy = false;

          const delay = state.marketFailures
            ? Math.min(
                30000,

                5000 * 2 ** Math.min(
                  state.marketFailures - 1,
                  3
                )
              )
            : Math.max(
                0,
                1000 - (Date.now() - started)
              );

          scheduleMarket(delay);
        }
      }
    }

function updateTargetValue() {
  const outputIDs = [
    "labTargetPrice",
    "labTargetValue",
    "labTargetCurrent",
    "labTargetChange"
  ];

  outputIDs.forEach(id => text(id, "—"));

  const holding =
    $("labTargetTokens").value.trim();

  const targetText =
    $("labTargetMC").value.trim();

  if (!holding || !targetText) {
    text(
      "labTargetStatus",
      "Enter your token amount and a target market cap."
    );

    return;
  }

  try {
    if (!state.enabled || !state.token) {
      throw new Error(
        "Load a token first."
      );
    }

    if (
      !/^\d+(?:\.\d+)?$/.test(targetText) ||
      targetText.length > 40
    ) {
      throw new Error(
        "Enter a positive target market cap without separators."
      );
    }

    const targetMC = Number(targetText);

    if (
      !Number.isFinite(targetMC) ||
      targetMC <= 0
    ) {
      throw new Error(
        "Target market cap must be greater than zero."
      );
    }

    const decimals =
      state.token.token.decimals;

    const raw = toRaw(
      holding,
      decimals
    );

    const supply =
      state.token.token.supply_raw;

    if (
      supply &&
      raw > BigInt(supply)
    ) {
      throw new Error(
        "Your holding exceeds the reported token supply."
      );
    }

    const market = state.market;

    const fetchedAt =
      Date.parse(market?.fetched_at);

    if (
      !market ||
      !finite(market.price) ||
      market.price <= 0 ||
      !finite(market.market_cap) ||
      market.market_cap <= 0 ||
      !Number.isFinite(fetchedAt) ||
      Date.now() - fetchedAt > 15000
    ) {
      throw new Error(
        "Waiting for a fresh reference price and market cap."
      );
    }

    const quantity =
      Number(raw) / 10 ** decimals;

    const targetPrice =
      market.price *
      (targetMC / market.market_cap);

    const targetValue =
      quantity * targetPrice;

    const currentValue =
      quantity * market.price;

    const change =
      targetValue - currentValue;

    const changePct =
      (targetMC / market.market_cap - 1) * 100;

    if (
      !finite(targetPrice) ||
      targetPrice <= 0 ||
      !finite(targetValue) ||
      !finite(currentValue) ||
      !Number.isFinite(changePct)
    ) {
      throw new Error(
        "These inputs are outside the supported range."
      );
    }

    const sign =
      change < 0 ? "−" : "+";

    text(
      "labTargetPrice",
      money(targetPrice)
    );

    text(
      "labTargetValue",
      money(targetValue)
    );

    text(
      "labTargetCurrent",
      money(currentValue)
    );

    text(
      "labTargetChange",

      sign +
      money(Math.abs(change)) +
      ` (${sign}${Math.abs(changePct).toFixed(2)}%)`
    );

    text(
      "labTargetStatus",

      `Target MC: ${money(targetMC)} · ` +
      `Reference MC: ${money(market.market_cap)} · ` +
      `Reference fetched: ${time(market.fetched_at)}`
    );
  } catch (error) {
    text(
      "labTargetStatus",
      error.message || "Calculation unavailable."
    );
  }
}

    function ownRaw() {
      const decimals =
        state.token?.token?.decimals;

      let value =
        $("labOwnAmount").value.trim();

      if ($("labOwnMode").value === "usd") {
        if (!/^\d+(?:\.\d+)?$/.test(value)) {
          throw new Error(
            "Enter a positive USD amount."
          );
        }

        if (
          !state.market ||
          Date.now() -
            Date.parse(state.market.fetched_at) >
            15000
        ) {
          throw new Error(
            "Wait for a fresh reference price."
          );
        }

        if (
          !Number.isInteger(decimals) ||
          decimals < 0 ||
          decimals > 18
        ) {
          throw new Error(
            "Token decimals unavailable."
          );
        }

        value = (
          Number(value) / state.market.price
        ).toFixed(decimals);
      }

      return (
        toRaw(value, decimals) *
        BigInt($("labOwnPortion").value) /
        100n
      );
    }

    async function simulate(kind) {
      const resultID = kind === "own"
        ? "labOwnResult"
        : "labCombinedResult";

      const busyKey = kind === "own"
        ? "ownBusy"
        : "combinedBusy";

      const button = $(
        kind === "own"
          ? "labOwnRun"
          : "labRun"
      );

      if (
        !active() ||
        !state.token ||
        state[busyKey]
      ) {
        return;
      }

      let raw;

      try {
        raw = kind === "own"
          ? ownRaw()
          : selectedRaw();

        if (raw <= 0n || raw > U64) {
          throw new Error(
            "Choose a positive amount within the supported range."
          );
        }

        const supply =
          state.token.token.supply_raw;

        if (
          supply &&
          raw > BigInt(supply)
        ) {
          throw new Error(
            "Selected amount exceeds the reported token supply."
          );
        }
      } catch (error) {
        text(resultID, error.message);
        return;
      }

      const generation = state.generation;
      const revision = state.revisions[kind];
      const ca = state.ca;

      const market = state.market
        ? { ...state.market }
        : null;

      const freshMarket =
        market &&
        Date.now() -
          Date.parse(market.fetched_at) <=
          15000;

      state[busyKey] = true;
      button.disabled = true;

      text(
        resultID,
        "Checking the route and pool model…"
      );

      try {
        const result = await api(
          "/api/sell-quote",

          {
            ca,
            amount: raw.toString()
          },

          30000
        );

        if (
          generation !== state.generation ||
          revision !== state.revisions[kind] ||
          !active()
        ) {
          return;
        }

        if (
          result.contract !== ca ||
          result.amount !== raw.toString()
        ) {
          throw new Error(
            "Quote does not match this request."
          );
        }

        if (result.status === "no_route") {
          throw new Error(
            "No route found for this amount. Try a smaller portion."
          );
        }

        const quote = result.quote;

        if (
          result.status !== "available" ||
          quote?.inAmount !== raw.toString() ||
          !/^[1-9]\d*$/.test(quote?.outAmount) ||
          quote.outputDecimals !== 6
        ) {
          throw new Error(
            "Invalid quote response."
          );
        }

        const proceeds =
          Number(quote.outAmount) / 1e6;

        if (!finite(proceeds)) {
          throw new Error(
            "Invalid quoted output."
          );
        }

const mcReport = result.mcModel;

const model =
  mcReport?.method ===
    "per_pool_constant_product_no_fee" &&
  Array.isArray(mcReport.pools)

    ? mcReport.pools.find(
        pool => pool.pool === market?.pair
      )

    : null;

const modeled =
  freshMarket &&
  finite(market.market_cap) &&
  market.market_cap > 0 &&
  model?.protocol === "PumpSwap" &&
  finite(model.priceRatio) &&
  model.priceRatio <= 1;

        const quantity =
          Number(raw) /
          10 ** state.token.token.decimals;

        const reference =
          finite(quote.inUsdValue)
            ? quote.inUsdValue
            : freshMarket
              ? quantity * market.price
              : null;

const fields = [
  [
    "Amount sold ≈",
    number(quantity) + " tokens"
  ],

  [
    "Estimated proceeds",
    number(proceeds) + " USDC"
  ],

  [
    "Reference value",
    money(reference)
  ],

  [
    "Quote price impact",

    typeof quote.priceImpact === "number" &&
    Number.isFinite(quote.priceImpact)

      ? quote.priceImpact.toFixed(2) + "%"
      : "—"
  ],

  [
    "Reference MC",

    freshMarket
      ? money(market.market_cap)
      : "—"
  ],

  [
    "Sale through reference pool",

    modeled && finite(model.inputSharePct)
      ? model.inputSharePct.toFixed(2) + "%"
      : "—"
  ],

  [
    "Reference pool MC after",

    modeled
      ? money(
          market.market_cap *
          model.priceRatio
        )
      : "—"
  ],

  [
    "Reference pool drop",

    modeled
      ? "−" +
        (
          (1 - model.priceRatio) * 100
        ).toFixed(2) +
        "%"
      : "—"
  ]
];

        $(resultID).replaceChildren();

        for (const [label, value] of fields) {
          const line =
            document.createElement("div");

          const title =
            document.createElement("span");

          const output =
            document.createElement("strong");

          title.textContent = label;
          output.textContent = value;

          line.append(title, output);

          $(resultID).append(line);
        }

        const note =
          document.createElement("p");

        note.className = "lab-muted";

note.textContent =
  (
    modeled
      ? `MC is modeled only for the reference PumpSwap pool (${model.pool}). ` +
        "Uses the share of this sale routed into that pool. " +
        "Not a combined market-wide price. "

      : "MC model unavailable: the reference pool may be " +
        "unsupported, absent from this route, " +
        "or its data unavailable. "
  ) +

  "USDC proceeds cover the full quoted route. " +

  "MC model excludes fees, arbitrage and other trades. " +

  `Quote: ${time(result.measured_at)}. ` +

  `Reference fetched: ${time(market?.fetched_at)}. ` +

  "Fixed snapshot; run again to refresh.";

        $(resultID).append(note);
      } catch (error) {
        if (
          generation === state.generation &&
          revision === state.revisions[kind]
        ) {
          text(
            resultID,

            error.name === "AbortError"
              ? "Quote stopped or timed out. Try again."
              : error.message
          );
        }
      } finally {
        if (generation === state.generation) {
          state[busyKey] = false;
          button.disabled = false;
        }
      }
    }

    /* ===================================================
       EVENTS
       =================================================== */

    $("labForm").addEventListener(
      "submit",
      loadToken
    );

    $("labRows").addEventListener(
      "change",
      event => {
        const target = event.target;

        if (target.dataset.holder) {
          if (target.checked) {
            state.selected.add(
              target.dataset.holder
            );
          } else {
            state.selected.delete(
              target.dataset.holder
            );
          }
        }

        if (
          target.dataset.portion &&
          ["25", "50", "100"].includes(target.value)
        ) {
          state.portions.set(
            target.dataset.portion,
            Number(target.value)
          );
        }

        selectionChanged();
      }
    );

    $("labAll").onclick = () => {
      state.token.holders.forEach(row => {
        if (row.amount_raw) {
          state.selected.add(row.owner);
        }
      });

      renderRows();
      selectionChanged();
    };

    $("labClear").onclick = () => {
      state.selected.clear();

      renderRows();
      selectionChanged();
    };

    $("labRun").onclick =
      () => simulate("combined");

    $("labOwnForm").onsubmit = event => {
      event.preventDefault();

      void simulate("own");
    };

    $("labOwnForm").addEventListener(
      "input",
      () => {
        state.revisions.own++;

        resetResult("own");
      }
    );

$("labTargetForm").addEventListener(
  "input",
  updateTargetValue
);

$("labTargetForm").addEventListener(
  "submit",
  event => {
    event.preventDefault();

    updateTargetValue();
  }
);

    $("labCopy").onclick = async () => {
      try {
        await navigator.clipboard.writeText(
          state.ca
        );

        text("labCopy", "Copied");
      } catch {
        text(
          "labStatus",
          `Copy CA: ${state.ca}`
        );
      }
    };

    function visibilityChanged() {
      stop();

      if (!document.hidden) {
        void checkStatus();
      }

      if (active() && state.token) {
        scheduleMarket(0);
      }
    }

    window.addEventListener(
      "hashchange",
      visibilityChanged
    );

    document.addEventListener(
      "visibilitychange",
      visibilityChanged
    );

    setInterval(() => {
      if (!document.hidden) {
        void checkStatus();
      }
    }, 15000);

    void checkStatus();
  }

  function init() {
    startAdmin();
    startPublic();
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