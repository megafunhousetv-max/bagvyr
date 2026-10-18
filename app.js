/* =========================================================
   BAGVYR
   Solana Token Scanner
   Frontend Application
   Version: 1.6
   ========================================================= */

"use strict";


/* =========================================================
   CONFIG
   ========================================================= */

const CONFIG = {
  API_BASE: "https://bagvyr-api.megafunhousetv.workers.dev",

ENDPOINTS: {

  analyze: "/api/analyze",

  market: "/api/market",

  walletTransactions: "/api/wallet-transactions",

  earlyTransactions: "/api/early-transactions",

creatorConnections: "/api/creator-connections",

exitAnalysis: "/api/exit-analysis"

},

  TRANSACTION_LIMIT: 50,
  EARLY_TRANSACTION_LIMIT: 50,

  REQUEST_TIMEOUT: 30000,
  MARKET_TIMEOUT: 7000,
  MARKET_REFRESH_MS: 5000
};


/* =========================================================
   STATE
   ========================================================= */

const state = {
  currentContract: null,
  currentAnalysis: null,

  creatorWallet: null,

 transactionsLoaded: false,
earlyActivityLoaded: false,
creatorConnectionsLoaded: false,
creatorConnectionsLoading: false,

  analyzing: false,

  marketRefreshTimer: null,
  marketRefreshInFlight: false,

  tokenImageCandidates: [],
  tokenImageIndex: 0
};


/* =========================================================
   DOM
   ========================================================= */

const elements = {
  contractInput: document.getElementById("contractInput"),
  analyzeButton: document.getElementById("analyzeButton"),

  errorBox: document.getElementById("errorBox"),
  errorMessage: document.getElementById("errorMessage"),

  loadingSection: document.getElementById("loadingSection"),
  loadingText: document.getElementById("loadingText"),

  resultsSection: document.getElementById("resultsSection"),

  tokenImageWrapper: document.getElementById("tokenImageWrapper"),
  tokenImage: document.getElementById("tokenImage"),
  tokenImageFallback: document.getElementById("tokenImageFallback"),

  tokenName: document.getElementById("tokenName"),
  tokenSymbol: document.getElementById("tokenSymbol"),
  tokenContract: document.getElementById("tokenContract"),

  copyContractButton: document.getElementById("copyContractButton"),

  solscanTokenLink: document.getElementById("solscanTokenLink"),
  pumpFunLink: document.getElementById("pumpFunLink"),

  riskScore: document.getElementById("riskScore"),
  riskLevel: document.getElementById("riskLevel"),

  marketCap: document.getElementById("marketCap"),

  livePrice:
    document.getElementById("livePrice"),

  liveVolume24h:
    document.getElementById("liveVolume24h"),

  liveLiquidity:
    document.getElementById("liveLiquidity"),

  peakMarketCap:
    document.getElementById("peakMarketCap"),

  dropFromPeak:
    document.getElementById("dropFromPeak"),

  marketStatus:
    document.getElementById("marketStatus"),

  holderCount: document.getElementById("holderCount"),

  tokenSupply: document.getElementById("tokenSupply"),

  top10Concentration:
    document.getElementById("top10Concentration"),

  adjustedTop10Concentration:
    document.getElementById("adjustedTop10Concentration"),

  top20Concentration:
    document.getElementById("top20Concentration"),

  launchPlatform:
    document.getElementById("launchPlatform"),

  mintAuthorityCard:
    document.getElementById("mintAuthorityCard"),

  mintAuthorityStatus:
    document.getElementById("mintAuthorityStatus"),

  freezeAuthorityCard:
    document.getElementById("freezeAuthorityCard"),

  freezeAuthorityStatus:
    document.getElementById("freezeAuthorityStatus"),

  metadataCard:
    document.getElementById("metadataCard"),

  metadataStatus:
    document.getElementById("metadataStatus"),

  holderTop10:
    document.getElementById("holderTop10"),

  holderTop20:
    document.getElementById("holderTop20"),

  top10Progress:
    document.getElementById("top10Progress"),

  top20Progress:
    document.getElementById("top20Progress"),

  holdersTableBody:
    document.getElementById("holdersTableBody"),

  holderMethodology:
    document.getElementById("holderMethodology"),

  creatorWallet:
    document.getElementById("creatorWallet"),

  creatorConfidence:
    document.getElementById("creatorConfidence"),

  creatorHolding:
    document.getElementById("creatorCurrentHolding"),

  creatorPercentage:
    document.getElementById("creatorCurrentSupply"),

creatorSold:
  document.getElementById("creatorSoldAmount"),

creatorSupplySold:
  document.getElementById("creatorSoldSupply"),

  creatorSolBalance:
    document.getElementById("creatorSolBalance"),

  creatorTopHolder:
    document.getElementById("creatorTopHolder"),

  creatorDetectionNote:
    document.getElementById("creatorDetectionNote"),

  loadTransactionsButton:
    document.getElementById("loadCreatorTransactionsButton"),

  transactionsSection:
    document.getElementById("creatorTransactionsSection"),

  transactionsLoading:
    document.getElementById("creatorTransactionsLoading"),

  transactionsList:
    document.getElementById("creatorTransactionsTableBody"),

  transactionCount:
    document.getElementById("creatorTransactionsCount"),

analyzeCreatorConnectionsButton:

  document.getElementById(
    "analyzeCreatorConnectionsButton"
  ),


creatorConnectionsLoading:

  document.getElementById(
    "creatorConnectionsLoading"
  ),


creatorConnectionsResults:

  document.getElementById(
    "creatorConnectionsResults"
  ),


creatorConnectionsTransactions:

  document.getElementById(
    "creatorConnectionsTransactions"
  ),


creatorConnectionsFundedWallets:

  document.getElementById(
    "creatorConnectionsFundedWallets"
  ),


creatorConnectionsTokenHolders:

  document.getElementById(
    "creatorConnectionsTokenHolders"
  ),


creatorConnectionsCombinedHolding:

  document.getElementById(
    "creatorConnectionsCombinedHolding"
  ),


creatorConnectionsCombinedSupply:

  document.getElementById(
    "creatorConnectionsCombinedSupply"
  ),


creatorConnectionsCount:

  document.getElementById(
    "creatorConnectionsCount"
  ),


creatorConnectionsTableBody:

  document.getElementById(
    "creatorConnectionsTableBody"
  ),


creatorConnectionsEmpty:

  document.getElementById(
    "creatorConnectionsEmpty"
  ),


creatorConnectionsNote:

  document.getElementById(
    "creatorConnectionsNote"
  ),

  connectionSignals:
    document.getElementById("connectionSignals"),

  analyzeEarlyButton:
    document.getElementById("analyzeEarlyButton"),

  earlyLoading:
    document.getElementById("earlyLoading"),

  earlyResults:
    document.getElementById("earlyResults"),

  riskSignalCount:
    document.getElementById("riskSignalCount"),

riskSignalsList:
  document.getElementById("riskSignalsList"),

/* Holder list toggle */

holdersToggleButton:
  document.getElementById("toggleHoldersButton"),

holdersToggleArrow:
  document.getElementById("holdersToggleArrow"),

holdersTableWrapper:
  document.getElementById("holdersTableSection"),

/* Creator refresh */

creatorRefreshButton:
  document.getElementById("refreshCreatorButton"),

/* Exit / Rug analysis */

exitAnalysisSection:
  document.getElementById("exitAnalysisSection"),

exitMajorEvent:
  document.getElementById("exitMajorEvent"),

exitCreatorSell:
  document.getElementById("exitCreatorSell"),

exitCreatorSold:
  document.getElementById("exitCreatorSold"),

exitMarketCollapse:
  document.getElementById("exitMarketCollapse"),

exitLiquidity:
  document.getElementById("exitLiquidity"),

exitStatus:
  document.getElementById("exitStatus"),

exitAnalysisNote:
  document.getElementById("exitAnalysisNote"),

/* Full Analysis - Exit / Rug Analysis */

exitCreatorSellDetail:
  document.getElementById("exitCreatorSellDetail"),

exitMajorEventDetail:
  document.getElementById("exitMajorEventDetail"),

exitMarketCollapseDetail:
  document.getElementById("exitMarketCollapseDetail"),

exitCreatorSoldDetail:
  document.getElementById("exitCreatorSoldDetail"),

exitLiquidityDetail:
  document.getElementById("exitLiquidityDetail"),

exitStatusDetail:
  document.getElementById("exitStatusDetail"),

exitAnalysisDetailNote:
  document.getElementById("exitAnalysisDetailNote"),

toast:
  document.getElementById("toast")
};


/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  initializeEvents();

  const params =
    new URLSearchParams(window.location.search);

  const contract =
    params.get("ca");

  if (
    contract &&
    isLikelySolanaAddress(contract)
  ) {
    if (elements.contractInput) {
      elements.contractInput.value =
        contract;
    }

    analyzeToken(contract);
  }
});


window.addEventListener(
  "beforeunload",
  () => {
    stopMarketRefresh();
  }
);


/* =========================================================
   EVENTS
   ========================================================= */

function initializeEvents() {
    document
    .getElementById("shareAnalysisButton")
    ?.addEventListener("click", shareAnalysis);
    elements.copyContractButton?.addEventListener(
    "click",
    copyContract
  );

  const refreshButton =
    document.getElementById("refreshAnalysisButton");

  refreshButton?.addEventListener("click", async () => {
    if (state.analyzing || !state.currentContract) {
      return;
    }

    const contract = state.currentContract;

    refreshButton.disabled = true;
    refreshButton.textContent = "REFRESHING...";

    try {
      await analyzeToken(contract);
    } finally {
      refreshButton.disabled = false;
      refreshButton.textContent = "REFRESH";
    }
  });
  
  elements.analyzeButton?.addEventListener(
    "click",
    handleAnalyze
  );

  elements.contractInput?.addEventListener(
    "keydown",
    event => {
      if (event.key === "Enter") {
        handleAnalyze();
      }
    }
  );

  elements.contractInput?.addEventListener(
    "input",
    hideError
  );

elements.creatorRefreshButton?.addEventListener(
  "click",
  refreshCreatorAnalysis
);

  elements.loadTransactionsButton?.addEventListener(
    "click",
    loadCreatorTransactions
  );

elements.analyzeCreatorConnectionsButton?.addEventListener(

  "click",

  loadCreatorConnections

);

  elements.analyzeEarlyButton?.addEventListener(
    "click",
    loadEarlyActivity
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (
        document.visibilityState === "visible" &&
        state.currentContract
      ) {
        refreshMarket();
      }
    }
  );
}


/* =========================================================
   ANALYZE BUTTON
   ========================================================= */

function handleAnalyze() {
  if (state.analyzing) {
    return;
  }

  const contract =
    elements.contractInput?.value.trim();

  if (!contract) {
    showError(
      "Paste a Solana token contract address first."
    );
    return;
  }

  if (!isLikelySolanaAddress(contract)) {
    showError(
      "This does not look like a valid Solana contract address."
    );
    return;
  }

  analyzeToken(contract);
}


/* =========================================================
   MAIN ANALYSIS
   ========================================================= */

async function analyzeToken(contract) {
  try {
    state.analyzing = true;

    stopMarketRefresh();
    resetAnalysisState();

state.currentContract =
  contract;

void loadDexPaidBadge(contract);
void loadCoinGeckoBadge(contract);

hideError();
hideResults();

    setAnalyzeButtonLoading(true);

    showLoading(
      "Reading token information..."
    );

    const messages = [
      "Reading token information...",
      "Checking token authorities...",
      "Analyzing largest holders...",
      "Identifying liquidity infrastructure...",
      "Looking for creator activity...",
      "Calculating RugInspect risk signals..."
    ];

    let messageIndex = 0;

    const loadingInterval =
      setInterval(() => {
        messageIndex =
          Math.min(
            messageIndex + 1,
            messages.length - 1
          );

        if (elements.loadingText) {
          elements.loadingText.textContent =
            messages[messageIndex];
        }
      }, 1300);

    let data;

    try {
      data =
        await apiRequest(
          `${CONFIG.ENDPOINTS.analyze}?ca=${encodeURIComponent(contract)}`
        );
    } finally {
      clearInterval(
        loadingInterval
      );
    }

    if (
      !data ||
      data.success === false
    ) {
      throw new Error(
        data?.error ||
        data?.details ||
        "Token analysis failed."
      );
    }

    state.currentAnalysis =
      data;

renderAnalysis(data);

void riLoadLaunchRiskSignals(
  contract,
  data
);

window.BagVyrAnalytics?.tokenSearch(contract);

await loadExitAnalysis(contract);

updateBrowserURL(contract);

    hideLoading();
    showResults();

    /*
      Start lightweight live market refresh.
      Full token analysis is NOT repeated.
    */

refreshMarket();
startMarketRefresh(
  contract
);

    window.setTimeout(() => {
      elements.resultsSection?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 100);

  } catch (error) {
    console.error(
      "RugInspect analysis error:",
      error
    );

    stopMarketRefresh();

    hideLoading();

    showError(
      friendlyErrorMessage(error)
    );

  } finally {
    state.analyzing = false;

    setAnalyzeButtonLoading(false);
  }
}


/* =========================================================
   RENDER ANALYSIS
   ========================================================= */

function renderAnalysis(data) {
  const token =
    data.token || {};

  const authorities =
    data.authorities || {};

  const holders =
    data.holderAnalysis ||
    data.holders ||
    {};

  const creator =
    data.creator || {};

  const score =
    data.score || {};

  const risks =
    data.riskSignals ||
    data.risks ||
    [];

  const connections =
    data.connections ||
    [];

  renderTokenIdentity(
    token,
    data
  );

  renderScore(
    score,
    data
  );

  renderQuickStats(
    token,
    holders,
    data
  );

  renderSecurity(
    authorities,
    token,
    data
  );

  renderHolders(
    holders,
    data
  );

  renderCreator(
    creator,
    data
  );

  renderConnections(
    connections
  );

  renderRiskSignals(
    risks,
    data
  );

  renderInsiderAnalysis(data);
  renderAnalysisHighlights(data);
  riUpdateExitVerification();
}


function renderInsiderAnalysis(data) {
  const analysis = data?.insiderAnalysis;

  const detectedEl =
    document.getElementById("insidersDetected");

  const networksEl =
    document.getElementById("insiderNetworks");

  if (!detectedEl || !networksEl) return;

  if (!analysis) {
    detectedEl.textContent = "---";

    networksEl.innerHTML = `
      <div class="insider-empty">
        Insider data unavailable
      </div>
    `;

    return;
  }

  detectedEl.textContent =
    analysis.insidersDetected ?? "0";

  const networks =
    Array.isArray(analysis.networks)
      ? analysis.networks
      : [];

  if (!networks.length) {
    networksEl.innerHTML = `
      <div class="insider-empty">
        No insider networks detected
      </div>
    `;

    return;
  }

  networksEl.innerHTML = networks
    .map((network, index) => {
      const holding =
        typeof network.currentHolding === "number"
          ? formatNumber(network.currentHolding)
          : "---";

      const accounts =
        network.accounts ?? "---";

      const type =
        network.type
          ? String(network.type)
              .replaceAll("_", " ")
              .toUpperCase()
          : "NETWORK";

      return `
        <div class="insider-network">

          <div class="insider-network-number">
            ${String(index + 1).padStart(2, "0")}
          </div>

          <div class="insider-network-holding">
            <strong>${holding}</strong>
            <span>CURRENT HOLDING</span>
          </div>

          <div class="insider-network-accounts">
            <strong>${accounts}</strong>
            <span>ACCOUNTS</span>
          </div>

          <div class="insider-network-type">
             ${type}
          </div>

        </div>
      `;
    })
    .join("");
}


/* =========================================================
   TOKEN IDENTITY
   ========================================================= */

const dexTokenImageCache = new Map();
let tokenImageRequestVersion = 0;

async function getDexTokenImage(contract) {
  if (dexTokenImageCache.has(contract)) {
    return dexTokenImageCache.get(contract);
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
        throw new Error("Invalid Dex response");
      }

      const matchingPairs = pairs
        .filter(pair =>
          pair?.chainId === "solana" &&
          pair?.baseToken?.address === contract
        )
        .sort((a, b) =>
          Number(b?.liquidity?.usd || 0) -
          Number(a?.liquidity?.usd || 0)
        );

      for (const pair of matchingPairs) {
        const image = normalizeImageURL(
          pair?.info?.imageUrl
        );

        if (image) return image;
      }

      return null;
    } finally {
      clearTimeout(timeout);
    }
  })();

  dexTokenImageCache.set(contract, request);

  try {
    return await request;
} catch (error) {
  console.warn("DexScreener logo loading failed:", error);
  dexTokenImageCache.delete(contract);
  return null;
}
}

async function addDexTokenImage(
  contract,
  originalCandidates,
  fallbackText
) {
  const requestVersion = ++tokenImageRequestVersion;

  if (!contract) return;

  const dexImage = await getDexTokenImage(contract);

  // Ignore results belonging to an older token analysis.
  if (
    requestVersion !== tokenImageRequestVersion ||
    state.currentContract !== contract ||
    !dexImage
  ) {
    return;
  }

  const candidates = [
    ...new Set(
      originalCandidates
        .filter(Boolean)
        .map(normalizeImageURL)
        .filter(Boolean)
    )
  ];

  if (candidates.includes(dexImage)) return;

  // Keep the current image if it loaded successfully.
  if (
    elements.tokenImage &&
    !elements.tokenImage.classList.contains("hidden") &&
    elements.tokenImage.complete &&
    elements.tokenImage.naturalWidth > 0
  ) {
    return;
  }

  // Existing image loading handles errors and tries the next URL.
  renderTokenImage(
    [...candidates, dexImage],
    fallbackText
  );
}

function renderTokenIdentity(
  token,
  data
) {
  const contract =
    token.contractAddress ||
    data.contractAddress ||
    state.currentContract;

  const name =
    token.name ||
    data.metadata?.name ||
    "Unknown Token";

  const symbol =
    token.symbol ||
    data.metadata?.symbol ||
    "---";

  setText(
    elements.tokenName,
    name
  );

  setText(
    elements.tokenSymbol,
    symbol
      ? `$${String(symbol).replace(/^\$/, "")}`
      : "---"
  );

  setText(
    elements.tokenContract,
    contract
  );

  /*
    IMAGE FALLBACK CHAIN

    1. token.image
    2. Pump.fun image
    3. metadata image
    4. Helius content image
    5. market image
  */

const imageCandidates = [
  data.pumpfun?.image,
  token.image,
  data.metadata?.image,
  data.metadata?.content?.links?.image,
  data.content?.links?.image,
  data.market?.image,
  data.market?.imageUrl,
  data.image,
  data.logo
];

renderTokenImage(
  imageCandidates,
  symbol || name
);

void addDexTokenImage(
  contract,
  imageCandidates,
  symbol || name
);

  const links =
    data.explorerLinks ||
    data.links ||
    {};

  if (
    elements.solscanTokenLink
  ) {
    elements.solscanTokenLink.href =
      links.solscanToken ||
      `https://solscan.io/token/${contract}`;
  }

  if (
    elements.pumpFunLink
  ) {
    elements.pumpFunLink.href =
      links.pumpFun ||
      `https://pump.fun/coin/${contract}`;
  }
}


/* =========================================================
   TOKEN IMAGE
   ========================================================= */

