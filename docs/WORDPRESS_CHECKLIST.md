GPT:
Good idea — having a **“killer checklist”** before submitting a WordPress plugin is important. Below is a detailed checklist reflecting **real, commonly made mistakes** and the **actual review guidelines** from WordPress — with extra emphasis on **technical / security / code-level** issues rather than superficial ones. Use it to audit your plugin before submission.

---

## ✅ Core Guidelines & Policy Compliance

* License: Your plugin (code, assets, 3rd-party libraries) uses a **GPL-compatible license**, ideally GPLv2+ — or another explicitly GPL-compatible one. ([WordPress Developer Resources][1])
* Attribution & Ownership: You own the code (or have right to use it); if you fork or base on someone else’s plugin/library — you’ve credited appropriately, not removed copyright, license, or trademark info. ([Make WordPress][2])
* No obfuscated / minified-only code: The distributed code must be “mostly human readable.” No “packed” or heavily obfuscated JS/PHP that hides its logic. ([WordPress Developer Resources][1])
* All required files included: The ZIP submission must contain the full plugin (not a stub, not missing core parts). ([WordPress Developer Resources][3])
* Versioning: Ensure version number increments on each release. ([WordPress Developer Resources][1])
* Avoid frequent meaningless commits (on commit history) if you use SVN — reviewers don’t like “noise” commits. ([WordPress Developer Resources][1])

---

## 🔧 Code / Technical Quality

### PHP / JS / Code correctness

* ✅ No PHP or JS errors / warnings. Code should run cleanly. ([Make WordPress][2])
* ✅ When running with `WP_DEBUG = true`, there must be **no warnings / notices / errors**. Reviewers use that. ([Make WordPress][2])
* ✅ All plugin-defined functions, classes, global variables, constants, post-meta keys, etc., should use a **unique prefix / namespace** to avoid collisions. ([Make WordPress][2])

### WordPress API & Best Practices

* ✅ Use WordPress core APIs/ functionality where possible — don’t reinvent core features (unless needed). ([Make WordPress][2])
* ✅ Use core-registered scripts/styles — avoid bundling your own versions of built-in libraries (e.g. jQuery) — do not include duplicates. ([Make WordPress][2])
* ✅ For enqueuing scripts/styles: always use `wp_enqueue_script()` / `wp_enqueue_style()` at proper hooks, not hard-coded `<script>` / `<link>` in plugin output. ([Make WordPress][2])
* ✅ Don’t store data or files persistently inside the plugin folder — that folder may be overwritten on updates. ([Make WordPress][2])

---

## 🔐 Security & Privacy

* ✅ **Sanitize, validate input**, and **escape output** properly. This includes data from `$_POST`, `$_GET`, `$_REQUEST`, `$_FILES`, or any untrusted source. ([WordPress Developer Resources][4])
* ✅ If you perform SQL/database operations: use prepared statements (e.g. via `$wpdb->prepare()`), never raw concatenated SQL. ([Make WordPress][2])
* ✅ Check user capabilities / permissions before doing privileged operations (e.g. modifying options, writing files, deleting data).
* ✅ Use nonces for form submissions / actions initiated by users (to prevent CSRF). This is mandatory when accepting user input or running actions. ([Compile N Run][5])
* ✅ If plugin collects user data or “phones home” (analytics, tracking, usage stats, external service calls) — must ask user consent; default must be OFF; data collection must be transparent and privacy-policy compliant. ([Make WordPress][2])
* ✅ Don’t rely on external URL shorteners, remote loading of scripts/styles or resources that track or collect data (unless absolutely necessary and disclosed). ([Make WordPress][2])

---

## 📄 Documentation & Readme / UX Transparency

