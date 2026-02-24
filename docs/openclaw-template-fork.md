# OpenClaw Railway Template Fork (No Pairing, 1-Click Telegram)

Goal: when our app marks an agent as `RUNNING`, the Telegram bot should already respond to the customer without any manual pairing.

The upstream template (`arjunkomath/openclaw-railway-template`) configures Telegram with `dmPolicy: "pairing"`, which forces a manual pairing-code step. To remove that step, fork the template and switch Telegram to **allowlist**.

## Expected Inputs From Our App

We inject these env vars into the Railway service:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_USER_ID` (Telegram `from.id` of the customer)
- `TELEGRAM_ALLOW_FROM` (same value as `TELEGRAM_USER_ID`, for convenience)

And our finalize call to `/setup/api/run` also sends (safe to ignore if you prefer env-only):

- `telegramDmPolicy: "allowlist"`
- `telegramAllowFrom: [TELEGRAM_USER_ID]`

## Required Changes In The Template

Wherever the template builds the Telegram channel config during setup (the part that currently sets `dmPolicy: "pairing"`), change it to:

1. Prefer allowlist when a user id exists:
   - Read `TELEGRAM_ALLOW_FROM` or `TELEGRAM_USER_ID` from `process.env`.
   - Or read `telegramAllowFrom` from the setup payload.
2. Set:
   - `dmPolicy: "allowlist"`
   - `allowFrom: [<telegram_user_id>]`

If no user id exists, you can keep pairing as a fallback (better error message), but our product flow expects allowlist to be supported.

## How To Use The Fork In This Repo

Set in the SaaS backend env:

- `OPENCLAW_TEMPLATE_REPO=<your fork repo>`

Example:

```bash
OPENCLAW_TEMPLATE_REPO=br-claw/openclaw-railway-template
```

