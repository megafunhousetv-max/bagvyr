(() => {
"use strict";

if (window.RII) return;

const API =
  "https://bagvyr-api.megafunhousetv.workers.dev/api/rii";

const mint = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

const admin = !!document.getElementById("riiSection");

const $ = (selector, root = document) =>
  root.querySelector(selector);

const uid = () => crypto.randomUUID();

const icon = `
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  width="24"
  height="24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.7"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
>
  <!-- Anténa -->
  <path d="M12 7V4.5"/>

  <circle
    cx="12"
    cy="3"
    r="1.3"
    fill="currentColor"
    stroke="none"
  />

  <!-- Hlava -->
  <rect
    x="5"
    y="7"
    width="14"
    height="12"
    rx="4"
  />

  <!-- Bočné časti -->
  <rect
    x="2"
    y="10"
    width="3"
    height="6"
    rx="1.4"
  />

  <rect
    x="19"
    y="10"
    width="3"
    height="6"
    rx="1.4"
  />

  <!-- Oči -->
  <circle
    cx="9"
    cy="12"
    r="1.1"
    fill="currentColor"
    stroke="none"
  />

  <circle
    cx="15"
    cy="12"
    r="1.1"
    fill="currentColor"
    stroke="none"
  />

  <!-- Ústa -->
  <path d="M10 16h4"/>
</svg>`;

// Rovnaký robot aj v hornom menu a admin navigácii.
document.querySelectorAll(
  '.header-nav [data-rii-open="full"] svg, ' +
  '[data-admin-section="rii"] svg'
).forEach(oldIcon => {
  const container = document.createElement("div");

  container.innerHTML = icon.trim();

  const robotIcon = container.firstElementChild;
  const originalClass = oldIcon.getAttribute("class");

  if (originalClass) {
    robotIcon.setAttribute("class", originalClass);
  }

  oldIcon.replaceWith(robotIcon);
});

const style = document.createElement("style");

style.textContent = `
.rii-ui,.rii-studio{
  --ri-a:#26ebbb;
  --ri-line:#174338;
  color:#edfff8;
  font:14px/1.5 system-ui,sans-serif;
  box-sizing:border-box
}
.rii-ui *,.rii-studio *{box-sizing:border-box}
.rii-ui [hidden],.rii-studio [hidden],#rii-launch[hidden]{
  display:none!important
}
.rii-ui button,.rii-studio button,.rii-ui textarea,.rii-studio input{
  font:inherit
}
.rii-ui button,.rii-studio button{cursor:pointer}
.rii-ui button:disabled,.rii-studio button:disabled{
  opacity:.5;cursor:default
}
.rii-ui button:focus-visible,
.rii-ui textarea:focus-visible,
.rii-studio input:focus-visible,
.rii-studio button:focus-visible{
  outline:2px solid #26ebbb;outline-offset:3px
}
.rii-mark{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:9px
}
.rii-mark svg,#rii-launch svg,[data-rii-open] svg{
  width:22px;height:22px;
  fill:none;stroke:currentColor;stroke-width:1.6
}
#rii-launch{
  position:fixed;right:28px;bottom:96px;z-index:1100;
  background:#06251c;color:#32f5c6;
  border:1px solid #20d4a3;border-radius:30px;
  padding:13px 20px;
  box-shadow:0 5px 26px #00d49c20;
  cursor:pointer;font:700 14px system-ui
}
.rii-mask{
  position:fixed;
  inset:0;
  z-index:11000;
  background:#0008;
  backdrop-filter:blur(4px);
}
.rii-panel{
  position:absolute;right:18px;top:88px;bottom:20px;
  width:min(470px,calc(100vw - 24px));
  display:flex;flex-direction:column;
  background:#03140f;
  border:1px solid #23604b;border-radius:22px;
  overflow:hidden;box-shadow:0 25px 100px #000b
}
.rii-mask.rii-full .rii-panel{
  width:min(1150px,calc(100vw - 40px));
  right:50%;transform:translateX(50%)
}
.rii-head{
  display:flex;align-items:center;justify-content:space-between;
  padding:19px 22px;border-bottom:1px solid var(--ri-line);
  background:radial-gradient(
    ellipse at top right,#0e4936,transparent 70%
  )
}
.rii-brand{font-size:18px;font-weight:750}
.rii-brand small{
  display:block;color:#87b6a4;
  font-size:11px;font-weight:400;
  margin-left:31px;letter-spacing:.06em
}
.rii-btn{
  padding:9px 13px;
  border:1px solid #24543f;border-radius:10px;
  background:#09251b;color:#c9e5d9
}
.rii-primary{
  border:0!important;
  background:#26ebbb!important;
  color:#00271c!important;
  font-weight:750
}
.rii-body{display:flex;flex:1;min-height:0}
.rii-history{
  width:215px;flex-shrink:0;padding:17px 12px;
  background:#041b13;
  border-right:1px solid var(--ri-line);
  overflow:auto
}
.rii-panel:not(.rii-wide) .rii-history{display:none}
.rii-panel.rii-history-open .rii-history{display:block}
.rii-chat{
  display:flex;flex-direction:column;
  flex:1;min-width:0;min-height:0
}
.rii-history h3{
  font-size:11px;color:#81ab99;
  text-transform:uppercase;letter-spacing:.1em;
  margin:20px 7px 12px
}
.rii-history .rii-new{width:100%}
.rii-history-item{
  display:flex;gap:3px;align-items:center;margin:5px 0
}
.rii-history-item>button:first-child{
  flex:1;min-width:0;text-align:left;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap
}
.rii-history-item .rii-selected{
  border-color:#26ebbb;background:#0c3829;color:#26ebbb
}
.rii-context{
  margin:14px 20px 0;padding:10px 13px;
  background:#0a3022;border:1px solid #235c45;border-radius:11px;
  color:#a9d6c2;overflow-wrap:anywhere;font-size:12px
}
.rii-log{
  flex:1;overflow:auto;padding:22px;scroll-behavior:smooth
}
.rii-empty{
  margin:40px auto;max-width:430px;text-align:center
}
.rii-orb{
  width:60px;height:60px;
  border:1px solid #277756;background:#0b3d2c;
  box-shadow:0 0 50px #08d7a026;border-radius:18px;
  margin:0 auto 18px;display:grid;place-items:center;color:#31efb9
}
.rii-orb svg{width:32px;height:32px}
.rii-empty h2{
  font-size:24px;line-height:1.2;margin:12px 0
}
.rii-empty p{color:#8eb3a1}
.rii-suggestions{display:grid;gap:8px;margin-top:22px}
.rii-suggestions button{text-align:left;background:#09241a}
.rii-message{
  margin:0 0 20px;padding:15px 17px;
  background:#09251b;border:1px solid #153e2e;border-radius:14px;
  overflow-wrap:anywhere;white-space:pre-wrap
}
.rii-message.rii-user{
  background:#103b2b;border-color:#246147;margin-left:35px
}
.rii-message small{
  display:block;color:#7da992;font-size:10px;font-weight:700;
  letter-spacing:.08em;margin-bottom:7px
}
.rii-sources{
  color:#83b6a1;font-size:11px;white-space:normal;
  margin-top:10px;overflow-wrap:anywhere
}
.rii-compose{
  padding:12px 20px 18px;
  border-top:1px solid var(--ri-line);background:#041b13
}
.rii-compose textarea{
  resize:none;width:100%;height:72px;
  background:#061e15;border:1px solid #24543f;border-radius:12px;
  padding:12px;color:#effff7;outline:none
}
.rii-compose-foot{
  display:flex;gap:10px;align-items:center;
  justify-content:space-between;margin-top:9px
}
.rii-quota{font-size:11px;color:#8bb49f}
.rii-note{font-size:11px;color:#7da18f;margin:8px 0 0}
.rii-error{
  color:#ffb7a4;font-size:12px;min-height:18px;margin-bottom:5px
}
.rii-studio{
  padding:25px;border:1px solid #1b5740;border-radius:20px;
  background:radial-gradient(
    ellipse at top right,#0c3c2a,#04180f 65%
  )
}
.rii-studio h2{font-size:28px;margin:10px 0 5px}
.rii-studio p{color:#91b9a5}
.rii-studio .rii-pill{
  font-size:10px;letter-spacing:.14em;color:#2dffc3;
  border:1px solid #237c55;border-radius:20px;
  padding:5px 9px;display:inline-block
}
.rii-rules{
  display:grid;grid-template-columns:repeat(3,1fr);
  gap:14px;margin:25px 0
}
.rii-rule{
  padding:20px;background:#08251a;
  border:1px solid #1b5740;border-radius:15px
}
.rii-rule h3{margin:0 0 15px}
.rii-rule label{display:block;margin:12px 0;color:#a3c9b4}
.rii-rule input[type=number],.rii-history-count{
  display:block;width:100%;background:#03170e;color:#edfff8;
  border:1px solid #236147;border-radius:10px;
  padding:10px;margin-top:7px
}
.rii-rule input[type=checkbox]{
  accent-color:#26ebbb;width:18px;height:18px;
  vertical-align:middle;margin-right:8px
}
.rii-admin-unlimited{
  padding:15px;background:#0b3523;
  border:1px solid #276b49;border-radius:12px;margin:15px 0
}
.rii-studio-actions{
  display:flex;align-items:center;gap:12px;
  flex-wrap:wrap;margin-top:20px
}
.rii-studio-message{color:#b2d6c0;white-space:pre-wrap}
.rii-studio .rii-history-label{
  display:block;max-width:280px;color:#a3c9b4
}
@media(max-width:650px){
  #rii-launch{right:16px;bottom:92px}
  .rii-panel,.rii-mask.rii-full .rii-panel{
    top:10px;bottom:10px;right:10px;
    width:calc(100vw - 20px);
    transform:none;border-radius:17px
  }
  .rii-head{padding:15px}
  .rii-brand{font-size:16px}
  .rii-brand small{font-size:9px}
  .rii-log{padding:15px}
  .rii-panel.rii-wide .rii-history{display:none}
  .rii-panel.rii-history-open .rii-history{
    display:block;width:175px
  }
  .rii-context{margin:12px 15px 0}
  .rii-compose{padding:10px 15px}
  .rii-rules{grid-template-columns:1fr}
  .rii-studio{padding:18px}
  .rii-empty{margin-top:25px}
}
`;

document.head.append(style);

const mask = document.createElement("div");

mask.className = "rii-ui rii-mask";
mask.hidden = true;

mask.innerHTML = `
<section
  class="rii-panel"
  role="dialog"
  aria-modal="true"
  aria-label="RugInspect Intelligence"
>
  <header class="rii-head">
    <div class="rii-brand">
      <span class="rii-mark">${icon} RII</span>
      <small>RUGINSPECT INTELLIGENCE</small>
    </div>

    <div>
      <button
        class="rii-btn"
        data-action="history"
        aria-label="Chat history"
      >History</button>

      <button
        class="rii-btn"
        data-action="close"
        aria-label="Close chat"
      >×</button>
    </div>
  </header>

  <div class="rii-body">
    <aside class="rii-history">
      <button
        class="rii-btn rii-primary rii-new"
        data-action="new"
      >+ New chat</button>

      <h3>Recent chats</h3>
      <div class="rii-history-list"></div>
      <p class="rii-note rii-history-note"></p>
    </aside>

    <div class="rii-chat">
      <div class="rii-context"></div>

      <div
        class="rii-log"
        role="log"
        aria-live="polite"
      ></div>

      <form class="rii-compose">
        <div class="rii-error" role="status"></div>

        <textarea
          maxlength="3000"
          aria-label="Your question"
          placeholder="Ask RII about this token…"
        ></textarea>

        <div class="rii-compose-foot">
          <span class="rii-quota">Connecting…</span>

          <div>
            <button
              type="button"
              class="rii-btn"
              data-action="new"
            >New</button>

            <button
              class="rii-btn rii-primary"
              type="submit"
            >Send ↗</button>
          </div>
        </div>

        <p class="rii-note">
          Data can be incomplete.
          RII does not guarantee a token’s safety.
        </p>
      </form>
    </div>
  </div>
</section>`;

document.body.append(mask);

const panel = $(".rii-panel", mask);
const log = $(".rii-log", mask);
const input = $("textarea", mask);
const form = $("form", mask);
const error = $(".rii-error", mask);

const launcher = document.createElement("button");

launcher.id = "rii-launch";
launcher.hidden = true;
launcher.type = "button";
launcher.className = "rii-mark";
launcher.innerHTML = icon + " RII";

launcher.setAttribute(
  "aria-label",
  "Open RugInspect Intelligence"
);

document.body.append(launcher);

let currentCA = new URL(location.href).searchParams.get("ca") || "";

if (!mint.test(currentCA)) currentCA = "";

let selected = newChat(currentCA);
let status = null;
let items = [];
let busy = false;
let epoch = 0;
let sessionKey = "";
let retry = null;
let restoreFocus;
let overflow = "";

function newChat(ca = "") {
  return {
    id: uid(),
    context: ca,
    title: "New chat",
    messages: []
  };
}

function client() {
  return admin
    ? window.BAGVYR_ADMIN_CLIENT
    : window.RI_ACCOUNT_CLIENT;
}

async function auth() {
  const instance = client();

  return instance
    ? (await instance.auth.getSession()).data?.session
    : null;
}

async function api(path, method = "GET", data) {
  const session = await auth();

  const headers = {
    "Content-Type": "application/json"
  };

  if (session?.access_token) {
    headers.Authorization = "Bearer " + session.access_token;
  }

  const response = await fetch(API + path, {
    method,
    headers,

    body: data === undefined
      ? undefined
      : JSON.stringify(data),

    signal: AbortSignal.timeout(125000)
  });

  let result;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      "RII response unavailable. Try again."
    );
  }

  if (!response.ok || result.success === false) {
    throw Object.assign(
      new Error(result.error || "RII unavailable."),
      { status: response.status }
    );
  }

  return result;
}

