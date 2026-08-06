# IN DESIGN LUXURY FABRICS — Handover Guide

## 1. Go-live checklist

| What | Where | Why it matters |
|---|---|---|
| **UPI ID** | `src/lib/constants.ts` → `UPI.vpa` | Until it's real, UPI payments go nowhere |
| **Bank account details** | `src/lib/constants.ts` → `BANK` | Until they're real, transfers go nowhere |
| **Editor PIN** | `src/lib/constants.ts` → `ADMIN_PIN` | Change from the default `3216` |
| WhatsApp / phone number | `src/lib/constants.ts` → `BUSINESS` | Where orders arrive |
| Free-shipping threshold, wholesale % | `src/lib/constants.ts` → `ORDER` | |
| Real photos | `public/images/…` | Every image is a placeholder |

---

## 2. Changing prices, stock and offers — **no rebuild needed**

This is the part the shop uses every week.

**Go to `yoursite.com/#/admin`** on a phone or laptop and enter the PIN.

You can change:
- **Price** and a strike-through "was" price (shows a *Save ₹X* badge automatically)
- **Availability** — In stock / Few left / Sold out. Sold-out fabrics grey out and can't be added to a cart.
- **Offer pills** — tick Best Selling, New Arrivals, Festival Offers, Seasonal, Wholesale and the fabric appears under that filter
- **Offer banner** — the red strip across the top of the site. Switch it on for a festive week, switch it off when it ends.
- **Reviews** — which ones appear publicly
- Add or remove fabrics entirely

Then tap **Download catalog.json** and upload that one file to your host, replacing the old one. On Netlify: drag it onto your site's Deploys page. The website updates the moment it lands.

**Why a download instead of a Save button:** the site has no server, so there is nothing for a Save button to save *to*. Any button claiming to save would be lying to you. The upshot is a useful one — nothing you do in the editor can break the live site until you choose to publish it.

### Even easier: run it from a Google Sheet (optional)

If you'd rather edit prices in a spreadsheet on your phone:

1. Make a Google Sheet with a header row: `id, name, category, composition, width, pricePerMetre, mrp, minMetres, stock, tags, image, blurb`
2. File → Share → **Publish to web** → pick the sheet → **CSV** → Publish
3. Paste that URL into `CATALOG_SOURCE.sheetCsvUrl` in `src/lib/constants.ts`, rebuild once

After that, editing the sheet updates the site within a few minutes — no downloads, no uploads. `tags` are separated by `|` (e.g. `best-seller|festival`). Prices tolerate `8,500` and `₹8500`.

**Where the catalog comes from, in order:** Google Sheet (if set) → `catalog.json` → the copy built into the site. If one fails the next takes over, so the shop is never blank.

---

## 3. How an order works

1. Customer adds fabric by the metre → cart saves automatically.
2. **Step 1** — name, WhatsApp number, address or store pickup, notes. All validated.
3. **Step 2 — payment.** Two options:
   - **UPI** — QR code plus an "Open UPI App" button on phones. Amount and order ID pre-filled.
   - **Bank Transfer** — account name, number, IFSC and amount, each with a copy button. The customer pays by NEFT/IMPS/RTGS from their own netbanking or banking app, then types the **UTR number** back in so you can match the credit in your statement.
   - Or they place the order and settle at the showroom.
4. **Step 3 — confirm the send.** WhatsApp opens with the full order typed out. The site then asks *"did you press Send?"* and does **not** treat the order as placed until they say yes. If WhatsApp didn't open there's a retry button, a copy-the-order-text fallback, and the phone number.
5. **Step 4** — order confirmed, cart cleared.

**The safety net:** if someone opens WhatsApp and wanders off without sending, the order is stored as *pending*. Next time they open the site — an hour or a week later — a bar appears at the bottom: *"Order IDLF-XXXX hasn't reached the showroom yet — Send now."* Their cart is untouched until it's sent.

**Why it works this way:** a website hands you over to WhatsApp and then goes blind. It cannot press Send for you and cannot detect whether you did. Most WhatsApp-checkout sites just show "Order placed!" and hope — which is how orders quietly vanish. This one refuses to claim an order was placed until the customer confirms it, and nags until then. That is the strongest guarantee possible without the paid WhatsApp Business API.

**Wholesale is automatic:** 20+ metres → 15% off in the cart, no code needed.

---

## 4. Reviews

Customers rate 1–5 and write a note. What happens next depends on the rating:

- **4 or 5 stars** → arrives on your WhatsApp marked *OK TO PUBLISH*. Add it in the editor's Reviews tab, download `reviews.json`, upload it. Now it's on the site.
- **1 to 3 stars** → arrives marked *PRIVATE FEEDBACK — NOT FOR THE WEBSITE*, with a prompt to call the customer back. It never appears publicly. The customer is told it's going privately to the owner, so nobody is misled into thinking they posted a public review.

**One thing to keep as it is.** The score above the reviews is calculated from exactly the reviews shown, and is labelled "across N published reviews." Don't change it to an average of everything received while displaying only the good ones — that's the pattern India's review standard (BIS IS 19000:2022, which the CCPA pushes for e-commerce) treats as a deceptive practice. Curating which reviews you feature is completely normal and every shop does it; advertising a rating that the displayed reviews don't support is a different thing, and it's the part that gets businesses in trouble. As built, you get the commercial benefit without the exposure.

---

## 5. Honest limitations

| Limitation | Why | Fix when budget allows |
|---|---|---|
| No card payments | Cards need a gateway merchant account | Razorpay/Cashfree — needs KYC + ~2% fee |
| Netbanking is a manual transfer, not a redirect | A site can't open a bank's login page for a customer; only a gateway can | Same as above |
| Payment is confirmed by the customer, not verified | No gateway to verify against | Same as above |
| Publishing needs a file upload | No database on a static site | Supabase free tier (~2 hrs work) |
| Stock is edited by hand, not deducted per sale | No inventory server | Supabase / Google Sheets sync |
| The customer presses Send in WhatsApp | Auto-sending needs the WhatsApp Business API | WhatsApp Cloud API + a small backend |
| The editor PIN isn't real security | It ships inside the site's JavaScript | Only matters once there's a backend to protect. Never reuse this PIN elsewhere. |

None of this blocks trading. Thousands of Indian fabric businesses run exactly this way — confirm the payment in your own UPI or bank app, then dispatch.

---

## 6. Deploying

**Quick:** drag `dist/` onto https://app.netlify.com/drop

**Proper:** push to GitHub → connect the repo on Netlify. `netlify.toml` is already configured (`npm run build` → publish `dist`).

**Day-to-day after that:** you do *not* redeploy to change a price. Upload the new `catalog.json` on its own, or edit the Google Sheet. Rebuild only when changing code, photos or the files in `src/lib/constants.ts`.
