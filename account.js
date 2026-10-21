(() => {
  "use strict";

  function init() {
    const root = document.getElementById("riAccountRoot");

    if (!root) return;

    const $ = id => document.getElementById(id);
    const config = window.BAGVYR_SUPABASE;

    if (
      !config?.url ||
      !config.publishableKey ||
      !window.supabase?.createClient
    ) {
      root.textContent =
        "Account unavailable. Check Supabase configuration and reload.";

      return;
    }

    const authReturn =
      /access_token=|error_description=/.test(location.hash);

    let client;

    try {
      client = window.supabase.createClient(
        config.url,
        config.publishableKey,
        {
          auth: {
            storage: window.sessionStorage,
            storageKey: "bagvyr_admin_auth",
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: "implicit"
          }
        }
      );
    } catch {
      root.textContent =
        "Account storage is unavailable. Allow browser storage and reload.";

      return;
    }

    window.RI_ACCOUNT_CLIENT = client;

    let session = null;
    let profile = null;
    let mode = "signin";
    let busy = false;
    let version = 0;
    let signature = "";

    const redirectTo =
      location.origin + location.pathname;

    root.innerHTML = `
      <div id="raAuth" class="ra-auth">
        <div class="ra-intro">
          <span class="ra-eyebrow">YOUR ACCOUNT</span>

          <h1>
            Welcome to<br>
            <em>RugInspect.</em>
          </h1>

          <p>
            Your profile, wallet and Premium tools in one place.
          </p>

          <ul>
            <li>Personal profile</li>
            <li>Verified wallet</li>
            <li>Premium access</li>
          </ul>
        </div>

        <div class="ra-card">
          <div id="raTabs" class="ra-tabs">
            <button type="button" data-mode="signin">
              Sign in
            </button>

            <button type="button" data-mode="signup">
              Create account
            </button>
          </div>

          <h2 id="raTitle">Welcome back</h2>

          <p id="raSubtitle">
            Sign in to your RugInspect account.
          </p>

          <form id="raAuthForm">
            <label id="raNameField" hidden>
              Display name

              <input
                id="raName"
                autocomplete="nickname"
                minlength="2"
                maxlength="40"
              >
            </label>

            <label id="raEmailField">
              Email address

              <input
                id="raEmail"
                type="email"
                autocomplete="username"
                maxlength="254"
                required
              >
            </label>

            <label id="raPasswordField">
              Password

              <span class="ra-password">
                <input
                  id="raPassword"
                  type="password"
                  autocomplete="current-password"
                  maxlength="128"
                  required
                >

                <button
                  id="raShowPassword"
                  type="button"
                  aria-label="Show password"
                  aria-pressed="false"
                >
                  Show
                </button>
              </span>
            </label>

            <button
              id="raForgot"
              class="ra-text"
              type="button"
              data-mode="forgot"
            >
              Forgot password?
            </button>

            <button
              id="raSubmit"
              class="ra-primary"
              type="submit"
            >
              Sign in
            </button>
          </form>

          <button
            id="raBack"
            type="button"
            class="ra-text"
            data-mode="signin"
            hidden
          >
            Back to sign in
          </button>

          <button id="raRetry" type="button" hidden>
            Retry loading profile
          </button>

          <button
            id="raCancelSession"
            type="button"
            data-logout
            hidden
          >
            Sign out
          </button>

          <p class="ra-small">
            Wallet connection is optional at sign-up.
          </p>
        </div>
      </div>

      <div id="raProfile" hidden>
        <div class="ra-heading">
          <div>
            <span class="ra-eyebrow">MY ACCOUNT</span>

            <h1>
              Welcome back,
              <em id="raGreeting"></em>
            </h1>

            <p>
              Manage your wallet and Premium access.
            </p>
          </div>

          <div class="ra-actions">
            <a id="raAdmin" href="admin.html" hidden>
              Admin panel
            </a>

            <button id="raSettings" type="button">
              Account settings
            </button>
          </div>
        </div>

        <div class="ra-summary">
          <div class="ra-card">
            <h3>Account</h3>
            <p id="raEmailStatus"></p>
          </div>

          <div class="ra-card">
            <h3>Solana wallet</h3>
            <p>Not connected</p>
          </div>

          <div class="ra-card">
            <h3>Premium</h3>
            <p id="raPremiumStatus"></p>
          </div>
        </div>

        <div class="ra-columns">
          <div class="ra-card">
            <h2>Your wallet</h2>

            <p>
              Connect and verify your Solana wallet.
            </p>

            <div class="ra-notice">
              Wallet connection coming soon
            </div>

            <p class="ra-small">
              Verification will use a signed message.
              Your wallet stays under your control.
            </p>

            <button type="button" data-coming disabled>
              Connect wallet · Coming soon
            </button>
          </div>

          <div class="ra-card">
            <h2>Premium access</h2>

            <p id="raPremiumNote"></p>

            <div class="ra-tools">
              <span>Exit Lab</span>
              <span>Whale X-Ray</span>
              <span>Volume X-Ray</span>
              <span>Early Buyers</span>
            </div>

            <a
              id="raOpenPremium"
              class="ra-primary"
              href="#premium"
              hidden
            >
              Open Premium
            </a>

            <p id="raTokenSoon" class="ra-notice">
              Token verification coming soon
            </p>
          </div>
        </div>

        <div class="ra-card ra-telegram">
          <div>
            <h3>Premium Telegram bot</h3>

            <p>
              Link your Telegram account when
              the new bot is available.
            </p>
          </div>

          <span class="ra-badge">Coming soon</span>
        </div>

        <div id="raEdit" class="ra-card" hidden>
          <h2>Account settings</h2>
          <p id="raAccountEmail"></p>

          <form id="raProfileForm">
            <label>Display name
              <input
                id="raEditName"
                minlength="2"
                maxlength="40"
                required
              >
            </label>

            <div class="ra-actions">
              <button type="submit" class="ra-primary">
                Save name
              </button>

              <button id="raCloseSettings" type="button">
                Close
              </button>
            </div>
          </form>

          <details
            id="raPasswordSettings"
            class="ra-password-settings"
          >
            <summary>Change password</summary>

            <form id="raChangePasswordForm">
              <label>Current password
                <input
                  id="raCurrentPassword"
                  type="password"
                  autocomplete="current-password"
                  maxlength="128"
                  required
                >
              </label>

              <label>New password
                <input
                  id="raNewPassword"
                  type="password"
                  autocomplete="new-password"
                  minlength="12"
                  maxlength="128"
                  required
                >
              </label>

              <label>Confirm new password
                <input
                  id="raConfirmPassword"
                  type="password"
                  autocomplete="new-password"
                  minlength="12"
                  maxlength="128"
                  required
                >
              </label>

              <p class="ra-small">
                Use at least 12 characters.
              </p>

              <button type="submit" class="ra-primary">
                Save new password
              </button>

              <p
                id="raPasswordMessage"
                role="status"
                aria-live="polite"
              ></p>
            </form>
          </details>
        </div>

        <div class="ra-bottom">
          <span>
            Your wallet stays under your control.
          </span>

          <button type="button" data-logout>
            Sign out
          </button>
        </div>
      </div>

      <p
        id="raMessage"
        role="status"
        aria-live="polite"
      ></p>
    `;

    const isAdmin = () =>
      !!session &&
      profile?.id === session.user.id &&
      profile.is_admin === true;

    window.RI_ACCOUNT = { isAdmin };

    function message(value, type = "info") {
      const box = $("raMessage");

      box.textContent = value;
      box.dataset.type = type;

      if (!$("raAuth").hidden) {
        $("raAuthForm").before(box);
      } else {
        $("raProfile").prepend(box);
      }
    }

    function authErrorMessage(error) {
      const code = error?.code || "";

      const hints = {
        email_not_confirmed:
          "Confirm your email using the link in your inbox before signing in.",

        invalid_credentials:
          "Email or password is incorrect. Use your email address, not your display name.",

        email_address_not_authorized:
          "Confirmation email could not be sent. Website email delivery needs configuration.",

        over_email_send_rate_limit:
          "Email sending limit reached. Please wait before requesting another email.",

        over_request_rate_limit:
          "Too many attempts. Please wait a few minutes and try again.",

        signup_disabled:
          "New account registration is currently disabled.",

        email_provider_disabled:
          "Email registration is currently disabled."
      };

      const text =
        hints[code] ||
        error?.message ||
        "Request failed. Please try again.";

      return code
        ? text + " [" + code + "]"
        : text;
    }

    function setBusy(value) {
      busy = value;

      root.querySelectorAll(
        "button, input"
      ).forEach(element => {
        element.disabled =
          value ||
          element.hasAttribute("data-coming");
      });
    }

    function render() {
      const logged =
        !!session &&
        !!profile &&
        mode !== "password";

      $("raAuth").hidden = logged;
      $("raProfile").hidden = !logged;

      $("raAuthForm").hidden =
        !!session &&
        !profile &&
        mode !== "password";

      $("raRetry").hidden =
        !session || !!profile;

      $("raCancelSession").hidden =
        !session || !!profile;

      $("raTabs").hidden =
        mode === "forgot" ||
        mode === "password" ||
        !!session;

      $("raBack").hidden =
        mode !== "forgot";

      $("raNameField").hidden =
        mode !== "signup";

      $("raName").required =
        mode === "signup";

      $("raEmailField").hidden =
        mode === "password";

      $("raEmail").required =
        mode !== "password";

      $("raPasswordField").hidden =
        mode === "forgot";

      $("raPassword").required =
        mode !== "forgot";

      $("raPassword").minLength =
        mode === "signup" ||
        mode === "password"
          ? 12
          : 1;

      $("raPassword").autocomplete =
        mode === "signin"
          ? "current-password"
          : "new-password";

      $("raForgot").hidden =
        mode !== "signin";

      const titles = {
        signin: [
          "Welcome back",
          "Sign in to your RugInspect account.",
          "Sign in"
        ],

        signup: [
          "Create your account",
          "Use an email address and a password of at least 12 characters.",
          "Create account"
        ],

        forgot: [
          "Reset your password",
          "Enter your account email to request a reset link.",
          "Send reset link"
        ],

        password: [
          "Choose a new password",
          "Use at least 12 characters.",
          "Save new password"
        ]
      };

      const labels = titles[mode];

      $("raTitle").textContent = labels[0];
      $("raSubtitle").textContent = labels[1];
      $("raSubmit").textContent = labels[2];

      root.querySelectorAll(
        "[data-mode]"
      ).forEach(button => {
        button.classList.toggle(
          "ra-selected",
          button.dataset.mode === mode
        );
      });

      const nav = $("riAccountLabel");

      if (nav) {
        nav.textContent = session
          ? profile?.display_name || "My account"
          : "Sign in";
      }

      if (logged) {
        $("raGreeting").textContent =
          profile.display_name;

        $("raEmailStatus").textContent =
          session.user.email_confirmed_at
            ? "Email verified"
            : "Email confirmation pending";

        $("raPremiumStatus").textContent =
          isAdmin()
            ? "Admin · Full access"
            : "Coming soon";

        $("raPremiumNote").textContent =
          isAdmin()
            ? "Your admin account has full access without tokens or a connected wallet."
            : "Token eligibility will be available after launch.";

        $("raAdmin").hidden = !isAdmin();
        $("raOpenPremium").hidden = !isAdmin();
        $("raTokenSoon").hidden = isAdmin();

        $("raEditName").value =
          profile.display_name;

        $("raAccountEmail").textContent =
          session.user.email || "";
      }

      setBusy(busy);

      const next = JSON.stringify([
        session?.user.id || null,
        isAdmin()
      ]);

      if (next !== signature) {
        signature = next;

        document.dispatchEvent(
          new Event("ri:account-change")
        );
      }
    }

    async function applySession(event, nextSession) {
      if (
        [
          "INITIAL_SESSION",
          "SIGNED_IN",
          "USER_UPDATED",
          "TOKEN_REFRESHED"
        ].includes(event) &&
        !!nextSession &&
        profile?.id === nextSession.user.id
      ) {
        session = nextSession;
        return;
      }

      const current = ++version;

      if (session?.user.id !== nextSession?.user.id) {
        clearPasswordForm();
        $("raEdit").hidden = true;
      }

      session = nextSession;
      profile = null;

      if (event === "PASSWORD_RECOVERY") {
        mode = "password";
        location.hash = "account";
      }

      if (!session) {
        mode = "signin";
        $("raEdit").hidden = true;
        render();
        return;
      }

      message("Loading your profile…");
      render();

      try {
        const result =
          await client.rpc("ri_account_profile");

        if (result.error) {
          throw result.error;
        }

        const data = result.data;

        if (
          data?.id !== nextSession.user.id ||
          typeof data.is_admin !== "boolean" ||
          typeof data.display_name !== "string"
        ) {
          throw new Error(
            "Invalid profile response."
          );
        }

        if (current !== version) {
          return;
        }

        profile = data;
        message("");

        if (authReturn) {
          location.hash = "account";
        }

        render();

      } catch (error) {
        if (current !== version) {
          return;
        }

        message(
          "Profile could not be loaded. " +
          (error.message || "Please retry.")
        );

        render();
      }
    }

    root.addEventListener("click", async event => {
      const tab = event.target.closest(
        "[data-mode]"
      );

      if (tab && !busy) {
        mode = tab.dataset.mode;
        $("raPassword").value = "";
        message("");
        render();
      }

      if (
        event.target.closest("[data-logout]") &&
        !busy
      ) {
        setBusy(true);

        try {
          const { error } =
            await client.auth.signOut({
              scope: "local"
            });

          if (error) throw error;

          await applySession(
            "SIGNED_OUT",
            null
          );

          message("Signed out.");

        } catch {
          message(
            "Sign out failed. Please try again."
          );

        } finally {
          setBusy(false);
        }
      }
    });

    $("raShowPassword").onclick = () => {
      const show =
        $("raPassword").type === "password";

      $("raPassword").type =
        show ? "text" : "password";

      $("raShowPassword").textContent =
        show ? "Hide" : "Show";

      $("raShowPassword").setAttribute(
        "aria-label",
        show ? "Hide password" : "Show password"
      );

      $("raShowPassword").setAttribute(
        "aria-pressed",
        String(show)
      );
    };

    $("raSettings").onclick = () => {
      $("raEdit").hidden = false;
      $("raEditName").focus();
    };

    $("raCloseSettings").onclick = () => {
      clearPasswordForm();
      $("raEdit").hidden = true;
    };

    $("raRetry").onclick = () =>
      void applySession("RETRY", session);

    $("raAuthForm").onsubmit = async event => {
      event.preventDefault();

      if (
        busy ||
        !$("raAuthForm").reportValidity()
      ) {
        return;
      }

      const action = mode;
      const email = $("raEmail").value.trim();
      const password = $("raPassword").value;
      const name = $("raName").value.trim();

      if (
        action === "signup" &&
        (name.length < 2 || name.length > 40)
      ) {
        message(
          "Name must contain 2 to 40 characters."
        );

        return;
      }

      setBusy(true);
      message("Please wait…");

      try {
        if (action === "signin") {
          const { data, error } =
            await client.auth.signInWithPassword({
              email,
              password
            });

          if (error) throw error;

          if (!data?.session) {
            throw new Error(
              "Sign in returned no session. Please try again."
            );
          }

          await applySession(
            "SIGNED_IN",
            data.session
          );

          location.hash = "account";

        } else if (action === "signup") {
          const { data, error } =
            await client.auth.signUp({
              email,
              password,

              options: {
                data: {
                  display_name: name
                },

                emailRedirectTo: redirectTo
              }
            });

          if (error) throw error;

          if (data.session) {
            await applySession(
              "SIGNED_IN",
              data.session
            );
          } else {
            mode = "signin";
            render();

            message(
              "Check your email for confirmation. If an account already exists, use Sign in or reset your password."
            );
          }

        } else if (action === "forgot") {
          const { error } =
            await client.auth.resetPasswordForEmail(
              email,
              { redirectTo }
            );

          if (error) throw error;

          message(
            "If this email can receive an account reset, a reset link will be sent. Check your inbox."
          );

        } else if (action === "password") {
          const { error } =
            await client.auth.updateUser({
              password
            });

          if (error) throw error;

          mode = "signin";
          render();
          message("Password updated.");
        }

        $("raPassword").value = "";

      } catch (error) {
                message(authErrorMessage(error), "error");

      } finally {
        setBusy(false);
      }
    };

        function clearPasswordForm() {
      $("raChangePasswordForm").reset();
      $("raPasswordMessage").textContent = "";
      $("raPasswordSettings").open = false;
    }

    $("raChangePasswordForm").onsubmit = async event => {
      event.preventDefault();

      if (busy || !session || !profile) return;

      const form = $("raChangePasswordForm");
      const status = $("raPasswordMessage");

      if (!form.reportValidity()) return;

      const owner = session.user.id;
      const currentPassword = $("raCurrentPassword").value;
      const newPassword = $("raNewPassword").value;
      const confirmation = $("raConfirmPassword").value;

      status.dataset.type = "error";

      if (!currentPassword || newPassword.length < 12) {
        status.textContent =
          "Enter your current password and a new password of at least 12 characters.";
        return;
      }

      if (newPassword !== confirmation) {
        status.textContent = "New passwords do not match.";
        $("raConfirmPassword").focus();
        return;
      }

      if (newPassword === currentPassword) {
        status.textContent =
          "Choose a password different from your current password.";
        return;
      }

      setBusy(true);
      status.dataset.type = "info";
      status.textContent = "Saving password…";

      try {
        const active = await client.auth.getSession();

        if (active.error) throw active.error;

        if (
          active.data.session?.user.id !== owner ||
          session?.user.id !== owner
        ) {
          throw new Error(
            "Your account session changed. Please sign in again."
          );
        }

        const { data, error } = await client.auth.updateUser({
          current_password: currentPassword,
          password: newPassword
        });

        if (error) throw error;

        if (session?.user.id !== owner) return;

        if (data.user?.id !== owner) {
          throw new Error(
            "Password change could not be confirmed."
          );
        }

        form.reset();
        status.textContent = "Password changed successfully.";

      } catch (error) {
        if (session?.user.id === owner) {
          status.dataset.type = "error";

          status.textContent =
            error?.code === "invalid_credentials"
              ? "Current password is incorrect."
              : authErrorMessage(error);
        }

      } finally {
        setBusy(false);
      }
    };

    $("raProfileForm").onsubmit = async event => {
      event.preventDefault();

      if (
        busy ||
        !$("raProfileForm").reportValidity()
      ) {
        return;
      }

      const current = version;

      setBusy(true);

      try {
        const { data, error } = await client.rpc(
          "ri_account_profile",
          {
            p_display_name:
              $("raEditName").value.trim()
          }
        );

        if (error) throw error;

        if (
          current !== version ||
          data?.id !== session?.user.id
        ) {
          return;
        }

        profile = data;
        render();
        message("Profile saved.");

      } catch (error) {
        if (current === version) {
          message(
            error.message ||
            "Profile could not be saved."
          );
        }

      } finally {
        setBusy(false);
      }
    };

    client.auth.onAuthStateChange(
      (event, nextSession) => {
        setTimeout(
          () => void applySession(
            event,
            nextSession
          ),
          0
        );
      }
    );

    render();

    client.auth.getSession()
      .then(({ data, error }) => {
        if (error) {
          message(
            "Session could not be loaded. Please sign in again."
          );
        } else if (version === 0) {
          void applySession(
            "INITIAL_SESSION",
            data.session
          );
        }
      })
      .catch(() => {
        message(
          "Session could not be loaded."
        );
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      init,
      { once: true }
    );
  } else {
    init();
  }
})();