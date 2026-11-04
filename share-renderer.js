/* RugInspect share-card renderer */
(() => {
  "use strict";

  const CONFIG = {
    API_BASE: "https://bagvyr-api.megafunhousetv.workers.dev"
  };

  async function getDexTokenImage(contract) {
    try {
      const response = await fetch(
        "https://api.dexscreener.com/token-pairs/v1/solana/" +
          encodeURIComponent(contract),
        {
          signal: AbortSignal.timeout(8000)
        }
      );

      if (!response.ok) return null;

      const pairs = await response.json();

      if (!Array.isArray(pairs)) return null;

      return pairs
        .filter(pair =>
          pair?.chainId === "solana" &&
          pair?.baseToken?.address === contract
        )
        .sort((a, b) =>
          Number(b?.liquidity?.usd || 0) -
          Number(a?.liquidity?.usd || 0)
        )
        .map(pair => pair?.info?.imageUrl)
        .find(url =>
          typeof url === "string" &&
          url.startsWith("https://")
        ) || null;

    } catch {
      return null;
    }
  }

  function riCardNumber(value) {
    if (
      !["number", "string"].includes(typeof value) ||
      String(value).trim() === ""
    ) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number) && number >= 0
      ? number
      : null;
  }

  function riCardMoney(value) {
    const number = riCardNumber(value);

    if (number === null) return "—";

    for (const [divisor, suffix] of [
      [1e12, "T"],
      [1e9, "B"],
      [1e6, "M"],
      [1e3, "K"]
    ]) {
      if (number >= divisor) {
        return "$" +
          (number / divisor).toFixed(2) +
          suffix;
      }
    }

    return "$" + number.toFixed(2);
  }

  function riCardPercent(value) {
    const number = riCardNumber(value);

    return number === null || number > 100
      ? "—"
      : number.toFixed(2).replace(/\.?0+$/, "") + "%";
  }

  function riCardLoadImage(source) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      const timer = setTimeout(() => finish(false), 12000);

      let finished = false;

      function finish(success) {
        if (finished) return;

        finished = true;

        clearTimeout(timer);

        image.onload = null;
        image.onerror = null;

        if (success) {
          resolve(image);
        } else {
          image.removeAttribute("src");
          reject(new Error("Could not load image."));
        }
      }

      image.crossOrigin = "anonymous";

      image.onload = () =>
        finish(image.naturalWidth > 0);

      image.onerror = () => finish(false);

      image.src = source;
    });
  }

  async function riDrawAnalysisCard(data, contract, logoUrl) {
    const canvas = document.createElement("canvas");

    canvas.width = 1585;
    canvas.height = 992;

    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Image rendering unavailable.");
    }

    const template = await riCardLoadImage(
      "https://ruginspect.com/analyse2.png"
    );

    ctx.drawImage(template, 0, 0, 1585, 992);

    function text(
      value,
      x,
      baseline,
      width,
      size = 48,
      color = "#f1faf6",
      weight = 700,
      family = "Arial"
    ) {
      let content = String(value ?? "—");
      let fontSize = size;

      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";

      function setFont() {
        ctx.font = `${weight} ${fontSize}px ${family}`;
      }

      setFont();

      while (
        ctx.measureText(content).width > width &&
        fontSize > 14
      ) {
        fontSize--;
        setFont();
      }

      if (ctx.measureText(content).width > width) {
        while (
          content.length &&
          ctx.measureText(content + "…").width > width
        ) {
          content = content.slice(0, -1);
        }

        content += "…";
      }

      ctx.fillText(content, x, baseline);
    }

    const token = data.token || {};
    const market = data.market || {};
    const holders = data.holderAnalysis || {};

    const provider =
      data.providerTokenInfo?.token_info || {};

    const name = String(
      token.name || "Unknown token"
    );

    const symbol = String(token.symbol || "")
      .replace(/^\$/, "");

    text(name, 305, 222, 615, 58);

    text(
      symbol ? "$" + symbol : "—",
      305,
      295,
      365,
      42,
      "#b8cbd0",
      600
    );

    async function tryLogoSources(sources) {
      const urls = [
        ...new Set(
          sources.filter(value =>
            typeof value === "string" &&
            value.trim()
          )
        )
      ].slice(0, 4);

      if (!urls.length) return null;

      const attempts = urls.flatMap(source => {
        const proxy = new URL(
          "/api/share-logo",
          CONFIG.API_BASE
        );

        proxy.searchParams.set("url", source);

        return [
          riCardLoadImage(source),
          riCardLoadImage(proxy.href)
        ];
      });

      try {
        return await Promise.any(attempts);
      } catch {
        return null;
      }
    }

    let logo = await tryLogoSources([
      logoUrl,
      data.token?.image,
      data.pumpfun?.image
    ]);

    if (!logo) {
      const dexImage = await getDexTokenImage(contract);

      logo = await tryLogoSources([dexImage]);
    }

    ctx.save();

    ctx.beginPath();
    ctx.roundRect(70, 138, 192, 192, 30);
    ctx.clip();

    if (logo) {
      const scale = Math.max(
        192 / logo.naturalWidth,
        192 / logo.naturalHeight
      );

      const width = logo.naturalWidth * scale;
      const height = logo.naturalHeight * scale;

      ctx.drawImage(
        logo,
        166 - width / 2,
        234 - height / 2,
        width,
        height
      );
    } else {
      ctx.fillStyle = "#09251c";
      ctx.fillRect(70, 138, 192, 192);

      ctx.fillStyle = "#bafbe0";
      ctx.font = "700 92px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.fillText(
        (symbol || name).slice(0, 1).toUpperCase(),
        166,
        234
      );
    }

    ctx.restore();

    const rawScore =
      typeof data.score === "number"
        ? data.score
        : data.score?.value ?? data.score?.score;

    const parsedScore = riCardNumber(rawScore);

    const score =
      parsedScore !== null && parsedScore <= 100
        ? parsedScore
        : null;

    const scoreText =
      score === null
        ? "—"
        : String(Math.round(score));

    const scoreColor =
      score === null ? "#a9bcb3" :
      score >= 80 ? "#52efbc" :
      score >= 60 ? "#f5d56c" :
      score >= 40 ? "#f2a34b" :
      "#ef7373";

    ctx.save();

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = scoreColor;
    ctx.font = "700 90px Arial";

    ctx.fillText(scoreText, 1099, 239);

    if (score !== null && score > 0) {
      ctx.beginPath();

      ctx.arc(
        1099,
        231,
        97,
        -Math.PI / 2,
        -Math.PI / 2 + Math.PI * 2 * score / 100
      );

      ctx.strokeStyle = scoreColor;
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.stroke();
    }

    ctx.restore();

    const incomplete =
      data.dataCompleteness?.canScore === false;

    const riskLabel =
      score === null ? "SCORE UNAVAILABLE" :
      incomplete ? "INCOMPLETE DATA" :
      score >= 80 ? "LOWER DETECTED RISK" :
      score >= 60 ? "MODERATE DETECTED RISK" :
      score >= 40 ? "ELEVATED DETECTED RISK" :
      "HIGHER DETECTED RISK";

    text(
      riskLabel,
      1250,
      261,
      254,
      19,
      scoreColor,
      700
    );

    const count = riCardNumber(
      holders.holderCount ??
      data.pumpfun?.holderCount ??
      provider.holders
    );

    const top10 =
      holders.adjusted?.top10Concentration ??
      holders.top10Concentration;

    const ageMetric = data.score?.breakdown?.find(
      item => item.metric === "Age (days)"
    );

    let age = riCardNumber(ageMetric?.value);

    if (age === null && token.createdTimestamp) {
      const raw = Number(token.createdTimestamp);

      const timestamp = Number.isFinite(raw)
        ? raw < 1e11 ? raw * 1000 : raw
        : Date.parse(token.createdTimestamp);

      const scannedAt = Date.parse(data.timestamp);

      const elapsed =
        (
          Number.isFinite(scannedAt)
            ? scannedAt
            : Date.now()
        ) - timestamp;

      if (
        Number.isFinite(elapsed) &&
        elapsed >= 0
      ) {
        age = elapsed / 86400000;
      }
    }

    const ageText =
      age === null ? "—" :
      age < 1 ? Math.floor(age * 24) + " hours" :
      Math.floor(age) +
        (Math.floor(age) === 1 ? " day" : " days");

    const values = [
      riCardMoney(
        market.marketCapUsd ?? token.marketCapUsd
      ),

      riCardMoney(
        market.liquidityUsd ??
        data.liquidity?.currentLiquidityUsd ??
        data.liquidity?.totalLiquidityUsd
      ),

      riCardMoney(market.volume24hUsd),

      count === null
        ? "—"
        : Math.floor(count).toLocaleString("en-US"),

      riCardPercent(top10),

      riCardPercent(data.creator?.supplyOwned),

      riCardPercent(
        provider.bundler_holding_percent
      ),

      ageText
    ];

    const columns = [
      { x: 140, width: 250 },
      { x: 525, width: 240 },
      { x: 900, width: 240 },
      { x: 1280, width: 240 }
    ];

    values.forEach((value, index) => {
      const column = columns[index % 4];

      text(
        value,
        column.x,
        index < 4 ? 454 : 609,
        column.width,
        48
      );
    });

    function authority(value) {
      return value === true
        ? "Disabled"
        : value === false
          ? "Active"
          : "—";
    }

    function authorityColor(value) {
      return value === true
        ? "#00e6aa"
        : value === false
          ? "#ef7373"
          : "#b8cbd0";
    }

    const mint =
      data.authorities?.mintAuthorityDisabled;

    const freeze =
      data.authorities?.freezeAuthorityDisabled;

    text(
      authority(mint),
      450,
      704,
      300,
      27,
      authorityColor(mint),
      600
    );

    text(
      authority(freeze),
      1230,
      704,
      280,
      27,
      authorityColor(freeze),
      600
    );

    text(
      contract,
      295,
      798,
      1215,
      28,
      "#ecf5f1",
      500,
      "monospace"
    );

    const measuredAt = new Date(data.timestamp);

    const time = Number.isFinite(measuredAt.getTime())
      ? measuredAt
          .toISOString()
          .slice(0, 16)
          .replace("T", " ") + " UTC"
      : "Unavailable";

    text(
      time,
      1375,
      856,
      165,
      12,
      "#c4d5ce",
      400
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => {
        if (!blob) {
          reject(
            new Error("Could not generate analysis image.")
          );
        } else if (blob.size > 4 * 1024 * 1024) {
          reject(
            new Error("Analysis image is too large.")
          );
        } else {
          resolve(blob);
        }
      }, "image/png");
    });
  }

  async function render() {
    const payload = window.RI_SHARE_PAYLOAD;

    if (
      !payload ||
      !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(
        payload.contract || ""
      )
    ) {
      throw new Error("Invalid render payload.");
    }

    await document.fonts.ready;

    const blob = await riDrawAnalysisCard(
      payload.data,
      payload.contract,
      payload.logoUrl
    );

    const objectURL = URL.createObjectURL(blob);

    const image = document.createElement("img");

    image.id = "riShareRenderedImage";
    image.width = 1585;
    image.height = 992;
    image.alt = "RugInspect analysis snapshot";

    image.style.cssText = [
      "display:block",
      "width:1585px",
      "height:992px",
      "margin:0",
      "max-width:none"
    ].join(";");

    image.onload = () => {
      image.dataset.ready = "true";
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectURL);
    };

    image.src = objectURL;

    document.body.replaceChildren(image);
  }

  render().catch(() => {
    const message = document.createElement("p");

    message.textContent =
      "Analysis image could not be rendered.";

    document.body.replaceChildren(message);
  });
})();