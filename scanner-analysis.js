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
      if (visibleSections.length) move(details, sectionDestinations[key]);

      if (key === "wallets") {
        showWalletView(openedTabs.has(key) ? walletView : "distribution");
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

      const riskSummary = byId("riRiskSummary");
      move(riskSummary, projectRisk);

      const riskHidden = !riskSummary || riskSummary.hidden;
      if (projectRisk.hidden !== riskHidden) {
        projectRisk.hidden = riskHidden;
      }

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
          showWalletView("insiders");
          walletNav.querySelector('[data-wallet-view="insiders"]')?.focus();
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
    const market = quick.querySelector(".result-group-market");
    move(market, panels.market);

    const marketStrip = market?.querySelector(".ri-market-strip") || panels.market;
    move(byId("peakMarketCap")?.closest(".metric-card"), marketStrip);
    move(byId("dropFromPeak")?.closest(".metric-card"), marketStrip);

    const marketNotes = document.createElement("details");
    marketNotes.className = "rsa-card rsa-more";
    marketNotes.innerHTML = "<summary>Market signals and analysis status</summary>";
    panels.market.append(marketNotes);

    move(layout.querySelector(".result-group-signals"), marketNotes);
    move(quick.querySelector(".result-summary"), marketNotes);
    move(byId("launchPlatform")?.closest(".token-metric-card"), panels.token);
    move(byId("riTokenFees"), panels.token);
    move(details, panels.overview);

    knownSections.forEach(section => details.append(section));
    layout.remove();

    const walletTabs = [
      ["distribution", "Distribution"],
      ["holders", "Top holders"],
      ["insiders", "Insider networks"],
      ["bundlers", "Bundler wallets"],
      ["creator", "Creator & history"]
    ];

    const distribution = document.createElement("div");
    distribution.className = "rsa-distribution";
    distribution.innerHTML = `
      <dl class="rsa-wallet-stats">
        ${fields([
          ["Holders", "holderCount"],
          ["Adjusted top 10", "highlightTop10"],
          ["Supply", "tokenSupply"]
        ])}
      </dl>

      <div class="rsa-columns">
        <section class="rsa-card">
          <h3>Share of supply</h3>
          <dl class="rsa-checks">
            ${[
              ["Creator", "Dev holdings"],
              ["Insiders", "Insider holdings"],
              ["Bundlers", "Bundler holdings"],
              ["KOL", "KOL holdings"],
              ["Smart money", "Smart money"]
            ].map(([label, source]) =>
              `<div><dt>${label}</dt><dd data-wallet-share="${source}">—</dd></div>`
            ).join("")}
          </dl>
          <small>Wallet groups may overlap.</small>
        </section>

        <section class="rsa-card">
          <h3>Holder composition</h3>
          <dl class="rsa-checks">
            <div>
              <dt>Pro holders</dt>
              <dd data-wallet-count="Pro holders">—</dd>
            </div>
            <div>
              <dt>New wallets</dt>
              <dd data-wallet-count="New wallets">—</dd>
            </div>
          </dl>
          <div class="rsa-links">
            <button type="button" data-wallet-early hidden>Early Buyers →</button>
            <button type="button" data-wallet-refresh>Refresh token info</button>
          </div>
          <small data-wallet-status role="status"></small>
        </section>
      </div>
    `;

    const walletNav = document.createElement("div");
    walletNav.className = "rsa-wallet-nav";
    walletNav.setAttribute("role", "group");
    walletNav.setAttribute("aria-label", "Wallet analysis");
    walletNav.innerHTML = walletTabs.map(([key, title]) =>
      `<button type="button" data-wallet-view="${key}" aria-pressed="false">
        ${title}
      </button>`
    ).join("");

    panels.wallets.append(walletNav, distribution);
    fieldsToUpdate.push(...distribution.querySelectorAll("[data-value-from]"));

    const early = distribution.querySelector("[data-wallet-early]");
    const refresh = distribution.querySelector("[data-wallet-refresh]");
    const walletStatus = distribution.querySelector("[data-wallet-status]");
    let walletView = "distribution";

    function showWalletView(key) {
      walletView = key;
      const detailIds = {
        holders: "holdersTableBody",
        insiders: "insiderNetworks",
        bundlers: "bundlerHoldersSection",
        creator: "creatorWallet"
      };

      const detail = byId(detailIds[key])?.closest(".ri-analysis-accordion");
      const showDetails = key !== "distribution" && Boolean(detail);

      walletNav.querySelectorAll("button").forEach(button => {
        button.setAttribute("aria-pressed", String(button.dataset.walletView === key));
      });

      distribution.hidden = key !== "distribution";
      details.hidden = !showDetails;
      originalSections.forEach(section => {
        section.hidden = section !== detail || !showDetails;
      });

      if (showDetails) detail.open = true;
    }

    walletNav.addEventListener("click", event => {
      const button = event.target.closest("[data-wallet-view]");
      if (button) showWalletView(button.dataset.walletView);
    });

    early.addEventListener("click", () => {
      toolButtons.find(button => button.dataset.tool === "early_buyers")?.click();
    });

    refresh.addEventListener("click", () => byId("tokenInfoReload")?.click());

    function updateWalletDistribution() {
      const original = byId("tokenInfoGrid");
      const metrics = new Map();

      for (const metric of original?.querySelectorAll(".ri-overview-metric") || []) {
        const label = metric.querySelector(".ri-overview-label")?.textContent.trim();
        if (label) metrics.set(label, metric);
      }

      for (const field of distribution.querySelectorAll("[data-wallet-share]")) {
        const value = metrics.get(field.dataset.walletShare)
          ?.querySelector(".ri-overview-ring strong")?.textContent.trim();
        setText(field, value || "—");
      }

      for (const field of distribution.querySelectorAll("[data-wallet-count]")) {
        const caption = metrics.get(field.dataset.walletCount)
          ?.querySelector("small")?.textContent.trim();
        const count = caption?.match(/^([\d,]+) of ([\d,]+) holders$/);
        setText(field, count ? `${count[1]} / ${count[2]}` : "—");
      }

      const earlyTool = toolButtons.find(button => button.dataset.tool === "early_buyers");
      const unavailable = earlyTool.hidden;
      if (early.hidden !== unavailable) early.hidden = unavailable;

      const pending = Boolean(byId("tokenInfoReload")?.disabled);
      if (refresh.disabled !== pending) refresh.disabled = pending;

      const status = byId("tokenInfoStatus")?.textContent.trim();
      const loaded = status === "Token information loaded." || (
        metrics.size > 0 && status === "Open this section to load token information."
      );
      setText(walletStatus, loaded ? "" : status || "");
    }

    const more = document.createElement("details");
    more.className = "rsa-card rsa-more";
    more.innerHTML = "<summary>More analysis</summary>";
    panels.overview.append(more);
    move(byId("analysisHighlights"), more);

    const sectionDestinations = { ...panels, overview: more };

    sourcePanel.classList.add("rsa-project");
    sourcePanel.querySelector("h3").innerHTML =
      '<span class="rsa-badge">RII</span> Project verification';

    const projectTable = document.createElement("div");
    projectTable.className = "rsa-project-table";
    projectTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th scope="col">Check</th>
            <th scope="col">Finding</th>
            <th scope="col">Status</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    `;
    sourcePanel.querySelector("h3").after(projectTable);
    sources.classList.add("rsa-project-sources");

    const projectRisk = document.createElement("details");
    projectRisk.className = "rsa-card rsa-more";
    projectRisk.innerHTML = "<summary>Risk Summary</summary>";
    projectRisk.hidden = true;
    panels.project.append(projectRisk);

    let projectSignature;

    function updateProject() {
      const contextLinks = [];

      for (const anchor of sources.querySelectorAll("a")) {
        const url = new URL(anchor.href);
        const onX = /(^|\.)(x\.com|twitter\.com)$/i.test(url.hostname);
        const isCommunity = /^\/(i\/)?communities\//.test(url.pathname);

        contextLinks.push({
          href: url.href,
          label: anchor.textContent.replace(/\s*↗$/, ""),
          kind: onX ? (isCommunity ? "community" : "social") : "website"
        });
      }

      const summaryAvailable = Boolean(
        context && !context.hidden &&
        context.querySelector(".ri-context__summary p")?.textContent.trim()
      );
      const signature = JSON.stringify([contextLinks, summaryAvailable]);
      if (signature === projectSignature) return;
      projectSignature = signature;

      const site = contextLinks.find(link => link.kind === "website");
      const community = contextLinks.find(link => link.kind === "community");
      const social = community || contextLinks.find(link => link.kind === "social");

      const rows = [
        [
          "Project website",
          site ? "Website listed in Token Context" : "No website linked in Token Context",
          site ? "Website listed" : "Unavailable",
          site
        ],
        [
          "Community",
          community ? "X Community listed for this token"
            : social ? "X link listed for this token" : "No X link in Token Context",
          social ? "Link available" : "Unavailable",
          social
        ],
        [
          "Token utility",
          summaryAvailable ? "See the full RII description in Overview"
            : "RII description unavailable",
          summaryAvailable ? "See Overview" : "Unavailable"
        ],
        [
          "Official token address",
          "Exact Solana address has not been checked",
          "Not checked"
        ]
      ];

      const body = projectTable.querySelector("tbody");
      body.replaceChildren(...rows.map(([title, finding, status, source]) => {
        const row = document.createElement("tr");
        const header = document.createElement("th");
        header.scope = "row";
        header.textContent = title;

        const findingCell = document.createElement("td");
        findingCell.textContent = finding;

        const statusCell = document.createElement("td");
        const badge = document.createElement("span");
        badge.className = "rsa-status";
        if (source) badge.dataset.linked = "true";
        badge.textContent = status;
        statusCell.append(badge);

        const sourceCell = document.createElement("td");
        if (source) {
          const anchor = document.createElement("a");
          anchor.href = source.href;
          anchor.target = "_blank";
          anchor.rel = "noopener noreferrer";
          anchor.textContent = `${source.label} ↗`;
          sourceCell.append(anchor);
        } else {
          sourceCell.textContent = "—";
        }

        row.append(header, findingCell, statusCell, sourceCell);
        return row;
      }));
    }

    function refreshDashboard() {
      update();
      updateWalletDistribution();
      updateProject();
    }

    const observer = new MutationObserver(refreshDashboard);
    observer.observe(root, {
      childList: true,
      characterData: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["hidden", "disabled"]
    });

    return { select, update: refreshDashboard, openedTabs, contract: null };
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