function renderTokenImage(
  candidates,
  fallbackText
) {
  if (
    !elements.tokenImage ||
    !elements.tokenImageFallback
  ) {
    return;
  }

  const list =
    Array.isArray(candidates)
      ? candidates
      : [candidates];

  state.tokenImageCandidates =
    [...new Set(
      list
        .filter(Boolean)
        .map(normalizeImageURL)
        .filter(Boolean)
    )];

  state.tokenImageIndex = 0;

  elements.tokenImage.classList.add(
    "hidden"
  );

  elements.tokenImageFallback.classList.remove(
    "hidden"
  );

  elements.tokenImageFallback.textContent =
    String(
      fallbackText || "?"
    )
      .replace("$", "")
      .charAt(0)
      .toUpperCase() ||
    "?";

  if (
    !state.tokenImageCandidates.length
  ) {
    return;
  }

  loadNextTokenImage();
}


function loadNextTokenImage() {
  if (
    !elements.tokenImage
  ) {
    return;
  }

  if (
    state.tokenImageIndex >=
    state.tokenImageCandidates.length
  ) {
    elements.tokenImage.classList.add(
      "hidden"
    );

    elements.tokenImageFallback?.classList.remove(
      "hidden"
    );

    return;
  }

  const url =
    state.tokenImageCandidates[
      state.tokenImageIndex
    ];

  state.tokenImageIndex++;

  elements.tokenImage.onload =
    () => {
      elements.tokenImageFallback?.classList.add(
        "hidden"
      );

      elements.tokenImage.classList.remove(
        "hidden"
      );
    };

  elements.tokenImage.onerror =
    () => {
      loadNextTokenImage();
    };

  elements.tokenImage.src =
    url;
}


function normalizeImageURL(url) {
  if (!url) {
    return null;
  }

  let value =
    String(url).trim();

  if (
    value.startsWith("ipfs://")
  ) {
    value =
      value.replace(
        "ipfs://",
        "https://ipfs.io/ipfs/"
      );
  }

  if (
    value.startsWith("ar://")
  ) {
    value =
      value.replace(
        "ar://",
        "https://arweave.net/"
      );
  }

  if (
    value.startsWith("//")
  ) {
    value =
      `https:${value}`;
  }

  if (
    !value.startsWith("http://") &&
    !value.startsWith("https://")
  ) {
    return null;
  }

  return value;
}


/* =========================================================
   SCORE
   ========================================================= */

function renderScore(
  scoreObject,
  data
) {
  const scoreElement = elements.riskScore;

  if (scoreElement) {
    const showBreakdown = () => {
      if (!Array.isArray(scoreObject?.breakdown)) {
        alert(
          "Score breakdown is unavailable. Run a new analysis."
        );
        return;
      }

      const formatValue = value =>
        typeof value === "number"
          ? value.toLocaleString("en-US", {
              maximumFractionDigits: 2
            })
          : String(value ?? "Unavailable");

      const lines = [
        "SCORE BREAKDOWN",
        "Starting score: 100",
        ""
      ];

      scoreObject.breakdown.forEach(row => {
        lines.push(
          `${row.metric}: ${formatValue(row.value)} → -${row.deduction}`
        );
      });

      if (scoreObject.adjustments?.length) {
        lines.push("", "DEDUCTION ADJUSTMENTS");

        scoreObject.adjustments.forEach(row => {
          lines.push(
            `${row.reason} → +${row.amount}`
          );
        });
      }

      if (scoreObject.bonuses?.length) {
        lines.push("", "BONUSES");

        scoreObject.bonuses.forEach(row => {
          lines.push(
            `${row.metric}: ${formatValue(row.value)} → +${row.bonus}`
          );
        });
      }

      lines.push(
        "",
        `Total deduction: ${scoreObject.totalDeduction}`,
        `Total bonus: ${scoreObject.totalBonus ?? 0}`,
        `Score before ceilings: ${scoreObject.beforeCaps}`
      );

      if (scoreObject.caps?.length) {
        lines.push("", "SCORE CEILINGS");

        scoreObject.caps.forEach(row => {
          lines.push(
            `${row.reason} → maximum ${row.maximum}`
          );
        });

        lines.push("The lowest ceiling applies.");
      }

      if (scoreObject.missing?.length) {
        lines.push(
          "",
          "MISSING DATA",
          ...scoreObject.missing,
          "Missing values are not treated as zero."
        );
      }

      lines.push(
        "",
        `Final score: ${scoreObject.score ?? "Unavailable"}`,
        "",
        "Transfer fees are scored by rate. A fee cap may reduce the actual cost.",
        "Higher score means fewer detected risks.",
        "It is not a probability of safety or fraud."
      );

      alert(lines.join("\n"));
    };

    scoreElement.style.cursor = "pointer";
    scoreElement.setAttribute("role", "button");
    scoreElement.setAttribute("tabindex", "0");
    scoreElement.setAttribute("aria-label", "Show score breakdown");

    scoreElement.onclick = showBreakdown;

    scoreElement.onkeydown = event => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showBreakdown();
      }
    };
  }

  let score;

  if (
    typeof scoreObject ===
    "number"
  ) {
    score =
      scoreObject;

  } else {
    score =
      scoreObject?.score ??
      scoreObject?.value ??
      data.scoreValue ??
      null;
  }

  if (
    score === null ||
    score === undefined ||
    !Number.isFinite(
      Number(score)
    )
  ) {
    setText(
      elements.riskScore,
      "--"
    );

    setRiskBadge(
      "UNKNOWN",
      "neutral"
    );

    return;
  }

  score =
    Math.max(
      0,
      Math.min(
        100,
        Number(score)
      )
    );

  setText(
    elements.riskScore,
    Math.round(score)
  );

  let level =
    "HIGHER DETECTED RISK";

  let className =
    "danger";

  if (
    score >= 80
  ) {
    level =
      "LOWER DETECTED RISK";

    className =
      "good";

  } else if (
    score >= 60
  ) {
    level =
      "MODERATE DETECTED RISK";

    className =
      "warning";

  } else if (
    score >= 40
  ) {
    level =
      "ELEVATED DETECTED RISK";

    className =
      "warning";
  }

  const supplied =
    scoreObject?.label ||
    scoreObject?.level;

  if (supplied) {
    level =
      String(supplied)
        .replaceAll("_", " ")
        .toUpperCase();
  }

  setRiskBadge(
    level,
    className
  );
}


function setRiskBadge(
  text,
  className
) {
  if (
    !elements.riskLevel
  ) {
    return;
  }

  elements.riskLevel.textContent =
    text;

  elements.riskLevel.classList.remove(
    "neutral",
    "good",
    "warning",
    "danger"
  );

  elements.riskLevel.classList.add(
    className || "neutral"
  );
}


/* =========================================================
   QUICK STATS
   ========================================================= */

function renderQuickStats(
  token,
  holders,
  data
) {
  /*
    IMPORTANT:
    use supplyFormatted.
    token.supply is RAW integer units.
  */

  const supply =
    token.supplyFormatted ??
    data.supplyFormatted ??
    null;

  setText(
    elements.tokenSupply,
    formatTokenAmount(
      supply
    )
  );

  /*
    Market Cap
  */

  const marketCap =
    firstNumber([
      data.market?.marketCapUsd,
      data.pumpfun?.marketCapUsd,
      token.marketCapUsd
    ]);

  setText(
    elements.marketCap,
    formatCurrencyCompact(
      marketCap
    )
  );

  /*
    Holders
  */

  const holderCount =
    firstNumber([
      holders.holderCount,
      data.pumpfun?.holderCount,
      data.holderCount
    ]);

  setText(
    elements.holderCount,
    holderCount !== null
      ? formatInteger(
          holderCount
        )
      : "---"
  );

  /*
    PRIMARY TOP 10 / TOP 20

    We intentionally use adjusted values.

    Positively identified liquidity/protocol
    infrastructure is excluded.
  */

  const top10 = getAdjustedTop10(holders, data);
  const top20 = getAdjustedTop20(holders, data);

  const estimated = holders.concentrationEstimated === true;

  [
    elements.top10Concentration,
    elements.adjustedTop10Concentration,
    elements.top20Concentration
  ].forEach(element => {
    if (!element) return;

    element.title = estimated
      ? "Estimate from a limited holder list. Known pools excluded."
      : "Holder concentration";

    const card = element.closest(".token-metric-card");

    if (card) {
      let note = card.querySelector(".ri-concentration-note");

      if (estimated && !note) {
        note = document.createElement("small");
        note.className = "ri-concentration-note";
        note.textContent = "Estimated · limited holder data";
        note.style.display = "block";
        note.style.color = "#b5c5be";
        card.append(note);
      } else if (!estimated && note) {
        note.remove();
      }
    }
  });

  setText(
    elements.top10Concentration,
    formatPercentage(
      top10
    )
  );

  /*
    If old HTML still contains
    adjustedTop10Concentration,
    use that card for TOP 20.
  */

  if (
    elements.adjustedTop10Concentration
  ) {
    setText(
      elements.adjustedTop10Concentration,
      formatPercentage(
        top20
      )
    );

    changeStatLabel(
      elements.adjustedTop10Concentration,
      "TOP 20"
    );
  }

  /*
    Support older HTML where
    top20Concentration already exists.
  */

  setText(
    elements.top20Concentration,
    formatPercentage(
      top20
    )
  );

  const platform =
    typeof data.platform ===
      "string"
      ? data.platform
      : data.platform?.detected ||
        token.platform ||
        data.launchPlatform ||
        detectPlatform(
          state.currentContract
        );

  setText(
    elements.launchPlatform,
    platform || "Unknown"
  );
}


function changeStatLabel(
  valueElement,
  text
) {
  if (!valueElement) {
    return;
  }

  const card =
    valueElement.closest(
      ".stat-card"
    ) ||
    valueElement.parentElement;

  if (!card) {
    return;
  }

  const possibleLabel =
    card.querySelector(
      ".stat-label, .label, span"
    );

  if (
    possibleLabel &&
    possibleLabel !== valueElement
  ) {
    possibleLabel.textContent =
      text;
  }
}


/* =========================================================
   ADJUSTED HOLDER VALUES
   ========================================================= */

function getAdjustedTop10(
  holders,
  data
) {
  return firstNumber([
    holders?.adjusted?.top10Concentration,
    holders?.top10Concentration,
    data?.binanceHolderConcentration?.top10_percent,
    data?.pumpfun?.top10Percentage
  ]);
}


function getAdjustedTop20(
  holders,
  data
) {
  return firstNumber([
    holders?.adjusted?.top20Concentration,
    holders?.top20Concentration,
    data?.pumpfun?.top20Percentage
  ]);
}


/* =========================================================
   SECURITY
   ========================================================= */

function renderSecurity(
  authorities,
  token,
  data
) {
  const mintAuthority =
    authorities.mintAuthority ??
    token.mintAuthority ??
    null;

  const freezeAuthority =
    authorities.freezeAuthority ??
    token.freezeAuthority ??
    null;

  const mintDisabled =
    authorities.mintAuthorityDisabled;

  const freezeDisabled =
    authorities.freezeAuthorityDisabled;

  renderSecurityCard(
    elements.mintAuthorityCard,
    elements.mintAuthorityStatus,

    mintDisabled === true
      ? "Disabled"
      : mintDisabled === false
        ? "Enabled"
        : mintAuthority
          ? "Enabled"
          : "Unknown",

    mintDisabled === true
      ? "good"
      : mintDisabled === false ||
        mintAuthority
        ? "danger"
        : "neutral"
  );

  renderSecurityCard(
    elements.freezeAuthorityCard,
    elements.freezeAuthorityStatus,

    freezeDisabled === true
      ? "Disabled"
      : freezeDisabled === false
        ? "Enabled"
        : freezeAuthority
          ? "Enabled"
          : "Unknown",

    freezeDisabled === true
      ? "good"
      : freezeDisabled === false ||
        freezeAuthority
        ? "warning"
        : "neutral"
  );

  const metadataMutable =
    authorities.metadataMutable ??
    token.metadataMutable ??
    data.metadata?.mutable ??
    null;

  let metadataText =
    "Unknown";

  let metadataStatus =
    "neutral";

  if (
    metadataMutable === true
  ) {
    metadataText =
      "Mutable";

    metadataStatus =
      "warning";

  } else if (
    metadataMutable === false
  ) {
    metadataText =
      "Immutable";

    metadataStatus =
      "good";
  }

// Metadata status in the top overview.
setText(
  elements.metadataStatus,
  metadataText
);

// The same result in the detailed security section.
renderSecurityCard(
  document.getElementById("metadataCard"),
  document.getElementById("metadataStatusDetail"),
  metadataText,
  metadataStatus
);
}


function renderSecurityCard(
  card,
  textElement,
  text,
  status
) {
  if (
    !card ||
    !textElement
  ) {
    return;
  }

  textElement.textContent =
    text;

  card.classList.remove(
    "good",
    "warning",
    "danger",
    "neutral"
  );

  card.classList.add(
    status
  );

  const icon =
    card.querySelector(
      ".security-icon"
    );

  if (!icon) {
    return;
  }

  if (
    status === "good"
  ) {
    icon.textContent =
      "✓";

  } else if (
    status === "warning" ||
    status === "danger"
  ) {
    icon.textContent =
      "!";

  } else {
    icon.textContent =
      "i";
  }
}


/* =========================================================
   HOLDERS
   ========================================================= */

function renderHolders(
  holderData,
  data
) {
  /*
    IMPORTANT:
    adjustedTopHolders first.

    This prevents PumpSwap liquidity pools
    from appearing as normal holders.
  */

  const holders =
    normalizeHolderArray(
      holderData,
      data
    );

  const top10 =
    getAdjustedTop10(
      holderData,
      data
    );

  const top20 =
    getAdjustedTop20(
      holderData,
      data
    );

  setText(
    elements.holderTop10,
    formatPercentage(
      top10
    )
  );

  setText(
    elements.holderTop20,
    formatPercentage(
      top20
    )
  );

  setProgress(
    elements.top10Progress,
    top10
  );

  setProgress(
    elements.top20Progress,
    top20
  );

  renderHolderTable(
    holders
  );

  setText(
    elements.holderMethodology,
    "Top holder concentration excludes only positively identified liquidity and protocol infrastructure. Large balances are never excluded simply because they are large."
  );
}


function normalizeHolderArray(
  holderData,
  data
) {
  const possibilities = [
    holderData?.adjustedTopHolders,
    data?.holderAnalysis?.adjustedTopHolders,

    holderData?.topHolders,
    holderData?.holders,

    data?.topHolders
  ];

  for (
    const candidate
    of possibilities
  ) {
    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }
  }

  return [];
}


function toggleHoldersTable() {
  if (
    !elements.holdersTableWrapper ||
    !elements.holdersToggleButton
  ) {
    return;
  }

  const isHidden =
    elements.holdersTableWrapper.classList.contains(
      "hidden"
    );

  if (isHidden) {
    elements.holdersTableWrapper.classList.remove(
      "hidden"
    );

    elements.holdersToggleButton.childNodes[0].nodeValue =
      "HIDE TOP 10 HOLDERS ";

    elements.holdersToggleArrow?.classList.add(
      "open"
    );

  } else {
    elements.holdersTableWrapper.classList.add(
      "hidden"
    );

    elements.holdersToggleButton.childNodes[0].nodeValue =
      "VIEW TOP 10 HOLDERS ";

    elements.holdersToggleArrow?.classList.remove(
      "open"
    );
  }
}


/* =========================================================
   HOLDER TABLE
   ========================================================= */

function renderHolderTable(holders) {
  const body = elements.holdersTableBody;

  if (!body) return;

  const table = body.closest("table");

  table?.classList.add(
    "ri-overview-compact-table"
  );

  table?.closest(".table-wrapper")
    ?.classList.add(
      "ri-overview-compact-wrapper"
    );

  body.replaceChildren();

  const row = document.createElement("tr");
  const cell = document.createElement("td");

  cell.colSpan = 5;
  cell.innerHTML = riOverviewHolderList(holders);

  row.append(cell);
  body.append(row);
}

/* =========================================================
   CREATOR
   ========================================================= */

function renderCreator(
  creator,
  data
) {
  const wallet =
    creator.wallet ||
    creator.address ||
    creator.creatorWallet ||
    null;

  state.creatorWallet =
    typeof wallet === "string"
      ? wallet
      : null;

  void riLoadDevActivity(
    state.currentContract,
    state.creatorWallet
  );

  renderCreatorWallet(
    wallet,
    creator
  );

  const confidence =
    creator.confidence ??
    creator.detectionConfidence ??
    null;

  setText(
    elements.creatorConfidence,

    confidence !== null
      ? formatConfidence(
          confidence
        )
      : "Unknown"
  );

  const holding =
    creator.currentHolding ??
    creator.balance ??
    creator.tokenBalance ??
    null;

setText(
  elements.creatorHolding,

  holding !== null
    ? `${creator.currentHoldingEstimated === true ? "≈ " : ""}${formatTokenAmount(holding)}`
    : "---"
);

if (elements.creatorHolding) {
  elements.creatorHolding.title =
    creator.currentHoldingEstimated === true
      ? "Estimated from reported total supply and creator holding percentage."
      : "";
}

  /*
    Worker 1.6 uses supplyOwned.
  */

  const percentage =
    creator.supplyOwned ??
    creator.percentage ??
    creator.supplyPercentage ??
    creator.percentOwned ??
    null;

  setText(
    elements.creatorPercentage,

    percentage !== null
      ? formatPercentage(
          percentage
        )
      : "---"
  );

  const solBalance =
    creator.solBalance ??
    creator.nativeBalance ??
    null;

  setText(
    elements.creatorSolBalance,

    solBalance !== null
      ? `${formatNumber(solBalance, 4)} SOL`
      : "---"
  );

  const topHolder =
    creator.topHolder ??
    creator.isTopHolder ??
    null;

  setText(
    elements.creatorTopHolder,

    topHolder === true
      ? "Yes"
      : topHolder === false
        ? "No"
        : "Unknown"
  );

  const note =
    creator.note ||
    creator.detectionNote ||
    (
      creator.detectionMethod
        ? `Detected via ${creator.detectionMethod}.`
        : null
    );

  setText(
    elements.creatorDetectionNote,

    note ||
    "Creator wallet could not be confidently identified."
  );

if (
  elements.loadTransactionsButton
) {
  elements.loadTransactionsButton.disabled =
    !state.creatorWallet;
}


if (
  elements.analyzeCreatorConnectionsButton
) {
  elements.analyzeCreatorConnectionsButton.disabled =
    !state.creatorWallet;
}

}


async function refreshCreatorAnalysis() {
  if (
    !state.currentContract ||
    !elements.creatorRefreshButton
  ) {
    return;
  }

  const button =
    elements.creatorRefreshButton;

  const originalText =
    button.textContent;

  button.disabled = true;
  button.textContent = "REFRESHING...";

  try {
    const data =
      await apiRequest(
        `${CONFIG.ENDPOINTS.analyze}?ca=${encodeURIComponent(state.currentContract)}`
      );

    if (
      !data ||
      data.success === false
    ) {
      throw new Error(
        data?.error ||
        "Creator refresh failed."
      );
    }

    state.currentAnalysis =
      data;

    renderCreator(
      data.creator || {},
      data
    );

    showToast(
      "Creator analysis refreshed"
    );

  } catch (error) {
    console.error(
      "Creator refresh error:",
      error
    );

    showToast(
      friendlyErrorMessage(error)
    );

  } finally {
    button.disabled = false;
    button.textContent =
      originalText || "REFRESH ↻";
  }
}


/* =========================================================
   CREATOR WALLET WITH COPY + SOLSCAN
   ========================================================= */

