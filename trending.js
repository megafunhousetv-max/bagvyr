(() => {
  "use strict";

  const root = document.getElementById("trendingRoot");
  if (!root) return;

  const API =
    "https://bagvyr-api.megafunhousetv.workers.dev/api/trending";

  let activeBoard = "trending";
  let data = null;
  let loading = false;

  const style = document.createElement("style");

  style.textContent = `
    #trendingRoot {
      color: inherit;
      padding-bottom: 32px;
    }

    #trendingRoot button,
    #trendingRoot a {
      font: inherit;
    }

    .ri-trend-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin: 24px 0 16px;
    }

    .ri-trend-tab {
      padding: 11px 20px;
      border: 1px solid rgba(255,255,255,.16);
      border-radius: 12px;
      background: rgba(255,255,255,.04);
      color: inherit;
      cursor: pointer;
    }

    .ri-trend-tab[aria-selected="true"] {
      background: rgba(60,230,145,.12);
      border-color: #3ce691;
      color: #3ce691;
    }

    .ri-trend-status {
      margin: 12px 0;
      font-size: 13px;
      opacity: .7;
    }

    .ri-trend-scroll {
      overflow-x: auto;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 16px;
      background: rgba(8,18,14,.65);
    }

    .ri-trend-table {
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
    }

    .ri-trend-table th,
    .ri-trend-table td {
      padding: 15px 14px;
      text-align: right;
      border-bottom: 1px solid rgba(255,255,255,.08);
      white-space: nowrap;
    }

    .ri-trend-table th {
      font-size: 12px;
      opacity: .65;
    }

    .ri-trend-table th:nth-child(2),
    .ri-trend-table td:nth-child(2) {
      text-align: left;
    }

    .ri-trend-table tr:last-child td {
      border-bottom: 0;
    }

    .ri-trend-token {
      display: flex;
      align-items: center;
      gap: 10px;
      color: inherit;
      text-decoration: none;
    }

    .ri-trend-token:hover {
      color: #3ce691;
    }

    .ri-trend-icon {
      width: 38px;
      height: 38px;
      flex-shrink: 0;
      border-radius: 50%;
      object-fit: cover;
      background: rgba(60,230,145,.1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .ri-trend-name {
      display: block;
      max-width: 220px;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 600;
    }

    .ri-trend-symbol {
      display: block;
      font-size: 12px;
      opacity: .6;
      margin-top: 3px;
    }

    .ri-trend-badge {
      display: inline-block;
      margin-left: 7px;
      font-size: 10px;
      color: #ffd783;
    }

    .ri-trend-ads {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }

    .ri-trend-ad {
      display: block;
      padding: 18px;
      border: 1px solid rgba(255,205,105,.55);
      border-radius: 16px;
      background: rgba(255,205,105,.05);
      color: inherit;
      text-decoration: none;
    }

    .ri-trend-ad-label {
      display: block;
      color: #ffd783;
      font-size: 10px;
      letter-spacing: 1.5px;
      margin-bottom: 12px;
    }

    .ri-trend-empty {
      padding: 36px 20px;
      border: 1px solid rgba(255,255,255,.12);
      border-radius: 16px;
      text-align: center;
      opacity: .75;
    }

    @media (max-width: 700px) {
      .ri-trend-ads {
        grid-template-columns: 1fr;
      }
    }
  `;

  document.head.appendChild(style);
const designStyle = document.createElement("style");

designStyle.textContent = `
  #trending {
    min-height: 100vh;
    background-color: #020806;
    background-image:
      linear-gradient(
        rgba(2, 8, 6, 0.12),
        rgba(2, 8, 6, 0.4)
      ),
      url("./trending-bg.png");
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
    background-attachment: fixed;
  }

  #trending .page-container {
    max-width: 1280px;
    margin-inline: auto;
    padding: 28px 24px 64px;
  }

  #trending .page-section-heading {
    text-align: center;
    margin-bottom: 30px;
  }

  #trending .page-section-heading h2 {
    color: #f3fff9;
    font-size: clamp(30px, 4vw, 48px);
    line-height: 1.15;
    letter-spacing: -1.5px;
    margin: 14px 0;
  }

  #trending .page-section-heading p {
    color: #a6bdb3;
  }

  #trending .eyebrow {
    color: #25ffc0;
    letter-spacing: 3px;
  }

  #trendingRoot .ri-trend-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    padding: 0;
    margin-bottom: 12px;
    background: transparent;
    border: none;
    box-shadow: none;
  }

  #trendingRoot .ri-trend-tab {
    display: block;
    width: 210px;
    height: 70px;
    min-height: 0;
    padding: 0;
    border: none;
    border-radius: 16px;
    background: transparent center / contain no-repeat;
    font-size: 0;
    color: transparent;
    box-shadow: none;
    opacity: 0.65;
    cursor: pointer;
    transition:
      opacity 180ms ease,
      filter 180ms ease,
      transform 180ms ease;
  }

  #trendingRoot .ri-trend-tab::before {
    content: none;
    display: none;
  }

  #trendingRoot .ri-trend-tab:first-child {
    background-image: url("./trending-button.png");
  }

  #trendingRoot .ri-trend-tab:nth-child(2) {
    background-image: url("./new-coins-button.png");
  }

  #trendingRoot .ri-trend-tab[aria-selected="true"] {
    opacity: 1;
    filter: drop-shadow(
      0 0 7px rgba(37, 255, 192, 0.25)
    );
  }

  #trendingRoot .ri-trend-tab:hover {
    opacity: 1;
    transform: translateY(-2px);
  }

  #trendingRoot .ri-trend-tab:focus-visible {
    outline: 2px solid #35ffc0;
    outline-offset: 4px;
  }

#trendingRoot .ri-trend-status {
  display: none;
}

  #trendingRoot .ri-trend-scroll {
    background: rgba(3, 13, 10, 0.92);
    border: 1px solid rgba(159, 209, 187, 0.25);
    border-radius: 18px;
    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.35);
  }

  #trendingRoot .ri-trend-table {
    background: transparent;
  }

  #trendingRoot .ri-trend-table th {
    background: rgba(8, 23, 17, 0.95);
    color: #adc4b8;
    padding-block: 18px;
  }

  #trendingRoot .ri-trend-table td {
    padding-block: 18px;
    border-bottom-color: rgba(159, 209, 187, 0.1);
  }

  #trendingRoot .ri-trend-table tbody tr:hover {
    background: rgba(37, 255, 192, 0.045);
  }

  #trendingRoot .ri-trend-ads {
    gap: 18px;
    margin-bottom: 24px;
  }

  #trendingRoot .ri-trend-ad {
    background: rgba(3, 16, 11, 0.92);
    border: 1px solid rgba(37, 255, 192, 0.6);
    border-radius: 14px;
    padding: 20px;
    min-height: 120px;
    box-sizing: border-box;
  }

  #trendingRoot .ri-trend-ad-label {
    color: #25ffc0;
    font-size: 10px;
    letter-spacing: 2px;
  }

  @media (max-width: 640px) {
    #trending {
      background-attachment: scroll;
      background-size: auto 100vh;
      background-position: center top;
    }

    #trending .page-container {
      padding: 28px 14px 48px;
    }

    #trendingRoot .ri-trend-tabs {
      flex-wrap: nowrap;
      gap: 8px;
    }

    #trendingRoot .ri-trend-tab {
      flex: 1;
      min-width: 0;
      width: auto;
      height: auto;
      aspect-ratio: 3 / 1;
    }
  }
`;

document.head.appendChild(designStyle);

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function validContract(value) {
    return (
      typeof value === "string" &&
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)
    );
  }

  function numeric(value) {
    if (
      value === null ||
      value === undefined ||
      typeof value === "boolean" ||
      String(value).trim() === ""
    ) return null;

    const number = Number(value);
    return Number.isFinite(number) && number >= 0
      ? number
      : null;
  }

  function money(value) {
    const number = numeric(value);
    if (number === null) return "—";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2
    }).format(number);
  }

  function holders(value) {
    const number = numeric(value);
    return number === null
      ? "—"
      : new Intl.NumberFormat("en-US").format(number);
  }

  function age(value) {
    const timestamp = Date.parse(value);
    if (!Number.isFinite(timestamp)) return "—";

    const minutes = Math.max(
      0,
      Math.floor((Date.now() - timestamp) / 60000)
    );

    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;

    return `${Math.floor(minutes / 1440)}d`;
  }

  const trendingImageCache = new Map();

  function normalizeTrendingImage(value) {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    let url = value.trim();

    if (url.startsWith("ipfs://")) {
      url = "https://ipfs.io/ipfs/" +
        url.slice(7).replace(/^ipfs\//, "");
    }

    if (url.startsWith("ar://")) {
      url = "https://arweave.net/" + url.slice(5);
    }

    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" ? parsed.href : null;
    } catch {
      return null;
    }
  }

  async function getTrendingDexImages(contract) {
    if (!contract) return [];

    if (trendingImageCache.has(contract)) {
      return trendingImageCache.get(contract);
    }

    const request = (async () => {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        8000
      );

      try {
        const response = await fetch(
          "https://api.dexscreener.com/token-pairs/v1/solana/" +
            encodeURIComponent(contract),
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Dex image HTTP " + response.status);
        }

        const pairs = await response.json();

        if (!Array.isArray(pairs)) {
          throw new Error("Invalid Dex image response");
        }

        return [...new Set(
          pairs
            .filter(pair =>
              pair?.chainId === "solana" &&
              pair?.baseToken?.address === contract
            )
            .sort((a, b) =>
              Number(b?.liquidity?.usd || 0) -
              Number(a?.liquidity?.usd || 0)
            )
            .map(pair =>
              normalizeTrendingImage(pair?.info?.imageUrl)
            )
            .filter(Boolean)
        )];
      } finally {
        clearTimeout(timeout);
      }
    })();

    trendingImageCache.set(contract, request);

    try {
      return await request;
    } catch {
      trendingImageCache.delete(contract);
      return [];
    }
  }

