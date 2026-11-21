(() => {
  "use strict";

  function init() {
    const root =
      document.getElementById(
        "riPremiumRoot"
      );

    const panel = root?.querySelector(
      '[data-tool="smart_money"]'
    );

    if (
      !panel ||
      panel.dataset.smartReady
    ) {
      return;
    }

    panel.dataset.smartReady = "1";

    const API =
      "https://bagvyr-api.megafunhousetv.workers.dev";

    const periods = [
      "5m",
      "1h",
      "4h",
      "24h"
    ];

    const cache = new Map();

    let period = "1h";
    let current = null;
    let shownPeriod = "";
    let retryAt = 0;
    let wasActive = false;

    let imageWorkers = 0;

    const imageQueue = [];

    const style =
      document.createElement("style");

    style.textContent = `
      body #riPremiumRoot [data-card="smart_money"] {
        --rp-icon: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='1.6' stroke-linecap='round'%3E%3Ccircle cx='12' cy='12' r='9'/%3E%3Ccircle cx='12' cy='12' r='5'/%3E%3Cpath d='M12 12 20 4'/%3E%3Ccircle cx='12' cy='12' r='1' fill='white'/%3E%3C/svg%3E");
      }

      body #riPremiumRoot [data-tool="smart_money"] {
        border: 0;
        padding: 0;
        margin-top: 20px;
        min-width: 0;
      }

      body #riPremiumRoot .sm-card {
        border: 1px solid #214b3c;
        border-radius: 16px;
        padding: 26px;
        background: rgba(3, 19, 14, .95);
        color: #ecfff6;
      }

      body #riPremiumRoot .sm-heading,
      body #riPremiumRoot .sm-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        flex-wrap: wrap;
      }

      body #riPremiumRoot .sm-heading h2 {
        margin: 0;
        font-size: 28px;
        letter-spacing: -.7px;
      }

      body #riPremiumRoot .sm-card p {
        color: #a4bdb2;
        font-size: 13px;
      }

      body #riPremiumRoot .sm-chain {
        border: 1px solid #245442;
        border-radius: 20px;
        padding: 5px 13px;
        font-size: 12px;
        color: #59efbf;
      }

      body #riPremiumRoot .sm-toolbar {
        margin: 24px 0 14px;
      }

      body #riPremiumRoot .sm-periods {
        display: flex;
        padding: 4px;
        border: 1px solid #244b3d;
        border-radius: 12px;
      }

      body #riPremiumRoot .sm-periods button {
        padding: 8px 17px;
        border: 0;
        background: transparent;
        color: #acc9bb;
        border-radius: 8px;
      }

      body #riPremiumRoot
      .sm-periods button[aria-pressed="true"] {
        background: #27e5ad;
        color: #032418;
        font-weight: 750;
      }

      body #riPremiumRoot .sm-status {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      body #riPremiumRoot .sm-status small {
        font-size: 12px;
        color: #a4bdb2;
      }

      body #riPremiumRoot .sm-refresh {
        width: 40px;
        height: 38px;
        padding: 0;
        border-color: #245442;
        background: #08291e;
        color: #4ce9b6;
        font-size: 23px;
      }

      body #riPremiumRoot .sm-message {
        margin: 10px 0;
      }

      body #riPremiumRoot .sm-message:empty {
        display: none;
      }

      body #riPremiumRoot .sm-wrap {
        overflow-x: auto;
        border: 1px solid #1c3c30;
        border-radius: 12px;
      }

      body #riPremiumRoot .sm-table {
        width: 100%;
        border-collapse: collapse;
        white-space: nowrap;
      }

      body #riPremiumRoot .sm-table th,
      body #riPremiumRoot .sm-table td {
        padding: 15px 12px;
        text-align: left;
        border: 0;
        border-bottom: 1px solid #1a382c;
        font-size: 13px;
        background: transparent;
      }

      body #riPremiumRoot .sm-table th {
        color: #a8c7b7;
        font-size: 11px;
        font-weight: 600;
      }

      body #riPremiumRoot
      .sm-table tr:last-child td {
        border-bottom: 0;
      }

      body #riPremiumRoot
      .sm-table tbody tr:hover {
        background: rgba(34, 226, 164, .035);
      }

      body #riPremiumRoot .sm-token {
        display: flex;
        align-items: center;
        gap: 11px;
        min-width: 190px;
      }

      body #riPremiumRoot .sm-avatar {
        position: relative;
        display: grid;
        place-items: center;
        flex: 0 0 38px;
        width: 38px;
        height: 38px;
        border: 1px solid #315445;
        border-radius: 50%;
        overflow: hidden;
        background: #12281e;
        color: #79d5b4;
      }

      body #riPremiumRoot .sm-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      body #riPremiumRoot .sm-token-top {
        display: flex;
        align-items: center;
        gap: 9px;
      }

      body #riPremiumRoot .sm-name {
        max-width: 155px;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 13px;
      }

      body #riPremiumRoot .sm-address {
        display: block;
        color: #8da89a;
        font-size: 10px;
        margin-top: 3px;
      }

      body #riPremiumRoot button.sm-copy {
        padding: 2px 0;
        background: none;
        border: 0;
        color: #a8c7b7;
        font-size: 10px;
        white-space: nowrap;
      }

      body #riPremiumRoot .sm-buyers {
        color: #43efb5;
        font-size: 17px;
        font-weight: 750;
      }

      body #riPremiumRoot .sm-positive {
        color: #43efb5;
        font-weight: 650;
      }

      body #riPremiumRoot .sm-negative {
        color: #ff7885;
        font-weight: 650;
      }

      body #riPremiumRoot a.sm-analyze {
        display: inline-block;
        border: 1px solid #2ce2a7;
        border-radius: 8px;
        padding: 7px 12px;
        color: #49efbd;
        text-decoration: none;
        font-size: 12px;
      }

      body #riPremiumRoot .sm-footer {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        flex-wrap: wrap;
        padding-top: 14px;
        color: #91ad9e;
        font-size: 11px;
      }

      @media (min-width: 1200px) {
        body #riPremiumRoot .rp-grid {
          grid-template-columns:
            repeat(6, minmax(0, 1fr));
        }

        body #riPremiumRoot
        [data-card="smart_money"] > h3 {
          font-size: 14px;
        }
      }

      @media (max-width: 700px) {
        body #riPremiumRoot .sm-card {
          padding: 18px 14px;
        }

        body #riPremiumRoot .sm-heading h2 {
          font-size: 23px;
        }

        body #riPremiumRoot .sm-toolbar {
          gap: 12px;
        }

        body #riPremiumRoot .sm-status {
          width: 100%;
          justify-content: space-between;
        }

        body #riPremiumRoot .sm-table,
        body #riPremiumRoot .sm-table tbody {
          display: block;
        }

        body #riPremiumRoot .sm-table thead {
          display: none;
        }

        body #riPremiumRoot .sm-table tr {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 13px;
          padding: 16px 12px;
          border-bottom: 1px solid #244333;
        }

        body #riPremiumRoot .sm-table td {
          padding: 0;
          border: 0;
          white-space: normal;
        }

        body #riPremiumRoot
        .sm-table td:first-child {
          display: none;
        }

        body #riPremiumRoot
        .sm-table td:nth-child(2),
        body #riPremiumRoot
        .sm-table td:last-child {
          grid-column: 1 / -1;
        }

        body #riPremiumRoot
        .sm-table td[data-label]::before {
          content: attr(data-label);
          display: block;
          color: #91ad9e;
          font-size: 10px;
          margin-bottom: 3px;
        }

        body #riPremiumRoot a.sm-analyze {
          display: block;
          text-align: center;
        }

        body #riPremiumRoot .sm-name {
          max-width: 190px;
        }
      }
    `;

    style.textContent += `
      body #riPremiumRoot .sm-heading {
        position: relative;
        isolation: isolate;
        overflow: hidden;
        min-height: 150px;
        box-sizing: border-box;
        padding: 24px;
        margin-bottom: 20px;
        border: 1px solid rgba(42, 220, 164, .2);
        border-radius: 18px;

        background:
          radial-gradient(
            circle at 85% 50%,
            rgba(0, 224, 164, .09),
            transparent 42%
          ),
          linear-gradient(115deg, #061c15, #03110d);
      }

      body #riPremiumRoot
      .sm-heading > div:not(.sm-radar) {
        position: relative;
        z-index: 1;
        max-width: calc(100% - 200px);
      }

      body #riPremiumRoot .sm-radar {
        position: absolute;
        z-index: 0;
        right: 18px;
        top: 50%;
        width: 210px;
        height: 210px;
        transform: translateY(-50%);
        border: 1px solid rgba(31, 231, 173, .22);
        border-radius: 50%;
        pointer-events: none;

        background:
          linear-gradient(
            transparent calc(50% - .5px),
            rgba(36, 224, 168, .18) 50%,
            transparent calc(50% + .5px)
          ),
          linear-gradient(
            90deg,
            transparent calc(50% - .5px),
            rgba(36, 224, 168, .18) 50%,
            transparent calc(50% + .5px)
          ),
          repeating-radial-gradient(
            circle,
            transparent 0 25px,
            rgba(36, 224, 168, .22) 26px,
            transparent 27px 52px
          );

        box-shadow:
          inset 0 0 45px rgba(0, 226, 162, .04),
          0 0 50px rgba(0, 226, 162, .04);
      }

      body #riPremiumRoot .sm-radar::before {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;

        background: conic-gradient(
          from 0deg,
          transparent 0deg 292deg,
          rgba(0, 236, 173, .02) 300deg,
          rgba(0, 236, 173, .2) 350deg,
          rgba(36, 255, 195, .65) 359deg,
          transparent 360deg
        );

        animation: ri-smart-radar-turn 20s linear infinite;
      }

      body #riPremiumRoot .sm-radar::after {
        content: "";
        position: absolute;
        left: calc(50% - 3px);
        top: calc(50% - 3px);
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #34f5bf;
        box-shadow:
          0 0 12px rgba(52, 245, 191, .8),
          43px -48px 0 -1px #34f5bf,
          -57px 28px 0 -1px #34f5bf,
          24px 65px 0 -1px #34f5bf;
      }

      @keyframes ri-smart-radar-turn {
        from { transform: rotate(0deg); }
        to   { transform: rotate(360deg); }
      }

      @media (max-width: 700px) {
        body #riPremiumRoot .sm-heading {
          min-height: 130px;
          padding: 20px;
        }

        body #riPremiumRoot
        .sm-heading > div:not(.sm-radar) {
          max-width: 100%;
        }

        body #riPremiumRoot .sm-radar {
          right: -60px;
          opacity: .2;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        body #riPremiumRoot .sm-radar::before {
          animation: none;
        }
      }
    `;

    const smScope =
  'body #riPremiumRoot [data-tool="smart_money"].sm-v2';

style.textContent += `
  body #riPremiumRoot.ri-embedded-smart-view.ri-smart-v2-open {
    padding: 0;
    border: 0;
    background: transparent;
  }

  body #riPremiumRoot.ri-embedded-smart-view.ri-smart-v2-open .ri-embedded-heading {
    display: none;
  }

  ${smScope} {
    margin-top: 0;
  }

  ${smScope} .sm-card {
    padding: 10px 0 22px;
    border: 0;
    background: transparent;
    box-shadow: none;
  }

  ${smScope} .sm-heading {
    min-height: 165px;
    padding: 22px 28px;
    margin-bottom: 22px;
    border: 0;
    border-left: 3px solid #26e8b0;
    border-radius: 0;
    background: radial-gradient(
      ellipse at right,
      #0b39263b,
      transparent 65%
    );
  }

  ${smScope} .sm-kicker {
    display: block;
    margin-bottom: 10px;
    color: #43edba;
    font-size: 10px;
    font-weight: 750;
    letter-spacing: 2px;
  }

  ${smScope} .sm-heading h2 {
    font-size: clamp(30px, 3.5vw, 46px);
    font-weight: 800;
  }

  ${smScope} .sm-radar {
    width: 230px;
    height: 230px;
    right: 45px;
    box-shadow: 0 0 35px #13dd9f12;
  }

  ${smScope} .sm-summary {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  ${smScope} .sm-summary-card {
    position: relative;
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
    min-height: 104px;
    overflow: hidden;
    padding: 18px 20px;
    border: 1px solid #245b44;
    border-radius: 16px;

    background:
      radial-gradient(
        ellipse at bottom right,
        #0c5e3e75,
        transparent 65%
      ),
      #041d15;
  }

  ${smScope} .sm-summary-card::after {
    content: "";
    position: absolute;
    right: -36px;
    bottom: -62px;
    width: 155px;
    height: 100px;
    border: 1px solid #32e9b449;
    border-radius: 50%;
    transform: rotate(-25deg);

    box-shadow:
      0 -6px 15px #1fe3a81a,
      0 -15px 0 -12px #2ceeb252;

    pointer-events: none;
  }

  ${smScope} .sm-summary-icon {
    display: grid;
    place-items: center;
    flex: 0 0 44px;
    width: 44px;
    height: 44px;
    border: 1px solid #176f51;
    border-radius: 50%;
    background: #07533266;
    color: #66ffd0;
    font-size: 26px;
  }

  ${smScope} .sm-summary-card small {
    display: block;
    margin-bottom: 5px;
    color: #aec9ba;
    font-size: 12px;
  }

  ${smScope} .sm-summary-card strong {
    display: block;
    color: #effff6;
    font-size: clamp(22px, 2.8vw, 34px);
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }

  ${smScope} [data-sm-total="flow"] {
    color: #3af3bc;
  }

  ${smScope} [data-sm-total="flow"].sm-negative {
    color: #ff858d;
  }

  ${smScope} .sm-toolbar {
    margin: 0 0 18px;
  }

  ${smScope} .sm-chain-v2 {
    margin-left: auto;
    padding: 7px 12px;
    border: 1px solid #245b44;
    border-radius: 999px;
  }

  ${smScope} .sm-card .sm-table {
    border-collapse: separate;
    border-spacing: 0;
  }

  ${smScope} .sm-card .sm-table tbody td {
    padding: 18px 14px;
    border: 0;
    border-bottom: 1px solid #183d2e;
    border-radius: 0;
    background: #031a12;
    font-variant-numeric: tabular-nums;
  }

  ${smScope} .sm-card .sm-table tbody tr:first-child td {
    background: linear-gradient(
      180deg,
      #083d2b,
      #042519
    );

    border-top: 1px solid #237a57;
  }

  ${smScope} .sm-card .sm-table tbody tr:first-child td:first-child {
    border-radius: 14px 0 0 14px;
    box-shadow: inset 4px 0 #32edb6;
  }

  ${smScope} .sm-card .sm-table tbody tr:first-child td:last-child {
    border-radius: 0 14px 14px 0;
  }

  ${smScope} .sm-card .sm-table tbody tr:hover td {
    background: #0a3023;
  }

  ${smScope} .sm-buy-badge {
    display: none;
  }

  ${smScope} .sm-name {
    max-width: 190px;
    font-size: 16px;
  }

  ${smScope} .sm-buyer-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 48px;
    padding: 6px 12px;
    border: 1px solid #1b7051;
    border-radius: 10px;
    background: #07553655;
    color: #70ffd0;
    font-size: 15px;
    font-weight: 750;
  }

  ${smScope} .sm-flow-value {
    display: block;
    font-size: 16px;
  }

  ${smScope} .sm-flow-track {
    display: block;
    width: 112px;
    height: 6px;
    margin-top: 8px;
    overflow: hidden;
    border-radius: 999px;
    background: #163d2e;
  }

  ${smScope} .sm-flow-track > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(
      90deg,
      #24db9f,
      #68ffd0
    );
  }

  ${smScope} .sm-negative .sm-flow-track {
    background: #402723;
  }

  ${smScope} .sm-negative .sm-flow-track > span {
    background: #ff858d;
  }

  ${smScope} .sm-live-mc {
    color: #edfff4;
    font-size: 15px;
  }

  ${smScope} .sm-mc-stale {
    opacity: .6;
  }

  ${smScope}[data-sm-solana-only="true"] .sm-table th:nth-child(3),
  ${smScope}[data-sm-solana-only="true"] .sm-table td:nth-child(3) {
    display: none;
  }

  @media (max-width: 700px) {
    ${smScope} .sm-summary {
      grid-template-columns: 1fr;
      gap: 9px;
    }

    ${smScope} .sm-summary-card {
      min-height: 76px;
      padding: 14px 16px;
    }

    ${smScope} .sm-heading {
      min-height: 135px;
      padding: 16px;
    }

    ${smScope} .sm-heading > div:not(.sm-radar) {
      max-width: 100%;
    }

    ${smScope} .sm-radar {
      right: -80px;
      opacity: .18;
    }

    ${smScope} .sm-chain-v2 {
      margin-left: 0;
    }

    ${smScope} .sm-card .sm-table tbody tr td,
    ${smScope} .sm-card .sm-table tbody tr:first-child td,
    ${smScope} .sm-card .sm-table tbody tr:hover td {
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }

    ${smScope} .sm-card .sm-table tbody tr:first-child {
      border-color: #268b60;
      background: #073022;
    }
  }
`;

    document.head.append(style);

    panel.innerHTML = `
      <div class="sm-card">
        <div class="sm-heading">
          <div>
            <h2>
              Smart Money <span class="sm-accent">Radar</span>
            </h2>

            <p>
              Follow accumulation. Spot the next move.
            </p>
          </div>

          <div class="sm-radar" aria-hidden="true"></div>
        </div>

        <div class="sm-toolbar">
          <div
            class="sm-periods"
            aria-label="Time period"
          >
            ${periods.map(p => `
              <button
                type="button"
                data-period="${p}"
                aria-pressed="${p === period}"
              >
                ${p}
              </button>
            `).join("")}
          </div>

          <div class="sm-status">
            <small data-updated>
              Not loaded yet
            </small>

            <button
              type="button"
              class="sm-refresh"
              aria-label="Refresh Smart Money"
            >
              ↻
            </button>
          </div>
        </div>

        <p
          class="sm-message"
          role="status"
          aria-live="polite"
        ></p>

        <div class="sm-wrap" hidden>
          <table class="sm-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Token</th>
                <th>Network</th>
                <th>SM Buyers ↓</th>
                <th>Buy Trades</th>
                <th>Net Inflow</th>
                <th>Market Cap</th>
                <th></th>
              </tr>
            </thead>

            <tbody></tbody>
          </table>
        </div>

        <div class="sm-footer">
          <span>
            Each buying wallet counts once.
            Sellers-only are excluded.
            <br>
            Counts cover returned tracked addresses.
          </span>

          <span>
            Refreshes every minute.
          </span>
        </div>
      </div>
    `;

    const tbody =
      panel.querySelector("tbody");

    const wrap =
      panel.querySelector(".sm-wrap");

    const message =
      panel.querySelector(".sm-message");

    const updated =
      panel.querySelector("[data-updated]");

    const refresh =
      panel.querySelector(".sm-refresh");

    const active = () =>
      window.RI_PREMIUM?.isActive(
        "smart_money"
      ) === true;

      const smartHelpText = {
  "SM Buyers":
    "The number of unique tracked Smart Money wallets that bought this token during the selected period. Each wallet counts once, even if it made multiple purchases. Wallets that only sold are excluded. Counts cover the tracked addresses returned in the data.",

  "Buy Trades":
    "The total number of buy trades made by tracked Smart Money wallets during the selected period. One wallet can make several purchases, so this number may be higher than SM Buyers.",

  "Net Inflow":
    "The USD value bought minus the USD value sold by tracked Smart Money wallets during the selected period. A positive value means buying exceeded selling. A negative value means selling exceeded buying."
};

style.textContent += `
  body #riPremiumRoot button.sm-help-star {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 24px;
    height: 24px;
    margin-left: 5px;
    padding: 0;

    border: 1px solid rgba(67, 239, 181, .3);
    border-radius: 50%;

    background: rgba(67, 239, 181, .07);
    color: #43efb5;

    font-size: 17px;
    font-weight: 700;
    line-height: 1;

    cursor: pointer;
    vertical-align: middle;
  }

  body #riPremiumRoot
  button.sm-help-star[aria-expanded="true"] {
    background: #27e5ad;
    color: #032418;
  }

  body #riPremiumRoot
  button.sm-help-star:focus-visible {
    outline: 2px solid #43efb5;
    outline-offset: 3px;
  }

  body #riPremiumRoot .sm-help-box {
    position: relative;

    margin: 0 0 16px;
    padding: 17px 48px 17px 18px;

    border: 1px solid #2c6850;
    border-radius: 12px;

    background: #0b291e;
  }

  body #riPremiumRoot .sm-help-box strong {
    color: #54efbd;
    font-size: 14px;
  }

  body #riPremiumRoot .sm-help-box p {
    margin: 7px 0 0;
    color: #c1d8cc;
    font-size: 13px;
    line-height: 1.7;
  }

  body #riPremiumRoot button.sm-help-close {
    position: absolute;
    top: 10px;
    right: 10px;

    width: 28px;
    height: 28px;
    padding: 0;

    border: 0;
    background: transparent;
    color: #b8d8c8;

    font-size: 22px;
    line-height: 1;
  }

  body #riPremiumRoot
  .sm-table td .sm-help-star {
    display: none;
  }

  @media (max-width: 700px) {
    body #riPremiumRoot
    .sm-table td .sm-help-star {
      display: inline-flex;
    }
  }
`;

style.textContent += `
  body #riPremiumRoot
  [data-tool="smart_money"] .sm-table thead {
    background: rgba(14, 39, 29, .65);
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-table thead th {
    height: 64px;
    padding: 16px 14px;

    border-bottom: 1px solid #28513f;

    color: #c0d6c9;
    font-size: 12px;
    font-weight: 650;
    line-height: 1.4;

    vertical-align: middle;
    white-space: nowrap;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-table thead th:nth-child(3) {
    color: #56e8b6;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  button.sm-help-star {
    display: inline-flex;
    align-items: center;
    justify-content: center;

    width: 22px;
    height: 22px;
    margin-left: 7px;
    padding: 2px 0 0;

    border: 1px solid rgba(130, 181, 156, .3);
    border-radius: 7px;

    background: rgba(134, 199, 165, .04);
    color: #9fc7b2;

    font-family: inherit;
    font-size: 16px;
    font-weight: 600;
    line-height: 1;

    vertical-align: middle;
    box-shadow: none;

    transition:
      color 150ms ease,
      border-color 150ms ease,
      background 150ms ease;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  button.sm-help-star:hover {
    border-color: #43dca7;
    background: rgba(43, 220, 159, .1);
    color: #72f0c2;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  button.sm-help-star[aria-expanded="true"] {
    border-color: #43dca7;
    background: rgba(43, 220, 159, .14);
    color: #72f0c2;

    box-shadow:
      0 0 0 2px rgba(43, 220, 159, .05);
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-help-box {
    position: relative;

    margin: 0 0 18px;
    padding: 20px 52px 20px 22px;

    border: 1px solid #2b5040;
    border-left: 3px solid #36dfa5;
    border-radius: 12px;

    background:
      linear-gradient(
        110deg,
        rgba(15, 47, 34, .96),
        rgba(7, 28, 20, .98)
      );

    box-shadow:
      0 8px 24px rgba(0, 0, 0, .12);
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-help-box strong {
    display: block;

    margin: 0 0 8px;

    color: #66edbc;
    font-size: 14px;
    font-weight: 700;
    line-height: 1.4;
    letter-spacing: .1px;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-help-box p {
    max-width: 92ch;
    margin: 0;

    color: #b9cec1;
    font-size: 13px;
    font-weight: 400;
    line-height: 1.75;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  button.sm-help-close {
    top: 13px;
    right: 13px;

    display: grid;
    place-items: center;

    width: 28px;
    height: 28px;
    padding: 0;

    border: 1px solid rgba(143, 186, 161, .16);
    border-radius: 8px;

    background: rgba(255, 255, 255, .025);
    color: #9db9a8;

    font-size: 20px;
    line-height: 1;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  button.sm-help-close:hover {
    background: rgba(67, 239, 181, .08);
    color: #e4fff0;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-table td .sm-help-star {
    display: none;
  }

  @media (max-width: 700px) {
    body #riPremiumRoot
    [data-tool="smart_money"] .sm-help-box {
      padding: 17px 46px 17px 17px;
    }

    body #riPremiumRoot
    [data-tool="smart_money"]
    .sm-help-box p {
      font-size: 12px;
      line-height: 1.7;
    }

    body #riPremiumRoot
    [data-tool="smart_money"]
    .sm-table td .sm-help-star {
      display: inline-flex;
      width: 26px;
      height: 26px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    body #riPremiumRoot
    [data-tool="smart_money"]
    button.sm-help-star {
      transition: none;
    }
  }
`;

style.textContent += `
  body #riPremiumRoot
  [data-tool="smart_money"] .sm-card {
    padding: 22px;
    border-radius: 22px;
    background:
      radial-gradient(
        ellipse at top right,
        rgba(0, 220, 157, .045),
        transparent 60%
      ),
      rgba(2, 17, 12, .97);
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-accent {
    color: #32eebb;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-heading h2 {
    font-size: clamp(26px, 3vw, 40px);
    letter-spacing: -1.2px;
    line-height: 1.15;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-heading p {
    margin-bottom: 0;
    font-size: 14px;
    line-height: 1.6;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-periods {
    border-radius: 15px;
    background: rgba(0, 0, 0, .16);
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-periods button {
    min-width: 64px;
    padding: 12px 18px;
    border-radius: 11px;
    cursor: pointer;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-periods button[aria-pressed="true"] {
    background: linear-gradient(135deg, #35f0bf, #10dca2);
    box-shadow: 0 0 18px rgba(20, 230, 169, .13);
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-refresh {
    width: 43px;
    height: 43px;
    border-radius: 50%;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-wrap {
    border: 0;
    border-radius: 0;
    background: transparent;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-card .sm-table {
    border-collapse: separate;
    border-spacing: 0 9px;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-card .sm-table thead {
    background: transparent;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-card .sm-table thead th {
    height: auto;
    padding: 15px 14px;
    border: 0;
    background: transparent;
    color: #b7cfc3;
    font-size: 12px;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-card .sm-table thead th:nth-child(4) {
    color: #32eebb;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-card .sm-table tbody td {
    padding: 20px 14px;
    border-top: 1px solid #174536;
    border-bottom: 1px solid #174536;
    background: #041b13;
    font-size: 14px;
    transition: background 180ms ease;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-card .sm-table tbody td:first-child {
    border-left: 1px solid #174536;
    border-radius: 14px 0 0 14px;
    color: #91b9a7;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-card .sm-table tbody td:last-child {
    border-right: 1px solid #174536;
    border-radius: 0 14px 14px 0;
    text-align: right;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-card .sm-table tbody tr:first-child td {
    background: #06271c;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-card .sm-table tbody tr:first-child td:first-child {
    box-shadow: inset 4px 0 #28e8b0;
  }

  body #riPremiumRoot
  [data-tool="smart_money"]
  .sm-card .sm-table tbody tr:hover td {
    background: #0a3023;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-avatar {
    width: 46px;
    height: 46px;
    flex-basis: 46px;
    border-color: #315e4b;
    box-shadow: 0 4px 15px rgba(0, 0, 0, .2);
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-name {
    font-size: 14px;
    font-weight: 750;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-address {
    margin-top: 6px;
    font-size: 11px;
    letter-spacing: .15px;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-buy-badge {
    padding: 3px 7px;
    border: 1px solid #18865f;
    border-radius: 6px;
    background: rgba(24, 215, 150, .06);
    color: #36edb5;
    font-size: 10px;
    font-weight: 650;
    line-height: 1;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-network {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    color: #b4d2c2;
    font-size: 12px;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-network-solana::before {
    content: "";
    width: 18px;
    height: 13px;
    display: inline-block;
    transform: skew(-22deg);
    background:
      linear-gradient(110deg, #8d65ed, #32e9bc)
        top / 100% 3px no-repeat,
      linear-gradient(110deg, #8d65ed, #32e9bc)
        center / 100% 3px no-repeat,
      linear-gradient(110deg, #8d65ed, #32e9bc)
        bottom / 100% 3px no-repeat;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-positive {
    color: #34edb6;
    font-size: 16px;
    font-weight: 750;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-negative {
    color: #ff777f;
    font-size: 16px;
    font-weight: 750;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] a.sm-analyze {
    min-width: 88px;
    box-sizing: border-box;
    padding: 11px 16px;
    border-radius: 11px;
    background: linear-gradient(145deg, #0b3527, #031b13);
    border-color: #22dca4;
    color: #4bf1c2;
    text-align: center;
    font-weight: 650;
    transition: background 180ms ease, box-shadow 180ms ease;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] a.sm-analyze:hover {
    background: #104d38;
    box-shadow: 0 0 15px rgba(30, 225, 166, .12);
  }

  body #riPremiumRoot
  [data-tool="smart_money"] button.sm-help-star {
    width: 19px;
    height: 19px;
    padding: 0;
    border-radius: 50%;
    background: transparent;
    color: #a4c5b6;
    font-family: Georgia, serif;
    font-size: 12px;
    font-weight: 400;
    font-style: italic;
  }

  body #riPremiumRoot
  [data-tool="smart_money"] .sm-analysis-unavailable {
    color: #6c9380;
  }

  @media (max-width: 700px) {
    body #riPremiumRoot
    [data-tool="smart_money"] .sm-card {
      padding: 14px;
    }

    body #riPremiumRoot
    [data-tool="smart_money"] .sm-card .sm-table tbody tr {
      margin-bottom: 10px;
      padding: 17px;
      border: 1px solid #174536;
      border-radius: 14px;
      background: #041b13;
    }

    body #riPremiumRoot
    [data-tool="smart_money"] .sm-card .sm-table tbody td {
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }

    body #riPremiumRoot
    [data-tool="smart_money"]
    .sm-card .sm-table tbody tr:first-child td,
    body #riPremiumRoot
    [data-tool="smart_money"]
    .sm-card .sm-table tbody tr:hover td {
      background: transparent;
    }

    body #riPremiumRoot
    [data-tool="smart_money"] .sm-periods button {
      min-width: 48px;
      padding: 10px 12px;
    }
  }
`;

const smartHelpBox =
  document.createElement("div");

smartHelpBox.className =
  "sm-help-box";

smartHelpBox.id =
  "riSmartHelpBox";

smartHelpBox.hidden = true;

smartHelpBox.setAttribute(
  "role",
  "note"
);

smartHelpBox.innerHTML = `
  <strong data-help-title></strong>

  <p data-help-text></p>

  <button
    type="button"
    class="sm-help-close"
    aria-label="Close explanation"
  >
    ×
  </button>
`;

panel.querySelector(
  ".sm-toolbar"
).after(smartHelpBox);

let openedSmartHelp = null;

function closeSmartHelp() {
  smartHelpBox.hidden = true;

  if (openedSmartHelp) {
    openedSmartHelp.setAttribute(
      "aria-expanded",
      "false"
    );
  }

  openedSmartHelp = null;
}

function makeSmartHelp(label) {
  const button =
    document.createElement("button");

  button.type = "button";

  button.className =
    "sm-help-star";

  button.textContent = "i";

  button.setAttribute(
    "aria-label",
    "Explain " + label
  );

  button.setAttribute(
    "aria-expanded",
    "false"
  );

  button.setAttribute(
    "aria-controls",
    "riSmartHelpBox"
  );

  button.onclick = () => {
    const alreadyOpen =
      openedSmartHelp === button &&
      !smartHelpBox.hidden;

    closeSmartHelp();

    if (alreadyOpen) return;

    openedSmartHelp = button;

    smartHelpBox.querySelector(
      "[data-help-title]"
    ).textContent = label;

    smartHelpBox.querySelector(
      "[data-help-text]"
    ).textContent =
      smartHelpText[label];

    smartHelpBox.hidden = false;

    button.setAttribute(
      "aria-expanded",
      "true"
    );
  };

  return button;
}

smartHelpBox.querySelector(
  ".sm-help-close"
).onclick = () => {
  const previousButton =
    openedSmartHelp;

  closeSmartHelp();

  previousButton?.focus();
};

panel.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "Escape" &&
      openedSmartHelp
    ) {
      const previousButton =
        openedSmartHelp;

      closeSmartHelp();

      previousButton.focus();
    }
  }
);