function renderCreatorWallet(
  wallet,
  creator
) {
  if (
    !elements.creatorWallet
  ) {
    return;
  }

  if (!wallet) {
    elements.creatorWallet.textContent =
      "Not detected";

    return;
  }

  elements.creatorWallet.innerHTML =
    "";

  const walletText =
    document.createElement(
      "span"
    );

  walletText.textContent =
    wallet;

  walletText.title =
    wallet;

  walletText.style.wordBreak =
    "break-all";

  elements.creatorWallet.appendChild(
    walletText
  );

  const actions =
    document.createElement(
      "span"
    );

  actions.style.display =
    "inline-flex";

  actions.style.gap =
    "8px";

  actions.style.marginLeft =
    "10px";

  actions.style.flexWrap =
    "wrap";

  const copyButton =
    document.createElement(
      "button"
    );

  copyButton.type =
    "button";

  copyButton.textContent =
    "COPY";

  copyButton.className =
    "mini-action-button";

  copyButton.addEventListener(
    "click",
    async () => {
      await copyText(
        wallet
      );

      showToast(
        "Creator wallet copied"
      );
    }
  );

  const solscan =
    document.createElement(
      "a"
    );

  solscan.textContent =
    "SOLSCAN";

  solscan.className =
    "mini-action-button";

  solscan.target =
    "_blank";

  solscan.rel =
    "noopener noreferrer";

  solscan.href =
    creator.solscan ||
    `https://solscan.io/account/${wallet}`;

  actions.appendChild(
    copyButton
  );

  actions.appendChild(
    solscan
  );

  elements.creatorWallet.appendChild(
    actions
  );
}


/* =========================================================
   EXIT / RUG ANALYSIS
   ========================================================= */

async function loadExitAnalysis(
  contract
) {
  if (!contract) {
    return;
  }

  resetExitAnalysisDisplay();

  setText(
    elements.exitStatus,
    "ANALYZING..."
  );

  try {
    const data =
      await apiRequest(
        `${CONFIG.ENDPOINTS.exitAnalysis}?ca=${encodeURIComponent(contract)}`
      );

    /*
      Ignore an old response if the user
      scanned another token meanwhile.
    */

    if (
      state.currentContract !==
      contract
    ) {
      return;
    }

    if (
      !data ||
      data.success === false
    ) {
      throw new Error(
        data?.error ||
        "Exit analysis failed."
      );
    }

    renderExitAnalysis(
      data
    );

    riUpdateExitVerification(data);

  } catch (error) {
    console.error(
      "Exit analysis error:",
      error
    );

    if (
      state.currentContract !==
      contract
    ) {
      return;
    }

    setText(
      elements.exitStatus,
      "INSUFFICIENT DATA"
    );

    setExitClass(
      elements.exitStatus,
      "warning"
    );

    setText(
      elements.exitAnalysisNote,
      friendlyErrorMessage(error)
    );

    riUpdateExitVerification();
  }
}


function renderExitAnalysis(
  data
) {
  const exit =
    data.exitAnalysis || {};

  const market =
    data.marketExitAnalysis || {};

  const liquidity =
    data.liquidity || {};

  const status =
    exit.status ||
    data.status ||
    "INSUFFICIENT_DATA";


  /*
    MAJOR EXIT EVENT
  */

  const majorExitDetected =
    status ===
      "MAJOR_EXIT_ACTIVITY" ||
    status ===
      "SEVERE_EXIT_ACTIVITY";

  setText(
    elements.exitMajorEvent,
    majorExitDetected
      ? "DETECTED"
      : status ===
          "INSUFFICIENT_DATA"
        ? "---"
        : "NOT DETECTED"
  );

  setExitClass(
    elements.exitMajorEvent,
    majorExitDetected
      ? "danger"
      : status ===
          "INSUFFICIENT_DATA"
        ? "warning"
        : "safe"
  );


  /*
    CONFIRMED CREATOR SELL
  */

const creatorSell =
  exit.confirmedCreatorSell === true ||
  firstNumber([
    exit.creatorTokensSold
  ]) > 0 ||
  firstNumber([
    exit.creatorSellPercentageOfSupply
  ]) > 0;

  setText(
    elements.exitCreatorSell,
    creatorSell
      ? "DETECTED"
      : "NOT DETECTED"
  );

  setExitClass(
    elements.exitCreatorSell,
    creatorSell
      ? "warning"
      : "safe"
  );


  /*
    CREATOR SOLD
  */

  const creatorTokensSold =
    firstNumber([
      exit.creatorTokensSold
    ]);

const supplySold =
  firstNumber([
    exit.creatorSellPercentageOfSupply
  ]);


/*
  MERGE CREATOR DATA

  /api/analyze provides the normal creator balance.
  /api/exit-analysis can provide creatorCurrentHolding too.

  Only use exit-analysis holding as a fallback.
  Never replace a valid value with unavailable data.
*/

const exitCreatorHolding =
  firstNumber([
    exit.creatorCurrentHolding
  ]);

const totalSupply =
  firstNumber([
    state.currentAnalysis?.token?.supplyFormatted,
    state.currentAnalysis?.supplyFormatted
  ]);

if (
  exitCreatorHolding !== null &&
  (
    !elements.creatorHolding?.textContent ||
    elements.creatorHolding.textContent.trim() === "---"
  )
) {
  setText(
    elements.creatorHolding,
    formatTokenAmount(exitCreatorHolding)
  );

  if (
    totalSupply !== null &&
    totalSupply > 0
  ) {
    const exitCreatorSupply =
      (exitCreatorHolding / totalSupply) * 100;

    setText(
      elements.creatorPercentage,
      formatPercentage(exitCreatorSupply)
    );
  }
}


/*
  Creator Analysis cards
*/

  setText(
    elements.creatorSold,

    creatorTokensSold !== null
      ? formatTokenAmount(creatorTokensSold)
      : "---"
  );

  setText(
    elements.creatorSupplySold,

    supplySold !== null
      ? formatPercentage(supplySold)
      : "---"
  );


  /*
    Exit / Rug Analysis
  */

  setText(
    elements.exitCreatorSold,

    supplySold !== null
      ? `${formatPercentage(supplySold)} Supply`
      : "---"
  );

  setExitClass(
    elements.exitCreatorSold,

    supplySold !== null &&
    supplySold >= 5
      ? "danger"
      : supplySold !== null &&
        supplySold > 0
        ? "warning"
        : "safe"
  );


  /*
    MARKET COLLAPSE
  */

  const marketStatus =
    market.status || null;

  const marketCollapse =
    marketStatus ===
      "MAJOR_MARKET_EXIT_ACTIVITY" ||
    marketStatus ===
      "SEVERE_MARKET_EXIT_ACTIVITY";

  setText(
    elements.exitMarketCollapse,

    !market.available &&
    !marketStatus
      ? "---"
      : marketCollapse
        ? "DETECTED"
        : "NOT DETECTED"
  );

  setExitClass(
    elements.exitMarketCollapse,

    marketCollapse
      ? "danger"
      : !market.available &&
        !marketStatus
        ? "warning"
        : "safe"
  );


  /*
    CURRENT LIQUIDITY
  */

  const currentLiquidity =
    firstNumber([
      liquidity.currentLiquidityUsd,
      data.market?.liquidityUsd
    ]);

  setText(
    elements.exitLiquidity,

    currentLiquidity !== null
      ? formatCurrencyCompact(
          currentLiquidity
        )
      : "---"
  );

  setExitClass(
    elements.exitLiquidity,

    currentLiquidity !== null &&
    currentLiquidity < 2500
      ? "danger"
      : currentLiquidity !== null &&
        currentLiquidity < 5000
        ? "warning"
        : "safe"
  );


/*
    FINAL STATUS
  */

let displayStatus =
  humanizeExitStatus(status);

let statusClass =
  "safe";

/*
  Severe / major confirmed exit pattern
*/
if (
  status === "SEVERE_EXIT_ACTIVITY" ||
  status === "MAJOR_EXIT_ACTIVITY"
) {
  statusClass = "danger";
}

/*
  Creator sold tokens but the combined
  analysis does not qualify as a major exit.
*/
else if (
  creatorSell ||
  (supplySold !== null && supplySold > 0)
) {
  displayStatus =
    "CREATOR SELL ACTIVITY DETECTED";

  statusClass =
    "warning";
}

/*
  Analysis could not be completed.
*/
else if (
  status === "INSUFFICIENT_DATA"
) {
  displayStatus =
    "INSUFFICIENT DATA";

  statusClass =
    "warning";
}

  setExitClass(
    elements.exitStatus,
    statusClass
  );


  setText(
    elements.exitAnalysisNote,

    exit.note ||
    "Detected exit activity is based on observable on-chain transactions and market data. It does not by itself establish fraudulent intent."
  );

/*
  FULL ANALYSIS - SECTION 04
*/

setText(
  elements.exitCreatorSellDetail,
  creatorSell
    ? "DETECTED"
    : "NOT DETECTED"
);

setExitClass(
  elements.exitCreatorSellDetail,
  creatorSell
    ? "warning"
    : "safe"
);


setText(
  elements.exitMajorEventDetail,
  majorExitDetected
    ? "DETECTED"
    : status === "INSUFFICIENT_DATA"
      ? "---"
      : "NOT DETECTED"
);

setExitClass(
  elements.exitMajorEventDetail,
  majorExitDetected
    ? "danger"
    : status === "INSUFFICIENT_DATA"
      ? "warning"
      : "safe"
);


setText(
  elements.exitMarketCollapseDetail,
  !market.available && !marketStatus
    ? "---"
    : marketCollapse
      ? "DETECTED"
      : "NOT DETECTED"
);

setExitClass(
  elements.exitMarketCollapseDetail,
  marketCollapse
    ? "danger"
    : !market.available && !marketStatus
      ? "warning"
      : "safe"
);


setText(
  elements.exitCreatorSoldDetail,
  supplySold !== null
    ? `${formatPercentage(supplySold)} Supply`
    : "---"
);

setExitClass(
  elements.exitCreatorSoldDetail,
  supplySold !== null && supplySold >= 5
    ? "danger"
    : supplySold !== null && supplySold > 0
      ? "warning"
      : "safe"
);


setText(
  elements.exitLiquidityDetail,
  currentLiquidity !== null
    ? formatCurrencyCompact(currentLiquidity)
    : "---"
);

setExitClass(
  elements.exitLiquidityDetail,
  currentLiquidity !== null && currentLiquidity < 2500
    ? "danger"
    : currentLiquidity !== null && currentLiquidity < 5000
      ? "warning"
      : "safe"
);


setText(
  elements.exitStatusDetail,
  displayStatus
);

setExitClass(
  elements.exitStatusDetail,
  statusClass
);


setText(
  elements.exitAnalysisDetailNote,
  exit.note ||
  "Detected exit activity is based on observable on-chain transactions and market data. It does not by itself establish fraudulent intent."
);

syncExitAnalysisDetails();
}

function syncExitAnalysisDetails() {
  const pairs = [
    [elements.exitCreatorSell, elements.exitCreatorSellDetail],
    [elements.exitMajorEvent, elements.exitMajorEventDetail],
    [elements.exitMarketCollapse, elements.exitMarketCollapseDetail],
    [elements.exitCreatorSold, elements.exitCreatorSoldDetail],
    [elements.exitLiquidity, elements.exitLiquidityDetail],
    [elements.exitStatus, elements.exitStatusDetail],
    [elements.exitAnalysisNote, elements.exitAnalysisDetailNote]
  ];

  pairs.forEach(([source, target]) => {
    if (!source || !target) return;

    target.textContent = source.textContent;
    target.classList.remove("safe", "warning", "danger");

    const status = ["danger", "warning", "safe"].find(
      className => source.classList.contains(className)
    );

    if (status) {
      target.classList.add(status);
    }

    const card = target.closest(
      ".exit-modern-primary-card, " +
      ".exit-modern-detail-card, " +
      ".exit-modern-status-card"
    );

    if (!card) return;

    const rgb = {
      safe: "73, 255, 151",
      warning: "255, 166, 64",
      danger: "255, 77, 100"
    }[status] || "150, 158, 154";

    const applyStyle = (element, property, value) => {
      if (element) {
        element.style.setProperty(property, value, "important");
      }
    };

    applyStyle(target, "color", `rgb(${rgb})`);
    applyStyle(card, "border-color", `rgba(${rgb}, 0.25)`);
    applyStyle(card, "background", `rgba(${rgb}, 0.04)`);

    card.querySelectorAll(
      ".exit-modern-card-icon, .exit-detail-icon, .exit-status-icon"
    ).forEach(icon => {
      applyStyle(icon, "background", `rgba(${rgb}, 0.08)`);
      applyStyle(icon, "border-color", `rgba(${rgb}, 0.3)`);

      icon.querySelectorAll("svg").forEach(svg => {
        applyStyle(svg, "stroke", `rgb(${rgb})`);
      });
    });

    const badge = card.querySelector(".exit-status-source");

    applyStyle(badge, "color", `rgb(${rgb})`);
    applyStyle(badge, "border-color", `rgba(${rgb}, 0.25)`);
    applyStyle(badge, "background", `rgba(${rgb}, 0.06)`);
  });
}

function humanizeExitStatus(
  status
) {
  const labels = {
    NO_MAJOR_EXIT_EVENT_DETECTED:
      "NO MAJOR EXIT EVENT DETECTED",

    CREATOR_SELL_ACTIVITY_DETECTED:
      "CREATOR SELL ACTIVITY DETECTED",

    MAJOR_EXIT_ACTIVITY:
      "MAJOR EXIT ACTIVITY",

    SEVERE_EXIT_ACTIVITY:
      "SEVERE EXIT ACTIVITY",

    INSUFFICIENT_DATA:
      "INSUFFICIENT DATA"
  };

  return (
    labels[status] ||
    String(status || "INSUFFICIENT DATA")
      .replaceAll("_", " ")
      .toUpperCase()
  );
}





function setExitClass(
  element,
  className
) {
  if (!element) {
    return;
  }

  element.classList.remove(
    "safe",
    "warning",
    "danger"
  );

  if (className) {
    element.classList.add(
      className
    );
  }
}


function resetExitAnalysisDisplay() {
const fields = [
  elements.exitMajorEvent,
  elements.exitCreatorSell,
  elements.exitCreatorSold,
  elements.exitMarketCollapse,
  elements.exitLiquidity,

  elements.exitMajorEventDetail,
  elements.exitCreatorSellDetail,
  elements.exitCreatorSoldDetail,
  elements.exitMarketCollapseDetail,
  elements.exitLiquidityDetail
];

  fields.forEach(
    element => {
      setText(
        element,
        "---"
      );

      setExitClass(
        element,
        null
      );
    }
  );

  setText(
    elements.exitStatus,
    "ANALYZING..."
  );

setExitClass(
  elements.exitStatus,
  null
);

setText(
  elements.exitStatusDetail,
  "ANALYZING..."
);

setExitClass(
  elements.exitStatusDetail,
  null
);

setText(
  elements.exitAnalysisNote,
  "Analyzing creator sell activity, market movement and current liquidity..."
);

setText(
  elements.exitAnalysisDetailNote,
  "Analyzing creator sell activity, market movement and current liquidity..."
);
}


/* =========================================================
   CREATOR CONNECTIONS
   ========================================================= */

async function loadCreatorConnections() {

  if (
    state.creatorConnectionsLoading ||
    !state.currentContract ||
    !state.creatorWallet
  ) {
    return;
  }


  state.creatorConnectionsLoading =
    true;


  if (
    elements.analyzeCreatorConnectionsButton
  ) {

    elements.analyzeCreatorConnectionsButton.disabled =
      true;

    elements.analyzeCreatorConnectionsButton.innerHTML =
      `ANALYZING... <span>→</span>`;

  }


  elements.creatorConnectionsLoading?.classList.remove(
    "hidden"
  );


  elements.creatorConnectionsResults?.classList.add(
    "hidden"
  );


  try {

    const url =
      `${CONFIG.API_BASE}` +
      `${CONFIG.ENDPOINTS.creatorConnections}` +
      `?ca=${encodeURIComponent(state.currentContract)}` +
      `&wallet=${encodeURIComponent(state.creatorWallet)}`;


const response =
  await fetch(url);


    const data =
      await response.json();


    if (
      !response.ok ||
      data?.success === false
    ) {

      throw new Error(
        data?.error ||
        "Unable to analyze creator connections."
      );

    }


    renderCreatorConnections(
      data
    );


    state.creatorConnectionsLoaded =
      true;


    elements.creatorConnectionsResults?.classList.remove(
      "hidden"
    );


  } catch (error) {

    console.error(
      "Creator connections error:",
      error
    );


    showToast(
      error?.message ||
      "Creator connections analysis failed"
    );


  } finally {

    state.creatorConnectionsLoading =
      false;


    elements.creatorConnectionsLoading?.classList.add(
      "hidden"
    );


    if (
      elements.analyzeCreatorConnectionsButton
    ) {

      elements.analyzeCreatorConnectionsButton.disabled =
        !state.creatorWallet;


      elements.analyzeCreatorConnectionsButton.innerHTML =
        state.creatorConnectionsLoaded
          ? `ANALYZE AGAIN <span>↻</span>`
          : `ANALYZE CREATOR CONNECTIONS <span>→</span>`;

    }

  }

}