function tokenIcon(item) {
  const container = element("span", "ri-trend-icon");
  const letter = (item.symbol || item.name || "?").slice(0, 1);
  container.textContent = letter;

  const image = document.createElement("img");
  image.alt = "";
  image.loading = "eager";
  image.style.cssText =
    "width:100%;height:100%;object-fit:cover;border-radius:inherit;";

  function normalizeImage(value) {
    if (typeof value !== "string" || !value.trim()) return null;

    let url = value.trim();

    if (url.startsWith("ipfs://")) {
      url =
        "https://ipfs.io/ipfs/" +
        url.slice(7).replace(/^ipfs\//, "");
    } else if (url.startsWith("ar://")) {
      url = "https://arweave.net/" + url.slice(5);
    }

    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:" ? parsed.href : null;
    } catch {
      return null;
    }
  }

  const tried = new Set();
  const candidates = [];
  let dexRequested = false;

  const savedImage = normalizeImage(item.image_url);
  if (savedImage) candidates.push(savedImage);

  async function loadNext() {
    let url = candidates.shift();

    while (url && tried.has(url)) {
      url = candidates.shift();
    }

    if (!url && !dexRequested && item.contract) {
      dexRequested = true;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      try {
        const response = await fetch(
          "https://api.dexscreener.com/token-pairs/v1/solana/" +
            encodeURIComponent(item.contract),
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Dex image HTTP " + response.status);
        }

        const pairs = await response.json();

        if (Array.isArray(pairs)) {
          candidates.push(
            ...pairs
              .filter(
                (pair) =>
                  pair?.chainId === "solana" &&
                  pair?.baseToken?.address === item.contract
              )
              .sort(
                (a, b) =>
                  Number(b?.liquidity?.usd || 0) -
                  Number(a?.liquidity?.usd || 0)
              )
              .map((pair) => normalizeImage(pair?.info?.imageUrl))
              .filter(Boolean)
          );
        }
      } catch (error) {
        console.warn("Trending image:", item.contract, error);
      } finally {
        clearTimeout(timeout);
      }

      return loadNext();
    }

    if (!url) {
      container.textContent = letter;
      return;
    }

    tried.add(url);

    // Obrázok vložíme do stránky pred začatím načítania.
    container.replaceChildren(image);
    image.src = url;
  }

  image.onerror = () => {
    container.textContent = letter;
    void loadNext();
  };

  void loadNext();
  return container;
}

  function tokenContent(item) {
    const content = element("span", "ri-trend-token");
    content.append(tokenIcon(item));

    const details = element("span");
    details.append(
      element(
        "span",
        "ri-trend-name",
        item.name || item.symbol || "Unknown token"
      ),
      element(
        "span",
        "ri-trend-symbol",
        item.symbol || `${item.contract.slice(0, 6)}…`
      )
    );

    if (item.featured) {
      details.append(
        element("span", "ri-trend-badge", "FEATURED")
      );
    }

    content.append(details);
    return content;
  }

  function scannerLink(item, className) {
    const link = element("a", className);
    link.href = "#scanner";

    link.addEventListener("click", () => {
      const input = document.getElementById("contractInput");
      if (input) input.value = item.contract;

      // Spustí existujúci scanner po prepnutí stránky.
      setTimeout(() => {
        if (typeof analyzeToken === "function") {
          analyzeToken(item.contract);
        }
      }, 0);
    });

    return link;
  }

  function notExpired(item) {
    if (!item.expires_at) return true;

    const expiry = Date.parse(item.expires_at);
    return Number.isFinite(expiry) && expiry > Date.now();
  }

  function render() {
    root.replaceChildren();

    const ads = (Array.isArray(data?.ads) ? data.ads : [])
      .filter(item =>
        validContract(item.contract) && notExpired(item)
      )
      .slice(0, 3);

    if (ads.length) {
      const adGrid = element("div", "ri-trend-ads");

      for (const item of ads) {
        const ad = scannerLink(item, "ri-trend-ad");

        ad.append(
          element(
            "span",
            "ri-trend-ad-label",
            "ADVERTISEMENT"
          ),
          tokenContent({ ...item, featured: false })
        );

        adGrid.append(ad);
      }

      root.append(adGrid);
    }

    const tabs = element("div", "ri-trend-tabs");

    for (const [board, label] of [
      ["trending", "Trending"],
      ["new_coins", "New Coins"]
    ]) {
      const button = element("button", "ri-trend-tab", label);
      button.type = "button";
      button.setAttribute(
        "aria-selected",
        String(activeBoard === board)
      );

      button.addEventListener("click", () => {
        activeBoard = board;
        render();
      });

      tabs.append(button);
    }

    root.append(tabs);

    const board = data?.boards?.[activeBoard];

    const items = (
      Array.isArray(board?.items) ? board.items : []
    ).filter(item =>
      validContract(item.contract) && notExpired(item)
    ).slice(0, 15);

    const updated = Date.parse(board?.updated_at);

    root.append(
      element(
        "div",
        "ri-trend-status",
        Number.isFinite(updated)
          ? `Updated ${new Date(updated).toLocaleTimeString(
              [],
              { hour: "2-digit", minute: "2-digit" }
            )} · Lists refresh every 3 minutes`
          : "Lists refresh every 3 minutes"
      )
    );

    if (!items.length) {
      root.append(
        element(
          "div",
          "ri-trend-empty",
          data
            ? "No tokens currently match this list."
            : "Loading tokens…"
        )
      );
      return;
    }

    const scroll = element("div", "ri-trend-scroll");
    const table = element("table", "ri-trend-table");
    const head = element("thead");
    const heading = element("tr");

    for (const label of [
      "#", "Token", "Market Cap", "Liquidity",
      "24h Volume", "Holders", "Age"
    ]) {
      const cell = element("th", "", label);
      cell.scope = "col";
      heading.append(cell);
    }

    head.append(heading);
    table.append(head);

    const body = element("tbody");

    items.forEach((item, index) => {
      const row = element("tr");
      row.append(element("td", "", String(index + 1)));

      const tokenCell = element("td");
      const link = scannerLink(item, "ri-trend-token");
      link.append(tokenContent(item));
      tokenCell.append(link);
      row.append(tokenCell);

      for (const value of [
        money(item.market_cap_usd),
        money(item.liquidity_usd),
        money(item.volume_24h_usd),
        holders(item.holder_count),
        age(item.token_created_at)
      ]) {
        row.append(element("td", "", value));
      }

      body.append(row);
    });

    table.append(body);
    scroll.append(table);
    root.append(scroll);
  }

  async function refresh() {
    if (loading) return;
    loading = true;

    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      15000
    );

    try {
      const response = await fetch(API, {
        cache: "no-store",
        signal: controller.signal
      });

      if (!response.ok) throw new Error("Trending HTTP error");

      const result = await response.json();
      if (result.success !== true || !result.boards) {
        throw new Error("Invalid trending response");
      }

      data = result;
      render();
    } catch {
      const status = root.querySelector(".ri-trend-status");
      if (status) {
        status.textContent = data
          ? "Refresh failed. Showing the last loaded results."
          : "Unable to load tokens. Retrying automatically.";
      }

      if (!data) {
        const empty = root.querySelector(".ri-trend-empty");
        if (empty) empty.textContent = "Tokens are unavailable.";
      }
    } finally {
      clearTimeout(timeout);
      loading = false;
    }
  }

  render();
  refresh();

  setInterval(() => {
    if (!document.hidden) refresh();
  }, 180000);

  // Odstráni expirované reklamy a Featured coiny.
  setInterval(() => {
    if (!document.hidden && data) render();
  }, 15000);

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refresh();
  });
})();