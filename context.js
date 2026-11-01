(() => {
  "use strict";

  function guestToken() {
    try {
      const key =
        "ri_ai_guest_token_v1";

      let token =
        localStorage.getItem(key);

      if (
        !/^[0-9a-f]{64}$/.test(
          token || ""
        )
      ) {
        token = Array.from(
          crypto.getRandomValues(
            new Uint8Array(32)
          )
        )
          .map(byte =>
            byte.toString(16).padStart(2, "0")
          )
          .join("");

        localStorage.setItem(
          key,
          token
        );
      }

      return token;
    } catch {
      return null;
    }
  }

  if (window.RI_TOKEN_CONTEXT_LOADED) return;
  window.RI_TOKEN_CONTEXT_LOADED = true;

  const ADDRESS =
    /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  const paths = {
    document:
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
      '<path d="M14 2v6h6M8 12h8M8 16h6"/>',

    crown:
      '<path d="m2 8 5 4 5-8 5 8 5-4-3 12H5z"/>',

    clock:
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M12 7v5l3 2"/>',

    globe:
      '<circle cx="12" cy="12" r="9"/>' +
      '<path d="M3 12h18M12 3c5 5 5 13 0 18-5-5-5-13 0-18z"/>',

    x:
      '<path d="m4 3 16 18M20 3 4 21M4 3h5l11 18h-5z"/>',

    user:
      '<circle cx="12" cy="7" r="4"/>' +
      '<path d="M4 22v-3a8 8 0 0 1 16 0v3"/>',

    community:
      '<circle cx="9" cy="8" r="3"/>' +
      '<path d="M3 21v-3a6 6 0 0 1 12 0v3M16 5a3 3 0 0 1 0 6M21 21v-3a6 6 0 0 0-4-5"/>',

    external:
      '<path d="M14 3h7v7M10 14 21 3M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>',

    tag:
      '<path d="M3 3h8l10 10-8 8L3 11z"/>' +
      '<circle cx="7.5" cy="7.5" r="1"/>'
  };

  const icon = name =>
    '<svg viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round" ' +
    'aria-hidden="true">' +
    (paths[name] || paths.document) +
    "</svg>";

  const escape = value =>
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

  let currentCA = "";
  let revision = 0;
  let quota = null;
  let resetTimer = null;

  const root = () =>
    document.getElementById("riTokenContext");

  const client = () =>
    window.RI_ACCOUNT_CLIENT;

  async function getSession() {
    if (!client()) return null;

    const { data, error } =
      await client().auth.getSession();

    if (error) throw error;

    return data?.session || null;
  }

  async function call(session, body) {
    const config = window.BAGVYR_SUPABASE;

    if (
      !config?.url ||
      !config?.publishableKey
    ) {
      throw new Error(
        "Token Context is not configured."
      );
    }

    const response = await fetch(
      config.url.replace(/\/+$/, "") +
        "/functions/v1/token-context",
      {
        method: "POST",

        headers: {
          apikey: config.publishableKey,

          ...(session?.access_token
            ? {
                Authorization:
                  "Bearer " +
                  session.access_token
              }
            : {}),

          "Content-Type": "application/json"
        },

        body: JSON.stringify({
  ...body,
  guest_token: guestToken()
}),

        signal: AbortSignal.timeout(90000)
      }
    );

    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "Token Context returned an invalid response."
      );
    }

    if (
      response.status === 401 ||
      data?.code === "LOGIN_REQUIRED"
    ) {
      const error = new Error("LOGIN_REQUIRED");
      error.loginRequired = true;
      throw error;
    }

    if (!response.ok || data?.success !== true) {
      throw new Error(
        data?.error ||
        "Token Context is temporarily unavailable."
      );
    }

    return data;
  }

  function creditText() {
    if (!quota) return "Credits: —";

    if (quota.unlimited) {
      return "Unlimited";
    }

    return (
      "Today: " +
      Math.max(0, Number(quota.remaining) || 0) +
      " / 2"
    );
  }

  function updateQuota(data) {
    if (typeof data?.unlimited !== "boolean") {
      return;
    }

    quota = {
      unlimited: data.unlimited,
      remaining: data.remaining
    };

    const label = root()?.querySelector(
      "[data-context-credits]"
    );

    if (label) {
      label.textContent = creditText();
    }

    clearTimeout(resetTimer);

    const resetAt = Date.parse(
      data.resets_at || ""
    );

    if (
      !quota.unlimited &&
      Number.isFinite(resetAt)
    ) {
      resetTimer = setTimeout(
        () => void refreshCredits(),
        Math.max(
          1000,
          Math.min(
            resetAt - Date.now() + 1000,
            86401000
          )
        )
      );
    }
  }

  async function refreshCredits() {
    const version = revision;

    try {
      const session = await getSession();

      if (version !== revision) {
        return;
      }

      const data = await call(session, {
        action: "status"
      });

      if (version === revision) {
        updateQuota(data);
      }
    } catch {
      // Credit refresh must not interrupt the scanner.
    }
  }

  function frame(body, timestamp = "") {
    const element = root();

    if (!element) return;

    element.hidden = false;

    element.innerHTML = `
      <header class="ri-context__header">
        <div class="ri-context__heading">
          <span class="ri-context__main-icon">
            ${icon("document")}
          </span>

          <h3>Token Context</h3>

          <span class="ri-context__premium">
            ${icon("crown")}
            PREMIUM
          </span>
        </div>

        <div class="ri-context__status">
          ${
            timestamp
              ? `
                <span class="ri-context__checked">
                  ${icon("clock")}
                  ${escape(timestamp)}
                </span>
              `
              : ""
          }

          <span
            class="ri-context__credits"
            data-context-credits
          >${escape(creditText())}</span>
        </div>
      </header>

      <div class="ri-context__body">
        ${body}
      </div>
    `;
  }

  function message(text, options = {}) {
    frame(`
      <div
        class="ri-context__message"
        role="status"
      >
        ${
          options.loading
            ? '<span class="ri-context__spinner"></span>'
            : ""
        }

        <p>${escape(text)}</p>

        ${
          options.login
            ? `
              <a
                class="ri-context__button"
                href="#account"
              >Sign in</a>
            `
            : ""
        }

        ${
          options.premium
            ? `
              <a
                class="ri-context__button"
                href="#premium"
              >${icon("crown")} Get Premium</a>
            `
            : ""
        }

        ${
          options.retry
            ? `
              <button
                class="ri-context__button"
                type="button"
                data-context-retry
              >Try again</button>
            `
            : ""
        }
      </div>
    `);

    root()
      ?.querySelector("[data-context-retry]")
      ?.addEventListener("click", () => {
        void show(currentCA);
      });
  }

  function safeLink(link) {
    try {
      const url = new URL(link.href);

      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password
      ) {
        return null;
      }

      return {
        type: link.type,
        label: String(link.label || url.hostname)
          .slice(0, 100),
        href: url.href
      };
    } catch {
      return null;
    }
  }

  function linkButton(link) {
    return `
      <a
        class="ri-context__link"
        href="${escape(link.href)}"
        target="_blank"
        rel="noopener noreferrer"
      >
        ${icon(
          link.type === "website" ? "globe" : "x"
        )}

        <span>${escape(link.label)}</span>

        ${icon("external")}
      </a>
    `;
  }

  function renderResult(result) {
    const links = Array.isArray(result.links)
      ? result.links
          .map(safeLink)
          .filter(Boolean)
      : [];

    const websites = links.filter(link =>
      link.type === "website"
    );

    const socials = links.filter(link =>
      ["profile", "post", "community"].includes(
        link.type
      )
    );

    const category =
      result.category &&
      result.category !== "Unclear"
        ? result.category
        : "";

    const date = new Date(result.checked_at);

    const timestamp = Number.isNaN(
      date.getTime()
    )
      ? ""
      : "Checked " +
        date.toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        });

    const rows = socials.slice(0, 3).map(link => {
      const type = {
        profile: "Profile",
        post: "Post",
        community: "Community"
      }[link.type];

      const glyph = {
        profile: "user",
        post: "document",
        community: "community"
      }[link.type];

      return `
        <a
          class="ri-context__social"
          href="${escape(link.href)}"
          target="_blank"
          rel="noopener noreferrer"
        >
          <span class="ri-context__social-icon">
            ${icon(glyph)}
          </span>

          <span>
            <small>${type}</small>
            <strong>${escape(link.label)}</strong>
          </span>

          ${icon("external")}
        </a>
      `;
    }).join("");

    const mainLinks = [
      ...websites.slice(0, 2),
      ...socials.filter(link =>
        link.type === "profile"
      ).slice(0, 1)
    ].map(linkButton).join("");

    frame(`
      <div class="ri-context__layout">
        <div class="ri-context__content">
          ${
            category
              ? `
                <div
                  class="ri-context__category"
                  title="Estimated from available project information"
                >
                  ${icon("tag")}
                  <span>${escape(category)}</span>
                  <small>Estimated</small>
                </div>
              `
              : ""
          }

          <div class="ri-context__summary">
            <span
              class="ri-context__quote"
              aria-hidden="true"
            >“</span>

            <p>${escape(result.summary)}</p>
          </div>

          ${
            mainLinks
              ? `
                <div class="ri-context__links">
                  ${mainLinks}
                </div>
              `
              : ""
          }
        </div>

        ${
          rows
            ? `
              <aside class="ri-context__aside">
                <h4>LINKED X</h4>
                ${rows}

                ${
                  socials.some(link =>
                    link.type === "post"
                  )
                    ? `
                      <p class="ri-context__note">
                        A linked post does not imply endorsement.
                      </p>
                    `
                    : ""
                }
              </aside>
            `
            : ""
        }
      </div>
    `, timestamp);
  }

  async function show(rawCA) {
    const ca = String(rawCA || "").trim();

    if (!ADDRESS.test(ca) || !root()) {
      return;
    }

    currentCA = ca;

    const version = ++revision;

    clearTimeout(resetTimer);

    message("Checking Token Context…", {
      loading: true
    });

    try {
      const session = await getSession();

      if (version !== revision) return;

      const status = await call(session, {
        action: "status"
      });

      if (version !== revision) return;

      updateQuota(status);

      message("Reading project information…", {
        loading: true
      });

      for (let attempt = 0; attempt < 35; attempt++) {
        if (version !== revision) return;

        const data = await call(session, {
          action: "context",
          ca
        });

        if (version !== revision) return;

        updateQuota(data);

        if (data.mode === "cached" && data.result) {
          renderResult(data.result);
          return;
        }

        if (data.mode === "limit") {
          message(
            "You have used today's 2 credits. Get Premium for unlimited descriptions or come back tomorrow. Cached descriptions are still free.",
            { premium: true }
          );

          return;
        }

        if (data.mode === "no_data") {
          message(data.message, {
            retry: true
          });

          await refreshCredits();

          return;
        }

        if (data.mode !== "pending") {
          throw new Error(
            "Token Context returned an unexpected response."
          );
        }

        message(
          "This token's description is being prepared…",
          { loading: true }
        );

        await new Promise(resolve => {
          setTimeout(resolve, 2000);
        });
      }

      message(
        "The description is still being prepared. Try again shortly.",
        { retry: true }
      );

    } catch (error) {
      if (version !== revision) return;

      if (error?.loginRequired) {
        quota = null;

        message(
          "Sign in to use Token Context.",
          { login: true }
        );

        return;
      }

      message(
        error?.message ||
        "Token Context is temporarily unavailable.",
        { retry: true }
      );

      await refreshCredits();
    }
  }

  document.addEventListener(
    "ri:token-context",
    event => {
      void show(event.detail?.ca);
    }
  );

  document.addEventListener(
    "ri:account-change",
    () => {
      // Immediately remove the previous account's content.
      revision++;
      quota = null;

      clearTimeout(resetTimer);

      if (currentCA) {
        void show(currentCA);
      }
    }
  );

  function init() {
    const ca = document.getElementById(
      "tokenContract"
    )?.textContent?.trim();

    if (ADDRESS.test(ca || "")) {
      void show(ca);
    }
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