function renderCreatorConnections(
  data
) {

  const summary =
    data?.summary || {};


  const wallets =
    Array.isArray(data?.wallets)
      ? data.wallets
      : [];


  const transactionsAnalyzed =
    summary.transactionsAnalyzed ??
    0;


const fundedDestinations =
  summary.fundingDestinationsDetected ??
  summary.confirmedFundedWallets ??
  summary.fundedWallets ??
  wallets.length;

const analyzedDestinations =
  summary.confirmedFundedWallets ??
  summary.fundedWallets ??
  wallets.length;

const excludedDestinations =
  summary.excludedNonWalletDestinations ??
  Math.max(
    fundedDestinations - analyzedDestinations,
    0
  );


  const tokenHolders =
    summary.fundedWalletsHoldingToken ??
    0;


  const combinedHolding =
    summary.combinedTokenHolding ??
    0;


  const combinedSupply =
    summary.combinedSupplyPercentage ??
    0;


  setText(
    elements.creatorConnectionsTransactions,
    formatNumber(
      transactionsAnalyzed,
      0
    )
  );


setText(
  elements.creatorConnectionsFundedWallets,
  formatNumber(
    analyzedDestinations,
    0
  )
);


  setText(
    elements.creatorConnectionsTokenHolders,
    formatNumber(
      tokenHolders,
      0
    )
  );


  setText(
    elements.creatorConnectionsCombinedHolding,
    formatTokenAmount(
      combinedHolding
    )
  );


  setText(
    elements.creatorConnectionsCombinedSupply,
    formatPercentage(
      combinedSupply
    )
  );


setText(
  elements.creatorConnectionsCount,

  `${wallets.length} analyzed ${
    wallets.length === 1
      ? "destination"
      : "destinations"
  }`
);


  if (
    elements.creatorConnectionsNote
  ) {

    elements.creatorConnectionsNote.textContent =
      data?.note ||
      "These addresses received SOL directly from the detected creator. Protocol and program destinations are filtered where identifiable. A funding relationship does not prove common ownership.";

  }


  if (
    !elements.creatorConnectionsTableBody
  ) {
    return;
  }


  elements.creatorConnectionsTableBody.innerHTML =
    "";


  if (
    !wallets.length
  ) {

    elements.creatorConnectionsEmpty?.classList.remove(
      "hidden"
    );

    return;

  }


  elements.creatorConnectionsEmpty?.classList.add(
    "hidden"
  );


  wallets.forEach(
    (
      wallet,
      index
    ) => {

      const address =
        wallet.wallet ||
        wallet.address ||
        "";


      const solFunded =
        wallet.totalSolFunded ??
        0;


      const tokenHolding =
        wallet.tokenHolding ??
        0;


      const supplyPercentage =
        wallet.supplyPercentage ??
        0;


      const transferCount =
        wallet.transferCount ??
        0;


const holdingStatus =
  wallet.currentlyHoldsToken;

const currentlyHolds =
  holdingStatus === true;

const holdingStatusText =
  holdingStatus === true
    ? "HOLDS TOKEN"
    : holdingStatus === false
      ? "DOES NOT HOLD"
      : "UNKNOWN";

const holdingStatusClass =
  holdingStatus === true
    ? "wallet-status-holds"
    : holdingStatus === false
      ? "wallet-status-empty"
      : "wallet-status-unknown";

const signatures =
  Array.isArray(wallet.signatures)
    ? wallet.signatures.filter(Boolean)
    : [];


      const row =
        document.createElement(
          "tr"
        );


      const solscanUrl =
        wallet.solscan ||
        (
          address
            ? `https://solscan.io/account/${address}`
            : "#"
        );


row.innerHTML = `

  <td>
    ${index + 1}
  </td>


  <td class="connection-wallet">

    <span
      class="connection-wallet-address"
      title="${escapeHTML(address)}"
    >
      ${escapeHTML(
        shortenWalletAddress(address)
      )}
    </span>

    ${
      address
        ? `
          <a
            href="${escapeHTML(solscanUrl)}"
            target="_blank"
            rel="noopener noreferrer"
            class="connection-wallet-link"
          >
            SOLSCAN ↗
          </a>
        `
        : ""
    }

  </td>


  <td>
    ${formatNumber(solFunded, 6)} SOL
  </td>


  <td>
    <span class="wallet-holding-status ${holdingStatusClass}">
      <span class="wallet-status-dot"></span>
      ${holdingStatusText}
    </span>
  </td>


  <td class="${
    currentlyHolds
      ? "connection-holding-positive"
      : "connection-holding-zero"
  }">
    ${
      holdingStatus === null ||
      holdingStatus === undefined
        ? "---"
        : formatTokenAmount(tokenHolding)
    }
  </td>


  <td class="${
    currentlyHolds
      ? "connection-holding-positive"
      : "connection-holding-zero"
  }">
    ${
      holdingStatus === null ||
      holdingStatus === undefined
        ? "---"
        : formatPercentage(supplyPercentage)
    }
  </td>


  <td>
    <div class="connection-transfer-cell">

      <strong>
        ${formatNumber(transferCount, 0)}
      </strong>

      ${
        signatures.length
          ? `
            <button
              type="button"
              class="connection-transactions-toggle"
            >
              VIEW ${signatures.length}
              <span>↓</span>
            </button>
          `
          : ""
      }

    </div>
  </td>

`;


const transactionRow =
  document.createElement("tr");

transactionRow.className =
  "connection-transactions-row hidden";

transactionRow.innerHTML = `

  <td colspan="7">

    <div class="connection-transactions-panel">

      <div class="connection-transactions-title">

        <div>
          <strong>
            FUNDING TRANSACTIONS
          </strong>

          <span>
            Direct SOL transfers detected from creator
          </span>
        </div>

        <span>
          ${signatures.length} shown
        </span>

      </div>


      <div class="connection-transaction-list">

        ${
          signatures.length
            ? signatures.map(
                (signature, transactionIndex) => `

                  <a
                    href="https://solscan.io/tx/${encodeURIComponent(signature)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="connection-transaction-item"
                  >

                    <span class="connection-transaction-number">
                      ${transactionIndex + 1}
                    </span>

                    <code>
                      ${escapeHTML(
                        signature.slice(0, 10) +
                        "..." +
                        signature.slice(-8)
                      )}
                    </code>

                    <span class="connection-transaction-link">
                      VIEW ON SOLSCAN ↗
                    </span>

                  </a>

                `
              ).join("")
            : `
              <div class="connection-no-transactions">
                No transaction signatures available.
              </div>
            `
        }

      </div>

    </div>

  </td>

`;


const transactionsButton =
  row.querySelector(
    ".connection-transactions-toggle"
  );

transactionsButton?.addEventListener(
  "click",
  () => {

    const isHidden =
      transactionRow.classList.contains(
        "hidden"
      );

    transactionRow.classList.toggle(
      "hidden"
    );

    transactionsButton.innerHTML =
      isHidden
        ? `HIDE <span>↑</span>`
        : `VIEW ${signatures.length} <span>↓</span>`;

  }
);


      elements.creatorConnectionsTableBody.appendChild(
        row
      );

elements.creatorConnectionsTableBody.appendChild(
  transactionRow
);

    }

  );

}





function shortenWalletAddress(
  address
) {

  if (
    typeof address !== "string" ||
    !address
  ) {
    return "---";
  }


  if (
    address.length <= 18
  ) {
    return address;
  }


  return (
    address.slice(
      0,
      8
    ) +
    "..." +
    address.slice(
      -8
    )
  );

}


/* =========================================================
   CONNECTIONS
   ========================================================= */

function renderConnections(
  connections
) {
  if (
    !elements.connectionSignals
  ) {
    return;
  }

  elements.connectionSignals.innerHTML =
    "";

  if (
    !Array.isArray(connections) ||
    !connections.length
  ) {
    elements.connectionSignals.innerHTML = `
      <div class="empty-state">
        No confirmed wallet connections detected.
      </div>
    `;

    return;
  }

  connections.forEach(
    connection => {
      const item =
        document.createElement(
          "div"
        );

const title =
  connection.title ||
  connection.type ||
  "Connection signal";

const description =
  connection.description ||
  connection.explanation ||
  connection.message ||
  "";

const isProtocolInfrastructure =
  String(connection.type || "")
    .toLowerCase()
    .includes("protocol") ||
  String(title || "")
    .toLowerCase()
    .includes("protocol infrastructure");

if (isProtocolInfrastructure) {

  item.className =
    "signal-item protocol-infrastructure-card";

  item.innerHTML = `
    <div class="protocol-infrastructure-icon">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="6" height="6" rx="1"></rect>
        <rect x="14" y="4" width="6" height="6" rx="1"></rect>
        <rect x="9" y="14" width="6" height="6" rx="1"></rect>
        <path d="M7 10v2h10v-2"></path>
        <path d="M12 12v2"></path>
      </svg>
    </div>

    <div class="protocol-infrastructure-content">

      <div class="protocol-infrastructure-top">
        <span class="protocol-infrastructure-label">
          INFRASTRUCTURE SIGNAL
        </span>

        <span class="protocol-infrastructure-status">
          <i></i>
          IDENTIFIED
        </span>
      </div>

      <strong class="protocol-infrastructure-title">
        ${escapeHTML(title)}
      </strong>

      <p class="protocol-infrastructure-description">
        ${escapeHTML(description)}
      </p>

      <div class="protocol-infrastructure-note">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.8"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9"></circle>
          <path d="M12 10v6"></path>
          <path d="M12 7h.01"></path>
        </svg>

        <span>
          Infrastructure accounts are not treated as creator-controlled
          without supporting on-chain evidence.
        </span>
      </div>

    </div>
  `;

} else {

  item.className =
    "signal-item";

  item.innerHTML = `
    <strong>
      ${escapeHTML(title)}
    </strong>

    <p>
      ${escapeHTML(description)}
    </p>
  `;
}

      elements.connectionSignals.appendChild(
        item
      );
    }
  );
}


/* =========================================================
   RISK SIGNALS
   ========================================================= */

function renderRiskSignals(risks, data) {
  const list = elements.riskSignalsList;

  if (!list) return;

  const level = signal => {
    const code = String(
      signal.code || signal.type || ""
    ).toLowerCase();

    const title = String(
      signal.title || ""
    ).toLowerCase();

    if (
      (
        code.includes("metadata") &&
        code.includes("mutable")
      ) ||
      title.includes("metadata is mutable")
    ) {
      return "info";
    }

    const severity = String(
      signal.severity ||
      signal.level ||
      "info"
    ).toLowerCase();

    if (
      ["critical", "danger", "high"]
        .includes(severity)
    ) {
      return "high";
    }

    if (
      ["warning", "medium"]
        .includes(severity)
    ) {
      return "warning";
    }

    return "info";
  };

  const icons = {
    mint: `
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h8"/>
      <path d="M14 2v6h6M14 2l6 6"/>
      <path d="M15 16h6M18 13v6M8 12h3M8 16h3"/>
    `,

    freeze: `
      <path d="M12 2v20M3.34 7l17.32 10M3.34 17L20.66 7"/>
      <path d="M8 4l4 4 4-4M8 20l4-4 4 4"/>
      <path d="M3 11l5-1-1-5M21 13l-5 1 1 5"/>
      <path d="M3 13l5 1-1 5M21 11l-5-1 1-5"/>
    `,

    people: `
      <circle cx="9" cy="7" r="3"/>
      <path d="M3 21v-2a6 6 0 0 1 12 0v2"/>
      <path d="M16 4a3 3 0 0 1 0 6"/>
      <path d="M21 21v-2a6 6 0 0 0-3-5"/>
    `,

    creator: `
      <path d="M3 6l4 5 5-8 5 8 4-5-2 13H5L3 6z"/>
      <path d="M5 22h14"/>
    `,

    bundle: `
      <path d="M12 3l10 5-10 5L2 8l10-5z"/>
      <path d="M2 12l10 5 10-5M2 16l10 5 10-5"/>
    `,

    network: `
      <circle cx="12" cy="5" r="3"/>
      <circle cx="5" cy="19" r="3"/>
      <circle cx="19" cy="19" r="3"/>
      <path d="M10.5 8L6.5 16M13.5 8l4 8M8 19h8"/>
    `,

    drop: `
      <path d="M3 4l5 8 4-5 5 13 4-5"/>
      <path d="M16 20h5v-5"/>
    `,

    liquidity: `
      <path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12z"/>
    `,

    volume: `
      <path d="M5 21V12M12 21V3M19 21V8"/>
    `,

    fee: `
      <path d="M20 13l-7 7-11-11V2h7l11 11z"/>
      <circle cx="6.5" cy="6.5" r="1"/>
    `,

    launch: `
      <path d="M12 3l9 5v8l-9 5-9-5V8l9-5z"/>
      <path d="M3 8l9 5 9-5M12 13v8"/>
    `,

    metadata: `
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
      <path d="M14 2v6h6M8 12h8M8 16h6"/>
    `,

    info: `
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 11v6M12 7h.01"/>
    `,

    good: `
      <path d="M12 3l8 4v5c0 5-3 8-8 9-5-1-8-4-8-9V7l8-4z"/>
      <path d="M8 12l3 3 5-6"/>
    `
  };

  const iconFor = signal => {
    const key = String(
      signal.code ||
      signal.type ||
      signal.title ||
      ""
    ).toLowerCase();

    if (key.includes("metadata")) {
      return icons.metadata;
    }

    if (key.includes("freeze")) {
      return icons.freeze;
    }

    if (key.includes("mint_authority")) {
      return icons.mint;
    }

    if (key.includes("launch_block")) {
      return icons.launch;
    }

    if (key.includes("fee")) {
      return icons.fee;
    }

    if (key.includes("creator")) {
      return icons.creator;
    }

    if (key.includes("bundle")) {
      return icons.bundle;
    }

    if (
      key.includes("linked") ||
      key.includes("network")
    ) {
      return icons.network;
    }

    if (
      key.includes("insider") ||
      key.includes("holder") ||
      key.includes("top10")
    ) {
      return icons.people;
    }

    if (
      key.includes("drop") ||
      key.includes("collapse")
    ) {
      return icons.drop;
    }

    if (key.includes("liquidity")) {
      return icons.liquidity;
    }

    if (key.includes("volume")) {
      return icons.volume;
    }

    return icons.info;
  };

  const svg = paths => `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      ${paths}
    </svg>
  `;

  const order = {
    high: 0,
    warning: 1,
    info: 2
  };

  const signals = (
    Array.isArray(risks) ? risks : []
  )
    .filter(
      signal =>
        signal &&
        typeof signal === "object"
    )
    .slice()
    .sort(
      (a, b) =>
        order[level(a)] - order[level(b)]
    );

  list.innerHTML = "";

  setText(
    elements.riskSignalCount,
    `${signals.length} ${
      signals.length === 1
        ? "signal"
        : "signals"
    } detected`
  );

  if (!signals.length) {
    list.innerHTML = `
      <div
        class="ri-risk-card ri-risk-empty"
        role="listitem"
      >
        <span class="ri-risk-icon">
          ${svg(icons.good)}
        </span>

        <div class="ri-risk-content">
          <strong>
            No major signals detected
          </strong>

          <p>
            No major risk signal was detected by
            the checks currently available to RugInspect.
          </p>
        </div>
      </div>
    `;

    return;
  }

  for (const signal of signals) {
    const severity = level(signal);

    let title =
      signal.title ||
      signal.code ||
      "Risk signal";

    let description =
      signal.explanation ||
      signal.description ||
      signal.message ||
      "";

    const key = String(
      signal.code || signal.type || ""
    ).toLowerCase();

    if (
      (
        key.includes("metadata") &&
        key.includes("mutable")
      ) ||
      String(title)
        .toLowerCase()
        .includes("metadata is mutable")
    ) {
      title = "Metadata can be updated";

      description =
        "The token creator can still update metadata such as the name, symbol or image. This alone does not indicate malicious activity.";
    }

    const label =
      severity === "high"
        ? "High"
        : severity === "warning"
        ? "Warning"
        : "Info";

    const item = document.createElement("div");

    item.className =
      `ri-risk-card ri-risk-${severity}`;

    item.setAttribute("role", "listitem");

    item.innerHTML = `
      <span class="ri-risk-icon">
        ${svg(iconFor(signal))}
      </span>

      <div class="ri-risk-content">
        <div class="ri-risk-card-heading">
          <strong>
            ${escapeHTML(String(title))}
          </strong>

          <span class="ri-risk-badge">
            <span aria-hidden="true"></span>
            ${label}
          </span>
        </div>

        <p>
          ${escapeHTML(String(description))}
        </p>
      </div>
    `;

    list.appendChild(item);
  }
}


/* =========================================================
   LIVE MARKET CAP
   ========================================================= */

function startMarketRefresh(
  contract
) {
  stopMarketRefresh();

  if (
    !contract
  ) {
    return;
  }

  /*
    Immediate refresh.
  */

  refreshMarket();

  /*
    Then refresh every second.
  */

  state.marketRefreshTimer =
    window.setInterval(
      refreshMarket,
      CONFIG.MARKET_REFRESH_MS
    );
}


function stopMarketRefresh() {
  if (
    state.marketRefreshTimer
  ) {
    clearInterval(
      state.marketRefreshTimer
    );

    state.marketRefreshTimer =
      null;
  }

  state.marketRefreshInFlight =
    false;
}


async function refreshMarket() {
  const contract =
    state.currentContract;

  if (
    !contract ||
    state.marketRefreshInFlight
  ) {
    return;
  }

  /*
    Do not waste API calls while tab
    is hidden.
  */

  if (
    document.visibilityState ===
    "hidden"
  ) {
    return;
  }

  state.marketRefreshInFlight =
    true;

  try {
    const data =
      await marketRequest(
        `${CONFIG.ENDPOINTS.market}?ca=${encodeURIComponent(contract)}`
      );

    if (
      !data ||
      data.success === false ||
      state.currentContract !== contract
    ) {
      return;
    }

    renderAnalysisHighlights(
      state.currentAnalysis,
      data
    );

    const marketCap =
      firstNumber([
        data.marketCapUsd,
        data.market?.marketCapUsd,
        data.marketCap,
        data.pumpfun?.marketCapUsd,
        data.token?.marketCapUsd
      ]);

    if (
      marketCap !== null
    ) {
      setText(
        elements.marketCap,
        formatCurrencyCompact(
          marketCap
        )
      );
    }

    /*
      LIVE PRICE
    */

    const priceUsd =
      firstNumber([
        data.priceUsd
      ]);

    if (
      priceUsd !== null
    ) {
      setText(
        elements.livePrice,
        `$${formatNumber(priceUsd, 10)}`
      );
    }

    /*
      LIVE LIQUIDITY
    */

    const liquidityUsd =
      firstNumber([
        data.liquidityUsd
      ]);

    if (
      liquidityUsd !== null
    ) {
      setText(
        elements.liveLiquidity,
        formatCurrencyCompact(
          liquidityUsd
        )
      );

      /*
        Keep existing Exit / Rug
        liquidity display live too.
      */

      setText(
        elements.exitLiquidity,
        formatCurrencyCompact(
          liquidityUsd
        )
      );

      setExitClass(
        elements.exitLiquidity,

        liquidityUsd < 2500
          ? "danger"
          : liquidityUsd < 5000
            ? "warning"
            : "safe"
      );
    }

    /*
      LIVE VOLUME 24H
    */

    const rawVolume24h = data.volume24hUsd;

    const volume24hUsd =
      rawVolume24h === null ||
      rawVolume24h === undefined ||
      rawVolume24h === ""
        ? null
        : Number(rawVolume24h);

    setText(
      document.getElementById("liveVolume24h"),
      volume24hUsd !== null &&
      Number.isFinite(volume24hUsd) &&
      volume24hUsd >= 0
        ? formatCurrencyCompact(volume24hUsd)
        : "---"
    );


    /*
      HISTORICAL PEAK MC
    */

    const peakMarketCap =
      firstNumber([
        data.peakMarketCap
      ]);

    if (
      peakMarketCap !== null
    ) {
      setText(
        elements.peakMarketCap,
        formatCurrencyCompact(
          peakMarketCap
        )
      );
    }

    /*
      DROP FROM PEAK
    */

    const dropFromPeak =
      firstNumber([
        data.dropFromPeakPercent
      ]);

    if (
      dropFromPeak !== null
    ) {
      setText(
        elements.dropFromPeak,
        formatPercentage(
          dropFromPeak
        )
      );
    }

    /*
      MARKET STATUS
    */

    if (
      data.marketStatus
    ) {
      const marketStatus =
        String(data.marketStatus)
          .replaceAll("_", " ")
          .toUpperCase();

      setText(
        elements.marketStatus,
        marketStatus
      );

      if (elements.marketStatus) {

        elements.marketStatus.classList.remove(
          "market-normal",
          "market-pullback",
          "market-heavy",
          "market-severe",
          "market-collapse"
        );

        if (
          marketStatus ===
          "NORMAL MARKET MOVEMENT"
        ) {
          elements.marketStatus.classList.add(
            "market-normal"
          );

        } else if (
          marketStatus ===
          "SIGNIFICANT PULLBACK"
        ) {
          elements.marketStatus.classList.add(
            "market-pullback"
          );

        } else if (
          marketStatus ===
          "HEAVY DECLINE DETECTED"
        ) {
          elements.marketStatus.classList.add(
            "market-heavy"
          );

        } else if (
          marketStatus ===
          "SEVERE MARKET DECLINE"
        ) {
          elements.marketStatus.classList.add(
            "market-severe"
          );

        } else if (
          marketStatus ===
          "MAJOR COLLAPSE DETECTED"
        ) {
          elements.marketStatus.classList.add(
            "market-collapse"
          );
        }
      }


      /*
        Keep MARKET COLLAPSE
        in the summary live too.
      */

if (
  marketStatus ===
  "MAJOR COLLAPSE DETECTED"
) {
  setText(
    elements.exitMarketCollapse,
    "DETECTED"
  );

  setExitClass(
    elements.exitMarketCollapse,
    "danger"
  );

  /*
    Keep main Analysis Status
    visually consistent with the
    detected major market collapse.
  */

  setText(
    elements.exitStatus,
    "MAJOR MARKET COLLAPSE DETECTED"
  );

  setExitClass(
    elements.exitStatus,
    "danger"
  );

  setText(
    elements.exitAnalysisNote,
    "The token has experienced a major decline from its historical peak market cap. This market movement alone does not prove creator exit activity or fraudulent intent."
  );

      } else if (
        marketStatus ===
        "HISTORICAL DATA UNAVAILABLE"
      ) {
        setText(
          elements.exitMarketCollapse,
          "---"
        );

        setExitClass(
          elements.exitMarketCollapse,
          "warning"
        );

      } else {
        setText(
          elements.exitMarketCollapse,
          "NOT DETECTED"
        );

        setExitClass(
          elements.exitMarketCollapse,
          "safe"
        );
      }
    }

    syncExitAnalysisDetails();

    /*
      If initial image failed but
      market endpoint returns one,
      try it.
    */

    const liveImage =
      data.image ||
      data.imageUrl ||
      data.token?.image ||
      data.pumpfun?.image ||
      data.market?.image ||
      data.market?.imageUrl;

    if (
      liveImage &&
      elements.tokenImage?.classList.contains(
        "hidden"
      )
    ) {
      renderTokenImage(
        [liveImage],
        state.currentAnalysis
          ?.token
          ?.symbol ||
        "?"
      );
    }

  } catch (error) {
    /*
      Market refresh errors should not
      break the whole scanner.
    */

    console.debug(
      "Market refresh skipped:",
      error?.message
    );

  } finally {
    state.marketRefreshInFlight =
      false;
  }
}