function localChats() {
  try {
    const value = JSON.parse(
      localStorage.getItem("rii_guest_chats") || "[]"
    );

    return Array.isArray(value)
      ? value.filter(item =>
          item &&
          typeof item.id === "string" &&
          Array.isArray(item.messages)
        ).slice(0, 10)
      : [];
  } catch {
    return [];
  }
}

function putGuest(chat) {
  try {
    localStorage.setItem(
      "rii_guest_chats",
      JSON.stringify([
        chat,
        ...localChats().filter(
          item => item.id !== chat.id
        )
      ].slice(0, status?.history || 3))
    );
  } catch {}
}

function guest() {
  return status?.tier === "guest";
}

const riiSendButton = $(
  "button[type=submit]",
  form
);

riiSendButton.innerHTML = `
  <span>Send</span>

  <svg
    class="rii-send-arrow"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path d="M12 19V5"/>
    <path d="m6 11 6-6 6 6"/>
  </svg>

  <span
    class="rii-send-spinner"
    aria-hidden="true"
  ></span>
`;

riiSendButton.setAttribute(
  "aria-label",
  "Send message"
);

const riiSendStyle = document.createElement("style");

riiSendStyle.textContent = `
.rii-compose button[type="submit"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  min-width: 104px;
  min-height: 42px;
  padding: 10px 17px;
  border-radius: 12px;
  font-weight: 750;
  transition: background .15s, box-shadow .15s;
}

.rii-send-arrow {
  display: block;
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.rii-compose button[type="submit"]:not(:disabled):hover {
  box-shadow: 0 0 18px #26ebbb30;
}

.rii-send-spinner {
  display: none;
  width: 18px;
  height: 18px;
  flex-shrink: 0;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
}

.rii-compose button.rii-sending {
  opacity: .85;
  cursor: wait;
}

.rii-sending .rii-send-arrow {
  display: none;
}

.rii-sending .rii-send-spinner {
  display: block;
  animation: rii-send-spin .75s linear infinite;
}

@keyframes rii-send-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rii-sending .rii-send-spinner {
    animation: none;
  }
}
`;

