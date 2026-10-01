(() => {
  "use strict";

  const root = document.getElementById("trendingAdminRoot");
  if (!root) return;

  const API =
    "https://bagvyr-api.megafunhousetv.workers.dev";

  let client;
  let started = false;
  let generation = 0;

  const style = document.createElement("style");
  style.textContent = `
    #trendingAdminRoot .ta-card {
      padding: 20px;
      margin-bottom: 18px;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 14px;
      background: rgba(255,255,255,.03);
    }
    #trendingAdminRoot .ta-form {
      display: grid;
      gap: 12px;
    }
    #trendingAdminRoot label {
      display: grid;
      gap: 6px;
    }
    #trendingAdminRoot input,
    #trendingAdminRoot select,
    #trendingAdminRoot button {
      font: inherit;
      padding: 11px;
      border-radius: 9px;
      border: 1px solid rgba(255,255,255,.2);
      background: #101b16;
      color: #fff;
    }
    #trendingAdminRoot button {
      cursor: pointer;
      color: #55efa0;
    }
    #trendingAdminRoot button:disabled {
      opacity: .5;
      cursor: wait;
    }
    #trendingAdminRoot .ta-row {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 14px 0;
      border-bottom: 1px solid rgba(255,255,255,.1);
    }
    #trendingAdminRoot .ta-detail {
      overflow-wrap: anywhere;
      font-size: 12px;
      opacity: .7;
      margin-top: 5px;
    }
    #trendingAdminRoot .ta-status {
      margin: 12px 0;
      overflow-wrap: anywhere;
    }
  `;
  document.head.appendChild(style);

  function node(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }

  function field(label, input) {
    const wrapper = node("label", label);
    wrapper.append(input);
    return wrapper;
  }

  function input(type, value = "") {
    const el = node("input");
    el.type = type;
    el.value = value;
    el.required = true;
    return el;
  }

  function select(options) {
    const el = node("select");
    for (const [value, label] of options) {
      const option = node("option", label);
      option.value = value;
      el.append(option);
    }
    return el;
  }

  function check(result) {
    if (result.error) throw new Error(result.error.message);
    return result.data;
  }

  async function requireAdmin() {
    const session = check(await client.auth.getSession());
    if (!session.session) {
      throw new Error("Sign in to manage trending.");
    }

    const allowed = check(
      await client.rpc("ruginspect_is_admin")
    );

    if (allowed !== true) {
      throw new Error("Administrator access required.");
    }
  }

  async function metadata(contract) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
      const response = await fetch(
        `${API}/api/trending-metrics?ca=${encodeURIComponent(contract)}`,
        { signal: controller.signal, cache: "no-store" }
      );

      if (!response.ok) {
        throw new Error("Unable to load token information.");
      }

      const result = await response.json();

      if (result.success !== true || result.contract !== contract) {
        throw new Error("Unable to verify this Pump.fun token.");
      }

      return {
        name: result.name || null,
        symbol: result.symbol || null,
        image_url: result.image_url || null
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  function buildForm(kind, status, reload) {
    const card = node("div", undefined, "ta-card");
    card.append(
      node(
        "h3",
        kind === "placement"
          ? "Add Featured Token"
          : "Set Advertisement"
      )
    );

    const form = node("form", undefined, "ta-form");
    const contract = input("text");
    contract.placeholder = "Solana token contract address";
    contract.maxLength = 44;

    const minutes = input("number", "60");
    minutes.min = "1";
    minutes.max = "525600";
    minutes.step = "1";

    const target = kind === "placement"
      ? select([
          ["trending", "Trending"],
          ["new_coins", "New Coins"]
        ])
      : select([
          ["1", "Advertisement 1"],
          ["2", "Advertisement 2"],
          ["3", "Advertisement 3"]
        ]);

    const button = node(
      "button",
      kind === "placement" ? "Add Featured Token" : "Save Advertisement"
    );
    button.type = "submit";

    form.append(
      field("Contract Address", contract),
      field(kind === "placement" ? "List" : "Advertisement Slot", target),
      field("Duration in minutes", minutes),
      button
    );

    form.addEventListener("submit", async event => {
      event.preventDefault();

      const ca = contract.value.trim();
      const duration = Number(minutes.value);

      if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca)) {
        status.textContent = "Enter a valid Solana contract address.";
        return;
      }

      if (
        !Number.isSafeInteger(duration) ||
        duration < 1 ||
        duration > 525600
      ) {
        status.textContent = "Enter a whole number of minutes from 1 to 525600.";
        return;
      }

      button.disabled = true;

      try {
        await requireAdmin();
        status.textContent = "Loading token information…";

        const details = await metadata(ca);

        // Čas začne plynúť až po načítaní údajov.
        const now = Date.now();
        const startsAt = new Date(now).toISOString();
        const expiresAt = new Date(
          now + duration * 60000
        ).toISOString();

        const row = {
          contract: ca,
          ...details,
          duration_minutes: duration,
          starts_at: startsAt,
          expires_at: expiresAt,
          enabled: true
        };

        if (kind === "placement") {
          row.board = target.value;

          check(
            await client
              .from("ruginspect_trending_placements")
              .upsert(row, { onConflict: "board,contract" })
          );
        } else {
          row.slot = Number(target.value);
          row.updated_at = startsAt;

          check(
            await client
              .from("ruginspect_trending_ads")
              .upsert(row, { onConflict: "slot" })
          );
        }

        contract.value = "";
        status.textContent = "Saved successfully.";
        await reload();
      } catch (error) {
        status.textContent = error.message || "Unable to save.";
      } finally {
        button.disabled = false;
      }
    });

    card.append(form);
    return card;
  }

  async function renderPanel() {
    const currentGeneration = ++generation;
    root.replaceChildren();

    try {
      await requireAdmin();
      if (currentGeneration !== generation) return;
    } catch (error) {
      if (currentGeneration === generation) {
        root.append(node("p", error.message, "ta-status"));
      }
      return;
    }

    const status = node("p", "", "ta-status");
    const placementsList = node("div", undefined, "ta-card");
    const adsList = node("div", undefined, "ta-card");

    async function reload() {
      const [placementsResult, adsResult] = await Promise.all([
        client
          .from("ruginspect_trending_placements")
          .select("*")
          .order("created_at", { ascending: false }),
        client
          .from("ruginspect_trending_ads")
          .select("*")
          .order("slot")
      ]);

      const placements = check(placementsResult);
      const ads = check(adsResult);

      if (currentGeneration !== generation) return;

      drawList(
        placementsList,
        "Featured Tokens",
        placements,
        "ruginspect_trending_placements"
      );

      drawList(
        adsList,
        "Advertisements",
        ads,
        "ruginspect_trending_ads"
      );
    }

    function drawList(container, title, rows, table) {
      container.replaceChildren(node("h3", title));

      if (!rows.length) {
        container.append(node("p", "No entries yet."));
        return;
      }

      for (const item of rows) {
        const row = node("div", undefined, "ta-row");
        const details = node("div");
        const expiry = Date.parse(item.expires_at);
        const starts = Date.parse(item.starts_at);

        const active =
          item.enabled &&
          starts <= Date.now() &&
          expiry > Date.now();

        const location = table.endsWith("_ads")
          ? `Advertisement ${item.slot}`
          : item.board === "trending" ? "Trending" : "New Coins";

        details.append(
          node("strong", `${item.name || item.contract} · ${location}`),
          node("div", item.contract, "ta-detail"),
          node(
            "div",
            `${active ? "Active" : "Inactive"} · Ends ${
              Number.isFinite(expiry)
                ? new Date(expiry).toLocaleString()
                : "—"
            }`,
            "ta-detail"
          )
        );

        const remove = node("button", "Remove");
        remove.type = "button";

        remove.addEventListener("click", async () => {
          remove.disabled = true;

          try {
            await requireAdmin();

            const key = table.endsWith("_ads") ? "slot" : "id";

            check(
              await client
                .from(table)
                .delete()
                .eq(key, item[key])
            );

            status.textContent = "Removed successfully.";
            await reload();
          } catch (error) {
            status.textContent = error.message || "Unable to remove.";
            remove.disabled = false;
          }
        });

        row.append(details, remove);
        container.append(row);
      }
    }

    const refresh = node("button", "Refresh entries");
    refresh.type = "button";
    refresh.addEventListener("click", async () => {
      refresh.disabled = true;
      try {
        await requireAdmin();
        await reload();
        status.textContent = "Entries refreshed.";
      } catch (error) {
        status.textContent = error.message;
      } finally {
        refresh.disabled = false;
      }
    });

    root.append(
      status,
      buildForm("placement", status, reload),
      buildForm("ad", status, reload),
      refresh,
      placementsList,
      adsList
    );

    try {
      await reload();
    } catch (error) {
      status.textContent = error.message || "Unable to load entries.";
    }
  }

  function start() {
    if (started || !window.BAGVYR_ADMIN_CLIENT) return;
    started = true;
    client = window.BAGVYR_ADMIN_CLIENT;

    client.auth.onAuthStateChange(() => {
      // Databázové volania vykonáme mimo auth callbacku.
      setTimeout(renderPanel, 0);
    });

    renderPanel();
  }

  window.addEventListener("bagvyr-admin-ready", start);
  start();
})();