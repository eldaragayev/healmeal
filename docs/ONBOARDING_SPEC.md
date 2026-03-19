# HealMeal Onboarding Spec v2

Conversational, game-like onboarding that feels like a dialogue with the HealMeal mascot. Every question gets a personalized response. The user should feel like they're having a conversation, not filling out a form.

---

## Design Principles

- **Conversational flow** — question → personalized response → next question. Never two questions in a row without a reaction.
- **Mascot-driven** — the paper bag mascot (with leaf) appears throughout as a guide/companion. Animated on welcome, static or with subtle bounce on other screens.
- **Personalized CTAs** — buttons say things like "Yes, I am", "Let's go", "Show me" — not generic "Continue".
- **Dynamic responses** — every answer triggers a personalized follow-up that uses the user's data (name, goal, weight, etc.)
- **One thing per screen** — one question OR one insight, never both crammed together.

### Visual System

- **Primary accent:** Warm green (#4CAF50) — health, growth, positivity
- **Secondary accent:** Orange (#FF9800) for emphasis, highlights, and key numbers
- **Backgrounds:** White for questions, soft gradients for emotional/response screens
- **Progress bar:** Thin green segmented bar at top (hidden on emotional/response screens)
- **CTA button:** Full-width rounded pill, bottom-pinned
- **Typography:** Bold display font for headlines (28-34pt), medium weight for body (16-17pt)
- **Mascot:** Appears at ~30-40% size on response screens, animated on welcome

---

## The Flow

### Phase 1: Introduction + Name

---

#### Screen 1 — Welcome (Mascot Intro)
- **Type:** Animated welcome
- **Background:** Soft sage green gradient
- **Center:** Mascot animation — the paper bag character bounces in, flexes arms, then settles with a wave. Use the current mascot animation asset or a Lottie equivalent.
- **Below mascot:** App name "HealMeal" in bold display font
- **Headline:** "Eat out. Stay on track."
- **Subtitle:** "Your personal guide to healthy restaurant meals"
- **CTA:** "Let's Start" (green pill button)
- **No progress bar**

---

#### Screen 2 — What's Your Name?
- **Type:** Text input
- **Progress:** 5%
- **Mascot:** Small mascot icon in top-left corner (waving)
- **Headline:** "First things first — what's your name?"
- **Input:** Large, clean text field with blinking cursor. Placeholder: "Your name"
- **Keyboard:** Auto-focused, appears immediately
- **CTA:** "That's me" (green, disabled until name entered)

---

#### Screen 3 — Personalized Greeting (Response)
- **Type:** Emotional moment / transition
- **Background:** White → light green gradient
- **No progress bar** (this is a response, not a question)
- **Animation:** Text animates in letter by letter (typewriter effect)
- **Headline (large, bold, centered):**
  > "Okay, {name}."
  > (pause 0.5s)
  > "Ready to eat healthy?"
- **CTA:** "Yes, I am" (green pill — feels like a personal commitment)

---

### Phase 2: Quiz (Questions + Personalized Responses)

---

#### Screen 4 — Goal Selection
- **Type:** Single-select cards
- **Progress:** 10%
- **Headline:** "What are you working toward, {name}?"
- **Options (3 large cards with icon + title + one-liner):**
  1. Scale-down icon — **Lose weight** — "Fewer calories, more flavor"
  2. Muscle icon — **Build muscle** — "High protein at every spot"
  3. Balance icon — **Stay balanced** — "Just eat smarter"
- **Selected state:** Green border + checkmark
- **CTA:** "That's my goal" (green)

---

#### Screen 5 — Goal Response (Personalized)
- **Type:** Personalized insight
- **Background:** Soft gradient (color depends on goal: green for lose weight, blue for muscle, warm beige for balanced)
- **No progress bar**
- **Mascot:** Small, with thumbs-up pose
- **Content varies by goal:**

  **If Lose Weight:**
  > **"Great choice, {name}."**
  > "The average person eats 300+ extra calories per restaurant meal without realizing it."
  > "We'll fix that."

  **If Build Muscle:**
  > **"Let's get those gains, {name}."**
  > "Most restaurant meals are carb-heavy and protein-light."
  > "We'll find the high-protein options for you."

  **If Stay Balanced:**
  > **"Smart move, {name}."**
  > "You don't need a strict diet. Just better choices."
  > "We'll show you the best options wherever you eat."

- **CTA:** "Show me how" (white pill on gradient)

---

#### Screen 6 — Current Weight
- **Type:** Scroll wheel picker
- **Progress:** 20%
- **Headline:** "What's your current weight?"
- **Unit toggle:** lb / kg pill switcher (top-right)
- **Picker:** Large vertical scroll wheel, selected value in bold orange
- **CTA:** "Next" (green)

---

#### Screen 7 — Goal Weight
- **Type:** Scroll wheel picker
- **Progress:** 25%
- **Headline:** "And your goal?"
- **Unit toggle:** matches Screen 6 selection
- **Picker:** Same scroll wheel style
- **Small text below:** "No rush. Every smart meal gets you closer."
- **CTA:** "Got it" (green)

---

#### Screen 8 — Weight Projection (Personalized Response)
- **Type:** Personalized comparison / wow moment
- **Background:** White
- **No progress bar**
- **Headline:** "{name}, here's what the math says"
- **Two side-by-side cards:**

  **Left card (gray, muted):**
  - Header: "Without HealMeal"
  - Large number: "**~{2X} weeks**"
  - Subtitle: "Eating out blind, average pace"
  - Small downward trend line graphic (gray)

  **Right card (green, highlighted, slight glow):**
  - Header: "With HealMeal"
  - Large number: "**~{X} weeks**"
  - Subtitle: "Smarter meals, same restaurants"
  - Small upward trend line graphic (green)
  - Badge: "**{diff} weeks faster**" (orange)

- **Calculation logic:**
  - Weight delta = current - goal (in lbs or kg)
  - Without app: ~0.5 lb/week loss (standard untracked eating out)
  - With app: ~1.2 lb/week loss (calorie-aware ordering)
  - For muscle/balanced: frame as "reaching optimal nutrition" timeline
- **Small text:** "Based on smarter ordering at restaurants you already visit"
- **CTA:** "I like those odds" (green)

---

#### Screen 9 — Dining Frequency
- **Type:** Slider with dynamic insight
- **Progress:** 35%
- **Headline:** "How many times a week do you eat out?"
- **Slider card:**
  - Large orange number in center (e.g. "4")
  - "times per week" in gray below
  - Horizontal slider with + / - buttons
- **Dynamic insight (updates as slider moves):**
  - Peach/light orange rounded box with:
  > "That's **~{frequency * 300} extra calories** per week you could save with smarter picks"
- **CTA:** "Makes sense" (green)

---

#### Screen 10 — Dining Frequency Response
- **Type:** Personalized insight
- **Background:** Light orange gradient
- **No progress bar**
- **Mascot:** Small, impressed expression
- **Content (dynamic based on frequency):**

  **If 1-2 times/week:**
  > **"Even {frequency} meals out matter, {name}."**
  > "We'll make sure every single one counts."

  **If 3-5 times/week:**
  > **"{frequency} times a week? That's {frequency * 52} meals a year, {name}."**
  > "Imagine if every one of those was optimized."
  > "That's the difference between reaching your goal or not."

  **If 6-7 times/week:**
  > **"You eat out almost every day, {name}."**
  > "This app was literally built for you."
  > "We're about to save you **thousands of calories** per month."

- **CTA:** "Let's do this" (white pill on gradient)

---

#### Screen 11 — Restaurant Picker
- **Type:** Multi-select grid
- **Progress:** 45%
- **Headline:** "Where do you usually eat?"
- **Subtitle:** "Pick your go-to spots"
- **Grid:** 2-column grid of restaurant cards (name + small logo if available)
  - Chipotle, Chick-fil-A, McDonald's, Subway, Starbucks, Panera, Sweetgreen, Five Guys, Taco Bell, Wendy's, Burger King, Domino's, Panda Express, Shake Shack, Wingstop, Popeyes
- **Selected state:** Green border + checkmark
- **CTA:** "Those are my spots" (green)

---

#### Screen 12 — Restaurant Response
- **Type:** Personalized insight
- **Background:** White
- **No progress bar**
- **Mascot:** Excited pose
- **Headline:** "Great taste, {name}"
- **Content:**
  > "We've got **{count} optimized meals** across your picks."
  > (Show 2-3 mini meal cards from their selected restaurants with cal/protein)
  > Example: "Chipotle Chicken Bowl — 510 cal, 42g protein"
- **CTA:** "Show me more" (green)

---

#### Screen 13 — Dietary Restrictions
- **Type:** Multi-select list
- **Progress:** 55%
- **Headline:** "Anything you avoid?"
- **Subtitle:** "We'll filter these out everywhere"
- **Options (cards with icons):**
  - Vegetarian, Vegan, Gluten-free, Dairy-free, Keto, No pork, No shellfish, Nut-free, None of these
- **Selected state:** Green fill, white text
- **CTA:** "All set" (green)

---

### Phase 3: Pain Points (Emotional Resonance)

---

#### Screen 14 — Pain Point 1
- **Type:** Emotional resonance
- **Background:** Soft warm gradient (peach → light red)
- **No progress bar**
- **Illustration:** Stylized illustration of a person staring at a restaurant menu, confused, with calorie numbers floating around their head
- **Headline:** "Sound familiar?"
- **Subtitle:** "You want to eat healthy, but the menu has 50 options and zero nutritional info."
- **CTA:** "That's literally me" (white pill)

---

#### Screen 15 — Pain Point 2
- **Type:** Emotional resonance
- **Background:** Soft warm gradient
- **Illustration:** Person sitting alone while friends are at a restaurant, looking at sad salad
- **Headline:** "Or worse..."
- **Subtitle:** "You skip eating out entirely because you don't know what to order. Your friends go without you."
- **CTA:** "Yeah, that too" (white pill)

---

#### Screen 16 — Pain Point 3
- **Type:** Emotional resonance
- **Background:** Soft warm gradient
- **Illustration:** Person on a scale looking frustrated, surrounded by "healthy" restaurant food that's actually high-calorie
- **Headline:** "The hidden trap"
- **Subtitle:** "That 'healthy' salad? 900 calories. The grilled chicken wrap? 780. Restaurants aren't designed for your goals."
- **CTA:** "So what do I do?" (white pill — creates anticipation for the solution)

---

### Phase 4: How HealMeal Helps (The Solution)

---

#### Screen 17 — Solution Reveal
- **Type:** Transition / hero moment
- **Background:** Bold green gradient
- **Mascot:** Large, center, flexing arms (hero pose)
- **Headline (large, white, bold):** "That's where I come in."
- **Subtitle:** "HealMeal scans every menu near you and finds exactly what fits your goals."
- **CTA:** "Show me" (white pill on green)

---

#### Screen 18 — Smart Swaps Demo
- **Type:** Educational value prop
- **Progress:** 70%
- **Background:** White
- **Headline:** "Small swaps. Massive impact."
- **Swap card ("THE SWAP"):**
  - Left side: Large Fries icon — "Large Fries" — **560 kcal** (red text)
  - Swap arrow in center
  - Right side: Patty icon — "Extra Patty" — **250 kcal** (green text) — badge: "+20g protein"
  - Right card has green border highlight
- **Insight box (green background):**
  > "One swap per meal = **{frequency * 300 * 4} fewer calories per month**"
  > (Uses their dining frequency from Screen 9)
- **CTA:** "That's genius" (green)

---

#### Screen 19 — Nearby Discovery Demo
- **Type:** Value prop with visual
- **Background:** Green gradient
- **Illustration:** Stylized map with restaurant pins, each showing a small "520 cal" or "38g protein" badge
- **Headline:** "Every restaurant. Already ranked."
- **Bullet points (white text, checkmark icons):**
  - "Meals sorted by your macros"
  - "Filter by calories, protein, carbs, fat"
  - "One-tap delivery via Uber Eats & DoorDash"
- **CTA:** "Love it" (white pill on green)

---

### Phase 5: Social Proof (Reviews)

---

#### Screen 20 — Reviews
- **Type:** Social proof
- **Progress:** 80%
- **Background:** White
- **Headline:** "People like you love HealMeal"
- **Star display:** 5 gold stars — "4.9 average"
- **Review cards (3 stacked, subtle shadow, rounded):**

  1. **@sarah_fitness**
  > "Lost 8 lbs in my first month just by picking better meals. Didn't change anything else."

  2. **@mike.gains**
  > "Finally an app that doesn't tell me to stop eating at Chipotle. It just shows me WHAT to order."

  3. **@jenny_k**
  > "The protein filter is a game changer. I hit my macros every day now."

- **CTA:** "I want that" (green)

---

#### Screen 21 — Rate Us (Optional)
- **Type:** Rating solicitation
- **Background:** White
- **Headline:** "Help more people eat smarter?"
- **5 large gold stars** (tappable)
- **Subtitle:** "Your rating helps others find us"
- **Buttons:** "Maybe later" (ghost/text) | "Rate" (green pill)
- **If "Rate" tapped:** Trigger `SKStoreReviewController`
- **Either button advances to next screen**

---

### Phase 6: Custom Plan (Personalized Output)

---

#### Screen 22 — Building Your Plan (Labor Illusion)
- **Type:** Loading interstitial
- **Progress:** 90%
- **Background:** White
- **Center:** Mascot animation — paper bag is "cooking" or assembling items, with floating food icons orbiting around it
- **Text sequence (animated, typewriter effect, changes every 2s):**
  1. "Scanning {count} restaurants near you..."
  2. "Analyzing 50,000+ menu items..."
  3. "Matching meals to {name}'s macros..."
  4. "Almost there..."
- **No button** — auto-advances after ~7 seconds

---

#### Screen 23 — Your Plan Is Ready
- **Type:** Plan summary / wow moment
- **Background:** White → green gradient at bottom
- **Headline:** "{name}, your plan is ready"
- **Mascot:** Small, celebratory pose (confetti optional)
- **Plan card (glassmorphism, centered):**
  - **Daily target:** {calories} kcal
  - **Protein goal:** {protein}g
  - **Nearby matches:** {restaurant_count} restaurants, {meal_count} meals
- **Projection reminder:**
  > "At this pace, you'll reach {goal_weight} in **~{X} weeks**"
- **CTA:** "Let's eat" (large green button)

---

### Phase 7: Paywall

---

#### Screen 24 — Trial Soft-Sell
- **Type:** Pre-paywall trust builder
- **Background:** White
- **Icon:** Gift box with green ribbon, centered in light green circle
- **Headline:** "Try HealMeal free for **3 days**" ("3 days" in orange)
- **Subtitle:** "Full access. No commitment. Cancel anytime."
- **CTA:** "Try for Free" (green)

---

#### Screen 25 — Reminder Promise
- **Type:** Objection handler
- **Background:** White
- **Icon:** Bell icon with notification dot, centered in light green circle
- **Headline:** "We'll **remind you** 1 day before your trial ends" ("remind you" in orange)
- **Subtitle:** "No surprise charges. Ever."
- **CTA:** "Sounds fair" (green)

---

#### Screen 26A — Paywall (Clean Variant)
- **Type:** Primary paywall
- **Background:** White
- **Top:** App icon (mascot) centered, "HealMeal Premium" below in bold
- **Plan selector (two cards):**
  - Monthly — $9.99/month (unselected, gray border)
  - Yearly — $2.49/month, billed $29.99/year (**pre-selected**, green border, "FREE TRIAL" orange badge)
- **Feature list (green checkmarks):**
  - Meals matched to your macros
  - Eat at your favorite restaurants
  - One-tap delivery links
  - Custom calorie & protein targets
  - Unlimited restaurant discovery
- **CTA:** "Try 3 Days Free" (green gradient pill)
- **Fine print:** "3 days free, then $2.49/mo billed as $29.99/year. Cancel anytime."

---

#### Screen 26B — Paywall (Emotional Variant — A/B test)
- **Type:** Alternative paywall
- **Background:** Warm green-to-dark gradient
- **Top:** 3-photo food collage (healthy bowls, colorful meals)
- **App icon** overlaid on photos
- **Headline:** "UNLOCK {NAME}'S PLAN" (white, bold, caps — uses their actual name)
- **Feature checklist (green checkmarks, white text):**
  - High-protein meals near you
  - Filter by exact macros
  - Links to order & delivery
  - Personalized meal scoring
  - Unlimited everything
- **Plan selector (side-by-side cards):**
  - FREE — 3 days (pre-selected, green border)
  - MONTHLY — $9.99
- **CTA:** "Start My Free Trial" (dark button, white text)
- **Fine print:** "3 days free, then $29.99/year ($2.49/mo)"

---

#### Screen 27 — Win-Back Offer (shown if user dismisses paywall)
- **Type:** Exit-intent discount
- **Background:** Dark/near-black
- **Close button:** X in top-right (small, subtle)
- **Headline:** "Wait, {name}!" (white, bold)
- **Discount badge:** Green rounded rectangle — "75% OFF" in large white bold + "FOREVER" below
- **Price:** ~~$29.99/yr~~ → **$7.49/year** ($0.63/mo) in large green text
- **Urgency:** Warning icon + "This offer disappears when you close this screen"
- **Plan card:** Green-bordered — "Yearly — 12 months — $7.49"
- **CTA:** "Claim My Offer" (green button)
- **Reassurance:** "Cancel anytime. Money-back guarantee."

---

## Complete Flow Summary

| # | Screen | Phase | Type | CTA |
|---|--------|-------|------|-----|
| 1 | Welcome + mascot animation | Intro | Animated splash | "Let's Start" |
| 2 | What's your name? | Intro | Text input | "That's me" |
| 3 | "Okay, {name}. Ready to eat healthy?" | Intro | Personalized greeting | "Yes, I am" |
| 4 | What's your goal? | Quiz | Single-select | "That's my goal" |
| 5 | Goal response (personalized) | Quiz | Insight | "Show me how" |
| 6 | Current weight | Quiz | Scroll picker | "Next" |
| 7 | Goal weight | Quiz | Scroll picker | "Got it" |
| 8 | Weight projection (with vs without) | Quiz | Personalized comparison | "I like those odds" |
| 9 | How often do you eat out? | Quiz | Slider | "Makes sense" |
| 10 | Frequency response (personalized) | Quiz | Insight | "Let's do this" |
| 11 | Where do you eat? | Quiz | Multi-select grid | "Those are my spots" |
| 12 | Restaurant response + meal previews | Quiz | Personalized insight | "Show me more" |
| 13 | Dietary restrictions | Quiz | Multi-select | "All set" |
| 14 | Pain: menu confusion | Pain Points | Emotional | "That's literally me" |
| 15 | Pain: missing out socially | Pain Points | Emotional | "Yeah, that too" |
| 16 | Pain: hidden calorie trap | Pain Points | Emotional | "So what do I do?" |
| 17 | Solution reveal (mascot hero) | How App Helps | Transition | "Show me" |
| 18 | Smart swaps demo | How App Helps | Educational | "That's genius" |
| 19 | Nearby discovery demo | How App Helps | Value prop | "Love it" |
| 20 | User reviews | Social Proof | Reviews | "I want that" |
| 21 | Rate us (optional) | Social Proof | Rating ask | "Rate" / "Maybe later" |
| 22 | Building your plan... | Custom Plan | Loading illusion | (auto-advance) |
| 23 | Your plan is ready | Custom Plan | Plan summary | "Let's eat" |
| 24 | Trial soft-sell | Paywall | Trust builder | "Try for Free" |
| 25 | Reminder promise | Paywall | Objection handler | "Sounds fair" |
| 26 | Paywall (A/B variants) | Paywall | Subscription | "Try 3 Days Free" |
| 27 | Win-back offer | Paywall | Exit-intent discount | "Claim My Offer" |

**Total: 27 screens** (26 in the happy path, 27th is win-back on dismiss)

---

## Key Personalization Touchpoints

Every piece of user data is used visually within 1-2 screens:

| Data Collected | Where It's Used |
|---|---|
| **Name** | Screen 3 greeting, Screen 5 goal response, Screen 8 projection, Screen 10 frequency response, Screen 12 restaurant response, Screen 22 loading text, Screen 23 plan, Screen 26B paywall, Screen 27 win-back |
| **Goal** | Screen 5 personalized response, Screen 8 projection framing, Screen 23 plan targets |
| **Current weight** | Screen 8 projection calculation |
| **Goal weight** | Screen 8 projection calculation, Screen 23 plan |
| **Dining frequency** | Screen 10 personalized response, Screen 18 calorie savings math |
| **Restaurants** | Screen 12 meal previews, Screen 22 loading text, Screen 23 restaurant count |
| **Dietary restrictions** | Screen 12 filtered meal previews |

---

## Psychological Patterns

1. **Name personalization** — Using {name} throughout creates intimacy and makes it harder to abandon (this is MY plan, not a generic one)
2. **Question → Response loop** — Every answer gets acknowledged, making the user feel heard (conversational, not transactional)
3. **Conversational CTAs** — "Yes, I am", "That's literally me", "I like those odds" — user speaks in first person, increasing emotional investment
4. **Sunk cost escalation** — By screen 23, the user has spent 3+ minutes building THEIR plan
5. **Personalized projection** — The "with vs without" comparison (Screen 8) makes the app's value concrete and personal
6. **Pain → Solution arc** — Screens 14-17 follow a story: problem, empathy, escalation, hero arrives
7. **Labor illusion** — Screen 22 uses their name and restaurant count to make the "analysis" feel real
8. **Social proof at peak engagement** — Reviews shown right before the paywall, when motivation is highest
9. **Risk reversal cascade** — Soft-sell → reminder → paywall, each reducing anxiety progressively
10. **Exit-intent with name** — "Wait, {name}!" feels personal, not generic spam