panel.querySelectorAll(
  ".sm-table thead th"
).forEach(th => {
  const label = th.textContent
    .replace("↓", "")
    .trim();

  if (smartHelpText[label]) {
    th.append(
      makeSmartHelp(label)
    );
  }
});

    const node = (tag, text, cls) => {
      const el =
        document.createElement(tag);

      if (text !== undefined) {
        el.textContent = text;
      }

      if (cls) {
        el.className = cls;
      }

      return el;
    };

    const money = (
      value,
      signed = false
    ) => {
      if (
        value === null ||
        !Number.isFinite(value)
      ) {
        return "—";
      }

      const formatted =
        new Intl.NumberFormat(
          "en-US",
          {
            style: "currency",
            currency: "USD",
            notation: "compact",
            maximumFractionDigits: 2
          }
        ).format(Math.abs(value));

      return (
        value < 0
          ? "−"
          : signed && value > 0
            ? "+"
            : ""
      ) + formatted;
    };

    const safeImage = value => {
      try {
        const url = new URL(value);

        return (
          url.protocol === "https:" &&
          !url.username &&
          !url.password
        )
          ? url.href
          : null;

      } catch {
        return null;
      }
    };

    async function runImages() {
      if (
        imageWorkers >= 2 ||
        !active() ||
        document.hidden
      ) {
        return;
      }

      const job = imageQueue.shift();

      if (!job) return;

      imageWorkers++;

      try {
        if (job.connected()) {
          await job.run();
        }
      } finally {
        imageWorkers--;
        runImages();
      }
    }

    function addImage(avatar, item) {
      const fallback =
        node("span", "◈");

      const img = node("img");

      img.alt = item.name + " logo";
      img.loading = "eager";

      img.referrerPolicy =
        "no-referrer";

      img.hidden = true;

      avatar.append(fallback, img);

      let backupStarted = false;
      let candidates = [];
      let timer;

      const next = () => {
        clearTimeout(timer);

        if (!avatar.isConnected) return;

        if (candidates.length) {
          img.src = candidates.shift();

          timer = setTimeout(
            next,
            8000
          );

        } else if (!backupStarted) {
          backupStarted = true;

          imageQueue.push({
            connected: () =>
              avatar.isConnected,

            run: async () => {
              try {
                const res = await fetch(
                  API +
                  "/api/token-images?ca=" +
                  encodeURIComponent(
                    item.contract
                  ),
                  {
                    signal:
                      AbortSignal.timeout(
                        15000
                      )
                  }
                );

                const data =
                  await res.json();

                if (
                  !res.ok ||
                  !data.success ||
                  data.contract !==
                    item.contract
                ) {
                  return;
                }

                candidates = [
                  ...new Set(
                    (data.images || [])
                      .map(safeImage)
                      .filter(Boolean)
                  )
                ].slice(0, 4);

                next();

              } catch {}
            }
          });

          runImages();

        } else {
          img.hidden = true;
          fallback.hidden = false;
        }
      };

      img.onload = () => {
        clearTimeout(timer);

        img.hidden = false;
        fallback.hidden = true;
      };

      img.onerror = next;

      const first =
        safeImage(item.image);

      if (first) {
        candidates.push(first);
      }

      next();
    }

    const smMarket = new Map();
