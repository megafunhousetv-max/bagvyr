(() => {
  "use strict";

  function init() {
    const root =
      document.getElementById("riPremiumRoot");

    if (!root) return;

    const adminMode =
      root.hasAttribute("data-premium-admin");

    const API =
      "https://bagvyr-api.megafunhousetv.workers.dev";

    const modules = [
      [
        "lab",
        "Exit Lab",
        "Sell simulations and token value calculator."
      ],
      [
        "whale",
        "Whale X-Ray",
        "Inspect large token holders."
      ],
      [
        "volume",
        "Volume X-Ray",
        "Inspect token trading volume."
      ],
      [
        "early_buyers",
        "Early Buyers",
        "Inspect the first token buyers."
      ],
[
  "smart_money",
  "Smart Money Radar",
  "Find top tokens by unique smart money buyers."
],

[
  "telegram_bot",
  "Premium Telegram bot",
  "A new Telegram bot. Coming soon."
]
    ];

const keys = [
  "premium",
  "public_access",
  ...modules.map(([key]) => key)
];

    const empty = () =>
      Object.fromEntries(
        keys.map(key => [key, false])
      );

    let flags = empty();
    let access = {};

    const accessKeys = [
      ...modules.map(([key]) => key),
      "history"
    ];

    const checks = key => `
      <label>
        <input
          type="checkbox"
          data-access="${key}"
          data-audience="premium"
        >
        Pre Premium
      </label>

      <label>
        <input
          type="checkbox"
          data-access="${key}"
          data-audience="public"
        >
        Verejne
      </label>
    `;
    let verified = false;
    let premiumAccess = false;
    let selected = null;
    let busy = false;
    let again = false;
    let generation = 0;
    let signature = "";
    let client = null;

    const $ = id =>
      root.querySelector(`#${id}`);

    const style =
      document.createElement("style");

    style.textContent = `
      #riPremiumRoot {
        max-width:1180px;
        margin:auto;
        padding:32px 20px;
        color:#edf7f1;
        font:15px/1.6 system-ui,sans-serif;
      }

      #riPremiumRoot [hidden],
      [data-premium-link][hidden],
      [data-premium-bot][hidden] {
        display:none!important;
      }

      #riPremiumRoot * {
        box-sizing:border-box;
      }

      #riPremiumRoot h1 {
        margin:0;
        font-size:36px;
      }

      #riPremiumRoot h2,
      #riPremiumRoot h3 {
        margin:0 0 8px;
      }

      #riPremiumRoot p {
        margin:8px 0;
        color:#a4b9ad;
      }

      #riPremiumRoot .rp-kicker {
        color:#79edaf;
        font-size:11px;
        letter-spacing:2px;
      }

      #riPremiumRoot .rp-grid {
        display:grid;
        grid-template-columns:
          repeat(auto-fit,minmax(235px,1fr));
        gap:16px;
        margin:24px 0;
      }

      #riPremiumRoot .rp-card,
      #riPremiumRoot .rp-master {
        padding:22px;
        border:1px solid #294337;
        border-radius:16px;
        background:rgba(8,23,17,.94);
      }

      #riPremiumRoot .rp-card {
        display:flex;
        flex-direction:column;
        gap:10px;
      }

      #riPremiumRoot .rp-card > p {
        flex:1;
      }

      #riPremiumRoot .rp-master {
        margin:20px 0;
      }

      #riPremiumRoot button,
      #riPremiumRoot .rp-link {
        display:inline-block;
        padding:10px 16px;
        border:1px solid #3c7356;
        border-radius:9px;
        background:#102c1e;
        color:#c5ffdd;
        font:inherit;
        cursor:pointer;
        text-decoration:none;
      }

      #riPremiumRoot button:disabled {
        opacity:.45;
        cursor:default;
      }

      #riPremiumRoot button[aria-checked="true"] {
        background:#225e3c;
        border-color:#7ceeb0;
      }

      #riPremiumRoot .rp-controls {
        padding-top:12px;
        border-top:1px solid #294337;
      }

      #riPremiumRoot .rp-controls small {
        display:block;
        margin-bottom:8px;
        color:#a4b9ad;
      }

      #riPremiumRoot .rp-tool {
        margin-top:24px;
        padding-top:24px;
        border-top:1px solid #294337;
      }

      #riPremiumRoot .lab-heading {
        margin:20px 0;
      }

      #riPremiumRoot .lab-card {
        margin:16px 0;
        padding:22px;
        background:#0c1d15;
        border:1px solid #294337;
        border-radius:14px;
      }

      #riPremiumRoot .lab-grid,
      #riPremiumRoot .lab-market {
        display:grid;
        grid-template-columns:
          repeat(auto-fit,minmax(230px,1fr));
        gap:16px;
      }

      #riPremiumRoot .lab-search,
      #riPremiumRoot .lab-own-inputs,
      #riPremiumRoot .lab-title {
        display:flex;
        flex-wrap:wrap;
        gap:12px;
        align-items:center;
      }

      #riPremiumRoot .lab-own-inputs label {
        flex:1;
        min-width:170px;
      }

      #riPremiumRoot input,
      #riPremiumRoot select {
        max-width:100%;
        padding:11px;
        background:#07110c;
        border:1px solid #355440;
        border-radius:8px;
        color:#eef8f1;
        font:inherit;
      }

      #riPremiumRoot .lab-search input {
        flex:1;
        min-width:180px;
      }

      #riPremiumRoot .lab-own-inputs input,
      #riPremiumRoot .lab-own-inputs select {
        display:block;
        width:100%;
      }

      #riPremiumRoot .lab-table-wrap {
        overflow:auto;
      }

      #riPremiumRoot table {
        width:100%;
        border-collapse:collapse;
        font-size:13px;
      }

      #riPremiumRoot th,
      #riPremiumRoot td {
        padding:10px;
        text-align:left;
        border-bottom:1px solid #294337;
      }

      #riPremiumRoot .lab-result {
        margin-top:16px;
        overflow-wrap:anywhere;
      }

      #riPremiumRoot .lab-muted {
        color:#a4b9ad;
        font-size:13px;
      }

      #riPremiumRoot .lab-market strong,
      #riPremiumRoot .lab-market small {
        display:block;
      }

      #riPremiumRoot .lab-result > div {
        display:flex;
        flex-wrap:wrap;
        justify-content:space-between;
        gap:12px;
        padding:8px 0;
      }

      @media(max-width:600px) {
        #riPremiumRoot {
          padding:24px 12px;
        }

        #riPremiumRoot .rp-grid,
        #riPremiumRoot .lab-grid {
          grid-template-columns:1fr;
        }

        #riPremiumRoot .lab-card {
          padding:14px;
        }
      }
    `;

style.textContent += `
  #riPremiumRoot .rp-token-search {
    display:flex;
    gap:12px;
    margin:22px 0 0;
  }

  #riPremiumRoot .rp-token-search input {
    flex:1;
    min-width:0;
    padding:15px 16px;
    border:1px solid #285244;
    border-radius:10px;
    background:#06100c;
    color:#e9fff5;
    font:inherit;
  }

  #riPremiumRoot .rp-token-search button {
    padding:14px 24px;
    background:#25e6ac;
    color:#032017;
    border:0;
    border-radius:10px;
    font:inherit;
    font-weight:700;
    cursor:pointer;
  }

  #riPremiumRoot #rpTokenMessage {
    color:#9db7ab;
    font-size:13px;
    margin:10px 0 18px;
  }

  #riPremiumRoot .rp-token-summary {
    display:grid;
    grid-template-columns:
      minmax(260px,2fr) repeat(3,minmax(115px,1fr));
    align-items:center;
    gap:24px;
    padding:22px;
    margin-bottom:24px;
    background:#091a13;
    border:1px solid #254438;
    border-radius:14px;
  }

  #riPremiumRoot .rp-token-summary[hidden],
  #riPremiumRoot .rp-token-avatar [hidden] {
    display:none!important;
  }

  #riPremiumRoot .rp-token-identity {
    display:flex;
    align-items:center;
    gap:14px;
    min-width:0;
  }

  #riPremiumRoot .rp-token-identity > div:last-child {
    min-width:0;
  }

  #riPremiumRoot #rpTokenName {
    overflow-wrap:anywhere;
    font-size:17px;
  }

  #riPremiumRoot .rp-token-avatar {
    width:52px;
    height:52px;
    flex-shrink:0;
    border-radius:50%;
    overflow:hidden;
    background:#12442f;
    display:grid;
    place-items:center;
    color:#ddfff1;
    font-weight:700;
  }

  #riPremiumRoot .rp-token-avatar img {
    width:100%;
    height:100%;
    object-fit:cover;
  }

  #riPremiumRoot .rp-token-meta {
    display:flex;
    align-items:center;
    flex-wrap:wrap;
    gap:8px;
    margin-top:6px;
    font-size:12px;
    color:#9db7ab;
  }

  #riPremiumRoot #rpTokenCopy {
    background:transparent;
    border:0;
    color:#25e6ac;
    padding:2px;
    cursor:pointer;
    font:inherit;
  }

  #riPremiumRoot .rp-token-summary small {
    display:block;
    color:#9db7ab;
    font-size:11px;
    margin-bottom:6px;
  }

  #riPremiumRoot .rp-token-summary strong {
    display:block;
    color:#edfff6;
    font-variant-numeric:tabular-nums;
  }

  #riPremiumRoot #rpTokenTime {
    grid-column:1/-1;
    margin:0;
  }

  /* Pôvodné formuláre zostávajú prepojené s funkciami,
     ale používateľ zadáva CA iba hore. */
  #riPremiumRoot #labForm,
  #riPremiumRoot #labToken > .lab-market,
  #riPremiumRoot #riEarlyForm {
    display:none!important;
  }

  @media(max-width:760px) {
    #riPremiumRoot .rp-token-summary {
      grid-template-columns:repeat(3,minmax(0,1fr));
      gap:18px 10px;
      padding:16px;
    }

    #riPremiumRoot .rp-token-identity {
      grid-column:1/-1;
    }

    #riPremiumRoot .rp-token-summary strong {
      overflow-wrap:anywhere;
      font-size:14px;
    }
  }

  @media(max-width:440px) {
    #riPremiumRoot .rp-token-search {
      flex-direction:column;
    }

    #riPremiumRoot .rp-token-search button {
      width:100%;
    }
  }
`;

    style.textContent += `
      body #riPremiumRoot .rp-controls {
        flex-wrap: wrap;
      }

      body #riPremiumRoot .rp-controls label {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        color: #d4ecdf;
        font-size: 12px;
        cursor: pointer;
      }

      body #riPremiumRoot
      .rp-controls input[type="checkbox"] {
        appearance: auto;
        display: inline-block;
        width: 17px;
        height: 17px;
        min-width: 17px;
        margin: 0;
        padding: 0;
        accent-color: #50efb2;
        cursor: pointer;
      }

      body #riPremiumRoot .rp-controls > small {
        flex-basis: 100%;
      }
    `;

    document.head.append(style);

    root.innerHTML = `
      <span class="rp-kicker">
        RUGINSPECT / PREMIUM
      </span>

      <h1>Premium</h1>

      <p>Explore advanced token analysis tools.</p>

      <p
        id="rpMessage"
        role="status"
        aria-live="polite"
      >Loading…</p>

      <div
        id="rpMaster"
        class="rp-master"
        hidden
      >
        <h3>Premium na webe</h3>

        <p id="rpMasterState"></p>

        <button
          type="button"
          role="switch"
          aria-checked="false"
          data-toggle="premium"
        >
          Zapnúť Premium
        </button>

<div
  class="rp-controls"
  data-admin-control
  hidden
>
  <strong>História vyhľadávania</strong>

  ${checks("history")}

  <small>
    Verejne = všetci prihlásení.
    Každý vidí iba svoju históriu.
  </small>
</div>

<button type="button" id="rpRefresh">
  Obnoviť stav
</button>
      </div>

<div id="rpBody" hidden>

  <div id="rpSharedToken">
    <form id="rpTokenForm" class="rp-token-search">
      <input
        id="rpTokenCA"
        aria-label="Solana contract address"
        placeholder="Paste a Solana contract address"
        maxlength="44"
        autocomplete="off"
        spellcheck="false"
        required
      >

      <button type="submit">
        Load token
      </button>
    </form>

    <p
      id="rpTokenMessage"
      role="status"
      aria-live="polite"
    >
      Enter a CA, then choose a tool below.
    </p>

    <section
      id="rpTokenSummary"
      class="rp-token-summary"
      hidden
    >
      <div class="rp-token-identity">
        <div class="rp-token-avatar">
          <img
            id="rpTokenImage"
            alt="Token logo"
            referrerpolicy="no-referrer"
            hidden
          >

          <span id="rpTokenFallback">?</span>
        </div>

        <div>
          <strong id="rpTokenName">—</strong>

          <div class="rp-token-meta">
            <span id="rpTokenSymbol">—</span>

            <button
              id="rpTokenCopy"
              type="button"
              aria-label="Copy contract address"
            >
              Copy CA
            </button>

            <span id="rpTokenAddress"></span>
          </div>
        </div>
      </div>

      <div>
        <small>PRICE</small>
        <strong id="rpTokenPrice">—</strong>
      </div>

      <div>
        <small>MARKET CAP</small>
        <strong id="rpTokenMC">—</strong>
      </div>

      <div>
        <small>LIQUIDITY</small>
        <strong id="rpTokenLiquidity">—</strong>
      </div>

      <small id="rpTokenTime">—</small>
    </section>
  </div>

  <div class="rp-grid">
          ${modules.map(
            ([key, title, description]) => `
              <article
                class="rp-card"
                data-card="${key}"
              >
                <h3>${title}</h3>

                <p>${description}</p>

                <button
                  type="button"
                  data-open="${key}"
                  aria-expanded="false"
                >
                  Open ${title}
                </button>

                <div
                  class="rp-controls"
                  data-admin-control
                  hidden
                >
                  ${checks(key)}
                </div>
              </article>
            `
          ).join("")}
        </div>

        <p id="rpEmpty" hidden>
          No tools are available yet.
        </p>

        ${modules.map(([key, title]) => `
          <section
            class="rp-tool"
            data-tool="${key}"
            hidden
          >
            ${
              key === "lab"
                ? '<div id="riLabRoot"></div>'
                : `
                  <h2>${title}</h2>

                  ${
                    key === "telegram_bot"
                      ? `
                        <p>
  The Premium Telegram bot is in development.
</p>
                      `
                      : `
                        <p>
                          This tool is in development.
                        </p>
                      `
                  }
                `
            }
          </section>
        `).join("")}
      </div>
    `;

const available = key =>
  verified ||
  (
    !adminMode &&
    flags.premium === true &&
    (
      access[key]?.public === true ||
      (
        premiumAccess &&
        access[key]?.premium === true
      )
    )
  );

    function publish() {
      if (
        selected &&
        !available(selected)
      ) {
        selected = null;
      }

$("rpBody").hidden = adminMode
  ? !verified
  : !(
      verified ||
      modules.some(
        ([key]) => available(key)
      )
    );

      $("rpMaster").hidden =
        !adminMode || !verified;

      $("rpMasterState").textContent =
        flags.premium
          ? "Verejný web: ZAPNUTÉ"
          : "Verejný web: VYPNUTÉ";

$("rpSharedToken").hidden =
  selected === "smart_money";

      let count = 0;

      root.querySelectorAll(
        "[data-card]"
      ).forEach(card => {
        const allowed =
          available(card.dataset.card);

        card.hidden = !allowed;

        if (allowed) count++;
      });

      $("rpEmpty").hidden = count > 0;

      root.querySelectorAll(
        "[data-tool]"
      ).forEach(panel => {
        panel.hidden =
          panel.dataset.tool !== selected ||
          !available(panel.dataset.tool);
      });

      root.querySelectorAll(
        "[data-open]"
      ).forEach(button => {
        button.setAttribute(
          "aria-expanded",
          String(
            button.dataset.open === selected
          )
        );
      });

      root.querySelectorAll(
        "[data-admin-control]"
      ).forEach(panel => {
        panel.hidden =
          !adminMode || !verified;
      });

      root.querySelectorAll(
        "[data-toggle]"
      ).forEach(button => {
        const on =
          flags[button.dataset.toggle];

        button.disabled =
          busy || !verified;

        button.setAttribute(
          "aria-checked",
          String(on)
        );

if (button.dataset.toggle === "premium") {
  button.textContent = on
    ? "Vypnúť Premium"
    : "Zapnúť Premium";
} else if (button.dataset.toggle === "public_access") {
  button.textContent = on
    ? "Vypnúť verejné Premium bez prihlásenia"
    : "Zapnúť verejné Premium bez prihlásenia";
} else {
  button.textContent = on
    ? "Vypnúť na webe"
    : "Zapnúť na webe";
}
      });

      root.querySelectorAll(
        "[data-access]"
      ).forEach(input => {
        input.checked =
          access[input.dataset.access]?.[
            input.dataset.audience
          ] === true;

        input.disabled =
          busy || !verified;
      });

      $("rpRefresh").disabled = busy;

      if (!adminMode) {
        document.querySelectorAll(
          "[data-premium-link]"
        ).forEach(link => {
          link.hidden = !(
            flags.premium ||
            verified ||
            premiumAccess
          );
        });
      }

      const next = JSON.stringify([
        flags,
        access,
        verified,
        premiumAccess,
        selected
      ]);

      if (next !== signature) {
        signature = next;

        document.dispatchEvent(
          new Event("ri:premium-change")
        );
      }
    }

async function headers() {
  const authClient = adminMode
    ? window.BAGVYR_ADMIN_CLIENT
    : window.RI_ACCOUNT_CLIENT;

  const result = authClient
    ? await authClient.auth.getSession()
    : null;

  if (result?.error) {
    throw result.error;
  }

  const session = result?.data?.session;

  if (adminMode && !session) {
    throw new Error(
      "Sign in again."
    );
  }

  return session
    ? {
        Authorization:
          "Bearer " + session.access_token
      }
    : {};
}

let premiumContract = "";
let premiumRequest = null;

const sharedMoney = value =>
  value !== null &&
  value !== undefined &&
  String(value).trim() !== "" &&
  Number.isFinite(Number(value)) &&
  Number(value) >= 0
    ? new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits:
          Number(value) < 0.01 ? 10 : 2
      }).format(Number(value))
    : "—";

function showPremiumMarket(data) {
  $("rpTokenPrice").textContent =
    sharedMoney(data.priceUsd ?? data.price);

  $("rpTokenMC").textContent =
    sharedMoney(
      data.marketCapUsd ?? data.market_cap
    );

  $("rpTokenLiquidity").textContent =
    sharedMoney(
      data.liquidityUsd ?? data.liquidity
    );

  const stamp =
    data.timestamp || data.fetched_at;

  $("rpTokenTime").textContent =
    stamp && Number.isFinite(Date.parse(stamp))
      ? "Market snapshot · " +
        new Date(stamp).toLocaleTimeString()
      : "Market timestamp unavailable";
}

function showPremiumImages(values, contract) {
  const candidates = [...new Set(values)].flatMap(
    value => {
      if (typeof value !== "string") return [];

      let raw = value.trim()
        .replace(
          /^ipfs:\/\/(?:ipfs\/)?/,
          "https://ipfs.io/ipfs/"
        )
        .replace(
          /^ar:\/\//,
          "https://arweave.net/"
        );

      if (raw.startsWith("//")) {
        raw = "https:" + raw;
      }

      try {
        const url = new URL(raw);

        return (
          url.protocol === "https:" &&
          !url.username &&
          !url.password
        )
          ? [url.href]
          : [];
      } catch {
        return [];
      }
    }
  );

  const img = $("rpTokenImage");

  img.hidden = true;
  $("rpTokenFallback").hidden = false;
  img.removeAttribute("src");

  let index = 0;

  const next = () => {
    if (
      premiumContract !== contract ||
      index >= candidates.length
    ) {
      return;
    }

    img.src = candidates[index++];
  };

  img.onload = () => {
    if (premiumContract !== contract) return;

    img.hidden = false;
    $("rpTokenFallback").hidden = true;
  };

  img.onerror = next;
  next();
}

$("rpTokenForm").addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    const contract =
      $("rpTokenCA").value.trim();

    if (
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/
        .test(contract)
    ) {
      $("rpTokenMessage").textContent =
        "Enter a valid Solana contract address.";

      return;
    }

    premiumRequest?.abort();

    const controller = new AbortController();
    premiumRequest = controller;

    const timeout = setTimeout(
      () => controller.abort(),
      30000
    );

    const rememberSearch =
      window.RI_RECENT_SEARCHES?.start(contract);

    premiumContract = contract;

    $("rpTokenSummary").hidden = false;
    $("rpTokenName").textContent = "Selected token";
    $("rpTokenSymbol").textContent = "—";

    $("rpTokenAddress").textContent =
      contract.slice(0, 6) +
      "…" +
      contract.slice(-6);

    $("rpTokenFallback").textContent = "?";

    showPremiumImages([], contract);
    showPremiumMarket({});

    $("rpTokenMessage").textContent =
      "Loading token details…";

    document.dispatchEvent(
      new CustomEvent("ri:premium-token", {
        detail: { contract }
      })
    );

    const get = async path => {
      const response = await fetch(
        API + path +
        "?ca=" + encodeURIComponent(contract),
        {
          cache: "no-store",
          signal: controller.signal
        }
      );

      const data = await response.json();

      if (
        !response.ok ||
        data?.success !== true ||
        (data.contract || data.contractAddress)
          !== contract
      ) {
        throw new Error(
          "Token details unavailable."
        );
      }

      return data;
    };

    try {
      const results = await Promise.allSettled([
        get("/api/market").then(data => {
          if (premiumRequest !== controller) return;

          showPremiumMarket(data);

          if (
            data.image &&
            $("rpTokenImage").hidden
          ) {
            showPremiumImages(
              [data.image],
              contract
            );
          }
        }),

        get("/api/token-images").then(data => {
          if (premiumRequest !== controller) return;

          $("rpTokenName").textContent =
            data.name || "Selected token";

          $("rpTokenSymbol").textContent =
            data.symbol
              ? "$" + data.symbol.replace(/^\$/, "")
              : "—";

          $("rpTokenFallback").textContent =
            (data.symbol || data.name || "?")
              .slice(0, 2)
              .toUpperCase();

          showPremiumImages(
            Array.isArray(data.images)
              ? data.images
              : [],
            contract
          );
        })
      ]);

      if (premiumRequest !== controller) return;

      if (
        results.some(
          result =>
            result.status === "fulfilled"
        )
      ) {
        const tokenName =
          $("rpTokenName").textContent.trim();

        const tokenSymbol =
          $("rpTokenSymbol").textContent.trim();

        rememberSearch?.({
          name:
            tokenName === "Selected token"
              ? ""
              : tokenName,

          symbol:
            tokenSymbol === "—"
              ? ""
              : tokenSymbol,

          image:
            $("rpTokenImage")
              .getAttribute("src") || ""
        });
      }

      $("rpTokenMessage").textContent =
        results.some(
          result => result.status === "rejected"
        )
          ? "Token selected. Some details are unavailable. Choose a tool below."
          : "Token selected. Choose a tool below.";
    } finally {
      clearTimeout(timeout);

      if (premiumRequest === controller) {
        premiumRequest = null;
      }
    }
  }
);

