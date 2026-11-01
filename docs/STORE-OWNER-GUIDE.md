# The Mall — How to Wire Up Your Store
### You built your page. Now make it do stuff.

You're in the builder. Your page looks good. Now let's connect real tools so people can actually subscribe, pay you, and stay in touch — all from the prompts you type in your chat window.

---

## 1. SET UP A MAILING LIST

**What you're doing:** Collecting real email addresses from visitors so you can send them your newsletter/updates.

**What you need:** A free Beehiiv account (built for newsletters) or Mailchimp account (general email).

### Using Beehiiv (Recommended for Newsletters)

**Step 1: Create your Beehiiv account**
1. Go to **beehiiv.com**
2. Click **Get Started** → sign up free
3. It asks for your publication name → enter your project name (e.g. "Fade the Public")
4. Pick a URL for your newsletter (e.g. fadethepublic.beehiiv.com)
5. Done — you now have a newsletter publication

**Step 2: Get your subscribe link**
1. In Beehiiv, go to **Settings** → **Subscribe Forms**
2. You'll see your subscribe URL — it looks like:
   `https://fadethepublic.beehiiv.com/subscribe`
3. Copy that URL

**Step 3: Go to your Mall builder and type this prompt:**
```
Add a working "Join the Newsletter" section. 

Use this real subscribe link for the button:
https://fadethepublic.beehiiv.com/subscribe

Make the button say "Subscribe Free" and open in a new tab.
Add a line under it: "Free weekly picks delivered to your inbox."
```

**That's it. Real email collection, working right now.** When someone clicks that button, Beehiiv handles the signup and you can send newsletters from their dashboard.

### Using Mailchimp Instead

**Step 1: Create your Mailchimp account**
1. Go to **mailchimp.com** → sign up free (up to 500 contacts)
2. It walks you through setup — enter your business name, email

**Step 2: Get your signup page link**
1. In Mailchimp → **Audience** → **Signup forms** → **Form builder**
2. Click **Signup form URL** at the top
3. Copy the URL — looks like:
   `https://mailchimp.us21.list-manage.com/subscribe?u=abc123&id=xyz789`

**Step 3: Same idea — go to your Mall builder:**
```
Add a "Join the Mailing List" section.

Use this link for the signup button:
https://mailchimp.us21.list-manage.com/subscribe?u=abc123&id=xyz789

Button text: "Sign Up Free"
Add a line: "Get predictions delivered straight to your inbox."
```

### How to Send Your First Newsletter

