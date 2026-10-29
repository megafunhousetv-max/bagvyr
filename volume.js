(() => {
  "use strict";

  if (window.RI_VOLUME_XRAY) return;
  window.RI_VOLUME_XRAY = true;

  const API =
    "https://bagvyr-api.megafunhousetv.workers.dev";

  const ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  const escape = value => String(value ?? "").replace(
    /[&<>"']/g,
    char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]
  );

  const short = value =>
    value.slice(0, 5) + "…" + value.slice(-5);

  const money = value => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2
  }).format(value);

  const count = value =>
    Number(value).toLocaleString("en-US");

  const percent = value => value === null
    ? "—"
    : Number(value).toFixed(1) + "%";

  const time = value => new Date(value).toLocaleString(
    "en-GB",
    {
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "UTC"
    }
  ) + " UTC";

  const tone = value =>
    value > 0 ? "vx-green" : value < 0 ? "vx-red" : "";

  function installStyle() {
    if (document.getElementById("vx-style")) return;

    const style = document.createElement("style");
    style.id = "vx-style";

    style.textContent = `
      #vxRoot {
        --vx-green:#42efbd;
        --vx-red:#ff667b;
        --vx-amber:#f3c363;
        color:#e8f7f0;
        position:relative;
        isolation:isolate;
        padding:24px;
        border:1px solid #275a49;
        border-radius:22px;
        background:
          radial-gradient(ellipse at 8% 0%,#19d49a12,transparent 55%),
          #06130ff2;
        box-shadow:0 0 32px #12df9e0a;
        overflow:hidden;
      }
      #vxRoot * { box-sizing:border-box }
      #vxRoot h2,#vxRoot h3,#vxRoot p { margin:0 }
      #vxRoot h2 { font-size:27px;color:#effff7 }
      #vxRoot h3 { font-size:16px;color:#effff7 }
      #vxRoot small,#vxRoot .vx-muted {
        color:#9bb9ad;font-size:12px;line-height:1.65;
      }
      #vxRoot .vx-head,#vxRoot .vx-line {
        display:flex;align-items:center;
        justify-content:space-between;gap:14px;flex-wrap:wrap;
      }
      #vxRoot .vx-head { margin-bottom:20px }
      #vxRoot button {
        border:1px solid #39755d;border-radius:10px;
        background:#103327;color:#baffdf;
        padding:9px 14px;cursor:pointer;font:inherit;
      }
      #vxRoot button:disabled { opacity:.5;cursor:wait }
      #vxRoot .vx-verdict {
        padding:20px;border:1px solid #28b58a88;
        border-radius:15px;margin-bottom:16px;
        background:linear-gradient(110deg,#10bb7920,#071a14);
        box-shadow:inset 0 0 24px #23e5a808,0 0 16px #17db9b0b;
      }
      #vxRoot .vx-verdict strong {
        display:block;color:var(--vx-green);
        font-size:19px;margin-bottom:7px;
      }
      #vxRoot .vx-metrics {
        display:grid;grid-template-columns:repeat(4,minmax(0,1fr));
        gap:12px;margin:16px 0;
      }
      #vxRoot .vx-box {
        min-width:0;border:1px solid #234b3c;
        border-radius:14px;padding:17px;background:#0a21184d;
      }
      #vxRoot .vx-metric-value {
        display:block;font-size:23px;font-weight:750;margin-top:7px;
      }
      #vxRoot .vx-green { color:var(--vx-green) }
      #vxRoot .vx-red { color:var(--vx-red) }
      #vxRoot .vx-columns {
        display:grid;grid-template-columns:1fr 1fr;gap:14px;
        margin:16px 0;
      }
      #vxRoot .vx-radar {
        position:relative;width:min(100%,300px);aspect-ratio:1;
        margin:20px auto;border:1px solid #245d47;border-radius:50%;
        background:
          linear-gradient(90deg,transparent 49.7%,#2f755b77 50%,transparent 50.3%),
          linear-gradient(transparent 49.7%,#2f755b77 50%,transparent 50.3%),
          repeating-radial-gradient(circle,#2ccf8f00 0 23px,#2ccf8f33 24px,#2ccf8f00 25px),
          #061c13;
      }
      #vxRoot .vx-radar::before {
        content:"";position:absolute;inset:0;border-radius:50%;
        background:conic-gradient(from 0deg,transparent 285deg,#2effac30 355deg,transparent 360deg);
        animation:vxRotate 12s linear infinite;pointer-events:none;
      }
      #vxRoot .vx-dot {
        position:absolute;transform:translate(-50%,-50%);
        width:var(--size);height:var(--size);
        border-radius:50%;background:var(--dot);
        box-shadow:0 0 12px var(--dot);border:1px solid #dcfff7aa;
      }
      #vxRoot .vx-dot:focus { outline:2px solid white;outline-offset:4px }
      #vxRoot .vx-bar-row {
        display:grid;grid-template-columns:105px 1fr 52px;
        align-items:center;gap:12px;margin:17px 0;font-size:13px;
      }
      #vxRoot .vx-bar {
        height:8px;background:#19392d;border-radius:20px;overflow:hidden;
      }
      #vxRoot .vx-bar i {
        display:block;height:100%;border-radius:20px;
        background:linear-gradient(90deg,#19b97d,#49efbd);
      }
      #vxRoot .vx-split {
        display:flex;height:9px;overflow:hidden;
        border-radius:20px;margin:12px 0;background:#1d362d;
      }
      #vxRoot .vx-split i { display:block;height:100% }
      #vxRoot .vx-table-wrap { overflow:auto;margin-top:16px }
      #vxRoot table {
        width:100%;border-collapse:collapse;white-space:nowrap;
        font-size:13px;
      }
      #vxRoot th,#vxRoot td {
        text-align:left;padding:13px 11px;
        border-bottom:1px solid #244234;
      }
      #vxRoot th { color:#95b6a6;font-weight:500 }
      #vxRoot a { color:#b5f6d8;text-decoration:none }
      #vxRoot a:hover { text-decoration:underline }
      #vxRoot .vx-tag {
        display:inline-block;font-size:11px;
        padding:3px 8px;border:1px solid #4a6b58;
        border-radius:20px;margin:2px 3px 2px 0;color:#b5d5c5;
      }
      #vxRoot .vx-tag.vx-warning {
        color:var(--vx-amber);border-color:#8b713a;background:#eeb6380b;
      }
      #vxRoot .vx-evidence {
        display:grid;grid-template-columns:repeat(3,minmax(0,1fr));
        gap:12px;margin:16px 0;
      }
      #vxRoot .vx-evidence p { margin:9px 0 }
      #vxRoot details { margin:12px 0 }
      #vxRoot summary { cursor:pointer;color:#b7efcf }
      #vxRoot .vx-proof {
        display:flex;gap:10px;justify-content:space-between;
        padding:8px 0;border-bottom:1px solid #244234;
      }
      #vxRoot .vx-note {
        border:1px solid #315044;border-radius:12px;
        padding:14px;margin-top:16px;color:#a8c7b8;
        font-size:12px;line-height:1.7;
      }
      #vxRoot .vx-loading {
        width:46px;height:46px;border:2px solid #1b503b;
        border-top-color:#42efbd;border-radius:50%;
        animation:vxRotate 1s linear infinite;margin:24px auto;
      }
      @keyframes vxRotate { to { transform:rotate(360deg) } }
      @media(prefers-reduced-motion:reduce) {
        #vxRoot .vx-radar::before,#vxRoot .vx-loading { animation:none }
      }
      @media(max-width:850px) {
        #vxRoot .vx-metrics { grid-template-columns:repeat(2,minmax(0,1fr)) }
        #vxRoot .vx-evidence { grid-template-columns:1fr }
      }
      @media(max-width:600px) {
        #vxRoot { padding:16px;border-radius:16px }
        #vxRoot .vx-columns { grid-template-columns:1fr }
        #vxRoot .vx-metric-value { font-size:19px }
        #vxRoot .vx-bar-row { grid-template-columns:95px 1fr 48px }
      }
    `;

    document.head.append(style);
  }

  function boot() {
    const panel = document.querySelector(
      '#riPremiumRoot [data-tool="volume"]'
    );

    if (!panel || panel.dataset.vxMounted) return;

    panel.dataset.vxMounted = "true";
    installStyle();

    panel.innerHTML = `
      <div id="vxRoot" aria-label="Volume X-Ray">
        <div class="vx-head">
          <div>
            <h2>Volume X-Ray</h2>
            <p class="vx-muted">See who is driving the volume.</p>
          </div>
          <button type="button" data-vx-refresh>Refresh</button>
        </div>
        <div id="vxContent" aria-live="polite"></div>
      </div>
    `;

    const root = panel.querySelector("#vxRoot");
    const content = panel.querySelector("#vxContent");
    const refresh = panel.querySelector("[data-vx-refresh]");

    let controller = null;
    let sequence = 0;
    let snapshot = null;
    let loadingCA = "";

    function metric(label, value, className = "") {
      return `
        <div class="vx-box">
          <small>${escape(label)}</small>
          <strong class="vx-metric-value ${className}">
            ${escape(value)}
          </strong>
        </div>
      `;
    }

    function radar(wallets) {
      const rows = wallets.slice(0, 24);
      const max = Math.max(1, ...rows.map(w => w.volume));

      return `
        <div class="vx-radar" aria-label="Observed address activity">
          ${rows.map(wallet => {
            let hash = 0;

            for (const char of wallet.address) {
              hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
            }

            const direction = wallet.net >= 0 ? 0 : Math.PI;
            const angle = direction + ((hash % 180) / 180 - 0.5) * 2;
            const radius = 12 + 30 * (1 - Math.sqrt(wallet.volume / max));
            const x = 50 + Math.cos(angle) * radius;
            const y = 50 + Math.sin(angle) * radius;
            const size = 6 + 13 * Math.sqrt(wallet.volume / max);

            const color = wallet.signals.length
              ? "#f3c363"
              : wallet.net >= 0 ? "#42efbd" : "#ff667b";

            const title = short(wallet.address) +
              " · " + money(wallet.volume) +
              " · " + wallet.flow;

            return `
              <a class="vx-dot"
                href="https://solscan.io/account/${escape(wallet.address)}"
                target="_blank" rel="noopener noreferrer"
                title="${escape(title)}"
                aria-label="${escape(title)}"
                style="left:${x}%;top:${y}%;--size:${size}px;--dot:${color}">
              </a>
            `;
          }).join("")}
        </div>
      `;
    }

    function render(data) {
      const m = data.metrics;
      const wallets = data.wallets;
      const scope = data.scope;
      const successful = scope.pools.filter(p => p.ok).length;

      const span = scope.from && scope.to
        ? Math.max(
            0,
            (Date.parse(scope.to) - Date.parse(scope.from)) / 60000
          )
        : 0;

      const top5Volume = wallets.slice(0, 5).reduce(
        (sum, wallet) => sum + wallet.volume, 0
      );

      const leaders = wallets.slice(0, 5).map(wallet => ({
        name: short(wallet.address),
        share: wallet.share
      }));

      if (m.volume > 0) {
        leaders.push({
          name: "Others / unknown",
          share: Math.max(0, (m.volume - top5Volume) / m.volume * 100)
        });
      }

      const flagged = wallets.filter(w => w.signals.length).slice(0, 3);
      const buyShare = m.volume > 0 ? m.buy / m.volume * 100 : 0;
      const sellShare = m.volume > 0 ? m.sell / m.volume * 100 : 0;

      content.innerHTML = `
        <div class="vx-verdict">
          <strong>${escape(data.summary)}</strong>
          <div class="vx-muted">
            ${count(m.swaps)} observed pool swaps ·
            ${successful}/${scope.pools.length} pools loaded ·
            ${span.toFixed(1)} min observed span
          </div>
          <small>Behavioral signals do not prove bot activity.</small>
        </div>

        <div class="vx-metrics">
          ${metric("Observed pool volume", money(m.volume))}
          ${metric("Unique addresses", count(m.unique_addresses))}
          ${metric("Top 5 volume share", percent(m.top5_share))}
          ${metric("Addresses with patterns", count(m.flagged_addresses))}
        </div>

        <div class="vx-box">
          <div class="vx-line">
            <span class="vx-green">Buy ${escape(money(m.buy))}</span>
            <span class="vx-red">Sell ${escape(money(m.sell))}</span>
          </div>
          <div class="vx-split">
            <i style="width:${buyShare}%;background:#42efbd"></i>
            <i style="width:${sellShare}%;background:#ff667b"></i>
          </div>
          <div class="vx-line vx-muted">
            <span>Net buy flow:
              <b class="${tone(m.net)}">${escape(money(m.net))}</b>
            </span>
            <span>Top 10 share: ${percent(m.top10_share)}</span>
          </div>
        </div>

        <div class="vx-columns">
          <section class="vx-box">
            <h3>Wallet activity radar</h3>
            <p class="vx-muted">Up to 24 largest observed addresses.</p>
            ${radar(wallets)}
            <p class="vx-muted">
              Larger dots / closer to centre = more volume.<br>
              Left: net selling · Right: net buying.<br>
              Amber: detected pattern. Position does not imply wallet links.
            </p>
          </section>

          <section class="vx-box">
            <h3>Who creates the volume?</h3>
            <p class="vx-muted">Share of this sample's pool swap volume.</p>
            ${leaders.map(row => `
              <div class="vx-bar-row">
                <span>${escape(row.name)}</span>
                <div class="vx-bar">
                  <i style="width:${Math.max(0, Math.min(100, row.share))}%"></i>
                </div>
                <span>${percent(row.share)}</span>
              </div>
            `).join("")}
          </section>
        </div>

        <section class="vx-box">
          <h3>Wallet behavior</h3>
          <p class="vx-muted">
            Largest ${wallets.length} attributed addresses.
            Net buying does not prove the tokens are still held.
          </p>

          <div class="vx-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Address</th><th>Bought</th><th>Sold</th>
                  <th>Net flow</th><th>Swaps</th><th>Share</th>
                  <th>Observed behavior</th>
                </tr>
              </thead>
              <tbody>
                ${wallets.map(wallet => `
                  <tr>
                    <td>
                      <a
                        href="https://solscan.io/account/${escape(wallet.address)}"
                        target="_blank" rel="noopener noreferrer"
                        title="${escape(wallet.address)}">
                        ${escape(short(wallet.address))}
                      </a>
                    </td>
                    <td>${escape(money(wallet.bought))}</td>
                    <td>${escape(money(wallet.sold))}</td>
                    <td class="${tone(wallet.net)}">
                      ${escape(money(wallet.net))}
                    </td>
                    <td>${count(wallet.trades)}</td>
                    <td>${percent(wallet.share)}</td>
                    <td>
                      <span class="vx-tag">${escape(wallet.flow)}</span>
                      ${wallet.signals.map(signal => `
                        <span class="vx-tag vx-warning"
                          title="${escape(signal.reason)}">
                          ${escape(signal.title)}
                        </span>
                      `).join("")}
                    </td>
                  </tr>
                `).join("") || `
                  <tr><td colspan="7">No attributed swaps in this sample.</td></tr>
                `}
              </tbody>
            </table>
          </div>
        </section>

        <div class="vx-evidence">
          ${flagged.map(wallet => `
            <section class="vx-box">
              <h3>${escape(short(wallet.address))}</h3>
              ${wallet.signals.map(signal => `
                <p>
                  <span class="vx-tag vx-warning">${escape(signal.title)}</span>
                  <br><small>${escape(signal.reason)}</small>
                </p>
              `).join("")}

              <details>
                <summary>Inspect recent swaps</summary>
                <small>
                  Latest swaps for this address in the sample;
                  not necessarily the full pattern sequence.
                </small>
                ${wallet.evidence.map(trade => `
                  <div class="vx-proof">
                    <span class="${trade.side === "buy" ? "vx-green" : "vx-red"}">
                      ${escape(trade.side.toUpperCase())}
                      ${escape(money(trade.usd))}
                    </span>
                    <a
                      href="https://solscan.io/tx/${escape(trade.tx)}"
                      target="_blank" rel="noopener noreferrer">
                      ${escape(time(trade.time))}
                    </a>
                  </div>
                `).join("")}
              </details>
            </section>
          `).join("")}
        </div>

        ${m.swaps > 0 && m.flagged_addresses === 0 ? `
          <div class="vx-note">
            No address met the current pattern thresholds in this sample.
            This does not confirm that all activity is organic.
          </div>
        ` : ""}

        <div class="vx-note">
          <strong>Sample coverage</strong><br>
          ${scope.from ? escape(time(scope.from)) : "—"}
          →
          ${scope.to ? escape(time(scope.to)) : "—"}<br>
          ${scope.partial
            ? "Partial result: at least one selected pool failed to load.<br>"
            : ""}
          Up to 300 recent records per selected pool.
          This is not a complete 24-hour report.
          Other pools and gaps between fetched trades are not covered.<br>
          Pool swap legs are counted separately: routed transactions can
          contain multiple swaps. Addresses are provider-attributed and
          do not necessarily represent distinct people.<br>
          Unattributed volume: ${escape(money(m.unattributed_volume))}.
          Funding links and current token balances are not assessed.<br>
          Patterns can also arise from arbitrage or legitimate automated trading.
          They are not proof of wash trading.<br>
          Source: GeckoTerminal · Snapshot:
          ${escape(time(data.fetched_at))}
        </div>
      `;
    }

    async function sync(force = false) {
      const premium = window.RI_PREMIUM;

      if (
        !premium ||
        !premium.isAvailable("volume") ||
        !premium.isActive("volume")
      ) {
        controller?.abort();
        controller = null;
        loadingCA = "";
        sequence++;
        refresh.disabled = false;
        return;
      }

      const ca = premium.getContract();

      if (!ADDRESS.test(ca || "")) {
        controller?.abort();
        controller = null;
        sequence++;
        loadingCA = "";
        refresh.disabled = false;
        content.innerHTML = `
          <div class="vx-note">
            Enter a token address at the top of Premium.
          </div>
        `;
        return;
      }

      if (!force && loadingCA === ca) return;

      if (
        !force &&
        snapshot?.contract === ca &&
        Date.now() - Date.parse(snapshot.fetched_at) < 120000
      ) {
        render(snapshot);
        return;
      }

      controller?.abort();
      const current = new AbortController();
      controller = current;

      const version = ++sequence;
      loadingCA = ca;
      refresh.disabled = true;

      content.innerHTML = `
        <div class="vx-loading" aria-hidden="true"></div>
        <p class="vx-muted">
          Loading pool swaps and analysing address behavior…
        </p>
      `;

      const timeout = setTimeout(() => current.abort(), 35000);

      try {
        const headers = await premium.getHeaders();

        if (current.signal.aborted || version !== sequence) return;

        const response = await fetch(
          API + "/api/volume-xray?ca=" + encodeURIComponent(ca),
          {
            headers,
            cache: "no-store",
            signal: current.signal
          }
        );

        const data = await response.json();

        if (
          !response.ok ||
          data?.success !== true
        ) {
          throw new Error(
            data?.error || "Volume X-Ray unavailable."
          );
        }

        if (
          data.contract !== ca ||
          !Array.isArray(data.wallets) ||
          !data.metrics ||
          !Array.isArray(data.scope?.pools)
        ) {
          throw new Error("Invalid Volume X-Ray response.");
        }

        if (
          version !== sequence ||
          premium.getContract() !== ca ||
          !premium.isActive("volume")
        ) {
          return;
        }

        snapshot = data;
        render(data);
      } catch (error) {
        if (version !== sequence) return;

        content.innerHTML = `
          <div class="vx-note">
            ${escape(
              error?.name === "AbortError"
                ? "The request timed out. Try again."
                : error?.message || "Volume X-Ray unavailable."
            )}
          </div>
        `;
      } finally {
        clearTimeout(timeout);

        if (version === sequence) {
          loadingCA = "";
          controller = null;
          refresh.disabled = false;
        }
      }
    }

    refresh.addEventListener("click", () => void sync(true));

    document.addEventListener(
      "ri:premium-token",
      () => void sync()
    );

    document.addEventListener(
      "ri:premium-change",
      () => void sync()
    );

    document.addEventListener("ri:account-change", () => {
      snapshot = null;
      controller?.abort();
      controller = null;
      loadingCA = "";
      sequence++;
      content.innerHTML = "";
      setTimeout(() => void sync(), 0);
    });

    void sync();
  }

  function start() {
    boot();

    if (document.querySelector(
      '#riPremiumRoot [data-tool="volume"][data-vx-mounted]'
    )) {
      return;
    }

    const observer = new MutationObserver(() => {
      boot();

      if (document.querySelector(
        '#riPremiumRoot [data-tool="volume"][data-vx-mounted]'
      )) {
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();