$("rpTokenCopy").addEventListener(
  "click",
  async () => {
    if (!premiumContract) return;

    try {
      await navigator.clipboard.writeText(
        premiumContract
      );

      $("rpTokenMessage").textContent =
        "Contract address copied.";
    } catch {
      $("rpTokenMessage").textContent =
        "Copy the address from the input above.";
    }
  }
);

document.addEventListener(
  "ri:premium-market",
  event => {
    if (
      event.detail?.contract === premiumContract
    ) {
      showPremiumMarket(event.detail);
    }
  }
);

window.RI_PREMIUM = {
  getContract: () => premiumContract,

  isAvailable: available,

  isActive: key =>
    available(key) &&
    selected === key &&
    (
      adminMode
        ? (
            !root.closest(".admin-section").hidden &&
            !document.getElementById("dashboard").hidden
          )
        : location.hash === "#premium"
    ),

  getHeaders: headers
};

async function refresh(
  feature = null,
  audience = null
) {
  if (feature !== null && !adminMode) {
    return;
  }

  if (busy) {
    if (feature === null) {
      again = true;
    }

    return;
  }

  busy = true;

  const version = generation;

  publish();

  try {
    client = adminMode
      ? window.BAGVYR_ADMIN_CLIENT
      : window.RI_ACCOUNT_CLIENT;

    let authHeaders = {};

    if (client) {
      const result =
        await client.auth.getSession();

      if (result.error) {
        throw result.error;
      }

      if (result.data?.session) {
        authHeaders.Authorization =
          "Bearer " +
          result.data.session.access_token;
      }
    }

    if (
      adminMode &&
      !authHeaders.Authorization
    ) {
      throw new Error(
        "Sign in to your admin account."
      );
    }

    let saved = null;
    let savedAccess = null;

    if (adminMode) {
      const result = await client.rpc(
        "ri_premium_settings",
        {
          p_feature:
            audience ? null : feature,

          p_enabled:
            feature === null || audience
              ? null
              : !flags[feature]
        }
      );

      if (result.error) {
        throw result.error;
      }

      saved = result.data;

      const ruleResult = await client.rpc(
        "ri_feature_access",
        {
          p_feature:
            audience ? feature : null,

          p_audience:
            audience,

          p_enabled:
            audience
              ? access[feature]?.[audience] !== true
              : null
        }
      );

      if (ruleResult.error) {
        throw ruleResult.error;
      }

      savedAccess =
        ruleResult.data?.access;
    }

    const response = await fetch(
      API +
        (
          adminMode
            ? "/api/premium/admin/status"
            : "/api/premium/status"
        ),
      {
        headers: authHeaders,
        cache: "no-store",
        signal: AbortSignal.timeout(12000)
      }
    );

    let data = await response.json();

    if (saved) {
      data = {
        ...data,

        ...Object.fromEntries(
          keys.map(
            key => [key, saved[key]]
          )
        )
      };
    }

    if (savedAccess) {
      data.access = savedAccess;
    }

    if (
      !response.ok ||
      data?.success !== true ||

      keys.some(
        key =>
          typeof data[key] !== "boolean"
      ) ||

      accessKeys.some(
        key =>
          typeof data.access?.[key]?.premium !==
            "boolean" ||
          typeof data.access?.[key]?.public !==
            "boolean"
      ) ||

      typeof data.admin !== "boolean" ||
      typeof data.premium_active !== "boolean" ||

      (
        adminMode &&
        data.admin !== true
      )
    ) {
      throw new Error(
        data?.error ||
        "Premium settings unavailable."
      );
    }

    if (version !== generation) {
      return;
    }

    flags = Object.fromEntries(
      keys.map(
        key => [key, data[key]]
      )
    );

    access = data.access;

    verified =
      data.admin === true;

    premiumAccess =
      data.premium_active === true;

    $("rpMessage").textContent =
      verified
        ? "Admin access active. All tools are available."
        : flags.premium !== true
          ? "Premium is temporarily unavailable."
          : modules.some(
              ([key]) => available(key)
            )
            ? ""
            : "No tools are available for your account. Sign in or check your Premium access.";

  } catch (error) {
    if (version !== generation) {
      return;
    }

    verified = false;
    premiumAccess = false;
    flags = empty();

    $("rpMessage").textContent =
      error.message ||
      "Premium unavailable. Try refreshing.";

  } finally {
    busy = false;

    publish();

    if (again) {
      again = false;
      void refresh();
    }
  }
}

    root.addEventListener("click", event => {
      const open = event.target.closest(
        "[data-open]"
      );

      if (
        open &&
        available(open.dataset.open)
      ) {
        selected =
          selected === open.dataset.open
            ? null
            : open.dataset.open;

        publish();
      }

      const toggle = event.target.closest(
        "[data-toggle]"
      );

      if (
  adminMode &&
  toggle &&
  verified &&
  !busy
) {
        void refresh(
          toggle.dataset.toggle
        );
      }
    });

    root.addEventListener(
      "change",
      event => {
        const input = event.target.closest(
          "[data-access]"
        );

        if (
          !adminMode ||
          !input ||
          !verified ||
          busy
        ) {
          return;
        }

        void refresh(
          input.dataset.access,
          input.dataset.audience
        );
      }
    );

    $("rpRefresh").onclick =
      () => void refresh();

