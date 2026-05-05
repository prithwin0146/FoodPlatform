/**
 * SRP: a pure data module owning the content map for every marketing/legal page.
 * OCP: add a new info page by appending one entry — no component code changes.
 */
export interface InfoSection {
  heading?: string;
  body: string;
}

export interface InfoPageContent {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  sections: InfoSection[];
}

export const INFO_PAGES: Record<string, InfoPageContent> = {
  // ─────────────────── Legal ───────────────────
  privacy: {
    slug: 'privacy',
    eyebrow: 'Legal',
    title: 'Privacy Policy',
    updated: 'Last updated: 1 May 2026',
    intro:
      'We collect the minimum data needed to deliver your meal and let you watch it being made. We never sell your personal information. Here\'s exactly what we collect, why, and how to ask for it back.',
    sections: [
      {
        heading: 'What we collect',
        body: 'Account details (name, email, delivery address), order history, payment tokens (handled by Stripe — we never see card numbers), and the kitchens you watch live.',
      },
      {
        heading: 'How we use it',
        body: 'To process your orders, route them to the correct restaurant, send delivery updates, and improve the platform. That\'s it.',
      },
      {
        heading: 'Your rights',
        body: 'Under UK GDPR you can request a full export of your data, correct anything inaccurate, or delete your account at any time. Email privacy@seetheprep.co.uk and we respond within 7 days.',
      },
    ],
  },
  terms: {
    slug: 'terms',
    eyebrow: 'Legal',
    title: 'Terms of Service',
    updated: 'Last updated: 1 May 2026',
    intro:
      'By using SeeThePrep you agree to these terms. Plain English version below — full legal text available on request.',
    sections: [
      {
        heading: 'Your account',
        body: 'You must be 18+ and provide accurate information. You\'re responsible for activity on your account. One account per person.',
      },
      {
        heading: 'Orders & payments',
        body: 'Prices include VAT. Once a kitchen confirms your order it cannot be cancelled. Refunds for missing or incorrect items are processed within 3 working days.',
      },
      {
        heading: 'Live streams',
        body: 'Streams are for personal viewing only. Recording, redistributing, or scraping the feeds is prohibited and may result in account termination.',
      },
    ],
  },
  cookies: {
    slug: 'cookies',
    eyebrow: 'Legal',
    title: 'Cookie Policy',
    updated: 'Last updated: 1 May 2026',
    intro:
      'We use cookies sparingly. No third-party tracking, no ad networks. Here\'s what sits in your browser and why.',
    sections: [
      {
        heading: 'Strictly necessary',
        body: 'A session token to keep you signed in and a cart cookie so your basket survives a refresh. These cannot be disabled.',
      },
      {
        heading: 'Analytics (opt-in)',
        body: 'Anonymous page-view counts via a self-hosted Plausible instance. No personal data, no fingerprinting. Disabled by default.',
      },
    ],
  },
  accessibility: {
    slug: 'accessibility',
    eyebrow: 'Legal',
    title: 'Accessibility Statement',
    updated: 'Last updated: 1 May 2026',
    intro:
      'SeeThePrep is committed to WCAG 2.2 AA conformance. Live video transparency means nothing if not everyone can use the platform.',
    sections: [
      {
        heading: 'What we\'ve done',
        body: 'Full keyboard navigation, screen-reader landmarks on every page, AA-rated colour contrast, focus indicators, captions on hero video, prefers-reduced-motion support throughout.',
      },
      {
        heading: 'Found a problem?',
        body: 'Email accessibility@seetheprep.co.uk with the page URL and a description. We aim to resolve P1 issues within 5 working days.',
      },
    ],
  },
  'do-not-sell': {
    slug: 'do-not-sell',
    eyebrow: 'Legal',
    title: 'Do Not Sell My Personal Information',
    intro:
      'We do not sell your personal information. We never have. We never will. There is no opt-out form because there is nothing to opt out of.',
    sections: [
      {
        heading: 'Our promise',
        body: 'No data brokers. No advertising networks. No third-party trackers. Your data is used solely to deliver food and stream kitchens to you.',
      },
      {
        heading: 'Want proof?',
        body: 'Inspect any SeeThePrep page in your browser dev tools. The only outbound requests go to our own API and Stripe (for payments). That\'s the entire third-party surface.',
      },
    ],
  },
  sitemap: {
    slug: 'sitemap',
    eyebrow: 'Navigation',
    title: 'Sitemap',
    intro: 'Every page on SeeThePrep, in one place.',
    sections: [
      {
        heading: 'Customer',
        body: '• Home — browse kitchens · /\n• My orders · /orders\n• Sign in · /login\n• Create account · /register',
      },
      {
        heading: 'Company',
        body: '• About us · /info/about\n• Careers · /info/careers\n• Press kit · /info/press\n• Contact · /info/contact',
      },
      {
        heading: 'For chefs',
        body: '• List your kitchen · /info/list-kitchen\n• Camera kit · /info/camera-kit\n• Hygiene standards · /info/hygiene\n• Chef stories · /info/chef-stories',
      },
      {
        heading: 'Help & legal',
        body: '• Help centre · /info/help\n• Safety · /info/safety\n• Privacy · /info/privacy\n• Terms · /info/terms\n• Cookies · /info/cookies\n• Accessibility · /info/accessibility',
      },
    ],
  },

  // ─────────────────── Company ───────────────────
  about: {
    slug: 'about',
    eyebrow: 'Company',
    title: 'About SeeThePrep',
    intro:
      'We started SeeThePrep because we got tired of guessing what was happening behind the kitchen door. So we put a camera in there.',
    sections: [
      {
        heading: 'The problem',
        body: 'Every food delivery app shows you the menu. None show you the kitchen. Hygiene scores are buried, prep is invisible, and "ghost kitchens" operate from places you\'d never eat at if you knew.',
      },
      {
        heading: 'Our answer',
        body: 'A live HD camera in every partner kitchen, on for every order. If the camera goes off, the kitchen comes off the platform. Simple as that.',
      },
      {
        heading: 'The team',
        body: 'Built in London by ex-restaurant operators and ex-Deliveroo engineers who wanted a delivery app they\'d actually trust to feed their kids.',
      },
    ],
  },
  careers: {
    slug: 'careers',
    eyebrow: 'Company',
    title: 'Careers at SeeThePrep',
    intro:
      'We\'re a small team building the most transparent food platform in the UK. If that excites you, we\'d love to talk.',
    sections: [
      {
        heading: 'Open roles',
        body: 'Senior Backend Engineer (.NET, London/remote) · Mobile Engineer (React Native, London) · Restaurant Success Manager (London).',
      },
      {
        heading: 'How we work',
        body: 'Four-day week. Fully transparent salaries (banded, posted internally). Equity for everyone. Quarterly off-sites. Real ownership over real surface area.',
      },
      {
        heading: 'Apply',
        body: 'Send a CV and a paragraph on the most transparent thing you\'ve ever shipped to careers@seetheprep.co.uk.',
      },
    ],
  },
  press: {
    slug: 'press',
    eyebrow: 'Company',
    title: 'Press Kit',
    intro:
      'Logos, brand assets, founder photos, and recent coverage — all available below for press, podcasts, and partner use.',
    sections: [
      {
        heading: 'Brand assets',
        body: 'Wordmark (SVG, PNG), monogram, brand colour palette, typography reference. ZIP download: press@seetheprep.co.uk.',
      },
      {
        heading: 'Recent coverage',
        body: '• "The food app that turned the camera on" — The Times, March 2026\n• "London\'s most transparent kitchen platform" — Time Out, April 2026\n• "Inside SeeThePrep\'s anti-dark-kitchen mission" — Wired UK, April 2026',
      },
      {
        heading: 'Press contact',
        body: 'press@seetheprep.co.uk · We respond within one working day.',
      },
    ],
  },
  contact: {
    slug: 'contact',
    eyebrow: 'Company',
    title: 'Contact us',
    intro: 'Real humans, real responses. No chatbots.',
    sections: [
      {
        heading: 'Order help',
        body: 'help@seetheprep.co.uk — average response time 22 minutes during service hours.',
      },
      {
        heading: 'Restaurants',
        body: 'partners@seetheprep.co.uk — for joining the platform, camera kit questions, payouts.',
      },
      {
        heading: 'Press & media',
        body: 'press@seetheprep.co.uk — coverage, interviews, brand assets.',
      },
      {
        heading: 'Office',
        body: 'SeeThePrep Ltd · 4th Floor, 12 Hanbury Street, London E1 6QR.',
      },
    ],
  },

  // ─────────────────── For Chefs ───────────────────
  'list-kitchen': {
    slug: 'list-kitchen',
    eyebrow: 'For chefs',
    title: 'List your kitchen',
    intro:
      'Join the only delivery platform where customers see exactly what you do. Higher tickets, lower disputes, real chef recognition.',
    sections: [
      {
        heading: 'What you get',
        body: '• Live HD camera kit (free, we install it)\n• 12% commission, flat — no menu/visibility tiers\n• Same-day Stripe payouts\n• 100% of customer tips, direct to chef',
      },
      {
        heading: 'What we ask',
        body: 'A 5★ Food Standards Agency rating, a fixed kitchen address (no virtual brands), and the camera stays on during every order.',
      },
      {
        heading: 'Apply',
        body: 'partners@seetheprep.co.uk — we visit, install the kit, and onboard within 7 days.',
      },
    ],
  },
  'camera-kit': {
    slug: 'camera-kit',
    eyebrow: 'For chefs',
    title: 'The Camera Kit',
    intro:
      'Two HD cameras, one wall bracket, one stream box. Installed in 90 minutes. Yours to keep.',
    sections: [
      {
        heading: 'What\'s in the box',
        body: '• 2× 1080p / 60fps low-light cameras\n• 1× pass-through stream box (Ethernet + 4G failover)\n• 1× wide-angle wall mount\n• 1× under-cabinet prep mount',
      },
      {
        heading: 'Privacy by design',
        body: 'Cameras only stream during active orders. No microphones — ever. Footage is not stored on our servers; it streams directly to viewing customers.',
      },
      {
        heading: 'Costs',
        body: 'Free for active partner kitchens. Replacement cameras £180 inc VAT. Self-install guide also available for technical operators.',
      },
    ],
  },
  hygiene: {
    slug: 'hygiene',
    eyebrow: 'For chefs',
    title: 'Hygiene Standards',
    intro:
      'Every kitchen on SeeThePrep holds a 5★ Food Standards Agency rating. We verify quarterly and cross-reference with council records.',
    sections: [
      {
        heading: 'The minimum bar',
        body: '• 5★ FSA rating (no exceptions)\n• Annual environmental-health re-inspection\n• Allergen training certs for all kitchen staff\n• Visible hand-wash station on the live feed',
      },
      {
        heading: 'What happens if a rating drops',
        body: 'If a kitchen drops below 5★, they are immediately delisted. No warnings. No grace period. Customers in active orders are refunded in full.',
      },
      {
        heading: 'Spot something',
        body: 'Every live feed has a flag button. Reports go straight to our food-safety lead and are actioned within 24 hours.',
      },
    ],
  },
  'chef-stories': {
    slug: 'chef-stories',
    eyebrow: 'For chefs',
    title: 'Chef Stories',
    intro:
      'The people behind the camera. Long-form interviews with the chefs cooking on SeeThePrep — the why, the craft, the kitchens.',
    sections: [
      {
        heading: 'Marco · Pizzeria Roma',
        body: '"I came from Naples in 2014 with a wood oven recipe my grandmother wrote on the back of a tax bill. SeeThePrep is the first platform that treats my dough technique like the craft it is."',
      },
      {
        heading: 'Aiko · Sakura Sushi',
        body: '"In Tokyo, an itamae spends 10 years before they touch tuna. Showing customers the cuts in real time — that\'s how they understand why one piece costs what it does."',
      },
      {
        heading: 'Read more',
        body: 'Full archive at /info/chef-stories/archive (coming soon). Subscribe to our monthly newsletter for new stories.',
      },
    ],
  },

  // ─────────────────── Help ───────────────────
  help: {
    slug: 'help',
    eyebrow: 'Help',
    title: 'Help Centre',
    intro: 'Most questions answered below. If yours isn\'t here, we respond to emails in under 30 minutes during service hours.',
    sections: [
      {
        heading: 'Where\'s my order?',
        body: 'Open the order from the My Orders tab. The live feed and ETA update every 15 seconds. If your rider is late, tap "Contact restaurant" — it goes straight to the kitchen, not a call centre.',
      },
      {
        heading: 'My order is wrong',
        body: 'Tap "Report an issue" on the order. Refunds for missing items are automatic and credited within 60 seconds. Wrong items: we refund and re-cook on the house.',
      },
      {
        heading: 'How do tips work?',
        body: '100% of tips go directly to the chef who cooked your meal — no platform cut. Tips are payable up to 24 hours after delivery.',
      },
      {
        heading: 'Can I cancel?',
        body: 'Until the kitchen accepts your order (usually <60 seconds). After that, you cannot cancel because the chef has already started cooking your food.',
      },
    ],
  },
  safety: {
    slug: 'safety',
    eyebrow: 'Help',
    title: 'Safety',
    intro:
      'Customer safety, chef safety, rider safety — none are optional. Here\'s what we do, and what to do if something goes wrong.',
    sections: [
      {
        heading: 'Allergens',
        body: 'Every menu item lists the 14 UK allergens. Kitchens cannot publish a dish without completing the allergen form. Severe-allergy customers can flag orders — these are prepared in a sanitised station with a separate camera angle.',
      },
      {
        heading: 'Rider safety',
        body: 'Restaurants manage their own delivery teams. We require all partner restaurants to provide riders with hi-viz, helmets (for cycle/moped), and hourly minimum-wage guarantees regardless of delivery volume.',
      },
      {
        heading: 'Reporting',
        body: 'Urgent: 999 first, then safety@seetheprep.co.uk. Non-urgent: tap "Report" on any order or live feed. All reports reviewed within 24 hours.',
      },
    ],
  },

  // ─────────────────── Other ───────────────────
  'gift-cards': {
    slug: 'gift-cards',
    eyebrow: 'Eat',
    title: 'Gift Cards',
    intro:
      'Give the gift of watching dinner being made. Digital gift cards from £15, redeemable on any kitchen on the platform.',
    sections: [
      {
        heading: 'How it works',
        body: 'Buy a card, choose an amount and a delivery date, write a message. We email it to the recipient on the day you choose — no expiry, no fees.',
      },
      {
        heading: 'Coming Q3 2026',
        body: 'Gift cards launch alongside our mobile app in Summer 2026. Join the waitlist via the homepage to be notified first.',
      },
    ],
  },
};
