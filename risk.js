(() => {
  "use strict";

  if (window.RI_RISK_SUMMARY_LOADED) return;

  window.RI_RISK_SUMMARY_LOADED = true;

  const ADDRESS =
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  const icons = {
    shield:
      '<path d="M12 3 3 7v6c0 5 9 9 9 9s9-4 9-9V7z"/>' +
      '<path d="m8 12 3 3 5-6"/>',

    crown:
      '<path d="m2 8 5 4 5-8 5 8 5-4-3 12H5z"/>',

    clock:
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M12 7v5l3 2"/>',

    warning:
      '<path d="m12 3 10 18H2zM12 9v5M12 17h.01"/>'
  };

  const icon = name =>
    '<svg viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true">' +
    (icons[name] || icons.warning) +
    "</svg>";

  const esc = value =>
    String(value ?? "").replace(
      /[&<>"']/g,
      character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      })[character]
    );

  let ca = "";
  let version = 0;
  let quota = null;

  let expiryTimer;
  let resetTimer;

  const client = () =>
    window.RI_ACCOUNT_CLIENT;

  function root() {
    let element = document.getElementById(
      "riRiskSummary"
    );

    if (!element) {
      const anchor =
        document.getElementById(
          "riTokenContext"
        );

      if (!anchor) return null;

      element = document.createElement(
        "section"
      );

      element.id = "riRiskSummary";

      element.className =
        "ri-context ri-risk";

      element.setAttribute(
        "aria-label",
        "Risk Summary"
      );

      anchor.insertAdjacentElement(
        "afterend",
        element
      );
    }

    return element;
  }

  async function session() {
    if (!client()) return null;

    const { data, error } =
      await client().auth.getSession();

    if (error) throw error;

    return data?.session || null;
  }

  async function call(auth, body) {
    const config =
      window.BAGVYR_SUPABASE;

    if (
      !config?.url ||
      !config?.publishableKey
    ) {
      throw new Error(
        "Risk Summary is not configured."
      );
    }

    const response = await fetch(
      config.url.replace(/\/+$/, "") +
        "/functions/v1/risk-summary",

      {
        method: "POST",

        headers: {
          apikey:
            config.publishableKey,

          Authorization:
            "Bearer " +
            auth.access_token,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify(body),

        signal:
          AbortSignal.timeout(110000)
      }
    );

    const data = await response.json();

    if (
      response.status === 401 ||
      data?.code === "LOGIN_REQUIRED"
    ) {
      throw new Error(
        "LOGIN_REQUIRED"
      );
    }

    if (
      !response.ok ||
      data?.success !== true
    ) {
      throw new Error(
        data?.error ||
        "Risk Summary is temporarily unavailable."
      );
    }

    return data;
  }

  function creditText() {
    if (quota?.unlimited) {
      return "Unlimited";
    }

    if (quota) {
      return (
        "Today: " +
        Math.max(
          0,
          Number(quota.remaining) || 0
        ) +
        " / 3"
      );
    }

    return "Credits: —";
  }

  function setQuota(data) {
    if (
      typeof data?.unlimited !== "boolean"
    ) {
      return;
    }

    quota = data;

    const label = root()?.querySelector(
      "[data-risk-credits]"
    );

    if (label) {
      label.textContent = creditText();
    }

    clearTimeout(resetTimer);

    const reset = Date.parse(
      data.resets_at || ""
    );

    if (
      !data.unlimited &&
      Number.isFinite(reset)
    ) {
      resetTimer = setTimeout(
        () => void refreshQuota(),

        Math.max(
          1000,

          Math.min(
            reset - Date.now() + 1000,
            86401000
          )
        )
      );
    }
  }

  async function refreshQuota() {
    const current = version;

    try {
      const auth = await session();

      if (
        !auth ||
        current !== version
      ) {
        return;
      }

      const data = await call(auth, {
        action: "status"
      });

      if (current === version) {
        setQuota(data);
      }
    } catch {}
  }

  function frame(body) {
    const element = root();

    if (!element) return;

    element.innerHTML = `
      <header class="ri-context__header">

        <div class="ri-context__heading">

          <span class="ri-context__main-icon">
            ${icon("shield")}
          </span>

          <h3>Risk Summary</h3>

          <span class="ri-context__premium">
            ${icon("crown")}
            PREMIUM
          </span>

        </div>

        <div class="ri-context__status">

          <span class="ri-context__checked">
            3 daily credits · Unlimited with Premium
          </span>

          <span
            class="ri-context__credits"
            data-risk-credits
          >${esc(creditText())}</span>

        </div>

      </header>

      ${body}
    `;
  }

  function message(text, mode = "") {
    frame(`
      <div
        class="ri-context__message"
        role="status"
      >

        ${
          mode === "loading"
            ? '<span class="ri-context__spinner"></span>'
            : ""
        }

        <p>${esc(text)}</p>

        ${
          mode === "login"
            ? `
              <a
                class="ri-context__button"
                href="#account"
              >Sign in</a>
            `
            : ""
        }

        ${
          mode === "limit"
            ? `
              <a
                class="ri-context__button"
                href="#premium"
              >Get Premium</a>
            `
            : ""
        }

        ${
          mode === "retry"
            ? `
              <button
                class="ri-context__button"
                type="button"
                data-risk-refresh
              >Refresh summary</button>
            `
            : ""
        }

      </div>
    `);

    root()
      ?.querySelector(
        "[data-risk-refresh]"
      )
      ?.addEventListener(
        "click",
        () => void show(ca)
      );
  }

  function render(result) {
    const checked = Date.parse(
      result.snapshot_at || ""
    );

    const expires = Math.min(
      Date.parse(
        result.expires_at || ""
      ),

      checked + 300000
    );

    if (
      !Number.isFinite(checked) ||
      !Number.isFinite(expires) ||
      expires <= Date.now()
    ) {
      message(
        "This scan snapshot has expired. Refresh to request a new summary.",
        "retry"
      );

      return;
    }

    const concerns =
      Array.isArray(result.concerns)
        ? result.concerns.slice(0, 3)
        : [];

    const main =
      result.main_concern;

    const score =
      Number(result.score);

    const level =
      score >= 80
        ? "lower"
        : score >= 60
          ? "moderate"
          : score >= 40
            ? "elevated"
            : "higher";

    const time = new Date(
      checked
    ).toLocaleString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit"
      }
    );

    frame(`
      <div class="ri-context__layout">

        <div class="ri-context__content">

          <div class="ri-context__summary">

            <span
              class="ri-context__quote"
              aria-hidden="true"
            >“</span>

            <p>${esc(result.summary)}</p>

          </div>

          ${
            concerns.length
              ? `
                <div class="ri-risk__tags">

                  ${
                    concerns.map(row => `
                      <span
                        class="ri-risk__tag"
                        title="${esc(row.explanation)}"
                      >
                        ${icon("warning")}
                        ${esc(row.title)}
                      </span>
                    `).join("")
                  }

                </div>
              `
              : ""
          }

        </div>

        <aside
          class="ri-context__aside ri-risk__aside"
        >

          <h4>SCAN SNAPSHOT</h4>

          <div
            class="ri-risk__score"
            data-risk-level="${level}"
          >
            ${esc(result.score)}
            <small>/ 100</small>
          </div>

          <div class="ri-risk__label">
            ${esc(result.label)}
          </div>

          ${
            main
              ? `
                <div class="ri-risk__concern">

                  ${icon("warning")}

                  <div>
                    <strong>Main concern</strong>
                    <span>${esc(main.title)}</span>
                  </div>

                </div>
              `
              : `
                <p class="ri-context__note">
                  No risk flags were returned by this scan.
                  This does not confirm safety.
                </p>
              `
          }

        </aside>

      </div>

      <footer class="ri-risk__footer">

        <span>
          ${icon("clock")}
          Snapshot checked ${esc(time)}
        </span>

        <span>
          Automated summary of scanner findings
        </span>

      </footer>
    `);

    const current = version;

    expiryTimer = setTimeout(
      () => {
        if (current === version) {
          message(
            "This scan snapshot has expired. Refresh to request a new summary.",
            "retry"
          );
        }
      },

      Math.max(
        1,
        expires - Date.now()
      )
    );
  }

  async function show(value) {
    const contract = String(
      value || ""
    ).trim();

    if (
      !ADDRESS.test(contract) ||
      !root()
    ) {
      return;
    }

    ca = contract;

    const current = ++version;

    clearTimeout(expiryTimer);
    clearTimeout(resetTimer);

    message(
      "Checking Risk Summary…",
      "loading"
    );

    try {
      const auth = await session();

      if (current !== version) {
        return;
      }

      if (!auth) {
        quota = null;

        message(
          "Sign in to use Risk Summary. Registered accounts receive 3 free credits per day.",
          "login"
        );

        return;
      }

      const status = await call(
        auth,
        {
          action: "status"
        }
      );

      if (current !== version) {
        return;
      }

      setQuota(status);

      message(
        "Reading scanner findings and preparing the summary…",
        "loading"
      );

      for (
        let attempt = 0;
        attempt < 40;
        attempt++
      ) {
        if (current !== version) {
          return;
        }

        const data = await call(
          auth,
          {
            action: "summary",
            ca: contract
          }
        );

        if (current !== version) {
          return;
        }

        setQuota(data);

        if (
          data.mode === "cached" &&
          data.result
        ) {
          render(data.result);
          return;
        }

        if (
          data.mode === "limit"
        ) {
          message(
            "You have used today's 3 Risk Summary credits. Get Premium for unlimited summaries or come back tomorrow. Valid cached summaries are still free.",
            "limit"
          );

          return;
        }

        if (
          data.mode === "no_data"
        ) {
          message(
            data.message,
            "retry"
          );

          await refreshQuota();

          return;
        }

        if (
          data.mode !== "pending"
        ) {
          throw new Error(
            "Unexpected Risk Summary response."
          );
        }

        message(
          "A summary for this token is already being prepared…",
          "loading"
        );

        await new Promise(resolve => {
          setTimeout(
            resolve,
            2000
          );
        });
      }

      message(
        "The summary is still being prepared. Try again shortly.",
        "retry"
      );

    } catch (error) {
      if (current !== version) {
        return;
      }

      if (
        error?.message ===
        "LOGIN_REQUIRED"
      ) {
        quota = null;

        message(
          "Sign in to use Risk Summary.",
          "login"
        );
      } else {
        message(
          error?.message ||
          "Could not load Risk Summary. Please try again.",
          "retry"
        );

        await refreshQuota();
      }
    }
  }

  document.addEventListener(
    "ri:token-context",

    event => {
      void show(
        event.detail?.ca
      );
    }
  );

  document.addEventListener(
    "ri:account-change",

    () => {
      version++;
      quota = null;

      clearTimeout(expiryTimer);
      clearTimeout(resetTimer);

      if (ca) {
        void show(ca);
      }
    }
  );

  function init() {
    const contract =
      document.getElementById(
        "tokenContract"
      )?.textContent?.trim();

    if (
      ADDRESS.test(
        contract || ""
      )
    ) {
      void show(contract);
    }
  }

  if (
    document.readyState ===
    "loading"
  ) {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();