document.head.append(riiSendStyle);

function usage() {

  riiSendButton.classList.toggle(
    "rii-sending",
    busy
  );

  riiSendButton.setAttribute(
    "aria-busy",
    String(busy)
  );

  riiSendButton.setAttribute(
    "aria-label",
    busy ? "Waiting for RII response" : "Send message"
  );

  $(".rii-quota", mask).textContent = status
    ? status.unlimited
      ? "Admin · Unlimited questions"
      : `${status.remaining} / ${status.limit} questions left today`
    : "Connecting…";

  $('button[type=submit]', form).disabled =
    busy ||
    !status?.enabled ||
    !status?.configured ||
    (!status.unlimited && status.remaining < 1);

  $(".rii-history-note", mask).textContent = guest()
    ? `Last ${status?.history || 3} chats on this browser.`
    : `Last ${status?.history || 3} chats saved to your account.`;

  launcher.hidden = !status?.enabled || admin;

  document.querySelectorAll("[data-rii-open]").forEach(
    button => button.hidden = !status?.enabled
  );

  if (status && !status.enabled) {
    error.textContent =
      "RII is currently disabled for your account type.";
  } else if (status && !status.configured) {
    error.textContent = "RII is not configured yet.";
  }
}

async function refresh() {
  const version = epoch;

  try {
    const result = await api("/status");

    if (version !== epoch) return;

    status = result;
    usage();

    await history();
  } catch (err) {
    if (version === epoch) {
      error.textContent = err.message;

      $(".rii-quota", mask).textContent =
        "Connection unavailable";
    }
  }
}

