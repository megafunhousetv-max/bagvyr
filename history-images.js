(() => {
  "use strict";
  const node = tag => document.createElement(tag);
  const imageURL = value => {
    if (typeof value !== "string") return "";
    let source = value.trim()
      .replace(/^ipfs:\/\/(?:ipfs\/)?/, "https://ipfs.io/ipfs/")
      .replace(/^ar:\/\//, "https://arweave.net/");
    if (source.startsWith("//")) source = "https:" + source;
    try { const url = new URL(source); return url.protocol === "https:" ? url.href : ""; }
    catch { return ""; }
  };
  const historyImageJobs = new Map();
  const historyGoodImages = new Map();

  async function historyImageURLs(contract) {
    const cached = historyImageJobs.get(contract);
    if (cached && cached.expires > Date.now()) return cached.job;
    if (historyImageJobs.size >= 100) historyImageJobs.delete(historyImageJobs.keys().next().value);
    const job = (async () => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 12000);
      try {
        const response = await fetch(
          "https://bagvyr-api.megafunhousetv.workers.dev/api/token-images?ca=" + encodeURIComponent(contract),
          { signal: controller.signal }
        );
        if (!response.ok) return [];
        const data = await response.json();
        return data?.success === true && data.contract === contract && Array.isArray(data.images)
          ? data.images.map(imageURL).filter(Boolean) : [];
      } catch { return []; }
      finally { clearTimeout(timer); }
    })();
    const entry = { job, expires: Date.now() + 30000 };
    historyImageJobs.set(contract, entry);
    job.then(urls => { if (urls.length) entry.expires = Date.now() + 900000; });
    return job;
  }

  function addHistoryImage(avatar, item) {
    const img = node("img");
    img.alt = "";
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.style.visibility = "hidden";
    avatar.append(img);
    const candidates = [historyGoodImages.get(item.contract), item.image];
    const tried = new Set();
    let stage = 0, busy = false;
    async function next() {
      if (busy || !avatar.isConnected) return;
      busy = true;
      img.style.visibility = "hidden";
      try {
        while (avatar.isConnected) {
          const url = imageURL(candidates.shift());
          if (url && !tried.has(url)) {
            tried.add(url);
            img.src = url;
            return;
          }
          if (candidates.length) continue;
          if (stage === 0) {
            stage = 1;
            try {
              if (typeof window.getDexTokenImage === "function") {
                candidates.push(await window.getDexTokenImage(item.contract));
              }
            } catch {}
            continue;
          }
          if (stage === 1) {
            stage = 2;
            candidates.push(...await historyImageURLs(item.contract));
            continue;
          }
          img.remove();
          return;
        }
      } finally { busy = false; }
    }
    img.addEventListener("error", () => void next());
    img.addEventListener("load", () => {
      if (!avatar.isConnected) return;
      img.style.visibility = "visible";
      if (historyGoodImages.size >= 100) historyGoodImages.delete(historyGoodImages.keys().next().value);
      historyGoodImages.set(item.contract, img.src);
    });
    queueMicrotask(() => void next());
  }

  window.RI_HISTORY_IMAGE = addHistoryImage;
})();