**Beehiiv:**
1. Go to your Beehiiv dashboard → **Posts** → **New Post**
2. Write your content (this week's picks, predictions, recap)
3. Click **Send** → it goes to everyone who subscribed
4. That's it — you're a newsletter publisher

**Mailchimp:**
1. Go to Mailchimp → **Campaigns** → **Create Campaign**
2. Choose **Email** → write your content
3. Select your audience → **Send**

---

## 2. SET UP PAYMENTS WITH STRIPE

**What you're doing:** Letting people pay you — one-time or subscription — with a real checkout page that Stripe hosts for you. No code needed.

### Step 1: Create Your Stripe Account
1. Go to **stripe.com** → **Start now**
2. Enter your email, name, password
3. Stripe asks for business details:
   - **Business type:** Individual or LLC (whatever you are)
   - **Business name:** your name or LLC name
   - **What do you sell:** Digital products / Subscriptions
4. Add your bank account (this is where Stripe sends your money)
5. Done — you're in the Stripe Dashboard

### Step 2: Create What You're Selling
1. In the Stripe Dashboard → click **Product catalog** (left sidebar)
2. Click **+ Add product**
3. Fill in:
   - **Name:** `Fade the Public — Monthly`
   - **Description:** `Daily and weekly sports, stock, and crypto picks`
   - **Price:** `$9.99` → select **Recurring** → **Monthly**
4. Click **Save product**

Want multiple tiers? Create another product:
   - **Name:** `Fade the Public — Annual`
   - **Price:** `$79.99` → **Recurring** → **Yearly**

### Step 3: Create a Payment Link
This is the magic — a link that IS your checkout page.

1. In Stripe → **Payment links** (left sidebar) → **+ Create payment link**
2. Select the product you just created
3. Options to check:
   - ✅ **Collect email address** (so you know who paid)
   - Optional: Allow promo codes, adjust quantities
4. Under **After payment** → choose **Show confirmation page**
5. Click **Create link**
6. Stripe gives you a URL like: `https://buy.stripe.com/abc123xyz`
7. **Copy that link**

### Step 4: Add It to Your Store Page
Go to your Mall builder and type:

```
Replace the subscribe/payment button with a real checkout link.

Monthly plan ($9.99/mo): https://buy.stripe.com/[PASTE YOUR LINK]

Make it a prominent button that says "Subscribe — $9.99/mo"
Style it so it stands out as the main action on the page.
```

If you have multiple tiers:
```
Add a pricing section with two options side by side:

Monthly — $9.99/mo
Link: https://buy.stripe.com/[YOUR MONTHLY LINK]
Button: "Go Monthly"

Annual — $79.99/yr (Save 33%)  
Link: https://buy.stripe.com/[YOUR ANNUAL LINK]
Button: "Go Annual"

Make the Annual option highlighted as "Best Value"
```

### Step 5: Test Before Going Live
1. In Stripe Dashboard → top right → toggle to **Test mode**
2. Create a test Payment Link (same steps as above, but in test mode)
3. Add the test link to your store temporarily
4. Click the button → use this fake card number:
   - **Card:** `4242 4242 4242 4242`
   - **Expiry:** any future date
   - **CVC:** any 3 numbers
5. Submit → check Stripe Dashboard → you should see the test payment
6. Once confirmed working → switch to **Live mode** in Stripe
7. Update your store with the real (live) Payment Links

**You are now accepting real money.**

---

## QUICK REFERENCE: PROMPTS YOU CAN COPY

### Add a mailing list button
```
Add a newsletter signup button that links to: [YOUR BEEHIIV OR MAILCHIMP URL]
Button text: "Subscribe Free"
Put it near the top of the page so people see it first.
```

### Add a payment button
```
Add a subscribe button that links to: [YOUR STRIPE PAYMENT LINK]
Button text: "Subscribe — $[PRICE]/mo"
Make it the biggest, most prominent button on the page.
```

### Add both together
```
Add two call-to-action sections:

1. Free tier — "Join the Free Newsletter" 
   Links to: [YOUR BEEHIIV/MAILCHIMP URL]
   
2. Paid tier — "Get Premium Picks — $9.99/mo"
   Links to: [YOUR STRIPE PAYMENT LINK]

Put the free option first, paid option second.
Make the paid option stand out more.
```

### Add a disclaimer
```
Add a footer disclaimer:
"Not financial advice. All predictions are for entertainment and 
informational purposes only. Past performance does not guarantee 
future results."

"If you or someone you know has a gambling problem, call 
1-800-522-4700"

"© 2026 [Your Name]. All rights reserved."
```

---

## WHAT YOU JUST BUILT

- ✅ A store page on The Mall — your storefront
- ✅ A mailing list — collecting real emails
- ✅ Payment processing — accepting real money
- ✅ All from your chat window — no code, no developer, no BS

### Cost to Launch

| What | Cost |
|------|------|
| Mall account | Free |
| Google Gemini API key | Free |
| Beehiiv newsletter (up to 2,500 subs) | Free |
| Stripe account | Free (they take 2.9% + $0.30 per sale) |
| **Your total out-of-pocket** | **$0** |

---

## COMING SOON

- How to add interactive content (live scoreboards, prediction trackers)
- How to embed video content
- How to connect a custom domain
- How to add a members-only section

---

*The Mall of Projects — www.themallofprojects.com*
