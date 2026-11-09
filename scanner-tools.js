(() => {
  "use strict";

  function init() {
    const root = document.getElementById("riPremiumRoot");

    if (
      !root ||
      root.hasAttribute("data-premium-admin") ||
      root.dataset.embeddedToolsReady
    ) {
      return;
    }

    const overview = document.querySelector(
      "#resultsSection .token-overview"
    );

    const trending = document.getElementById("trendingRoot");

    if (!overview || !trending) return;

    root.dataset.embeddedToolsReady = "true";

    // Uložíme pôvodné miesto Premium panelu.
    const originalPlace = document.createComment(
      "Original Premium panel position"
    );

    root.before(originalPlace);

    const scannerHost = document.createElement("div");
    scannerHost.id = "riScannerToolsHost";
    scannerHost.hidden = true;

    overview.after(scannerHost);

    const trendingHost = document.createElement("div");
    trendingHost.id = "riTrendingToolsHost";
    trendingHost.hidden = true;

    trending.after(trendingHost);

    const tools = [
      {
        key: "lab",
        title: "Exit Lab",
        description: "Simulate your exit",
        icon: "▦",
        view: "scanner"
      },
      {
        key: "volume",
        title: "Volume X-Ray",
        description: "Inspect trading volume",
        icon: "▥",
        view: "scanner"
      },
      {
        key: "early_buyers",
        title: "Early Buyers",
        description: "Explore first buyers",
        icon: "♧",
        view: "scanner"
      },
      {
        key: "smart_money",
        title: "Smart Money Radar",
        description: "Explore tracked smart money activity",
        icon: "◎",
        view: "trending"
      }
    ];

    const navigation = document.createElement("div");
    navigation.className = "ri-embedded-navigation";

    navigation.innerHTML = `
      <div class="ri-embedded-heading">
        <div>
          <h2 data-embedded-title>Premium analysis</h2>
          <p data-embedded-description></p>
        </div>

        <span
          class="ri-embedded-access"
          data-embedded-access
        ></span>
      </div>

      <div class="ri-embedded-tabs">
        ${tools.map(tool => `
          <button
            type="button"
            class="ri-embedded-tab"
            data-open="${tool.key}"
            data-embedded-tool="${tool.key}"
            aria-expanded="false"
            hidden
          >
            <span
              class="ri-embedded-icon"
              aria-hidden="true"
            >${tool.icon}</span>

            <span>
              <strong>${tool.title}</strong>
              <small>${tool.description}</small>
            </span>
          </button>
        `).join("")}
      </div>
    `;

    const body = root.querySelector("#rpBody");

    if (!body) return;

    body.before(navigation);

    const title = navigation.querySelector(
      "[data-embedded-title]"
    );

    const description = navigation.querySelector(
      "[data-embedded-description]"
    );

    const accessBadge = navigation.querySelector(
      "[data-embedded-access]"
    );

    let scannerContract = "";
    let syncing = false;

    function sync() {
      const premium = window.RI_PREMIUM;

      if (!premium || syncing) return;

      syncing = true;

      try {
        const view =
          location.hash === "#scanner"
            ? "scanner"
            : location.hash === "#trending"
              ? "trending"
              : null;

        premium.setEmbeddedView(view);

        scannerHost.hidden = true;
        trendingHost.hidden = true;

        if (!view) {
          root.classList.remove("ri-embedded-tools");

          originalPlace.after(root);
          navigation.hidden = true;

          return;
        }

        navigation.hidden = false;
        root.classList.add("ri-embedded-tools");

        const host =
          view === "scanner"
            ? scannerHost
            : trendingHost;

        if (root.parentElement !== host) {
          host.append(root);
        }

        if (view === "scanner") {
          premium.setEmbeddedContract(scannerContract);
        }

        const state = premium.getAccessState();

        const fullAccess =
          state.admin === true ||
          state.premium === true;

        title.textContent =
          view === "scanner"
            ? "Premium analysis"
            : "Smart Money Radar";

        description.textContent = fullAccess
          ? view === "scanner"
            ? "Advanced tools for the token you are analyzing."
            : "Explore tracked smart money activity."
          : "These tools are available to everyone for free. Additional tools are available with Premium when enabled.";

        accessBadge.textContent = state.admin
          ? "Admin access"
          : state.premium
            ? "Premium active"
            : "Free public access";

        let visibleCount = 0;

        for (const tool of tools) {
          const button = navigation.querySelector(
            `[data-embedded-tool="${tool.key}"]`
          );

          const visible =
            tool.view === view &&
            premium.isAvailable(tool.key);

          button.hidden = !visible;

          button.classList.toggle(
            "is-selected",
            premium.getSelectedTool() === tool.key
          );

          if (visible) visibleCount++;
        }

        host.hidden =
          visibleCount === 0 ||
          (view === "scanner" && !scannerContract);
      } finally {
        syncing = false;
      }
    }

    document.addEventListener(
      "ri:token-context",
      event => {
        const ca = event.detail?.ca;

        if (
          typeof ca !== "string" ||
          !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca)
        ) {
          return;
        }

        scannerContract = ca;

        sync();
      }
    );

    document.addEventListener(
      "ri:analysis-start",
      () => {
        scannerContract = "";

        if (location.hash === "#scanner") {
          window.RI_PREMIUM?.setEmbeddedContract("");
        }

        sync();
      }
    );

    document.addEventListener(
      "ri:premium-change",
      sync
    );

    document.addEventListener(
      "ri:account-change",
      sync
    );

    window.addEventListener("hashchange", sync);

    sync();
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