/* =========================================================
   MARKET REQUEST
   ========================================================= */

async function marketRequest(
  endpoint
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      CONFIG.MARKET_TIMEOUT
    );

  try {
    const response =
      await fetch(
        `${CONFIG.API_BASE}${endpoint}`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json"
          },

          cache:
            "no-store",

          signal:
            controller.signal
        }
      );

    if (
      !response.ok
    ) {
      throw new Error(
        `Market request failed (${response.status})`
      );
    }

    return await response.json();

  } finally {
    clearTimeout(
      timeout
    );
  }
}


/* =========================================================
   CREATOR TRANSACTIONS
   ========================================================= */

async function riLoadDevActivity(
  contract,
  wallet
) {
  const box =
    document.getElementById(
      "riDevActivity"
    );

  if (!box) return;

  const key =
    `${contract}:${wallet}:` +
    `${Date.now()}:${Math.random()}`;

  box.dataset.request = key;

  box.textContent = wallet
    ? "Checking recent dev activity…"
    : "Dev wallet unavailable.";

  state.riDevActivity = null;
  state.transactionsLoaded = false;

  elements.transactionsSection
    ?.classList.add("hidden");

  setText(
    elements.loadTransactionsButton,
    "LOAD CREATOR TRANSACTIONS →"
  );

  const start = Date.now();

  while (
    wallet &&
    box.dataset.request === key &&
    state.currentContract === contract
  ) {
    try {
      const data = await apiRequest(
        "/api/dev-activity" +
        `?ca=${encodeURIComponent(contract)}` +
        `&wallet=${encodeURIComponent(wallet)}`
      );

      if (
        box.dataset.request !== key ||
        state.currentContract !== contract
      ) {
        return;
      }

      state.riDevActivity = data;

      riRenderDevActivity(data);

      if (data.state === "ready") {
        return;
      }

      if (
        Date.now() - start > 90000
      ) {
        box.append(
          document.createTextNode(
            " Check is still pending. " +
            "Use Refresh to check again."
          )
        );

        return;
      }
    } catch {
      if (
        box.dataset.request === key &&
        state.currentContract === contract
      ) {
        box.textContent =
          "Analysis unavailable. " +
          "Use Refresh to retry.";
      }

      return;
    }

    await new Promise(resolve => {
      setTimeout(resolve, 5000);
    });
  }
}

function riRenderDevActivity(data) {
  const box =
    document.getElementById(
      "riDevActivity"
    );

  if (!box) return;

  const a = data.result;

  box.replaceChildren();

  const line = (
    text,
    strong = false
  ) => {
    const element =
      document.createElement(
        strong ? "strong" : "div"
      );

    element.textContent = text;
    box.append(element);
  };

  line(
    "DEV ACTIVITY · RECENT SAMPLE",
    true
  );

  if (!a) {
    line(
      data.state === "busy"
        ? "Queue busy. Retrying…"
        : "Check queued…"
    );

    return;
  }

  const complete =
    a.status === "sample_complete";

  const status = count =>
    count > 0
      ? String(count)
      : complete
        ? "None in checked sample"
        : "Not established";

  line(
    `Sells detected: ${
      status(a.sellsDetected)
    }`
  );

  line(
    `Transfers out: ${
      status(a.transfersDetected)
    }`
  );

  if (a.unknownOutflows) {
    line(
      "⚠ Unclassified token outflows: " +
      a.unknownOutflows
    );
  }

  line(
    `Checked ${a.signaturesChecked}/20 ` +
    `wallet signatures · ` +
    `${a.failedTransactions} failed`
  );

  line(
    "Last checked: " +
    (
      a.checkedAt
        ? new Date(
            a.checkedAt
          ).toLocaleString()
        : "Unavailable"
    )
  );

  line(
    !data.fresh
      ? "Previous result · refresh pending"
      : complete
        ? "Recent sample checked"
        : "Analysis incomplete"
  );

  line(
    "Only recent activity of the displayed wallet. " +
    "Full token history and linked wallets are not covered."
  );

  if (
    a.currentHolding !== null
  ) {
    setText(
      elements.creatorHolding,
      formatTokenAmount(
        a.currentHolding
      )
    );

    if (
      a.supplyOwned !== null
    ) {
      setText(
        elements.creatorPercentage,
        formatPercentage(
          a.supplyOwned
        )
      );
    }
  }

  if (
    state.transactionsLoaded
  ) {
    riRenderDevTransactions(
      a.transactions || []
    );
  }
}

function riRenderDevTransactions(
  transactions
) {
  const body =
    elements.transactionsList;

  if (!body) return;

  body.replaceChildren();

  setText(
    elements.transactionCount,
    `${transactions.length} token activity records`
  );

  if (
    !transactions.length
  ) {
    const row = body.insertRow();
    const cell = row.insertCell();

    cell.colSpan = 5;

    cell.textContent =
      "No token balance changes found " +
      "in the checked sample. " +
      "See analysis status above.";

    return;
  }

  transactions.forEach(
    (tx, index) => {
      const row =
        body.insertRow();

      row.insertCell().textContent =
        String(index + 1);

      const typeCell =
        row.insertCell();

      typeCell.textContent =
        tx.type.replaceAll(
          "_",
          " "
        );

      for (
        const target of
        tx.destinations || []
      ) {
        if (
          !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/
            .test(target.address)
        ) {
          continue;
        }

        const link =
          document.createElement(
            "a"
          );

        link.href =
          "https://solscan.io/account/" +
          target.address;

        link.target = "_blank";
        link.rel =
          "noopener noreferrer";

        link.textContent =
          (
            target.kind === "wallet"
              ? "Recipient"
              : "Token account"
          ) +
          ": " +
          shortenAddress(
            target.address,
            5,
            5
          );

        typeCell.append(
          document.createElement(
            "br"
          ),
          link
        );
      }

      row.insertCell().textContent =
        formatTokenAmount(
          tx.amount
        );

      row.insertCell().textContent =
        tx.timestamp
          ? new Date(
              tx.timestamp * 1000
            ).toLocaleString()
          : "Unavailable";

      const linkCell =
        row.insertCell();

      if (
        /^[1-9A-HJ-NP-Za-km-z]{80,90}$/
          .test(tx.signature)
      ) {
        const link =
          document.createElement(
            "a"
          );

        link.href =
          "https://solscan.io/tx/" +
          tx.signature;

        link.target = "_blank";

        link.rel =
          "noopener noreferrer";

        link.textContent =
          "View transaction ↗";

        linkCell.append(link);
      }
    }
  );
}

async function loadCreatorTransactions() {
  if (
    !state.creatorWallet
  ) {
    return;
  }

  if (
    state.transactionsLoaded
  ) {
    const hidden =
      elements.transactionsSection
        ?.classList.toggle("hidden");

    setText(
      elements.loadTransactionsButton,

      hidden
        ? "LOAD CREATOR TRANSACTIONS →"
        : "HIDE CREATOR TRANSACTIONS ↑"
    );

    return;
  }

  elements.transactionsSection
    ?.classList.remove("hidden");

  state.transactionsLoaded = true;

  setText(
    elements.loadTransactionsButton,
    "HIDE CREATOR TRANSACTIONS ↑"
  );

  if (
    state.riDevActivity?.result
  ) {
    riRenderDevTransactions(
      state.riDevActivity.result
        .transactions || []
    );
  } else {
    riRenderDevTransactions([]);

    const cell =
      elements.transactionsList
        ?.rows[0]?.cells[0];

    if (cell) {
      cell.textContent =
        "Analysis pending or unavailable. " +
        "See the status above.";
    }
  }
}


/* =========================================================
   TRANSACTION LIST
   ========================================================= */

function renderTransactions(
  transactions
) {
  if (
    !elements.transactionsList
  ) {
    return;
  }

  elements.transactionsList.innerHTML =
    "";

  setText(
    elements.transactionCount,
    `${transactions.length} transactions`
  );

  if (
    !transactions.length
  ) {
    elements.transactionsList.innerHTML = `
      <tr>
        <td colspan="8">
          <div class="empty-state">
            No recent transactions found.
          </div>
        </td>
      </tr>
    `;

    return;
  }

  transactions.forEach(
    (transaction, index) => {

      const signature =
        transaction.signature ||
        transaction.txHash ||
        transaction.hash ||
        "";

      const type =
        transaction.type ||
        transaction.description ||
        "Transaction";

      const timestamp =
        transaction.timestamp ||
        transaction.blockTime ||
        transaction.time;

      const amount =
        transaction.amount ??
        transaction.tokenAmount ??
        transaction.value ??
        "---";

      const solscan =
        transaction.solscan ||
        (
          signature
            ? `https://solscan.io/tx/${signature}`
            : null
        );

      const destination =
        Array.isArray(
          transaction.destinationHoldings
        )
          ? transaction.destinationHoldings[0]
          : null;

      const destinationWallet =
        destination?.wallet ||
        null;

      const currentlyHoldsToken =
        destination?.currentlyHoldsToken;

      const currentHolding =
        destination?.currentHolding;

      const supplyPercentage =
        destination?.supplyPercentage;


      let holdingStatus =
        "---";

      if (
        currentlyHoldsToken === true
      ) {
        holdingStatus =
          "YES";
      } else if (
        currentlyHoldsToken === false
      ) {
        holdingStatus =
          "NO";
      } else if (
        destinationWallet
      ) {
        holdingStatus =
          "UNKNOWN";
      }


      const row =
        document.createElement(
          "tr"
        );

      row.innerHTML = `
        <td>
          ${index + 1}
        </td>

        <td>
          <strong>
            ${escapeHTML(String(type))}
          </strong>
        </td>

        <td>
          ${escapeHTML(String(amount))}
        </td>

        <td>
          ${escapeHTML(
            formatTimestamp(timestamp)
          )}
        </td>

        <td>
          ${
            solscan
              ? `
                <a
                  href="${escapeAttribute(solscan)}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ${escapeHTML(
                    shortenAddress(
                      signature,
                      7,
                      6
                    )
                  )}
                </a>
              `
              : "---"
          }
        </td>

        <td>
          ${
            destinationWallet
              ? `
                <a
                  href="${escapeAttribute(
                    destination?.solscan ||
                    `https://solscan.io/account/${destinationWallet}`
                  )}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  ${escapeHTML(
                    shortenAddress(
                      destinationWallet,
                      6,
                      5
                    )
                  )}
                </a>
              `
              : "---"
          }
        </td>

        <td>
          ${
            destinationWallet
              ? `
                <strong>
                  ${escapeHTML(holdingStatus)}
                </strong>

                ${
                  currentHolding !== null &&
                  currentHolding !== undefined
                    ? `
                      <div>
                        ${escapeHTML(
                          formatNumber(
  destination.currentHolding
)
                        )}
                      </div>
                    `
                    : ""
                }
              `
              : "---"
          }
        </td>

        <td>
          ${
            supplyPercentage !== null &&
            supplyPercentage !== undefined
              ? `${escapeHTML(
                  Number(
                    supplyPercentage
                  ).toFixed(4)
                )}%`
              : "---"
          }
        </td>
      `;

      elements.transactionsList.appendChild(
        row
      );
    }
  );
}


/* =========================================================
   EARLY ACTIVITY
   ========================================================= */

async function loadEarlyActivity() {
  if (
    !state.currentContract ||
    state.earlyActivityLoaded
  ) {
    return;
  }

  if (
    elements.analyzeEarlyButton
  ) {
    elements.analyzeEarlyButton.disabled =
      true;
  }

  elements.earlyLoading?.classList.remove(
    "hidden"
  );

  try {
    const data =
      await apiRequest(
        `${CONFIG.ENDPOINTS.earlyTransactions}?ca=${encodeURIComponent(state.currentContract)}&limit=${CONFIG.EARLY_TRANSACTION_LIMIT}`
      );

    renderEarlyActivity(
      data
    );

    state.earlyActivityLoaded =
      true;

  } catch (error) {
    if (
      elements.earlyResults
    ) {
      elements.earlyResults.innerHTML = `
        <div class="empty-state">
          ${escapeHTML(friendlyErrorMessage(error))}
        </div>
      `;

      elements.earlyResults.classList.remove(
        "hidden"
      );
    }

    if (
      elements.analyzeEarlyButton
    ) {
      elements.analyzeEarlyButton.disabled =
        false;
    }

  } finally {
    elements.earlyLoading?.classList.add(
      "hidden"
    );
  }
}


/* =========================================================
   EARLY ACTIVITY RENDER
   ========================================================= */

function renderEarlyActivity(
  data
) {
  if (
    !elements.earlyResults
  ) {
    return;
  }

  elements.earlyResults.innerHTML =
    "";

  const summary =
    data.summary ||
    data.analysis ||
    data.earlyActivity ||
    data;

  const metrics = [
    {
      label:
        "Transactions analyzed",

      value:
        summary.transactionsAnalyzed ??
        summary.transactionCount ??
        summary.count
    },

    {
      label:
        "Unique wallets",

      value:
        summary.uniqueWallets ??
        summary.walletCount
    },

    {
      label:
        "Timing clusters",

      value:
        summary.timingClusters ??
        summary.clusterCount
    },

    {
      label:
        "Suspicious patterns",

      value:
        summary.suspiciousPatterns ??
        summary.suspiciousCount
    }
  ];

  const available =
    metrics.filter(
      item =>
        item.value !== undefined &&
        item.value !== null
    );

  if (
    available.length
  ) {
    const grid =
      document.createElement(
        "div"
      );

    grid.className =
      "early-metrics-grid";

    available.forEach(
      metric => {
        const card =
          document.createElement(
            "div"
          );

        card.className =
          "early-metric";

        card.innerHTML = `
          <span>
            ${escapeHTML(metric.label)}
          </span>

          <strong>
            ${escapeHTML(String(metric.value))}
          </strong>
        `;

        grid.appendChild(
          card
        );
      }
    );

    elements.earlyResults.appendChild(
      grid
    );
  }

  const signals =
    Array.isArray(data.signals)
      ? data.signals
      : [];

  if (
    signals.length
  ) {
    const list =
      document.createElement(
        "div"
      );

    list.className =
      "early-signal-list";

    signals.forEach(
      signal => {
        const item =
          document.createElement(
            "div"
          );

        item.className =
          "early-signal";

        const title =
          signal.title ||
          signal.type ||
          "Activity signal";

        const description =
          signal.description ||
          signal.explanation ||
          signal.message ||
          "";

        item.innerHTML = `
          <strong>
            ${escapeHTML(title)}
          </strong>

          <p>
            ${escapeHTML(description)}
          </p>
        `;

        list.appendChild(
          item
        );
      }
    );

    elements.earlyResults.appendChild(
      list
    );
  }

  if (
    !available.length &&
    !signals.length
  ) {
    elements.earlyResults.innerHTML = `
      <div class="empty-state">
        No unusual early activity was detected from the data currently available.
      </div>
    `;
  }

  elements.earlyResults.classList.remove(
    "hidden"
  );
}


/* =========================================================
   API REQUEST
   ========================================================= */

async function apiRequest(
  endpoint
) {
  const controller =
    new AbortController();

  const timeout =
    setTimeout(
      () => controller.abort(),
      CONFIG.REQUEST_TIMEOUT
    );

  try {
    const response =
      await fetch(
        `${CONFIG.API_BASE}${endpoint}`,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json"
          },

          cache:
            "no-store",

          signal:
            controller.signal
        }
      );

    let data;

    try {
      data =
        await response.json();

    } catch {
      throw new Error(
        "The RugInspect API returned an invalid response."
      );
    }

    if (
      !response.ok
    ) {
      throw new Error(
        data?.error ||
        data?.details ||
        `Request failed (${response.status}).`
      );
    }

    return data;

  } catch (error) {
    if (
      error.name ===
      "AbortError"
    ) {
      throw new Error(
        "The analysis took too long. Please try again."
      );
    }

    throw error;

  } finally {
    clearTimeout(
      timeout
    );
  }
}


/* =========================================================
   UI
   ========================================================= */

function showLoading(
  message
) {
  if (
    elements.loadingText &&
    message
  ) {
    elements.loadingText.textContent =
      message;
  }

  elements.loadingSection?.classList.remove(
    "hidden"
  );
}


function hideLoading() {
  elements.loadingSection?.classList.add(
    "hidden"
  );
}


function showResults() {
  prepareResultsLayout();

  elements.resultsSection?.classList.remove(
    "hidden"
  );

  document.getElementById("scannerPage")
    ?.classList.add("ri-results-mode");

  loadWebsiteTokenInfo();

  void riLoadTokenFees();
}


function hideResults() {
  elements.resultsSection?.classList.add(
    "hidden"
  );

  document.getElementById("scannerPage")
    ?.classList.remove("ri-results-mode");

  riTokenInfoController?.abort();

  riFeeController?.abort();

  clearTimeout(riFeeRefreshTimer);
}


function showError(
  message
) {
  if (
    elements.errorMessage
  ) {
    elements.errorMessage.textContent =
      message;
  }

  elements.errorBox?.classList.remove(
    "hidden"
  );
}


function hideError() {
  elements.errorBox?.classList.add(
    "hidden"
  );
}


/* =========================================================
   BUTTON STATE
   ========================================================= */

function setAnalyzeButtonLoading(
  loading
) {
  if (
    !elements.analyzeButton
  ) {
    return;
  }

  elements.analyzeButton.disabled =
    loading;

  const text =
    elements.analyzeButton.querySelector(
      ".button-text"
    );

  if (text) {
    text.textContent =
      loading
        ? "SCANNING..."
        : "ANALYZE";
  }
}


/* =========================================================
   RESET
   ========================================================= */