const smMarketJobs = new Map();

let smMarketVersion = 0;

const smHeading = panel.querySelector(
  ".sm-heading"
);

smHeading.firstElementChild.prepend(
  node(
    "small",
    "ON-CHAIN INTELLIGENCE",
    "sm-kicker"
  )
);

smHeading.querySelector("p").textContent =
  "Track the wallets. Understand the flow.";

const smSummary = node(
  "div",
  undefined,
  "sm-summary"
);

smSummary.setAttribute(
  "aria-label",
  "Summary of displayed tokens"
);

smSummary.innerHTML = `
  <div class="sm-summary-card">
    <span
      class="sm-summary-icon"
      aria-hidden="true"
    >◇</span>

    <div>
      <small>Tokens in view</small>
      <strong data-sm-total="tokens">0</strong>
    </div>
  </div>

  <div class="sm-summary-card">
    <span
      class="sm-summary-icon"
      aria-hidden="true"
    >↗</span>

    <div>
      <small>Buy trades</small>
      <strong data-sm-total="trades">0</strong>
    </div>
  </div>

  <div class="sm-summary-card">
    <span
      class="sm-summary-icon"
      aria-hidden="true"
    >⇄</span>

    <div>
      <small>Net inflow</small>
      <strong data-sm-total="flow">—</strong>
    </div>
  </div>
`;