async function history() {
  const version = epoch;

  try {
    const result = guest()
      ? localChats()
      : (await api("/history")).data;

    if (version !== epoch) return;

    items = Array.isArray(result) ? result : [];
    renderHistory();
  } catch (err) {
    if (version === epoch) {
      error.textContent = err.message;
    }
  }
}

function renderHistory() {
  const target = $(".rii-history-list", mask);

  target.replaceChildren();

  for (const chat of items) {
    const row = document.createElement("div");

    row.className = "rii-history-item";

    const button = document.createElement("button");

    button.type = "button";

    button.className = "rii-btn" + (
      chat.id === selected.id
        ? " rii-selected"
        : ""
    );

    button.textContent = chat.title || "Chat";
    button.title = chat.context || "General chat";
    button.disabled = busy;

    button.onclick = async () => {
      const version = epoch;

      try {
        const saved = guest()
          ? localChats().find(
              item => item.id === chat.id
            )
          : (
              await api(
                "/history?id=" + encodeURIComponent(chat.id)
              )
            ).data;

        if (version !== epoch || busy) return;

        if (saved) {
          selected = saved;
          retry = null;
          error.textContent = "";

          draw();
          renderHistory();

          panel.classList.remove("rii-history-open");
        }
      } catch (err) {
        error.textContent = err.message;
      }
    };

    const remove = document.createElement("button");

    remove.type = "button";
    remove.className = "rii-btn";
    remove.textContent = "×";
    remove.disabled = busy;

    remove.setAttribute(
      "aria-label",
      "Delete " + (chat.title || "chat")
    );

    remove.onclick = async () => {
      const version = epoch;

      try {
        if (guest()) {
          localStorage.setItem(
            "rii_guest_chats",
            JSON.stringify(
              localChats().filter(
                item => item.id !== chat.id
              )
            )
          );
        } else {
          await api(
            "/history?id=" + encodeURIComponent(chat.id),
            "DELETE"
          );
        }

        if (version !== epoch) return;

        if (selected.id === chat.id) {
          reset();
        }

        await history();
      } catch (err) {
        error.textContent = err.message;
      }
    };

    row.append(button, remove);
    target.append(row);
  }
}