function resetAnalysisState() {

  state.currentAnalysis =
    null;

  state.creatorWallet =
    null;

  state.transactionsLoaded =
    false;

  state.earlyActivityLoaded =
    false;

  state.creatorConnectionsLoaded =
    false;

  state.creatorConnectionsLoading =
    false;

  state.tokenImageCandidates =
    [];

  state.tokenImageIndex =
    0;


  elements.transactionsSection?.classList.add(
    "hidden"
  );

  elements.earlyResults?.classList.add(
    "hidden"
  );

  elements.creatorConnectionsResults?.classList.add(
    "hidden"
  );

  elements.creatorConnectionsLoading?.classList.add(
    "hidden"
  );


  if (
    elements.transactionsList
  ) {
    elements.transactionsList.innerHTML =
      "";
  }


  if (
    elements.earlyResults
  ) {
    elements.earlyResults.innerHTML =
      "";
  }


  if (
    elements.creatorConnectionsTableBody
  ) {
    elements.creatorConnectionsTableBody.innerHTML =
      "";
  }


  if (
    elements.loadTransactionsButton
  ) {
    elements.loadTransactionsButton.disabled =
      true;
  }


  if (
    elements.analyzeEarlyButton
  ) {
    elements.analyzeEarlyButton.disabled =
      false;
  }


  if (
    elements.analyzeCreatorConnectionsButton
  ) {

    elements.analyzeCreatorConnectionsButton.disabled =
      true;

    elements.analyzeCreatorConnectionsButton.innerHTML =
      `ANALYZE CREATOR CONNECTIONS <span>→</span>`;

  }


  /*
    RESET LIVE MARKET DATA
  */

  setText(
    elements.marketCap,
    "---"
  );

  setText(
    elements.livePrice,
    "---"
  );

  setText(
    elements.liveVolume24h,
    "---"
  );

  setText(
    elements.liveLiquidity,
    "---"
  );

  setText(
    elements.peakMarketCap,
    "---"
  );

  setText(
    elements.dropFromPeak,
    "---"
  );

  setText(
    elements.marketStatus,
    "---"
  );


  resetExitAnalysisDisplay();
}

/* =========================================================
   COPY
   ========================================================= */

async function copyContract() {
  if (
    !state.currentContract
  ) {
    return;
  }

  await copyText(
    state.currentContract
  );

  showToast(
    "Contract address copied"
  );
}


async function copyText(
  text
) {
  try {
    await navigator.clipboard.writeText(
      text
    );

  } catch {
    fallbackCopy(
      text
    );
  }
}


function fallbackCopy(
  text
) {
  const textarea =
    document.createElement(
      "textarea"
    );

  textarea.value =
    text;

  textarea.style.position =
    "fixed";

  textarea.style.opacity =
    "0";

  document.body.appendChild(
    textarea
  );

  textarea.focus();
  textarea.select();

  document.execCommand(
    "copy"
  );

  textarea.remove();
}


/* =========================================================
   TOAST
   ========================================================= */

let toastTimeout =
  null;


function showToast(
  message
) {
  if (
    !elements.toast
  ) {
    return;
  }

  clearTimeout(
    toastTimeout
  );

  elements.toast.textContent =
    message;

  elements.toast.classList.remove(
    "hidden"
  );

  toastTimeout =
    setTimeout(() => {
      elements.toast.classList.add(
        "hidden"
      );
    }, 2200);
}


/* =========================================================
   URL
   ========================================================= */

function updateBrowserURL(
  contract
) {
  try {
    const url =
      new URL(
        window.location.href
      );

    url.searchParams.set(
      "ca",
      contract
    );

    window.history.replaceState(
      {},
      "",
      url
    );

  } catch {
    // Ignore.
  }
}


/* =========================================================
   PROGRESS
   ========================================================= */

function setProgress(
  element,
  value
) {
  if (!element) {
    return;
  }

  const percentage =
    normalizePercentage(
      value
    );

  if (
    percentage === null
  ) {
    element.style.width =
      "0%";

    return;
  }

  element.style.width =
    `${Math.min(Math.max(percentage, 0), 100)}%`;
}


/* =========================================================
   PLATFORM
   ========================================================= */

function detectPlatform(
  contract
) {
  if (!contract) {
    return "Unknown";
  }

  if (
    String(contract)
      .toLowerCase()
      .endsWith("pump")
  ) {
    return "Pump.fun";
  }

  return "Solana";
}


/* =========================================================
   SOLANA ADDRESS
   ========================================================= */

function isLikelySolanaAddress(
  value
) {
  if (!value) {
    return false;
  }

  const address =
    String(value).trim();

  if (
    address.length < 32 ||
    address.length > 50
  ) {
    return false;
  }

  return /^[1-9A-HJ-NP-Za-km-z]+$/.test(
    address
  );
}


/* =========================================================
   ADDRESS FORMAT
   ========================================================= */

function shortenAddress(
  address,
  start = 6,
  end = 5
) {
  if (!address) {
    return "---";
  }

  const value =
    String(address);

  if (
    value.length <=
    start + end + 3
  ) {
    return value;
  }

  return (
    value.slice(0, start) +
    "..." +
    value.slice(-end)
  );
}


/* =========================================================
   TOKEN AMOUNT
   ========================================================= */

function formatTokenAmount(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return "---";
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return String(value);
  }

  const absolute =
    Math.abs(number);

  if (
    absolute >=
    1_000_000_000
  ) {
    return `${trimZeros(
      number /
      1_000_000_000,
      2
    )}B`;
  }

  if (
    absolute >=
    1_000_000
  ) {
    return `${trimZeros(
      number /
      1_000_000,
      2
    )}M`;
  }

  if (
    absolute >=
    1_000
  ) {
    return `${trimZeros(
      number /
      1_000,
      2
    )}K`;
  }

  return trimZeros(
    number,
    4
  );
}


/* =========================================================
   MARKET CAP FORMAT
   ========================================================= */

function formatCurrencyCompact(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "---";
  }

  const absolute =
    Math.abs(number);

  if (
    absolute >=
    1_000_000_000
  ) {
    return `$${trimZeros(
      number /
      1_000_000_000,
      2
    )}B`;
  }

  if (
    absolute >=
    1_000_000
  ) {
    return `$${trimZeros(
      number /
      1_000_000,
      2
    )}M`;
  }

  if (
    absolute >=
    1_000
  ) {
    return `$${trimZeros(
      number /
      1_000,
      2
    )}K`;
  }

  return `$${formatNumber(
    number,
    2
  )}`;
}


/* =========================================================
   NUMBERS
   ========================================================= */

function formatNumber(
  value,
  decimals = 2
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "---";
  }

  return number.toLocaleString(
    "en-US",
    {
      maximumFractionDigits:
        decimals
    }
  );
}


function formatInteger(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "---";
  }

  return Math.round(
    number
  ).toLocaleString(
    "en-US"
  );
}


function trimZeros(
  value,
  decimals = 2
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "---";
  }

  return Number(
    number.toFixed(
      decimals
    )
  ).toLocaleString(
    "en-US",
    {
      maximumFractionDigits:
        decimals
    }
  );
}


function firstNumber(
  values
) {
  for (
    const value
    of values
  ) {
    if (
      value === null ||
      value === undefined ||
      value === ""
    ) {
      continue;
    }

    const number =
      Number(
        String(value)
          .replaceAll(",", "")
          .replace("%", "")
      );

    if (
      Number.isFinite(number)
    ) {
      return number;
    }
  }

  return null;
}


/* =========================================================
   PERCENTAGE
   ========================================================= */

function normalizePercentage(
  value
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  /*
    Worker 1.6 already returns percentages
    as percentages.

    Example:
    21.8823 means 21.8823%.

    DO NOT multiply values below 1 by 100.
    0.89 from the Worker means 0.89%.
  */

  const number =
    Number(
      String(value)
        .replace("%", "")
        .trim()
    );

  if (
    !Number.isFinite(number)
  ) {
    return null;
  }

  return number;
}


function formatPercentage(
  value
) {
  const number =
    normalizePercentage(
      value
    );

  if (
    number === null
  ) {
    return "---";
  }

  return `${trimZeros(
    number,
    2
  )}%`;
}


/* =========================================================
   CONFIDENCE
   ========================================================= */

function formatConfidence(
  value
) {
  if (
    typeof value ===
    "string"
  ) {
    const text =
      value.trim();

    if (!text) {
      return "Unknown";
    }

    return (
      text.charAt(0).toUpperCase() +
      text.slice(1)
    );
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "Unknown";
  }

  if (
    number <= 1
  ) {
    return `${Math.round(number * 100)}%`;
  }

  return `${Math.round(number)}%`;
}


/* =========================================================
   TIMESTAMP
   ========================================================= */

function formatTimestamp(
  value
) {
  if (!value) {
    return "Unknown time";
  }

  let date;

  if (
    typeof value ===
    "number"
  ) {
    date =
      new Date(
        value <
        10_000_000_000
          ? value * 1000
          : value
      );

  } else {
    date =
      new Date(value);
  }

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Unknown time";
  }

  return date.toLocaleString();
}


/* =========================================================
   SET TEXT
   ========================================================= */

function setText(
  element,
  value
) {
  if (!element) {
    return;
  }

  element.textContent =
    value === undefined ||
    value === null ||
    value === ""
      ? "---"
      : String(value);
}


/* =========================================================
   HTML ESCAPE
   ========================================================= */

function escapeHTML(
  value
) {
  return String(
    value ?? ""
  )
    .replaceAll(
      "&",
      "&amp;"
    )
    .replaceAll(
      "<",
      "&lt;"
    )
    .replaceAll(
      ">",
      "&gt;"
    )
    .replaceAll(
      '"',
      "&quot;"
    )
    .replaceAll(
      "'",
      "&#039;"
    );
}


function escapeAttribute(
  value
) {
  return escapeHTML(
    value
  );
}


/* =========================================================
   FRIENDLY ERRORS
   ========================================================= */

function friendlyErrorMessage(
  error
) {
  const message =
    error?.message ||
    String(error || "");

  if (
    message.includes(
      "Failed to fetch"
    )
  ) {
    return "Could not connect to the RugInspect API. Please try again.";
  }

  if (
    message.toLowerCase()
      .includes("timeout") ||
    message.toLowerCase()
      .includes("too long")
  ) {
    return "The scan took too long. Please try again.";
  }

  return (
    message ||
    "Something went wrong. Please try again."
  );
}


/* =========================================================
   RESULTS LAYOUT + SECTION 09
   ========================================================= */

let riTokenInfoController = null;
let riTokenInfoLoadedContract = null;
let riLayoutContract = null;

function prepareResultsLayout() {
  const root = document.getElementById("resultsSection");
  const container = root?.querySelector(".results-container");
  const quick = root?.querySelector(".quick-result-card");
  const analysis = document.getElementById("allInfoSection");

  if (!root || !container || !quick || !analysis) return;

  if (!root.dataset.riLayoutReady) {
    const layout = document.createElement("div");
    layout.className = "ri-analysis-layout";

    const sidebar = document.createElement("aside");
    sidebar.className = "ri-overview-sidebar";

    const overview = document.createElement("details");
    overview.className = "ri-overview-panel";
overview.open = true;

    const overviewHeading = document.createElement("summary");
    overviewHeading.textContent = "Token Overview";
    overview.append(overviewHeading);

    const overviewBody = document.createElement("div");
    overviewBody.className = "ri-overview-body";
    overview.append(overviewBody);

    const distribution = quick.querySelector(".result-group-token");

    if (distribution) {
      overviewBody.append(distribution);
    }

    ["peakMarketCap", "dropFromPeak"].forEach(id => {
      const card = document.getElementById(id)
        ?.closest(".metric-card");

      if (card) overviewBody.append(card);
    });

    sidebar.append(overview);

    const marketGroup = quick.querySelector(".result-group-market");
    const marketGrid = marketGroup?.querySelector(".metric-card")
      ?.parentElement;

    if (marketGrid) {
      marketGrid.classList.add("ri-market-strip");

      const holdersCard = document.getElementById("holderCount")
        ?.closest(".token-metric-card");

      if (holdersCard) {
        holdersCard.classList.add("ri-holder-stat");
        marketGrid.append(holdersCard);
      }
    }

    const statusCard = document.getElementById("marketStatus")
      ?.closest(".metric-card");

    if (statusCard) {
      statusCard.classList.add("ri-market-alert");
      quick.append(statusCard);
    }

    const blocks = [...analysis.children].filter(node =>
      node.matches("section.result-block, section.analysis-section")
    );

    blocks.forEach((section, index) => {
      const heading = section.querySelector(
        ":scope > .section-heading, " +
        ":scope > .analysis-section-header"
      );

      if (!heading) return;

      const details = document.createElement("details");
      details.className = "ri-analysis-accordion";
      details.dataset.sectionNumber = String(index + 1);

      const summary = document.createElement("summary");
      summary.className = "ri-accordion-heading";

      const body = document.createElement("div");
      body.className = "ri-accordion-body";

      section.before(details);
      details.append(summary, body);

      summary.append(heading);
      body.append(section);

      details.addEventListener("toggle", () => {
        if (
          details.open &&
          details.querySelector("#tokenInfoSection")
        ) {
          loadWebsiteTokenInfo();
        }
      });
    });

    const disclaimer = analysis.querySelector(
      ":scope > .analysis-disclaimer"
    );

    container.append(layout);
    layout.append(analysis, sidebar);

    if (disclaimer) {
      container.append(disclaimer);
    }

    document.getElementById("tokenInfoReload")
      ?.addEventListener("click", () => {
        loadWebsiteTokenInfo(true);
      });

    root.dataset.riLayoutReady = "true";
  }

  riArrangeResults();

  analysis.classList.remove("hidden");

  const contract = state.currentContract;

  if (riLayoutContract !== contract) {
    riTokenInfoController?.abort();
    riTokenInfoController = null;
    riTokenInfoLoadedContract = null;
    riLayoutContract = contract;
    const ageElement = document.getElementById("tokenAge");

    if (ageElement) {
      ageElement.textContent = "Age: Loading…";
      ageElement.removeAttribute("title");
    }
    {
      const xLink = document.getElementById("tokenXLink");

      if (xLink) {
        xLink.style.display = "none";
        xLink.removeAttribute("href");
      }
    }

    document.getElementById("tokenInfoGrid")?.replaceChildren();

    const status = document.getElementById("tokenInfoStatus");

    if (status) {
      status.textContent =
        "Open this section to load token information.";
    }

    analysis.querySelectorAll(".ri-analysis-accordion")
      .forEach(details => {
        details.open = false;
      });
  }
}

async function loadWebsiteTokenInfo(force = false) {
  const contract = state.currentContract;
  const status = document.getElementById("tokenInfoStatus");
  const grid = document.getElementById("tokenInfoGrid");
  const button = document.getElementById("tokenInfoReload");

  if (!contract || !status || !grid) return;

  if (!force && riTokenInfoLoadedContract === contract) return;
  if (riTokenInfoController && !force) return;

  riTokenInfoController?.abort();

  const controller = new AbortController();
  riTokenInfoController = controller;

  const timer = setTimeout(() => controller.abort(), 12000);

  status.textContent = "Loading token information…";
  grid.replaceChildren();

  if (button) button.disabled = true;

  try {
    const response = await fetch(
      `${CONFIG.API_BASE}/api/token-info?ca=${
        encodeURIComponent(contract)
      }`,
      {
        headers: { Accept: "application/json" },
        signal: controller.signal
      }
    );

    const result = await response.json();

    if (!response.ok || result?.success !== true) {
      throw new Error("Token information is currently unavailable.");
    }

    if (result.contract !== contract) {
      throw new Error("The returned token does not match.");
    }

    if (
      state.currentContract !== contract ||
      riTokenInfoController !== controller
    ) {
      return;
    }

    const info = result.token_info || {};

    const tokenAge = document.getElementById("tokenAge");

    if (tokenAge) {
      const createdAt = result.token_created_at;
      const timestamp = typeof createdAt === "string"
        ? Date.parse(createdAt)
        : NaN;

      const elapsed = Date.now() - timestamp;

      if (
        Number.isFinite(timestamp) &&
        timestamp > 0 &&
        elapsed >= 0
      ) {
        const minutes = Math.floor(elapsed / 60000);
        const hours = Math.floor(elapsed / 3600000);
        const days = Math.floor(elapsed / 86400000);
        const years = Math.floor(days / 365.2425);

        let age;

        if (years >= 1) {
          age = `${years} ${years === 1 ? "year" : "years"}`;
        } else if (days >= 1) {
          age = `${days} ${days === 1 ? "day" : "days"}`;
        } else if (hours >= 1) {
          age = `${hours} ${hours === 1 ? "hour" : "hours"}`;
        } else {
          age = minutes < 1 ? "<1 min" : `${minutes} min`;
        }

        tokenAge.textContent = `Age: ${age}`;
        tokenAge.title =
          `Created: ${new Date(timestamp).toLocaleString()}`;
      } else {
        tokenAge.textContent = "Age: Unavailable";
        tokenAge.removeAttribute("title");
      }
    }

    {
      const xLink = document.getElementById("tokenXLink");

      if (xLink) {
        xLink.style.display = "none";
        xLink.removeAttribute("href");
      }
    }

    let xUrl = null;

    try {
      const value = result.social_links?.x;

      if (typeof value === "string" && value.trim()) {
        const parsed = new URL(value.trim());

        const allowedHosts = [
          "x.com",
          "www.x.com",
          "twitter.com",
          "www.twitter.com"
        ];

        if (
          parsed.protocol === "https:" &&
          allowedHosts.includes(parsed.hostname.toLowerCase()) &&
          !parsed.username &&
          !parsed.password &&
          parsed.pathname !== "/"
        ) {
          xUrl = parsed.href;
        }
      }
    } catch {
      xUrl = null;
    }

    const tokenXLink = document.getElementById("tokenXLink");

    if (tokenXLink && xUrl) {
      tokenXLink.href = xUrl;
      tokenXLink.style.display = "inline-flex";
    }

    const readNumber = value => {
      if (
        value === null ||
        value === undefined ||
        (typeof value !== "number" && typeof value !== "string") ||
        String(value).trim() === ""
      ) {
        return null;
      }

      const number = Number(value);

      return Number.isFinite(number) && number >= 0
        ? number
        : null;
    };

    const count = value => {
      const number = readNumber(value);

      return number === null
        ? "Unavailable"
        : new Intl.NumberFormat("en-US", {
            maximumFractionDigits: 0
          }).format(number);
    };

    const percent = value => {
      const number = readNumber(value);

      if (number === null) return "Unavailable";
      if (number > 0 && number < 0.01) return "<0.01%";

      return `${new Intl.NumberFormat("en-US", {
        maximumFractionDigits: 2
      }).format(number)}%`;
    };

    riRenderHolderOverview(info);

    riTokenInfoLoadedContract = contract;
    status.textContent = "Token information loaded.";
  } catch (error) {
    if (
      state.currentContract === contract &&
      riTokenInfoController === controller
    ) {
      status.textContent = controller.signal.aborted
        ? "Loading timed out. Click Refresh token info to try again."
        : "Token information is unavailable. Click Refresh token info to try again.";
    }
  } finally {
    clearTimeout(timer);

    if (riTokenInfoController === controller) {
      riTokenInfoController = null;

      if (button) button.disabled = false;
    }
  }
}


let dexPaidController = null;

