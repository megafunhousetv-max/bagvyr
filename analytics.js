(() => {
  "use strict";

  if (window.BagVyrAnalytics) return;

  const config = window.BAGVYR_SUPABASE;

  if (!config?.url || !config?.publishableKey) {
    console.warn("Analytics: missing Supabase configuration.");
    return;
  }

  if (!window.crypto?.randomUUID) {
    console.warn("Analytics requires HTTPS.");
    return;
  }

  let visitorId;

  try {
    visitorId = localStorage.getItem("bagvyr_visitor_id");

    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        visitorId || ""
      )
    ) {
      visitorId = crypto.randomUUID();

      localStorage.setItem(
        "bagvyr_visitor_id",
        visitorId
      );
    }
  } catch {
    visitorId = crypto.randomUUID();
  }

  const endpoint =
    config.url.replace(/\/$/, "") +
    "/rest/v1/rpc/bagvyr_record_event";

  async function sendEvent(eventType, contract = null) {
    const payload = {
      p_event_id: crypto.randomUUID(),
      p_visitor_id: visitorId,
      p_event_type: eventType,
      p_contract: contract
    };

    // Retries use the same event ID to prevent double counting.
    for (let attempt = 0; attempt < 2; attempt++) {
      const controller = new AbortController();

      const timeout = setTimeout(
        () => controller.abort(),
        6000
      );

      try {
        const response = await fetch(endpoint, {
          method: "POST",

          headers: {
            apikey: config.publishableKey,
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload),
          keepalive: true,
          signal: controller.signal
        });

        if (response.ok) return;

        if (
          response.status < 500 &&
          response.status !== 429
        ) {
          console.warn(
            "Analytics event failed:",
            response.status
          );

          return;
        }
      } catch {
        // Analytics errors must not interrupt the scanner.
      } finally {
        clearTimeout(timeout);
      }

      if (attempt === 0) {
        await new Promise(resolve => {
          setTimeout(resolve, 800);
        });
      }
    }

    console.warn("Analytics event could not be saved.");
  }

  window.BagVyrAnalytics = Object.freeze({
    tokenSearch(contract) {
      const ca = String(contract || "").trim();

      if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(ca)) {
        void sendEvent("token_search", ca);
      }
    }
  });

  // Record a visit when the public page loads.
  void sendEvent("page_view");
})();