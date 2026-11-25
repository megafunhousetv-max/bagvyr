(() => {
  "use strict";

  function start() {
    const section = document.getElementById("premiumSection");

    if (!section) return;

    const root = section.querySelector(
      "#riPremiumRoot[data-premium-admin]"
    );

    if (!root) return;

    section.classList.add("ri-premium-design");

    const create = (tag, className, text) => {
      const element = document.createElement(tag);

      if (className) element.className = className;
      if (text !== undefined) element.textContent = text;

      return element;
    };

    const setText = (element, text) => {
      if (element && element.textContent !== text) {
        element.textContent = text;
      }
    };

    // Change label text while preserving its original input.
    function labelText(label, text) {
      if (!label) return;

      for (const child of [...label.childNodes]) {
        if (child.nodeType === Node.TEXT_NODE) {
          child.remove();
        }
      }

      label.append(create("span", "ri-label-text", text));
    }

    function enhanceWebsite() {
      const master = root.querySelector("#rpMaster");

      if (!master || master.dataset.designReady) return;

      master.dataset.designReady = "true";

      const title = master.querySelector("h3");
      const state = master.querySelector("#rpMasterState");
      const toggle = master.querySelector('[data-toggle="premium"]');
      const history = master.querySelector("[data-admin-control]");
      const refresh = master.querySelector("#rpRefresh");

      setText(title, "Website access");
      setText(refresh, "Refresh status");

      if (state && toggle) {
        const row = create("div", "ri-website-row");
        const name = create("strong", "", "Premium on website");

        toggle.setAttribute("aria-label", "Premium on website");

        row.append(name, state, toggle);
        title.after(row);
      }

      if (history) {
        history.classList.add("ri-history-row");

        setText(
          history.querySelector("strong"),
          "Search history"
        );

        const labels = history.querySelectorAll("label");

        labels.forEach(label => {
          const input = label.querySelector("input");

          labelText(
            label,
            input?.dataset.audience === "premium"
              ? "Premium users"
              : "Signed-in public users"
          );
        });

        setText(
          history.querySelector("small"),
          "Each user sees only their own history."
        );

        if (refresh) history.append(refresh);
      }
    }

    function enhanceGuests() {
      const input = section.querySelector(
        'input[data-feature="context"]'
      );

      const card = input?.parentElement?.parentElement;

      if (!card || card.dataset.designReady) return;

      card.dataset.designReady = "true";
      card.classList.add("ri-guest-card");

      setText(card.querySelector("h3"), "Guest AI Access");

      for (const [key, title] of [
        ["context", "Token Context"],
        ["risk", "Risk Summary"]
      ]) {
        const checkbox = card.querySelector(
          `input[data-feature="${key}"]`
        );

        const label = checkbox?.closest("label");

        if (!label) continue;

        labelText(label, title);
        label.append(
          create("span", "ri-credit", "2 credits / day")
        );
      }
    }

    function enhanceDeveloperHistory() {
      const card = section.querySelector("#dhAdmin");

      if (!card || card.dataset.designReady) return;

      card.dataset.designReady = "true";

      const heading = card.querySelector("h3");
      const rows = [...card.querySelectorAll(".dh-settings")];
      const save = card.querySelector("[data-save]");
      const reload = card.querySelector("[data-reload]");
      const status = card.querySelector("[data-status]");
      const mint = card.querySelector("[data-mint]");
      const preview = card.querySelector("[data-preview]");
      const results = card.querySelector("[data-preview-root]");

      // Keep every original control within #dhAdmin.
      const settings = create("div", "ri-developer-card");
      const test = create("div", "ri-developer-test");
      const actions = create("div", "ri-developer-actions");

      if (heading) {
        heading.querySelector(".dh-badge")?.remove();
        settings.append(heading);
      }

      const columns = create("div", "ri-developer-columns");

      for (const text of ["Audience", "Access", "Scans / day"]) {
        columns.append(create("span", "", text));
      }

      settings.append(columns);

      rows.forEach((row, index) => {
        const labels = row.querySelectorAll("label");
        const number = row.querySelector('input[type="number"]');

        labelText(
          labels[0],
          index === 0
            ? "Premium users"
            : "Public users & guests"
        );

        labels[0]?.querySelector("small")?.remove();

        number?.setAttribute(
          "aria-label",
          index === 0
            ? "Premium scans per day"
            : "Public and guest scans per day"
        );

        settings.append(row);
      });

      for (const element of [save, reload, status]) {
        if (element) actions.append(element);
      }

      settings.append(actions);

      // Preserve the existing explanation.
      const note = [...card.children].find(element =>
        element.tagName === "P" &&
        !element.hasAttribute("data-status")
      );

      if (note) {
        note.classList.add("ri-developer-note");
        settings.append(note);
      }

      const mintLabel = mint?.closest("label");

      if (mintLabel) {
        labelText(mintLabel, "Test Developer History");
        test.append(mintLabel);
      }

      if (preview) test.append(preview);
      if (results) test.append(results);

      card.append(settings, test);
    }

    function enhanceTools() {
      const grid = root.querySelector(".rp-grid");

      if (!grid || grid.dataset.designReady) return;

      grid.dataset.designReady = "true";

      const heading = create("h2", "ri-tools-title", "Tool access");
      const columns = create("div", "ri-tool-columns");

      for (const text of [
        "Tool",
        "Description",
        "Premium users",
        "Public users"
      ]) {
        columns.append(create("span", "", text));
      }

      grid.prepend(heading, columns);

      grid.querySelectorAll("[data-card]").forEach(card => {
        const title = card.querySelector("h3")?.textContent.trim();
        const open = card.querySelector("[data-open]");

        if (title && open) {
          setText(open, title);
          open.setAttribute("aria-label", `Open ${title}`);
        }

        card.querySelectorAll("[data-access]").forEach(input => {
          const audience = input.dataset.audience === "premium"
            ? "Premium users"
            : "Public users";

          input.setAttribute("aria-label", `${title}: ${audience}`);

          labelText(input.closest("label"), audience);
        });
      });

      const tokenForm = root.querySelector("#rpTokenForm");

      if (tokenForm && !root.querySelector(".ri-token-title")) {
        const title = create(
          "label",
          "ri-token-title",
          "Test premium tools"
        );

        title.htmlFor = "rpTokenCA";
        tokenForm.prepend(title);
      }
    }

    function refreshAppearance() {
      enhanceWebsite();
      enhanceGuests();
      enhanceDeveloperHistory();
      enhanceTools();

      const toggle = root.querySelector('[data-toggle="premium"]');

      if (toggle) {
        const enabled = toggle.getAttribute("aria-checked") === "true";

        setText(toggle, enabled ? "Disable Premium" : "Enable Premium");

        setText(
          root.querySelector("#rpMasterState"),
          enabled ? "Enabled" : "Disabled"
        );
      }
    }

    const style = create("style");

    style.textContent = `
      #premiumSection.ri-premium-design {
        --ri-line: #245343;
        --ri-muted: #a8bfb4;
        --ri-accent: #42efae;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.12fr);
        gap: 16px 20px;
        color: #edf8f2;
      }

      #premiumSection.ri-premium-design[hidden],
      #premiumSection.ri-premium-design [hidden] {
        display: none !important;
      }

      #premiumSection.ri-premium-design #riPremiumRoot,
      #premiumSection.ri-premium-design #rpBody,
      #premiumSection.ri-premium-design #dhAdmin {
        display: contents;
      }

      #premiumSection.ri-premium-design #riPremiumRoot > h1,
      #premiumSection.ri-premium-design #riPremiumRoot > .rp-kicker,
      #premiumSection.ri-premium-design #riPremiumRoot > h1 + p {
        display: none;
      }

      #premiumSection.ri-premium-design #rpMaster,
      #premiumSection.ri-premium-design .ri-guest-card,
      #premiumSection.ri-premium-design .ri-developer-card,
      #premiumSection.ri-premium-design .ri-developer-test,
      #premiumSection.ri-premium-design .rp-grid,
      #premiumSection.ri-premium-design #rpSharedToken {
        min-width: 0;
        margin: 0 !important;
        padding: 20px !important;
        border: 1px solid var(--ri-line) !important;
        border-radius: 15px !important;
        background: #071a13 !important;
        box-shadow: none !important;
      }

      #premiumSection.ri-premium-design #rpMaster {
        grid-column: 1 / -1;
        grid-row: 1;
        display: block;
      }

      #premiumSection.ri-premium-design .ri-guest-card {
        grid-column: 1;
        grid-row: 2;
      }

      #premiumSection.ri-premium-design .ri-developer-card {
        grid-column: 2;
        grid-row: 2;
      }

      #premiumSection.ri-premium-design .ri-developer-test {
        grid-column: 1 / -1;
        grid-row: 3;
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }

      #premiumSection.ri-premium-design .rp-grid {
        grid-column: 1 / -1;
        grid-row: 4;
        display: block !important;
      }

      #premiumSection.ri-premium-design #rpSharedToken {
        grid-column: 1 / -1;
        grid-row: 5;
      }

      #premiumSection.ri-premium-design #rpMessage,
      #premiumSection.ri-premium-design #rpEmpty,
      #premiumSection.ri-premium-design .rp-tool {
        grid-column: 1 / -1;
        margin: 0;
      }

      #premiumSection.ri-premium-design h2,
      #premiumSection.ri-premium-design h3 {
        margin: 0 0 16px !important;
        color: #f0f8f4;
        font-size: 19px !important;
        line-height: 1.3;
      }

      #premiumSection.ri-premium-design p,
      #premiumSection.ri-premium-design small {
        color: var(--ri-muted);
        line-height: 1.5;
      }

      #premiumSection.ri-premium-design button,
      #premiumSection.ri-premium-design input {
        font: inherit;
      }

      #premiumSection.ri-premium-design button {
        min-height: 36px;
        padding: 8px 16px;
        border: 1px solid #39846a;
        border-radius: 9px;
        background: transparent;
        color: #b5ffe0;
        cursor: pointer;
      }

      #premiumSection.ri-premium-design button:disabled,
      #premiumSection.ri-premium-design input:disabled {
        opacity: .5;
        cursor: not-allowed;
      }

      #premiumSection.ri-premium-design button:focus-visible,
      #premiumSection.ri-premium-design input:focus-visible {
        outline: 2px solid var(--ri-accent);
        outline-offset: 4px;
      }

      #premiumSection.ri-premium-design input[type="text"],
      #premiumSection.ri-premium-design input[type="number"],
      #premiumSection.ri-premium-design #rpTokenCA {
        box-sizing: border-box;
        min-width: 0;
        min-height: 38px;
        padding: 8px 12px;
        border: 1px solid #32664f;
        border-radius: 8px;
        background: #05140e;
        color: #edf8f2;
      }

      #premiumSection.ri-premium-design input[type="checkbox"] {
        appearance: none !important;
        -webkit-appearance: none !important;
        flex: 0 0 44px;
        width: 44px !important;
        height: 24px !important;
        min-height: 24px !important;
        margin: 0 !important;
        padding: 0 !important;
        border: 1px solid #52665c !important;
        border-radius: 99px !important;
        background: #45554d !important;
        cursor: pointer;
        position: relative;
        vertical-align: middle;
      }

      #premiumSection.ri-premium-design input[type="checkbox"]::after {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: white;
        transition: transform .15s ease;
      }

      #premiumSection.ri-premium-design input[type="checkbox"]:checked {
        border-color: var(--ri-accent) !important;
        background: var(--ri-accent) !important;
      }

      #premiumSection.ri-premium-design input[type="checkbox"]:checked::after {
        transform: translateX(20px);
      }

      #premiumSection.ri-premium-design .ri-website-row {
        display: flex;
        align-items: center;
        gap: 16px;
        padding-bottom: 15px;
        border-bottom: 1px solid var(--ri-line);
      }

      #premiumSection.ri-premium-design #rpMasterState {
        margin: 0;
        padding: 3px 10px;
        border: 1px solid var(--ri-line);
        border-radius: 6px;
        color: var(--ri-accent);
        font-size: 12px;
      }

      #premiumSection.ri-premium-design [data-toggle="premium"] {
        margin-left: auto;
      }

      #premiumSection.ri-premium-design .ri-history-row {
        display: flex !important;
        align-items: center;
        flex-wrap: wrap;
        gap: 14px 24px;
        margin-top: 15px !important;
        padding: 0 !important;
        border: 0 !important;
      }

      #premiumSection.ri-premium-design .ri-history-row label {
        display: flex !important;
        align-items: center;
        flex-direction: row-reverse;
        gap: 14px;
        margin: 0 !important;
      }

      #premiumSection.ri-premium-design .ri-history-row small {
        flex-basis: 100%;
        order: 5;
      }

      #premiumSection.ri-premium-design #rpRefresh {
        margin: 0 0 0 auto !important;
      }

      #premiumSection.ri-premium-design .ri-guest-card > label {
        display: flex !important;
        align-items: center;
        gap: 16px;
        padding: 14px 0;
        margin: 0 !important;
        border-bottom: 1px solid var(--ri-line);
      }

      #premiumSection.ri-premium-design .ri-guest-card .ri-label-text {
        order: 0;
        font-weight: 600;
      }

      #premiumSection.ri-premium-design .ri-credit {
        order: 1;
        margin-left: auto;
        font-size: 13px;
      }

      #premiumSection.ri-premium-design .ri-guest-card input {
        order: 2;
      }

      #premiumSection.ri-premium-design .ri-developer-columns,
      #premiumSection.ri-premium-design .dh-settings {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) 60px 105px;
        align-items: center;
        gap: 12px;
      }

      #premiumSection.ri-premium-design .ri-developer-columns {
        padding-bottom: 8px;
        color: var(--ri-muted);
        font-size: 10px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      #premiumSection.ri-premium-design .dh-settings {
        margin: 0 !important;
        padding: 8px 0 !important;
        border: 0 !important;
        border-top: 1px solid var(--ri-line) !important;
      }

      #premiumSection.ri-premium-design .dh-settings > label:first-child {
        grid-column: 1 / 3;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 60px;
        align-items: center;
        gap: 12px;
        margin: 0;
        font-size: 13px;
      }

      #premiumSection.ri-premium-design .dh-settings > label:first-child input {
        grid-column: 2;
        grid-row: 1;
      }

      #premiumSection.ri-premium-design .dh-settings .ri-label-text {
        grid-column: 1;
        grid-row: 1;
      }

      #premiumSection.ri-premium-design .dh-settings > label:last-child {
        grid-column: 3;
        margin: 0;
        font-size: 0;
      }

      #premiumSection.ri-premium-design .dh-settings input[type="number"] {
        width: 100%;
        font-size: 14px;
      }

      #premiumSection.ri-premium-design .ri-developer-actions {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 12px;
      }

      #premiumSection.ri-premium-design .ri-developer-actions p {
        margin: 0;
        font-size: 12px;
      }

      #premiumSection.ri-premium-design [data-save],
      #premiumSection.ri-premium-design #rpTokenForm button {
        border-color: var(--ri-accent);
        background: var(--ri-accent);
        color: #03140c;
        font-weight: 700;
      }

      #premiumSection.ri-premium-design .ri-developer-note {
        margin: 10px 0 0;
        font-size: 12px;
      }

      #premiumSection.ri-premium-design .ri-developer-test > label {
        flex: 1;
        display: flex;
        align-items: center;
        flex-direction: row-reverse;
        gap: 20px;
        margin: 0;
      }

      #premiumSection.ri-premium-design .ri-developer-test .ri-label-text {
        flex: 0 0 180px;
        font-weight: 600;
      }

      #premiumSection.ri-premium-design [data-mint] {
        flex: 1;
        width: 100%;
      }

      #premiumSection.ri-premium-design [data-preview-root] {
        flex-basis: 100%;
        min-width: 0;
      }

      #premiumSection.ri-premium-design [data-preview-root]:empty {
        display: none;
      }

      #premiumSection.ri-premium-design .ri-tool-columns,
      #premiumSection.ri-premium-design .rp-card {
        display: grid !important;
        grid-template-columns: 1.35fr 2.1fr .85fr .85fr;
        align-items: center;
        gap: 16px;
      }

      #premiumSection.ri-premium-design .ri-tool-columns {
        padding: 0 0 10px;
        color: var(--ri-muted);
        font-size: 10px;
        letter-spacing: 1px;
        text-transform: uppercase;
      }

      #premiumSection.ri-premium-design .ri-tool-columns span:nth-child(n+3) {
        text-align: center;
      }

      #premiumSection.ri-premium-design .rp-card {
        padding: 10px 0 !important;
        margin: 0 !important;
        border: 0 !important;
        border-top: 1px solid var(--ri-line) !important;
        border-radius: 0 !important;
        background: transparent !important;
        box-shadow: none !important;
      }

      #premiumSection.ri-premium-design .rp-card > h3 {
        display: none;
      }

      #premiumSection.ri-premium-design .rp-card > [data-open] {
        grid-column: 1;
        grid-row: 1;
        min-height: 32px;
        padding: 0;
        border: 0;
        background: transparent;
        color: #edf8f2;
        font-weight: 600;
        text-align: left;
      }

      #premiumSection.ri-premium-design .rp-card > p {
        grid-column: 2;
        grid-row: 1;
        margin: 0 !important;
        font-size: 13px;
      }

      #premiumSection.ri-premium-design .rp-card > .rp-controls {
        grid-column: 3 / 5;
        grid-row: 1;
        display: grid !important;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
      }

      #premiumSection.ri-premium-design .rp-card .rp-controls label {
        display: flex !important;
        justify-content: center;
        margin: 0 !important;
      }

      #premiumSection.ri-premium-design .rp-card .ri-label-text {
        position: absolute;
        width: 1px;
        height: 1px;
        overflow: hidden;
        clip-path: inset(50%);
      }

      #premiumSection.ri-premium-design #rpTokenForm {
        display: flex !important;
        align-items: center;
        flex-wrap: wrap;
        gap: 16px;
      }

      #premiumSection.ri-premium-design .ri-token-title {
        flex: 0 0 180px;
        font-weight: 600;
      }

      #premiumSection.ri-premium-design #rpTokenCA {
        flex: 1;
        width: auto;
      }

      #premiumSection.ri-premium-design #rpTokenMessage {
        margin: 10px 0 0 !important;
        font-size: 12px;
      }

      @media (max-width: 1100px) {
        #premiumSection.ri-premium-design {
          grid-template-columns: minmax(0, 1fr);
        }

        #premiumSection.ri-premium-design .ri-guest-card,
        #premiumSection.ri-premium-design .ri-developer-card,
        #premiumSection.ri-premium-design .ri-developer-test,
        #premiumSection.ri-premium-design .rp-grid,
        #premiumSection.ri-premium-design #rpSharedToken {
          grid-column: 1;
          grid-row: auto;
        }

        #premiumSection.ri-premium-design .ri-guest-card { order: 2; }
        #premiumSection.ri-premium-design .ri-developer-card { order: 3; }
        #premiumSection.ri-premium-design .ri-developer-test { order: 4; }
        #premiumSection.ri-premium-design .rp-grid { order: 5; }
        #premiumSection.ri-premium-design #rpSharedToken { order: 6; }
        #premiumSection.ri-premium-design .rp-tool { order: 7; }
      }

      @media (max-width: 680px) {
        #premiumSection.ri-premium-design .ri-tool-columns {
          display: none;
        }

        #premiumSection.ri-premium-design .rp-card {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          gap: 10px;
        }

        #premiumSection.ri-premium-design .rp-card > [data-open] {
          grid-column: 1 / -1;
        }

        #premiumSection.ri-premium-design .rp-card > p {
          grid-column: 1 / -1;
          grid-row: 2;
        }

        #premiumSection.ri-premium-design .rp-card > .rp-controls {
          grid-column: 1 / -1;
          grid-row: 3;
        }

        #premiumSection.ri-premium-design .rp-card .rp-controls label {
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
        }

        #premiumSection.ri-premium-design .rp-card .ri-label-text {
          position: static;
          width: auto;
          height: auto;
          overflow: visible;
          clip-path: none;
          font-size: 12px;
        }

        #premiumSection.ri-premium-design .ri-developer-test > label {
          flex-basis: 100%;
          align-items: stretch;
          flex-direction: column-reverse;
          gap: 10px;
        }

        #premiumSection.ri-premium-design .ri-developer-test .ri-label-text,
        #premiumSection.ri-premium-design .ri-token-title {
          flex-basis: auto;
        }

        #premiumSection.ri-premium-design .ri-token-title {
          width: 100%;
        }

        #premiumSection.ri-premium-design #rpTokenCA {
          flex-basis: 100%;
        }

        #premiumSection.ri-premium-design .ri-credit {
          font-size: 11px;
        }
      }
    `;

    document.head.append(style);

    const observer = new MutationObserver(refreshAppearance);

    observer.observe(section, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-checked"]
    });

    refreshAppearance();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();