async function loadDexPaidBadge(contract) {
  dexPaidController?.abort();

  const badge = document.getElementById(
    "tokenDexPaidBadge"
  );

  if (!badge) return;

  badge.hidden = true;
  badge.removeAttribute("href");

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract)) {
    return;
  }

  const controller = new AbortController();
  dexPaidController = controller;

  const isCurrent = () =>
    !controller.signal.aborted &&
    dexPaidController === controller &&
    state.currentContract === contract;

  // Changing the token also cancels the waiting period.
  const wait = milliseconds => new Promise(resolve => {
    if (controller.signal.aborted) {
      resolve();
      return;
    }

    const finish = () => {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", finish);
      resolve();
    };

    const timer = setTimeout(finish, milliseconds);

    controller.signal.addEventListener(
      "abort",
      finish,
      { once: true }
    );
  });

  try {
    for (let attempt = 0; attempt < 3; attempt++) {
      if (!isCurrent()) return;

      const requestController = new AbortController();

      const cancelRequest = () =>
        requestController.abort();

      controller.signal.addEventListener(
        "abort",
        cancelRequest,
        { once: true }
      );

      const timeout = setTimeout(
        () => requestController.abort(),
        12000
      );

      let retryDelay = 3000 * (attempt + 1);

      try {
        const response = await fetch(
          `${CONFIG.API_BASE}/api/dex-paid?ca=` +
            encodeURIComponent(contract),
          {
            cache: "no-store",
            signal: requestController.signal
          }
        );

        if (!isCurrent()) return;

        if (response.ok) {
          const result = await response.json();

          if (!isCurrent()) return;

          if (
            result.success !== true ||
            result.contract !== contract ||
            typeof result.paid !== "boolean"
          ) {
            throw new Error("Invalid DEX verification response.");
          }

          if (result.paid) {
            badge.href =
              "https://dexscreener.com/solana/" +
              encodeURIComponent(contract);

            badge.hidden = false;
          }

          // A confirmed negative result needs no retries.
          return;
        }

        if (
          response.status !== 429 &&
          response.status < 500
        ) {
          console.warn(
            "DEX verification rejected:",
            response.status
          );
          return;
        }

        if (response.status === 429) {
          const retryAfter = response.headers.get(
            "Retry-After"
          );

          const seconds = Number(retryAfter);

          retryDelay =
            retryAfter &&
            Number.isFinite(seconds) &&
            seconds > 0
              ? seconds * 1000
              : 60000;
        }

        console.warn(
          "DEX verification will retry:",
          response.status,
          "attempt:",
          attempt + 1
        );
      } catch (error) {
        if (!isCurrent()) return;

        console.warn(
          "DEX verification request failed:",
          error?.message || error
        );
      } finally {
        clearTimeout(timeout);

        controller.signal.removeEventListener(
          "abort",
          cancelRequest
        );
      }

      if (attempt < 2 && isCurrent()) {
        await wait(retryDelay);
      }
    }
  } finally {
    if (dexPaidController === controller) {
      dexPaidController = null;
    }
  }
}


let coinGeckoBadgeController = null;

async function loadCoinGeckoBadge(contract) {
  coinGeckoBadgeController?.abort();

  const badge = document.getElementById(
    "tokenCoinGeckoBadge"
  );

  if (!badge) return;

  badge.hidden = true;
  badge.removeAttribute("href");

  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract)) {
    return;
  }

  const controller = new AbortController();
  coinGeckoBadgeController = controller;

  const timeout = setTimeout(
    () => controller.abort(),
    10000
  );

  try {
    const response = await fetch(
      `${CONFIG.API_BASE}/api/coingecko-listed?ca=` +
        encodeURIComponent(contract),
      {
        cache: "no-store",
        signal: controller.signal
      }
    );

    if (!response.ok) return;

    const result = await response.json();

    if (
      controller.signal.aborted ||
      coinGeckoBadgeController !== controller ||
      state.currentContract !== contract
    ) {
      return;
    }

    if (
      result.success === true &&
      result.contract === contract &&
      result.listed === true &&
      typeof result.coin_id === "string" &&
      result.coin_id.trim()
    ) {
      badge.href =
        "https://www.coingecko.com/en/coins/" +
        encodeURIComponent(result.coin_id.trim());

      badge.hidden = false;
    }
  } catch {
    // Keep the badge hidden when verification fails.
  } finally {
    clearTimeout(timeout);

    if (coinGeckoBadgeController === controller) {
      coinGeckoBadgeController = null;
    }
  }
}


/* =========================================================
   RESULTS — HIGHLIGHTS AND LAYOUT
   ========================================================= */

let riHighlightsMarket = null;

function riArrangeResults() {
  const root = document.getElementById("resultsSection");
  const layout = root?.querySelector(".ri-analysis-layout");
  const quick = root?.querySelector(".quick-result-card");

  const highlights =
    document.getElementById("analysisHighlights");

  const signals =
    root?.querySelector(".result-group-signals");

  const overview =
    root?.querySelector(".ri-overview-body");

  if (!layout || !quick || !overview) return;

  if (highlights) {
    layout.append(highlights);
  }

  if (signals) {
    signals.classList.add("ri-core-signals");
    layout.append(signals);

    const status = document.getElementById("marketStatus")
      ?.closest(".metric-card");

    if (status) {
      signals.append(status);
    }
  }

  // Holders patria do Token Overview.
  const holders = document.getElementById("holderCount")
    ?.closest(".token-metric-card");

  const grid = overview.querySelector(".token-metrics-grid");

  if (holders && grid) {
    holders.classList.remove("ri-holder-stat");
    grid.prepend(holders);
  }
}

function riHighlightNumber(...values) {
  for (const value of values) {
    if (
      value === null ||
      value === undefined ||
      typeof value === "boolean"
    ) {
      continue;
    }

    if (
      typeof value !== "number" &&
      typeof value !== "string"
    ) {
      continue;
    }

    if (String(value).trim() === "") continue;

    const number = Number(value);

    if (Number.isFinite(number) && number >= 0) {
      return number;
    }
  }

  return null;
}

function renderAnalysisHighlights(
  data = state.currentAnalysis,
  live = null
) {
  const root = document.getElementById("analysisHighlights");

  if (!root || !data) return;

  if (live) {
    riHighlightsMarket = {
      contract: state.currentContract,
      data: live
    };
  }

  const market =
    riHighlightsMarket?.contract === state.currentContract
      ? riHighlightsMarket.data
      : {};

  const holders =
    data.holderAnalysis || data.holders || {};

  const cap = riHighlightNumber(
    market.marketCapUsd,
    data.market?.marketCapUsd,
    data.token?.marketCapUsd
  );

  const liquidity = riHighlightNumber(
    market.liquidityUsd,
    data.market?.liquidityUsd,
    data.liquidity?.totalLiquidityUsd
  );

  const drop = riHighlightNumber(
    market.dropFromPeakPercent,
    data.market?.dropFromPeakPercent,
    data.marketExitAnalysis?.dropFromPeakPercent
  );

  const top = riHighlightNumber(
    getAdjustedTop10(holders, data)
  );

  const ratio =
    cap !== null &&
    cap > 0 &&
    liquidity !== null
      ? liquidity / cap * 100
      : null;

  const percent = value =>
    value === null ? "—" : `${value.toFixed(2)}%`;

  const set = (id, value, tone, note) => {
    const field = document.getElementById(id);

    if (!field) return;

    field.textContent = percent(value);

    const card = field.closest(".ri-highlight-card");

    if (card) {
      card.dataset.tone =
        value === null ? "unknown" : tone;
    }

    const caption =
      card?.querySelector(".ri-highlight-note");

    if (caption) {
      caption.textContent =
        value === null ? "Data unavailable" : note;
    }
  };

  set(
    "highlightDrop",
    drop,
    drop >= 80
      ? "danger"
      : drop >= 40
        ? "warning"
        : "neutral",
    "Below historical peak"
  );

  set(
    "highlightTop10",
    top,
    top > 50
      ? "danger"
      : top > 25
        ? "warning"
        : "neutral",
    data.binanceHolderConcentration?.top10_percent != null
      ? "Binance Web3 · reported concentration"
      : holders.concentrationEstimated === true
      ? "Estimated share of supply"
      : "Share of supply"
  );

  const top10Title =
    data.binanceHolderConcentration?.top10_percent != null
      ? "Reported by Binance Web3. Protocol exclusions have not been verified."
      : "Holder concentration";

  const top10Highlight =
    document.getElementById("highlightTop10");

  if (top10Highlight) {
    top10Highlight.title = top10Title;
  }

  if (elements.top10Concentration) {
    elements.top10Concentration.title = top10Title;
  }

  set(
    "highlightLiquidityRatio",
    ratio,
    ratio < 2 ? "warning" : "neutral",
    "Liquidity relative to valuation"
  );

  const available = [drop, top, ratio]
    .filter(value => value !== null)
    .length;

  document.getElementById("highlightsCoverage").textContent =
    `${available}/3 metrics available`;

  document.getElementById("highlightsUpdated").textContent =
    "Values from the latest available data";
}

function riUpdateExitVerification(data = {}) {
  const exit = data.exitAnalysis || {};

  const historyVerified =
    exit.creatorHistoryAnalyzed === true;

  const sold =
    exit.confirmedCreatorSell === true ||
    (
      historyVerified &&
      riHighlightNumber(exit.creatorTokensSold) > 0
    );

  const major =
    historyVerified &&
    [
      "MAJOR_EXIT_ACTIVITY",
      "SEVERE_EXIT_ACTIVITY"
    ].includes(exit.status || data.status);

  const apply = (field, detected, verified) => {
    if (!field) return;

    field.classList.remove(
      "safe",
      "warning",
      "danger",
      "ri-not-verified"
    );

    field.textContent = detected
      ? "DETECTED"
      : verified
        ? "NOT DETECTED"
        : "NOT VERIFIED";

    field.classList.add(
      detected
        ? "danger"
        : verified
          ? "safe"
          : "ri-not-verified"
    );
  };

  apply(
    elements.exitCreatorSell,
    sold,
    historyVerified
  );

  apply(
    elements.exitMajorEvent,
    major,
    historyVerified
  );

  syncExitAnalysisDetails();
}


/* =========================================================
   TOKEN & TRADING FEES
   ========================================================= */

let riFeeController = null;
let riFeeRefreshTimer = null;
let riFeeContract = null;


function riFeeText(id, value) {
  const element =
    document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}


function riFeePercent(value) {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    return "—";
  }

  return (
    value.toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 4
      }
    ) + "%"
  );
}


function riFeeCapText(transfer) {
  if (transfer?.percent === 0) {
    return "Not applicable";
  }

  if (
    !/^\d+$/.test(
      transfer?.maximum_raw || ""
    ) ||
    !Number.isInteger(
      transfer?.decimals
    ) ||
    transfer.decimals < 0 ||
    transfer.decimals > 255
  ) {
    return "—";
  }

  const raw =
    transfer.maximum_raw.padStart(
      transfer.decimals + 1,
      "0"
    );

  const whole =
    transfer.decimals
      ? raw.slice(
          0,
          -transfer.decimals
        )
      : raw;

  const fraction =
    transfer.decimals
      ? raw.slice(
          -transfer.decimals
        ).replace(/0+$/, "")
      : "";

  const formattedWhole =
    whole.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );

  return (
    formattedWhole +
    (fraction ? "." + fraction : "") +
    " tokens"
  );
}


function riRenderTokenFees(data = null) {
  const transfer = data?.transfer;
  const trading = data?.trading;

  const values = {
    riTransferFee:
      riFeePercent(
        transfer?.percent
      ),

    riPoolFee:
      riFeePercent(
        trading?.pool_percent
      ),

    riCreatorFee:
      trading?.creator_enabled === false &&
      trading?.creator_percent === 0
        ? "Disabled · 0%"
        : riFeePercent(
            trading?.creator_percent
          )
  };

  for (
    const [id, value] of
    Object.entries(values)
  ) {
    riFeeText(id, value);

    document.getElementById(id)
      ?.classList.toggle(
        "ri-fee-unknown",
        value === "—"
      );
  }

  riFeeText(
    "riFeePlatform",
    trading?.platform || "—"
  );

  riFeeText(
    "riFeeBuy",
    riFeePercent(
      trading?.buy_pool_percent
    )
  );

  riFeeText(
    "riFeeSell",
    riFeePercent(
      trading?.sell_pool_percent
    )
  );

  riFeeText(
    "riFeeBasis",
    trading?.creator_enabled === false
      ? "Not applicable"
      : trading?.creator_basis || "—"
  );

  riFeeText(
    "riFeeCap",
    riFeeCapText(transfer)
  );

  riFeeText(
    "riFeeTransferSource",
    transfer?.source || "—"
  );

  riFeeText(
    "riFeePoolSource",
    trading?.source || "—"
  );

  const link =
    document.getElementById(
      "riFeePoolLink"
    );

  const validPool =
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(
      trading?.pool || ""
    );

  if (link) {
    link.hidden = !validPool;

    if (validPool) {
      link.href =
        `https://solscan.io/account/${trading.pool}`;
    } else {
      link.removeAttribute("href");
    }
  }

  const noPool =
    document.getElementById(
      "riFeeNoPool"
    );

  if (noPool) {
    noPool.hidden = validPool;
  }

  const timestamp =
    Date.parse(
      data?.measured_at || ""
    );

  riFeeText(
    "riFeeUpdated",
    Number.isFinite(timestamp)
      ? "Checked " +
        new Date(timestamp)
          .toLocaleTimeString("en-GB")
      : "—"
  );
}


async function riLoadTokenFees() {
  clearTimeout(riFeeRefreshTimer);

  riFeeController?.abort();

  const ca = state.currentContract;

  if (
    !ca ||
    !document.getElementById(
      "riTokenFees"
    )
  ) {
    return;
  }

  if (riFeeContract !== ca) {
    riFeeContract = ca;

    riRenderTokenFees();

    const details =
      document.getElementById(
        "riFeeDetails"
      );

    if (details) {
      details.open = false;
    }
  }

  const controller =
    new AbortController();

  riFeeController = controller;

  const timeout = setTimeout(
    () => controller.abort(),
    45000
  );

  try {
    const response = await fetch(
      `${CONFIG.API_BASE}/api/token-fees?ca=${encodeURIComponent(ca)}`,
      {
        signal: controller.signal
      }
    );

    if (!response.ok) {
      throw new Error(
        `Token fees HTTP ${response.status}`
      );
    }

    const data =
      await response.json();

    if (
      !data.success ||
      data.contract !== ca
    ) {
      throw new Error(
        "Invalid fee response"
      );
    }

    if (
      state.currentContract === ca &&
      riFeeController === controller
    ) {
      riRenderTokenFees(data);
    }
  } catch {
    if (
      state.currentContract === ca &&
      riFeeController === controller
    ) {
      riRenderTokenFees();
    }
  } finally {
    clearTimeout(timeout);

    if (
      state.currentContract === ca &&
      riFeeController === controller &&
      !elements.resultsSection
        ?.classList.contains("hidden")
    ) {
      riFeeRefreshTimer = setTimeout(
        riLoadTokenFees,
        180000
      );
    }
  }
}

function riOverviewNumber(value) {
  if (
    !["number", "string"].includes(typeof value) ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
}

function riOverviewPercent(value) {
  const number = riOverviewNumber(value);

  return number !== null && number <= 100
    ? number
    : null;
}

function riOverviewPercentText(value) {
  const number = riOverviewPercent(value);

  if (number === null) return "—";
  if (number > 0 && number < 0.01) return "<0.01%";

  return (
    number.toLocaleString("en-US", {
      maximumFractionDigits: 2
    }) + "%"
  );
}

function riOverviewRing(
  label,
  value,
  color,
  caption = ""
) {
  const number = riOverviewPercent(value);

  return `
    <div
      class="ri-overview-metric"
      style="--ring-color:${color}"
    >
      <div
        class="ri-overview-ring"
        role="img"
        aria-label="${escapeAttribute(
          label + ": " + riOverviewPercentText(number)
        )}"
      >
        <svg
          viewBox="0 0 120 120"
          aria-hidden="true"
        >
          <circle
            class="ri-ring-track"
            cx="60"
            cy="60"
            r="50"
          />

          <circle
            class="ri-ring-fill"
            cx="60"
            cy="60"
            r="50"
            pathLength="100"
            stroke-dasharray="${number ?? 0} 100"
          />
        </svg>

        <strong>
          ${escapeHTML(
            riOverviewPercentText(number)
          )}
        </strong>
      </div>

      <span class="ri-overview-label">
        ${escapeHTML(label)}
      </span>

      ${
        caption
          ? `<small>${escapeHTML(caption)}</small>`
          : ""
      }
    </div>
  `;
}

function riOverviewHolderRows(holders) {
  return (
    Array.isArray(holders)
      ? holders
      : []
  )
    .filter(holder =>
      holder &&
      holder.excludedFromAdjustedConcentration !== true &&
      ![
        "liquidity_pool",
        "protocol",
        "protocol_account",
        "burn"
      ].includes(holder.classification)
    )
    .map(holder => ({
      wallet: String(
        holder.owner ||
        holder.wallet ||
        holder.address ||
        ""
      ),

      percent: riOverviewPercent(
        holder.percentage ??
        holder.percent ??
        holder.supplyPercentage
      ),

      amount:
        holder.amount ??
        holder.balance ??
        holder.uiAmount ??
        null,

      type: String(
        holder.displayType ||
        holder.classification ||
        "Unverified owner"
      )
    }))
    .sort(
      (a, b) =>
        (b.percent ?? -1) -
        (a.percent ?? -1)
    )
    .slice(0, 10);
}

function riOverviewHolderList(holders) {
  const rows = riOverviewHolderRows(holders);

  if (!rows.length) {
    return `
      <p class="ri-overview-empty">
        Holder list unavailable.
      </p>
    `;
  }

  const maximum = Math.max(
    0,
    ...rows.map(row => row.percent ?? 0)
  );

  return `
    <div class="ri-overview-holder-list">
      ${
        rows.map((row, index) => {
          const validWallet =
            /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
              .test(row.wallet);

          const wallet = validWallet
            ? `
              <a
                href="https://solscan.io/account/${
                  encodeURIComponent(row.wallet)
                }"
                target="_blank"
                rel="noopener noreferrer"
                title="${escapeAttribute(row.wallet)}"
              >
                ${escapeHTML(
                  shortenAddress(row.wallet)
                )}
              </a>
            `
            : `
              <span class="ri-overview-wallet">
                ${escapeHTML(row.wallet || "—")}
              </span>
            `;

          const width =
            row.percent !== null &&
            maximum > 0
              ? row.percent / maximum * 100
              : 0;

          return `
            <div class="ri-overview-holder-row">
              <span class="ri-overview-rank">
                ${index + 1}
              </span>

              ${wallet}

              <span
                class="ri-overview-bar"
                aria-hidden="true"
              >
                <i style="width:${width}%"></i>
              </span>

              <strong>
                ${escapeHTML(
                  riOverviewPercentText(row.percent)
                )}
              </strong>
            </div>
          `;
        }).join("")
      }
    </div>

    <details class="ri-overview-holder-details">
      <summary>
        View holder details
        <span aria-hidden="true">›</span>
      </summary>

      ${
        rows.map(row => `
          <div>
            <span title="${
              escapeAttribute(row.wallet)
            }">
              ${escapeHTML(
                shortenAddress(row.wallet)
              )}
            </span>

            <strong>
              ${escapeHTML(
                formatTokenAmount(row.amount)
              )}
            </strong>

            <small>
              ${escapeHTML(row.type)}
            </small>
          </div>
        `).join("")
      }
    </details>
  `;
}

