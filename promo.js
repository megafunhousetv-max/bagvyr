(() => {
  "use strict";

  const script = document.currentScript;
  const sitekey = script?.dataset.sitekey || "";

  const init = () => {
    const menu = document.querySelector(".site-header .header-menu");

    if (!menu || document.getElementById("ri-promo-dialog")) return;

    const style = document.createElement("style");

    style.textContent = `
      .site-header .ri-promo-nav {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        min-height: 44px;
        padding: 0 14px;
        border: 0;
        border-radius: 999px;
        background: transparent;
        color: #35ffc0;
        font-family: inherit;
        font-weight: 700;
        font-size: 13px;
        white-space: nowrap;
        cursor: pointer;
      }

      .site-header .ri-promo-nav svg {
        width: 18px;
        height: 18px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
        flex-shrink: 0;
      }

      .site-header .ri-promo-nav:hover {
        background: rgba(37,255,192,.09);
      }

      .ri-promo-nav:focus-visible,
      .ri-promo-dialog button:focus-visible {
        outline: 2px solid #35ffc0;
        outline-offset: 3px;
      }

      .ri-promo-dialog {
        box-sizing: border-box;
        width: min(520px, calc(100% - 28px));
        max-height: calc(100dvh - 32px);
        margin: auto;
        padding: 28px;
        border: 1px solid #285b46;
        border-radius: 22px;
        background: #071e16;
        color: #effff6;
        box-shadow: 0 24px 80px #0009;
        font-family: inherit;
        overflow: auto;
      }

      .ri-promo-dialog::backdrop {
        background: rgba(0,8,5,.78);
      }

      .ri-promo-dialog h2 {
        margin: 0 40px 10px 0;
        font-size: 26px;
        line-height: 1.2;
        color: #effff6;
      }

      .ri-promo-dialog p {
        margin: 0 0 18px;
        color: #abc8b8;
        font-size: 14px;
        line-height: 1.5;
      }

      .ri-promo-close {
        position: absolute;
        top: 18px;
        right: 18px;
        width: 36px;
        height: 36px;
        border: 1px solid #285b46;
        border-radius: 50%;
        background: transparent;
        color: #effff6;
        font-size: 24px;
        cursor: pointer;
      }

      .ri-promo-form {
        display: grid;
        gap: 14px;
      }

      .ri-promo-form label {
        display: grid;
        gap: 7px;
        color: #dcefe3;
        font-size: 13px;
        font-weight: 600;
      }

      .ri-promo-form input,
      .ri-promo-form textarea {
        box-sizing: border-box;
        width: 100%;
        min-width: 0;
        padding: 12px 13px;
        border: 1px solid #315d49;
        border-radius: 10px;
        background: #03150e;
        color: #effff6;
        font: inherit;
        font-size: 16px;
        box-shadow: none;
      }

      .ri-promo-form input:focus,
      .ri-promo-form textarea:focus {
        outline: 2px solid #35ffc0;
        outline-offset: 1px;
      }

      .ri-promo-form textarea {
        resize: vertical;
        min-height: 90px;
      }

      .ri-promo-form .ri-promo-honey {
        position: absolute;
        left: -10000px;
        opacity: 0;
      }

      .ri-promo-send {
        min-height: 46px;
        padding: 12px;
        border: 0;
        border-radius: 11px;
        background: #35ffc0;
        color: #032015;
        font: inherit;
        font-weight: 800;
        cursor: pointer;
      }

      .ri-promo-send:disabled {
        opacity: .5;
        cursor: wait;
      }

      .ri-promo-dialog .ri-promo-status {
        margin: 0;
        color: #b4e8cc;
        min-height: 20px;
      }

      .ri-promo-status[data-error="true"] {
        color: #ffb6a5;
      }

      .ri-promo-dialog .ri-promo-note {
        font-size: 12px;
        margin: 0;
        color: #9bb7a8;
      }

      @media (max-width: 1100px) and (min-width: 701px) {
        .site-header .header-inner {
          flex-wrap: wrap;
          justify-content: center;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        .site-header .header-nav {
          flex-wrap: wrap;
          justify-content: center;
        }
      }

      @media (max-width: 980px) {
        .site-header .ri-promo-nav {
          padding: 0 10px;
          font-size: 12px;
        }
      }

      @media (max-width: 700px) {
        .site-header .header-menu {
          flex-wrap: wrap;
        }

        .site-header .ri-promo-nav {
          flex: 1;
          min-height: 40px;
          padding: 0 5px;
          font-size: 11px;
        }

        .site-header .ri-promo-nav svg {
          width: 16px;
          height: 16px;
        }
      }

      @media (max-width: 380px) {
        .site-header .header-menu .nav-link svg,
        .site-header .ri-promo-nav svg {
          display: none;
        }

        .ri-promo-dialog {
          padding: 20px 14px;
        }
      }
    `;

    document.head.append(style);

    const button = document.createElement("button");

    button.type = "button";
    button.className = "ri-promo-nav";
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", "ri-promo-dialog");

    button.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 10h4l11-5v14l-11-5H4zM8 14l2 6h4l-2-4"/>
      </svg>
      <span>Promote</span>
    `;

    menu.insertBefore(
      button,
      menu.querySelector('a[href="#about"]')
    );

    const dialog = document.createElement("dialog");

    dialog.id = "ri-promo-dialog";
    dialog.className = "ri-promo-dialog";
    dialog.setAttribute("aria-labelledby", "ri-promo-title");

    dialog.innerHTML = `
      <button
        type="button"
        class="ri-promo-close"
        aria-label="Close promotion form"
      >×</button>

      <h2 id="ri-promo-title">Promote your project</h2>

      <p>
        Interested in a promotion on RugInspect?
        Tell us about your project and we’ll get back to you.
      </p>

      <form class="ri-promo-form">
        <label>
          Project name
          <input
            name="project"
            required
            maxlength="80"
            autocomplete="organization"
          >
        </label>

        <label>
          Solana contract address
          <input
            name="ca"
            required
            minlength="32"
            maxlength="44"
            pattern="[1-9A-HJ-NP-Za-km-z]{32,44}"
            spellcheck="false"
            autocapitalize="off"
            autocomplete="off"
          >
        </label>

        <label>
          Your email
          <input
            name="email"
            type="email"
            required
            maxlength="254"
            autocomplete="email"
          >
        </label>

        <label>
          X or Telegram (optional)
          <input
            name="social"
            maxlength="200"
            placeholder="@yourproject or profile link"
          >
        </label>

        <label>
          Your message
          <textarea
            name="message"
            required
            minlength="10"
            maxlength="2000"
            placeholder="Tell us what you’d like to promote."
          ></textarea>
        </label>

        <label class="ri-promo-honey" aria-hidden="true">
          Website
          <input
            name="website"
            tabindex="-1"
            autocomplete="off"
          >
        </label>

        <div id="ri-promo-challenge"></div>

        <button type="submit" class="ri-promo-send">
          Send request
        </button>

        <p
          class="ri-promo-status"
          role="status"
          aria-live="polite"
        ></p>

        <p class="ri-promo-note">
          Your details will be emailed to the RugInspect team
          to respond to your request.
          A promotion is not a safety endorsement.
        </p>
      </form>
    `;

    document.body.append(dialog);

    const form = dialog.querySelector("form");
    const status = dialog.querySelector(".ri-promo-status");
    const send = dialog.querySelector(".ri-promo-send");

    let widget;
    let token = "";
    let loading;
    let sending = false;

    const feedback = (text, error = false) => {
      status.textContent = text;
      status.dataset.error = String(error);
    };

    const loadChallenge = () => {
      if (window.turnstile) return Promise.resolve();

      if (!loading) {
        loading = new Promise((resolve, reject) => {
          const s = document.createElement("script");

          s.src =
            "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          s.async = true;
          s.onload = resolve;
          s.onerror = () => reject(
            new Error(
              "Verification could not load. Please reload and try again."
            )
          );

          document.head.append(s);
        });
      }

      return loading;
    };

    button.addEventListener("click", async () => {
      dialog.showModal();

      if (sending || widget !== undefined) return;

      if (!sitekey || sitekey === "YOUR_TURNSTILE_SITE_KEY") {
        feedback(
          "The form is being set up. Contact dev@ruginspect.com for now.",
          true
        );
        send.disabled = true;
        return;
      }

      try {
        await loadChallenge();

        if (widget !== undefined) return;

        widget = window.turnstile.render("#ri-promo-challenge", {
          sitekey,
          action: "promo_request",
          theme: "dark",
          size: "flexible",

          callback: (value) => {
            token = value;
          },

          "expired-callback": () => {
            token = "";
          },

          "error-callback": () => {
            token = "";
            feedback(
              "Verification failed. Please try again.",
              true
            );
          }
        });
      } catch (error) {
        feedback(error.message, true);
      }
    });

    dialog.querySelector(".ri-promo-close")
      .addEventListener("click", () => dialog.close());

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (sending || !form.reportValidity()) return;

      if (!token) {
        feedback(
          "Please complete the verification first.",
          true
        );
        return;
      }

      const config = window.BAGVYR_SUPABASE;

      if (!config?.url) {
        feedback(
          "The form is temporarily unavailable. Contact dev@ruginspect.com.",
          true
        );
        return;
      }

      const data = Object.fromEntries(new FormData(form));
      data.token = token;

      sending = true;
      send.disabled = true;
      send.textContent = "Sending…";
      feedback("");

      try {
        const response = await fetch(
          `${config.url.replace(/\/$/, "")}/functions/v1/promo-request`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(data),
            signal: AbortSignal.timeout(45000)
          }
        );

        const result = await response.json();

        if (!response.ok || result.ok !== true) {
          throw new Error(
            result.message ||
            "Could not send your request. Please try again."
          );
        }

        form.reset();

        feedback(
          "Request sent. Thanks! We’ll reply to your email."
        );
      } catch (error) {
        feedback(
          error.name === "TimeoutError"
            ? "Delivery could not be confirmed. Check with dev@ruginspect.com before resending."
            : error.message,
          true
        );
      } finally {
        sending = false;
        send.disabled = false;
        send.textContent = "Send request";
        token = "";

        if (widget !== undefined) {
          window.turnstile.reset(widget);
        }
      }
    });
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }
})();