smHeading.after(smSummary);

const smChain = node(
  "span",
  "Solana",
  "sm-network sm-network-solana sm-chain-v2"
);

panel.querySelector(
  ".sm-periods"
).after(smChain);

panel.classList.add("sm-v2");

function smTotals(items) {
  smSummary.querySelector(
    '[data-sm-total="tokens"]'
  ).textContent = String(items.length);

  smSummary.querySelector(
    '[data-sm-total="trades"]'
  ).textContent = new Intl.NumberFormat(
    "en-US"
  ).format(
    items.reduce(
      (sum, item) => sum + item.buy_trades,
      0
    )
  );

  const total = smSummary.querySelector(
    '[data-sm-total="flow"]'
  );

  const complete = items.every(item => {
    return Number.isFinite(
      item.net_inflow_usd
    );
  });

  const flow = complete
    ? items.reduce(
        (sum, item) =>
          sum + item.net_inflow_usd,
        0
      )
    : null;

  total.textContent = money(flow, true);

  total.classList.toggle(
    "sm-negative",
    flow !== null && flow < 0
  );

  total.title = complete
    ? "Sum for the displayed tokens in the selected period."
    : "Some displayed tokens have no net inflow value.";
}

function smPaintDesign(items) {
  smTotals(items);

  const isSolana = item => {
    return (
      item.chain_id === "CT_501" &&
      [
        "binance_row",
        "binance_filter"
      ].includes(item.chain_source)
    );
  };

  const allSolana =
    items.length > 0 &&
    items.every(isSolana);

  panel.dataset.smSolanaOnly =
    String(allSolana);

  smChain.hidden = !allSolana;

  const maxFlow = Math.max(
    1,
    ...items.map(item => {
      return Number.isFinite(
        item.net_inflow_usd
      )
        ? Math.abs(item.net_inflow_usd)
        : 0;
    })
  );

  [...tbody.children].forEach(
    (row, index) => {
      const item = items[index];

      if (!item) return;

      row.dataset.smContract =
        item.contract;

      row.dataset.smSolana =
        String(isSolana(item));

      const buyers = row.children[3];

      const buyersHelp =
        buyers.querySelector(
          ".sm-help-star"
        );

      const pill = node(
        "span",
        String(item.buyers),
        "sm-buyer-pill"
      );

      buyers.replaceChildren(pill);

      if (buyersHelp) {
        buyers.append(buyersHelp);
      }

      const flowCell = row.children[5];

      const flowHelp =
        flowCell.querySelector(
          ".sm-help-star"
        );

      const amount = node(
        "strong",
        money(item.net_inflow_usd, true),
        "sm-flow-value"
      );

      const bar = node(
        "span",
        undefined,
        "sm-flow-track"
      );

      bar.setAttribute(
        "aria-hidden",
        "true"
      );

      const fill = node("span");

      fill.style.width = Number.isFinite(
        item.net_inflow_usd
      )
        ? (
            Math.abs(item.net_inflow_usd) /
            maxFlow * 100
          ) + "%"
        : "0%";

      bar.append(fill);

      flowCell.replaceChildren(
        amount,
        bar
      );

      if (flowHelp) {
        flowCell.append(flowHelp);
      }

      const mc = node(
        "span",
        money(item.market_cap_usd),
        "sm-live-mc"
      );

      row.children[6].replaceChildren(mc);

      const analyze = row.querySelector(
        ".sm-analyze"
      );

      if (analyze) {
        analyze.textContent = "Analyze →";
      }
    }
  );

  smPaintMarketCaps();
}