function riRenderHolderOverview(
  info,
  analysis = state.currentAnalysis
) {
  const grid =
    document.getElementById("tokenInfoGrid");

  if (!grid) return;

  info = info || {};

  const count =
    riOverviewNumber(info.holders);

  const pro =
    riOverviewNumber(info.pro_holders);

  const fresh =
    riOverviewNumber(info.new_wallets);

  const ratio = value =>
    count > 0 &&
    value !== null &&
    value <= count
      ? value / count * 100
      : null;

  const countText = value =>
    value === null
      ? "—"
      : value.toLocaleString("en-US", {
          maximumFractionDigits: 0
        });

  const supply =
    riOverviewNumber(info.total_supply);

  const holders =
    analysis?.holderAnalysis ||
    analysis?.holders ||
    {};

  const list = normalizeHolderArray(
    holders,
    analysis || {}
  );

  const top10 = getAdjustedTop10(
    holders,
    analysis || {}
  );

  const caption = value =>
    value === null || count === null
      ? "Count unavailable"
      : (
          `${countText(value)} of ` +
          `${countText(count)} holders`
        );

  grid.innerHTML = `
    <div class="ri-overview-layout">

      <article class="ri-overview-panel">
        <h4>Holder overview</h4>

        <h5>Holder composition</h5>

        <div class="ri-overview-count-rings">
          ${
            riOverviewRing(
              "Pro holders",
              ratio(pro),
              "#ff6262",
              caption(pro)
            )
          }

          ${
            riOverviewRing(
              "New wallets",
              ratio(fresh),
              "#ffad45",
              caption(fresh)
            )
          }
        </div>

        <h5>Share of token supply</h5>

        <div class="ri-overview-supply-rings">
          ${
            riOverviewRing(
              "Dev holdings",
              info.dev_holding_percent,
              "#24eea2"
            )
          }

          ${
            riOverviewRing(
              "Insider holdings",
              info.insider_holding_percent,
              "#37d8ee"
            )
          }

          ${
            riOverviewRing(
              "Bundler holdings",
              info.bundler_holding_percent,
              "#b9e857"
            )
          }

          ${
            riOverviewRing(
              "Smart money",
              info.smart_money_holding_percent,
              "#e6c85b"
            )
          }

          ${
            riOverviewRing(
              "KOL holdings",
              info.kol_holding_percent,
              "#a783ed"
            )
          }
        </div>

        <div class="ri-overview-totals">
          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="7" r="3"/>
              <path d="M3 21v-3a6 6 0 0 1 12 0v3"/>
              <path d="M16 4a3 3 0 0 1 0 6"/>
              <path d="M18 14a5 5 0 0 1 3 4v3"/>
            </svg>

            <span>Holders</span>
            <strong>${countText(count)}</strong>
          </div>

          <div>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <ellipse cx="12" cy="5" rx="8" ry="3"/>
              <path d="M4 5v14c0 4 16 4 16 0V5"/>
              <path d="M4 10c0 4 16 4 16 0"/>
              <path d="M4 15c0 4 16 4 16 0"/>
            </svg>

            <span>Total supply</span>

            <strong>
              ${
                supply === null
                  ? "—"
                  : supply.toLocaleString("en-US", {
                      notation: "compact",
                      maximumFractionDigits: 2
                    })
              }
            </strong>
          </div>
        </div>

        <p class="ri-overview-note">
          Wallet groups may overlap.
          Each ring is independent.
        </p>
      </article>

    </div>
  `;
}


let riLaunchRiskController = null;

async function riLoadLaunchRiskSignals(
  contract,
  analysis
) {
  riLaunchRiskController?.abort();

  const controller = new AbortController();

  riLaunchRiskController = controller;

  const timer = setTimeout(
    () => controller.abort(),
    65000
  );

  try {
    const response = await fetch(
      `${CONFIG.API_BASE}/api/launch-risk-signals?ca=${encodeURIComponent(contract)}`,
      {
        signal: controller.signal,
        cache: "no-store"
      }
    );

    if (!response.ok) return;

    const result = await response.json();

    if (
      controller.signal.aborted ||
      state.currentContract !== contract ||
      state.currentAnalysis !== analysis ||
      result.success !== true ||
      result.contract !== contract ||
      !Array.isArray(result.signals)
    ) {
      return;
    }

    const extraSignals = result.signals.filter(
      signal =>
        signal.code === "creator_launch_block_buys" &&
        Number.isInteger(signal.count) &&
        signal.count > 0
    );

    if (!extraSignals.length) return;

    const originalSignals = Array.isArray(
      analysis.riskSignals
    )
      ? analysis.riskSignals
      : Array.isArray(analysis.risks)
      ? analysis.risks
      : [];

    const merged = new Map();

    for (const signal of [
      ...originalSignals,
      ...extraSignals
    ]) {
      const key =
        signal.code ||
        signal.type ||
        signal.title;

      merged.set(key, signal);
    }

    analysis.riskSignals = [
      ...merged.values()
    ];

    renderRiskSignals(
      analysis.riskSignals,
      analysis
    );

  } catch {
    // Unavailable checks add no warning.
  } finally {
    clearTimeout(timer);

    if (riLaunchRiskController === controller) {
      riLaunchRiskController = null;
    }
  }
}


async function shareAnalysis() {
  const contract = state.currentContract;
  const analysis = state.currentAnalysis;

  const button = document.getElementById(
    "shareAnalysisButton"
  );

  const label = button?.querySelector("span");

  if (
    state.analyzing ||
    !analysis ||
    !isLikelySolanaAddress(contract || "") ||
    (
      analysis.contractAddress ||
      analysis.token?.contractAddress
    ) !== contract
  ) {
    showToast("Wait for the analysis to finish");
    return;
  }

  if (button?.disabled) return;

  const snapshot = structuredClone(analysis);
  const tokenImage = document.getElementById("tokenImage");

  const logoUrl =
    tokenImage?.naturalWidth > 0
      ? tokenImage.currentSrc
      : snapshot.token?.image || snapshot.pumpfun?.image;

  if (button) button.disabled = true;
  if (label) label.textContent = "Preparing…";

  try {
    const blob = await riDrawAnalysisCard(
      snapshot,
      contract,
      logoUrl
    );

    riOpenSharePreview(blob, snapshot, contract);
  } catch (error) {
    console.warn("Analysis preview failed:", error);

    showToast(
      error.message || "Could not create analysis image"
    );
  } finally {
    if (button) button.disabled = false;
    if (label) label.textContent = "Share analysis";
  }
}

async function riCopyAnalysisLink(link) {
  try {
    await navigator.clipboard.writeText(link);
    showToast("Link copied");
    return;
  } catch {
    // Browser clipboard permissions may require a fallback.
  }

  const previousFocus = document.activeElement;
  const field = document.createElement("textarea");

  field.value = link;
  field.readOnly = true;
  field.style.cssText =
    "position:fixed;left:-9999px;top:0;opacity:0;";

  document.body.appendChild(field);

  let copied = false;

  try {
    field.focus();
    field.select();
    field.setSelectionRange(0, field.value.length);
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  } finally {
    field.remove();
    previousFocus?.focus?.({ preventScroll: true });
  }

  if (copied) {
    showToast("Link copied");
  } else {
    window.prompt("Copy this analysis link:", link);
  }
}


function riCardNumber(value) {
  if (
    !["number", "string"].includes(typeof value) ||
    String(value).trim() === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? number
    : null;
}

function riCardMoney(value) {
  const number = riCardNumber(value);

  if (number === null) return "—";

  for (const [divisor, suffix] of [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"]
  ]) {
    if (number >= divisor) {
      return "$" + (number / divisor).toFixed(2) + suffix;
    }
  }

  return "$" + number.toFixed(2);
}

function riCardPercent(value) {
  const number = riCardNumber(value);

  return number === null || number > 100
    ? "—"
    : number.toFixed(2).replace(/\.?0+$/, "") + "%";
}

function riCardLoadImage(source) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timer = setTimeout(() => finish(false), 12000);
    let finished = false;

    function finish(success) {
      if (finished) return;
      finished = true;

      clearTimeout(timer);
      image.onload = null;
      image.onerror = null;

      if (success) {
        resolve(image);
      } else {
        image.removeAttribute("src");
        reject(new Error("Could not load image."));
      }
    }

    image.crossOrigin = "anonymous";
    image.onload = () => finish(image.naturalWidth > 0);
    image.onerror = () => finish(false);
    image.src = source;
  });
}

async function riDrawAnalysisCard(data, contract, logoUrl) {
  const canvas = document.createElement("canvas");

  canvas.width = 1585;
  canvas.height = 992;

  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("Image rendering unavailable.");

  const template = await riCardLoadImage(
    new URL("./analyse.png", window.location.href).href
  );

  ctx.drawImage(template, 0, 0, 1585, 992);

  // Draw text inside a fixed area, reducing its size when needed.
  function text(
    value,
    x,
    baseline,
    width,
    size = 48,
    color = "#f1faf6",
    weight = 700,
    family = "Arial"
  ) {
    let content = String(value ?? "—");
    let fontSize = size;

    ctx.fillStyle = color;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    function setFont() {
      ctx.font = `${weight} ${fontSize}px ${family}`;
    }

    setFont();

    while (
      ctx.measureText(content).width > width &&
      fontSize > 14
    ) {
      fontSize--;
      setFont();
    }

    if (ctx.measureText(content).width > width) {
      while (
        content.length &&
        ctx.measureText(content + "…").width > width
      ) {
        content = content.slice(0, -1);
      }

      content += "…";
    }

    ctx.fillText(content, x, baseline);
  }

  const token = data.token || {};
  const market = data.market || {};
  const holders = data.holderAnalysis || {};
  const provider = data.providerTokenInfo?.token_info || {};

  const name = String(token.name || "Unknown token");
  const symbol = String(token.symbol || "")
    .replace(/^\$/, "");

  text(name, 355, 240, 655, 82);
  text(
    symbol ? "$" + symbol : "—",
    355,
    315,
    290,
    48,
    "#b8cbd0",
    600
  );

// Try direct loading and the Worker proxy.
let logo = null;

async function tryLogoSources(sources) {
  const urls = [
    ...new Set(
      sources.filter(value =>
        typeof value === "string" &&
        value.trim()
      )
    )
  ].slice(0, 4);

  if (!urls.length) return null;

  const attempts = urls.flatMap(source => {
    const proxy = new URL(
      "/api/share-logo",
      CONFIG.API_BASE
    );

    proxy.searchParams.set("url", source);

    return [
      riCardLoadImage(source),
      riCardLoadImage(proxy.href)
    ];
  });

  try {
    return await Promise.any(attempts);
  } catch {
    return null;
  }
}

logo = await tryLogoSources([
  logoUrl,
  data.token?.image,
  data.pumpfun?.image
]);

if (!logo) {
  try {
    const dexImage = await getDexTokenImage(contract);

    logo = await tryLogoSources([dexImage]);
  } catch (error) {
    console.warn("Share card Dex logo failed:", error);
  }
}

if (!logo) {
  console.warn("Share card logo unavailable:", {
    contract,
    logoUrl
  });
}

  ctx.save();
  ctx.beginPath();
  ctx.arc(202, 233, 103, 0, Math.PI * 2);
  ctx.clip();

  if (logo) {
    const scale = Math.max(
      206 / logo.naturalWidth,
      206 / logo.naturalHeight
    );

    const width = logo.naturalWidth * scale;
    const height = logo.naturalHeight * scale;

    ctx.drawImage(
      logo,
      202 - width / 2,
      233 - height / 2,
      width,
      height
    );
  } else {
    ctx.fillStyle = "#09251c";
    ctx.fillRect(99, 130, 206, 206);
    ctx.fillStyle = "#bafbe0";
    ctx.font = "700 92px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
      (symbol || name).slice(0, 1).toUpperCase(),
      202,
      233
    );
  }

  ctx.restore();

  const rawScore =
    typeof data.score === "number"
      ? data.score
      : data.score?.value ?? data.score?.score;

  const score = riCardNumber(rawScore);

  const scoreText =
    score !== null && score <= 100
      ? String(Math.round(score))
      : "—";

  const scoreColor =
    score === null ? "#b8cbd0" :
    score >= 80 ? "#00e6aa" :
    score >= 60 ? "#f5d56c" :
    score >= 40 ? "#f2a34b" : "#ef7373";

  // Right-aligned immediately before the fixed "/100".
  let scoreSize = 116;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = scoreColor;
  ctx.font = `700 ${scoreSize}px Arial`;

  while (ctx.measureText(scoreText).width > 205) {
    scoreSize--;
    ctx.font = `700 ${scoreSize}px Arial`;
  }

  ctx.fillText(scoreText, 1260, 272);

  const count = riCardNumber(
    holders.holderCount ??
    data.pumpfun?.holderCount ??
    provider.holders
  );

  const top10 =
    holders.adjusted?.top10Concentration ??
    holders.top10Concentration;

  const ageMetric = data.score?.breakdown?.find(
    item => item.metric === "Age (days)"
  );

  let age = riCardNumber(ageMetric?.value);

  if (age === null && token.createdTimestamp) {
    const raw = Number(token.createdTimestamp);

    const timestamp = Number.isFinite(raw)
      ? raw < 1e11 ? raw * 1000 : raw
      : Date.parse(token.createdTimestamp);

    const scannedAt = Date.parse(data.timestamp);
    const elapsed =
      (Number.isFinite(scannedAt) ? scannedAt : Date.now()) -
      timestamp;

    if (Number.isFinite(elapsed) && elapsed >= 0) {
      age = elapsed / 86400000;
    }
  }

  const ageText =
    age === null ? "—" :
    age < 1 ? Math.floor(age * 24) + " hours" :
    Math.floor(age) + (Math.floor(age) === 1 ? " day" : " days");

  const values = [
    riCardMoney(market.marketCapUsd ?? token.marketCapUsd),
    riCardMoney(
      market.liquidityUsd ??
      data.liquidity?.currentLiquidityUsd ??
      data.liquidity?.totalLiquidityUsd
    ),
    riCardMoney(market.volume24hUsd),
    count === null ? "—" : Math.floor(count).toLocaleString("en-US"),
    riCardPercent(top10),
    riCardPercent(data.creator?.supplyOwned),
    riCardPercent(provider.bundler_holding_percent),
    ageText
  ];

  const columns = [
    { x: 155, width: 238 },
    { x: 545, width: 220 },
    { x: 915, width: 225 },
    { x: 1290, width: 225 }
  ];

  values.forEach((value, index) => {
    const column = columns[index % 4];

    text(
      value,
      column.x,
      index < 4 ? 465 : 615,
      column.width,
      48
    );
  });

  function authority(value) {
    return value === true
      ? "Disabled"
      : value === false
        ? "Active"
        : "—";
  }

  function authorityColor(value) {
    return value === true
      ? "#00e6aa"
      : value === false
        ? "#ef7373"
        : "#b8cbd0";
  }

  const mint = data.authorities?.mintAuthorityDisabled;
  const freeze = data.authorities?.freezeAuthorityDisabled;

  text(
    authority(mint),
    545, 710, 225, 25,
    authorityColor(mint), 600
  );

text(
  authority(freeze),
  1225, 710, 285, 25,
  authorityColor(freeze), 600
);

  text(
    contract,
    280, 806, 1220, 29,
    "#ecf5f1", 500, "monospace"
  );

  const measuredAt = new Date(data.timestamp);

  const time = Number.isFinite(measuredAt.getTime())
    ? measuredAt.toISOString().slice(0, 16).replace("T", " ") + " UTC"
    : "Unavailable";

  text(time, 1365, 862, 180, 12, "#c4d5ce", 400);

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error("Could not generate analysis image."));
      } else if (blob.size > 4 * 1024 * 1024) {
        reject(new Error("Analysis image is too large."));
      } else {
        resolve(blob);
      }
    }, "image/png");
  });
}


function riOpenSharePreview(blob, data, contract) {
  document.getElementById("riSharePreview")?.close();

  const imageUrl = URL.createObjectURL(blob);

  const scannerUrl = new URL(window.location.href);
  scannerUrl.search = "";
  scannerUrl.searchParams.set("ca", contract);
  scannerUrl.hash = "scanner";

  const symbol = String(data.token?.symbol || "token")
    .replace(/^\$/, "");

  const filename =
    "RugInspect-" +
    (symbol.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 30) || "token") +
    ".png";

  const score =
    typeof data.score === "number"
      ? data.score
      : data.score?.value ?? data.score?.score;

  const scoreLine =
    typeof score === "number" && Number.isFinite(score)
      ? `\nRugInspect score: ${Math.round(score)}/100`
      : "";

  const intent = new URL("https://x.com/intent/tweet");

  intent.searchParams.set(
    "text",
    `${symbol ? "$" + symbol : "Token"} analysis on @RugInspect` +
      scoreLine
  );

  intent.searchParams.set("url", scannerUrl.href);

  const dialog = document.createElement("dialog");
  dialog.id = "riSharePreview";
  dialog.className = "ri-share-preview";

  dialog.innerHTML = `
    <div class="ri-share-preview-header">
      <h2>Share analysis</h2>
      <button
        type="button"
        class="ri-share-preview-close"
        aria-label="Close preview"
      >×</button>
    </div>

    <img
      class="ri-share-preview-image"
      alt="Token analysis card"
    >

    <div class="ri-share-preview-actions">
      <button type="button" data-share-action="copy">
        Copy image
      </button>

      <button type="button" data-share-action="x">
        Share on X ↗
      </button>

      <a data-share-action="download">
        Download PNG
      </a>
    </div>

    <p class="ri-share-preview-status" role="status" aria-live="polite">
      Share on X copies the image and opens your post.
      Paste the image on X with Ctrl+V or ⌘V.
    </p>
  `;

  const image = dialog.querySelector("img");
  const status = dialog.querySelector("[role='status']");
  const copyButton = dialog.querySelector(
    "[data-share-action='copy']"
  );

  const xButton = dialog.querySelector(
    "[data-share-action='x']"
  );

  const download = dialog.querySelector(
    "[data-share-action='download']"
  );

  image.src = imageUrl;
  download.href = imageUrl;
  download.download = filename;

  async function copyImage() {
    if (
      !window.isSecureContext ||
      !navigator.clipboard?.write ||
      typeof ClipboardItem === "undefined"
    ) {
      throw new Error(
        "Use Download PNG or right-click the image to copy it."
      );
    }

    await navigator.clipboard.write([
      new ClipboardItem({
        "image/png": blob
      })
    ]);
  }

  copyButton.addEventListener("click", async () => {
    copyButton.disabled = true;

    try {
      await copyImage();
      status.textContent = "Image copied. Paste it with Ctrl+V or ⌘V.";
    } catch {
      status.textContent =
        "Could not copy the image. Use Download PNG or right-click the image.";
    } finally {
      copyButton.disabled = false;
    }
  });

  xButton.addEventListener("click", async () => {
    xButton.disabled = true;

    try {
      await copyImage();

      // Same-tab navigation avoids browser popup blocking.
      window.location.assign(intent.href);
    } catch {
      status.textContent =
        "Download or copy the image first, then choose Open X.";

      const openX = document.createElement("a");
      openX.href = intent.href;
      openX.target = "_blank";
      openX.rel = "noopener noreferrer";
      openX.textContent = "Open X ↗";

      xButton.replaceWith(openX);
    } finally {
      xButton.disabled = false;
    }
  });

  dialog.querySelector(".ri-share-preview-close")
    .addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;

    const bounds = dialog.getBoundingClientRect();

    if (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    ) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    dialog.remove();
    URL.revokeObjectURL(imageUrl);
  }, { once: true });

  document.body.appendChild(dialog);
  dialog.showModal();
}