const riiAnswerStyle = document.createElement("style");

riiAnswerStyle.textContent = `
.rii-message {
  white-space: normal;
  line-height: 1.65;
}

.rii-answer p {
  margin: 0 0 12px;
}

.rii-answer p:last-child {
  margin-bottom: 0;
}

.rii-answer h4 {
  margin: 18px 0 8px;
  font-size: 14px;
  font-weight: 750;
  color: #34e9b8;
}

.rii-answer h4:first-child {
  margin-top: 0;
}

.rii-answer ul,
.rii-answer ol {
  margin: 8px 0 16px;
  padding-left: 22px;
}

.rii-answer li {
  padding-left: 3px;
  margin: 7px 0;
}

.rii-answer strong {
  font-weight: 750;
  color: #effff7;
}

.rii-user .rii-answer {
  white-space: pre-wrap;
}
`;

document.head.append(riiAnswerStyle);

function riiInline(target, text) {
  const pattern = /\*\*([^*\n]+)\*\*/g;

  let cursor = 0;

  for (const match of text.matchAll(pattern)) {
    target.append(
      document.createTextNode(
        text.slice(cursor, match.index)
      )
    );

    const strong = document.createElement("strong");

    strong.textContent = match[1];

    target.append(strong);

    cursor = match.index + match[0].length;
  }

  target.append(
    document.createTextNode(text.slice(cursor))
  );
}

