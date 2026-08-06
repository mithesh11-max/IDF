# IN DESIGN LUXURY FABRICS — Handover Guide

## 1. Go-live checklist (do these before launch)

| What | File | Line to change |
|---|---|---|
| **UPI ID for payments** | `src/lib/constants.ts` | `UPI.vpa` — replace `indesignfabrics@okhdfcbank` with the shop's real UPI ID |
| WhatsApp / phone number | `src/lib/constants.ts` | `BUSINESS.whatsappNumber`, `phoneDisplay`, `phoneRaw` |
| Free-shipping threshold, wholesale % | `src/lib/constants.ts` | `ORDER` |
| Real photos | `public/images/…` | replace the placeholder JPGs, keep the same file names |

**The UPI ID is the single most important change.** Until it is replaced, payments go nowhere.

---

## 2. Day-to-day editing — `src/data/catalog.ts`

Everything the shop changes weekly lives in this one file.

**Mark something sold out** (site shows "Unavailable right now", greys the photo, disables Add):
```ts
stock: 'out',     // 'in' = In Stock | 'low' = Only a few metres left | 'out' = Unavailable
```

**Feature a fabric** — add tags; it appears under those filter pills automatically:
```ts
tags: ['best-seller', 'new-arrival', 'festival', 'seasonal', 'wholesale'],
```

**Change a price** — plain number, rupees per metre. Add `mrp` to show a strike-through "Save ₹X" badge:
```ts
pricePerMetre: 8500,
mrp: 9800,
```

**Add a new fabric** — copy any block, give it a unique `id`, point `image` at a file in `public/images/fabrics/`.

After editing: `npm run build`, then upload the `dist` folder to Netlify.

---

## 3. How an order actually works

1. Customer adds fabric by the metre → cart saves automatically (survives page refresh).
2. Checkout Step 1: name, WhatsApp number, address or store pickup, notes. All validated.
3. Checkout Step 2: UPI QR code + "Open UPI App to Pay" button (phones). Amount and order ID are pre-filled — customer just approves in GPay/PhonePe/Paytm. They tick "I have paid".
4. Checkout Step 3: WhatsApp opens on the customer's phone, addressed to the shop, pre-filled:

> **NEW ORDER PLACED — IDLF-4F92**
> Order is been placed from 9845012345. Here is the requirement:
> Customer, contact, delivery address, every fabric with metres and line totals, subtotal, discount, shipping, TOTAL, payment status.

The shop receives it as a normal WhatsApp message **from the customer's own number**, so replying is one tap.

**Wholesale is automatic:** 20+ metres total → 15% off applied in the cart, no code needed.

---

## 4. Reviews

- Approved reviews live in `src/data/reviews.ts`. Add entries there to publish them to everyone.
- When a visitor submits the form, the review appears instantly on their own device and is sent to the shop's WhatsApp. Paste the good ones into `reviews.ts` to make them public.
- **Why:** a static site has no shared database. See section 5.

---

## 5. Honest limitations (and what fixes them)

| Limitation | Why | Fix when budget allows |
|---|---|---|
| Reviews aren't shared across devices until pasted into the file | No database on a static site | Supabase free tier (~2 hrs work) |
| Stock is edited by hand, not deducted automatically | No inventory server | Supabase / Google Sheets sync |
| Payment is confirmed by the customer ticking a box, not verified | Real verification needs a gateway account | Razorpay/Cashfree — needs KYC + ~2% fee |
| WhatsApp order opens on the customer's phone (they press send) | Auto-sending needs WhatsApp Business API | WhatsApp Cloud API + small backend |

This is normal and completely workable for a showroom — the shop confirms payment in its own UPI app before dispatching. Thousands of Indian businesses run exactly this way.

---

## 6. Deploying

**Quick preview:** drag the contents of `dist/` onto https://app.netlify.com/drop

**Proper setup (recommended):** push this folder to GitHub → connect the repo on Netlify. `netlify.toml` is already configured (`npm run build` → publish `dist`). Every edit to `catalog.ts` then redeploys automatically on push.
