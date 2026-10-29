(() => {
  "use strict";

  const API =
    "https://bagvyr-api.megafunhousetv.workers.dev";

  const ADDRESS =
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  const cache = new Map();

  let adsJob = null;
  let adsUntil = 0;

  async function getJSON(path) {
    const response = await fetch(API + path, {
      signal: AbortSignal.timeout(12000)
    });

    if (!response.ok) {
      throw new Error("Suggestions unavailable");
    }

    const data = await response.json();

    if (data?.success !== true) {
      throw new Error("Invalid response");
    }

    return data;
  }

  function loadAds() {
    if (!adsJob || adsUntil <= Date.now()) {
      adsUntil = Date.now() + 120000;

      adsJob = getJSON("/api/trending")
        .then(data =>
          Array.isArray(data.ads) ? data.ads : []
        )
        .catch(() => []);
    }

    return adsJob;
  }

  function combine(items, ads, query) {
    const slots = Array(5).fill(null);
    const seen = new Set();
    const text = query.toLowerCase();

    for (const ad of ads) {
      const slot = Number(ad.slot);
      const mc = Number(ad.market_cap_usd);

      const matches =
        !text ||
        String(ad.name || "")
          .toLowerCase().includes(text) ||
        String(ad.symbol || "")
          .toLowerCase().includes(text) ||
        ad.contract === query;

      if (
        ![1, 2, 3].includes(slot) ||
        !ADDRESS.test(ad.contract || "") ||
        !Number.isFinite(mc) ||
        mc < 50000 ||
        !matches ||
        !(Date.parse(ad.expires_at) > Date.now()) ||
        slots[slot - 1] ||
        seen.has(ad.contract)
      ) {
        continue;
      }

      slots[slot - 1] = {
        ...ad,
        sponsored: true
      };

      seen.add(ad.contract);
    }

    for (const item of items) {
      if (
        !ADDRESS.test(item.contract || "") ||
        seen.has(item.contract)
      ) {
        continue;
      }

      const index = slots.indexOf(null);

      if (index < 0) break;

      slots[index] = {
        ...item,
        sponsored: false
      };

      seen.add(item.contract);
    }

    return slots.filter(Boolean);
  }

  function search(query) {
    const key = query.toLowerCase();
    const saved = cache.get(key);

    if (saved && saved.until > Date.now()) {
      return saved.promise;
    }

    const promise = Promise.all([
      getJSON(
        "/api/token-suggestions?q=" +
          encodeURIComponent(query)
      ),
      loadAds()
    ]).then(([data, ads]) =>
      combine(
        Array.isArray(data.items) ? data.items : [],
        ads,
        query
      )
    );

    if (cache.size >= 100) {
      cache.delete(cache.keys().next().value);
    }

    cache.set(key, {
      promise,
      until: Date.now() + 15000
    });

    promise.catch(() => cache.delete(key));

    return promise;
  }

  const style = document.createElement("style");

  style.textContent = `
    .ri-suggest {
      margin-top: 12px;
      padding: 12px;
      background: #061b15;
      border: 1px solid #1e654d;
      border-radius: 16px;
      text-align: left;
    }

    .ri-suggest[hidden] {
      display: none !important;
    }

    .ri-suggest-note {
      margin: 0 0 8px;
      color: #9bb9ad;
      font-size: 12px;
    }

    .ri-suggest-row {
      display: flex;
      align-items: center;
      gap: 11px;
      width: 100%;
      padding: 10px;
      border: 0;
      border-radius: 10px;
      background: transparent;
      color: #ecfff6;
      text-align: left;
      cursor: pointer;
      font: inherit;
    }

    .ri-suggest-row:hover,
    .ri-suggest-row[aria-selected="true"] {
      background: #123c2c;
    }

    .ri-suggest-icon {
      display: grid;
      place-items: center;
      flex: 0 0 36px;
      height: 36px;
      border-radius: 50%;
      background: #174432;
      overflow: hidden;
    }

    .ri-suggest-icon img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .ri-suggest-info {
      display: flex;
      flex: 1;
      min-width: 0;
      flex-direction: column;
      gap: 3px;
    }

    .ri-suggest-info strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .ri-suggest-info small {
      color: #a8c7b8;
      font-size: 11px;
      overflow-wrap: anywhere;
    }

    .ri-suggest-ad {
      font-size: 10px;
      color: #f4d78d;
      border: 1px solid #665a32;
      padding: 4px 6px;
      border-radius: 6px;
    }
  `;

  document.head.append(style);

  function setup(input, host, submit) {
    if (!input || !host) return;

    input.placeholder =
      "Enter a Solana CA, token name or ticker";

    input.setAttribute(
      "aria-label",
      input.placeholder
    );

    input.maxLength = 80;
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");

    const panel = document.createElement("div");

    panel.className = "ri-suggest";
    panel.id = input.id + "Suggestions";
    panel.hidden = true;

    input.setAttribute(
      "aria-controls",
      panel.id + "List"
    );

    host.append(panel);

    let version = 0;
    let timer;
    let rows = [];
    let selected = -1;

    function close() {
      version++;
      clearTimeout(timer);
      panel.hidden = true;

      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
    }

    function choose(row) {
      close();

      input.value = row.contract;
      input.setCustomValidity("");

      input.dispatchEvent(
        new Event("input", { bubbles: true })
      );

      submit();
    }

    function highlight() {
      const buttons = panel.querySelectorAll(
        "[role=option]"
      );

      buttons.forEach((button, index) => {
        button.setAttribute(
          "aria-selected",
          String(index === selected)
        );
      });

      if (selected >= 0 && buttons[selected]) {
        input.setAttribute(
          "aria-activedescendant",
          buttons[selected].id
        );
      } else {
        input.removeAttribute(
          "aria-activedescendant"
        );
      }
    }

    function render(message, items = []) {
      panel.replaceChildren();

      rows = items;
      selected = -1;

      input.removeAttribute(
        "aria-activedescendant"
      );

      const note = document.createElement("p");

      note.className = "ri-suggest-note";
      note.textContent = message;
      panel.append(note);

      const list = document.createElement("div");

      list.id = panel.id + "List";
      list.setAttribute("role", "listbox");
      list.setAttribute(
        "aria-label",
        "Token suggestions"
      );

      items.forEach((row, index) => {
        const button = document.createElement(
          "button"
        );

        button.type = "button";
        button.className = "ri-suggest-row";
        button.id = panel.id + "Option" + index;
        button.setAttribute("role", "option");
        button.setAttribute(
          "aria-selected",
          "false"
        );

        const icon = document.createElement("span");

        icon.className = "ri-suggest-icon";
        icon.textContent = String(
          row.symbol || row.name || "?"
        ).slice(0, 2);

        try {
          const url = new URL(row.image_url);

          if (
            url.protocol === "https:" &&
            !url.username &&
            !url.password
          ) {
            const image = document.createElement(
              "img"
            );

            image.alt = "";
            image.referrerPolicy = "no-referrer";

            image.onload = () => {
              icon.replaceChildren(image);
            };

            image.src = url.href;
          }
        } catch {}

        const info = document.createElement("span");

        info.className = "ri-suggest-info";

        const name = document.createElement(
          "strong"
        );

        name.textContent =
          row.name || row.symbol || "Token";

        const details = document.createElement(
          "small"
        );

        details.textContent =
          (row.symbol ? row.symbol + " · " : "") +
          row.contract.slice(0, 6) +
          "…" +
          row.contract.slice(-6);

        info.append(name, details);
        button.append(icon, info);

        if (row.sponsored) {
          const badge = document.createElement(
            "span"
          );

          badge.className = "ri-suggest-ad";
          badge.textContent = "Sponsored";

          button.append(badge);
        }

        button.addEventListener(
          "click",
          () => choose(row)
        );

        list.append(button);
      });

      panel.append(list);
      panel.hidden = false;

      input.setAttribute("aria-expanded", "true");
    }

    async function load() {
      const query = input.value.trim();

      if (ADDRESS.test(query)) {
        close();
        return;
      }

      const current = ++version;

      render("Loading token suggestions…");

      try {
        const items = await search(query);

        if (current !== version) return;

        render(
          items.length
            ? "Select a token to analyze"
            : "No saved tokens found. You can paste a Solana CA instead.",
          items
        );

      } catch {
        if (current === version) {
          render(
            "Suggestions are unavailable. You can still paste a Solana CA."
          );
        }
      }
    }

    input.addEventListener("focus", load);

    input.addEventListener("click", () => {
      if (panel.hidden) load();
    });

    input.addEventListener("input", () => {
      close();
      input.setCustomValidity("");

      if (
        document.activeElement === input &&
        !ADDRESS.test(input.value.trim())
      ) {
        timer = setTimeout(load, 300);
      }
    });

    input.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        close();
        return;
      }

      if (
        !panel.hidden &&
        ["ArrowDown", "ArrowUp"].includes(
          event.key
        )
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (rows.length) {
          selected = (
            selected +
            (event.key === "ArrowDown" ? 1 : -1) +
            rows.length
          ) % rows.length;

          highlight();
        }
      }

      if (
        event.key === "Enter" &&
        !ADDRESS.test(input.value.trim())
      ) {
        event.preventDefault();
        event.stopImmediatePropagation();

        if (!panel.hidden && selected >= 0) {
          choose(rows[selected]);
        } else {
          load();
        }
      }
    }, true);

    function intercept(event) {
      if (ADDRESS.test(input.value.trim())) {
        close();
        return;
      }

      event.preventDefault();
      event.stopImmediatePropagation();

      input.focus();
      load();
    }

    if (input.id === "riHomeContract") {
      input.form.addEventListener(
        "submit",
        intercept,
        true
      );
    } else {
      document.getElementById("analyzeButton")
        ?.addEventListener(
          "click",
          intercept,
          true
        );
    }

    document.addEventListener(
      "pointerdown",
      event => {
        if (
          event.target !== input &&
          !panel.contains(event.target)
        ) {
          close();
        }
      }
    );

    host.addEventListener("focusout", () => {
      setTimeout(() => {
        if (
          document.activeElement !== input &&
          !panel.contains(document.activeElement)
        ) {
          close();
        }
      }, 0);
    });

    window.addEventListener("hashchange", close);
  }

  function init() {
    const home = document.getElementById(
      "riHomeContract"
    );

    setup(
      home,
      home?.form?.parentElement,
      () => home.form.requestSubmit()
    );

    const scanner = document.getElementById(
      "contractInput"
    );

    setup(
      scanner,
      scanner?.closest(".scanner-box"),
      () => {
        document.getElementById(
          "analyzeButton"
        )?.click();
      }
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init
    );
  } else {
    init();
  }
})();