function smPaintMarketCaps() {
  if (!active()) return;

  const rows = tbody.querySelectorAll(
    "tr[data-sm-contract]"
  );

  for (const row of rows) {
    const cell = row.querySelector(
      ".sm-live-mc"
    );

    if (!cell) continue;

    const entry = smMarket.get(
      row.dataset.smContract
    );

    if (Number.isFinite(entry?.value)) {
      cell.textContent = money(
        entry.value
      );
    }

    const stale =
      !Number.isFinite(entry?.value) ||
      entry.failed ||
      Date.now() - entry.time > 60000;

    cell.classList.toggle(
      "sm-mc-stale",
      Boolean(stale)
    );

    cell.title = Number.isFinite(
      entry?.value
    )
      ? (
          stale
            ? "Last known MC · "
            : "MC updated · "
        ) +
        new Date(
          entry.time
        ).toLocaleTimeString()
      : (
          "MC from the Smart Money snapshot; " +
          "live update pending."
        );
  }
}

async function smRefreshMarketCaps(
  force = false
) {
  if (
    !active() ||
    document.hidden
  ) {
    return;
  }

  const version = smMarketVersion;

  const rows = tbody.querySelectorAll(
    'tr[data-sm-solana="true"]'
  );

  const contracts = [
    ...new Set(
      [...rows].map(row => {
        return row.dataset.smContract;
      })
    )
  ].filter(contract => {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      .test(contract);
  });

  await Promise.allSettled(
    contracts.map(async contract => {
      let entry = smMarket.get(contract);

      if (
        smMarketJobs.has(contract) ||
        (
          !force &&
          entry &&
          Date.now() - entry.attempt < 25000
        )
      ) {
        return;
      }

      if (!entry) {
        if (smMarket.size >= 200) {
          smMarket.delete(
            smMarket.keys().next().value
          );
        }

        entry = {};

        smMarket.set(
          contract,
          entry
        );
      }

      entry.attempt = Date.now();

      const controller =
        new AbortController();

      smMarketJobs.set(
        contract,
        controller
      );

      const timer = setTimeout(
        () => controller.abort(),
        28000
      );

      try {
        const url = new URL(
          "/api/board-market",
          API
        );

        url.searchParams.set(
          "ca",
          contract
        );

        const response = await fetch(url, {
          cache: "no-store",
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(
            "Market unavailable"
          );
        }

        const result =
          await response.json();

        if (
          version !== smMarketVersion ||
          !active()
        ) {
          return;
        }

        const time = Date.parse(
          result.timestamp || ""
        );

        if (
          result.success !== true ||
          result.contractAddress !== contract ||
          typeof result.marketCapUsd !== "number" ||
          !Number.isFinite(result.marketCapUsd) ||
          result.marketCapUsd < 0 ||
          !Number.isFinite(time) ||
          Date.now() - time > 60000 ||
          time > Date.now() + 10000
        ) {
          throw new Error(
            "Invalid market response"
          );
        }

        entry.value =
          result.marketCapUsd;

        entry.time = time;
        entry.failed = false;

      } catch {
        if (
          version === smMarketVersion
        ) {
          entry.failed = true;
        }

      } finally {
        clearTimeout(timer);

        if (
          smMarketJobs.get(contract) ===
          controller
        ) {
          smMarketJobs.delete(contract);
        }

        if (
          version === smMarketVersion
        ) {
          smPaintMarketCaps();
        }
      }
    })
  );
}

function smResetMarket() {
  smMarketVersion++;

  for (
    const controller
    of smMarketJobs.values()
  ) {
    controller.abort();
  }

  smMarketJobs.clear();
  smMarket.clear();
}

function smSyncDesign() {
  root.classList.toggle(
    "ri-smart-v2-open",
    active()
  );

  if (!active()) {
    smResetMarket();
    smTotals([]);

  } else {
    void smRefreshMarketCaps();
  }
}

new MutationObserver(() => {
  if (!tbody.children.length) {
    smTotals([]);
  }
}).observe(tbody, {
  childList: true
});

document.addEventListener(
  "ri:account-change",
  () => {
    smResetMarket();
    smTotals([]);
    smSyncDesign();
  }
);

document.addEventListener(
  "ri:premium-change",
  smSyncDesign
);

document.addEventListener(
  "visibilitychange",
  smSyncDesign
);

setInterval(() => {
  smPaintMarketCaps();

  void smRefreshMarketCaps();
}, 30000);

smSyncDesign();

    function render(data) {
      imageQueue.length = 0;

      tbody.replaceChildren();

      shownPeriod = data.period;

      const items = data.items.filter(item =>
        typeof item.market_cap_usd === "number" &&
        Number.isFinite(item.market_cap_usd) &&
        item.market_cap_usd >= 10000
      );

      for (
        const [index, item]
        of items.entries()
      ) {
        const row = node("tr");

        const cell = (
          text,
          label,
          cls
        ) => {
          const td =
            node("td", text, cls);

if (label) {
  td.dataset.label = label;

  if (smartHelpText[label]) {
    td.append(
      makeSmartHelp(label)
    );
  }
}

          row.append(td);

          return td;
        };

        cell(String(index + 1));

        const token = node(
          "div",
          undefined,
          "sm-token"
        );

        const avatar = node(
          "span",
          undefined,
          "sm-avatar"
        );

        const details = node("div");

        const top = node(
          "div",
          undefined,
          "sm-token-top"
        );

        const name = node(
          "strong",
          item.name,
          "sm-name"
        );

        name.title = item.name;

        const copy = node(
          "button",
          "▢ Copy CA",
          "sm-copy"
        );

        copy.type = "button";
        copy.title = item.contract;

        copy.onclick = async () => {
          try {
            await navigator.clipboard
              .writeText(item.contract);

            copy.textContent =
              "Copied ✓";

            setTimeout(() => {
              copy.textContent =
                "▢ Copy CA";
            }, 1500);

          } catch {
            message.textContent =
              "Contract: " +
              item.contract;
          }
        };

        top.append(name);

        if (item.smart_direction === "buy") {
          top.append(
            node("span", "BUY", "sm-buy-badge")
          );
        }

        top.append(copy);

        details.append(
          top,

          node(
            "small",

            item.contract.slice(0, 6) +
            "…" +
            item.contract.slice(-6),

            "sm-address"
          )
        );

        token.append(
          avatar,
          details
        );

        cell().append(token);

        const chainId = item.chain_id;

        const isSolana =
          chainId === "CT_501" &&
          [
            "binance_row",
            "binance_filter"
          ].includes(item.chain_source);

        const network = cell(
          undefined,
          "Network",
          "sm-network-cell"
        );

        const networkLabel = isSolana
          ? "Solana"
          : typeof chainId === "string" && chainId
            ? chainId
            : "Unknown";

        const networkBadge = node(
          "span",
          networkLabel,
          "sm-network"
        );

        if (isSolana) {
          networkBadge.classList.add(
            "sm-network-solana"
          );
        }

        network.append(networkBadge);

        cell(
          String(item.buyers),
          "SM Buyers",
          "sm-buyers"
        );

        cell(
          String(item.buy_trades),
          "Buy Trades"
        );

        cell(
          money(
            item.net_inflow_usd,
            true
          ),

          "Net Inflow",

          item.net_inflow_usd < 0
            ? "sm-negative"
            : "sm-positive"
        );

        cell(
          money(item.market_cap_usd),
          "Market Cap"
        );

        const action = cell();

        if (isSolana) {
          const analyze = node(
            "a",
            "Analyze",
            "sm-analyze"
          );

          analyze.href =
            "/?ca=" +
            encodeURIComponent(item.contract) +
            "#scanner";

          analyze.target = "_self";

          action.append(analyze);
        } else {
          const unavailable = node(
            "span",
            "—",
            "sm-analysis-unavailable"
          );

          unavailable.title =
            "Analysis is available only for identified Solana tokens.";

          action.append(unavailable);
        }

        tbody.append(row);

        addImage(avatar, item);
      }

      wrap.hidden =
        !items.length;

      updated.textContent =
        "Updated " +
        new Date(
          data.measured_at
        ).toLocaleTimeString();

message.textContent =
  data.stale
    ? "Refresh unavailable. Showing an older snapshot."
    : items.length
      ? ""
      : "No tokens with known market cap of at least $10,000 for this period.";

smPaintDesign(items);

void smRefreshMarketCaps();
}

    async function load() {
      if (
        !active() ||
        document.hidden ||
        current ||
        Date.now() < retryAt
      ) {
        return;
      }

      const saved =
        cache.get(period);

      if (
        saved &&
        Date.now() -
          Date.parse(
            saved.measured_at
               ) < 60000
      ) {
        if (shownPeriod !== period) {
          render(saved);
        }

        return;
      }

      if (
        saved &&
        shownPeriod !== period
      ) {
        render(saved);
      }

      const requested = period;

      const controller =
        new AbortController();

      current = controller;

      refresh.disabled = true;

      if (shownPeriod !== period) {
        tbody.replaceChildren();

        wrap.hidden = true;

        updated.textContent =
          "Loading…";
      }

      message.textContent =
        "Loading smart money buyers…";

      const timeout = setTimeout(
        () => controller.abort(),
        25000
      );

      try {
        const headers =
          await window.RI_PREMIUM
            .getHeaders();

        if (
          controller.signal.aborted
        ) {
          return;
        }

        const res = await fetch(
          API +
          "/api/smart-money?period=" +
          requested,
          {
            headers,

            signal:
              controller.signal,

            cache: "no-store"
          }
        );

        const data =
          await res.json();

        if (
          current !== controller ||
          !active() ||
          period !== requested
        ) {
          return;
        }

        if (
          !res.ok ||
          data?.success !== true
        ) {
          if (
            res.status === 401 ||
            res.status === 403
          ) {
            cache.clear();

            tbody.replaceChildren();

            wrap.hidden = true;
          }

          throw new Error(
            data?.error ||
            "Smart Money unavailable."
          );
        }

        if (
          data.period !== requested ||
          !Array.isArray(data.items) ||
          data.items.length > 20 ||

          !Number.isFinite(
            Date.parse(
              data.measured_at
            )
          ) ||

          data.items.some(item =>
            !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/
              .test(
                item.contract || ""
              ) ||

            typeof item.name !==
              "string" ||

            !Number.isSafeInteger(
              item.buyers
            ) ||

            item.buyers < 1 ||

            !Number.isSafeInteger(
              item.buy_trades
            ) ||

            item.buy_trades <
              item.buyers
          )
        ) {
          throw new Error(
            "Invalid Smart Money response."
          );
        }

        cache.set(period, data);

        retryAt = data.stale
          ? Date.now() + 30000
          : 0;

        render(data);

      } catch (error) {
        if (
          current !== controller ||
          !active()
        ) {
          return;
        }

        retryAt =
          Date.now() + 30000;

        message.textContent =
          (
            shownPeriod === period &&
            tbody.children.length
              ? "Showing previous snapshot. "
              : ""
          ) +

          (
            error.name === "AbortError"
              ? "Request timed out. Try again shortly."
              : error.message
          );

      } finally {
        clearTimeout(timeout);

        if (
          current === controller
        ) {
          current = null;

          refresh.disabled = false;
        }
      }
    }

    function sync() {
      const enabled = active();

      if (!enabled) {
        current?.abort();

        current = null;

        cache.clear();

        imageQueue.length = 0;

        tbody.replaceChildren();

        wrap.hidden = true;

        shownPeriod = "";
        retryAt = 0;

        refresh.disabled = false;

        message.textContent = "";

        wasActive = false;

        return;
      }

      if (!wasActive) {
        retryAt = 0;
      }

      wasActive = true;

      runImages();

      void load();
    }

    panel.querySelectorAll(
      "[data-period]"
    ).forEach(button => {
      button.onclick = () => {
        if (
          !active() ||
          button.dataset.period ===
            period
        ) {
          return;
        }

        current?.abort();

        current = null;

        period =
          button.dataset.period;

        retryAt = 0;

        refresh.disabled = false;

        panel.querySelectorAll(
          "[data-period]"
        ).forEach(el => {
          el.setAttribute(
            "aria-pressed",

            String(
              el.dataset.period ===
                period
            )
          );
        });

        void load();
      };
    });

refresh.onclick = () => {
  cache.delete(period);

  retryAt = 0;

  void load();

  void smRefreshMarketCaps(true);
};

    document.addEventListener(
      "ri:premium-change",
      sync
    );

    document.addEventListener(
      "ri:account-change",
      () => {
        current?.abort();

        current = null;

        cache.clear();

        shownPeriod = "";

        tbody.replaceChildren();

        wrap.hidden = true;

        retryAt = 0;

        sync();
      }
    );

    document.addEventListener(
      "visibilitychange",
      sync
    );

    setInterval(() => {
      if (
        active() &&
        !document.hidden
      ) {
        void load();
      }
    }, 15000);

    sync();
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