function riiAnswer(target, text) {
  // Skryje aj poznámky so zdrojmi zo starých chatov.
  const clean = String(text)
    .replace(/\r/g, "")
    .replace(
      /(?:^|\n)\s*\*{0,2}(?:sources?|references?|data sources?)\s*:[\s\S]*$/i,
      ""
    )
    .trim();

  let paragraph = [];
  let list = null;

  const flush = () => {
    if (!paragraph.length) return;

    const element = document.createElement("p");

    riiInline(element, paragraph.join(" "));

    target.append(element);

    paragraph = [];
  };

  for (const raw of clean.split("\n")) {
    const line = raw.trim();

    if (!line) {
      flush();
      list = null;
      continue;
    }

    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    const numbered = /^\d+[.)]\s+(.+)$/.exec(line);

    if (bullet || numbered) {
      flush();

      const tag = bullet ? "UL" : "OL";

      if (!list || list.tagName !== tag) {
        list = document.createElement(
          tag.toLowerCase()
        );

        target.append(list);
      }

      const item = document.createElement("li");

      riiInline(item, (bullet || numbered)[1]);

      list.append(item);

      continue;
    }

    list = null;

    const heading =
      /^#{1,4}\s+(.+)$/.exec(line) ||
      /^\*\*([^*]+)\*\*:?$/.exec(line);

    if (heading) {
      flush();

      const element = document.createElement("h4");

      riiInline(element, heading[1]);

      target.append(element);

      continue;
    }

    paragraph.push(line);
  }

  flush();
}

function bubble(role, text) {
  const message = document.createElement("div");

  message.className = "rii-message" + (
    role === "user" ? " rii-user" : ""
  );

  const label = document.createElement("small");

  label.textContent = role === "user" ? "YOU" : "RII";

  const content = document.createElement("div");

  content.className = "rii-answer";

  if (role === "user") {
    content.textContent = String(text);
  } else {
    riiAnswer(content, text);
  }

  message.append(label, content);

  log.append(message);

  log.scrollTop = log.scrollHeight;
}

function draw() {
  $(".rii-context", mask).textContent =
    selected.context
      ? "Token context · " + selected.context
      : "RugInspect knowledge · General chat";

  log.replaceChildren();

  if (!selected.messages.length) {
    const welcome = document.createElement("div");

    welcome.className = "rii-empty";

    welcome.innerHTML = `
      <div class="rii-orb rii-mark">${icon}</div>
      <h2>Your token. A clearer picture.</h2>
      <p>
        Ask about risks, holders, liquidity
        or any RugInspect feature.
      </p>
      <div class="rii-suggestions"></div>
    `;

const suggestions = selected.context
  ? [
      "What are the main risks of this token?",
      "Check market cap and liquidity.",
      "Explain the holder concentration.",
      "Check X: is the team still posting and what are people saying?"
    ]
  : [
      "What can RugInspect analyze?",
      "How does the risk score work?",
      "What does Premium include?",
      "I want to check a token's activity on X. What do you need?"
    ];

    for (const text of suggestions) {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "rii-btn";
      button.textContent = text;

      button.onclick = () => {
        input.value = text;
        input.focus();
      };

      $(".rii-suggestions", welcome).append(button);
    }

    log.append(welcome);
  } else {
    for (const message of selected.messages) {
      bubble(
        message.role,
        message.content,
        message.sources
      );
    }
  }
}

function reset() {
  selected = newChat(currentCA);
  retry = null;
  input.value = "";
  error.textContent = "";

  draw();
  renderHistory();
}

function close() {
  mask.hidden = true;
  document.body.style.overflow = overflow;
  restoreFocus?.focus();
}

async function open(mode = "drawer") {
  if (mask.hidden) {
    restoreFocus = document.activeElement;
    overflow = document.body.style.overflow;
  }

  mask.hidden = false;

  mask.classList.toggle(
    "rii-full",
    mode === "full"
  );

  panel.classList.toggle(
    "rii-wide",
    mode === "full"
  );

  document.body.style.overflow = "hidden";

  draw();
  input.focus();

  await refresh();
}

launcher.onclick = () => open();

document.addEventListener("click", event => {
  const button = event.target.closest?.(
    "[data-rii-open]"
  );

  if (button) {
    event.preventDefault();

    open(button.dataset.riiOpen || "full");
  }
});

