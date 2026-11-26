(() => {
  "use strict";

  const tabs = [
    ["overview", "Overview"],
    ["wallets", "Wallets"],
    ["market", "Exit & market"],
    ["token", "Token & fees"],
    ["project", "Project"]
  ];

  const tools = [
    ["lab", "Exit Lab"],
    ["volume", "Volume X-Ray"],
    ["early_buyers", "Early Buyers"]
  ];

  const crown = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="1.7" aria-hidden="true">
      <path d="m3 5 5 4 4-6 4 6 5-4-2 12H5L3 5zm3 15h12"/>
    </svg>
  `;

  const byId = id => document.getElementById(id);

  const fields = entries => entries.map(([label, id]) =>
    `<div><dt>${label}</dt><dd data-value-from="${id}">—</dd></div>`
  ).join("");

  let dashboard;

  function createDashboard(root, quick, layout, details) {
    const shell = document.createElement("div");
    shell.id = "riScannerAnalysis";

    shell.innerHTML = `
      <div class="rsa-bar">
        <div class="rsa-tabs" role="tablist" aria-label="Token analysis">
          ${tabs.map(([key, label]) => `
            <button type="button" role="tab" id="rsa-tab-${key}"
              data-view="${key}" aria-controls="rsa-${key}" aria-selected="false"
              tabindex="-1">${label}</button>
          `).join("")}
        </div>

        <div class="rsa-actions">
          ${tools.map(([key, label]) => `
            <button type="button" data-tool="${key}" aria-controls="rsa-premium"
              aria-label="${label}, Premium" aria-expanded="false" hidden>
              ${crown}<span>${label}</span>
            </button>
          `).join("")}
          <button type="button" data-view="trade" aria-controls="rsa-trade"
            aria-expanded="false" hidden>Trade</button>
        </div>
      </div>

      <section id="rsa-overview" role="tabpanel" aria-labelledby="rsa-tab-overview">
        <dl class="rsa-metrics">
          ${fields([
            ["Market cap", "marketCap"],
            ["Liquidity", "liveLiquidity"],
            ["24h volume", "liveVolume24h"],
            ["Price", "livePrice"],
            ["From peak", "dropFromPeak"],
            ["Holders", "holderCount"]
          ])}
        </dl>

        <div class="rsa-columns">
          <section class="rsa-card">
            <h3>Risk Signals</h3>
            <div class="rsa-finding">
              <strong data-risk-title></strong>
              <p data-risk-note></p>
            </div>
            <dl class="rsa-checks">
              ${fields([
                ["Top 10 holders", "highlightTop10"],
                ["Major exit", "exitMajorEvent"]
              ])}
            </dl>
            <div class="rsa-links">
              <button type="button" data-jump="wallets">Open Wallets →</button>
              <button type="button" data-score>Score breakdown →</button>
            </div>
          </section>

          <section class="rsa-card">
            <h3>Token Checks</h3>
            <dl class="rsa-checks">
              ${fields([
                ["Mint authority", "mintAuthorityStatus"],
                ["Freeze authority", "freezeAuthorityStatus"],
                ["Metadata", "metadataStatusDetail"]
              ])}
            </dl>
          </section>
        </div>
      </section>

      ${tabs.slice(1).map(([key]) => `
        <section id="rsa-${key}" role="tabpanel"
          aria-labelledby="rsa-tab-${key}" hidden></section>
      `).join("")}
      <section id="rsa-premium" aria-label="Premium analysis" hidden></section>
      <section id="rsa-trade" aria-label="Trade" hidden></section>
    `;

    const panels = Object.fromEntries(
      [...tabs.map(([key]) => key), "premium", "trade"]
        .map(key => [key, shell.querySelector(`#rsa-${key}`)])
    );
    const tabButtons = [...shell.querySelectorAll('[role="tab"]')];
    const toolButtons = [...shell.querySelectorAll(".rsa-actions [data-tool]")];
    const tradeButton = shell.querySelector('[data-view="trade"]');

    const sourcePanel = document.createElement("section");
    sourcePanel.className = "rsa-card";
    sourcePanel.innerHTML = `
      <h3>Project sources</h3>
      <div class="rsa-links" data-sources></div>
      <p data-checked></p>
    `;
    panels.project.append(sourcePanel);

    const groups = {
      overview: ["riskSignalsList"],
      wallets: [
        "tokenInfoSection",
        "holdersTableBody",
        "insiderNetworks",
        "bundlerHoldersSection",
        "creatorWallet"
      ],
      market: ["exitMajorEventDetail"],
      token: ["mintAuthorityStatus"]
    };

    const sectionGroups = Object.fromEntries(
      Object.entries(groups).map(([key, ids]) => [
        key,
        ids.map(id => byId(id)?.closest(".ri-analysis-accordion")).filter(Boolean)
      ])
    );
    const originalSections = [
      ...details.querySelectorAll(":scope > .ri-analysis-accordion")
    ];
    const fieldsToUpdate = [...shell.querySelectorAll("[data-value-from]")];
    const riskTitle = shell.querySelector("[data-risk-title]");
    const riskNote = shell.querySelector("[data-risk-note]");
    const sources = sourcePanel.querySelector("[data-sources]");
    const checked = sourcePanel.querySelector("[data-checked]");
    const context = byId("riTokenContext");
    const initialTrade = context?.previousElementSibling;
    const sidebar = layout.querySelector(".ri-overview-sidebar");
    const knownSections = Object.values(sectionGroups).flat();
    const openedTabs = new Set();

    let sourceSignature;
    let view = "overview";
    let currentTool = "";

    function move(node, destination) {
      if (node && node.parentElement !== destination) {
        destination.append(node);
      }
    }

    function setText(node, text) {
      if (node.textContent !== text) {
        node.textContent = text;
      }
    }

    function select(key, tool = "") {
      view = key;
      currentTool = tool;

      const utilityOpen = key === "premium" || key === "trade";

      tabButtons.forEach(button => {
        const active = button.dataset.view === key;
        const defaultTab = utilityOpen && button.dataset.view === "overview";
        button.setAttribute("aria-selected", String(active));
        button.tabIndex = active || defaultTab ? 0 : -1;
      });

      Object.entries(panels).forEach(([name, panel]) => {
        panel.hidden = name !== key;
      });

      toolButtons.forEach(button => {
        button.setAttribute("aria-expanded", String(tool === button.dataset.tool));
      });

      tradeButton.setAttribute("aria-expanded", String(key === "trade"));

      const visibleSections = sectionGroups[key] || [];
      originalSections.forEach(section => {
        section.hidden = !(
          visibleSections.includes(section) ||
          (key === "overview" && !knownSections.includes(section))
        );
      });

      details.hidden = !visibleSections.length;
      if (visibleSections.length) move(details, panels[key]);

      if (key === "wallets" && !openedTabs.has(key)) {
        const distribution = byId("tokenInfoSection")?.closest("details");
        if (distribution) distribution.open = true;
        openedTabs.add(key);
      }
    }

    function originalTool(key) {
      return byId("riScannerToolsHost")
        ?.querySelector(`[data-embedded-tool="${key}"]`);
    }

    function update() {
      const toolsHost = byId("riScannerToolsHost");
      move(toolsHost, panels.premium);

      toolButtons.forEach(button => {
        const original = originalTool(button.dataset.tool);
        const hidden = !original || toolsHost.hidden || original.hidden;
        if (button.hidden !== hidden) button.hidden = hidden;
      });

      const activeTool = toolButtons.find(button => button.dataset.tool === currentTool);
      if (activeTool?.hidden) select("overview");

      // trade.js can create a new panel beside Token Context on the next scan.
      const trade = context?.previousElementSibling;
      if (trade?.matches(".rt-trade")) move(trade, panels.trade);

      const tradeHidden = !panels.trade.querySelector(".rt-trade");
      if (tradeButton.hidden !== tradeHidden) tradeButton.hidden = tradeHidden;
      if (tradeHidden && view === "trade") select("overview");

      move(byId("riRiskSummary"), panels.project);

      fieldsToUpdate.forEach(field => {
        const value = byId(field.dataset.valueFrom)?.textContent.trim();
        setText(field, value && value !== "---" ? value : "—");
      });

      const risk = byId("riskSignalsList")?.firstElementChild;
      setText(
        riskTitle,
        risk?.querySelector("strong")?.textContent.trim() || "Risk signals unavailable"
      );
      setText(riskNote, risk?.querySelector("p")?.textContent.trim() || "");

      riskTitle.dataset.severity = risk?.classList.contains("ri-risk-high")
        ? "high"
        : risk?.classList.contains("ri-risk-warning") ? "warning" : "info";

      const links = new Map();
      if (context && !context.hidden) {
        for (const link of context.querySelectorAll("a.ri-context__link, a.ri-context__social")) {
          const label = (link.querySelector("strong") || link.querySelector("span"))
            ?.textContent.trim();

          if (/^https?:$/.test(link.protocol) && !links.has(link.href)) {
            links.set(link.href, label || link.hostname);
          }
        }
      }

      const signature = JSON.stringify([...links]);
      if (signature !== sourceSignature) {
        sourceSignature = signature;

        sources.replaceChildren(...[...links].map(([href, label]) => {
          const link = document.createElement("a");
          link.href = href;
          link.target = "_blank";
          link.rel = "noopener noreferrer";
          link.textContent = `${label} ↗`;
          return link;
        }));

        if (!links.size) sources.textContent = "No project sources available.";
      }

      setText(
        checked,
        context?.querySelector(".ri-context__checked")?.textContent.trim() || ""
      );
    }

    shell.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;

      if (button.matches(".rsa-bar [data-tool]")) {
        const key = button.dataset.tool;
        const original = originalTool(key);
        if (!original || original.hidden || button.hidden) return;

        select("premium", key);

        if (window.RI_PREMIUM?.getSelectedTool() !== key) {
          original.click();
        }
      } else if (button.matches(".rsa-bar [data-view], [data-jump]")) {
        const key = button.dataset.view || button.dataset.jump;
        select(key);

        if (button.dataset.jump) {
          const insiders = byId("insiderNetworks")?.closest("details");
          if (insiders) insiders.open = true;
          byId(`rsa-tab-${key}`)?.focus();
        }
      } else if (button.matches("[data-score]")) {
        byId("riskScore")?.click();
      }
    });

    shell.querySelector(".rsa-tabs").addEventListener("keydown", event => {
      const current = tabButtons.indexOf(event.target);
      const last = tabButtons.length - 1;
      const next = {
        ArrowLeft: (current + last) % tabButtons.length,
        ArrowRight: (current + 1) % tabButtons.length,
        Home: 0,
        End: last
      }[event.key];

      if (current < 0 || next === undefined) return;

      event.preventDefault();
      select(tabButtons[next].dataset.view);
      tabButtons[next].focus();
    });

    quick.querySelector(":scope > .token-overview").after(shell);

    if (initialTrade?.matches(".rt-trade")) move(initialTrade, panels.trade);
    move(context, panels.overview);
    move(byId("analysisHighlights"), panels.overview);
    move(sidebar, panels.wallets);
    move(quick.querySelector(".result-group-market"), panels.market);
    move(byId("peakMarketCap")?.closest(".metric-card"), panels.market);
    move(byId("dropFromPeak")?.closest(".metric-card"), panels.market);
    move(layout.querySelector(".result-group-signals"), panels.market);
    move(quick.querySelector(".result-summary"), panels.market);
    move(byId("riTokenFees"), panels.token);
    move(details, panels.overview);

    knownSections.forEach(section => details.append(section));
    layout.remove();

    const observer = new MutationObserver(update);
    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden"]
    });

    return { select, update, openedTabs, contract: null };
  }

  window.RI_SCANNER_ANALYSIS = {
    mount(contract) {
      if (!dashboard) {
        const root = byId("resultsSection");
        const quick = root?.querySelector(".quick-result-card");
        const layout = root?.querySelector(".ri-analysis-layout");
        const details = byId("allInfoSection");

        if (!quick || !layout || !details) return;

        dashboard = createDashboard(root, quick, layout, details);
      }

      if (dashboard.contract !== contract) {
        dashboard.contract = contract;
        dashboard.openedTabs.clear();
        dashboard.select("overview");
      }

      dashboard.update();
    }
  };
})();