(() => {
  'use strict';

  const root = document.getElementById('aiTemplateRoot');
  if (!root) return;

  const templateURL = new URL(
    'ai-template.png',
    document.currentScript.src
  ).href;

  root.innerHTML = `
    <style>
      #aiTemplateRoot {
        color: inherit;
        max-width: 1100px;
      }

      #aiTemplateRoot .ai-card {
        border: 1px solid #315646;
        border-radius: 16px;
        padding: 22px;
        background: #10271d;
        margin-bottom: 18px;
      }

      #aiTemplateRoot .ai-row {
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }

      #aiTemplateRoot h2 {
        margin: 0 0 10px;
      }

      #aiTemplateRoot p {
        line-height: 1.5;
      }

      #aiTemplateRoot input {
        flex: 1;
        min-width: 200px;
        background: #071b12;
        color: #f5f1de;
        border: 1px solid #547560;
        padding: 13px;
        border-radius: 9px;
        font: inherit;
      }

      #aiTemplateRoot button {
        padding: 12px 16px;
        border-radius: 9px;
        border: 1px solid #547560;
        background: #cde7a9;
        color: #122819;
        font-weight: 700;
        cursor: pointer;
      }

      #aiTemplateRoot button:disabled {
        opacity: .5;
        cursor: wait;
      }

      #aiTemplateRoot .ai-secondary {
        background: transparent;
        color: #e8eedc;
      }

      #aiTemplateRoot .ai-small {
        font-size: 13px;
        opacity: .8;
      }

      #aiTemplateRoot #aiMessage {
        min-height: 24px;
        color: #f0d598;
      }

      #aiTemplateRoot canvas {
        display: block;
        width: 100%;
        max-width: 560px;
        height: auto;
        margin: 18px auto;
        border-radius: 8px;
      }

      #aiTemplateRoot textarea {
        width: 100%;
        box-sizing: border-box;
        min-height: 100px;
        background: #071b12;
        color: #e8eedc;
        border: 1px solid #547560;
        padding: 12px;
        border-radius: 9px;
      }
    </style>

    <div class="ai-card">
      <h2>AI Template</h2>
      <p>
        Generate a token snapshot using the official RugInspect template.
      </p>

      <div class="ai-row">
        <strong id="aiKeyDays">Loading key status…</strong>

        <button
          type="button"
          id="aiRefresh"
          class="ai-secondary"
        >
          Refresh key status
        </button>
      </div>

      <p id="aiKeyDates" class="ai-small"></p>

      <p class="ai-small">
        After replacing OPENAI_API_KEY in Supabase, refresh
        the status to start a new 120-day rotation period.
      </p>
    </div>

    <div class="ai-card">
      <form id="aiForm">
        <label for="aiCA">Solana contract address (CA)</label>

        <div class="ai-row" style="margin-top:10px">
          <input
            id="aiCA"
            name="ca"
            placeholder="Paste a Solana CA"
            maxlength="44"
            autocomplete="off"
            required
          >

          <button id="aiGenerate" type="submit" disabled>
            Generate post
          </button>
        </div>
      </form>

      <p id="aiMessage" role="status" aria-live="polite"></p>

      <div id="aiResult" hidden>
        <canvas
          id="aiCanvas"
          width="1122"
          height="1402"
          aria-label="Generated RugInspect token snapshot"
        ></canvas>

        <div class="ai-row">
          <button type="button" id="aiDownload">
            Download PNG
          </button>

          <button
            type="button"
            id="aiCopy"
            class="ai-secondary"
          >
            Copy caption
          </button>
        </div>

        <p><label for="aiCaption">X caption</label></p>
        <textarea id="aiCaption" readonly></textarea>

        <p id="aiSnapshot" class="ai-small"></p>
      </div>
    </div>
  `;

  const $ = id => document.getElementById(id);

  let state = null;
  let busy = false;
  let revision = 0;
  let filename = 'ruginspect.png';

  const getClient = () => window.BAGVYR_ADMIN_CLIENT;

  function controls() {
    $('aiGenerate').disabled = busy || !state?.canGenerate;
    $('aiRefresh').disabled = busy;
  }

  function status(s) {
    state = s;

    $('aiKeyDays').textContent = s.needsRefresh
      ? 'New key detected — refresh required'
      : s.expired
        ? 'Key rotation overdue'
        : `${s.remainingDays} days remaining`;

    $('aiKeyDates').textContent =
      `Started: ${new Date(s.startedAt).toLocaleDateString('en-GB')}` +
      ` · Replace by: ${new Date(s.expiresAt).toLocaleDateString('en-GB')}`;

    controls();
  }

  async function call(action, ca) {
    const client = getClient();

    if (!client) {
      throw new Error('Admin client is not ready.');
    }

    const {
      data: { session }
    } = await client.auth.getSession();

    if (!session) {
      throw new Error('Please sign in again.');
    }

    const { data, error } = await client.functions.invoke(
      'ai-template',
      {
        body: {
          action,
          ...(ca ? { ca } : {})
        }
      }
    );

    if (error) {
      let detail;

      try {
        detail = await error.context?.json();
      } catch (_) {
        // The error response may not contain JSON.
      }

      const e = new Error(
        detail?.error ||
        'AI Template request failed. Check the deployed function.'
      );

      e.state = detail?.state;
      throw e;
    }

    if (!data || data.error) {
      throw new Error(data?.error || 'Empty response.');
    }

    return data;
  }

  async function load(action = 'status') {
    if (busy) return;

    busy = true;
    controls();

    const own = ++revision;
    $('aiMessage').textContent = '';

    try {
      const data = await call(action);

      if (own === revision) {
        status(data.state);
      }
    } catch (e) {
      if (own === revision) {
        state = null;
        $('aiKeyDays').textContent = 'Key status unavailable';
        $('aiMessage').textContent = e.message;
      }
    } finally {
      if (own === revision) {
        busy = false;
        controls();
      }
    }
  }

  const available = v =>
    typeof v === 'number' && Number.isFinite(v);

  const num = v =>
    available(v)
      ? new Intl.NumberFormat('en-US', {
          notation: 'compact',
          maximumFractionDigits: 2
        }).format(v)
      : 'Unavailable';

  const money = v =>
    available(v) ? '$' + num(v) : 'Unavailable';

  const pct = v =>
    available(v) ? v.toFixed(2) + '%' : 'Unavailable';

  function loadTokenLogo(url) {
    if (!url) return Promise.resolve(null);

    return new Promise(resolve => {
      const logo = new Image();
      let finished = false;
      let timer;

      function finish(result) {
        if (finished) return;

        finished = true;
        clearTimeout(timer);
        logo.onload = null;
        logo.onerror = null;
        resolve(result);
      }

      logo.crossOrigin = 'anonymous';
      logo.referrerPolicy = 'no-referrer';

      logo.onload = () => finish(logo);
      logo.onerror = () => finish(null);

      timer = setTimeout(() => finish(null), 5000);

      logo.src = url;
    });
  }

  async function draw(s, take) {
    const tokenLogo = await loadTokenLogo(
  s.imageDataUrl || s.imageUrl
);

    return new Promise((resolve, reject) => {
      const image = new Image();

      image.onload = () => {
        try {
          const canvas = $('aiCanvas');
          const ctx = canvas.getContext('2d');

          ctx.clearRect(0, 0, 1122, 1402);
          ctx.drawImage(image, 0, 0, 1122, 1402);

          function text(
            value,
            x,
            y,
            width,
            size = 32,
            color = '#09281e',
            center = false
          ) {
            value = String(value);
            let font = size;

            do {
              ctx.font = `bold ${font}px Georgia, serif`;

              if (ctx.measureText(value).width <= width) {
                break;
              }

              font--;
            } while (font > 12);

            ctx.fillStyle = color;
            ctx.textBaseline = 'top';
            ctx.textAlign = center ? 'center' : 'left';

            ctx.fillText(
              value,
              center ? x + width / 2 : x,
              y,
              width
            );
          }

          text(s.name, 36, 153, 555, 55);

          text(
            s.symbol ? '$' + s.symbol : 'Solana',
            36, 224, tokenLogo ? 440 : 545, 36
          );

          if (tokenLogo) {
            const x = 500;
            const y = 207;
            const size = 68;

            ctx.save();

            ctx.beginPath();
            ctx.arc(
              x + size / 2,
              y + size / 2,
              size / 2,
              0,
              Math.PI * 2
            );
            ctx.clip();

            ctx.fillStyle = '#f3eed7';
            ctx.fillRect(x, y, size, size);

            const scale = Math.max(
              size / tokenLogo.naturalWidth,
              size / tokenLogo.naturalHeight
            );

            const width = tokenLogo.naturalWidth * scale;
            const height = tokenLogo.naturalHeight * scale;

            ctx.drawImage(
              tokenLogo,
              x + (size - width) / 2,
              y + (size - height) / 2,
              width,
              height
            );

            ctx.restore();

            ctx.beginPath();
            ctx.arc(
              x + size / 2,
              y + size / 2,
              size / 2,
              0,
              Math.PI * 2
            );

            ctx.strokeStyle = '#164b36';
            ctx.lineWidth = 3;
            ctx.stroke();
          }

          text(
            available(s.score)
              ? `${s.score}/100`
              : 'Unavailable',
            171, 425, 288, 49, '#f3eed7'
          );

          text(
            s.ageLabel || 'Unavailable',
            505, 457, 163, 20, '#09281e', true
          );

          text(
            s.dexPaid === null
              ? 'Unavailable'
              : s.dexPaid
                ? 'Paid'
                : 'Not paid',
            693, 463, 185, 20, '#09281e', true
          );

          text(
            s.geckoListed === null
              ? 'Unavailable'
              : s.geckoListed
                ? 'Listed'
                : 'Not listed',
            906, 463, 184, 20, '#09281e', true
          );

          const market = [
            money(s.marketCap),
            available(s.price)
              ? '$' + s.price.toLocaleString('en-US', {
                  maximumSignificantDigits: 6
                })
              : 'Unavailable',
            money(s.liquidity),
            money(s.volume),
            money(s.peak),
            pct(s.drop)
          ];

          market.forEach((v, i) => {
            text(
              v,
              [47, 400, 758][i % 3],
              i < 3 ? 600 : 703,
              315,
              37
            );
          });

          const holders = [
            num(s.holders),
            num(s.proHolders),
            num(s.newWallets),
            num(s.supply),
            (
              s.top10Estimated && available(s.top10)
                ? '~'
                : ''
            ) + pct(s.top10),
            s.platform
          ];

          holders.forEach((v, i) => {
            text(
              v,
              [47, 266, 475][i % 3],
              i < 3 ? 871 : 968,
              [182, 176, 168][i % 3],
              29
            );
          });

          const holdings = [
            pct(s.dev),
            pct(s.insiders),
            pct(s.bundlers),
            pct(s.smartMoney),
            pct(s.kol),
            pct(s.snipers)
          ];

          holdings.forEach((v, i) => {
            text(
              v,
              i % 2 ? 896 : 698,
              [861, 941, 1018][Math.floor(i / 2)],
              180,
              28
            );
          });

          text(s.majorExit, 190, 1100, 145, 19);
          text(s.marketCollapse, 48, 1236, 280, 22);
          text(s.metadata, 503, 1099, 134, 18);

          text(
            available(s.insiderNetworks)
              ? String(s.insiderNetworks)
              : 'Unavailable',
            367, 1194, 270, 23
          );

          ctx.fillStyle = '#09281e';
          ctx.textAlign = 'left';

          let lines;
          let font = 25;

          do {
            font--;
            ctx.font = `bold ${font}px Georgia, serif`;

            lines = [];
            let line = '';

            for (const word of take.split(/\s+/)) {
              const next = line ? line + ' ' + word : word;

              if (
                ctx.measureText(next).width > 374 &&
                line
              ) {
                lines.push(line);
                line = word;
              } else {
                line = next;
              }
            }

            if (line) lines.push(line);
          } while (
            lines.length * (font + 1) > 130 &&
            font > 18
          );

          if (lines.length * (font + 1) > 130) {
            throw new Error(
              'Summary does not fit the template. Try again.'
            );
          }

          lines.forEach((v, i) => {
            ctx.fillText(
              v,
              696,
              1140 + i * (font + 1),
              374
            );
          });

          text(
            'Snapshot: ' +
              s.snapshotAt
                .replace('T', ' ')
                .replace(/\.\d+Z$/, ' UTC'),
            32, 1296, 700, 14
          );

          text(s.ca, 100, 1352, 625, 20, '#f3eed7');

          resolve();
        } catch (error) {
          reject(error);
        }
      };

      image.onerror = () => {
        reject(new Error(
          'Template could not load. Upload ai-template.png next to this script.'
        ));
      };

      image.src = templateURL;
    });
  }

  $('aiRefresh').addEventListener('click', () => {
    load('refresh');
  });

  $('aiForm').addEventListener('submit', async e => {
    e.preventDefault();

    if (busy || !state?.canGenerate) return;

    const ca = $('aiCA').value.trim();

    if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca)) {
      $('aiMessage').textContent = 'Enter a valid Solana CA.';
      return;
    }

    busy = true;
    controls();

    const own = ++revision;

    $('aiResult').hidden = true;
    $('aiMessage').textContent =
      'Analyzing token and preparing the post…';

    try {
      const data = await call('generate', ca);
      if (own !== revision) return;

      await draw(data.snapshot, data.take);
      if (own !== revision) return;

      status(data.state);
      $('aiCaption').value = data.caption;

      filename = `ruginspect-${ca}.png`;

      $('aiSnapshot').textContent =
        `Data snapshot: ${new Date(
          data.snapshot.snapshotAt
        ).toISOString()}. Unavailable fields were not verified.` +
        (
          data.snapshot.top10Estimated
            ? ' Top 10 concentration is estimated (~).'
            : ''
        );

      $('aiResult').hidden = false;
      $('aiMessage').textContent =
        'Your post is ready. Review it before publishing.';
    } catch (err) {
      if (own === revision) {
        if (err.state) status(err.state);
        $('aiMessage').textContent = err.message;
      }
    } finally {
      if (own === revision) {
        busy = false;
        controls();
      }
    }
  });

  $('aiDownload').addEventListener('click', () => {
    $('aiCanvas').toBlob(blob => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.download = filename;
      link.click();

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, 'image/png');
  });

  $('aiCopy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(
        $('aiCaption').value
      );

      $('aiMessage').textContent = 'Caption copied.';
    } catch (_) {
      $('aiCaption').focus();
      $('aiCaption').select();

      $('aiMessage').textContent =
        'Select and copy the caption above.';
    }
  });

  document.addEventListener(
    'bagvyr:admin-section',
    e => {
      if (e.detail?.section === 'ai-template') {
        load();
      }
    }
  );

  function connect() {
    getClient()?.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        revision++;
        busy = false;
        state = null;

        $('aiResult').hidden = true;
        $('aiCaption').value = '';

        $('aiCanvas')
          .getContext('2d')
          .clearRect(0, 0, 1122, 1402);

        controls();
      }
    });
  }

  if (getClient()) {
    connect();
  } else {
    window.addEventListener(
      'bagvyr-admin-ready',
      connect,
      { once: true }
    );
  }
})();