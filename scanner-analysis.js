(() => {
  "use strict";

  const tabs = [["overview","Overview"],["wallets","Wallets"],["market","Exit & market"],["token","Token & fees"],["project","Project"]];
  const wallets = [["distribution","Distribution"],["holders","Top holders"],["insiders","Insider networks"],["bundlers","Bundler wallets"],["creator","Creator & history"]];
  const tools = [["lab","Exit Lab"],["volume","Volume X-Ray"],["early_buyers","Early Buyers"]];
  const paths = {
    cap: "M4 20V13m5 7V9m5 11V5m5 15V3",
    liquidity: "M12 3c-3 4-6 7-6 11a6 6 0 0 0 12 0c0-4-3-7-6-11z",
    price: "M3 12l9-9h8v8l-9 9L3 12zm13-5h.01",
    drop: "m3 6 6 6 4-4 7 7m-6 0h6V9",
    people: "M7 20v-2a5 5 0 0 1 10 0v2m4 0v-2a5 5 0 0 0-3-4M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    supply: "m3 8 9-5 9 5-9 5-9-5zm0 4 9 5 9-5M3 16l9 5 9-5",
    crown: "m3 5 5 4 4-6 4 6 5-4-2 12H5L3 5zm3 15h12",
    exit: "M3 12h4l2-6 4 12 2-6h6",
    fee: "M5 19 19 5M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zm10 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
  };
  const icon = key => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[key]}"/></svg>`;
  const id = name => document.getElementById(name);
  const text = el => el?.textContent.trim() || "";
  const value = name => {
    const result = text(id(name));
    return result === "---" || !result ? "—" : result;
  };
  const write = (el, next) => {
    if (el && el.textContent !== next) el.textContent = next;
  };
  const hide = (el, next) => {
    if (el && el.hidden !== next) el.hidden = next;
  };
  const put = (node, parent) => {
    if (node && node.parentElement !== parent) parent.append(node);
  };
  const field = (name, extra = "") => `<strong data-from="${name}" ${extra}>—</strong>`;
  const lines = items => `<dl class="rsa-lines">${items.map(([label, name]) =>
    `<div><dt>${label}</dt><dd>${field(name)}</dd></div>`).join("")}</dl>`;
  const metrics = (items, style = "") => `<dl class="rsa-metrics ${style}">${items.map(([label, name, symbol]) =>
    `<div>${icon(symbol)}<div><dt>${label}</dt><dd>${field(name, name === "dropFromPeak" ? "data-drop" : "")}</dd></div></div>`).join("")}</dl>`;
  const bar = (items, key, label) => `<div class="rsa-tabs" role="group" aria-label="${label}">${items.map(([name, title]) =>
    `<button type="button" data-${key}="${name}" aria-pressed="false">${title}</button>`).join("")}</div>`;
  const card = (title, body) => `<section class="rsa-card"><h3>${title}</h3>${body}</section>`;
  const head = (title, symbol) => `<h3 class="rsa-heading">${icon(symbol)}${title}</h3>`;
  const meter = `<span class="rsa-meter" aria-hidden="true"><i></i></span>`;
  const market = [
    ["Market cap","marketCap","cap"],["Liquidity","liveLiquidity","liquidity"],
    ["24h volume","liveVolume24h","cap"],["Price","livePrice","price"],["From peak","dropFromPeak","drop"]
  ];
  const supply = [["Creator","Dev holdings"],["Insiders","Insider holdings"],["Bundlers","Bundler holdings"],["KOL","KOL holdings"],["Smart money","Smart money"]];
  let dashboard;

  function create(root, quick, legacy, details) {
    const shell = document.createElement("div");
    shell.id = "riScannerAnalysis";
    shell.innerHTML = `
      <div class="rsa-bar">
        ${bar(tabs,"view","Scanner analysis")}
        <div class="rsa-tools">
          ${tools.map(([key, title]) => `<button type="button" data-tool="${key}" aria-label="${title}, Premium" aria-expanded="false" hidden>${icon("crown")}<span>${title}</span></button>`).join("")}
          <button type="button" data-view="trade" aria-pressed="false" hidden>Trade</button>
        </div>
      </div>
      <section id="rsa-overview">
        ${metrics([...market,["Holders","holderCount","people"]])}
        <div class="rsa-columns">
          <section class="rsa-card">
            <div class="rsa-head"><h3>Risk Signals</h3><small data-risk-count></small></div>
            <div data-risk-list></div>
            <div class="rsa-concentration">${icon("people")}<div><strong>Top 10 holders</strong><small>Share of token supply</small></div>${meter}${field("highlightTop10")}</div>
          </section>
          ${card("Token Checks",lines([["Mint authority","mintAuthorityStatus"],["Freeze authority","freezeAuthorityStatus"],["Metadata","metadataStatusDetail"]]))}
        </div>
      </section>
      <section id="rsa-wallets" hidden>
        ${bar(wallets,"wallet","Wallet analysis")}
        <div data-wallet-panel="distribution">
          ${metrics([["Holders","holderCount","people"],["Top 10 concentration","highlightTop10","cap"],["Supply","tokenSupply","supply"]],"rsa-three")}
          <div class="rsa-columns">
            ${card("Share of supply",`<dl class="rsa-lines">${supply.map(([label,key]) => `<div><dt>${label}</dt><dd data-share="${key}">—</dd></div>`).join("")}</dl><small>Wallet groups may overlap.</small>`)}
            ${card("Holder composition",'<dl class="rsa-lines"><div><dt>Pro holders</dt><dd data-count="Pro holders">—</dd></div><div><dt>New wallets</dt><dd data-count="New wallets">—</dd></div></dl><small data-wallet-status role="status"></small>')}
          </div>
        </div>
        <div data-wallet-panel="holders" hidden>
          <div class="rsa-card rsa-concentration">${icon("people")}<div><strong>Top 10 concentration</strong><small data-top-source>Share of token supply</small></div>${meter}${field("holderTop10")}</div>
          <section class="rsa-card">${head("Top holders","people")}<div data-holder-table></div></section>
        </div>
        <div data-wallet-panel="insiders" hidden>
          ${head("Insider networks","people")}
          ${metrics([["Insiders detected","insidersDetected","people"],["Networks","rsaNetworkCount","supply"]],"rsa-two")}
          <div class="rsa-table"><table><thead><tr><th>Network</th><th>Type</th><th>Accounts</th><th>Token holdings</th><th>Share of supply</th></tr></thead><tbody data-networks></tbody></table></div>
          <small>Transfer connections do not confirm insider ownership. Networks may overlap.</small>
        </div>
      </section>
      <section id="rsa-market" hidden>
        ${head("Market overview","cap")}
        ${metrics([...market.slice(0,4),["Peak market cap","peakMarketCap","cap"],market[4]])}
        ${card("Exit analysis",`<dl class="rsa-lines rsa-exit">
          <div><dt>Market movement<small>Based on historical market data</small></dt><dd><span data-state="marketStatus">—</span></dd></div>
          <div><dt>Market collapse</dt><dd><span data-state="exitMarketCollapse">—</span></dd></div>
          <div><dt>Major exit event<small data-exit-note></small></dt><dd><span data-state="exitMajorEvent">—</span></dd></div>
        </dl><small>On-chain activity alone does not establish fraudulent intent.</small>`)}
      </section>
      <section id="rsa-token" hidden>
        <div class="rsa-platform">${icon("supply")}<span>Launch platform</span> ${field("launchPlatform")}</div>
        <section class="rsa-card">
          <div class="rsa-head">${head("Token & trading fees","fee")}<small data-from="riFeeUpdated"></small></div>
          <div class="rsa-platform">Selected pool ${field("riFeePlatform")} <span data-fee-link></span></div>
          <div class="rsa-fees">
            <section><h4>Token transfer fee</h4><div class="rsa-rate">${field("riTransferFee")}</div>${lines([["Fee cap","riFeeCap"],["Source","riFeeTransferSource"]])}</section>
            <section><h4>Pool trading fee</h4><div class="rsa-rate"><span data-fee-sides>Buy ${field("riFeeBuy")} <span>Sell ${field("riFeeSell")}</span></span><span data-fee-aggregate hidden>${field("riPoolFee")}</span></div>${lines([["Source","riFeePoolSource"]])}<small data-pool-note></small></section>
            <section><h4 data-creator-fee>Creator fee</h4><div class="rsa-rate">${field("riCreatorFee")}</div>${lines([["Charged on","riFeeBasis"]])}<small data-creator-note></small></section>
          </div>
          <small>Fees apply to different amounts. Transfer fees may apply during swaps. Network, routing and app fees are excluded. Unverified fees are shown as —.</small>
        </section>
      </section>
      <section id="rsa-project" hidden>
        <section class="rsa-card rsa-project">
          <div class="rsa-head"><h3><span class="rsa-badge">RII</span> Project verification</h3><small data-context-time></small></div>
          <div class="rsa-table"><table><thead><tr><th>Check</th><th>Finding</th><th>Status</th><th>Source</th></tr></thead><tbody data-project></tbody></table></div>
          <div data-risk-summary></div>
        </section>
      </section>
      <section id="rsa-premium" hidden></section><section id="rsa-trade" hidden></section>
    `;

    const find = selector => shell.querySelector(selector);
    const all = selector => [...shell.querySelectorAll(selector)];
    const panel = key => find(`#rsa-${key}`);
    const controls = all(".rsa-tools [data-tool]");
    const originalTool = key => id("riScannerToolsHost")?.querySelector(`[data-embedded-tool="${key}"]`);
    const context = id("riTokenContext");
    const sources = root.querySelector(".results-container");
    const accordion = name => id(name)?.closest(".ri-analysis-accordion");
    const bundler = accordion("bundlerHoldersSection");
    const creator = accordion("creatorWallet");
    let active = "overview";
    let wallet = "distribution";
    let tool = "";
    let contract;
    let networkSignature, projectSignature;

    quick.querySelector(".token-overview").after(shell);
    const initialTrade = context?.previousElementSibling;
    if (initialTrade?.matches(".rt-trade")) put(initialTrade, panel("trade"));
    put(context, panel("overview"));
    put(id("riskSignalsList"), find("[data-risk-list]"));
    put(id("riFeePoolLink"), find("[data-fee-link]"));
    const holderTable = id("holdersTableBody")?.closest(".modern-holder-table-wrapper");
    put(holderTable, find("[data-holder-table]"));

    // Keep the original details together so app.js can reset them and run its lazy loaders.
    put(details, panel("wallets"));
    for (const [node, name] of [[bundler,"bundlers"],[creator,"creator"]]) {
      if (node) node.dataset.walletNative = name;
    }
    if (bundler) {
      const section = id("bundlerHoldersSection");
      const header = document.createElement("div");
      header.className = "rsa-head";
      header.innerHTML = head("Bundler wallets","supply");
      section.prepend(header);
      put(id("riBundlerReload"), header);
    }
    if (creator) {
      const body = creator.querySelector(".ri-accordion-body");
      const header = document.createElement("div");
      header.innerHTML = head("Creator & history","people");
      body.prepend(header);
    }

    // Leave the canonical fields attached for the original renderers and timers.
    legacy.className = "rsa-source";
    const stash = document.createElement("div");
    stash.className = "rsa-source";
    for (const selector of [".result-group-market",".result-summary","#riTokenFees",".all-info-button",".all-info-description"]) {
      put(quick.querySelector(selector), stash);
    }
    sources.append(stash);

    function select(next, selectedTool = "") {
      active = next;
      tool = selectedTool;
      all("#riScannerAnalysis > section").forEach(section => hide(section, section.id !== `rsa-${active}`));
      all("[data-view]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.view === active)));
      controls.forEach(button => button.setAttribute("aria-expanded", String(button.dataset.tool === tool)));
      if (active === "wallets") selectWallet(wallet);
    }

    function selectWallet(next) {
      wallet = next;
      all("[data-wallet]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.wallet === wallet)));
      all("[data-wallet-panel]").forEach(section => hide(section, section.dataset.walletPanel !== wallet));
      const native = wallet === "bundlers" ? bundler : wallet === "creator" ? creator : null;
      hide(details, !native);
      for (const item of details.querySelectorAll(":scope > details")) {
        hide(item, item !== native);
        if (item.open !== (item === native)) item.open = item === native;
      }
    }

    function rows(tbody, list) {
      tbody.replaceChildren(...list.map(cells => {
        const row = document.createElement("tr");
        cells.forEach((content, index) => {
          const cell = document.createElement(index === 0 ? "th" : "td");
          if (!index) cell.scope = "row";
          cell.append(content);
          row.append(cell);
        });
        return row;
      }));
    }

    function updateWallets() {
      const ring = new Map([...id("tokenInfoGrid")?.querySelectorAll(".ri-overview-metric") || []].map(node =>
        [text(node.querySelector(".ri-overview-label")), node]));
      all("[data-share]").forEach(node => write(node, text(ring.get(node.dataset.share)?.querySelector(".ri-overview-ring strong")) || "—"));
      all("[data-count]").forEach(node => {
        const label = text(ring.get(node.dataset.count)?.querySelector("small"));
        const counts = label.match(/^([\d,]+) of ([\d,]+) holders$/);
        write(node, counts ? `${counts[1]} / ${counts[2]}` : "—");
      });
      const infoStatus = value("tokenInfoStatus");
      write(find("[data-wallet-status]"), /Token information loaded|Open this section/.test(infoStatus) || infoStatus === "—" ? "" : infoStatus);

      const network = id("insiderNetworks");
      const records = [...network?.querySelectorAll(".ri-network-v2") || []].map((node, index) => [
        `Network ${String(index + 1).padStart(2, "0")}`,
        text(node.querySelector(".insider-network-type")) || "—",
        text(node.querySelector(".insider-network-accounts strong")) || "—",
        text(node.querySelector(".ri-network-token-amount")).replace(/ tokens$/, "") || "—",
        text(node.querySelector(".ri-network-percentage strong")) || "—"
      ]);
      const empty = text(network?.querySelector(".insider-empty")) || "Network data unavailable.";
      const count = value("insidersDetected");
      write(find('[data-from="rsaNetworkCount"]'), records.length ? String(records.length) : count === "0" ? "0" : "—");
      const signature = JSON.stringify([records, empty]);
      if (networkSignature === signature) return;
      networkSignature = signature;
      const body = find("[data-networks]");
      rows(body, records.length ? records : [[empty]]);
      if (!records.length) {
        const cell = body.firstElementChild.firstElementChild;
        cell.colSpan = 5;
        cell.className = "rsa-empty";
      }
    }

    function updateProject() {
      const risk = id("riRiskSummary");
      put(risk, find("[data-risk-summary]"));
      hide(find("[data-risk-summary]"), !risk || risk.hidden);
      const available = context && !context.hidden;
      const checked = available ? text(context.querySelector(".ri-context__checked")) : "";
      write(find("[data-context-time]"), checked);

      const links = available ? [...context.querySelectorAll("a.ri-context__link, a.ri-context__social")]
        .filter(link => /^https?:$/.test(link.protocol)) : [];
      const website = links.find(link => !/(^|\.)(x\.com|twitter\.com)$/i.test(link.hostname));
      const socialLinks = links.filter(link => /(^|\.)(x\.com|twitter\.com)$/i.test(link.hostname));
      const social = socialLinks.find(link => /^\/(i\/)?communities\//.test(link.pathname)) || socialLinks[0];
      const summary = Boolean(available && text(context.querySelector(".ri-context__summary p")));
      const signature = JSON.stringify([website?.href, social?.href, summary]);
      if (signature === projectSignature) return;
      projectSignature = signature;
      const source = (link, label) => {
        if (!link) return "—";
        const anchor = document.createElement("a");
        anchor.href = link.href;
        anchor.target = "_blank";
        anchor.rel = "noopener noreferrer";
        anchor.textContent = `${label} ↗`;
        return anchor;
      };
      const community = social && /^\/(i\/)?communities\//.test(social.pathname);
      rows(find("[data-project]"), [
        ["Project website",website ? "Website listed in Token Context" : "No website linked in Token Context",website ? "Website listed" : "Unavailable",source(website,website?.hostname)],
        ["Community",community ? "X Community listed for this token" : social ? "X link listed for this token" : "No X link in Token Context",social ? "Link available" : "Unavailable",source(social,community ? "X Community" : "X")],
        ["Token utility",summary ? "See the full RII description in Overview" : "RII description unavailable",summary ? "See Overview" : "Unavailable","—"],
        ["Official token address","Exact Solana address has not been checked","Not checked","—"]
      ]);
    }

    function update() {
      put(id("riScannerToolsHost"), panel("premium"));
      for (const button of controls) {
        const original = originalTool(button.dataset.tool);
        hide(button, !original || original.hidden || id("riScannerToolsHost").hidden);
        if (button.hidden && tool === button.dataset.tool) select("overview");
      }
      const trade = context?.previousElementSibling;
      if (trade?.matches(".rt-trade")) put(trade, panel("trade"));
      hide(find('[data-view="trade"]'), !panel("trade").querySelector(".rt-trade"));

      for (const out of all('[data-from]:not([data-from="rsaNetworkCount"])')) {
        const current = value(out.dataset.from);
        const drop = out.hasAttribute("data-drop") && /^\d[\d,.]*%$/.test(current) && parseFloat(current) > 0;
        write(out, drop ? `−${current}` : current);
        if (out.hasAttribute("data-drop")) out.dataset.tone = drop ? "danger" : "neutral";
      }
      for (const track of all(".rsa-meter")) {
        const share = Number(text(track.nextElementSibling).replace(/[% ,]/g,""));
        const width = `${Number.isFinite(share) ? Math.max(0, Math.min(100, share)) : 0}%`;
        if (track.firstElementChild.style.width !== width) track.firstElementChild.style.width = width;
      }

      const list = id("riskSignalsList");
      const count = list?.querySelectorAll(".ri-risk-card:not(.ri-risk-empty)").length ?? 0;
      write(find("[data-risk-count]"), list?.childElementCount ? `${count} detected` : "—");
      const label = id("highlightTop10")?.closest(".ri-highlight-card")?.querySelector(".ri-highlight-note");
      write(find("[data-top-source]"), text(label) || "Share of token supply");

      const pending = root.hasAttribute("data-ri-exit-pending");
      for (const status of all("[data-state]")) {
        const raw = value(status.dataset.state);
        const shown = pending && status.dataset.state === "exitMajorEvent" ? "Checking…" : raw;
        write(status, shown === "—" ? "Unavailable" : shown.toLowerCase().replace(/^./, c => c.toUpperCase()));
        status.dataset.tone = /^(DETECTED|MAJOR COLLAPSE DETECTED)$/i.test(shown) ? "danger"
          : /^(NOT DETECTED|NORMAL MARKET MOVEMENT)$/i.test(shown) ? "ok"
          : /PULLBACK|DECLINE/i.test(shown) ? "warn" : "neutral";
      }
      write(find("[data-exit-note]"), !pending && value("exitMajorEvent") === "NOT VERIFIED" ? "Creator wallet activity has not been verified." : "");

      const aggregate = value("riFeeBuy") === "—" && value("riFeeSell") === "—" && value("riPoolFee") !== "—";
      hide(find("[data-fee-sides]"), aggregate);
      hide(find("[data-fee-aggregate]"), !aggregate);
      write(find("[data-pool-note]"), text(id("riPoolFee")?.closest("article")?.querySelector("small")));
      const creatorFee = id("riCreatorFee")?.closest("article");
      write(find("[data-creator-fee]"), text(creatorFee?.querySelector("span")) || "Creator fee");
      const feeNote = text(creatorFee?.querySelector("small"));
      write(find("[data-creator-note]"), feeNote === "Selected pool" ? "" : feeNote);

      updateWallets();
      updateProject();
    }

    shell.addEventListener("click", event => {
      const button = event.target.closest("button");
      if (!button) return;
      if (button.dataset.view) select(button.dataset.view);
      if (button.dataset.wallet) selectWallet(button.dataset.wallet);
      const key = button.dataset.tool;
      if (key && controls.includes(button) && !button.hidden) {
        const original = originalTool(key);
        if (!original || original.hidden) return;
        select("premium", key);
        if (window.RI_PREMIUM?.getSelectedTool() !== key) original.click();
      }
    });

    new MutationObserver(update).observe(root, {
      subtree:true, childList:true, characterData:true, attributes:true,
      attributeFilter:["hidden","data-ri-exit-pending"]
    });

    return next => {
      if (contract !== next) {
        contract = next;
        wallet = "distribution";
        select("overview");
      } else if (active === "wallets") {
        selectWallet(wallet);
      }
      update();
    };
  }

  window.RI_SCANNER_ANALYSIS = {
    mount(contract) {
      if (!dashboard) {
        const root = id("resultsSection");
        const quick = root?.querySelector(".quick-result-card");
        const legacy = root?.querySelector(".ri-analysis-layout");
        const details = id("allInfoSection");
        if (!quick || !legacy || !details) return;
        dashboard = create(root, quick, legacy, details);
      }
      dashboard(contract);
    }
  };
})();