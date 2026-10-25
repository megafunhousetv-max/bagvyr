(() => {
  "use strict";

  const validCA = value =>
    typeof value === "string" &&
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value);

  const text = (value, max) =>
    typeof value === "string"
      ? value.trim().slice(0, max)
      : "";

  const imageURL = value => {
    try {
      const url = new URL(value);

      return url.protocol === "https:"
        ? url.href
        : "";
    } catch {
      return "";
    }
  };

  let owner = "";
  let version = 0;
  let allowed = false;
  let items = [];
  let attached = false;
  let loading = null;
  let queue = Promise.resolve();
  let revision = 0;

  const requests = new Set();

  const client = () => window.RI_ACCOUNT_CLIENT;
  const config = () => window.BAGVYR_SUPABASE;

  function reset(next = "") {
    owner = next;
    version++;
    revision++;
    allowed = false;
    items = [];
    loading = null;

    for (const controller of requests) {
      controller.abort();
    }

    requests.clear();
    render();
  }

  async function rpc(session, entry = null) {
    const controller = new AbortController();

    requests.add(controller);

    const timer = setTimeout(
      () => controller.abort(),
      8000
    );

    try {
      const response = await fetch(
        config().url.replace(/\/+$/, "") +
          "/rest/v1/rpc/ri_recent_searches",
        {
          method: "POST",
          signal: controller.signal,
          cache: "no-store",

          headers: {
            "Content-Type": "application/json",
            apikey: config().publishableKey,
            Authorization:
              "Bearer " + session.access_token
          },

          body: JSON.stringify({
            p_entry: entry
          })
        }
      );

      if (!response.ok) {
        throw new Error("History unavailable");
      }

      const data = await response.json();

      if (!Array.isArray(data?.items)) {
        throw new Error("Invalid history");
      }

      return data.items
        .filter(row => validCA(row.contract))
        .slice(0, 5);
    } finally {
      clearTimeout(timer);
      requests.delete(controller);
    }
  }

  async function refresh() {
    if (!client() || !config()) return;

    const { data, error } =
      await client().auth.getSession();

    const session = data?.session;

    if (error || !session) {
      if (owner || allowed) reset();
      return;
    }

    if (owner !== session.user.id) {
      reset(session.user.id);
    }

    if (loading) return loading;

    const current = version;
    const readRevision = revision;

    const job = (async () => {
      try {
        const rows = await rpc(session);

        if (
          version !== current ||
          revision !== readRevision
        ) {
          return;
        }

        items = rows;
        allowed = true;
        render();
      } catch {
        if (
          version === current &&
          revision === readRevision
        ) {
          allowed = false;
          items = [];
          render();
        }
      } finally {
        if (loading === job) {
          loading = null;
        }
      }
    })();

    loading = job;

    return job;
  }

  async function record(contract, data = {}) {
    if (
      !validCA(contract) ||
      !client() ||
      !config()
    ) {
      return;
    }

    const initialVersion = version;

    const { data: auth, error } =
      await client().auth.getSession();

    const session = auth?.session;

    if (
      error ||
      !session ||
      version !== initialVersion
    ) {
      return;
    }

    if (owner !== session.user.id) {
      reset(session.user.id);
    }

    const current = version;
    const token = data.token || {};

    const rawScore =
      typeof data.score === "number"
        ? data.score
        : data.score?.score ??
          data.score?.value ??
          data.scoreValue;

    const score =
      typeof rawScore === "number" &&
      Number.isFinite(rawScore) &&
      rawScore >= 0 &&
      rawScore <= 100
        ? Math.round(rawScore)
        : null;

    const entry = {
      contract,

      name: text(
        token.name ||
          data.name ||
          data.metadata?.name,
        100
      ),

      symbol: text(
        token.symbol ||
          data.symbol ||
          data.metadata?.symbol,
        30
      ).replace(/^\$/, ""),

      image:
        [
          data.pumpfun?.image,
          token.image,
          data.metadata?.image,
          data.metadata?.content?.links?.image,
          data.content?.links?.image,
          data.market?.image,
          data.market?.imageUrl,
          data.image,
          data.logo
        ]
          .map(imageURL)
          .find(Boolean) || "",

      score
    };

    const work = async () => {
      if (
        version !== current ||
        owner !== session.user.id
      ) {
        return;
      }

      const latest =
        await client().auth.getSession();

      if (
        version !== current ||
        latest.data?.session?.user.id !==
          session.user.id
      ) {
        return;
      }

      revision++;

      try {
        const rows = await rpc(
          latest.data.session,
          entry
        );

        if (version !== current) return;

        items = rows;
        allowed = true;
        render();
      } catch {
        if (version === current) {
          allowed = false;
          items = [];
          render();
        }
      }
    };

    queue = queue.then(work, work);

    return queue;
  }

  function node(tag, className, value) {
    const element = document.createElement(tag);

    if (className) {
      element.className = className;
    }

    if (value !== undefined) {
      element.textContent = value;
    }

    return element;
  }

  function mount() {
    const anchors = [
      [
        "home",
        document.querySelector(
          "#home .ri-home-bot"
        )
      ],
      [
        "scanner",
        document.querySelector(
          "#scanner .scanner-box"
        )
      ],
      [
        "premium",
        document.getElementById(
          "rpTokenMessage"
        )
      ]
    ];

    for (const [place, anchor] of anchors) {
      if (
        !anchor ||
        document.querySelector(
          '[data-ri-history="' + place + '"]'
        )
      ) {
        continue;
      }

      const section = node("section", "rh");

      section.dataset.riHistory = place;
      section.hidden = true;

      section.setAttribute(
        "aria-label",
        "Your recent searches"
      );

      if (place === "home") {
        anchor.before(section);
      } else {
        anchor.after(section);
      }
    }
  }

  function open(row, place, status) {
    if (place === "premium") {
      const form = document.getElementById(
        "rpTokenForm"
      );

      const input = document.getElementById(
        "rpTokenCA"
      );

      if (!form || !input) return;

      input.value = row.contract;
      form.requestSubmit();

      return;
    }

    const input = document.getElementById(
      "contractInput"
    );

    const button = document.getElementById(
      "analyzeButton"
    );

    if (!input || !button || button.disabled) {
      status.textContent =
        "Please wait for the current analysis to finish.";

      return;
    }

    input.value = row.contract;

    input.dispatchEvent(
      new Event("input", {
        bubbles: true
      })
    );

    location.hash = "scanner";

    window.dispatchEvent(
      new Event("hashchange")
    );

    button.click();
  }

  function render() {
    mount();

    for (
      const section of document.querySelectorAll(
        "[data-ri-history]"
      )
    ) {
      section.replaceChildren();
      section.hidden = !allowed;

      if (!allowed) continue;

      const heading = node(
        "div",
        "rh-heading"
      );

      heading.append(
        node(
          "h3",
          "",
          "Your recent searches"
        ),
        node(
          "span",
          "rh-premium",
          "PREMIUM"
        ),
        node(
          "small",
          "",
          "Last 5 tokens"
        )
      );

      const grid = node("div", "rh-grid");
      const status = node("p", "rh-status");

      status.setAttribute("role", "status");

      if (!items.length) {
        grid.append(
          node(
            "p",
            "rh-empty",
            "Your searched tokens will appear here."
          )
        );
      }

      for (const item of items) {
        const card = node(
          "article",
          "rh-card"
        );

        const button = node(
          "button",
          "rh-open"
        );

        button.type = "button";

        button.setAttribute(
          "aria-label",
          "Open " + (item.name || item.contract)
        );

        const avatar = node(
          "span",
          "rh-avatar",
          (
            item.symbol ||
            item.name ||
            "?"
          ).slice(0, 2)
        );

        window.RI_HISTORY_IMAGE?.(
          avatar,
          item
        );

        const identity = node(
          "span",
          "rh-name"
        );

        identity.append(
          node(
            "strong",
            "",
            item.name ||
              item.symbol ||
              "Token"
          ),
          node(
            "small",
            "",
            item.symbol || ""
          )
        );

        const score = node(
          "span",
          "rh-score"
        );

        const hasScore =
          typeof item.score === "number" &&
          Number.isFinite(item.score) &&
          item.score >= 0 &&
          item.score <= 100;

        score.append(
          node(
            "small",
            "",
            "Last scan score"
          ),
          node(
            "strong",
            "",
            hasScore
              ? item.score + "/100"
              : "—"
          )
        );

        if (hasScore && item.score_at) {
          score.title =
            "Scanned " +
            new Date(
              item.score_at
            ).toLocaleString();
        }

        button.append(
          avatar,
          identity,
          score
        );

        button.addEventListener(
          "click",
          () =>
            open(
              item,
              section.dataset.riHistory,
              status
            )
        );

        const copy = node(
          "button",
          "rh-ca",
          "⧉  " +
            item.contract.slice(0, 7) +
            "…" +
            item.contract.slice(-6)
        );

        copy.type = "button";
        copy.title = item.contract;

        copy.setAttribute(
          "aria-label",
          "Copy contract " + item.contract
        );

        copy.addEventListener(
          "click",
          async () => {
            try {
              await navigator.clipboard.writeText(
                item.contract
              );

              status.textContent =
                "Contract copied.";
            } catch {
              status.textContent =
                item.contract;
            }
          }
        );

        card.append(button, copy);
        grid.append(card);
      }

      section.append(
        heading,
        grid,
        status
      );
    }
  }

  function attach() {
    if (attached || !client()) return;

    attached = true;

    client().auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "SIGNED_OUT" ||
          (
            owner &&
            owner !== session?.user.id
          )
        ) {
          reset();
        }

        if (
          [
            "INITIAL_SESSION",
            "SIGNED_IN",
            "SIGNED_OUT",
            "USER_UPDATED"
          ].includes(event)
        ) {
          setTimeout(
            () =>
              void refresh().catch(
                () => {}
              ),
            0
          );
        }
      }
    );

    void refresh().catch(() => {});
  }

  window.RI_RECENT_SEARCHES = {
    start(contract) {
      const account = owner;
      const current = version;

      return data => {
        if (
          !account ||
          owner !== account ||
          version !== current
        ) {
          return;
        }

        return record(
          contract,
          data
        ).catch(() => {});
      };
    }
  };

  function init() {
    if (
      document.getElementById(
        "ri-recent-style"
      )
    ) {
      return;
    }

    const style = node("style");

    style.id = "ri-recent-style";

    style.textContent = `
      body .rh[hidden] {
        display: none !important;
      }

      body .rh {
        width: 100%;
        min-width: 0;
        margin: 24px 0;
        text-align: left;
        color: #e9f8ef;
        font: 14px/1.5 system-ui, sans-serif;
      }

      body .rh * {
        box-sizing: border-box;
      }

      body #home .rh {
        position: relative;
        left: 50%;
        transform: translateX(-50%);
        width: min(1280px, calc(100vw - 40px));
        max-width: none;
        margin: 28px 0;
      }

      body .rh-heading {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 12px;
      }

      body .rh .rh-heading h3 {
        margin: 0;
        color: #edf8f2;
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -.4px;
      }

      body .rh .rh-premium {
        padding: 3px 7px;
        border: 1px solid #245f46;
        border-radius: 5px;
        color: #50efb2;
        font-size: 9px;
        font-weight: 750;
        letter-spacing: 1px;
      }

      body .rh .rh-heading > small {
        margin-left: auto;
        color: #92ad9f;
        font-size: 11px;
      }

      body .rh-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 12px;
      }

      body .rh-card {
        min-width: 0;
        padding: 14px;
        border: 1px solid #244638;
        border-radius: 13px;
        background: linear-gradient(
          145deg,
          rgba(8, 34, 25, .97),
          rgba(3, 18, 13, .96)
        );
        transition: border-color .15s;
      }

      body .rh-card:hover {
        border-color: #50efb2;
      }

      body .rh button {
        font: inherit;
        cursor: pointer;
        box-shadow: none;
        text-transform: none;
        letter-spacing: normal;
      }

      body .rh .rh-open {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) auto;
        gap: 9px;
        align-items: center;
        width: 100%;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: inherit;
        text-align: left;
      }

      body .rh-avatar {
        position: relative;
        display: grid;
        place-items: center;
        width: 42px;
        height: 42px;
        overflow: hidden;
        border: 1px solid #365b48;
        border-radius: 50%;
        background: #142f22;
        color: #50efb2;
        font-size: 12px;
        font-weight: 700;
      }

      body .rh-avatar img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      body .rh-name {
        display: flex;
        flex-direction: column;
        min-width: 0;
        gap: 3px;
      }

      body .rh .rh-name strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #e9f8ef;
        font-size: 12px;
      }

      body .rh .rh-name small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: #8ca89a;
        font-size: 9px;
        letter-spacing: .6px;
      }

      body .rh-score {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 4px;
      }

      body .rh .rh-score small {
        color: #94ad9f;
        font-size: 8px;
        white-space: nowrap;
      }

      body .rh .rh-score strong {
        padding: 3px 6px;
        border: 1px solid #28694b;
        border-radius: 6px;
        background: #041b11;
        color: #e7fff1;
        font-size: 11px;
        white-space: nowrap;
      }

      body .rh .rh-ca {
        display: block;
        width: 100%;
        margin-top: 13px;
        padding: 6px 8px;
        overflow: hidden;
        border: 1px solid #193e2b;
        border-radius: 7px;
        background: #061e14;
        color: #a9c9b6;
        font: 10px/1.5 ui-monospace, Consolas, monospace;
        text-overflow: ellipsis;
        white-space: nowrap;
        text-align: left;
      }

      body .rh button:focus-visible {
        outline: 2px solid #50efb2;
        outline-offset: 4px;
      }

      body .rh .rh-status {
        margin: 8px 0 0;
        color: #9ab9a7;
        font-size: 11px;
        overflow-wrap: anywhere;
      }

      body .rh .rh-status:empty {
        display: none;
      }

      body .rh .rh-empty {
        grid-column: 1 / -1;
        margin: 0;
        padding: 16px;
        border: 1px dashed #254b37;
        border-radius: 10px;
        color: #9ab9a7;
        font-size: 12px;
      }

      @media (max-width: 1100px) {
        body .rh-grid {
          display: flex;
          overflow-x: auto;
          gap: 10px;
          padding: 2px 1px 10px;
          scrollbar-width: thin;
          scrollbar-color: #28533b transparent;
        }

        body .rh-card {
          flex: 0 0 240px;
        }
      }

      @media (max-width: 600px) {
        body #home .rh {
          width: calc(100vw - 28px);
        }

        body .rh .rh-heading h3 {
          font-size: 15px;
        }

        body .rh .rh-heading > small {
          display: none;
        }

        body .rh-card {
          flex-basis: 225px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        body .rh-card {
          transition: none;
        }
      }
    `;

    document.head.append(style);

    mount();
    attach();

    document.addEventListener(
      "ri:account-change",
      () => {
        attach();

        void refresh().catch(() => {});
      }
    );

    document.addEventListener(
      "ri:premium-change",
      () => {
        mount();

        void refresh().catch(() => {});
      }
    );

    document.addEventListener(
      "visibilitychange",
      () => {
        if (!document.hidden) {
          void refresh().catch(() => {});
        }
      }
    );
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