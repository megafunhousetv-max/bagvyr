import {
  getWallets
} from "https://esm.sh/@wallet-standard/app@1.1.0";

(() => {
  "use strict";

  const API =
    "https://bagvyr-api.megafunhousetv.workers.dev/api/trading";

  const SOL =
    "So11111111111111111111111111111111111111112";

  const CHAIN = "solana:mainnet";
  const registry = getWallets();

  const state = {
    user: null,
    linked: null,
    wallet: null,
    account: null,
    holdings: null,
    epoch: 0,
    busy: false,
    loading: false,
    active: null,
    scanner: null,
    pending: null
  };

  let metaClient = null;
  let unlisten = null;
  let sessionSerial = 0;

  const $ = id => document.getElementById(id);


  function make(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (text !== undefined) {
      element.textContent = text;
    }

    return element;
  }


  function short(address) {
    return address
      ? address.slice(0, 5) + "…" + address.slice(-5)
      : "";
  }


  function dollars(value) {
    if (!Number.isFinite(value)) return "—";

    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2
    }).format(value);
  }


  function nice(value) {
    if (!Number.isFinite(value)) return "—";

    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 6
    }).format(value);
  }


  function base64(bytes) {
    let text = "";

    for (const value of bytes) {
      text += String.fromCharCode(value);
    }

    return btoa(text);
  }


  function fromBase64(text) {
    return Uint8Array.from(
      atob(text),
      character => character.charCodeAt(0)
    );
  }


  function decimal(raw, decimals) {
    const text = String(raw).padStart(
      decimals + 1,
      "0"
    );

    return decimals
      ? text.slice(0, -decimals) +
        "." +
        text.slice(-decimals)
      : text;
  }


  function rawInput(text, decimals) {
    const [whole, fraction = ""] = text.split(".");

    if (
      !/^\d+(\.\d+)?$/.test(text) ||
      fraction.length > decimals
    ) {
      throw new Error(
        "Enter a valid amount with at most " +
        decimals +
        " decimals."
      );
    }

    return (
      BigInt(whole) * 10n ** BigInt(decimals) +
      BigInt(fraction.padEnd(decimals, "0") || "0")
    );
  }


  function button(
    text,
    action,
    className = "rt-button"
  ) {
    const element = make(
      "button",
      className,
      text
    );

    element.type = "button";

    element.addEventListener("click", () => {
      void guard(action);
    });

    return element;
  }


  function notice(message) {
    const element = $("rtNotice");

    if (element) {
      element.textContent = message;
    }
  }


  async function guard(action) {
    try {
      await action();
    } catch (error) {
      const message =
        typeof error?.message === "string"
          ? error.message
          : "Request failed. Please try again.";

      notice(message);

      if (state.active) {
        state.active.status.textContent = message;
      }
    }
  }


  function client() {
    return window.RI_ACCOUNT_CLIENT;
  }


  async function session() {
    const accountClient = client();

    if (!accountClient) {
      throw new Error(
        "Account is still loading. Please reload the page."
      );
    }

    const { data, error } =
      await accountClient.auth.getSession();

    if (error || !data.session) {
      throw new Error(
        "Sign in to your RugInspect account first."
      );
    }

    return data.session;
  }


  async function api(path, body) {
    const auth = await session();

    const response = await fetch(API + path, {
      method:
        body === undefined
          ? "GET"
          : "POST",

      headers: {
        Authorization:
          "Bearer " + auth.access_token,

        ...(body === undefined
          ? {}
          : {
              "Content-Type": "application/json"
            })
      },

      ...(body === undefined
        ? {}
        : {
            body: JSON.stringify(body)
          }),

      signal: AbortSignal.timeout(
        path === "/execute"
          ? 70000
          : 45000
      )
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        data.error ||
        "Trading request failed (HTTP " +
          response.status +
          ")."
      );
    }

    return data;
  }


  function assertContext(epoch, address) {
    if (
      state.epoch !== epoch ||
      state.linked?.address !== address ||
      state.account?.address !== address
    ) {
      throw new Error(
        "Account or wallet changed. Please start again."
      );
    }
  }


  function invalidate() {
    if (!state.active) return;

    state.active.order = null;
    state.active.review.hidden = true;
    state.active.output.textContent = "—";

    updateTrade(state.active);
  }


  function setBusy(value) {
    state.busy = value;

    if (state.active) {
      updateTrade(state.active);
    }
  }


  function supportsTrading(wallet) {
    return (
      wallet.features?.["standard:connect"] &&
      wallet.features?.["solana:signMessage"] &&
      wallet.features?.["solana:signTransaction"]
    );
  }


  async function pickWallet() {
    const dialog = make("dialog", "rt-dialog");
    const content = make("div", "rt-dialog-body");

    content.append(
      make("h2", "", "Connect Solana wallet"),

      make(
        "p",
        "rt-muted",
        "Choose your wallet. Verify the address with a message signature."
      )
    );

    let resolveSelection;

    const selection = new Promise(resolve => {
      resolveSelection = resolve;
    });

    let closed = false;

    function finish(wallet) {
      if (closed) return;

      closed = true;
      dialog.close();
      dialog.remove();
      resolveSelection(wallet);
    }

    const installed = registry
      .get()
      .filter(supportsTrading);

    const list = make("div", "rt-wallet-list");

    for (const name of [
      "Phantom",
      "Solflare",
      "Backpack",
      "MetaMask"
    ]) {
      const found = installed.find(wallet => {
        return wallet.name
          .toLowerCase()
          .includes(name.toLowerCase());
      });

      list.append(
        button(
          name + (found ? "" : " · Open / install"),

          async () => {
            if (found) {
              finish(found);
              return;
            }

            if (name === "MetaMask") {
              notice("Opening MetaMask…");

              if (!metaClient) {
                const {
                  createSolanaClient
                } = await import(
                  "https://esm.sh/@metamask/connect-solana@2.1.1?bundle"
                );

                metaClient = await createSolanaClient({
                  dapp: {
                    name: "RugInspect",
                    url: location.origin,
                    iconUrl:
                      location.origin + "/lupa.png"
                  }
                });
              }

              finish(metaClient.getWallet());
              return;
            }

            const links = {
              Phantom:
                "https://phantom.com/download",

              Solflare:
                "https://solflare.com/download",

              Backpack:
                "https://backpack.app/download"
            };

            content.append(
              make(
                "p",
                "rt-muted",
                "Install the wallet extension, or open ruginspect.com in the wallet’s mobile browser, then reconnect."
              )
            );

            const link = make(
              "a",
              "rt-link",
              "Open official " + name + " website"
            );

            link.href = links[name];
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            content.append(link);
          }
        )
      );
    }

    content.append(
      list,
      button("Cancel", () => finish(null))
    );

    dialog.append(content);

    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      finish(null);
    });

    document.body.append(dialog);
    dialog.showModal();

    return selection;
  }


  async function pickAccount(accounts) {
    if (accounts.length <= 1) {
      return accounts[0] || null;
    }

    return new Promise(resolve => {
      const dialog = make("dialog", "rt-dialog");
      const content = make("div", "rt-dialog-body");

      content.append(
        make("h2", "", "Choose Solana account")
      );

      function finish(account) {
        dialog.close();
        dialog.remove();
        resolve(account);
      }

      for (const account of accounts) {
        content.append(
          button(
            short(account.address),
            () => finish(account)
          )
        );
      }

      content.append(
        button("Cancel", () => finish(null))
      );

      dialog.addEventListener("cancel", event => {
        event.preventDefault();
        finish(null);
      });

      dialog.append(content);
      document.body.append(dialog);
      dialog.showModal();
    });
  }


  function disconnectLocal() {
    unlisten?.();
    unlisten = null;

    const wallet = state.wallet;

    state.wallet = null;
    state.account = null;

    try {
      Promise.resolve(
        wallet
          ?.features
          ?.["standard:disconnect"]
          ?.disconnect()
      ).catch(() => {});
    } catch {}
  }


  async function connect() {
    if (state.busy) return;

    if (!state.user) {
      location.hash = "account";

      throw new Error(
        "Sign in before connecting your wallet."
      );
    }

    setBusy(true);

    const epoch = state.epoch;

    try {
      const candidate = await pickWallet();

      if (!candidate) return;

      const { accounts } =
        await candidate.features[
          "standard:connect"
        ].connect();

      const compatible = accounts.filter(account => {
        return (
          account.chains.includes(CHAIN) &&
          account.features.includes(
            "solana:signMessage"
          ) &&
          account.features.includes(
            "solana:signTransaction"
          )
        );
      });

      if (!compatible.length) {
        throw new Error(
          "Select a Solana mainnet account that supports message and transaction signing."
        );
      }

      const account = await pickAccount(compatible);

      if (!account) return;

      if (epoch !== state.epoch) {
        throw new Error(
          "Your account changed. Connect again."
        );
      }

      if (
        state.linked?.address !== account.address
      ) {
        const challenge = await api(
          "/challenge",
          {
            address: account.address,
            walletName: candidate.name
          }
        );

        const [{ signature }] =
          await candidate.features[
            "solana:signMessage"
          ].signMessage({
            account,

            message: new TextEncoder().encode(
              challenge.message
            )
          });

        if (epoch !== state.epoch) {
          throw new Error(
            "Your account changed. Connect again."
          );
        }

        const proof = await api("/verify", {
          id: challenge.id,
          signature: base64(signature)
        });

        if (epoch !== state.epoch) {
          throw new Error("Your account changed.");
        }

        state.linked = proof.wallet;
        state.holdings = null;

        clearPending();
      }

      if (
        state.wallet &&
        state.wallet !== candidate
      ) {
        disconnectLocal();
      } else {
        unlisten?.();
        unlisten = null;
      }

      state.wallet = candidate;
      state.account = account;

      invalidate();

      unlisten =
        candidate.features[
          "standard:events"
        ]?.on("change", ({ accounts }) => {
          if (
            accounts &&
            !accounts.some(item => {
              return (
                item.address ===
                state.account?.address
              );
            })
          ) {
            state.epoch++;
            state.account = null;

            invalidate();
            renderAccount();

            notice(
              "Wallet account changed. Reconnect to verify the selected address."
            );
          }
        });

      notice(
        "Wallet connected. Every trade still requires your confirmation."
      );

      renderAccount();
    } finally {
      setBusy(false);
    }

    if (state.account) {
      await loadHoldings();
    }
  }


  function pendingKey() {
    return "ri-trade-pending:" + state.user;
  }


  function loadPending() {
    try {
      state.pending = JSON.parse(
        localStorage.getItem(pendingKey()) || "null"
      );
    } catch {
      state.pending = null;
    }
  }


  function savePending(id, address) {
    state.pending = { id, address };

    try {
      localStorage.setItem(
        pendingKey(),
        JSON.stringify(state.pending)
      );
    } catch {}
  }


  function clearPending() {
    state.pending = null;

    if (state.user) {
      try {
        localStorage.removeItem(pendingKey());
      } catch {}
    }
  }


  async function checkPending() {
    if (!state.pending) return;

    const result = await api("/status", {
      id: state.pending.id
    });

    if (
      ["success", "failed"].includes(result.state)
    ) {
      clearPending();

      notice(
        result.state === "success"
          ? "Previous trade confirmed."
          : "Previous trade failed."
      );

      await loadHoldings();
      return;
    }

    notice(
      "Previous trade: " +
      result.state +
      ". Check your wallet before starting another trade."
    );

    renderAccount();
  }


  function renderAccount() {
    const walletRoot = $("rtWalletRoot");
    const holdingsRoot = $("rtHoldingsRoot");

    if (!walletRoot || !holdingsRoot) return;

    walletRoot.replaceChildren();
    holdingsRoot.replaceChildren();

    holdingsRoot.hidden = !state.user;

    if ($("rtWalletSummary")) {
      $("rtWalletSummary").textContent =
        state.linked
          ? short(state.linked.address) +
            " · Verified"
          : "Not connected";
    }

    walletRoot.append(
      make("h2", "", "Your wallet")
    );

    if (!state.linked) {
      walletRoot.append(
        make(
          "p",
          "rt-muted",
          "Connect and verify your Solana wallet."
        ),

        button(
          "Connect wallet",
          connect,
          "rt-button rt-primary"
        )
      );

      holdingsRoot.hidden = true;
      return;
    }

    const addressBox = make(
      "div",
      "rt-wallet-address"
    );

    addressBox.append(
      make(
        "strong",
        "",
        short(state.linked.address)
      ),

      make("span", "rt-badge", "Verified")
    );

    walletRoot.append(
      addressBox,

      make(
        "p",
        "rt-muted",

        state.linked.wallet_name +
        " · " +
        (
          state.account?.address ===
          state.linked.address
            ? "Connected for trading"
            : "Reconnect to sign trades"
        )
      ),

      button(
        state.account
          ? "Change wallet"
          : "Connect wallet",
        connect
      ),

      make(
        "p",
        "rt-small",
        "Your address is saved. Each trade requires your wallet signature."
      )
    );

    const heading = make("div", "rt-heading");

    heading.append(
      make("h2", "", "My holdings"),

      button(
        state.loading ? "Loading…" : "Refresh",
        loadHoldings
      )
    );

    holdingsRoot.append(
      heading,

      make(
        "p",
        "rt-muted",
        "Tokens in your verified Solana wallet. Values are estimates."
      )
    );

    if (state.pending) {
      const warning = make(
        "div",
        "rt-warning"
      );

      warning.append(
        make(
          "p",
          "",
          "A previous trade needs a status check."
        ),

        button("Check status", checkPending),

        button("I checked my wallet", () => {
          clearPending();
          renderAccount();
          invalidate();
        })
      );

      holdingsRoot.append(warning);
    }

    if (!state.holdings) {
      holdingsRoot.append(
        make(
          "p",
          "rt-muted",

          state.loading
            ? "Loading balances…"
            : "Press Refresh to load your balances."
        )
      );

      return;
    }

    const holdings = state.holdings;
    const summaries = make("div", "rt-summaries");

    let total = 0;
    let unknown = 0;

    for (const token of holdings.tokens) {
      if (token.price === null) {
        unknown++;
      } else {
        total +=
          Number(decimal(token.raw, token.decimals)) *
          token.price;
      }
    }

    summaries.append(
      make(
        "div",
        "rt-summary",

        "SOL balance: " +
        nice(Number(decimal(holdings.solRaw, 9))) +
        " SOL"
      ),

      make(
        "div",
        "rt-summary",
        "Priced tokens: " + dollars(total)
      )
    );

    holdingsRoot.append(summaries);

    if (unknown) {
      holdingsRoot.append(
        make(
          "p",
          "rt-small",

          unknown +
          " token(s) have no available price and are excluded from the total."
        )
      );
    }

    const wrap = make("div", "rt-table-wrap");
    const table = make("table", "rt-table");
    const tableHead = make("thead");
    const headings = make("tr");

    for (const label of [
      "Token",
      "Balance",
      "Price",
      "Value",
      "Actions"
    ]) {
      headings.append(make("th", "", label));
    }

    tableHead.append(headings);
    table.append(tableHead);

    const tableBody = make("tbody");

    const rows = [
      {
        mint: SOL,
        symbol: "SOL",
        name: "Solana",
        raw: holdings.solRaw,
        decimals: 9,
        price: holdings.solPrice
      },

      ...holdings.tokens
    ];

    for (const token of rows) {
      const row = make("tr");
      const nameCell = make("td");

      if (
        token.icon &&
        /^https:\/\//.test(token.icon)
      ) {
        const image = make("img", "rt-token-icon");

        image.src = token.icon;
        image.alt = "";
        image.loading = "lazy";
        image.referrerPolicy = "no-referrer";

        image.addEventListener(
          "error",
          () => image.remove(),
          { once: true }
        );

        nameCell.append(image);
      }

      nameCell.append(
        make("strong", "", token.symbol),
        make("small", "rt-muted", token.name)
      );

      const exactBalance = decimal(
        token.raw,
        token.decimals
      );

      const quantity = Number(exactBalance);

      const balanceCell = make(
        "td",
        "",
        nice(quantity)
      );

      balanceCell.title = exactBalance;

      row.append(
        nameCell,
        balanceCell,

        make(
          "td",
          "",

          token.price === null
            ? "—"
            : new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                maximumSignificantDigits: 5
              }).format(token.price)
        ),

        make(
          "td",
          "",

          token.price === null
            ? "—"
            : dollars(quantity * token.price)
        )
      );

      const actions = make("td", "rt-actions");

      if (token.mint !== SOL) {
        actions.append(
          button(
            "Analyze",
            () => analyze(token.mint)
          ),

          button(
            "Buy more",

            () => openTrade(
              token.mint,
              token.symbol,
              "buy"
            ),

            "rt-button rt-primary"
          ),

          button(
            "Sell",

            () => openTrade(
              token.mint,
              token.symbol,
              "sell"
            ),

            "rt-button rt-sell"
          )
        );
      } else {
        actions.append(
          make(
            "span",
            "rt-muted",
            "Network balance"
          )
        );
      }

      row.append(actions);
      tableBody.append(row);
    }

    table.append(tableBody);
    wrap.append(table);

    holdingsRoot.append(
      wrap,

      make(
        "p",
        "rt-small",

        "Updated " +
        new Date(
          holdings.measuredAt
        ).toLocaleTimeString() +
        ". Trading depends on available routes."
      )
    );
  }


  async function loadHoldings() {
    if (state.loading || !state.linked) return;

    const user = state.user;
    const address = state.linked.address;

    state.loading = true;
    renderAccount();

    try {
      const data = await api("/holdings");

      if (
        user !== state.user ||
        address !== state.linked?.address
      ) {
        return;
      }

      state.holdings = data;
      renderAccount();

      if (!data.pricesAvailable) {
        notice(
          "Balances loaded; token prices are temporarily unavailable."
        );
      }
    } finally {
      state.loading = false;
      renderAccount();
    }
  }


  function analyze(mint) {
    location.hash = "scanner";

    const input = $("contractInput");

    if (input) {
      input.value = mint;
    }

    if (typeof analyzeToken === "function") {
      void analyzeToken(mint);
    }
  }


  function updateTrade(view) {
    view.buy.classList.toggle(
      "rt-selected",
      view.side === "buy"
    );

    view.sell.classList.toggle(
      "rt-selected",
      view.side === "sell"
    );

    view.label.textContent =
      view.side === "buy"
        ? "You pay · SOL"
        : "You sell · " + view.symbol;

    view.receive.textContent =
      view.side === "buy"
        ? "You receive · " + view.symbol
        : "You receive · SOL";

    const connected =
      !!state.linked &&
      state.account?.address ===
        state.linked.address;

    view.primary.textContent =
      state.busy
        ? "Please wait…"
        : !state.user
          ? "Sign in"
          : !connected
            ? "Connect wallet"
            : view.order
              ? "Confirm in wallet"
              : "Get quote";

    view.primary.disabled =
      state.busy || !!state.pending;

    for (const element of [
      view.buy,
      view.sell,
      view.amount,
      view.slip,
      ...view.presets.children
    ]) {
      element.disabled = state.busy;
    }

    view.title.textContent =
      "Trade " + view.symbol;
  }


  function tradeView(
    mint,
    symbol,
    side = "buy"
  ) {
    const view = {
      mint,
      symbol,
      side,
      order: null
    };

    view.root = make(
      "section",
      "rt-card rt-trade"
    );

    const heading = make("div", "rt-heading");

    view.title = make(
      "h3",
      "",
      "Trade " + symbol
    );

    heading.append(
      view.title,

      make(
        "span",
        "rt-small",
        "Powered by Jupiter"
      )
    );

    view.root.append(heading);

    const grid = make("div", "rt-trade-grid");
    const tabs = make("div", "rt-tabs");

    view.buy = button(
      "Buy",
      () => switchSide("buy")
    );

    view.sell = button(
      "Sell",
      () => switchSide("sell")
    );

    tabs.append(view.buy, view.sell);

    const pay = make("label", "rt-field");

    view.label = make("span", "rt-small");
    view.amount = make("input");

    view.amount.type = "text";
    view.amount.inputMode = "decimal";
    view.amount.placeholder = "Enter amount";
    view.amount.autocomplete = "off";

    view.amount.setAttribute(
      "aria-label",
      "Trade amount"
    );

    pay.append(view.label, view.amount);

    view.presets = make("div", "rt-presets");

    const payWrap = make("div");

    payWrap.append(pay, view.presets);

    const output = make("div", "rt-field");

    view.receive = make("span", "rt-small");
    view.output = make("strong", "", "—");

    output.append(
      view.receive,
      view.output
    );

    view.primary = button(
      "Connect wallet",
      () => tradeAction(view),
      "rt-button rt-primary"
    );

    grid.append(
      tabs,
      payWrap,
      make("span", "rt-arrow", "→"),
      output,
      view.primary
    );

    view.root.append(grid);

    const settings = make("div", "rt-settings");

    const slippageLabel = make(
      "label",
      "rt-small",
      "Slippage "
    );

    view.slip = make("select");

    for (const [label, value] of [
      ["0.5%", 50],
      ["1%", 100],
      ["3%", 300],
      ["5%", 500],
      ["10%", 1000],
      ["15%", 1500]
    ]) {
      const option = make("option", "", label);
      option.value = value;
      view.slip.append(option);
    }

    view.slip.value = "100";

    slippageLabel.append(view.slip);

    settings.append(
      slippageLabel,

      make(
        "span",
        "rt-small",
        "Each trade requires confirmation in your wallet."
      )
    );

    view.root.append(settings);

    view.review = make("div", "rt-review");
    view.review.hidden = true;

    view.status = make("p", "rt-status");
    view.status.setAttribute("role", "status");

    view.root.append(
      view.review,
      view.status
    );

    function invalidateView() {
      view.order = null;
      view.review.hidden = true;
      view.output.textContent = "—";
      view.status.textContent = "";

      updateTrade(view);
    }

    function switchSide(next) {
      if (state.busy) return;

      view.side = next;
      view.amount.value = "";

      invalidateView();
      renderPresets();
    }

    function renderPresets() {
      view.presets.replaceChildren();

      const values =
        view.side === "buy"
          ? [0.1, 0.5, 1]
          : [25, 50, 100];

      for (const value of values) {
        view.presets.append(
          button(
            view.side === "buy"
              ? value + " SOL"
              : value + "%",

            () => {
              if (view.side === "buy") {
                view.amount.value = String(value);
              } else {
                const token =
                  state.holdings?.tokens.find(item => {
                    return item.mint === view.mint;
                  });

                if (!token) {
                  throw new Error(
                    "Load your holdings in My account first."
                  );
                }

                const amount =
                  BigInt(token.spendableRaw) *
                  BigInt(value) /
                  100n;

                view.amount.value = decimal(
                  amount,
                  token.decimals
                );
              }

              invalidateView();
            }
          )
        );
      }
    }

    view.amount.addEventListener(
      "input",
      invalidateView
    );

    view.slip.addEventListener(
      "change",
      invalidateView
    );

    renderPresets();
    updateTrade(view);

    return view;
  }


  function closeTrade() {
    const dialog = $("rtTradeDialog");

    if (dialog && state.busy) return;

    if (dialog) {
      dialog.close();
      dialog.remove();
    }

    state.active = state.scanner;
  }


  function openTrade(
    mint,
    symbol,
    side = "buy"
  ) {
    if (state.busy) return;

    if (
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)
    ) {
      throw new Error("Invalid token address.");
    }

    closeTrade();

    const dialog = make("dialog", "rt-dialog");
    dialog.id = "rtTradeDialog";

    const content = make("div", "rt-dialog-body");

    content.append(
      button("Close", closeTrade)
    );

    const view = tradeView(
      mint,
      symbol || "TOKEN",
      side
    );

    state.active = view;

    content.append(view.root);
    dialog.append(content);

    dialog.addEventListener("cancel", event => {
      if (state.busy) {
        event.preventDefault();
      } else {
        state.active = state.scanner;

        setTimeout(() => {
          dialog.remove();
        }, 0);
      }
    });

    document.body.append(dialog);
    dialog.showModal();
  }


  async function tradeAction(view) {
    if (state.busy || state.pending) return;

    if (!state.user) {
      location.hash = "account";
      closeTrade();
      notice("Sign in to trade.");
      return;
    }

    state.active = view;

    if (
      !state.account ||
      state.account.address !==
        state.linked?.address
    ) {
      await connect();
      return;
    }

    setBusy(true);

    const epoch = state.epoch;
    const address = state.linked.address;

    try {
      if (!view.order) {
        const amount = view.amount.value
          .trim()
          .replace(",", ".");

        if (
          !/^\d+(\.\d+)?$/.test(amount) ||
          Number(amount) <= 0
        ) {
          throw new Error(
            "Enter the amount you want to trade."
          );
        }

        view.amount.value = amount;
        view.status.textContent =
          "Getting a live quote…";

        const quote = await api("/order", {
          mint: view.mint,
          side: view.side,
          amount,

          slippageBps: Number(
            view.slip.value
          )
        });

        assertContext(epoch, address);

        const typedAmount = rawInput(
          amount,
          quote.inputDecimals
        );

        if (
          quote.address !== address ||
          quote.mint !== view.mint ||
          quote.side !== view.side ||
          typedAmount.toString() !==
            quote.inputRaw
        ) {
          throw new Error(
            "Quote does not match this trade."
          );
        }

        view.order = quote;

        view.output.textContent = nice(
          Number(
            decimal(
              quote.outputRaw,
              quote.outputDecimals
            )
          )
        );

        view.review.replaceChildren();

        const outputSymbol =
          view.side === "buy"
            ? view.symbol
            : "SOL";

        view.review.append(
          make(
            "p",
            "",

            "Minimum received: " +
            decimal(
              quote.minimumRaw,
              quote.outputDecimals
            ) +
            " " +
            outputSymbol
          ),

          make(
            "p",
            "",

            "Swap fee: " +
            (quote.feeBps / 100).toFixed(2) +
            "% (included in quote)"
          )
        );

        for (const [label, value] of [
          [
            "Network signature fee",
            quote.signatureFeeLamports
          ],
          [
            "Priority fee",
            quote.priorityFeeLamports
          ],
          [
            "Token account rent",
            quote.rentFeeLamports
          ]
        ]) {
          view.review.append(
            make(
              "p",
              "rt-small",

              label +
              ": " +
              (
                value === null
                  ? "See wallet confirmation"
                  : decimal(String(value), 9) +
                    " SOL"
              )
            )
          );
        }

        view.review.append(
          make(
            "p",
            "rt-small",
            "Quote expires shortly. Review the token, amount and fees in your wallet."
          )
        );

        view.review.hidden = false;

        view.status.textContent =
          "Review the quote, then press Confirm in wallet.";

        return;
      }

      const quote = view.order;

      if (
        Date.now() >
        Date.parse(quote.expiresAt) - 3000
      ) {
        view.order = null;
        view.review.hidden = true;

        throw new Error(
          "Quote expired. Press Get quote again."
        );
      }

      assertContext(epoch, address);

      view.status.textContent =
        "Confirm the transaction in your wallet…";

      const [{ signedTransaction }] =
        await state.wallet.features[
          "solana:signTransaction"
        ].signTransaction({
          account: state.account,
          chain: CHAIN,
          transaction: fromBase64(
            quote.transaction
          )
        });

      assertContext(epoch, address);

      if (
        Date.now() > Date.parse(quote.expiresAt)
      ) {
        view.order = null;

        throw new Error(
          "Quote expired while signing. Get a new quote."
        );
      }

      savePending(quote.id, address);

      view.order = null;
      view.status.textContent =
        "Submitting your signed trade…";

      const result = await api("/execute", {
        id: quote.id,

        signedTransaction: base64(
          signedTransaction
        )
      });

      if (
        epoch !== state.epoch ||
        state.user === null
      ) {
        return;
      }

      view.review.replaceChildren();
      view.review.hidden = false;

      const signature =
        result.result?.signature;

      if (
        signature &&
        /^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(signature)
      ) {
        const link = make(
          "a",
          "rt-link",
          "View transaction on Solscan"
        );

        link.href =
          "https://solscan.io/tx/" + signature;

        link.target = "_blank";
        link.rel = "noopener noreferrer";

        view.review.append(link);
      }

      if (result.state === "success") {
        clearPending();

        view.status.textContent =
          "Trade confirmed.";

        await loadHoldings();
      } else if (result.state === "failed") {
        clearPending();

        view.status.textContent =
          "Trade failed. Check your wallet for any network fees.";
      } else {
        view.status.textContent =
          "Submission status is uncertain. Check your wallet before another trade.";

        renderAccount();
      }
    } catch (error) {
      if (state.pending) {
        view.status.textContent =
          "Check the previous trade in My account before trying again.";

        renderAccount();
      }

      throw error;
    } finally {
      setBusy(false);
    }
  }


  function mountScanner(contract) {
    const anchor = $("riTokenContext");

    if (!anchor) return;

    const symbol = (
      $("tokenSymbol")?.textContent || "TOKEN"
    ).replace(/^\$/, "");

    if (state.scanner?.mint === contract) {
      state.scanner.symbol = symbol;
      updateTrade(state.scanner);
      return;
    }

    const view = tradeView(
      contract,
      symbol
    );

    state.scanner?.root.remove();

    anchor.before(view.root);

    state.scanner = view;

    if (!$("rtTradeDialog")) {
      state.active = view;
    }
  }


  async function sync() {
    const serial = ++sessionSerial;
    const accountClient = client();

    if (!accountClient) return;

    const { data } =
      await accountClient.auth.getSession();

    if (serial !== sessionSerial) return;

    const user =
      data.session?.user.id || null;

    if (user === state.user) return;

    state.epoch++;

    disconnectLocal();

    state.user = user;
    state.linked = null;
    state.holdings = null;
    state.pending = null;

    invalidate();
    renderAccount();

    if (!user) return;

    loadPending();

    const epoch = state.epoch;

    try {
      const result = await api("/wallet");

      if (epoch !== state.epoch) return;

      state.linked = result.wallet;

      renderAccount();

      if (
        state.linked &&
        location.hash === "#account"
      ) {
        await loadHoldings();
      }
    } catch (error) {
      notice(error.message);
    }
  }


  function init() {
    if (window.RI_TRADING) return;

    window.RI_TRADING = {
      open: openTrade,
      connect
    };

    const toast = make("div", "rt-notice");

    toast.id = "rtNotice";
    toast.setAttribute("role", "status");

    document.body.append(toast);

    renderAccount();

    document.addEventListener(
      "ri:token-context",
      event => {
        if (event.detail?.ca) {
          mountScanner(event.detail.ca);
        }
      }
    );

    document.addEventListener(
      "ri:account-change",
      () => {
        void guard(sync);
      }
    );

    window.addEventListener(
      "hashchange",
      () => {
        if (location.hash === "#account") {
          void guard(async () => {
            await sync();
            await loadHoldings();
          });
        }
      }
    );

    let authAttached = false;

    const timer = setInterval(() => {
      if (client() && !authAttached) {
        authAttached = true;

        clearInterval(timer);

        client().auth.onAuthStateChange(() => {
          setTimeout(() => {
            void guard(sync);
          }, 0);
        });

        void guard(sync);
      }
    }, 300);

    document.addEventListener(
      "visibilitychange",
      () => {
        if (
          !document.hidden &&
          location.hash === "#account"
        ) {
          void guard(loadHoldings);
        }
      }
    );

    window.addEventListener(
      "storage",
      event => {
        if (event.key === pendingKey()) {
          loadPending();
          invalidate();
          renderAccount();
        }
      }
    );

    const contract =
      $("tokenContract")?.textContent?.trim();

    if (
      contract &&
      /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(contract)
    ) {
      mountScanner(contract);
    }

    setInterval(() => {
      const view = state.active;

      if (
        view?.order &&
        Date.now() >
          Date.parse(view.order.expiresAt)
      ) {
        view.order = null;
        view.review.hidden = true;
        view.output.textContent = "—";

        view.status.textContent =
          "Quote expired. Get a new quote.";

        updateTrade(view);
      }
    }, 1000);
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