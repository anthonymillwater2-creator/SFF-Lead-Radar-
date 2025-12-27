# ShortFormFactory — Premium Short‑Form Video Editing (Static Website)

[![Vercel Status](https://img.shields.io/badge/deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/new)
[![GitHub Pages](https://img.shields.io/badge/deploy-GitHub%20Pages-2088FF?style=for-the-badge&logo=github)](https://pages.github.com/)
[![Netlify](https://img.shields.io/badge/deploy-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://app.netlify.com/start)

Professional, static multi-page website for ShortFormFactory — a small studio providing fast, transparent, and high-quality short-form video editing services for creators, brands, and agencies.

Live demo: https://shortformfactory.com (or your deployment URL)

---

## Why this repo

This repository contains a ready-to-deploy static website (pure HTML/CSS/JS) built for a video editing service. It’s intentionally lightweight so it can be hosted anywhere that serves static files (Vercel, Netlify, GitHub Pages, or any static host).

Key goals:
- Clear, persuasive marketing copy and visual style
- Fast and mobile-friendly layout
- Simple, secure payment flow via PayPal.me
- Straightforward order intake flow that gathers project details by email after payment

---

## Preview

![Site preview](./assets/screenshot.svg)

---

## What’s included

- index.html — Landing / marketing home page
- services.html — Full list of offered services, pricing, and add-ons
- order.html — Order flow: select service & package, calculate total, pay via PayPal.me, then submit intake email
- contact.html, about.html, donations.html — Supporting pages
- terms.html, privacy.html, refunds.html, liability.html — Legal pages
- 404.html — Friendly 404 page
- style.css — Central styling (dark neon theme)
- main.js — Lightweight UI logic (mobile menu, back-to-top, particle canvas, order logic)
- paypal-config.js — Centralized PayPal handle and merchant id

---

## Features

- Simple, accessible UI with responsive layout
- Package-based pricing and optional add-ons
- Summary and total calculation in the order sidebar
- Pay button links to PayPal.me with computed USD amount
- Intake email flow (mailto) for sending project details after payment
- Decorative, low-overhead particle canvas for ambient motion

---

## Quick Deploy (recommended)

Option A — Vercel (recommended):
1. Push this repository to GitHub (already done).
2. Sign in to https://vercel.com and click “New Project”.
3. Import this GitHub repo and select the `main` branch.
4. Enable automatic deploys (Vercel will redeploy on each push to `main`).

Option B — Netlify:
1. Go to https://app.netlify.com/start and import from GitHub.
2. Choose the `main` branch and deploy.

Option C — GitHub Pages:
1. In repo settings -> Pages, choose branch `main` and folder `/ (root)`.
2. Save and wait for the site to publish.

No build or bundler required — static files only.

---

## Deployable? (Short answer)

Yes. This repository is fully static (HTML/CSS/JS) and is directly deployable to Vercel, Netlify, GitHub Pages, or any static host.

Notes on badges:
- The Vercel/Netlify badges at the top are simple links/badges. To show a true deployment status badge, configure the project in the hosting provider (Vercel/Netlify) and add the provider-specific dynamic status badge URL to the README (they provide badge URLs after you create the project).
- GitHub Pages does not provide a dynamic "build status" badge — use CI badges (e.g., from GitHub Actions) if you add a build step later.

---

## Configuration & Customization

- PayPal configuration: edit `paypal-config.js` (SFF_PAYPAL.payMeHandle) if you want to change the PayPal handle used in order links.
- Edit copy and prices: `services.html`, `order.html`, and `main.js` (PRICES constant) contain the canonical text and pricing values.
- Branding: replace the `SF` logo text, colors in `style.css`, and any social links in the header/footer.

Security note: the current payment flow uses PayPal.me links (client-side). If you need integrated server-side payments, use PayPal Checkout or another gateway and remove client-side payment URL assumptions.

---

## How the Order Flow Works

1. Customer selects a service on `order.html` and picks a package + any add-ons.
2. The UI calculates the total and enables the Pay button.
3. Clicking Pay opens a PayPal.me link pre-filled with the USD amount.
4. After payment, the Submit Project Details button (intake) emails project instructions to `ShortFormFactory.help@gmail.com` with the estimate and notes.

Tip: you can preselect a service by linking to `/order.html?service=aiReel` (or any key in the PRICES map).

---

## Contributing

This repo is turnkey for site owners and maintainers. If you’d like improvements:
- Fork and open a Pull Request with focused changes (copy, SEO updates, accessibility fixes, or performance improvements).
- For payment flow changes or server integration, add a clear README section and tests where appropriate.

If you’d like me (the repository maintainer) to make a change, open an issue describing the update and I’ll prioritize it.

---

## Troubleshooting

- Particle canvas not showing? Ensure `#particleCanvas` exists and that the page includes `main.js`.
- Order totals not updating? Check that `main.js` is loaded and that the selected service value matches an entry in the `PRICES` object.
- PayPal.me links not working? Verify `paypal-config.js` and that the `SFF_PAYPAL.payMeHandle` value is correct.

---

## License

All rights reserved © 2024 ShortFormFactory. If you’d like this template re-used under a permissive license for your projects, please contact the owner.

---

## Contact

Email: ShortFormFactory.help@gmail.com

Social: TikTok / Instagram / YouTube — @short.formfactory

---

Thank you for using ShortFormFactory. If you want additional readme changes (provider-specific status badges, screenshots in PNG/GIF, or CI workflows), I can add those next.
