window.NOUS_CONFIG = {
  // Paste your Make.com Custom Webhook URL here.
  // Example: "https://hook.eu2.make.com/xxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  MAKE_WEBHOOK_URL: "https://hook.eu1.make.com/dgfh3dsnrvksrrh5ah1esltrr1qtmflw",

  // Paste your Make.com AI chat webhook URL here.
  // This scenario should return JSON like: { "reply": "Your AI response..." }
  MAKE_CHAT_WEBHOOK_URL: "https://hook.eu1.make.com/9i27m2jdi3tqnidepgfo5ppkj1opv468",

  // Optional: add a separate Make.com webhook later if you want testimonial review/approval.
  MAKE_TESTIMONIAL_WEBHOOK_URL: "",

  // Optional: add a Make.com webhook for paid-client onboarding details.
  MAKE_ONBOARDING_WEBHOOK_URL: "",

  // Replace these with real Stripe Payment Links when the plans are ready.
  PAYMENT_LINKS: {
    starter: "https://buy.stripe.com/placeholder-starter",
    growth: "https://buy.stripe.com/placeholder-growth",
    premium: "https://buy.stripe.com/placeholder-premium"
  }
};