document.addEventListener(
  "ri:account-change",
  () => {
    if (adminMode) return;

    generation++;
    verified = false;
    premiumAccess = false;
    flags = empty();

    publish();
    void refresh();
  }
);

    let attached = false;

    function attachAuth() {
      if (
        attached ||
        !window.BAGVYR_ADMIN_CLIENT
      ) {
        return;
      }

      attached = true;

      window.BAGVYR_ADMIN_CLIENT.auth
        .onAuthStateChange(event => {
          if (
            [
              "INITIAL_SESSION",
              "SIGNED_IN",
              "SIGNED_OUT"
            ].includes(event)
          ) {
            generation++;

            verified = false;
            flags = empty();

            publish();
          }

          setTimeout(
            () => void refresh(),
            0
          );
        });

      void refresh();
    }

    if (adminMode) {
      window.addEventListener(
        "bagvyr-admin-ready",
        attachAuth
      );

      document.addEventListener(
        "bagvyr:admin-section",
        event => {
          document.dispatchEvent(
            new Event(
              "ri:premium-change"
            )
          );

          if (
            event.detail?.section ===
            "premium"
          ) {
            void refresh();
          }
        }
      );

      attachAuth();
    }

    window.addEventListener(
      "hashchange",
      () => {
        document.dispatchEvent(
          new Event("ri:premium-change")
        );
      }
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (!document.hidden) {
          void refresh();
        }
      }
    );

    setInterval(() => {
      if (!document.hidden) {
        void refresh();
      }
    }, 15000);

    publish();

    void refresh();
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