* ✅ Provide a valid and clear `readme.txt` (or README) if your plugin uses external services, remote calls, or requires configuration. It must explain what the plugin does, how to configure, any external dependencies. ([Make WordPress][2])
* ✅ Disclose in readme: use of any third-party services/APIs, what data is sent/collected, why, when. Provide links to those services’ Terms of Use and Privacy Policy if relevant. ([Make WordPress][2])
* ✅ If no support is provided — declare that clearly. ([Make WordPress][2])
* ✅ If there are limitations — e.g. requires other plugin/theme, or only works under certain conditions — document them clearly. ([Make WordPress][2])

---

## ⚠️ Legal / Policy / Directory-Specific

* ✅ No “trialware”: plugin must not disable core functions or lock features behind paywalls/trial periods. All functionality present and usable. ([WordPress Developer Resources][1])
* ✅ Don’t embed “powered by”, ads, or external links/credits in a way that hijacks admin experience or forces visibility without user consent. If credits or ads exist — must be optional and user-controlled. ([Make WordPress][2])
* ✅ Do not include themes or other plugins as part of your plugin (i.e. don't bundle full themes/plugins). Your plugin can require them, but not include or auto-install them. ([Make WordPress][2])
* ✅ Don’t duplicate core WordPress functionality or implement features that core already provides — or do so only if there's a justified new approach. ([Make WordPress][2])

---

## 🧪 Testing & Stability

* ✅ Test your plugin with `WP_DEBUG = true`, examine for PHP notices/warnings. Fix them all. ([Make WordPress][2])
* ✅ Test in different PHP versions (if possible), or at least ensure graceful failure / checks if certain PHP features/extensions are missing (especially if using optional PHP extensions). ([WordPress.com Developer Resources][6])
* ✅ Test plugin in isolation and in combination with common themes/plugins to avoid conflicts — especially with naming collisions (prefixes), global variables, hooks.
* ✅ For plugins depending on external services: test behavior when the service is unavailable, API fails, or user denies consent — plugin must fail gracefully, not break site.

---

## 📥 Submission & Maintenance Process

* ✅ Use a proper “ready-for-release” ZIP when submitting (no half-finished dev code, no debug leftovers, no test files unless needed). ([WordPress Developer Resources][3])
* ✅ Use official email (not some support-ticket or auto-reply address) when submitting — so you get review feedback. ([WordPress Developer Resources][3])
* ✅ After submission: be ready to respond to review feedback. If you make changes — commit via SVN, increment version number, and ensure compliance again. ([Make WordPress][7])

---

## 🧑‍💻 Known “Practically Frequent Mistakes” — What Developers Often Miss

Based on the “common issues” from reviewers and real-world plugin reports, these tend to be the recurring mistakes: ([WordPress Developer Resources][4])

* Forgetting to **sanitize or escape** user input/output → leading to security vulnerabilities (XSS, SQL injection, etc.). ([WordPress Developer Resources][4])
* Not using **unique prefixes** (functions, variables, hooks) → causing conflicts with other plugins/themes. ([Make WordPress][2])
* Bundling core libraries (e.g. jQuery) or custom versions of scripts already included in WordPress → increasing risk and redundancy. ([Make WordPress][2])
* Hard-coding file paths or URLs instead of using WordPress directory functions — breaks portability or portability when WP is installed in subfolder or custom structure. ([Make WordPress][2])
* Using insecure SQL or direct DB calls without `$wpdb->prepare()`. ([Make WordPress][2])
* Missing or poor documentation (readme, configuration instructions) — reviewers reject because plugin is unusable or unclear. ([Make WordPress][2])
* Not handling edge cases: e.g. what happens if optional dependencies missing, service API errors, user lacks permissions, or invalid input given. Plugin must fail gracefully.
* Collecting or “phoning home” data without explicit user consent — a big no-no. ([Make WordPress][2])
* Submitting incomplete plugin (missing assets, missing readme, missing license declarations) — especially common if developer treats submission like “upload dev build”.  ([WordPress Developer Resources][1])
* Ignoring coding style / standards (indentation, naming conventions, readability) — while not always fatal, it reduces maintainability and may trigger reviewer complaints. ([WordPress Developer Resources][8])

---

## ✅ ✅ 🧰 Final Pre-Submission Self-Audit Checklist

Before you press “submit”, run through this list:

1. License & copyright headers correct and GPL-compatible.
2. All plugin files (code, assets, libraries) included in ZIP; nothing left out.
3. Unique prefix / namespace used everywhere (functions, classes, globals, meta keys, hooks).
4. No PHP/JS errors or notices — test with `WP_DEBUG = true`.
5. No direct SQL concatenation — all DB ops use `$wpdb->prepare()` or WP APIs.
6. All input validated & sanitized; all output escaped.
7. Nonces + capability checks for all user-initiated actions.
8. Scripts/styles enqueued properly (`wp_enqueue_*`), no bundling of core WP libraries unnecessarily.
9. Use WP directory functions / APIs for paths & URLs (no hard-coded paths).
10. If using external services / remote calls: user consent, clear in readme, documented.
11. readme.txt / README clear: what plugin does, configuration steps, external dependencies, limitations, support terms.
12. No obfuscated or minified-only code (readable, maintainable).
13. Version number updated.
14. Bundle does not include themes or other entire plugins — only your plugin.
15. Tested under edge cases: missing dependencies, service unavailable, invalid input, no permission, empty data.
16. Double-check for leftover debug code or “todo” comments — remove before submission.
17. Ensure plugin does something new/useful — not just trivial or redundant replication of core WP features.

---

## 📚 Where to Read the Official Guidelines (All Included)

You should (and must!) read the following official pages carefully — they define all the rules for plugin submission and review:

* **Detailed Plugin Guidelines** — the main policy document for what’s allowed / not allowed in plugin repository. ([WordPress Developer Resources][1])
* **Review Checklist** (for plugins) — defines what reviewers check before approving a plugin. ([Make WordPress][2])
* **Planning, Submitting, and Maintaining Plugins** — practical guidance around packaging, submission, and maintaining after approval. ([WordPress Developer Resources][3])
* **WordPress Coding Standards** — coding style, readability, and coding quality expectations. ([WordPress Developer Resources][8])
* **Common Issues** — recurring pitfalls many plugins get flagged for (especially around security). ([WordPress Developer Resources][4])

---

If you want — I can **generate a “ready-to-print” Markdown checklist template** (or a text checklist) based on the above — so you can copy/paste into your dev workflow or review process.
Do you want me to build that for you now?

[1]: https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/?utm_source=chatgpt.com "Detailed Plugin Guidelines – Plugin Handbook | Developer.WordPress.org"
[2]: https://make.wordpress.org/plugins/handbook/performing-reviews/review-checklist/?utm_source=chatgpt.com "Review Checklist – Make WordPress Plugins"
[3]: https://developer.wordpress.org/plugins/wordpress-org/planning-submitting-and-maintaining-plugins/?utm_source=chatgpt.com "Planning, Submitting, and Maintaining Plugins – Plugin Handbook | Developer.WordPress.org"
[4]: https://developer.wordpress.org/plugins/wordpress-org/common-issues/?utm_source=chatgpt.com "Common issues – Plugin Handbook | Developer.WordPress.org"
[5]: https://www.compilenrun.com/docs/framework/wordpress/wordpress-plugin-development/wordpress-plugin-security/?utm_source=chatgpt.com "WordPress Plugin Security | Compile N Run"
[6]: https://developer.wordpress.com/docs/wordpress-com-marketplace/plugin-developer-guidelines/?utm_source=chatgpt.com "Plugin developer guidelines – WordPress.com Developer Resources"
[7]: https://make.wordpress.org/plugins/handbook/performing-reviews/security-and-guideline-violation-reports/?utm_source=chatgpt.com "Security and Guideline Violation Reports – Make WordPress Plugins"
[8]: https://developer.wordpress.org/coding-standards/wordpress-coding-standards/?utm_source=chatgpt.com "WordPress Coding Standards – Coding Standards Handbook | Developer.WordPress.org"



Claude:
