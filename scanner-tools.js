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
    const body = root.querySelector("#rpBody");

    if (!overview || !trending || !body) return;

    root.dataset.embeddedToolsReady = "true";

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

    const smartOpener = navigation.querySelector(
      '[data-embedded-tool="smart_money"]'
    );

    let scannerContract = "";
    let trendingView = "trending";
    let syncing = false;

    function syncTrendingTabs(premium, onTrendingPage) {
      const tabs = trending.querySelector(".ri-trend-tabs");
      const allowed = premium.isAvailable("smart_money");

      if (!allowed) trendingView = "trending";

      const showingSmart =
        onTrendingPage &&
        allowed &&
        trendingView === "smart_money";

      trending.classList.toggle(
        "ri-showing-smart-money",
        showingSmart
      );

      if (!tabs) return showingSmart;

      let smartTab = tabs.querySelector(
        "[data-ri-smart-tab]"
      );

      if (!smartTab) {
        smartTab = document.createElement("button");
        smartTab.type = "button";
        smartTab.className = "ri-trend-tab";
        smartTab.dataset.riSmartTab = "true";
        smartTab.textContent = "Smart Money";

        smartTab.addEventListener("click", () => {
          if (
            !window.RI_PREMIUM?.isAvailable("smart_money")
          ) {
            return;
          }

          trendingView = "smart_money";
          sync();
        });

        tabs.append(smartTab);
      }

      smartTab.hidden = !allowed;

      smartTab.setAttribute(
        "aria-selected",
        String(showingSmart)
      );

      for (const button of tabs.querySelectorAll(
        ".ri-trend-tab:not([data-ri-smart-tab])"
      )) {
        if (showingSmart) {
          button.setAttribute("aria-selected", "false");
        } else if (button === tabs.querySelector(
          ".ri-trend-tab:not([data-ri-smart-tab])"
        )) {
          button.setAttribute("aria-selected", "true");
        }
      }

      return showingSmart;
    }

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

        const showingSmart = syncTrendingTabs(
          premium,
          view === "trending"
        );

        scannerHost.hidden = true;
        trendingHost.hidden = true;

        root.classList.toggle(
          "ri-embedded-smart-view",
          view === "trending"
        );

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

        if (view === "trending") {
          host.hidden = !showingSmart;

          const selected = premium.getSelectedTool();

          if (
            (showingSmart && selected !== "smart_money") ||
            (!showingSmart && selected === "smart_money")
          ) {
            // Použije pôvodné otvorenie/zatvorenie nástroja.
            smartOpener.click();
          }
        } else {
          host.hidden =
            visibleCount === 0 ||
            !scannerContract;
        }
      } finally {
        syncing = false;
      }
    }

    // Kliknutie na pôvodnú záložku Trending.
    trending.addEventListener("click", event => {
      const button = event.target.closest?.(
        ".ri-trend-tab"
      );

      if (
        !button ||
        button.hasAttribute("data-ri-smart-tab")
      ) {
        return;
      }

      trendingView = "trending";
      sync();
    }, true);

    // Trending pri obnove vytvára obsah znova.
    // Záložku preto obnovíme aj po jeho prekreslení.
    const observer = new MutationObserver(sync);

    observer.observe(trending, {
      childList: true
    });

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

    document.addEventListener("ri:premium-change", sync);
    document.addEventListener("ri:account-change", sync);

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