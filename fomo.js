(() => {
  "use strict";

  let initialized = false;

  function init() {
    const client = window.BAGVYR_ADMIN_CLIENT;

    const root = document.getElementById(
      "fomoSection"
    );

    if (
      initialized ||
      !client ||
      !root
    ) {
      return;
    }

    initialized = true;

    const $ = id => {
      return root.querySelector("#" + id);
    };

    let generation = 0;
    let busy = false;
    let accounts = [];
    let selected = null;

    function message(value) {
      $("fomoStatus").textContent = value;
    }

    function locks() {
      root
        .querySelectorAll(
          "button, input, textarea, select"
        )
        .forEach(el => {
          el.disabled = busy;
        });
    }

    function clear() {
      accounts = [];
      selected = null;

      $("fomoAccountList").replaceChildren();
      $("fomoDraftList").replaceChildren();

      $("fomoAccountForm").reset();
      $("fomoDraftForm").reset();

      $("fomoDetails").hidden = true;

      message("");
    }

    function explain(error) {
      if (error?.code === "23505") {
        return "Tento účet už máš uložený.";
      }

      if (
        error?.code === "42P01" ||
        error?.code === "PGRST205"
      ) {
        return (
          "Najprv spusti fomo.sql " +
          "v Supabase SQL Editore."
        );
      }

      return (
        "Operácia zlyhala. Skontroluj " +
        "prihlásenie, pripojenie a nastavenie " +
        "fomo.sql. Skús znova."
      );
    }

    async function run(task) {
      if (busy) return;

      const version = generation;

      busy = true;
      locks();

      message("Načítavam…");

      try {
        await task(() => {
          return version === generation;
        });

      } catch (error) {
        if (version === generation) {
          message(explain(error));
        }

      } finally {
        busy = false;
        locks();
      }
    }

    function node(tag, text) {
      const el = document.createElement(tag);

      el.textContent = text;

      return el;
    }

    function paintAccounts() {
      const list = $("fomoAccountList");

      list.replaceChildren();

      $("fomoAccountCount").textContent =
        `${accounts.length} uložených účtov`;

      if (!accounts.length) {
        list.append(
          node(
            "p",
            "Zatiaľ nemáš uložený žiadny účet."
          )
        );
      }

      for (const account of accounts) {
        const button = node(
          "button",
          `${account.label} · @${account.handle}`
        );

        button.type = "button";

        button.setAttribute(
          "aria-pressed",
          String(
            account.id === selected?.id
          )
        );

        button.addEventListener(
          "click",
          () => {
            void run(async current => {
              await choose(account, current);

              if (current()) {
                message("");
              }
            });
          }
        );

        list.append(button);
      }
    }

    async function drafts(current) {
      const id = selected?.id;

      if (!id) return;

      const { data, error } = await client
        .from("ri_fomo_drafts")
        .select(
          "id,mint,body,created_at"
        )
        .eq("account_id", id)
        .order(
          "created_at",
          { ascending: false }
        )
        .limit(100);

      if (
        !current() ||
        selected?.id !== id
      ) {
        return;
      }

      if (error) throw error;

      const list = $("fomoDraftList");

      list.replaceChildren();

      if (!data.length) {
        list.append(
          node(
            "p",
            "Žiadne koncepty pre tento účet."
          )
        );
      }

      for (const draft of data) {
        const item = node("article", "");

        item.append(
          node("strong", draft.mint)
        );

        item.append(
          node(
            "small",
            new Date(
              draft.created_at
            ).toLocaleString("sk-SK")
          )
        );

        item.append(
          node("p", draft.body)
        );

        const copy = node(
          "button",
          "Kopírovať tézu"
        );

        copy.type = "button";

        copy.addEventListener(
          "click",
          () => {
            void run(async isCurrent => {
              await navigator.clipboard.writeText(
                draft.body
              );

              if (isCurrent()) {
                message(
                  "Téza skopírovaná. Zverejni ju " +
                  "vo Fomo pod správnym účtom."
                );
              }
            });
          }
        );

        const remove = node(
          "button",
          "Vymazať koncept"
        );

        remove.type = "button";

        remove.addEventListener(
          "click",
          () => {
            if (
              !window.confirm(
                "Vymazať tento koncept?"
              )
            ) {
              return;
            }

            void run(async isCurrent => {
              const result = await client
                .from("ri_fomo_drafts")
                .delete()
                .eq("id", draft.id)
                .select("id");

              if (!isCurrent()) return;

              if (
                result.error ||
                result.data?.length !== 1
              ) {
                throw (
                  result.error ||
                  new Error("Delete failed")
                );
              }

              await drafts(isCurrent);

              if (isCurrent()) {
                message("Koncept vymazaný.");
              }
            });
          }
        );

        item.append(copy, remove);

        list.append(item);
      }
    }

    async function choose(
      account,
      current
    ) {
      selected = account;

      $("fomoDraftForm").reset();
      $("fomoDraftList").replaceChildren();

      $("fomoDetails").hidden = !account;

      paintAccounts();
      locks();

      if (!account) return;

      $("fomoSelectedName").textContent =
        `${account.label} · @${account.handle}`;

      $("fomoProfile").href =
        "https://fomo.family/u/" +
        encodeURIComponent(account.handle);

      await drafts(current);
    }

    async function load(current) {
      const auth =
        await client.auth.getUser();

      if (!current()) return;

      if (
        auth.error ||
        !auth.data.user
      ) {
        throw (
          auth.error ||
          new Error("Sign in")
        );
      }

      const admin = await client
        .from("ri_fomo_admins")
        .select("user_id")
        .eq(
          "user_id",
          auth.data.user.id
        )
        .maybeSingle();

      if (!current()) return;

      if (admin.error) {
        throw admin.error;
      }

      if (!admin.data) {
        clear();

        message(
          "Tento admin nemá pridelený " +
          "prístup v ri_fomo_admins."
        );

        return;
      }

      const result = await client
        .from("ri_fomo_accounts")
        .select("id,label,handle")
        .order(
          "created_at",
          { ascending: true }
        )
        .limit(500);

      if (!current()) return;

      if (result.error) {
        throw result.error;
      }

      accounts = result.data;

      await choose(
        accounts.find(
          account => {
            return (
              account.id === selected?.id
            );
          }
        ) ||
        accounts[0] ||
        null,
        current
      );

      if (current()) {
        message("");
      }
    }

    $("fomoReload").addEventListener(
      "click",
      () => {
        void run(load);
      }
    );

    $("fomoAccountForm").addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const label =
          $("fomoLabel").value.trim();

        const handle =
          $("fomoHandle")
            .value
            .trim()
            .replace(/^@/, "");

        if (
          !label ||
          label.length > 80 ||
          !/^[A-Za-z0-9_.-]{1,64}$/.test(
            handle
          )
        ) {
          message(
            "Zadaj názov a Fomo používateľské " +
            "meno bez odkazu (napr. @meno)."
          );

          return;
        }

        void run(async current => {
          const result = await client
            .from("ri_fomo_accounts")
            .insert({
              label,
              handle
            })
            .select("id,label,handle")
            .single();

          if (!current()) return;

          if (result.error) {
            throw result.error;
          }

          selected = result.data;

          $("fomoAccountForm").reset();

          await load(current);

          if (current()) {
            message(
              "Záznam účtu uložený. " +
              "Účet nie je prihlásený do Fomo."
            );
          }
        });
      }
    );

    $("fomoDraftForm").addEventListener(
      "submit",
      event => {
        event.preventDefault();

        const accountId = selected?.id;

        const mint =
          $("fomoMint").value.trim();

        const body =
          $("fomoBody").value.trim();

        if (
          !accountId ||
          !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(
            mint
          ) ||
          !body ||
          [...body].length > 3000
        ) {
          message(
            "Vyber účet, zadaj platnú Solana CA " +
            "a tézu do 3 000 znakov."
          );

          return;
        }

        void run(async current => {
          const result = await client
            .from("ri_fomo_drafts")
            .insert({
              account_id: accountId,
              mint,
              body
            });

          if (!current()) return;

          if (result.error) {
            throw result.error;
          }

          $("fomoDraftForm").reset();

          await drafts(current);

          if (current()) {
            message(
              "Koncept uložený v Supabase. " +
              "Na Fomo sa neodoslal."
            );
          }
        });
      }
    );

    document.addEventListener(
      "bagvyr:admin-section",
      event => {
        if (
          event.detail?.section === "fomo"
        ) {
          void run(load);
        }
      }
    );

    client.auth.onAuthStateChange(() => {
      generation++;

      clear();

      if (!root.hidden) {
        setTimeout(() => {
          void run(load);
        }, 0);
      }
    });

    if (!root.hidden) {
      void run(load);
    }
  }

  window.addEventListener(
    "bagvyr-admin-ready",
    init
  );

  if (
    document.readyState === "loading"
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