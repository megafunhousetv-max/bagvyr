(() => {
  "use strict";

  function init() {
    const panel = document.querySelector(
      '#riPremiumRoot [data-tool="early_buyers"]'
    );

    if (!panel || panel.dataset.earlyReady) return;

    panel.dataset.earlyReady = "1";

    const API =
      "https://bagvyr-api.megafunhousetv.workers.dev";

    panel.innerHTML = `
      <div class="lab-card">
        <h2>Early Buyers</h2>

        <p>
       Earliest 50 distinct buyers in available launch history.
        </p>

        <form
          class="lab-search"
          id="riEarlyForm"
        >
          <label for="riEarlyMint">
            Solana token address
          </label>

          <input
            id="riEarlyMint"
            name="ca"
            required
            maxlength="44"
            placeholder="Paste token contract"
            autocomplete="off"
            spellcheck="false"
          >

          <button type="submit">
            Find early buyers
          </button>
        </form>

        <p
          id="riEarlyMessage"
          role="status"
          aria-live="polite"
        ></p>

        <div
          class="lab-table-wrap"
          id="riEarlyResults"
          hidden
        >
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Wallet</th>
                <th>First buy · tokens</th>
                <th>Held now · tokens</th>
                <th>First buy time</th>
                <th>Transaction</th>
              </tr>
            </thead>

            <tbody id="riEarlyRows"></tbody>
          </table>
        </div>
      </div>
    `;

    const form =
      panel.querySelector("form");

    const input =
      panel.querySelector("input");

    const button =
      panel.querySelector("button");

    const message =
      panel.querySelector("#riEarlyMessage");

    const results =
      panel.querySelector("#riEarlyResults");

    const body =
      panel.querySelector("tbody");

    let current = null;

    const active = () =>
      window.RI_PREMIUM?.isActive(
        "early_buyers"
      ) === true;

    const amount = value =>
      value === null
        ? "—"
        : new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 6
          }).format(Number(value));

    const short = value =>
      value.slice(0, 6) +
      "…" +
      value.slice(-6);

    function cell(row, value, url) {
      const td =
        document.createElement("td");

      if (url) {
        const a =
          document.createElement("a");

        a.textContent = value;
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";

        td.append(a);
      } else {
        td.textContent = value;
      }

      row.append(td);

      return td;
    }

function renderEarlyRows(rows) {
  body.replaceChildren();

  const allowed = new Set([
    "BUNDLE",
    "KOL",
    "SMART MONEY",
    "INSIDER"
  ]);

  for (const item of rows) {
    const row = document.createElement("tr");

    cell(row, String(item.rank));

    const wallet = cell(
      row,
      short(item.wallet),
      "https://solscan.io/account/" +
        encodeURIComponent(item.wallet)
    );

    if (item.developer) {
      wallet.append(
        document.createTextNode(" · DEV")
      );
    }

    const tags = Array.isArray(item.tags)
      ? [...new Set(item.tags)]
      : [];

    for (const tag of tags) {
      if (!allowed.has(tag)) continue;

      const badge =
        document.createElement("span");

      badge.textContent = tag;

      badge.style.cssText = [
        "display:inline-block",
        "margin:3px 0 3px 6px",
        "padding:3px 7px",
        "border:1px solid rgba(51,239,179,.25)",
        "border-radius:6px",
        "background:rgba(51,239,179,.08)",
        "color:#83f6ce",
        "font-size:10px",
        "font-weight:700",
        "line-height:1.3"
      ].join(";");

      wallet.append(badge);
    }

    const first = cell(
      row,
      amount(item.first_tokens)
    );

    first.title = item.first_tokens;

    const held = cell(
      row,
      amount(item.current_tokens)
    );

    held.title =
      item.current_tokens === null
        ? "Balance unavailable"
        : item.current_tokens +
          " · checked " +
          item.balance_checked_at;

    cell(
      row,
      new Date(item.first_at).toLocaleString()
    );

    cell(
      row,
      "View",
      "https://solscan.io/tx/" +
        encodeURIComponent(item.transaction)
    );

    body.append(row);
  }

  results.hidden = rows.length === 0;
}

    function sync() {
      const enabled = active();

      if (!enabled && current) {
        current.abort();
        current = null;
      }

      if (!enabled) {
        body.replaceChildren();
        results.hidden = true;
        message.textContent = "";
      }

      button.disabled =
        !enabled || !!current;
    }

    form.addEventListener(
      "submit",
      async event => {
        event.preventDefault();

        if (!active() || current) return;

        const mint =
          input.value.trim();

        if (
          !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/
            .test(mint)
        ) {
          message.textContent =
            "Enter a valid Solana token address.";

          return;
        }

        const controller =
          new AbortController();

        current = controller;

        const timeout = setTimeout(
          () => controller.abort(),
          180000
        );

        button.disabled = true;
        body.replaceChildren();
        results.hidden = true;

        message.textContent =
          "Loading launch buys and current balances…";

        try {
          const headers =
            await window.RI_PREMIUM
              .getHeaders();

          if (
            controller.signal.aborted
          ) {
            return;
          }

          const collected = [];
          const seenWallets = new Set();

          let data = null;
          let offset = 0;
          let balancesComplete = true;
          let labelChecksComplete = true;

          for (let batch = 0; batch < 3; batch++) {
            if (
              controller.signal.aborted ||
              !active() ||
              current !== controller
            ) {
              return;
            }

            const response = await fetch(
              API +
                "/api/early-buyers?ca=" +
                encodeURIComponent(mint) +
                "&offset=" +
                offset,
              {
                headers,
                signal: controller.signal,
                cache: "no-store"
              }
            );

            const chunk = await response.json();

            if (
              !response.ok ||
              chunk?.success !== true
            ) {
              throw new Error(
                chunk?.error ||
                "Early Buyers unavailable."
              );
            }

            if (
              chunk.contract !== mint ||
              chunk.offset !== offset ||
              chunk.requested !== 50 ||
              !Array.isArray(chunk.rows) ||
              chunk.rows.length > 20
            ) {
              throw new Error(
                "Invalid Early Buyers response."
              );
            }

            for (const item of chunk.rows) {
              if (
                !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/
                  .test(item.wallet || "") ||
                seenWallets.has(item.wallet) ||
                item.rank !== collected.length + 1
              ) {
                throw new Error(
                  "Invalid wallet order."
                );
              }

              seenWallets.add(item.wallet);
              collected.push(item);
            }

            balancesComplete =
              balancesComplete &&
              chunk.balances_complete === true;

            labelChecksComplete =
              labelChecksComplete &&
              chunk.label_checks_complete === true;

data = chunk;

renderEarlyRows(collected);

message.textContent =
  "Loaded " +
  collected.length +
  " / 50 wallets…";

            if (chunk.next_offset === null) {
              break;
            }

            if (
              chunk.rows.length !== 20 ||
              chunk.next_offset !== offset + 20 ||
              ![20, 40].includes(chunk.next_offset)
            ) {
              throw new Error(
                "Invalid wallet pagination."
              );
            }

            offset = chunk.next_offset;
          }

          data = {
            ...data,
            rows: collected,
            count: collected.length,
            balances_complete: balancesComplete,
            label_checks_complete: labelChecksComplete
          };

          if (
            !active() ||
            current !== controller
          ) {
            return;
          }

          if (
            !Array.isArray(data.rows)
          ) {
            throw new Error(
              "Invalid Early Buyers response."
            );
          }

renderEarlyRows(data.rows);

          message.textContent =
            (data.symbol || "Token") +
            " · " +
            data.count +
                        "/50 wallets · updated " +
            new Date(
              data.fetched_at
            ).toLocaleTimeString() +
            (
              data.history_complete
                ? ""
                : " · History scan limit reached; list is partial."
            ) +
            (
              data.balances_complete
                ? ""
                : " · Some balances unavailable (—)."
            );

        } catch (error) {
          if (
            current === controller &&
            active()
          ) {
const loaded = body.children.length;

results.hidden = loaded === 0;

message.textContent =
  loaded > 0
    ? "Loaded " + loaded +
      "/50 wallets. Remaining wallets could not be loaded. Click Load token to retry."
    : error.name === "AbortError"
      ? "Request timed out. Click Load token to retry."
      : error.message;
          }

        } finally {
          clearTimeout(timeout);

          if (
            current === controller
          ) {
            current = null;
          }

          sync();
        }
      }
    );

    document.addEventListener(
      "ri:premium-change",
      sync
    );

    let sharedEarlyContract = "";
    let sharedEarlyAttempt = "";

    function syncSharedEarly(event) {
      if (
        typeof window.RI_PREMIUM?.getContract
          !== "function"
      ) {
        return;
      }

      const contract =
        window.RI_PREMIUM.getContract();

      const reload =
        event?.type === "ri:premium-token";

      if (
        sharedEarlyContract !== contract ||
        reload
      ) {
        current?.abort();
        current = null;

        sharedEarlyContract = contract;
        sharedEarlyAttempt = "";

        body.replaceChildren();
        results.hidden = true;
        message.textContent = "";
      }

      sync();

      if (!active()) {
        sharedEarlyAttempt = "";
        return;
      }

      if (!contract) {
        message.textContent =
          "Enter a token address at the top of Premium.";

        return;
      }

      if (
        current ||
        sharedEarlyAttempt === contract
      ) {
        return;
      }

      sharedEarlyAttempt = contract;
      input.value = contract;

      form.requestSubmit();
    }

    document.addEventListener(
      "ri:premium-token",
      syncSharedEarly
    );

    document.addEventListener(
      "ri:premium-change",
      syncSharedEarly
    );

    syncSharedEarly();

    sync();
  }

  if (
    document.readyState === "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();