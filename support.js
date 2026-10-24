(() => {
  "use strict";

  if (document.getElementById("riSupportWidget")) {
    return;
  }

  const script = document.currentScript;
  const sitekey = script?.dataset.sitekey || "";

  const icon = `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M3 14v-3a9 9 0 0 1 18 0v3"/>
      <rect x="3" y="12" width="4" height="8" rx="2"/>
      <rect x="17" y="12" width="4" height="8" rx="2"/>
      <path d="M21 18v1a3 3 0 0 1-3 3h-3"/>
    </svg>
  `;

  const host = document.createElement("div");
  host.id = "riSupportWidget";

  host.innerHTML = `
    <style>
      #riSupportWidget {
        position:fixed;
        inset:0;
        z-index:10000;
        pointer-events:none;
        font:14px/1.5 Inter,Arial,sans-serif;
        color:#e9fff4;
        text-align:left;
        color-scheme:dark;
      }

      #riSupportWidget * {
        box-sizing:border-box;
      }

      #riSupportWidget [hidden] {
        display:none!important;
      }

      #riSupportWidget button,
      #riSupportWidget input,
      #riSupportWidget select,
      #riSupportWidget textarea {
        font:inherit;
        letter-spacing:normal;
        text-transform:none;
      }

      #riSupportWidget button {
        cursor:pointer;
      }

      #riSupportWidget svg {
        display:block;
        width:24px;
        height:24px;
        flex-shrink:0;
      }

      #riSupportWidget #riSupportLaunch {
        pointer-events:auto;
        position:absolute;
        right:24px;
        bottom:calc(
          24px + env(safe-area-inset-bottom,0px)
        );
        display:flex;
        align-items:center;
        gap:10px;
        height:54px;
        padding:0 20px;
        border:1px solid #35eeb2;
        border-radius:28px;
        background:#071b13;
        color:#51f4bd;
        box-shadow:0 8px 28px #0006;
        font-weight:700;
      }

      #riSupportWidget #riSupportLaunch:hover {
        background:#103526;
      }

      #riSupportWidget #riSupportPanel {
        pointer-events:auto;
        position:absolute;
        right:24px;
        bottom:calc(
          90px + env(safe-area-inset-bottom,0px)
        );
        width:390px;
        max-width:calc(100vw - 32px);
        max-height:calc(
          100dvh - 116px -
          env(safe-area-inset-bottom,0px)
        );
        overflow-y:auto;
        overscroll-behavior:contain;
        padding:22px;
        background:#06170f;
        border:1px solid #285840;
        border-radius:18px;
        box-shadow:0 20px 65px #0009;
      }

      #riSupportWidget .ri-s-head {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:14px;
        margin-bottom:18px;
      }

      #riSupportWidget .ri-s-brand {
        display:flex;
        align-items:center;
        gap:9px;
        font-size:13px;
        font-weight:700;
        color:#49efb6;
      }

      #riSupportWidget #riSupportClose {
        display:grid;
        place-items:center;
        min-width:36px;
        height:36px;
        padding:0;
        border:0;
        border-radius:8px;
        background:transparent;
        color:#d3eadd;
        font-size:26px;
        line-height:1;
      }

      #riSupportWidget h2 {
        margin:0 0 7px;
        color:#effff7;
        font-size:24px;
        font-weight:700;
        line-height:1.2;
        letter-spacing:-.5px;
      }

      #riSupportWidget p {
        margin:0 0 18px;
        color:#a7bfb1;
        font-size:13px;
        line-height:1.5;
      }

      #riSupportWidget label {
        display:block;
        margin:13px 0 6px;
        color:#d6eadd;
        font-size:12px;
      }

      #riSupportWidget input,
      #riSupportWidget select,
      #riSupportWidget textarea {
        display:block;
        width:100%;
        min-width:0;
        min-height:44px;
        margin:0;
        padding:11px 12px;
        border:1px solid #2b4939;
        border-radius:9px;
        background:#091f15;
        color:#edfff4;
        box-shadow:none;
        outline:none;
      }

      #riSupportWidget textarea {
        min-height:104px;
        resize:vertical;
      }

      #riSupportWidget input::placeholder,
      #riSupportWidget textarea::placeholder {
        color:#7e9b8b;
        opacity:1;
      }

      #riSupportWidget button:focus-visible,
      #riSupportWidget input:focus-visible,
      #riSupportWidget select:focus-visible,
      #riSupportWidget textarea:focus-visible {
        outline:2px solid #35eeb2;
        outline-offset:3px;
      }

      #riSupportWidget .ri-s-optional {
        color:#87a594;
      }

      #riSupportWidget .ri-s-attach {
        position:relative;
        display:flex;
        align-items:center;
        gap:8px;
        min-height:44px;
        padding:10px 12px;
        border:1px dashed #345742;
        border-radius:9px;
        color:#b4d6c3;
        cursor:pointer;
        overflow:hidden;
        overflow-wrap:anywhere;
      }

      #riSupportWidget .ri-s-attach input {
        position:absolute;
        inset:0;
        opacity:0;
        cursor:pointer;
        width:100%;
        height:100%;
      }

      #riSupportWidget .ri-s-help {
        display:block;
        margin-top:5px;
        color:#7f9c8a;
        font-size:11px;
      }

      #riSupportWidget #riSupportCaptcha {
        margin-top:14px;
        min-height:0;
      }

      #riSupportWidget #riSupportSend {
        display:block;
        width:100%;
        min-height:46px;
        margin:14px 0 10px;
        padding:11px 16px;
        border:0;
        border-radius:9px;
        background:#2defae;
        color:#032416;
        font-weight:700;
      }

      #riSupportWidget #riSupportSend:disabled {
        opacity:.55;
        cursor:wait;
      }

      #riSupportWidget .ri-s-foot {
        display:block;
        text-align:center;
        font-size:10px;
        color:#86a391;
        line-height:1.5;
      }

      #riSupportWidget #riSupportStatus {
        margin:12px 0 0;
        font-size:12px;
        color:#b4d6c3;
        overflow-wrap:anywhere;
      }

      #riSupportWidget
      #riSupportStatus[data-error="true"] {
        color:#ff9c9c;
      }

      #riSupportWidget .ri-s-trap {
        position:absolute;
        width:1px;
        height:1px;
        overflow:hidden;
        clip-path:inset(50%);
        pointer-events:none;
      }

      @media(max-width:600px) {
        #riSupportWidget #riSupportLaunch {
          right:16px;
          bottom:calc(
            16px + env(safe-area-inset-bottom,0px)
          );
          width:54px;
          padding:0;
          justify-content:center;
        }

        #riSupportWidget #riSupportLaunch span {
          display:none;
        }

        #riSupportWidget #riSupportPanel {
          right:12px;
          bottom:calc(
            82px + env(safe-area-inset-bottom,0px)
          );
          width:calc(100vw - 24px);
          max-width:420px;
          max-height:calc(
            100dvh - 106px -
            env(safe-area-inset-bottom,0px)
          );
          padding:18px;
          border-radius:18px;
        }

        #riSupportWidget input,
        #riSupportWidget select,
        #riSupportWidget textarea {
          font-size:16px;
        }

        #riSupportWidget h2 {
          font-size:23px;
        }
      }
    </style>

    <button
      id="riSupportLaunch"
      type="button"
      aria-label="Open support"
      aria-expanded="false"
      aria-controls="riSupportPanel"
    >
      ${icon}
      <span>Support</span>
    </button>

    <section
      id="riSupportPanel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="riSupportTitle"
      hidden
    >
      <div class="ri-s-head">
        <div class="ri-s-brand">
          ${icon}
          <span>RugInspect Support</span>
        </div>

        <button
          id="riSupportClose"
          type="button"
          aria-label="Close support"
        >×</button>
      </div>

      <h2 id="riSupportTitle" tabindex="-1">
        How can we help you?
      </h2>

      <p>
        Send us your question.
        We’ll use your email to reply.
      </p>

      <form id="riSupportForm">
        <label for="riSupportEmail">
          Your email
        </label>

        <input
          id="riSupportEmail"
          name="email"
          type="email"
          autocomplete="email"
          placeholder="you@example.com"
          maxlength="254"
          required
        >

        <label for="riSupportTopic">
          Topic
        </label>

        <select
          id="riSupportTopic"
          name="topic"
          required
        >
          <option value="">Choose a topic</option>
          <option value="technical">
            Technical issue
          </option>
          <option value="token">
            Token data
          </option>
          <option value="account">
            Account & Premium
          </option>
          <option value="other">
            Other question
          </option>
        </select>

        <label for="riSupportMessage">
          Your message
        </label>

        <textarea
          id="riSupportMessage"
          name="message"
          placeholder="Describe your question or issue…"
          minlength="10"
          maxlength="4000"
          required
        ></textarea>

        <label for="riSupportCA">
          Token CA
          <span class="ri-s-optional">
            (optional)
          </span>
        </label>

        <input
          id="riSupportCA"
          name="contract"
          placeholder="Paste the token address"
          maxlength="44"
          autocomplete="off"
          spellcheck="false"
          pattern="[1-9A-HJ-NP-Za-km-z]{32,44}"
        >

        <label
          class="ri-s-attach"
          for="riSupportFile"
        >
          <span id="riSupportFileLabel">
            ＋ Add a screenshot (optional)
          </span>

          <input
            id="riSupportFile"
            name="screenshot"
            type="file"
            accept="image/png,image/jpeg,image/webp"
          >
        </label>

        <small class="ri-s-help">
          PNG, JPG or WebP · up to 3 MB
        </small>

        <div class="ri-s-trap" aria-hidden="true">
          <label>
            Website
            <input
              name="website"
              tabindex="-1"
              autocomplete="off"
            >
          </label>
        </div>

        <div id="riSupportCaptcha"></div>

        <button
          id="riSupportSend"
          type="submit"
        >
          Send message
        </button>

        <small class="ri-s-foot">
          Your email is used to reply to this request.
        </small>

        <p
          id="riSupportStatus"
          role="status"
          aria-live="polite"
        ></p>
      </form>
    </section>
  `;

  document.body.append(host);

  const $ = id =>
    host.querySelector("#" + id);

  const panel = $("riSupportPanel");
  const launch = $("riSupportLaunch");
  const form = $("riSupportForm");

  let widget = null;
  let captcha = "";
  let busy = false;
  let ticketId = null;

  const status = (text, error = false) => {
    $("riSupportStatus").textContent = text;

    $("riSupportStatus").dataset.error =
      String(error);
  };

  function loadTurnstile() {
    if (window.turnstile?.render) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      let asset = document.querySelector(
        'script[src^="https://challenges.cloudflare.com/turnstile/v0/api.js"]'
      );

      const timer = setInterval(() => {
        if (window.turnstile?.render) {
          clearInterval(timer);
          clearTimeout(deadline);
          resolve();
        }
      }, 100);

      const deadline = setTimeout(() => {
        clearInterval(timer);

        reject(new Error(
          "Security check could not load. Close support and try again."
        ));
      }, 15000);

      if (!asset) {
        asset = document.createElement("script");

        asset.src =
          "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

        asset.async = true;

        document.head.append(asset);
      }
    });
  }

  async function prepare() {
    if (widget !== null) return;

    if (!sitekey) {
      status(
        "Support is not configured yet.",
        true
      );

      return;
    }

    try {
      await loadTurnstile();

      if (widget !== null) return;

      widget = window.turnstile.render(
        $("riSupportCaptcha"),
        {
          sitekey,
          action: "support",
          theme: "dark",
          size: "flexible",
          "response-field": false,

          callback: token => {
            captcha = token;
          },

          "expired-callback": () => {
            captcha = "";
            window.turnstile.reset(widget);
          },

          "error-callback": () => {
            captcha = "";

            status(
              "Security check failed. Please try again.",
              true
            );
          }
        }
      );
    } catch (error) {
      status(error.message, true);
    }
  }

  function open(value) {
    panel.hidden = !value;

    launch.setAttribute(
      "aria-expanded",
      String(value)
    );

    launch.setAttribute(
      "aria-label",
      value
        ? "Close support"
        : "Open support"
    );

    if (value) {
      $("riSupportTitle").focus({
        preventScroll: true
      });

      void prepare();
    } else {
      launch.focus({
        preventScroll: true
      });
    }
  }

  launch.onclick = () =>
    open(panel.hidden);

  $("riSupportClose").onclick = () =>
    open(false);

  host.addEventListener("keydown", event => {
    if (
      event.key === "Escape" &&
      !panel.hidden
    ) {
      event.preventDefault();
      open(false);
    }
  });

  form.addEventListener("input", () => {
    if (!busy) ticketId = null;
  });

  $("riSupportFile").addEventListener(
    "change",
    () => {
      const file =
        $("riSupportFile").files[0];

      $("riSupportFileLabel").textContent =
        file
          ? file.name
          : "＋ Add a screenshot (optional)";
    }
  );

  form.addEventListener(
    "submit",
    async event => {
      event.preventDefault();

      if (busy || !form.reportValidity()) {
        return;
      }

      const config =
        window.BAGVYR_SUPABASE;

      if (
        !config?.url ||
        !config?.publishableKey
      ) {
        status(
          "Support is not configured yet.",
          true
        );

        return;
      }

      const file =
        $("riSupportFile").files[0];

      if (
        file &&
        (
          file.size > 3145728 ||
          ![
            "image/png",
            "image/jpeg",
            "image/webp"
          ].includes(file.type)
        )
      ) {
        status(
          "Use a PNG, JPG or WebP screenshot smaller than 3 MB.",
          true
        );

        return;
      }

      if (!captcha) {
        status(
          "Please complete the security check first.",
          true
        );

        await prepare();
        return;
      }

      busy = true;

      $("riSupportSend").disabled = true;
      $("riSupportSend").textContent = "Sending…";

      status("");

      const controller =
        new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        45000
      );

      try {
        ticketId ||= crypto.randomUUID();

        const data = new FormData(form);

        data.set("ticket_id", ticketId);
        data.set("turnstile_token", captcha);

        data.set(
          "source_path",
          location.pathname +
          location.hash.split("?")[0]
        );

        form.querySelectorAll(
          "input, select, textarea"
        ).forEach(field => {
          field.disabled = true;
        });

        const response = await fetch(
          config.url.replace(/\/+$/, "") +
          "/functions/v1/ri-support",
          {
            method: "POST",

            headers: {
              apikey: config.publishableKey
            },

            body: data,
            signal: controller.signal
          }
        );

        const result =
          await response.json();

        if (
          !response.ok ||
          result?.success !== true ||
          result.ticket_id !== ticketId
        ) {
          throw new Error(
            result?.error ||
            "Your request could not be confirmed. Please try again."
          );
        }

        form.reset();

        $("riSupportFileLabel").textContent =
          "＋ Add a screenshot (optional)";

        status(
          "Message received. Reference: " +
          ticketId.slice(0, 8).toUpperCase() +
          ". Thank you!"
        );

        ticketId = null;
      } catch (error) {
        status(
          error.name === "AbortError"
            ? "Sending timed out. Please try again."
            : error.message,
          true
        );
      } finally {
        clearTimeout(timeout);

        busy = false;
        captcha = "";

        form.querySelectorAll(
          "input, select, textarea"
        ).forEach(field => {
          field.disabled = false;
        });

        if (widget !== null) {
          window.turnstile.reset(widget);
        }

        $("riSupportSend").disabled = false;

        $("riSupportSend").textContent =
          "Send message";
      }
    }
  );
})();