(() => {
  "use strict";

  if (window.RI_BONDING_LOADED) return;

  window.RI_BONDING_LOADED = true;

  const API =
    "https://bagvyr-api.megafunhousetv.workers.dev/api/launch-status";

  const ADDRESS =
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

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

  const svg = body =>
    '<svg viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="1.7" ' +
    'stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true">' +
    body +
    "</svg>";

  const chart = svg(
    '<path d="m3 18 6-6 4 3 8-12M16 3h5v5"/>'
  );

  const check = svg(
    '<circle cx="12" cy="12" r="9"/>' +
    '<path d="m8 12 3 3 5-6"/>'
  );

  const clock = svg(
    '<circle cx="12" cy="12" r="9"/>' +
    '<path d="M12 7v5l3 2"/>'
  );

  let ca = "";
  let revision = 0;

  let timer;
  let expiryTimer;
  let controller;
  let quickRetries = 0;

  function root() {
    let element =
      document.getElementById(
        "riBondingStatus"
      );

    if (!element) {
      const links =
        document.querySelector(
          "#resultsSection " +
          ".ri-token-header-v2 " +
          ".token-links"
        );

      if (!links) return null;

      element =
        document.createElement("div");

      element.id =
        "riBondingStatus";

      element.className =
        "ri-bonding";

      element.hidden = true;

      element.setAttribute(
        "aria-live",
        "polite"
      );

      links.appendChild(element);
    }

    return element;
  }

  function showLoading() {
    const element = root();

    if (!element) return;

    element.dataset.state = "loading";
    element.title = "";

    element.setAttribute(
      "aria-busy",
      "true"
    );

    element.innerHTML = `
      <span class="ri-bonding__icon">
        <span
          class="ri-bonding__spinner"
          aria-hidden="true"
        ></span>
      </span>

      <div class="ri-bonding__content">
        <strong>
          Checking launch status…
        </strong>

        <small>
          Loading bonding curve information
        </small>
      </div>
    `;

    element.hidden = false;
  }

  function render(data) {
    const element = root();

    if (!element) return;

    element.setAttribute(
      "aria-busy",
      "false"
    );

    clearTimeout(expiryTimer);

    const fetched = Date.parse(
      data.fetched_at || ""
    );

    const age =
      Date.now() - fetched;

    if (
      !Number.isFinite(fetched) ||
      age > 90000 ||
      age < -60000
    ) {
      element.hidden = true;
      return;
    }

    let body = "";

    element.dataset.state =
      data.status;

    if (
      data.status === "bonding" &&
      typeof data.progress_percent ===
        "number" &&
      Number.isFinite(
        data.progress_percent
      ) &&
      data.progress_percent >= 0 &&
      data.progress_percent <= 100
    ) {
      const progress =
        data.progress_percent;

      const subtitle =
        data.quote_symbol
          ? "Paired with " +
            data.quote_symbol
          : "Launch progress";

      body = `
        <span class="ri-bonding__icon">
          ${chart}
        </span>

        <div class="ri-bonding__content">

          <div class="ri-bonding__row">
            <strong>
              Bonding curve
              <i aria-hidden="true"></i>
            </strong>

            <b>${progress.toFixed(2)}%</b>
          </div>

          <div
            class="ri-bonding__row ri-bonding__details"
          >
            <span>${esc(subtitle)}</span>

            <span>
              ${(100 - progress).toFixed(2)}% remaining
            </span>
          </div>

          <div
            class="ri-bonding__track"
            role="progressbar"
            aria-label="Bonding curve progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow="${progress}"
          >
            <span
              style="width:${progress}%"
            ></span>
          </div>

        </div>
      `;

    } else if (
      data.status === "migrated"
    ) {
      const names = {
        pumpswap: "PumpSwap",
        raydium: "Raydium",
        meteora: "Meteora",
        orca: "Orca"
      };

      body = `
        <span class="ri-bonding__icon">
          ${check}
        </span>

        <div class="ri-bonding__content">

          <strong>Migrated</strong>

          <small>
            Bonding curve completed ·
            ${esc(names[data.dex] || "AMM pool")}
          </small>

        </div>
      `;

    } else if (
      data.status === "migration_pending"
    ) {
      body = `
        <span class="ri-bonding__icon">
          ${clock}
        </span>

        <div class="ri-bonding__content">

          <strong>Migration pending</strong>

          <small>
            Curve completed · awaiting pool confirmation
          </small>

        </div>
      `;
    }

    if (!body) {
      element.hidden = true;
      return;
    }

    element.innerHTML = body;
    element.hidden = false;

    element.title =
      "Provider snapshot checked " +
      new Date(
        fetched
      ).toLocaleTimeString();

    expiryTimer = setTimeout(
      () => {
        element.hidden = true;
      },

      Math.max(
        1,
        90000 - age
      )
    );
  }

  async function refresh(current) {
    if (
      current !== revision ||
      !ca
    ) {
      return;
    }

    clearTimeout(timer);

    if (document.hidden) {
      timer = setTimeout(
        () => void refresh(current),
        60000
      );

      return;
    }

    controller?.abort();

    const active =
      new AbortController();

    controller = active;

    const element = root();

    if (
      element &&
      (
        element.hidden ||
        element.dataset.state === "loading"
      )
    ) {
      showLoading();
    }

    const timeout = setTimeout(
      () => active.abort(),
      25000
    );

    try {
      const response = await fetch(
        API +
          "?ca=" +
          encodeURIComponent(ca),

        {
          signal: active.signal
        }
      );

      if (!response.ok) {
        throw new Error(
          "Launch status unavailable."
        );
      }

      const data =
        await response.json();

      if (
        current !== revision
      ) {
        return;
      }

      if (
        data?.success !== true ||
        data.contract !== ca
      ) {
        throw new Error(
          "Launch status mismatch."
        );
      }

      render(data);
      quickRetries = 0;

    } catch {
      // Hide the initial loader if this request fails.
      // Keep an existing valid snapshot until it expires.
      if (
        current === revision &&
        controller === active
      ) {
        const element = root();

        if (
          element?.dataset.state ===
          "loading"
        ) {
          element.setAttribute(
            "aria-busy",
            "false"
          );

          element.hidden = false;

          const heading =
            element.querySelector("strong");

          const description =
            element.querySelector("small");

          if (heading) {
            heading.textContent =
              "Checking launch status…";
          }

          if (description) {
            description.textContent =
              "The data source is taking longer. Retrying shortly.";
          }
        }
      }

    } finally {
      clearTimeout(timeout);

      if (
        current === revision &&
        controller === active
      ) {
        let delay = 60000;

        const element = root();

        const waiting =
          element?.dataset.state ===
          "loading";

        if (waiting && quickRetries < 2) {
          quickRetries++;

          delay =
            quickRetries === 1
              ? 5000
              : 15000;

        } else if (waiting) {
          element.dataset.state =
            "unavailable";

          element.setAttribute(
            "aria-busy",
            "false"
          );

          const icon =
            element.querySelector(
              ".ri-bonding__icon"
            );

          const heading =
            element.querySelector(
              "strong"
            );

          const description =
            element.querySelector(
              "small"
            );

          if (icon) {
            icon.innerHTML = clock;
          }

          if (heading) {
            heading.textContent =
              "Launch status temporarily unavailable";
          }

          if (description) {
            description.textContent =
              "We’ll check again automatically.";
          }
        }

        timer = setTimeout(
          () => void refresh(current),
          delay
        );
      }
    }
  }

  function show(value) {
    const contract = String(
      value || ""
    ).trim();

    if (
      !ADDRESS.test(contract)
    ) {
      return;
    }

       ca = contract;
    quickRetries = 0;

    const current =
      ++revision;

    controller?.abort();

    clearTimeout(timer);
    clearTimeout(expiryTimer);

    const element = root();

    if (!element) return;

    showLoading();

    void refresh(current);
  }

  document.addEventListener(
    "ri:token-context",

    event => {
      show(
        event.detail?.ca
      );
    }
  );

  document.addEventListener(
    "visibilitychange",

    () => {
      if (
        !document.hidden &&
        ca
      ) {
        void refresh(revision);
      }
    }
  );

  function init() {
    show(
      document.getElementById(
        "tokenContract"
      )?.textContent
    );
  }

  if (
    document.readyState ===
    "loading"
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