mask.addEventListener("click", event => {
  if (event.target === mask) {
    close();
  }

  const action = event.target.closest?.(
    "[data-action]"
  )?.dataset.action;

  if (action === "close") close();

  if (action === "history") {
    panel.classList.toggle("rii-history-open");
  }

  if (action === "new" && !busy) {
    reset();
  }
});

mask.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    event.preventDefault();
    close();
  }

  if (event.key === "Tab") {
    const nodes = [
      ...panel.querySelectorAll("button,textarea,input")
    ].filter(
      item =>
        !item.disabled &&
        item.getClientRects().length
    );

    const first = nodes[0];
    const last = nodes.at(-1);

    if (
      event.shiftKey &&
      document.activeElement === first
    ) {
      event.preventDefault();
      last?.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === last
    ) {
      event.preventDefault();
      first?.focus();
    }
  }
});

input.addEventListener("keydown", event => {
  if (
    event.key === "Enter" &&
    !event.shiftKey &&
    !event.isComposing
  ) {
    event.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();

  const text = input.value.trim();

  if (
    busy ||
    !text ||
    !status?.enabled ||
    !status?.configured ||
    (!status.unlimited && status.remaining < 1)
  ) {
    return;
  }

  const version = epoch;
  const chat = selected;

  const key =
    chat.id + "|" + chat.context + "|" + text;

  const body = retry?.key === key
    ? retry.body
    : {
        id: uid(),
        chat: chat.id,
        text,
        ca: chat.context,

        history: guest()
          ? chat.messages.slice(-6).map(message => ({
              role: message.role,
              content: message.content.slice(0, 1500)
            }))
          : undefined
      };

  retry = { key, body };
  busy = true;
  error.textContent = "";

  usage();
  renderHistory();

  if (!chat.messages.length) {
    log.replaceChildren();
  }

  bubble("user", text);
  input.value = "";
input.focus();

  const pending = document.createElement("div");

  pending.className = "rii-message";
  pending.textContent = "RII is checking the data…";

  log.append(pending);
  log.scrollTop = log.scrollHeight;

  try {
    const result = await api(
      "/chat",
      "POST",
      body
    );

    if (version !== epoch) return;

    chat.messages.push(
      {
        role: "user",
        content: text
      },
      {
        role: "assistant",
        content: result.text,
        sources: result.sources
      }
    );

    chat.title = chat.messages[0].content.slice(0, 70);
    chat.updated_at = new Date().toISOString();

    status = {
      ...status,
      ...result.status
    };

    if (guest()) {
      putGuest(chat);
    }

    retry = null;

if (selected.id === chat.id) {
  draw();
}

    await history();
  } catch (err) {
    if (version !== epoch) return;

    if (err.status && err.status < 500) {
      retry = null;
    }

if (selected.id === chat.id) {
  draw();
  error.textContent = err.message;

  if (!input.value.trim()) {
    input.value = text;
  }
}
  } finally {
    if (version === epoch) {
      busy = false;
      usage();
      renderHistory();
    }
  }
});

function context(event) {
  const ca = event.detail?.ca || "";

  if (!mint.test(ca) || ca === currentCA) return;

  currentCA = ca;
  reset();
}

document.addEventListener(
  "ri:analysis-start",
  context
);

document.addEventListener(
  "ri:token-context",
  context
);

async function accountChanged() {
  const id = (await auth())?.user?.id || "guest";

  if (id === sessionKey) return;

  sessionKey = id;
  epoch++;
  busy = false;
  status = null;
  items = [];

  reset();
  usage();

  await refresh();

  if (admin) {
    await loadStudio();
  }
}

document.addEventListener(
  "ri:account-change",
  accountChanged
);

window.addEventListener(
  "ri:account-change",
  accountChanged
);

document.addEventListener(
  "ri:premium-change",
  refresh
);

window.addEventListener(
  "ri:premium-change",
  refresh
);

window.addEventListener(
  "bagvyr-admin-ready",
  () => {
    bindAuth();
    accountChanged();
  }
);

let bound;

function bindAuth() {
  const instance = client();

  if (instance && instance !== bound) {
    bound = instance;

    instance.auth.onAuthStateChange(
      () => setTimeout(accountChanged, 0)
    );
  }
}

function studio() {
  const root = document.getElementById(
    "riiSection"
  );

  if (!root) return;

  root.innerHTML = `
    <div class="rii-studio">
      <span class="rii-pill">RII STUDIO</span>

      <h2>RugInspect Intelligence</h2>

      <p>
        Control who can ask RII and how many
        questions they get each day.
      </p>

      <form id="rii-settings">
        <div class="rii-rules"></div>

        <div class="rii-admin-unlimited">
          Admin access
          <strong>∞ Unlimited</strong>
          · Always available
        </div>

        <label class="rii-history-label">
          Saved conversations per user

          <input
            class="rii-history-count"
            name="history"
            type="number"
            min="1"
            max="10"
            value="3"
            required
          >
        </label>

        <div class="rii-studio-actions">
          <button
            type="submit"
            class="rii-btn rii-primary"
          >Save settings</button>

          <button
            type="button"
            class="rii-btn"
            data-rii-open="full"
          >Open RII preview ↗</button>

          <button
            type="button"
            class="rii-btn"
            id="rii-reload"
          >Reload</button>
        </div>

        <p
          class="rii-studio-message"
          role="status"
        ></p>
      </form>

      <p class="rii-note">
        Daily limits reset at midnight in Europe/Bratislava.
        Lowering history permanently removes older saved chats.
        Guest history stays on the browser.
        Text only; image generation is unavailable.
      </p>
    </div>
  `;

  const rules = $(".rii-rules", root);

  for (const [key, title, limit] of [
    ["guest", "Guests", 1],
    ["user", "Signed-in users", 3],
    ["premium", "Premium", 40]
  ]) {
    const card = document.createElement("div");

    card.className = "rii-rule";

    card.innerHTML = `
      <h3>${title}</h3>

      <label>
        <input
          name="${key}-enabled"
          type="checkbox"
          checked
        >
        RII enabled
      </label>

      <label>
        Questions per day

        <input
          name="${key}-limit"
          type="number"
          min="0"
          max="10000"
          value="${limit}"
          required
        >
      </label>
    `;

    rules.append(card);
  }

  const settings = $("#rii-settings", root);
  const message = $(".rii-studio-message", root);

  settings.addEventListener("submit", async event => {
    event.preventDefault();

    if (!settings.reportValidity()) return;

    const data = {
      history: Number(
        settings.elements.history.value
      )
    };

    for (const key of ["guest", "user", "premium"]) {
      data[key] = {
        enabled:
          settings.elements[key + "-enabled"].checked,

        limit: Number(
          settings.elements[key + "-limit"].value
        )
      };
    }

    const button = $(
      "button[type=submit]",
      settings
    );

    button.disabled = true;

    try {
      await api("/admin", "POST", data);

      message.textContent = "Settings saved.";

      await refresh();
    } catch (err) {
      message.textContent = err.message;
    } finally {
      button.disabled = false;
    }
  });

  $("#rii-reload", root).onclick = loadStudio;

  settings.querySelectorAll(
    "input,button[type=submit]"
  ).forEach(item => item.disabled = true);
}

async function loadStudio() {
  const root = document.getElementById(
    "riiSection"
  );

  if (!root) return;

  const version = epoch;

  try {
    const result = await api("/admin");

    if (version !== epoch) return;

    const form = $("#rii-settings", root);
    const settings = result.settings;

    for (const key of ["guest", "user", "premium"]) {
      form.elements[key + "-enabled"].checked =
        settings[key].enabled;

      form.elements[key + "-limit"].value =
        settings[key].limit;
    }

    form.elements.history.value = settings.history;

    form.querySelectorAll(
      "input,button[type=submit]"
    ).forEach(item => item.disabled = false);

    $(".rii-studio-message", root).textContent =
      result.configured
        ? "RII backend connected."
        : "Add OPENAI_API_KEY and RII_MODEL in Cloudflare to activate answers.";
  } catch (err) {
    if (version === epoch) {
      $(".rii-studio-message", root).textContent =
        err.message;
    }
  }
}

if (admin) {
  studio();
}

document.addEventListener(
  "bagvyr:admin-section",
  event => {
    if (event.detail?.section === "rii") {
      loadStudio();
    }
  }
);

window.addEventListener("focus", () => {
  bindAuth();

  if (!mask.hidden) {
    refresh();
  }
});

setInterval(() => {
  bindAuth();

  if (!mask.hidden) {
    refresh();
  }
}, 60000);

window.RII = {
  open,
  close
};

draw();
bindAuth();
accountChanged();

})();