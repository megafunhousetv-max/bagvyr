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
          First 20 distinct wallets buying at launch.
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
          120000
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

          const response = await fetch(
            API +
              "/api/early-buyers?ca=" +
              encodeURIComponent(mint),
            {
              headers,
              signal: controller.signal,
              cache: "no-store"
            }
          );

          const data =
            await response.json();

          if (
            !response.ok ||
            !data.success
          ) {
            throw new Error(
              data.error ||
              "Early Buyers unavailable."
            );
          }

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

          for (const item of data.rows) {
            const row =
              document.createElement("tr");

            cell(
              row,
              String(item.rank)
            );

            const wallet = cell(
              row,
              short(item.wallet),
              "https://solscan.io/account/" +
                encodeURIComponent(
                  item.wallet
                )
            );

            if (item.developer) {
              wallet.append(
                document.createTextNode(
                  " · DEV"
                )
              );
            }

            const first = cell(
              row,
              amount(item.first_tokens)
            );

            first.title =
              item.first_tokens;

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
              new Date(
                item.first_at
              ).toLocaleString()
            );

            cell(
              row,
              "View",
              "https://solscan.io/tx/" +
                encodeURIComponent(
                  item.transaction
                )
            );

            body.append(row);
          }

          results.hidden = false;

          message.textContent =
            (data.symbol || "Token") +
            " · " +
            data.count +
            "/20 wallets · launch-aligned Pump.fun history · updated " +
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
            body.replaceChildren();
            results.hidden = true;

            message.textContent =
              error.name === "AbortError"
                ? "Request timed out. Try again."
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