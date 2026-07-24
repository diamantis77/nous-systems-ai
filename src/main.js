(function () {
  const { useEffect, useMemo, useRef, useState } = React;
  const { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } = Motion;

  const h = (type, props, ...children) =>
    React.createElement(
      type,
      props || {},
      ...children.flat().filter((child) => child !== null && child !== undefined && child !== false)
    );

  const logoPath = "./assets/nous-logo.webp";
  const logoFallbackPath = "./assets/nous-logo.png";
  const animatedLogoPath = "/nous-logo-animated.mp4";
  const smoothEase = [0.22, 1, 0.36, 1];

  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const damp = (current, target, smoothing, delta = 1 / 60) =>
    lerp(current, target, 1 - Math.exp(-smoothing * delta));
  const smoothstep = (min, max, value) => {
    const progress = clamp((value - min) / (max - min));
    return progress * progress * (3 - 2 * progress);
  };
  const easeInOutCubic = (progress) =>
    progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;

  const getSectionProgress = (element, start = 0.9, end = 0.1) => {
    if (!element) return 0;
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const distance = viewportHeight * start - rect.top;
    const total = rect.height + viewportHeight * (start - end);
    return clamp(distance / Math.max(total, 1));
  };

  const motionRuntime = (() => {
    const callbacks = new Set();
    const state = {
      time: 0,
      delta: 1 / 60,
      scrollY: 0,
      scrollProgress: 0,
      pointer: { x: 0, y: 0, px: window.innerWidth * 0.5, py: window.innerHeight * 0.32 },
      pointerTarget: { x: 0, y: 0, px: window.innerWidth * 0.5, py: window.innerHeight * 0.32 },
      width: window.innerWidth,
      height: window.innerHeight,
      isMobile: window.innerWidth < 768,
      reduceMotion: false,
      canUsePointerParallax: false,
      hidden: document.hidden
    };
    let initialized = false;
    let rafId = 0;
    let previousTime = 0;
    let lenis = null;
    let scrollLockCount = 0;
    let resizeRaf = 0;
    let lastPointerCssX = -1;
    let lastPointerCssY = -1;

    const reduceMotionQuery = () =>
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const pointerQuery = () =>
      window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    const updatePreferences = () => {
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      state.isMobile = window.innerWidth < 768;
      state.reduceMotion = reduceMotionQuery();
      state.canUsePointerParallax = pointerQuery() && !state.reduceMotion && !state.isMobile;
      if (!state.canUsePointerParallax) {
        state.pointerTarget.x = 0;
        state.pointerTarget.y = 0;
        state.pointerTarget.px = state.width * 0.5;
        state.pointerTarget.py = state.height * 0.32;
      }
    };

    const getScrollLimit = () => {
      const root = document.documentElement;
      const body = document.body;
      return Math.max(1, Math.max(root.scrollHeight, body ? body.scrollHeight : 0) - window.innerHeight);
    };

    const updateScrollState = () => {
      state.scrollY = lenis && typeof lenis.scroll === "number" ? lenis.scroll : window.scrollY || window.pageYOffset || 0;
      state.scrollProgress = clamp(state.scrollY / getScrollLimit());
    };

    const updatePointerState = (delta) => {
      state.pointer.x = damp(state.pointer.x, state.pointerTarget.x, 5.4, delta);
      state.pointer.y = damp(state.pointer.y, state.pointerTarget.y, 5.4, delta);
      state.pointer.px = damp(state.pointer.px, state.pointerTarget.px, 6.2, delta);
      state.pointer.py = damp(state.pointer.py, state.pointerTarget.py, 6.2, delta);
      if (Math.abs(state.pointer.px - lastPointerCssX) > 0.75 || Math.abs(state.pointer.py - lastPointerCssY) > 0.75) {
        lastPointerCssX = state.pointer.px;
        lastPointerCssY = state.pointer.py;
        document.documentElement.style.setProperty("--mx", `${state.pointer.px}px`);
        document.documentElement.style.setProperty("--my", `${state.pointer.py}px`);
      }
    };

    const onPointer = (event) => {
      if (!state.canUsePointerParallax) return;
      state.pointerTarget.px = event.clientX;
      state.pointerTarget.py = event.clientY;
      state.pointerTarget.x = (event.clientX / Math.max(window.innerWidth, 1)) * 2 - 1;
      state.pointerTarget.y = -((event.clientY / Math.max(window.innerHeight, 1)) * 2 - 1);
      state.pointer.px = state.pointerTarget.px;
      state.pointer.py = state.pointerTarget.py;
      state.pointer.x = state.pointerTarget.x;
      state.pointer.y = state.pointerTarget.y;
      if (Math.abs(event.clientX - lastPointerCssX) > 2 || Math.abs(event.clientY - lastPointerCssY) > 2) {
        lastPointerCssX = event.clientX;
        lastPointerCssY = event.clientY;
        document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
        document.documentElement.style.setProperty("--my", `${event.clientY}px`);
      }
    };

    const onResize = () => {
      cancelAnimationFrame(resizeRaf);
      resizeRaf = requestAnimationFrame(() => {
        updatePreferences();
        updateScrollState();
      });
    };

    const onVisibility = () => {
      state.hidden = document.hidden;
      previousTime = performance.now();
    };

    const scrollTo = (target, options = {}) => {
      const element = typeof target === "string" ? document.querySelector(target) : target;
      if (!element && typeof target !== "number") return;
      const header = document.querySelector("[data-site-header]");
      const headerOffset = header ? header.getBoundingClientRect().height : 0;
      const offset = Object.prototype.hasOwnProperty.call(options, "offset") ? options.offset : -headerOffset - 12;
      const easing = options.easing || ((value) => 1 - Math.pow(1 - value, 4));
      if (lenis && !state.reduceMotion) {
        lenis.scrollTo(typeof target === "number" ? target : element, {
          offset,
          duration: options.duration || 1.08,
          easing
        });
        return;
      }
      const top =
        typeof target === "number"
          ? target
          : element.getBoundingClientRect().top + (window.scrollY || window.pageYOffset || 0) + offset;
      window.scrollTo({ top, behavior: state.reduceMotion ? "auto" : "smooth" });
    };

    const onAnchorClick = (event) => {
      const link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
      if (!link || link.hasAttribute("data-native-scroll")) return;
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      if (history.pushState) history.pushState(null, "", hash);
      scrollTo(target);
    };

    const frame = (time) => {
      if (!previousTime) previousTime = time;
      const delta = Math.min((time - previousTime) / 1000, 0.05) || 1 / 60;
      previousTime = time;
      state.time = time;
      state.delta = delta;

      if (lenis && !state.reduceMotion) lenis.raf(time);
      updateScrollState();
      updatePointerState(delta);
      if (state.hidden) return;
      callbacks.forEach((callback) => callback(time, delta, state));
      if (initialized && (callbacks.size > 0 || (lenis && lenis.isAnimating))) {
        rafId = requestAnimationFrame(frame);
      } else {
        rafId = 0;
      }
    };

    const ensureFrame = () => {
      if (rafId) return;
      previousTime = performance.now();
      rafId = requestAnimationFrame(frame);
    };

    const init = () => {
      if (initialized) return;
      initialized = true;
      updatePreferences();
      updateScrollState();
      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);
      document.addEventListener("click", onAnchorClick);
    };

    const destroy = () => {
      if (!initialized) return;
      initialized = false;
      cancelAnimationFrame(rafId);
      cancelAnimationFrame(resizeRaf);
      lenis?.destroy?.();
      lenis = null;
      callbacks.clear();
      window.removeEventListener("pointermove", onPointer);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("click", onAnchorClick);
      document.documentElement.classList.remove("scroll-locked");
      scrollLockCount = 0;
    };

    return {
      state,
      get lenis() {
        return lenis;
      },
      init,
      destroy,
      addFrameCallback(callback) {
        init();
        callbacks.add(callback);
        ensureFrame();
        return () => {
          callbacks.delete(callback);
          if (callbacks.size === 0 && rafId && !(lenis && lenis.isAnimating)) {
            cancelAnimationFrame(rafId);
            rafId = 0;
          }
        };
      },
      scrollTo,
      getSectionProgress,
      lockScroll() {
        scrollLockCount += 1;
        if (scrollLockCount === 1) {
          lenis?.stop?.();
          document.documentElement.classList.add("scroll-locked");
        }
      },
      unlockScroll() {
        scrollLockCount = Math.max(0, scrollLockCount - 1);
        if (scrollLockCount === 0) {
          document.documentElement.classList.remove("scroll-locked");
          lenis?.start?.();
        }
      }
    };
  })();

  window.NousMotion = motionRuntime;

  const useLogoFallback = (event) => {
    if (event.currentTarget.src.includes("nous-logo.webp")) {
      event.currentTarget.src = logoFallbackPath;
    }
  };

  function BrandLogoMark() {
    const [videoFailed, setVideoFailed] = useState(false);

    return h(
      "span",
      { className: "brand-mark" },
      videoFailed
        ? h("img", {
            className: "brand-static-logo",
            src: logoPath,
            alt: "",
            width: 1536,
            height: 1024,
            decoding: "async",
            onError: useLogoFallback
          })
        : h(
            "video",
            {
              className: "brand-video-logo",
              autoPlay: true,
              loop: true,
              muted: true,
              playsInline: true,
              preload: "metadata",
              poster: logoPath,
              "aria-hidden": true,
              onError: () => setVideoFailed(true)
            },
            h("source", { src: animatedLogoPath, type: "video/mp4", onError: () => setVideoFailed(true) })
          )
    );
  }

  function HeroLogoMedia() {
    const [videoFailed, setVideoFailed] = useState(false);

    if (videoFailed) {
      return h("img", {
        className: "hero-logo",
        src: logoPath,
        alt: "Nous Systems AI logo",
        width: 1536,
        height: 1024,
        decoding: "async",
        fetchPriority: "high",
        onError: useLogoFallback
      });
    }

    return h(
      "video",
      {
        className: "hero-logo hero-logo-video",
        autoPlay: true,
        loop: true,
        muted: true,
        playsInline: true,
        preload: "metadata",
        poster: logoPath,
        "aria-label": "Nous Systems AI animated logo",
        onError: () => setVideoFailed(true)
      },
      h("source", { src: animatedLogoPath, type: "video/mp4", onError: () => setVideoFailed(true) })
    );
  }

  const reveal = (delay = 0) => ({
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: 0.7, delay, ease: smoothEase }
  });

  const content = {
    en: {
      htmlLang: "en",
      langButton: "EL",
      langAria: "Switch language to Greek",
      nav: ["Services", "Industries", "Before/After", "Process", "FAQ", "Demo"],
      navIds: ["services", "industries", "before-after", "how", "faq", "contact"],
      heroKicker: "AI automation systems for local businesses",
      heroTitle: "AI Systems That Help Local Businesses Respond, Book & Sell 24/7",
      heroCopy:
        "We build custom AI chat, voice, lead capture and review automation systems for clinics, restaurants, law firms and service businesses.",
      primaryCta: "Book Free AI Demo",
      secondaryCta: "See How It Works",
      trustBadges: ["24/7 Customer Replies", "Automated Lead Capture", "More Bookings & Reviews"],
      heroStatus: [
        ["Active", "AI Systems Running 24/7"],
        ["Online", "Live AI Automation Demo"],
        ["AI Running", "Response Time < 5 sec"],
        ["Secure", "Built For Real Businesses"]
      ],
      scrollSystemLabels: ["AI ONLINE", "LEAD CAPTURE ACTIVE", "AUTOMATION RUNNING", "RESPONSE TIME < 5s"],
      livePanel: {
        title: "Live System",
        state: "AI online",
        metricLabel: "Response Time",
        metricValue: "< 5 sec",
        logs: [
          ["00:01", "Lead captured"],
          ["00:03", "Booking routed"],
          ["00:04", "Reply drafted"]
        ]
      },
      heroMetrics: [
        ["24/7", "customer replies"],
        ["0 missed", "website inquiries"],
        ["1 system", "chat, voice and reviews"]
      ],
      servicesEyebrow: "Services",
      servicesTitle: "AI systems built around real business outcomes.",
      servicesCopy:
        "Not generic chatbots. Each system is designed to reduce missed opportunities, speed up replies and make customer communication easier to manage.",
      services: [
        {
          icon: "message-square-text",
          title: "AI Chat Agents",
          copy: "Instant website replies, lead capture and customer qualification while visitors are ready to act."
        },
        {
          icon: "phone-call",
          title: "AI Voice Assistants",
          copy: "Missed-call handling, appointment requests and customer intake when your team is busy."
        },
        {
          icon: "monitor-cog",
          title: "Website Creation",
          copy: "Conversion-focused websites for local businesses with clear offers, CTAs and automation."
        },
        {
          icon: "radar",
          title: "Automated Lead Capture",
          copy: "Every inquiry saved, routed and followed up with the right customer details attached."
        },
        {
          icon: "star",
          title: "Review & Reputation Systems",
          copy: "Automated Google review collection that helps happy customers become visible proof."
        },
        {
          icon: "headphones",
          title: "Customer Support Automation",
          copy: "FAQ, routing and service workflows that reduce repetitive admin and support work."
        }
      ],
      interactiveDemo: {
        eyebrow: "Interactive AI System Demo",
        title: "See How AI Would Work For Your Business",
        copy:
          "Choose your business type and see how custom AI systems could handle replies, bookings, leads, reviews and customer support.",
        businessTypeLabel: "Business type",
        businessNameLabel: "Business name",
        businessNamePlaceholder: "e.g. Maria Dental Clinic",
        modulesLabel: "Automation modules",
        selectedModulesLabel: "{count} selected",
        noModulesSelected: "No automation modules selected yet.",
        noModulesHint: "Select one or more automations to see exactly how each module works in the live preview.",
        previewLabel: "Live system preview",
        previewStatus: "AI System Preview",
        liveSimulation: "LIVE SIMULATION",
        aiOnline: "AI Online",
        customerLabel: "Customer",
        aiLabel: "AI",
        systemLabel: "System",
        flowLabel: "Automation flow",
        moduleBreakdownLabel: "Selected modules",
        resultLabel: "Expected business outcomes",
        primaryCta: "Build This For My Business",
        secondaryCta: "Talk To The AI Assistant",
        emptyBusiness: "your business",
        previewTitle: "AI System Preview for {business}",
        previewSubtitle: "{industry} · AI Online",
        contactSummary: "I'm interested in AI systems for a {industry}. Selected automations: {modules}.",
        chatPrompt: "How would this work for a {industry}?",
        statusItems: ["AI ONLINE", "AUTOMATION RUNNING", "RESPONSE TIME < 5 SEC", "LEAD CAPTURE ACTIVE"],
        baseFlow: ["Customer Message", "AI Understands Request", "Lead Captured", "Automation Triggered", "Owner Notified", "Follow-Up Ready"]
      },
      industriesEyebrow: "Industries",
      industriesTitle: "Designed for Greek local businesses that depend on fast response.",
      industriesCopy:
        "The system adapts to the way your business receives calls, messages, appointment requests and reviews.",
      industries: [
        ["Clinics & Doctors", "Capture appointment requests and answer common questions after hours."],
        ["Restaurants & Hospitality", "Handle booking questions, private event requests and guest FAQs."],
        ["Law Firms", "Qualify new inquiries and collect the key details before a consultation."],
        ["Real Estate", "Capture buyer/seller leads and viewing requests from every channel."],
        ["Local Service Businesses", "Route urgent requests, quote inquiries and repeat customer questions."],
        ["Agencies & Consultants", "Qualify prospects, book calls and automate onboarding questions."]
      ],
      beforeAfterEyebrow: "Before vs After",
      beforeAfterTitle: "Replace slow manual replies with a system that keeps every lead moving.",
      before: "Before",
      after: "After",
      beforeItems: ["Missed calls", "Slow replies", "Lost leads", "Manual follow-ups", "Few reviews"],
      afterItems: [
        "Instant AI replies",
        "Appointment requests captured",
        "Leads saved automatically",
        "Follow-ups triggered",
        "Reviews collected"
      ],
      handlesEyebrow: "What Your AI Handles",
      handlesTitle: "Practical automation your customers can actually use.",
      handlesCopy:
        "Your AI assistant is trained around your services, questions and booking flow, then connected to the channels that matter.",
      handles: [
        "Answers FAQs",
        "Captures name, phone and email",
        "Qualifies the customer request",
        "Handles appointment requests",
        "Routes urgent inquiries",
        "Sends follow-up notifications",
        "Helps collect Google reviews"
      ],
      howEyebrow: "How It Works",
      howTitle: "A clear build process, not a technical maze.",
      howCopy:
        "We keep setup simple for business owners. You explain how your customers contact you; we design and install the AI system around that flow.",
      howSteps: [
        ["We analyze your business", "We review your services, customer questions, booking process and missed-lead points."],
        ["We build your custom AI system", "We create the chat, voice, lead capture, follow-up and review automations your business needs."],
        ["Your AI assistant starts handling leads 24/7", "The system replies instantly, captures customer details and routes the right requests to your team."]
      ],
      systemNodes: ["Website", "Calls", "Leads", "Reviews"],
      whyEyebrow: "Why Nous Systems AI",
      whyTitle: "Premium automation that feels practical, not complicated.",
      whyCopy:
        "The goal is simple: help local businesses respond faster, capture more leads and reduce repetitive communication work.",
      stats: [
        ["24/7", "Customer communication coverage"],
        ["<14d", "Typical first system launch path"],
        ["100%", "Custom setup for your business"],
        ["3", "Core flows: chat, voice, reviews"]
      ],
      features: [
        ["Built for local businesses", "Clear systems for clinics, restaurants, law firms, real estate offices and service teams."],
        ["No technical work for you", "We handle setup, training, prompts, automations and launch guidance."],
        ["Focused on booked calls", "Every page, form and AI flow points customers toward a useful next step."],
        ["Human handoff included", "Important conversations can move to your team with context already collected."]
      ],
      testimonialsEyebrow: "Testimonials",
      testimonialsTitle: "Feedback from business owners who want fewer missed leads.",
      testimonialsCopy:
        "Starter feedback from the kinds of local businesses Nous Systems AI is built for. Visitors can leave their own note below.",
      testimonials: [
        {
          name: "Clinic Owner",
          role: "Private medical practice",
          quote:
            "The biggest win is knowing appointment requests and common questions can be handled instantly, even when the team is busy."
        },
        {
          name: "Restaurant Manager",
          role: "Hospitality business",
          quote:
            "Bookings and customer questions need fast replies. A system like this removes a lot of manual pressure from the team."
        },
        {
          name: "Real Estate Consultant",
          role: "Local service business",
          quote:
            "Capturing buyer details automatically before we call back would make every inquiry easier to follow up."
        }
      ],
      testimonialForm: {
        title: "Leave your feedback",
        copy: "Share what you think about the AI demo or what automation would help your business most.",
        name: "Your name",
        role: "Business / role",
        quote: "Your testimonial",
        submit: "Submit Testimonial",
        loading: "Submitting...",
        success: "Thank you. Your testimonial was added.",
        error: "Please add your name and testimonial before submitting.",
        defaultRole: "Local business owner",
        pendingReview: "New feedback",
        optionalWebhookError: "Your testimonial was added locally, but the optional webhook did not receive it."
      },
      pricing: {
        eyebrow: "Monthly AI Systems",
        title: "Choose Your AI System Plan",
        copy: "Start with a monthly AI system built for your business. No large upfront setup fee.",
        recommendationTitle: "Recommended Plan For You",
        recommendationText: "Based on your selected automations, {plan} is the best fit for {industry}.",
        recommendedLabel: "Recommended",
        selectedModulesLabel: "Selected automations",
        noModulesLabel: "Try the interactive demo above to personalize this recommendation.",
        note: "Activation included. Minimum 3-month subscription recommended for full setup and optimization.",
        widgetTitle: "After activation, your business receives a website AI widget.",
        widgetCopy: "This can be added to your existing website, or we can install it for you.",
        widgetCode: "<script src=\"https://noussystems.ai/widget.js\" data-client-id=\"YOUR_CLIENT_ID\"></script>",
        plans: [
          {
            id: "starter",
            name: "Starter",
            price: "200€",
            period: "/month",
            bestFor: "Best for small businesses that want instant replies and lead capture.",
            includes: ["AI Website Chat Assistant", "FAQ Answers", "Automated Lead Capture", "Email Notifications", "Basic Business Prompt Setup", "Monthly Support"],
            cta: "Start Starter Plan"
          },
          {
            id: "growth",
            name: "Growth",
            price: "300€",
            period: "/month",
            bestFor: "Best for businesses that want bookings, reviews and follow-up automation.",
            includes: ["Everything in Starter", "Appointment / Reservation Request Flow", "Google Review Automation", "Follow-Up Automation", "Lead Qualification", "Monthly Performance Summary"],
            cta: "Start Growth Plan"
          },
          {
            id: "premium",
            name: "Premium",
            price: "500€",
            period: "/month",
            bestFor: "Best for businesses that want a full AI communication system.",
            includes: ["Everything in Growth", "AI Voice / Missed Call Assistant", "Website / Landing Page Support", "Advanced Automation Routing", "CRM / GoHighLevel Ready Setup", "Priority Support"],
            cta: "Start Premium Plan"
          }
        ]
      },
      onboarding: {
        eyebrow: "Client Onboarding",
        title: "Activate Your AI System",
        copy: "After choosing a plan, share the business details we need to prepare your AI setup.",
        selectedPlanLabel: "Selected plan",
        selectedAutomationsLabel: "Selected automations",
        noPlan: "No plan selected yet. Choose a plan above to prefill this area.",
        fields: {
          businessName: "Business Name",
          industry: "Industry",
          websiteUrl: "Website URL",
          contactEmail: "Contact Email",
          phone: "Phone Number",
          workingHours: "Working Hours",
          mainServices: "Main Services",
          faqs: "Common Questions / FAQs",
          bookingMethod: "Booking Method",
          googleReviewLink: "Google Review Link",
          preferredTone: "Preferred Tone",
          notificationEmail: "Notification Email",
          notes: "Anything else we should know?"
        },
        submit: "Send Onboarding Details",
        loading: "Sending Details...",
        success: "Your AI system details have been received. We’ll prepare your setup and contact you with the next steps.",
        error: "The onboarding details could not be sent. Please try again or contact us by email.",
        configError: "Onboarding webhook is not connected yet. Your selected plan has been saved locally."
      },
      demoTitle: "Want to see how this would work for your business?",
      demoCopy:
        "Book a free AI demo and we will map the first automation system that would save time or capture more leads for your business.",
      faqEyebrow: "FAQ",
      faqTitle: "Questions business owners usually ask.",
      faqs: [
        ["Is this just a chatbot?", "No. We install AI systems that can include chat, voice, lead capture, review requests, routing and follow-up."],
        ["Can it work for a non-technical team?", "Yes. The system is designed so your team can use it without managing prompts or technical setup."],
        ["Can it support Greek customers?", "Yes. The customer-facing experience can be configured in Greek, English or both."],
        ["What happens when a customer needs a human?", "The AI can collect context and route the inquiry to your team instead of trying to handle everything alone."]
      ],
      contactEyebrow: "Free AI Demo",
      contactTitle: "Request a free AI demo for your business.",
      contactCopy:
        "Tell us what you want to automate. We will show you the most practical AI system for your business type.",
      fields: {
        name: "Name",
        business: "Business name",
        industry: "Industry",
        email: "Email",
        phone: "Phone",
        message: "What do you want to automate?"
      },
      submit: "Request Free AI Demo",
      submitted: "Demo Request Received",
      loadingSubmit: "Sending Request...",
      successMessage: "Το AI Demo Request στάλθηκε επιτυχώς.",
      errorMessage: "The demo request could not be sent. Please try again or contact us by email.",
      configErrorMessage: "Make.com webhook URL is missing. Add it in src/config.js.",
      phoneLabel: "Phone",
      emailLabel: "Email",
      assistant: {
        button: "AI Assistant",
        close: "Close",
        title: "AI Demo Assistant",
        subtitle: "Online now · AI systems demo",
        status: "Online · Response Time < 5 sec",
        sendLabel: "Send",
        placeholder: "Ask about bookings, reviews or missed calls...",
        ready: "Ready to explain the system.",
        typing: "Assistant is typing...",
        liveStatus: ["AI ONLINE", "Lead Capture Ready", "Response < 5 sec"],
        typingSteps: ["Analyzing request...", "Generating response...", "Ready"],
        intro:
          "Hi — I’m the Nous AI Assistant. I can show you how AI systems help businesses automate replies, bookings and customer communication.",
        quickReplies: ["How does this work?", "Can this help my business?", "What automations do you offer?"],
        configError:
          "The AI chat demo is not connected yet. Add your Make.com chat webhook URL in src/config.js.",
        error:
          "I could not reach the AI assistant right now. Please try again, or request a free AI demo using the form below.",
        replies: {
          clinics:
            "For clinics, the AI can answer common questions, capture appointment requests, collect patient contact details and route urgent messages to the right person.",
          calls:
            "For missed calls, an AI voice or follow-up flow can collect the customer's name, phone, reason for contact and preferred time, then notify your team.",
          reviews:
            "For reviews, the system can trigger Google review requests after a visit or completed service, helping satisfied customers leave public feedback.",
          demo:
            "Use the demo form below. Share your business type and what you want to automate, and Nous Systems AI can map a practical first system.",
          default:
            "A useful first AI system usually handles FAQs, captures contact details, qualifies requests, routes urgent inquiries and triggers follow-ups."
        }
      },
      footer: "© {year} Nous Systems AI. All rights reserved.",
      footerDescription: "Premium AI automation systems for local businesses that need faster replies, more bookings and fewer missed leads.",
      footerEmail: "hello@noussystems.ai",
      footerPrivacy: "Privacy Policy",
      footerSocials: {
        group: "Social links",
        website: "Website",
        message: "Message",
        email: "Email"
      }
    },
    el: {
      htmlLang: "el",
      langButton: "EN",
      langAria: "Αλλαγή γλώσσας στα Αγγλικά",
      nav: ["Υπηρεσίες", "Κλάδοι", "Πριν/Μετά", "Διαδικασία", "Ερωτήσεις", "Επίδειξη"],
      navIds: ["services", "industries", "before-after", "how", "faq", "contact"],
      heroKicker: "Συστήματα αυτοματοποίησης AI για τοπικές επιχειρήσεις",
      heroTitle: "AI Συστήματα Που Απαντούν, Κλείνουν Ραντεβού & Πωλούν 24/7",
      heroCopy:
        "Χτίζουμε προσαρμοσμένα συστήματα AI για συνομιλία, φωνή, συλλογή επαφών και αυτοματοποίηση κριτικών για ιατρεία, εστιατόρια, δικηγορικά γραφεία και επιχειρήσεις υπηρεσιών.",
      primaryCta: "Κλείσε Δωρεάν Επίδειξη AI",
      secondaryCta: "Δες Πώς Λειτουργεί",
      trustBadges: ["Απαντήσεις Πελατών 24/7", "Αυτόματη Συλλογή Επαφών", "Περισσότερα Ραντεβού & Κριτικές"],
      heroStatus: [
        ["Ενεργό", "Συστήματα AI σε λειτουργία 24/7"],
        ["Συνδεδεμένο", "Ζωντανή επίδειξη αυτοματισμού AI"],
        ["AI σε λειτουργία", "Χρόνος απόκρισης < 5 δευτ."],
        ["Ασφαλές", "Χτισμένο για πραγματικές επιχειρήσεις"]
      ],
      livePanel: {
        title: "Ζωντανό Σύστημα",
        state: "AI συνδεδεμένο",
        metricLabel: "Χρόνος Απόκρισης",
        metricValue: "< 5 δευτ.",
        logs: [
          ["00:01", "Επαφή συλλέχθηκε"],
          ["00:03", "Αίτημα δρομολογήθηκε"],
          ["00:04", "Απάντηση έτοιμη"]
        ]
      },
      heroMetrics: [
        ["24/7", "απαντήσεις πελατών"],
        ["0 χαμένα", "αιτήματα ιστοσελίδας"],
        ["1 σύστημα", "συνομιλία, φωνή και κριτικές"]
      ],
      servicesEyebrow: "Υπηρεσίες",
      servicesTitle: "Συστήματα AI χτισμένα γύρω από πραγματικά επιχειρηματικά αποτελέσματα.",
      servicesCopy:
        "Όχι απλά μικροί βοηθοί συνομιλίας. Κάθε σύστημα σχεδιάζεται για να μειώνει χαμένες ευκαιρίες, να επιταχύνει απαντήσεις και να οργανώνει την επικοινωνία με πελάτες.",
      services: [
        {
          icon: "message-square-text",
          title: "AI Πράκτορες Συνομιλίας",
          copy: "Άμεσες απαντήσεις στην ιστοσελίδα, συλλογή επαφών και αξιολόγηση πελατών όταν είναι έτοιμοι να επικοινωνήσουν."
        },
        {
          icon: "phone-call",
          title: "AI Φωνητικοί Βοηθοί",
          copy: "Διαχείριση χαμένων κλήσεων, αιτημάτων ραντεβού και αρχικής επικοινωνίας όταν η ομάδα σου είναι απασχολημένη."
        },
        {
          icon: "monitor-cog",
          title: "Δημιουργία Ιστοσελίδας",
          copy: "Ιστοσελίδες που οδηγούν σε επικοινωνία, κρατήσεις και αιτήματα, με καθαρή προσφορά και αυτοματισμούς."
        },
        {
          icon: "radar",
          title: "Αυτόματη Συλλογή Επαφών",
          copy: "Κάθε αίτημα αποθηκεύεται, δρομολογείται και ακολουθείται με τα σωστά στοιχεία πελάτη."
        },
        {
          icon: "star",
          title: "Συστήματα Κριτικών & Φήμης",
          copy: "Αυτόματη συλλογή κριτικών Google ώστε οι ευχαριστημένοι πελάτες να γίνονται ορατή απόδειξη εμπιστοσύνης."
        },
        {
          icon: "headphones",
          title: "Αυτοματοποίηση Υποστήριξης Πελατών",
          copy: "Συχνές ερωτήσεις, δρομολόγηση και ροές εξυπηρέτησης που μειώνουν την επαναλαμβανόμενη δουλειά."
        }
      ],
      interactiveDemo: {
        eyebrow: "Διαδραστική Επίδειξη AI",
        title: "Δες Πώς Θα Δούλευε Το AI Για Τη Δική Σου Επιχείρηση",
        copy:
          "Διάλεξε τον τύπο επιχείρησης και δες πώς προσαρμοσμένα AI συστήματα μπορούν να χειριστούν απαντήσεις, κρατήσεις, leads, κριτικές και υποστήριξη πελατών.",
        businessTypeLabel: "Τύπος επιχείρησης",
        businessNameLabel: "Όνομα επιχείρησης",
        businessNamePlaceholder: "π.χ. Maria Dental Clinic",
        modulesLabel: "AI αυτοματισμοί",
        selectedModulesLabel: "{count} επιλεγμένα",
        noModulesSelected: "Δεν έχεις επιλέξει ακόμα AI αυτοματισμούς.",
        noModulesHint: "Επίλεξε έναν ή περισσότερους αυτοματισμούς για να δεις πώς λειτουργεί κάθε module στην προεπισκόπηση.",
        previewLabel: "Ζωντανή προεπισκόπηση συστήματος",
        previewStatus: "Προεπισκόπηση AI Συστήματος",
        liveSimulation: "ΖΩΝΤΑΝΗ ΠΡΟΣΟΜΟΙΩΣΗ",
        aiOnline: "AI Συνδεδεμένο",
        customerLabel: "Πελάτης",
        aiLabel: "AI",
        systemLabel: "Σύστημα",
        flowLabel: "Ροή αυτοματισμού",
        moduleBreakdownLabel: "Επιλεγμένοι αυτοματισμοί",
        resultLabel: "Πιθανά επιχειρηματικά οφέλη",
        primaryCta: "Φτιάξτε Το Για Την Επιχείρησή Μου",
        secondaryCta: "Μίλα Με Τον AI Assistant",
        emptyBusiness: "την επιχείρησή σου",
        previewTitle: "Προεπισκόπηση AI συστήματος για {business}",
        previewSubtitle: "{industry} · AI συνδεδεμένο",
        contactSummary: "Με ενδιαφέρουν AI συστήματα για {industry}. Επιλεγμένοι αυτοματισμοί: {modules}.",
        chatPrompt: "Πώς θα δούλευε αυτό για {industry};",
        statusItems: ["AI ONLINE", "ΑΥΤΟΜΑΤΙΣΜΟΣ ΕΝΕΡΓΟΣ", "ΑΠΟΚΡΙΣΗ < 5 SEC", "LEAD CAPTURE ΕΝΕΡΓΟ"],
        baseFlow: ["Μήνυμα Πελάτη", "Το AI Καταλαβαίνει Το Αίτημα", "Lead Συλλέχθηκε", "Αυτοματισμός Ενεργοποιήθηκε", "Η Ομάδα Ειδοποιήθηκε", "Follow-Up Έτοιμο"]
      },
      industriesEyebrow: "Κλάδοι",
      industriesTitle: "Σχεδιασμένο για ελληνικές τοπικές επιχειρήσεις που χρειάζονται γρήγορη ανταπόκριση.",
      industriesCopy:
        "Το σύστημα προσαρμόζεται στον τρόπο που δέχεσαι κλήσεις, μηνύματα, αιτήματα ραντεβού και κριτικές.",
      industries: [
        ["Ιατρεία & Γιατροί", "Συλλογή αιτημάτων ραντεβού και απαντήσεις σε συχνές ερωτήσεις μετά το ωράριο."],
        ["Εστιατόρια & Φιλοξενία", "Διαχείριση ερωτήσεων για κρατήσεις, εκδηλώσεις και βασικές πληροφορίες πελατών."],
        ["Δικηγορικά Γραφεία", "Αξιολόγηση νέων αιτημάτων και συλλογή βασικών στοιχείων πριν από συμβουλευτική."],
        ["Μεσιτικά Γραφεία", "Συλλογή αιτημάτων αγοραστών, πωλητών και προβολών ακινήτων από κάθε κανάλι."],
        ["Τοπικές Υπηρεσίες", "Δρομολόγηση επειγόντων αιτημάτων, προσφορών και συχνών ερωτήσεων."],
        ["Σύμβουλοι & Γραφεία Υπηρεσιών", "Αξιολόγηση νέων ενδιαφερόμενων, κλείσιμο κλήσεων και απαντήσεις αρχικής συνεργασίας."]
      ],
      beforeAfterEyebrow: "Πριν vs Μετά",
      beforeAfterTitle: "Αντικατάστησε αργές χειροκίνητες απαντήσεις με ένα σύστημα που κρατά κάθε επαφή ενεργή.",
      before: "Πριν",
      after: "Μετά",
      beforeItems: ["Χαμένες κλήσεις", "Αργές απαντήσεις", "Χαμένες επαφές", "Χειροκίνητες υπενθυμίσεις", "Λίγες κριτικές"],
      afterItems: [
        "Άμεσες AI απαντήσεις",
        "Συλλογή αιτημάτων ραντεβού",
        "Οι επαφές αποθηκεύονται αυτόματα",
        "Οι υπενθυμίσεις ενεργοποιούνται",
        "Οι κριτικές συλλέγονται"
      ],
      handlesEyebrow: "Τι Διαχειρίζεται Το AI",
      handlesTitle: "Πρακτική αυτοματοποίηση που μπορούν να χρησιμοποιήσουν οι πελάτες σου.",
      handlesCopy:
        "Ο AI βοηθός εκπαιδεύεται γύρω από τις υπηρεσίες, τις ερωτήσεις και τη διαδικασία ραντεβού της επιχείρησής σου.",
      handles: [
        "Απαντά σε συχνές ερωτήσεις",
        "Συλλέγει όνομα, τηλέφωνο και ηλεκτρονικό ταχυδρομείο",
        "Αξιολογεί το αίτημα του πελάτη",
        "Διαχειρίζεται αιτήματα ραντεβού",
        "Δρομολογεί επείγοντα αιτήματα",
        "Στέλνει ειδοποιήσεις υπενθύμισης",
        "Βοηθά στη συλλογή κριτικών Google"
      ],
      howEyebrow: "Πώς Λειτουργεί",
      howTitle: "Καθαρή διαδικασία, χωρίς τεχνική πολυπλοκότητα.",
      howCopy:
        "Εσύ εξηγείς πώς επικοινωνούν οι πελάτες με την επιχείρησή σου. Εμείς σχεδιάζουμε και εγκαθιστούμε το σύστημα AI γύρω από αυτή τη ροή.",
      howSteps: [
        ["Αναλύουμε την επιχείρησή σου", "Εξετάζουμε υπηρεσίες, ερωτήσεις πελατών, διαδικασία ραντεβού και σημεία όπου χάνονται επαφές."],
        ["Χτίζουμε το προσαρμοσμένο σύστημα AI", "Δημιουργούμε τις ροές συνομιλίας, φωνής, συλλογής επαφών, υπενθυμίσεων και κριτικών που χρειάζεσαι."],
        ["Ο AI βοηθός διαχειρίζεται επαφές 24/7", "Το σύστημα απαντά άμεσα, συλλέγει στοιχεία και δρομολογεί τα σωστά αιτήματα στην ομάδα σου."]
      ],
      systemNodes: ["Ιστοσελίδα", "Κλήσεις", "Επαφές", "Κριτικές"],
      whyEyebrow: "Γιατί Nous Systems AI",
      whyTitle: "Αυτοματοποίηση υψηλής ποιότητας που είναι πρακτική, όχι περίπλοκη.",
      whyCopy:
        "Ο στόχος είναι απλός: πιο γρήγορες απαντήσεις, περισσότερες συλλεγμένες επαφές και λιγότερη επαναλαμβανόμενη επικοινωνία.",
      stats: [
        ["24/7", "Κάλυψη επικοινωνίας πελατών"],
        ["<14ημ.", "Τυπική πρώτη εγκατάσταση"],
        ["100%", "Προσαρμοσμένη ρύθμιση για την επιχείρησή σου"],
        ["3", "Βασικές ροές: συνομιλία, φωνή, κριτικές"]
      ],
      features: [
        ["Χτισμένο για τοπικές επιχειρήσεις", "Καθαρά συστήματα για ιατρεία, εστιατόρια, δικηγορικά, μεσιτικά και επιχειρήσεις υπηρεσιών."],
        ["Χωρίς τεχνική δουλειά από εσένα", "Αναλαμβάνουμε ρύθμιση, εκπαίδευση, οδηγίες, αυτοματισμούς και καθοδήγηση εκκίνησης."],
        ["Εστίαση σε κρατήσεις", "Κάθε σελίδα, φόρμα και ροή AI οδηγεί τον πελάτη στο σωστό επόμενο βήμα."],
        ["Μεταφορά σε άνθρωπο", "Σημαντικές συνομιλίες μπορούν να περάσουν στην ομάδα σου με ήδη συλλεγμένο πλαίσιο."]
      ],
      testimonialsEyebrow: "Μαρτυρίες",
      testimonialsTitle: "Σχόλια από ιδιοκτήτες που θέλουν λιγότερα χαμένα leads.",
      testimonialsCopy:
        "Αρχικά σχόλια από τους τύπους τοπικών επιχειρήσεων για τους οποίους είναι χτισμένο το Nous Systems AI. Οι επισκέπτες μπορούν να αφήσουν το δικό τους σχόλιο παρακάτω.",
      testimonials: [
        {
          name: "Ιδιοκτήτης Ιατρείου",
          role: "Ιδιωτικό ιατρείο",
          quote:
            "Το πιο σημαντικό είναι να μη χάνονται αιτήματα για ραντεβού όταν η ομάδα είναι απασχολημένη ή εκτός ωραρίου."
        },
        {
          name: "Υπεύθυνος Εστιατορίου",
          role: "Εστίαση / φιλοξενία",
          quote:
            "Οι κρατήσεις και οι ερωτήσεις πρέπει να απαντώνται γρήγορα. Ένα τέτοιο σύστημα μειώνει πολύ τη χειροκίνητη δουλειά."
        },
        {
          name: "Σύμβουλος Real Estate",
          role: "Τοπική επιχείρηση υπηρεσιών",
          quote:
            "Αν τα στοιχεία του ενδιαφερόμενου συλλέγονται αυτόματα πριν την κλήση, η παρακολούθηση γίνεται πολύ πιο εύκολη."
        }
      ],
      testimonialForm: {
        title: "Άφησε το σχόλιό σου",
        copy: "Γράψε τι σκέφτεσαι για το AI demo ή ποιος αυτοματισμός θα βοηθούσε περισσότερο την επιχείρησή σου.",
        name: "Το όνομά σου",
        role: "Επιχείρηση / ρόλος",
        quote: "Το σχόλιό σου",
        submit: "Υποβολή Σχολίου",
        loading: "Αποστολή...",
        success: "Ευχαριστούμε. Το testimonial προστέθηκε.",
        error: "Συμπλήρωσε όνομα και testimonial πριν την υποβολή.",
        defaultRole: "Ιδιοκτήτης τοπικής επιχείρησης",
        pendingReview: "Νέο σχόλιο",
        optionalWebhookError: "Το testimonial προστέθηκε τοπικά, αλλά το προαιρετικό webhook δεν το έλαβε."
      },
      pricing: {
        eyebrow: "Μηνιαία AI Συστήματα",
        title: "Διάλεξε Το AI System Plan",
        copy: "Ξεκίνα με ένα μηνιαίο AI σύστημα χτισμένο για την επιχείρησή σου. Χωρίς μεγάλο αρχικό κόστος εγκατάστασης.",
        recommendationTitle: "Προτεινόμενο Plan Για Εσένα",
        recommendationText: "Με βάση τους αυτοματισμούς που επέλεξες, το {plan} ταιριάζει καλύτερα για {industry}.",
        recommendedLabel: "Προτεινόμενο",
        selectedModulesLabel: "Επιλεγμένοι αυτοματισμοί",
        noModulesLabel: "Δοκίμασε την διαδραστική επίδειξη πιο πάνω για να γίνει προσωπική η πρόταση.",
        note: "Η ενεργοποίηση περιλαμβάνεται. Προτείνεται ελάχιστη συνδρομή 3 μηνών για πλήρη εγκατάσταση και βελτιστοποίηση.",
        widgetTitle: "Μετά την ενεργοποίηση, η επιχείρησή σου λαμβάνει website AI widget.",
        widgetCopy: "Μπορεί να προστεθεί στην υπάρχουσα ιστοσελίδα σου ή να το εγκαταστήσουμε εμείς για εσένα.",
        widgetCode: "<script src=\"https://noussystems.ai/widget.js\" data-client-id=\"YOUR_CLIENT_ID\"></script>",
        plans: [
          {
            id: "starter",
            name: "Starter",
            price: "200€",
            period: "/μήνα",
            bestFor: "Για μικρές επιχειρήσεις που θέλουν άμεσες απαντήσεις και συλλογή leads.",
            includes: ["AI Website Chat Assistant", "Απαντήσεις σε FAQs", "Αυτόματη Συλλογή Leads", "Email Notifications", "Βασική Ρύθμιση Business Prompt", "Μηνιαία Υποστήριξη"],
            cta: "Ξεκίνα Starter Plan"
          },
          {
            id: "growth",
            name: "Growth",
            price: "300€",
            period: "/μήνα",
            bestFor: "Για επιχειρήσεις που θέλουν κρατήσεις, κριτικές και follow-up automation.",
            includes: ["Όλα του Starter", "Ροή Αιτήματος Ραντεβού / Κράτησης", "Google Review Automation", "Follow-Up Automation", "Lead Qualification", "Μηνιαία Σύνοψη Απόδοσης"],
            cta: "Ξεκίνα Growth Plan"
          },
          {
            id: "premium",
            name: "Premium",
            price: "500€",
            period: "/μήνα",
            bestFor: "Για επιχειρήσεις που θέλουν πλήρες AI σύστημα επικοινωνίας.",
            includes: ["Όλα του Growth", "AI Voice / Missed Call Assistant", "Υποστήριξη Website / Landing Page", "Advanced Automation Routing", "CRM / GoHighLevel Ready Setup", "Priority Support"],
            cta: "Ξεκίνα Premium Plan"
          }
        ]
      },
      onboarding: {
        eyebrow: "Client Onboarding",
        title: "Ενεργοποίησε Το AI Σύστημά Σου",
        copy: "Αφού επιλέξεις plan, στείλε τα στοιχεία που χρειαζόμαστε για να προετοιμάσουμε την εγκατάσταση.",
        selectedPlanLabel: "Επιλεγμένο plan",
        selectedAutomationsLabel: "Επιλεγμένοι αυτοματισμοί",
        noPlan: "Δεν έχει επιλεγεί plan ακόμα. Διάλεξε ένα plan πιο πάνω για να συμπληρωθεί αυτόματα.",
        fields: {
          businessName: "Όνομα Επιχείρησης",
          industry: "Κλάδος",
          websiteUrl: "Website URL",
          contactEmail: "Email Επικοινωνίας",
          phone: "Τηλέφωνο",
          workingHours: "Ωράριο Λειτουργίας",
          mainServices: "Βασικές Υπηρεσίες",
          faqs: "Συχνές Ερωτήσεις / FAQs",
          bookingMethod: "Τρόπος Κρατήσεων",
          googleReviewLink: "Google Review Link",
          preferredTone: "Ύφος Απάντησης",
          notificationEmail: "Email Ειδοποιήσεων",
          notes: "Κάτι άλλο που πρέπει να ξέρουμε;"
        },
        submit: "Αποστολή Στοιχείων Onboarding",
        loading: "Αποστολή στοιχείων...",
        success: "Λάβαμε τα στοιχεία του AI συστήματός σου. Θα προετοιμάσουμε την εγκατάσταση και θα επικοινωνήσουμε μαζί σου για τα επόμενα βήματα.",
        error: "Τα στοιχεία onboarding δεν στάλθηκαν. Δοκίμασε ξανά ή επικοινώνησε μαζί μας με email.",
        configError: "Το onboarding webhook δεν έχει συνδεθεί ακόμα. Το επιλεγμένο plan αποθηκεύτηκε τοπικά."
      },
      demoTitle: "Θέλεις να δεις πώς θα λειτουργούσε για τη δική σου επιχείρηση;",
      demoCopy:
        "Κλείσε δωρεάν επίδειξη AI και θα χαρτογραφήσουμε το πρώτο σύστημα αυτοματοποίησης που μπορεί να σου γλιτώσει χρόνο ή να συλλέγει περισσότερες επαφές.",
      faqEyebrow: "Συχνές Ερωτήσεις",
      faqTitle: "Συχνές ερωτήσεις από ιδιοκτήτες επιχειρήσεων.",
      faqs: [
        ["Είναι απλά ένας βοηθός συνομιλίας;", "Όχι. Εγκαθιστούμε συστήματα AI που μπορούν να περιλαμβάνουν συνομιλία, φωνή, συλλογή επαφών, αιτήματα κριτικών, δρομολόγηση και υπενθυμίσεις."],
        ["Μπορεί να το χρησιμοποιήσει μη τεχνική ομάδα;", "Ναι. Το σύστημα σχεδιάζεται ώστε η ομάδα σου να το χρησιμοποιεί χωρίς να διαχειρίζεται οδηγίες ή τεχνική ρύθμιση."],
        ["Μπορεί να υποστηρίζει Έλληνες πελάτες;", "Ναι. Η εμπειρία πελάτη μπορεί να ρυθμιστεί στα Ελληνικά, στα Αγγλικά ή και στα δύο."],
        ["Τι γίνεται όταν ο πελάτης χρειάζεται άνθρωπο;", "Το AI συλλέγει το πλαίσιο και δρομολογεί το αίτημα στην ομάδα σου αντί να προσπαθεί να τα κάνει όλα μόνο του."]
      ],
      contactEyebrow: "Δωρεάν Επίδειξη AI",
      contactTitle: "Ζήτησε δωρεάν επίδειξη AI για την επιχείρησή σου.",
      contactCopy:
        "Πες μας τι θέλεις να αυτοματοποιήσεις. Θα σου δείξουμε το πιο πρακτικό σύστημα AI για τον τύπο της επιχείρησής σου.",
      fields: {
        name: "Όνομα",
        business: "Όνομα επιχείρησης",
        industry: "Κλάδος",
        email: "Ηλεκτρονικό ταχυδρομείο",
        phone: "Τηλέφωνο",
        message: "Τι θέλεις να αυτοματοποιήσεις;"
      },
      submit: "Ζήτησε Δωρεάν Επίδειξη AI",
      submitted: "Το αίτημα επίδειξης ελήφθη",
      loadingSubmit: "Αποστολή αιτήματος...",
      successMessage: "Το αίτημα για επίδειξη AI στάλθηκε επιτυχώς.",
      errorMessage: "Το αίτημα δεν στάλθηκε. Δοκίμασε ξανά ή επικοινώνησε μαζί μας με ηλεκτρονικό ταχυδρομείο.",
      configErrorMessage: "Λείπει ο σύνδεσμος Make.com. Πρόσθεσέ τον στο src/config.js.",
      phoneLabel: "Τηλέφωνο",
      emailLabel: "Ηλεκτρονικό ταχυδρομείο",
      assistant: {
        button: "AI Βοηθός",
        close: "Κλείσιμο",
        title: "Βοηθός Επίδειξης AI",
        subtitle: "Συνδεδεμένος τώρα · Επίδειξη συστημάτων AI",
        status: "Συνδεδεμένος · Χρόνος απόκρισης < 5 δευτ.",
        sendLabel: "Αποστολή",
        placeholder: "Ρώτησε για ραντεβού, κριτικές ή χαμένες κλήσεις...",
        ready: "Έτοιμο για εξήγηση.",
        typing: "Ο βοηθός πληκτρολογεί...",
        liveStatus: ["AI ONLINE", "Lead Capture Ready", "Απόκριση < 5 sec"],
        typingSteps: ["Ανάλυση αιτήματος...", "Δημιουργία απάντησης...", "Έτοιμο"],
        intro:
          "Γεια σου — είμαι ο AI Βοηθός της Nous. Μπορώ να σου δείξω πώς τα συστήματα AI αυτοματοποιούν απαντήσεις, ραντεβού και επικοινωνία πελατών.",
        quickReplies: ["Πώς λειτουργεί;", "Μπορεί να βοηθήσει την επιχείρησή μου;", "Τι αυτοματισμούς προσφέρετε;"],
        configError:
          "Η επίδειξη συνομιλίας AI δεν έχει συνδεθεί ακόμα. Πρόσθεσε τον σύνδεσμο Make.com στο src/config.js.",
        error:
          "Δεν μπόρεσα να συνδεθώ με τον AI βοηθό αυτή τη στιγμή. Δοκίμασε ξανά ή ζήτησε δωρεάν επίδειξη AI από τη φόρμα.",
        replies: {
          clinics:
            "Για ιατρεία, το AI μπορεί να απαντά σε συχνές ερωτήσεις, να συλλέγει αιτήματα ραντεβού, στοιχεία επικοινωνίας και να δρομολογεί επείγοντα μηνύματα.",
          calls:
            "Για χαμένες κλήσεις, μια φωνητική ροή AI ή υπενθύμιση μπορεί να συλλέξει όνομα, τηλέφωνο, λόγο επικοινωνίας και προτιμώμενη ώρα, μετά να ειδοποιήσει την ομάδα σου.",
          reviews:
            "Για κριτικές, το σύστημα μπορεί να στέλνει αιτήματα Google μετά από επίσκεψη ή ολοκληρωμένη υπηρεσία.",
          demo:
            "Χρησιμοποίησε τη φόρμα επίδειξης πιο κάτω. Γράψε τον κλάδο σου και τι θέλεις να αυτοματοποιήσεις.",
          default:
            "Ένα χρήσιμο πρώτο σύστημα AI συνήθως απαντά σε συχνές ερωτήσεις, συλλέγει στοιχεία, αξιολογεί αιτήματα, δρομολογεί επείγοντα θέματα και ενεργοποιεί υπενθυμίσεις."
        }
      },
      footer: "© {year} Nous Systems AI. Με επιφύλαξη παντός δικαιώματος.",
      footerDescription: "Premium AI συστήματα αυτοματοποίησης για τοπικές επιχειρήσεις που χρειάζονται ταχύτερες απαντήσεις, περισσότερες κρατήσεις και λιγότερα χαμένα leads.",
      footerEmail: "hello@noussystems.ai",
      footerPrivacy: "Πολιτική Απορρήτου",
      footerSocials: {
        group: "Κοινωνικοί σύνδεσμοι",
        website: "Ιστοσελίδα",
        message: "Μήνυμα",
        email: "Ηλεκτρονικό ταχυδρομείο"
      }
    }
  };

  function Icon({ name, className }) {
    return h("i", {
      "data-lucide": name,
      className,
      "aria-hidden": "true"
    });
  }

  function useLucideRefresh(deps) {
    useEffect(() => {
      if (!window.lucide) return;
      window.lucide.createIcons({ attrs: { "stroke-width": 1.7 } });
    }, deps);
  }

  function useSceneControls() {
    useEffect(() => {
      motionRuntime.init();

      const header = document.querySelector("[data-site-header]");
      const hero = document.querySelector(".hero");
      const setHeaderState = (isScrolled) => {
        if (!header) return;
        header.classList.toggle("is-scrolled", isScrolled);
      };

      setHeaderState((window.scrollY || window.pageYOffset || 0) > 80);

      const headerObserver =
        header && hero && "IntersectionObserver" in window
          ? new IntersectionObserver(
              ([entry]) => {
                setHeaderState(!entry.isIntersecting);
              },
              { rootMargin: "-90px 0px -72% 0px", threshold: 0 }
            )
          : null;

      headerObserver?.observe(hero);

      return () => {
        headerObserver?.disconnect();
      };
    }, []);
  }

  function ThreeScene() {
    const mountRef = useRef(null);

    useEffect(() => {
      const mount = mountRef.current;
      if (!mount || !window.THREE) return undefined;

      const reduceMotion = motionRuntime.state.reduceMotion;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(54, window.innerWidth / window.innerHeight, 0.1, 1000);
      let renderer;
      try {
        renderer = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
          preserveDrawingBuffer: false
        });
      } catch (error) {
        document.documentElement.classList.add("no-webgl");
        console.warn("[Nous] WebGL unavailable; using CSS background fallback.", error);
        return undefined;
      }
      const isLowPowerDevice =
        window.innerWidth < 760 ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4);
      const mainGroup = new THREE.Group();
      const lookTarget = new THREE.Vector3(0, 0, 0);
      const targetLook = new THREE.Vector3(0, 0, 0);

      camera.position.set(0, 0, 86);
      renderer.domElement.setAttribute("aria-hidden", "true");
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isLowPowerDevice ? 1.1 : 1.45));
      renderer.setSize(window.innerWidth, window.innerHeight);
      mount.appendChild(renderer.domElement);
      scene.add(mainGroup);

      const particleCount = isLowPowerDevice ? 42 : 92;
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);
      const speeds = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i += 1) {
        const index = i * 3;
        positions[index] = (Math.random() - 0.5) * 190;
        positions[index + 1] = (Math.random() - 0.5) * 110;
        positions[index + 2] = (Math.random() - 0.5) * 110;
        speeds[i] = 0.12 + Math.random() * 0.42;
      }

      particleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

      const particleMaterial = new THREE.PointsMaterial({
        color: 0x68eaff,
        size: window.innerWidth < 700 ? 0.13 : 0.16,
        transparent: true,
        opacity: 0.36,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      mainGroup.add(particles);

      const grid = new THREE.GridHelper(190, 48, 0x1ea7ff, 0x102a46);
      grid.position.y = -42;
      grid.position.z = -34;
      grid.material.transparent = true;
      grid.material.opacity = 0.16;
      mainGroup.add(grid);

      const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x41c9ff,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending
      });
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(15, 1), coreMaterial);
      core.position.set(42, 0, -26);
      mainGroup.add(core);

      let resizeRaf = 0;
      const applyResize = () => {
        const mobile = window.innerWidth < 768;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile || isLowPowerDevice ? 1.1 : 1.45));
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      const onResize = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(applyResize);
      };

      window.addEventListener("resize", onResize);

      let frame = 0;
      let lastFrame = 0;
      let sceneVisible = true;

      const heroNode = document.querySelector(".hero");
      const serviceNode = document.querySelector("#services");
      const howNode = document.querySelector("#how");
      const sceneObserver =
        heroNode && "IntersectionObserver" in window
          ? new IntersectionObserver(
              ([entry]) => {
                sceneVisible = entry.isIntersecting || window.scrollY < window.innerHeight * 1.8;
              },
              { rootMargin: "30% 0px 30% 0px", threshold: 0.01 }
            )
          : null;

      sceneObserver?.observe(heroNode);

      const renderFrame = (time = 0, delta = 1 / 60, runtimeState = motionRuntime.state) => {
        const targetFrameMs = isLowPowerDevice ? 72 : 50;
        if (time - lastFrame < targetFrameMs || document.hidden || !sceneVisible) {
          return;
        }
        lastFrame = time;
        const mobile = runtimeState.isMobile;
        const pointerStrength = runtimeState.canUsePointerParallax ? (mobile ? 0 : 1) : 0;
        const heroProgress = motionRuntime.getSectionProgress(heroNode, 1, 0.08);
        const serviceProgress = motionRuntime.getSectionProgress(serviceNode, 0.88, 0.16);
        const howProgress = motionRuntime.getSectionProgress(howNode, 0.88, 0.16);
        const serviceActive = smoothstep(0.1, 0.75, serviceProgress);
        const howActive = smoothstep(0.1, 0.75, howProgress);

        frame += reduceMotion || runtimeState.reduceMotion ? 0.0006 : delta;
        particles.rotation.y = damp(particles.rotation.y, frame * 0.08 + runtimeState.pointer.x * 0.04 * pointerStrength, 4.2, delta);
        particles.rotation.x = damp(particles.rotation.x, runtimeState.pointer.y * 0.024 * pointerStrength, 4.2, delta);
        core.rotation.x = damp(core.rotation.x, frame * 0.5, 3.4, delta);
        core.rotation.y = damp(core.rotation.y, frame * 0.38 + serviceActive * 0.2, 3.4, delta);
        grid.position.z = damp(grid.position.z, -34 + Math.sin(frame * 0.7) * 0.8 - heroProgress * 5, 2.4, delta);
        mainGroup.rotation.y = damp(mainGroup.rotation.y, runtimeState.pointer.x * 0.028 * pointerStrength - serviceActive * 0.045 + howActive * 0.035, 3.2, delta);
        mainGroup.rotation.x = damp(mainGroup.rotation.x, runtimeState.pointer.y * 0.016 * pointerStrength, 3.2, delta);
        core.position.x = damp(core.position.x, 42 - serviceActive * 18 + howActive * 10, 3.4, delta);
        core.position.y = damp(core.position.y, serviceActive * 4 - howActive * 5, 3.4, delta);

        const cameraTarget = {
          x: runtimeState.pointer.x * 1.15 * pointerStrength - serviceActive * 3.8 + howActive * 3.2,
          y: -runtimeState.pointer.y * 0.82 * pointerStrength + serviceActive * 1.1 - howActive * 0.7,
          z: 86 - heroProgress * 12 - serviceActive * 8 - howActive * 4,
          fov: 54 - serviceActive * 4 + howActive * 2
        };
        camera.position.x = damp(camera.position.x, cameraTarget.x, 4.2, delta);
        camera.position.y = damp(camera.position.y, cameraTarget.y, 4.2, delta);
        camera.position.z = damp(camera.position.z, cameraTarget.z, 4.2, delta);
        targetLook.set(serviceActive * 2 - howActive * 1.4, serviceActive * 0.4, 0);
        lookTarget.x = damp(lookTarget.x, targetLook.x, 4.4, delta);
        lookTarget.y = damp(lookTarget.y, targetLook.y, 4.4, delta);
        lookTarget.z = damp(lookTarget.z, targetLook.z, 4.4, delta);
        if (Math.abs(camera.fov - cameraTarget.fov) > 0.02) {
          camera.fov = damp(camera.fov, cameraTarget.fov, 3.4, delta);
          camera.updateProjectionMatrix();
        }
        camera.lookAt(lookTarget);
        renderer.render(scene, camera);
      };

      renderer.render(scene, camera);
      const unsubscribeFrame = motionRuntime.addFrameCallback(renderFrame);

      return () => {
        unsubscribeFrame();
        cancelAnimationFrame(resizeRaf);
        sceneObserver?.disconnect();
        window.removeEventListener("resize", onResize);
        scene.remove(mainGroup);
        mainGroup.remove(particles, grid, core);
        particleGeometry.dispose();
        particleMaterial.dispose();
        core.geometry.dispose();
        coreMaterial.dispose();
        grid.geometry?.dispose?.();
        grid.material?.dispose?.();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    }, []);

    return h("div", { className: "three-layer", ref: mountRef, "aria-hidden": "true" });
  }

  function FluidInkCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return undefined;
      const context = canvas.getContext("2d", { alpha: true });
      if (!context) return undefined;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const palette = ["rgba(101,234,255,", "rgba(30,167,255,", "rgba(84,119,255,", "rgba(184,92,255,", "rgba(255,78,209,"];
      const splats = [];
      const pointer = { initialized: false, x: 0, y: 0 };
      const startTime = performance.now();
      const isCompact = () => window.innerWidth < 760;
      const isPerformanceMode = () =>
        isCompact() ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
        (navigator.deviceMemory && navigator.deviceMemory <= 4);
      let width = 0;
      let height = 0;
      let dpr = 1;
      let resizeRaf = 0;
      let unsubscribeFrame = null;
      let orbitAngle = 0;
      let queuedWaves = isPerformanceMode() ? 1 : 3;
      let lastWave = 0;
      let lastFrame = 0;
      let lastPointerSplat = 0;
      let isHeroVisible = true;

      const resize = () => {
        dpr = Math.min(window.devicePixelRatio || 1, isPerformanceMode() ? 1 : 1.1);
        width = Math.max(1, canvas.clientWidth);
        height = Math.max(1, canvas.clientHeight);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      const scheduleResize = () => {
        cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(resize);
      };

      const randomColor = (alpha = 0.72) => `${palette[Math.floor(Math.random() * palette.length)]}${alpha})`;

      const addSplat = (x, y, force = 1, count = 8) => {
        const amount = Math.min(isPerformanceMode() ? 3 : 5, Math.max(2, Math.round(count * force)));
        for (let index = 0; index < amount; index += 1) {
          const angle = Math.random() * Math.PI * 2;
          const speed = (0.18 + Math.random() * 0.72) * force;
          const radius = (42 + Math.random() * (isPerformanceMode() ? 62 : 92)) * force;
          splats.push({
            x: x + (Math.random() - 0.5) * 42 * force,
            y: y + (Math.random() - 0.5) * 42 * force,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius,
            life: 1,
            decay: 0.006 + Math.random() * 0.008,
            color: randomColor(0.58 + Math.random() * 0.22),
            spin: (Math.random() - 0.5) * 0.018,
            angle
          });
        }
        const maxSplats = isPerformanceMode() ? 34 : 64;
        if (splats.length > maxSplats) splats.splice(0, splats.length - maxSplats);
      };

      const loadBurst = () => {
        const burstCount = isPerformanceMode() ? 5 : 10;
        for (let index = 0; index < burstCount; index += 1) {
          addSplat(Math.random() * width, Math.random() * height, 0.62 + Math.random() * 0.88, 2);
        }
      };

      const drawBase = (fade = 0.09) => {
        context.globalCompositeOperation = "source-over";
        context.fillStyle = `rgba(4, 5, 12, ${fade})`;
        context.fillRect(0, 0, width, height);

        const scrim = context.createRadialGradient(width * 0.5, height * 0.46, 0, width * 0.5, height * 0.46, Math.max(width, height) * 0.72);
        scrim.addColorStop(0, "rgba(4,5,12,0.28)");
        scrim.addColorStop(0.44, "rgba(4,5,12,0.12)");
        scrim.addColorStop(1, "rgba(4,5,12,0.02)");
        context.fillStyle = scrim;
        context.fillRect(0, 0, width, height);
      };

      const drawSplat = (splat, time) => {
        const pulse = 0.88 + Math.sin(time * 0.0017 + splat.angle) * 0.12;
        const radius = splat.radius * splat.life * pulse;
        const gradient = context.createRadialGradient(splat.x, splat.y, radius * 0.04, splat.x, splat.y, radius);
        gradient.addColorStop(0, splat.color);
        gradient.addColorStop(0.32, splat.color.replace(/[\d.]+\)$/g, `${0.2 * splat.life})`));
        gradient.addColorStop(0.72, splat.color.replace(/[\d.]+\)$/g, `${0.065 * splat.life})`));
        gradient.addColorStop(1, "rgba(4,5,12,0)");

        context.save();
        context.translate(splat.x, splat.y);
        context.rotate(splat.angle + time * splat.spin);
        context.scale(1.65, 0.72 + Math.sin(time * 0.001 + splat.angle) * 0.16);
        context.translate(-splat.x, -splat.y);
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(splat.x, splat.y, radius, 0, Math.PI * 2);
        context.fill();
        context.restore();
      };

      const render = (time) => {
        const targetFrameMs = isPerformanceMode() ? 84 : 58;
        if (time - lastFrame < targetFrameMs) {
          return;
        }
        lastFrame = time;

        if (!isHeroVisible || document.hidden) {
          return;
        }

        const elapsed = time - startTime;
        drawBase(0.08);

        if (elapsed > 700 && !reduceMotion) {
          orbitAngle += 0.026;
          const baseRadius = Math.min(300, width * 0.34, height * 0.34);
          const radius = baseRadius * (0.72 + 0.28 * Math.sin(orbitAngle * 0.37));
          const x = width * 0.5 + Math.cos(orbitAngle) * radius;
          const y = height * 0.47 + Math.sin(orbitAngle) * radius;
          if (Math.round(orbitAngle * 100) % (isPerformanceMode() ? 16 : 10) === 0) addSplat(x, y, isPerformanceMode() ? 0.24 : 0.34, 1);
        }

        if (queuedWaves > 0 && time - lastWave > 160 && !reduceMotion) {
          queuedWaves -= 1;
          lastWave = time;
          addSplat(width * (0.18 + Math.random() * 0.64), height * (0.18 + Math.random() * 0.64), isPerformanceMode() ? 0.42 : 0.62, 3);
        }

        context.globalCompositeOperation = "lighter";
        for (let index = splats.length - 1; index >= 0; index -= 1) {
          const splat = splats[index];
          splat.angle += splat.spin;
          splat.vx += Math.sin(time * 0.0012 + splat.y * 0.01) * 0.012;
          splat.vy += Math.cos(time * 0.001 + splat.x * 0.01) * 0.012;
          splat.x += splat.vx;
          splat.y += splat.vy;
          splat.life -= splat.decay;
          if (splat.life <= 0) {
            splats.splice(index, 1);
            continue;
          }
          drawSplat(splat, time);
          if (splat.x < -240 || splat.x > width + 240 || splat.y < -240 || splat.y > height + 240) {
            splats.splice(index, 1);
          }
        }
      };

      const handlePointer = (event) => {
        if (!motionRuntime.state.canUsePointerParallax || isPerformanceMode()) return;
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        if (!pointer.initialized) {
          pointer.initialized = true;
          pointer.x = x;
          pointer.y = y;
          addSplat(x, y, 0.85, 4);
          return;
        }
        const distance = Math.hypot(x - pointer.x, y - pointer.y);
        pointer.x = x;
        pointer.y = y;
        const now = performance.now();
        if (distance > 14 && now - lastPointerSplat > 70) {
          lastPointerSplat = now;
          addSplat(x, y, Math.min(1.05, distance / 52), 2);
        }
      };

      const handleTouch = (event) => {
        Array.from(event.touches || []).slice(0, 1).forEach((touch) => handlePointer(touch));
      };

      resize();
      drawBase(1);
      loadBurst();

      if (reduceMotion) {
        splats.slice(0, 48).forEach((splat) => drawSplat(splat, performance.now()));
      } else {
        unsubscribeFrame = motionRuntime.addFrameCallback((time) => render(time));
      }

      const visibilityObserver =
        "IntersectionObserver" in window
          ? new IntersectionObserver(
              ([entry]) => {
                isHeroVisible = entry.isIntersecting;
              },
              { threshold: 0.02 }
            )
          : null;

      visibilityObserver?.observe(canvas);
      window.addEventListener("resize", scheduleResize, { passive: true });
      window.addEventListener("pointermove", handlePointer, { passive: true });
      window.addEventListener("touchmove", handleTouch, { passive: true });

      return () => {
        unsubscribeFrame?.();
        cancelAnimationFrame(resizeRaf);
        visibilityObserver?.disconnect();
        window.removeEventListener("resize", scheduleResize);
        window.removeEventListener("pointermove", handlePointer);
        window.removeEventListener("touchmove", handleTouch);
      };
    }, []);

    return h("canvas", { className: "hero-fluid-canvas", ref: canvasRef, "aria-hidden": "true" });
  }

  function WordReveal({ as = "h1", text, className = "", baseDelay = 480, stagger = 85, duration = 720, y = 26 }) {
    const words = text.split(" ");
    return h(
      as,
      { className },
      words.map((word, index) =>
        h(
          "i",
          {
            className: "reveal-word",
            key: `${word}-${index}`,
            style: {
              "--word-delay": `${baseDelay + index * stagger}ms`,
              "--word-duration": `${duration}ms`,
              "--word-y": `${y}px`
            }
          },
          word,
          index < words.length - 1 ? "\u00A0" : ""
        )
      )
    );
  }

  function HeroDemoStartBar({ lang }) {
    const copy =
      lang === "el"
        ? {
            placeholder: "Όνομα επιχείρησης",
            cta: "Δες AI demo",
            label: "Start AI demo"
          }
        : {
            placeholder: "Business name",
            cta: "See AI demo",
            label: "Start AI demo"
          };
    const [businessName, setBusinessName] = useState("");

    const submit = (event) => {
      event.preventDefault();
      const payload = {
        businessName: businessName.trim(),
        moduleIds: ["chatAgents", "appointmentBooking", "leadCapture"],
        updatedAt: new Date().toISOString()
      };
      saveJsonStorage("nous-hero-demo-start", payload);
      window.dispatchEvent(new CustomEvent("nous:hero-demo-start", { detail: payload }));
      motionRuntime.scrollTo("#ai-demo");
    };

    return h(
      "form",
      { className: "hero-demo-start-bar", onSubmit: submit, "aria-label": copy.label },
      h("input", {
        type: "text",
        value: businessName,
        onChange: (event) => setBusinessName(event.target.value),
        placeholder: copy.placeholder,
        "aria-label": copy.placeholder,
        autoComplete: "organization"
      }),
      h(
        motion.button,
        { type: "submit", whileTap: { scale: 0.98 } },
        copy.cta,
        h(Icon, { name: "arrow-right" })
      )
    );
  }

  function Loader({ loaded }) {
    const [videoFailed, setVideoFailed] = useState(false);

    return h(
      AnimatePresence,
      null,
      !loaded &&
        h(
          motion.div,
          {
            className: "loader loader-activation",
            initial: { opacity: 1 },
            exit: { opacity: 0, transition: { duration: 0.64, ease: smoothEase } }
          },
          h(
            "div",
            { className: "loader-neural-field", "aria-hidden": "true" },
            Array.from({ length: 14 }).map((_, index) => h("span", { className: `loader-particle particle-${index + 1}`, key: index }))
          ),
          h(
            "div",
            { className: "loader-interface", "aria-hidden": "true" },
            h("div", { className: "loader-core-pulse" }),
            h("div", { className: "loader-ring loader-ring-a" }),
            h("div", { className: "loader-ring loader-ring-b" }),
            h("div", { className: "loader-ring loader-ring-c" }),
            h("div", { className: "loader-scan-sweep" }),
            h("span", { className: "loader-orbit-node node-1" }),
            h("span", { className: "loader-orbit-node node-2" }),
            h("span", { className: "loader-orbit-node node-3" }),
            h("span", { className: "loader-orbit-node node-4" })
          ),
          h(
            motion.div,
            {
              className: "loader-logo-wrap",
              initial: { opacity: 0, scale: 0.94 },
              animate: { opacity: 1, scale: 1 },
              transition: { duration: 0.86, delay: 0.12, ease: smoothEase }
            },
            videoFailed
              ? h("img", {
                  className: "loader-mark",
                  src: logoPath,
                  alt: "Nous Systems AI",
                  width: 1536,
                  height: 1024,
                  decoding: "async",
                  onError: useLogoFallback
                })
              : h(
                  "video",
                  {
                    className: "loader-mark loader-video-mark",
                    autoPlay: true,
                    loop: true,
                    muted: true,
                    playsInline: true,
                    preload: "metadata",
                    poster: logoPath,
                    "aria-label": "Nous Systems AI",
                    onError: () => setVideoFailed(true)
                  },
                  h("source", { src: animatedLogoPath, type: "video/mp4", onError: () => setVideoFailed(true) })
                )
          ),
          h(
            "div",
            { className: "loader-status", "aria-live": "polite" },
            h("span", { className: "loader-status-initial" }, "Initializing Nous AI System..."),
            h("span", { className: "loader-status-online" }, "AI Systems Online")
          ),
          h("div", { className: "loader-boot-line", "aria-hidden": "true" }, h("span", null))
        )
    );
  }

  function Nav({ lang, onToggle }) {
    const c = content[lang];

    return h(
      motion.header,
      {
        className: "nav",
        "data-site-header": true,
        initial: { y: -70, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.6, delay: 0.45, ease: smoothEase }
      },
      h(
        "div",
        { className: "nav-inner" },
        h(
          "a",
          { href: "#top", className: "brand-lockup", "aria-label": "Nous Systems AI home" },
          h(BrandLogoMark),
          h("span", { className: "brand-name" }, "NOUS SYSTEMS AI")
        ),
        h(
          "div",
          { className: "nav-actions" },
          h(
            "nav",
            { className: "nav-links", "aria-label": "Main navigation" },
            c.nav.map((item, index) => h("a", { href: `#${c.navIds[index]}`, key: item }, item))
          ),
          h(
            "button",
            {
              className: "lang-toggle",
              type: "button",
              onClick: () => onToggle(lang === "en" ? "el" : "en"),
              "aria-label": c.langAria
            },
            c.langButton
          )
        )
      )
    );
  }

  function LogoStage({ style }) {
    return h(
      motion.div,
      {
        className: "logo-stage cinematic-logo-stage",
        style
      },
      h("div", { className: "logo-stage-grid", "aria-hidden": "true" }),
      h("div", { className: "logo-light-sweep", "aria-hidden": "true" }),
      h("div", { className: "logo-orbit orbit-a", "aria-hidden": "true" }),
      h("div", { className: "logo-energy-line", "aria-hidden": "true" }),
      h("div", { className: "hero-logo-shell" }, h(HeroLogoMedia))
    );
  }

  function HeroSystemStatus({ lang, style }) {
    const statusItems = content[lang].heroStatus;

    return h(
      motion.div,
      {
        className: "hero-system-status",
        initial: { opacity: 0, y: 18 },
        animate: { opacity: 1, y: 0 },
        style,
        transition: { duration: 0.6, delay: 1.02, ease: smoothEase },
        "aria-label": "Live system status"
      },
      statusItems.map(([state, label]) =>
        h(
          "div",
          { className: "hero-status-chip", key: label },
          h("span", { className: "status-pulse", "aria-hidden": "true" }),
          h("strong", null, state),
          h("span", null, label)
        )
      )
    );
  }

  function LiveAutomationPanel({ lang, style }) {
    const panel = content[lang].livePanel;

    return h(
      motion.div,
      {
        className: "live-automation-panel",
        initial: { opacity: 0, x: 28, y: 14 },
        animate: { opacity: 1, x: 0, y: 0 },
        style,
        transition: { duration: 0.7, delay: 1.12, ease: smoothEase },
        "aria-hidden": "true"
      },
      h(
        "div",
        { className: "live-panel-head" },
        h("span", { className: "status-pulse" }),
        h("strong", null, panel.title),
        h("span", null, panel.state)
      ),
      h(
        "div",
        { className: "live-panel-metric" },
        h("span", null, panel.metricLabel),
        h("strong", null, panel.metricValue)
      ),
      h(
        "div",
        { className: "live-log-list" },
        panel.logs.map(([time, text]) =>
          h("div", { className: "live-log-row", key: text }, h("span", null, time), h("p", null, text))
        )
      )
    );
  }

  function SectionIntro({ eyebrow, title, copy, center = false }) {
    return h(
      motion.div,
      { className: center ? "section-intro centered" : "section-intro", ...reveal() },
      h("div", { className: "section-eyebrow" }, eyebrow),
      h("h2", { className: "section-heading" }, title),
      copy && h("p", { className: "section-copy" }, copy)
    );
  }

  const formatText = (template, values) =>
    Object.entries(values).reduce((text, [key, value]) => text.replaceAll(`{${key}}`, value), template);

  const planPriority = { starter: 1, growth: 2, premium: 3 };

  const getRecommendedPlanId = (moduleIds = []) => {
    const premiumModules = ["voiceAssistants", "websiteCreation", "advancedRouting", "crmRouting"];
    const growthModules = ["appointmentBooking", "reviewSystem", "followUp"];

    if (moduleIds.some((moduleId) => premiumModules.includes(moduleId))) return "premium";
    if (moduleIds.some((moduleId) => growthModules.includes(moduleId))) return "growth";
    return "starter";
  };

  const readJsonStorage = (key, fallback = null) => {
    try {
      const stored = window.localStorage.getItem(key);
      return stored ? JSON.parse(stored) : fallback;
    } catch (error) {
      console.warn(`[Nous] Could not read ${key}`, error);
      return fallback;
    }
  };

  const saveJsonStorage = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Nous] Could not save ${key}`, error);
    }
  };

  const getPaymentLink = (planId) => {
    const links = (window.NOUS_CONFIG && window.NOUS_CONFIG.PAYMENT_LINKS) || {};
    return links[planId] || `https://buy.stripe.com/placeholder-${planId}`;
  };

  const normalizePlanSelection = (selection = {}, fallbackPlanId = "starter") => {
    const moduleIds = Array.isArray(selection.moduleIds) ? selection.moduleIds : [];
    const selectedPlanId = selection.selectedPlanId || selection.recommendedPlanId || getRecommendedPlanId(moduleIds) || fallbackPlanId;

    return {
      selectedPlanId,
      selectedPlan: selection.selectedPlan || "",
      recommendedPlanId: selection.recommendedPlanId || getRecommendedPlanId(moduleIds),
      businessName: selection.businessName || "",
      industry: selection.industry || "",
      modules: Array.isArray(selection.modules) ? selection.modules : [],
      moduleIds,
      automationGoal: selection.automationGoal || "",
      subscriptionStatus: selection.subscriptionStatus || "",
      mockPaymentCompletedAt: selection.mockPaymentCompletedAt || "",
      updatedAt: selection.updatedAt || new Date().toISOString()
    };
  };

  const slugifyClientPart = (value = "") =>
    value
      .toString()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);

  const generateClientId = (businessName = "", industry = "") => {
    const base = slugifyClientPart(businessName) || slugifyClientPart(industry) || "client";
    const suffix = Date.now().toString(36).slice(-5);
    return `nous-${base}-${suffix}`;
  };

  const getClientShareLink = (clientId) => {
    const origin = window.location.origin || "http://localhost:5173";
    const path = window.location.pathname || "/";
    return `${origin}${path}?mode=client&clientId=${encodeURIComponent(clientId)}`;
  };

  const getClients = () => {
    const stored = readJsonStorage("nous_clients", []);
    if (Array.isArray(stored)) return stored;
    if (stored && typeof stored === "object") return Object.values(stored);
    return [];
  };

  const saveClientConfig = (clientConfig) => {
    const clients = getClients();
    const nextClients = [clientConfig, ...clients.filter((client) => client.clientId !== clientConfig.clientId)];
    saveJsonStorage("nous_clients", nextClients);
    saveJsonStorage("nous_active_client_id", clientConfig.clientId);
    return clientConfig;
  };

  const getClientConfig = (clientId) => getClients().find((client) => client.clientId === clientId);

  const getClientLeads = () => readJsonStorage("nous_client_leads", []);

  const detectLeadIntent = (message = "") => {
    const text = message.toLowerCase();
    const keywords = [
      "appointment",
      "booking",
      "reservation",
      "call me",
      "price",
      "quote",
      "consultation",
      "ενδιαφέρομαι",
      "ραντεβού",
      "κρατηση",
      "κράτηση",
      "προσφορά"
    ];
    return keywords.find((keyword) => text.includes(keyword)) || "";
  };

  const saveClientLead = (clientConfig, message, intent) => {
    const lead = {
      leadId: `lead-${Date.now().toString(36)}`,
      clientId: clientConfig.clientId,
      businessName: clientConfig.businessName,
      industry: clientConfig.industry,
      plan: clientConfig.plan,
      message,
      detectedIntent: intent,
      createdAt: new Date().toISOString()
    };
    saveJsonStorage("nous_client_leads", [lead, ...getClientLeads()]);
    return lead;
  };

  const getInstallRequests = () => readJsonStorage("nous_install_requests", []);

  const saveInstallRequest = (clientConfig, installType) => {
    const request = {
      requestId: `install-${Date.now().toString(36)}`,
      clientId: clientConfig.clientId,
      businessName: clientConfig.businessName,
      installType,
      status: "Local Mock Requested",
      createdAt: new Date().toISOString()
    };
    saveJsonStorage("nous_install_requests", [request, ...getInstallRequests()]);
    return request;
  };

  const copyToClipboard = async (text) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return true;
  };

  const parseAssistantReply = (value) => {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return "";
      try {
        return parseAssistantReply(JSON.parse(trimmed));
      } catch (error) {
        try {
          return parseAssistantReply(JSON.parse(`{${trimmed}}`));
        } catch (wrappedError) {
          const replyMatch = trimmed.match(/^["']?reply["']?\s*:\s*(["']?)([\s\S]*?)\1\s*$/i);
          return replyMatch ? replyMatch[2].replace(/\\"/g, "\"").trim() : trimmed;
        }
      }
    }
    if (Array.isArray(value)) return value.map(parseAssistantReply).filter(Boolean).join("\n");
    if (value && typeof value === "object") {
      return parseAssistantReply(
        value.reply ||
          value.response ||
          value.message ||
          value.answer ||
          value.content ||
          value.text ||
          value.output_text ||
          value.choices?.[0]?.message?.content
      );
    }
    return "";
  };

  const readAssistantResponse = async (response) => {
    const textPromise = response.clone().text();
    let parsed = null;
    try {
      parsed = await response.json();
    } catch (error) {
      parsed = null;
    }
    const text = await textPromise;
    return parseAssistantReply(parsed) || parseAssistantReply(text);
  };

  const buildClientFallbackReply = (clientConfig) =>
    `Thanks for your message. ${clientConfig.businessName || "This business"} can capture your request here and follow up with the right next step. If you want an appointment, quote or consultation, please share your name, phone and preferred time.`;

  const getClientHeroText = (clientConfig) => {
    const business = clientConfig.businessName || "This business";
    const industry = clientConfig.industry || "local business";
    return {
      title: `${business} AI Assistant`,
      copy: `Ask about services, working hours, bookings or common questions. This AI page is configured for ${industry} and can capture customer requests 24/7.`
    };
  };

  function getInteractiveDemoData(lang) {
    if (lang === "el") {
      return {
        industries: [
          {
            id: "clinic",
            icon: "stethoscope",
            label: "Ιατρείο / Γιατρός",
            shortDescription: "Συλλογή αιτημάτων ραντεβού, απαντήσεις σε FAQs και δρομολόγηση επειγόντων.",
            greeting:
              "Γεια σας, είμαι ο AI assistant για {business}. Μπορώ να απαντώ σε συχνές ερωτήσεις, να συλλέγω αιτήματα ραντεβού και να ειδοποιώ την ομάδα άμεσα.",
            customer: "Θέλω να κλείσω ένα ραντεβού για αύριο.",
            ai: "Βεβαίως. Ποια ώρα σας βολεύει και ποιο είναι το όνομα και το τηλέφωνό σας;",
            system: "Αίτημα ραντεβού συλλέχθηκε · Η ομάδα ειδοποιήθηκε",
            outcomes: ["Πιο γρήγορες απαντήσεις", "Λιγότερα χαμένα αιτήματα", "Περισσότερα αιτήματα ραντεβού", "Λιγότερη χειροκίνητη δουλειά"]
          },
          {
            id: "dental",
            icon: "badge-plus",
            label: "Οδοντιατρείο",
            shortDescription: "Αιτήματα για ραντεβού, συχνές ερωτήσεις και υπενθυμίσεις ασθενών.",
            greeting:
              "Γεια σας, είμαι ο AI assistant για {business}. Μπορώ να συλλέγω αιτήματα για ραντεβού, να απαντώ σε βασικές ερωτήσεις και να δρομολογώ επείγοντα περιστατικά στην ομάδα.",
            customer: "Έχω πόνο στο δόντι και θέλω διαθέσιμο ραντεβού.",
            ai: "Μπορώ να συλλέξω τα στοιχεία σας και την προτιμώμενη ώρα, ώστε να ειδοποιηθεί άμεσα το οδοντιατρείο.",
            system: "Επείγον αίτημα δρομολογήθηκε · Στοιχεία ζητήθηκαν",
            outcomes: ["Ταχύτερη ανταπόκριση", "Καλύτερη οργάνωση ραντεβού", "Λιγότερες χαμένες κλήσεις", "Υπενθυμίσεις follow-up"]
          },
          {
            id: "restaurant",
            icon: "utensils",
            label: "Εστιατόριο",
            shortDescription: "Ερωτήσεις κρατήσεων, ώρες λειτουργίας, menu FAQs και follow-ups.",
            greeting:
              "Γεια σας, μπορώ να βοηθήσω τους πελάτες να ρωτήσουν για διαθεσιμότητα, κρατήσεις, ώρες λειτουργίας και να στείλω τα στοιχεία στην ομάδα.",
            customer: "Έχετε τραπέζι για 4 άτομα απόψε;",
            ai: "Μπορώ να βοηθήσω. Τι ώρα θα θέλατε να έρθετε και σε ποιο όνομα να καταχωρήσω το αίτημα;",
            system: "Αίτημα κράτησης συλλέχθηκε · Η ομάδα ειδοποιήθηκε",
            outcomes: ["Πιο γρήγορες απαντήσεις", "Περισσότερα αιτήματα κρατήσεων", "Λιγότερα χαμένα μηνύματα", "Καλύτερη εμπειρία πελάτη"]
          },
          {
            id: "hotel",
            icon: "hotel",
            label: "Ξενοδοχείο / Φιλοξενία",
            shortDescription: "Απαντήσεις σε επισκέπτες, ενδιαφέρον κρατήσεων και αυτοματοποιημένα follow-ups.",
            greeting:
              "Γεια σας, μπορώ να απαντώ σε ερωτήσεις επισκεπτών, να συλλέγω ενδιαφέρον για κράτηση και να δρομολογώ αιτήματα στην ομάδα.",
            customer: "Έχετε διαθέσιμο δωμάτιο για το Σαββατοκύριακο;",
            ai: "Μπορώ να συλλέξω ημερομηνίες, αριθμό ατόμων και στοιχεία επικοινωνίας ώστε να σας απαντήσει η ομάδα.",
            system: "Ενδιαφέρον κράτησης συλλέχθηκε · Follow-up έτοιμο",
            outcomes: ["Καλύτερη ταχύτητα απάντησης", "Περισσότερα οργανωμένα αιτήματα", "Λιγότερη χειροκίνητη δουλειά", "Υποστήριξη 24/7"]
          },
          {
            id: "law",
            icon: "scale",
            label: "Δικηγορικό Γραφείο",
            shortDescription: "Αξιολόγηση αιτημάτων, συλλογή στοιχείων και δρομολόγηση υποθέσεων.",
            greeting:
              "Γεια σας, μπορώ να συλλέξω βασικά στοιχεία για νέο αίτημα και να το δρομολογήσω στο κατάλληλο άτομο χωρίς να παρέχω νομική συμβουλή.",
            customer: "Χρειάζομαι βοήθεια με ένα συμβόλαιο.",
            ai: "Μπορώ να συλλέξω λίγες πληροφορίες και να το δρομολογήσω σωστά. Αφορά εργασία, επιχείρηση, ακίνητο ή οικογενειακό θέμα;",
            system: "Αίτημα αξιολογήθηκε · Ζητήθηκαν στοιχεία επικοινωνίας",
            outcomes: ["Καλύτερη ταξινόμηση αιτημάτων", "Λιγότερα χαμένα leads", "Πιο γρήγορη ανθρώπινη συνέχεια", "Οργανωμένη πρώτη επαφή"]
          },
          {
            id: "realEstate",
            icon: "home",
            label: "Μεσιτικό Γραφείο",
            shortDescription: "Leads αγοραστών/ενοικιαστών, property FAQs και ειδοποίηση agents.",
            greeting:
              "Γεια σας, μπορώ να βοηθήσω αγοραστές και ενοικιαστές να ρωτήσουν για ακίνητα, να συλλέξω στοιχεία και να ειδοποιήσω την ομάδα.",
            customer: "Ενδιαφέρομαι για το διαμέρισμα στο κέντρο.",
            ai: "Τέλεια. Θέλετε αγορά ή ενοικίαση, ποιο budget έχετε και ποιο τηλέφωνο να δώσω στον agent;",
            system: "Lead ακινήτου συλλέχθηκε · Agent ειδοποιήθηκε",
            outcomes: ["Περισσότερα οργανωμένα leads", "Γρηγορότερη ανταπόκριση", "Λιγότερα χαμένα μηνύματα", "Καλύτερο follow-up"]
          },
          {
            id: "localService",
            icon: "wrench",
            label: "Τοπική Επιχείρηση Υπηρεσιών",
            shortDescription: "Άμεσες απαντήσεις, αιτήματα εργασιών και λιγότερα χαμένα leads.",
            greeting:
              "Γεια σας, μπορώ να απαντώ σε αιτήματα πελατών, να συλλέγω λεπτομέρειες εργασίας και να ειδοποιώ την ομάδα πριν χαθεί το lead.",
            customer: "Χρειάζομαι προσφορά για επισκευή μέσα στην εβδομάδα.",
            ai: "Μπορώ να συλλέξω την περιοχή, το είδος εργασίας και τα στοιχεία σας ώστε να επικοινωνήσει η ομάδα.",
            system: "Αίτημα εργασίας συλλέχθηκε · Η ομάδα ειδοποιήθηκε",
            outcomes: ["Λιγότερα χαμένα leads", "Πιο καθαρά αιτήματα", "Ταχύτερη ανταπόκριση", "Λιγότερη διαχείριση"]
          },
          {
            id: "agency",
            icon: "briefcase",
            label: "Agency / Σύμβουλος",
            shortDescription: "Αξιολόγηση prospects, εξήγηση υπηρεσιών και αιτήματα discovery call.",
            greeting:
              "Γεια σας, μπορώ να εξηγήσω υπηρεσίες, να αξιολογήσω prospects και να συλλέξω αιτήματα για discovery call.",
            customer: "Θέλω να μάθω αν μπορείτε να βοηθήσετε την επιχείρησή μου.",
            ai: "Μπορώ να συλλέξω τον κλάδο, τον στόχο σας και στοιχεία επικοινωνίας ώστε να οργανωθεί το επόμενο βήμα.",
            system: "Prospect αξιολογήθηκε · Αίτημα call συλλέχθηκε",
            outcomes: ["Καλύτερα qualified leads", "Πιο γρήγορα discovery calls", "Λιγότερα επαναλαμβανόμενα μηνύματα", "Οργανωμένο onboarding"]
          }
        ],
        moduleLabels: { what: "Τι συμβαίνει", ai: "Τι κάνει το AI", gets: "Τι κερδίζει η επιχείρηση" },
        modules: [
          ["chatAgents", "message-square-text", "AI Chat Agents", "Άμεσες απαντήσεις στην ιστοσελίδα που συλλέγουν leads 24/7.", "Ο επισκέπτης ρωτά κάτι στην ιστοσελίδα.", "Απαντά άμεσα και συλλέγει στοιχεία επικοινωνίας.", "Qualified lead χωρίς χειροκίνητη απάντηση.", "AI Reply Sent", "Πιο γρήγορες απαντήσεις"],
          ["voiceAssistants", "phone-call", "AI Voice Assistants", "Διαχείριση χαμένων κλήσεων και συλλογή στοιχείων καλούντος.", "Ο πελάτης καλεί εκτός ωραρίου ή δεν απαντά κανείς.", "Συλλέγει λόγο κλήσης και στοιχεία επικοινωνίας.", "Καμία χαμένη ευκαιρία.", "Missed Call Handled", "Λιγότερες χαμένες κλήσεις"],
          ["websiteCreation", "monitor-cog", "Website Creation", "Ιστοσελίδες σχεδιασμένες για να μετατρέπουν επισκέπτες σε leads.", "Ο επισκέπτης μπαίνει στην ιστοσελίδα.", "Τον οδηγεί σε καθαρό CTA και συνομιλία.", "Περισσότεροι επισκέπτες γίνονται leads.", "Website Visitor Converted", "Καλύτερο conversion"],
          ["leadCapture", "radar", "Automated Lead Capture", "Κάθε αίτημα αποθηκεύεται, οργανώνεται και στέλνεται στον ιδιοκτήτη.", "Υποβάλλεται νέο αίτημα.", "Δομεί τα στοιχεία και τα στέλνει σωστά.", "Οργανωμένο lead με πλήρες context.", "Lead Captured", "Λιγότερα χαμένα leads"],
          ["reviewSystem", "star", "Google Review System", "Αυτόματα αιτήματα κριτικών μετά από επίσκεψη, κράτηση ή υπηρεσία.", "Ο πελάτης ολοκληρώνει επίσκεψη ή υπηρεσία.", "Στέλνει ευγενικό αίτημα κριτικής.", "Περισσότερες κριτικές με την πάροδο του χρόνου.", "Review Request Sent", "Καλύτερες κριτικές"],
          ["supportAutomation", "headphones", "Customer Support Automation", "FAQ απαντήσεις, δρομολόγηση και ροές εξυπηρέτησης.", "Ο πελάτης κάνει συχνή ερώτηση.", "Απαντά ή δρομολογεί επείγον θέμα.", "Λιγότερη επαναλαμβανόμενη υποστήριξη.", "Support Request Routed", "Λιγότερη χειροκίνητη υποστήριξη"],
          ["appointmentBooking", "calendar-check", "Appointment Booking", "Συλλογή αιτημάτων ραντεβού και άμεση ειδοποίηση ομάδας.", "Ο πελάτης ζητά διαθέσιμη ώρα.", "Συλλέγει ημερομηνία, ώρα, όνομα και τηλέφωνο.", "Δομημένο αίτημα ραντεβού στην ομάδα.", "Booking Request Captured", "Περισσότερα αιτήματα ραντεβού"],
          ["followUp", "repeat-2", "Follow-Up Automation", "Υπενθυμίσεις, callbacks και next-step μηνύματα αυτόματα.", "Το lead έχει συλλεχθεί.", "Προγραμματίζει υπενθύμιση και επόμενο μήνυμα.", "Κανένα lead δεν μένει χωρίς συνέχεια.", "Follow-Up Ready", "Καλύτερο follow-up"]
        ]
      };
    }

    return {
      industries: [
        {
          id: "clinic",
          icon: "stethoscope",
          label: "Clinic / Doctor",
          shortDescription: "Capture appointment requests, answer FAQs and route urgent inquiries.",
          greeting:
            "Hi, I’m the AI assistant for {business}. I can answer common patient questions, capture appointment requests and notify the team instantly.",
          customer: "I want to book an appointment for tomorrow.",
          ai: "Sure. What time works best for you, and can I have your name and phone number?",
          system: "Appointment request captured · Owner notified",
          outcomes: ["Faster Replies", "Fewer Missed Leads", "More Booking Requests", "Less Manual Admin"]
        },
        {
          id: "dental",
          icon: "badge-plus",
          label: "Dental Clinic",
          shortDescription: "Handle appointment requests, patient FAQs and urgent inquiry routing.",
          greeting:
            "Hi, I’m the AI assistant for {business}. I can capture appointment requests, answer basic patient questions and route urgent issues to the team.",
          customer: "I have tooth pain and need an available appointment.",
          ai: "I can collect your details and preferred time so the dental team can follow up quickly.",
          system: "Urgent request routed · Contact details requested",
          outcomes: ["Faster Replies", "More Booking Requests", "Fewer Missed Calls", "Follow-Up Ready"]
        },
        {
          id: "restaurant",
          icon: "utensils",
          label: "Restaurant",
          shortDescription: "Handle reservation questions, opening hours, menu FAQs and follow-ups.",
          greeting:
            "Hi, I can help guests ask about availability, request reservations, check opening hours and send their details to the restaurant team.",
          customer: "Do you have a table for 4 tonight?",
          ai: "I can help with that. What time would you like to come, and what name should I put the request under?",
          system: "Reservation request captured · Team notified",
          outcomes: ["Faster Replies", "More Booking Requests", "Fewer Missed Messages", "Better Customer Experience"]
        },
        {
          id: "hotel",
          icon: "hotel",
          label: "Hotel / Hospitality",
          shortDescription: "Answer guest questions, capture booking interest and automate follow-ups.",
          greeting:
            "Hi, I can answer guest questions, capture booking interest and route requests to your team.",
          customer: "Do you have a room available this weekend?",
          ai: "I can collect your dates, number of guests and contact details so the team can follow up.",
          system: "Booking interest captured · Follow-up ready",
          outcomes: ["Faster Replies", "More Structured Requests", "Less Manual Admin", "24/7 Customer Support"]
        },
        {
          id: "law",
          icon: "scale",
          label: "Law Firm",
          shortDescription: "Qualify client inquiries, collect contact details and route cases.",
          greeting:
            "Hi, I can qualify new client inquiries, collect contact details and route urgent legal requests to the office. I do not provide legal advice.",
          customer: "I need help with a contract issue.",
          ai: "I can collect a few details and route this to the right person. Is this about employment, business, property or family law?",
          system: "Inquiry qualified · Contact details requested",
          outcomes: ["Fewer Missed Leads", "Better Inquiry Routing", "Faster Human Follow-Up", "More Organized Intake"]
        },
        {
          id: "realEstate",
          icon: "home",
          label: "Real Estate Office",
          shortDescription: "Capture buyer/renter leads, answer property FAQs and notify agents.",
          greeting:
            "Hi, I can help buyers and renters ask about properties, collect their contact details and notify your real estate team.",
          customer: "I'm interested in the apartment downtown.",
          ai: "Great. Are you looking to buy or rent, what is your budget, and what phone number should the agent use?",
          system: "Property lead captured · Agent notified",
          outcomes: ["More Structured Leads", "Faster Replies", "Fewer Missed Messages", "Better Follow-Up"]
        },
        {
          id: "localService",
          icon: "wrench",
          label: "Local Service Business",
          shortDescription: "Respond instantly, collect job requests and reduce missed leads.",
          greeting:
            "Hi, I can respond to customer inquiries, collect job details and notify your team before the lead goes cold.",
          customer: "I need a quote for a repair this week.",
          ai: "I can collect your location, job details and contact information so the team can respond with the next step.",
          system: "Job request captured · Team notified",
          outcomes: ["Fewer Missed Leads", "Clearer Job Requests", "Faster Replies", "Less Manual Admin"]
        },
        {
          id: "agency",
          icon: "briefcase",
          label: "Agency / Consultant",
          shortDescription: "Qualify prospects, explain services and capture discovery call requests.",
          greeting:
            "Hi, I can explain your services, qualify prospects and capture discovery call requests.",
          customer: "I want to know if you can help my business.",
          ai: "I can collect your industry, goal and contact details so the team can recommend the right next step.",
          system: "Prospect qualified · Discovery call request captured",
          outcomes: ["Better Qualified Leads", "Faster Discovery Calls", "Less Repetitive Messaging", "Cleaner Onboarding"]
        }
      ],
      moduleLabels: { what: "What happens", ai: "What the AI does", gets: "What the business gets" },
      modules: [
        ["chatAgents", "message-square-text", "AI Chat Agents", "Instant website replies that answer questions and capture leads 24/7.", "Visitor asks a question on your website.", "Answers instantly and collects contact details.", "A qualified lead without manual reply.", "AI Reply Sent", "Faster Replies"],
        ["voiceAssistants", "phone-call", "AI Voice Assistants", "Handle missed calls, collect caller details and route requests.", "Customer calls outside working hours or no one answers.", "Collects the reason for the call and contact details.", "No missed opportunity.", "Missed Call Handled", "Fewer Missed Calls"],
        ["websiteCreation", "monitor-cog", "Website Creation", "Conversion-focused websites designed to turn visitors into leads.", "Visitor lands on your website.", "Guides them to a clear CTA and conversation.", "More visitors become leads.", "Website Visitor Converted", "Better Conversion"],
        ["leadCapture", "radar", "Automated Lead Capture", "Every inquiry is saved, structured and sent to the business owner.", "Inquiry is submitted.", "Structures the data and sends it to the right place.", "A clean lead with full context.", "Lead Captured", "Fewer Missed Leads"],
        ["reviewSystem", "star", "Google Review System", "Automated review requests after visits, bookings or completed services.", "Customer finishes a visit or service.", "Sends a polite review request.", "More Google reviews over time.", "Review Request Sent", "Better Reviews"],
        ["supportAutomation", "headphones", "Customer Support Automation", "FAQ answers, request routing and customer service workflows.", "Customer asks an FAQ.", "Answers or routes urgent issues to your team.", "Less repetitive support work.", "Support Request Routed", "Less Manual Support"],
        ["appointmentBooking", "calendar-check", "Appointment Booking", "Capture booking requests and notify the team instantly.", "Customer requests a time slot.", "Collects preferred date, time, name and phone.", "Structured booking request sent to the team.", "Booking Request Captured", "More Booking Requests"],
        ["followUp", "repeat-2", "Follow-Up Automation", "Send reminders, callbacks and next-step messages automatically.", "Lead has been captured.", "Schedules a reminder and sends the next-step message.", "No lead is left without follow-up.", "Follow-Up Ready", "Better Follow-Up"]
      ]
    };
  }

  function Hero({ lang }) {
    const c = content[lang];
    const heroRef = useRef(null);
    const shouldReduceMotion = useReducedMotion();
    const { scrollYProgress } = useScroll({
      target: heroRef,
      offset: ["start start", "end start"]
    });
    const logoScale = useTransform(scrollYProgress, [0, 1], [1.08, 0.82]);
    const logoY = useTransform(scrollYProgress, [0, 1], [0, -42]);
    const logoRotateX = useTransform(scrollYProgress, [0, 1], [0, 5]);
    const logoRotateY = useTransform(scrollYProgress, [0, 1], [0, -7]);
    const logoZ = useTransform(scrollYProgress, [0, 1], [70, 12]);
    const copyY = useTransform(scrollYProgress, [0, 1], [0, -18]);
    const panelY = useTransform(scrollYProgress, [0, 1], [0, 34]);
    const panelRotateY = useTransform(scrollYProgress, [0, 1], [0, -4]);
    const statusY = useTransform(scrollYProgress, [0, 1], [0, -10]);
    const labelY = useTransform(scrollYProgress, [0, 1], [0, 26]);
    const ambientY = useTransform(scrollYProgress, [0, 1], [0, 78]);
    const ambientOpacity = useTransform(scrollYProgress, [0, 0.58, 1], [0.74, 0.5, 0.18]);
    const scrollLabels =
      c.scrollSystemLabels ||
      (lang === "el"
        ? ["AI ΕΝΕΡΓΟ", "ΣΥΛΛΟΓΗ LEADS ΕΝΕΡΓΗ", "ΑΥΤΟΜΑΤΙΣΜΟΣ ΕΝΕΡΓΟΣ", "ΑΠΟΚΡΙΣΗ < 5δ"]
        : ["AI ONLINE", "LEAD CAPTURE ACTIVE", "AUTOMATION RUNNING", "RESPONSE TIME < 5s"]);

    const logoMotion = shouldReduceMotion
      ? { scale: 1, y: 0, rotateX: 0, rotateY: 0, z: 0, transformPerspective: 1200 }
      : { scale: logoScale, y: logoY, rotateX: logoRotateX, rotateY: logoRotateY, z: logoZ, transformPerspective: 1200 };
    const panelMotion = shouldReduceMotion ? {} : { y: panelY, rotateY: panelRotateY, transformPerspective: 1000 };
    const copyMotion = shouldReduceMotion ? {} : { y: copyY };
    const statusMotion = shouldReduceMotion ? {} : { y: statusY };

    return h(
      "section",
      { className: "hero cinematic-hero", id: "top", ref: heroRef },
      h("div", { className: "hero-static-aurora-field", "aria-hidden": "true" }),
      h("div", { className: "hero-fluid-scrim", "aria-hidden": "true" }),
      h(motion.div, {
        className: "hero-scroll-aurora",
        style: shouldReduceMotion ? { opacity: 0.28 } : { y: ambientY, z: -80, transformPerspective: 1200, opacity: ambientOpacity },
        "aria-hidden": "true"
      }),
      h("div", { className: "scroll-progress-rail", "aria-hidden": "true" }, h(motion.span, { style: { scaleX: shouldReduceMotion ? 1 : scrollYProgress } })),
      h(
        motion.div,
        {
          className: "hero-inner conversion-hero",
          initial: { opacity: 0, y: 30 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.75, delay: 0.55, ease: smoothEase }
        },
        h(LogoStage, { style: logoMotion }),
        h(LiveAutomationPanel, { lang, style: panelMotion }),
        h(
          motion.div,
          { className: "scroll-system-labels", style: shouldReduceMotion ? {} : { y: labelY }, "aria-hidden": "true" },
          scrollLabels.map((label, index) => h("span", { className: `system-float-label label-${index + 1}`, key: label }, label))
        ),
        h(
          motion.div,
          { className: "hero-copy-layer", style: copyMotion },
          h(
            motion.div,
            {
              className: "hero-kicker",
              initial: { opacity: 0, y: 16 },
              animate: { opacity: 1, y: 0 },
              transition: { duration: 0.7, delay: 0.32, ease: smoothEase }
            },
            c.heroKicker
          ),
          h(WordReveal, { as: "h1", text: c.heroTitle, baseDelay: 480, stagger: 72, duration: 720, y: 26 }),
          h(WordReveal, { as: "p", text: c.heroCopy, className: "hero-subline", baseDelay: 930, stagger: 18, duration: 620, y: 14 }),
          h(HeroDemoStartBar, { lang }),
          h(
            "div",
            { className: "hero-actions" },
            h(
              motion.a,
              { className: "btn btn-primary", href: "#contact", whileTap: { scale: 0.98 } },
              c.primaryCta,
              h(Icon, { name: "calendar-check" })
            ),
            h(
              motion.a,
              { className: "btn btn-ghost", href: "#how", whileTap: { scale: 0.98 } },
              c.secondaryCta,
              h(Icon, { name: "arrow-down" })
            )
          ),
          h(
            "div",
            { className: "outcome-badges", "aria-label": "Business outcomes" },
            c.trustBadges.map((badge) =>
              h("div", { className: "outcome-badge", key: badge }, h(Icon, { name: "check-circle-2" }), h("span", null, badge))
            )
          )
        ),
        h(HeroSystemStatus, { lang, style: statusMotion }),
        h(
          motion.div,
          {
            className: "hero-metrics",
            initial: { opacity: 0, y: 16 },
            animate: { opacity: 1, y: 0 },
            style: statusMotion,
            transition: { duration: 0.65, delay: 0.85, ease: smoothEase }
          },
          c.heroMetrics.map(([value, label]) =>
            h("div", { className: "metric", key: label }, h("strong", null, value), h("span", null, label))
          )
        )
      )
    );
  }

  function Services({ lang }) {
    const c = content[lang];

    return h(
      "section",
      { className: "section compact-section", id: "services" },
      h(
        "div",
        { className: "section-inner" },
        h(SectionIntro, { eyebrow: c.servicesEyebrow, title: c.servicesTitle, copy: c.servicesCopy }),
        h(
          "div",
          { className: "services-grid" },
          c.services.map((service, index) =>
            h(
              motion.article,
              {
                className: "glass-card service-3d-card",
                key: service.title,
                initial: { opacity: 0, y: 38, rotateX: 8, rotateY: index % 2 === 0 ? -4 : 4, scale: 0.965 },
                whileInView: { opacity: 1, y: 0, rotateX: 0, rotateY: 0, scale: 1 },
                viewport: { once: true, amount: 0.24 },
                transition: { duration: 0.76, delay: index * 0.055, ease: smoothEase },
                whileHover: { y: -8, rotateX: 3, rotateY: index % 2 === 0 ? 2.5 : -2.5, scale: 1.015 },
                style: { transformPerspective: 1100 }
              },
              h(
                "div",
                { className: "card-content" },
                h("div", { className: "icon-shell" }, h(Icon, { name: service.icon })),
                h(
                  "div",
                  null,
                  h("div", { className: "card-index" }, String(index + 1).padStart(2, "0")),
                  h("h3", null, service.title),
                  h("p", null, service.copy)
                )
              )
            )
          )
        )
      )
    );
  }

  function InteractiveAIDemo({ lang }) {
    const c = content[lang].interactiveDemo;
    const shouldReduceMotion = useReducedMotion();
    const data = useMemo(() => {
      const demoData = getInteractiveDemoData(lang);
      return {
        ...demoData,
        modules: demoData.modules.map(([id, icon, label, shortDescription, whatHappens, aiDoes, businessGets, flowStep, outcome]) => ({
          id,
          icon,
          label,
          shortDescription,
          whatHappens,
          aiDoes,
          businessGets,
          flowStep,
          outcome
        }))
      };
    }, [lang]);
    const [selectedIndustryId, setSelectedIndustryId] = useState("clinic");
    const [businessName, setBusinessName] = useState("");
    const [selectedModuleIds, setSelectedModuleIds] = useState(["chatAgents", "appointmentBooking", "leadCapture"]);

    const selectedIndustry = data.industries.find((industry) => industry.id === selectedIndustryId) || data.industries[0];
    const moduleById = Object.fromEntries(data.modules.map((module) => [module.id, module]));
    const selectedModules = selectedModuleIds.map((id) => moduleById[id]).filter(Boolean);
    const hasSelectedModules = selectedModules.length > 0;
    const displayBusiness = businessName.trim() || c.emptyBusiness;
    const moduleNames = hasSelectedModules ? selectedModules.map((module) => module.label).join(", ") : c.noModulesSelected;
    const flowSteps = hasSelectedModules
      ? Array.from(new Set([c.baseFlow[0], ...selectedModules.map((module) => module.flowStep), c.baseFlow[4], c.baseFlow[5]])).slice(0, 8)
      : c.baseFlow.slice(0, 4);
    const outcomes = hasSelectedModules
      ? Array.from(new Set([...selectedModules.map((module) => module.outcome), ...selectedIndustry.outcomes])).slice(0, 4)
      : selectedIndustry.outcomes.slice(0, 4);
    const statusMap =
      lang === "el"
        ? {
            voiceAssistants: "VOICE AI ΕΝΕΡΓΟ",
            websiteCreation: "WEBSITE FLOW ΕΝΕΡΓΟ",
            reviewSystem: "ΚΡΙΤΙΚΕΣ ΕΤΟΙΜΕΣ",
            appointmentBooking: "BOOKING FLOW ΕΝΕΡΓΟ"
          }
        : {
            voiceAssistants: "VOICE AI ACTIVE",
            websiteCreation: "WEBSITE FLOW ACTIVE",
            reviewSystem: "REVIEW SYSTEM READY",
            appointmentBooking: "BOOKING FLOW ACTIVE"
          };
    const liveStatuses = Array.from(new Set([...c.statusItems, ...selectedModuleIds.map((id) => statusMap[id]).filter(Boolean)])).slice(0, 6);

    useEffect(() => {
      const applyHeroDemoStart = (event) => {
        const payload = event.detail || readJsonStorage("nous-hero-demo-start", {});
        if (payload.businessName) setBusinessName(payload.businessName);
        if (Array.isArray(payload.moduleIds) && payload.moduleIds.length) {
          setSelectedModuleIds(payload.moduleIds);
        }
      };
      window.addEventListener("nous:hero-demo-start", applyHeroDemoStart);
      return () => window.removeEventListener("nous:hero-demo-start", applyHeroDemoStart);
    }, []);

    const toggleModule = (moduleId) => {
      setSelectedModuleIds((current) => {
        if (current.includes(moduleId)) {
          return current.filter((id) => id !== moduleId);
        }
        return [...current, moduleId];
      });
    };

    const buildSelectionPayload = () => ({
      businessName: businessName.trim(),
      industry: selectedIndustry.label,
      modules: selectedModules.map((module) => module.label),
      moduleIds: selectedModuleIds,
      recommendedPlanId: getRecommendedPlanId(selectedModuleIds),
      automationGoal: formatText(c.contactSummary, { industry: selectedIndustry.label, modules: moduleNames })
    });

    useEffect(() => {
      const payload = { ...buildSelectionPayload(), updatedAt: new Date().toISOString() };
      saveJsonStorage("nous-subscription-selection", payload);
      window.dispatchEvent(new CustomEvent("nous:subscription-selection", { detail: payload }));
    }, [businessName, selectedIndustryId, selectedModuleIds, lang]);

    const buildForBusiness = () => {
      const payload = buildSelectionPayload();
      saveJsonStorage("nous-demo-selection", payload);
      saveJsonStorage("nous-subscription-selection", { ...payload, updatedAt: new Date().toISOString() });
      window.dispatchEvent(new CustomEvent("nous:demo-selection", { detail: payload }));
      window.dispatchEvent(new CustomEvent("nous:subscription-selection", { detail: payload }));
      motionRuntime.scrollTo("#pricing");
    };

    const talkToAssistant = () => {
      const prompt = formatText(c.chatPrompt, { industry: selectedIndustry.label });
      window.dispatchEvent(new CustomEvent("nous:open-chat", { detail: { prompt } }));
    };

    return h(
      "section",
      { className: "section interactive-demo-section", id: "ai-demo" },
      h(
        "div",
        { className: "section-inner" },
        h(SectionIntro, { eyebrow: c.eyebrow, title: c.title, copy: c.copy }),
        h(
          "div",
          { className: "interactive-demo-layout" },
          h(
            motion.div,
            { className: "demo-control-panel", ...reveal(0.05) },
            h(
              "div",
              { className: "demo-control-block" },
              h("div", { className: "demo-control-label" }, c.businessTypeLabel),
              h(
                "div",
                { className: "business-type-grid" },
                data.industries.map((industry, index) =>
                  h(
                    motion.button,
                    {
                      className: `business-type-card${industry.id === selectedIndustryId ? " active" : ""}`,
                      key: industry.id,
                      type: "button",
                      onClick: () => setSelectedIndustryId(industry.id),
                      "aria-pressed": industry.id === selectedIndustryId,
                      whileHover: shouldReduceMotion ? undefined : { y: -4 },
                      whileTap: { scale: 0.98 },
                      transition: { duration: 0.2, delay: index * 0.01 }
                    },
                    h("span", { className: "business-type-icon" }, h(Icon, { name: industry.icon })),
                    h("strong", null, industry.label),
                    h("small", null, industry.shortDescription)
                  )
                )
              )
            ),
            h(
              "div",
              { className: "demo-control-block" },
              h("label", { className: "demo-control-label", htmlFor: "interactive-business-name" }, c.businessNameLabel),
              h("input", {
                className: "input-field demo-business-input",
                id: "interactive-business-name",
                type: "text",
                value: businessName,
                onChange: (event) => setBusinessName(event.target.value),
                placeholder: c.businessNamePlaceholder,
                autoComplete: "organization"
              })
            ),
            h(
              "div",
              { className: "demo-control-block" },
              h(
                "div",
                { className: "demo-module-header" },
                h("div", { className: "demo-control-label" }, c.modulesLabel),
                h("span", null, formatText(c.selectedModulesLabel, { count: String(selectedModules.length) }))
              ),
              h(
                "div",
                { className: "module-selector-grid" },
                data.modules.map((module) => {
                  const isSelected = selectedModuleIds.includes(module.id);
                  return h(
                    motion.button,
                    {
                      className: `module-select-card${isSelected ? " active" : ""}`,
                      key: module.id,
                      type: "button",
                      onClick: () => toggleModule(module.id),
                      "aria-pressed": isSelected,
                      whileHover: shouldReduceMotion ? undefined : { y: -3 },
                      whileTap: { scale: 0.98 }
                    },
                    h("span", { className: "module-select-icon" }, h(Icon, { name: module.icon })),
                    h("span", null, h("strong", null, module.label), h("small", null, module.shortDescription)),
                    h("span", { className: "module-check", "aria-hidden": "true" })
                  );
                })
              )
            )
          ),
          h(
            motion.div,
            { className: "demo-preview-panel", ...reveal(0.1) },
            h("div", { className: "demo-preview-glow", "aria-hidden": "true" }),
            h(
              "div",
              { className: "demo-preview-statusbar" },
              h("span", null, c.previewLabel),
              h("strong", null, c.liveSimulation)
            ),
            h(
              "div",
              { className: "demo-preview-header" },
              h(
                "div",
                null,
                h("span", { className: "demo-preview-kicker" }, c.previewStatus),
                h("h3", null, formatText(c.previewTitle, { business: displayBusiness })),
                h("p", null, formatText(c.previewSubtitle, { industry: selectedIndustry.label }))
              ),
              h("div", { className: "demo-preview-orb", "aria-hidden": "true" }, h("span", null))
            ),
            h(
              AnimatePresence,
              { mode: "wait" },
              h(
                motion.div,
                {
                  className: "assistant-simulation",
                  key: `${selectedIndustry.id}-${displayBusiness}`,
                  initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 },
                  animate: { opacity: 1, y: 0 },
                  exit: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 },
                  transition: { duration: 0.24 }
                },
                h("div", { className: "assistant-message-preview" }, h("span", null, "AI"), h("p", null, formatText(selectedIndustry.greeting, { business: displayBusiness }))),
                h(
                  "div",
                  { className: "conversation-preview" },
                  h("div", { className: "conversation-row customer" }, h("strong", null, c.customerLabel), h("p", null, selectedIndustry.customer)),
                  h("div", { className: "conversation-row ai" }, h("strong", null, c.aiLabel), h("p", null, selectedIndustry.ai)),
                  h("div", { className: "conversation-row system" }, h("strong", null, c.systemLabel), h("p", null, selectedIndustry.system))
                )
              )
            ),
            h(
              "div",
              { className: "live-status-strip" },
              liveStatuses.map((status) => h("span", { key: status }, h("i", null), status))
            ),
            h(
              "div",
              { className: "automation-flow-card" },
              h("div", { className: "demo-subhead" }, c.flowLabel),
              h(
                "div",
                { className: "automation-flow" },
                flowSteps.map((step, index) =>
                  h(
                    motion.div,
                    {
                      className: "flow-node",
                      key: `${step}-${index}`,
                      initial: shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 },
                      whileInView: { opacity: 1, y: 0 },
                      viewport: { once: true, amount: 0.4 },
                      transition: { duration: 0.35, delay: index * 0.05 }
                    },
                    h("span", null, String(index + 1).padStart(2, "0")),
                    h("p", null, step)
                  )
                )
              )
            ),
            h(
              "div",
              { className: "module-breakdown" },
              h("div", { className: "demo-subhead" }, c.moduleBreakdownLabel),
              hasSelectedModules
                ? h(
                    "div",
                    { className: "module-breakdown-grid" },
                    selectedModules.map((module) =>
                      h(
                        "article",
                        { className: "module-breakdown-card", key: module.id },
                        h("h4", null, h(Icon, { name: module.icon }), module.label),
                        h("p", null, h("strong", null, data.moduleLabels.what), module.whatHappens),
                        h("p", null, h("strong", null, data.moduleLabels.ai), module.aiDoes),
                        h("p", null, h("strong", null, data.moduleLabels.gets), module.businessGets)
                      )
                    )
                  )
                : h(
                    "div",
                    { className: "module-empty-state" },
                    h("strong", null, c.noModulesSelected),
                    h("p", null, c.noModulesHint)
                  )
            ),
            h(
              "div",
              { className: "outcome-preview-grid" },
              h("div", { className: "demo-subhead" }, c.resultLabel),
              outcomes.map((outcome) => h("div", { className: "outcome-preview-card", key: outcome }, h(Icon, { name: "check-circle-2" }), h("span", null, outcome)))
            ),
            h(
              "div",
              { className: "interactive-demo-actions" },
              h(motion.button, { className: "btn btn-primary", type: "button", onClick: buildForBusiness, whileTap: { scale: 0.98 } }, c.primaryCta, h(Icon, { name: "arrow-down-right" })),
              h(motion.button, { className: "btn btn-ghost", type: "button", onClick: talkToAssistant, whileTap: { scale: 0.98 } }, c.secondaryCta, h(Icon, { name: "message-circle" }))
            )
          )
        )
      )
    );
  }

  function PricingSection({ lang }) {
    const c = content[lang].pricing;
    const shouldReduceMotion = useReducedMotion();
    const [selection, setSelection] = useState(() =>
      normalizePlanSelection(readJsonStorage("nous-subscription-selection", readJsonStorage("nous-demo-selection", {})))
    );
    const [checkoutSelection, setCheckoutSelection] = useState(null);

    useEffect(() => {
      const handleSelection = (event) => setSelection(normalizePlanSelection(event.detail || {}));
      window.addEventListener("nous:subscription-selection", handleSelection);
      window.addEventListener("nous:demo-selection", handleSelection);
      return () => {
        window.removeEventListener("nous:subscription-selection", handleSelection);
        window.removeEventListener("nous:demo-selection", handleSelection);
      };
    }, [lang]);

    const recommendedPlanId = selection.recommendedPlanId || getRecommendedPlanId(selection.moduleIds);
    const recommendedPlan = c.plans.find((plan) => plan.id === recommendedPlanId) || c.plans[0];
    const industryLabel = selection.industry || (lang === "el" ? "την επιχείρησή σου" : "your business");
    const moduleLabels = selection.modules && selection.modules.length ? selection.modules : [];

    const startPlan = (plan) => {
      const planPayload = {
        ...selection,
        selectedPlanId: plan.id,
        selectedPlan: plan.name,
        subscriptionStatus: "Local Mock Pending",
        automationGoal:
          selection.automationGoal ||
          `Interested in AI systems for ${industryLabel} with ${moduleLabels.length ? moduleLabels.join(", ") : "AI automation"}.`,
        updatedAt: new Date().toISOString()
      };

      saveJsonStorage("nous-selected-plan", planPayload);
      saveJsonStorage("nous-subscription-selection", planPayload);
      saveJsonStorage("nous-onboarding-selection", planPayload);
      setCheckoutSelection(planPayload);
      window.dispatchEvent(new CustomEvent("nous:subscription-selection", { detail: planPayload }));
      window.dispatchEvent(new CustomEvent("nous:plan-selected", { detail: planPayload }));
      window.setTimeout(() => motionRuntime.scrollTo("#mock-checkout", { offset: -120 }), 80);
    };

    const activateMockCheckout = () => {
      if (!checkoutSelection) return;
      const activeSelection = {
        ...checkoutSelection,
        subscriptionStatus: "Local Mock Active",
        mockPaymentCompletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      saveJsonStorage("nous-selected-plan", activeSelection);
      saveJsonStorage("nous-subscription-selection", activeSelection);
      saveJsonStorage("nous-onboarding-selection", activeSelection);
      setSelection(normalizePlanSelection(activeSelection));
      setCheckoutSelection(activeSelection);
      window.dispatchEvent(new CustomEvent("nous:plan-selected", { detail: activeSelection }));
      window.dispatchEvent(new CustomEvent("nous:subscription-selection", { detail: activeSelection }));
      window.setTimeout(() => motionRuntime.scrollTo("#onboarding"), 120);
    };

    const openPlaceholderPayment = () => {
      if (!checkoutSelection?.selectedPlanId) return;
      const paymentLink = getPaymentLink(checkoutSelection.selectedPlanId);
      if (paymentLink) {
        window.open(paymentLink, "_blank", "noopener,noreferrer");
      }
    };

    const checkoutCopy =
      lang === "el"
        ? {
            eyebrow: "Local Mock Checkout",
            title: "Δοκιμαστική ενεργοποίηση χωρίς πραγματική πληρωμή",
            copy: "Για το localhost demo, το payment γίνεται mock. Πάτησε επιτυχία πληρωμής για να ανοίξει το onboarding και να δημιουργηθεί η AI business page.",
            paymentSuccess: "Mock Payment Success",
            placeholderPayment: "Άνοιγμα placeholder Stripe link",
            status: "Subscription Status",
            pending: "Local Mock Pending",
            active: "Local Mock Active"
          }
        : {
            eyebrow: "Local Mock Checkout",
            title: "Test activation without a real payment",
            copy: "For the localhost demo, payment is mocked. Confirm payment success to open onboarding and create the AI business page.",
            paymentSuccess: "Mock Payment Success",
            placeholderPayment: "Open placeholder Stripe link",
            status: "Subscription Status",
            pending: "Local Mock Pending",
            active: "Local Mock Active"
          };

    return h(
      "section",
      { className: "section pricing-section", id: "pricing" },
      h(
        "div",
        { className: "section-inner" },
        h(SectionIntro, { eyebrow: c.eyebrow, title: c.title, copy: c.copy, center: true }),
        h(
          motion.div,
          { className: "plan-recommendation-panel", ...reveal(0.06) },
          h("div", { className: "recommendation-orb", "aria-hidden": "true" }, h("span", null)),
          h(
            "div",
            { className: "recommendation-copy" },
            h("span", { className: "demo-preview-kicker" }, c.recommendationTitle),
            h("h3", null, formatText(c.recommendationText, { plan: recommendedPlan.name, industry: industryLabel })),
            moduleLabels.length
              ? h(
                  "div",
                  { className: "recommendation-modules", "aria-label": c.selectedModulesLabel },
                  h("strong", null, c.selectedModulesLabel),
                  moduleLabels.map((module) => h("span", { key: module }, module))
                )
              : h("p", null, c.noModulesLabel)
          )
        ),
        h(
          "div",
          { className: "pricing-grid" },
          c.plans.map((plan, index) =>
            h(
              motion.article,
              {
                className: `pricing-card ${plan.id === recommendedPlan.id ? "recommended" : ""}`,
                key: plan.id,
                ...reveal(index * 0.06),
                whileHover: shouldReduceMotion ? undefined : { y: -8, rotateX: 2, rotateY: index === 1 ? 0 : index === 0 ? -1.5 : 1.5 }
              },
              plan.id === recommendedPlan.id && h("div", { className: "plan-badge" }, c.recommendedLabel),
              h("div", { className: "plan-head" }, h("h3", null, plan.name), h("p", null, plan.bestFor)),
              h("div", { className: "plan-price" }, h("strong", null, plan.price), h("span", null, plan.period)),
              h(
                "ul",
                { className: "plan-includes" },
                plan.includes.map((item) => h("li", { key: item }, h(Icon, { name: "check" }), h("span", null, item)))
              ),
              h(motion.button, { className: "btn btn-primary plan-cta", type: "button", onClick: () => startPlan(plan), whileTap: { scale: 0.98 } }, plan.cta, h(Icon, { name: "credit-card" }))
            )
          )
        ),
        checkoutSelection &&
          h(
            motion.div,
            { className: "mock-checkout-panel", id: "mock-checkout", ...reveal(0.04) },
            h("div", { className: "checkout-orb", "aria-hidden": "true" }, h("span", null)),
            h(
              "div",
              { className: "checkout-copy" },
              h("span", { className: "demo-preview-kicker" }, checkoutCopy.eyebrow),
              h("h3", null, checkoutCopy.title),
              h("p", null, checkoutCopy.copy),
              h(
                "div",
                { className: "checkout-summary" },
                h("span", null, checkoutSelection.businessName || industryLabel),
                h("strong", null, checkoutSelection.selectedPlan || checkoutSelection.selectedPlanId),
                h("em", null, `${checkoutCopy.status}: ${checkoutSelection.subscriptionStatus === "Local Mock Active" ? checkoutCopy.active : checkoutCopy.pending}`)
              )
            ),
            h(
              "div",
              { className: "checkout-actions" },
              h(motion.button, { className: "btn btn-primary", type: "button", onClick: activateMockCheckout, whileTap: { scale: 0.98 } }, checkoutCopy.paymentSuccess, h(Icon, { name: "badge-check" })),
              h(motion.button, { className: "btn btn-ghost", type: "button", onClick: openPlaceholderPayment, whileTap: { scale: 0.98 } }, checkoutCopy.placeholderPayment, h(Icon, { name: "external-link" }))
            )
          ),
        h("p", { className: "pricing-note" }, c.note),
        h(
          motion.div,
          { className: "widget-preview-panel", ...reveal(0.08) },
          h("div", null, h("span", { className: "demo-preview-kicker" }, "Client Widget"), h("h3", null, c.widgetTitle), h("p", null, c.widgetCopy)),
          h("pre", { className: "embed-code-preview" }, h("code", null, c.widgetCode))
        )
      )
    );
  }

  function ActivationSuccessPanel({ clientConfig, lang }) {
    const [copied, setCopied] = useState("");
    const [installStatus, setInstallStatus] = useState("");
    const shareLink = getClientShareLink(clientConfig.clientId);
    const embedCode = `<script src="https://noussystems.ai/widget.js" data-client-id="${clientConfig.clientId}"></script>`;
    const modules = clientConfig.modules && clientConfig.modules.length ? clientConfig.modules : [];
    const copy =
      lang === "el"
        ? {
            eyebrow: "AI Business Page Active",
            title: "Your AI Business Page Is Ready",
            subtitle: "Το local AI activation ολοκληρώθηκε. Η επιχείρηση έχει πλέον δική της AI page με client-specific assistant.",
            open: "Open AI Business Page",
            copyLink: "Copy Share Link",
            copied: "Αντιγράφηκε",
            qr: "QR Share Placeholder",
            qrCopy: "Στο live launch μπορεί να αντικατασταθεί με πραγματικό QR export. Για το local demo, το share link είναι το βασικό.",
            embed: "Advanced Copy Embed Code",
            installTitle: "Installation Options",
            request: "Request Installation",
            installSaved: "Το installation request αποθηκεύτηκε τοπικά.",
            labels: {
              business: "Business",
              plan: "Plan",
              modules: "Modules",
              clientId: "Client ID",
              status: "Subscription Status"
            },
            options: ["Share The AI Business Page", "Add Button To Existing Website", "Install Full Widget", "Let Nous Systems Handle It"]
          }
        : {
            eyebrow: "AI Business Page Active",
            title: "Your AI Business Page Is Ready",
            subtitle: "The local AI activation is complete. This business now has its own AI page with a client-specific assistant.",
            open: "Open AI Business Page",
            copyLink: "Copy Share Link",
            copied: "Copied",
            qr: "QR Share Placeholder",
            qrCopy: "For live launch this can become a real QR export. For the local demo, the share link is the main activation path.",
            embed: "Advanced Copy Embed Code",
            installTitle: "Installation Options",
            request: "Request Installation",
            installSaved: "Installation request saved locally.",
            labels: {
              business: "Business",
              plan: "Plan",
              modules: "Modules",
              clientId: "Client ID",
              status: "Subscription Status"
            },
            options: ["Share The AI Business Page", "Add Button To Existing Website", "Install Full Widget", "Let Nous Systems Handle It"]
          };

    const handleCopy = async (value, label) => {
      await copyToClipboard(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1600);
    };

    const requestInstall = (option) => {
      saveInstallRequest(clientConfig, option);
      setInstallStatus(copy.installSaved);
    };

    return h(
      motion.div,
      { className: "activation-success-panel", ...reveal(0.04) },
      h("div", { className: "activation-orb", "aria-hidden": "true" }, h("span", null), h("i", null)),
      h(
        "div",
        { className: "activation-head" },
        h("span", { className: "demo-preview-kicker" }, copy.eyebrow),
        h("h3", null, copy.title),
        h("p", null, copy.subtitle)
      ),
      h(
        "div",
        { className: "activation-details" },
        h("div", null, h("span", null, copy.labels.business), h("strong", null, clientConfig.businessName)),
        h("div", null, h("span", null, copy.labels.plan), h("strong", null, clientConfig.plan)),
        h("div", null, h("span", null, copy.labels.modules), h("strong", null, modules.length ? modules.join(", ") : "AI assistant")),
        h("div", null, h("span", null, copy.labels.clientId), h("strong", null, clientConfig.clientId)),
        h("div", null, h("span", null, copy.labels.status), h("strong", null, clientConfig.subscriptionStatus || "Local Mock Active"))
      ),
      h(
        "div",
        { className: "activation-actions" },
        h(motion.a, { className: "btn btn-primary", href: shareLink, target: "_blank", rel: "noopener noreferrer", whileTap: { scale: 0.98 } }, copy.open, h(Icon, { name: "external-link" })),
        h(motion.button, { className: "btn btn-ghost", type: "button", onClick: () => handleCopy(shareLink, "link"), whileTap: { scale: 0.98 } }, copied === "link" ? copy.copied : copy.copyLink, h(Icon, { name: "copy" })),
        h(motion.button, { className: "btn btn-ghost", type: "button", onClick: () => handleCopy(embedCode, "embed"), whileTap: { scale: 0.98 } }, copied === "embed" ? copy.copied : copy.embed, h(Icon, { name: "code-2" }))
      ),
      h(
        "div",
        { className: "activation-share-grid" },
        h(
          "div",
          { className: "qr-placeholder" },
          h("div", { className: "qr-box", "aria-hidden": "true" }, h("span", null), h("span", null), h("span", null), h("span", null)),
          h("strong", null, copy.qr),
          h("p", null, copy.qrCopy)
        ),
        h(
          "div",
          { className: "installation-panel" },
          h("h4", null, copy.installTitle),
          copy.options.map((option) =>
            h(
              "button",
              { className: "install-option", type: "button", key: option, onClick: () => requestInstall(option) },
              h(Icon, { name: option.includes("Widget") ? "panel-top" : option.includes("Button") ? "mouse-pointer-click" : option.includes("Nous") ? "sparkles" : "share-2" }),
              h("span", null, option)
            )
          ),
          installStatus && h("p", { className: "install-status", role: "status" }, installStatus)
        )
      )
    );
  }

  function OnboardingSection({ lang }) {
    const c = content[lang].onboarding;
    const initialForm = {
      businessName: "",
      industry: "",
      websiteUrl: "",
      contactEmail: "",
      phone: "",
      workingHours: "",
      mainServices: "",
      faqs: "",
      bookingMethod: "",
      googleReviewLink: "",
      preferredTone: "",
      notificationEmail: "",
      notes: ""
    };
    const [selection, setSelection] = useState(() => normalizePlanSelection(readJsonStorage("nous-onboarding-selection", readJsonStorage("nous-subscription-selection", {}))));
    const [formData, setFormData] = useState(() => {
      const savedSelection = normalizePlanSelection(readJsonStorage("nous-onboarding-selection", readJsonStorage("nous-subscription-selection", {})));
      return { ...initialForm, businessName: savedSelection.businessName, industry: savedSelection.industry };
    });
    const [submission, setSubmission] = useState({ state: "idle", message: "" });
    const [activatedClient, setActivatedClient] = useState(() => {
      const activeClientId = readJsonStorage("nous_active_client_id", "");
      return activeClientId ? getClientConfig(activeClientId) : null;
    });
    const isSubmitting = submission.state === "loading";

    const applySelection = (payload) => {
      const normalized = normalizePlanSelection(payload || {});
      setSelection(normalized);
      setFormData((current) => ({
        ...current,
        businessName: normalized.businessName || current.businessName,
        industry: normalized.industry || current.industry
      }));
      setActivatedClient(null);
      if (submission.state !== "idle") setSubmission({ state: "idle", message: "" });
    };

    useEffect(() => {
      applySelection(readJsonStorage("nous-onboarding-selection", readJsonStorage("nous-subscription-selection", {})));
      const handlePlan = (event) => applySelection(event.detail);
      window.addEventListener("nous:plan-selected", handlePlan);
      window.addEventListener("nous:subscription-selection", handlePlan);
      return () => {
        window.removeEventListener("nous:plan-selected", handlePlan);
        window.removeEventListener("nous:subscription-selection", handlePlan);
      };
    }, [lang]);

    const updateField = (field) => (event) => {
      setFormData((current) => ({ ...current, [field]: event.target.value }));
      if (submission.state !== "idle") setSubmission({ state: "idle", message: "" });
    };

    const submitOnboarding = async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      const webhookUrl = ((window.NOUS_CONFIG && window.NOUS_CONFIG.MAKE_ONBOARDING_WEBHOOK_URL) || "").trim();
      const payload = {
        selectedPlan: selection.selectedPlan || selection.selectedPlanId || "",
        selectedPlanId: selection.selectedPlanId || "",
        industry: formData.industry.trim(),
        modules: selection.modules || [],
        moduleIds: selection.moduleIds || [],
        automationGoal: selection.automationGoal || "",
        ...Object.fromEntries(Object.entries(formData).map(([key, value]) => [key, value.trim()])),
        source: "nous-systems-ai-onboarding",
        language: lang,
        pageUrl: window.location.href,
        submittedAt: new Date().toISOString()
      };

      saveJsonStorage("nous-onboarding-details", payload);
      setSubmission({ state: "loading", message: "" });

      const clientConfig = {
        clientId: generateClientId(payload.businessName, payload.industry),
        businessName: payload.businessName,
        industry: payload.industry,
        plan: payload.selectedPlan || payload.selectedPlanId || "Starter",
        planId: payload.selectedPlanId || "",
        modules: payload.modules,
        moduleIds: payload.moduleIds,
        websiteUrl: payload.websiteUrl,
        contactEmail: payload.contactEmail,
        phone: payload.phone,
        workingHours: payload.workingHours,
        mainServices: payload.mainServices,
        faqs: payload.faqs,
        bookingMethod: payload.bookingMethod,
        googleReviewLink: payload.googleReviewLink,
        preferredTone: payload.preferredTone,
        notificationEmail: payload.notificationEmail || payload.contactEmail,
        extraNotes: payload.notes,
        automationGoal: payload.automationGoal,
        subscriptionStatus: selection.subscriptionStatus || "Local Mock Active",
        createdAt: new Date().toISOString()
      };

      try {
        saveClientConfig(clientConfig);
        setActivatedClient(clientConfig);
        saveJsonStorage("nous-onboarding-client-config", clientConfig);

        if (webhookUrl && !webhookUrl.includes("PASTE_YOUR")) {
          const response = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, clientConfig })
          });
          if (!response.ok) console.warn(`Onboarding webhook returned HTTP ${response.status}`);
        }

        setSubmission({ state: "success", message: c.success });
      } catch (error) {
        console.error("Onboarding submission failed:", error);
        setSubmission({ state: "error", message: c.error });
      }
    };

    const selectedPlanLabel = selection.selectedPlan || selection.selectedPlanId || c.noPlan;
    const selectedModules = selection.modules && selection.modules.length ? selection.modules : [];

    return h(
      "section",
      { className: "section onboarding-section", id: "onboarding" },
      h(
        "div",
        { className: "section-inner onboarding-layout" },
        h(
          "div",
          { className: "onboarding-copy" },
          h(SectionIntro, { eyebrow: c.eyebrow, title: c.title, copy: c.copy }),
          h(
            "div",
            { className: "onboarding-summary" },
            h("div", null, h("span", null, c.selectedPlanLabel), h("strong", null, selectedPlanLabel)),
            h(
              "div",
              null,
              h("span", null, c.selectedAutomationsLabel),
              selectedModules.length ? h("p", null, selectedModules.join(", ")) : h("p", null, c.noPlan)
            )
          )
        ),
        h(
          motion.div,
          { className: "form-panel onboarding-form-panel", ...reveal(0.08) },
          activatedClient
            ? h(ActivationSuccessPanel, { clientConfig: activatedClient, lang })
            : h(
                "form",
                { className: "contact-form onboarding-form", onSubmit: submitOnboarding },
                h("div", { className: "field-grid" },
                  h("input", { className: "input-field", name: "businessName", placeholder: c.fields.businessName, "aria-label": c.fields.businessName, value: formData.businessName, onChange: updateField("businessName"), required: true }),
                  h("input", { className: "input-field", name: "industry", placeholder: c.fields.industry, "aria-label": c.fields.industry, value: formData.industry, onChange: updateField("industry"), required: true })
                ),
                h("div", { className: "field-grid" },
                  h("input", { className: "input-field", name: "websiteUrl", placeholder: c.fields.websiteUrl, "aria-label": c.fields.websiteUrl, value: formData.websiteUrl, onChange: updateField("websiteUrl"), autoComplete: "url" }),
                  h("input", { className: "input-field", type: "email", name: "contactEmail", placeholder: c.fields.contactEmail, "aria-label": c.fields.contactEmail, value: formData.contactEmail, onChange: updateField("contactEmail"), autoComplete: "email", required: true })
                ),
                h("div", { className: "field-grid" },
                  h("input", { className: "input-field", name: "phone", placeholder: c.fields.phone, "aria-label": c.fields.phone, value: formData.phone, onChange: updateField("phone"), autoComplete: "tel" }),
                  h("input", { className: "input-field", name: "workingHours", placeholder: c.fields.workingHours, "aria-label": c.fields.workingHours, value: formData.workingHours, onChange: updateField("workingHours") })
                ),
                h("textarea", { className: "input-field", name: "mainServices", placeholder: c.fields.mainServices, "aria-label": c.fields.mainServices, value: formData.mainServices, onChange: updateField("mainServices"), rows: 4, required: true }),
                h("textarea", { className: "input-field", name: "faqs", placeholder: c.fields.faqs, "aria-label": c.fields.faqs, value: formData.faqs, onChange: updateField("faqs"), rows: 4 }),
                h("div", { className: "field-grid" },
                  h("input", { className: "input-field", name: "bookingMethod", placeholder: c.fields.bookingMethod, "aria-label": c.fields.bookingMethod, value: formData.bookingMethod, onChange: updateField("bookingMethod") }),
                  h("input", { className: "input-field", name: "googleReviewLink", placeholder: c.fields.googleReviewLink, "aria-label": c.fields.googleReviewLink, value: formData.googleReviewLink, onChange: updateField("googleReviewLink") })
                ),
                h("div", { className: "field-grid" },
                  h("input", { className: "input-field", name: "preferredTone", placeholder: c.fields.preferredTone, "aria-label": c.fields.preferredTone, value: formData.preferredTone, onChange: updateField("preferredTone") }),
                  h("input", { className: "input-field", type: "email", name: "notificationEmail", placeholder: c.fields.notificationEmail, "aria-label": c.fields.notificationEmail, value: formData.notificationEmail, onChange: updateField("notificationEmail"), autoComplete: "email" })
                ),
                h("textarea", { className: "input-field", name: "notes", placeholder: c.fields.notes, "aria-label": c.fields.notes, value: formData.notes, onChange: updateField("notes"), rows: 4 }),
                submission.message &&
                  h("div", { className: `form-status ${submission.state}`, role: submission.state === "error" ? "alert" : "status", "aria-live": "polite" }, submission.message),
                h(motion.button, { className: "btn btn-primary", type: "submit", disabled: isSubmitting, whileTap: isSubmitting ? undefined : { scale: 0.98 } }, isSubmitting ? c.loading : c.submit, h(Icon, { name: isSubmitting ? "loader-circle" : "send" }))
              )
        )
      )
    );
  }

  function Industries({ lang }) {
    const c = content[lang];

    return h(
      "section",
      { className: "section industry-section", id: "industries" },
      h(
        "div",
        { className: "section-inner" },
        h(SectionIntro, { eyebrow: c.industriesEyebrow, title: c.industriesTitle, copy: c.industriesCopy }),
        h(
          "div",
          { className: "industry-grid six-industries" },
          c.industries.map(([title, copy], index) =>
            h(
              motion.article,
              { className: "industry-card", key: title, ...reveal(index * 0.04) },
              h("span", { className: "industry-number" }, `0${index + 1}`),
              h("h3", null, title),
              h("p", null, copy)
            )
          )
        )
      )
    );
  }

  function BeforeAfter({ lang }) {
    const c = content[lang];

    const column = (title, items, variant) =>
      h(
        motion.div,
        { className: `before-after-card ${variant}`, ...reveal(variant === "after" ? 0.08 : 0) },
        h("h3", null, title),
        h(
          "div",
          { className: "before-after-list" },
          items.map((item) =>
            h("div", { className: "before-after-item", key: item }, h(Icon, { name: variant === "after" ? "check" : "x" }), h("span", null, item))
          )
        )
      );

    return h(
      "section",
      { className: "section before-after-section", id: "before-after" },
      h(
        "div",
        { className: "section-inner" },
        h(SectionIntro, { eyebrow: c.beforeAfterEyebrow, title: c.beforeAfterTitle, center: true }),
        h("div", { className: "before-after-grid" }, column(c.before, c.beforeItems, "before"), column(c.after, c.afterItems, "after"))
      )
    );
  }

  function Handles({ lang }) {
    const c = content[lang];

    return h(
      "section",
      { className: "section handles-section", id: "handles" },
      h(
        "div",
        { className: "section-inner handles-layout" },
        h(SectionIntro, { eyebrow: c.handlesEyebrow, title: c.handlesTitle, copy: c.handlesCopy }),
        h(
          motion.div,
          { className: "handles-panel", ...reveal(0.08) },
          h("div", { className: "handles-orb", "aria-hidden": "true" }),
          h(
            "div",
            { className: "handles-list" },
            c.handles.map((item) =>
              h("div", { className: "handle-item", key: item }, h(Icon, { name: "check" }), h("span", null, item))
            )
          )
        )
      )
    );
  }

  function HowItWorks({ lang }) {
    const c = content[lang];
    const timelineRef = useRef(null);
    const shouldReduceMotion = useReducedMotion();
    const { scrollYProgress } = useScroll({
      target: timelineRef,
      offset: ["start 76%", "end 42%"]
    });
    const lineScaleY = useTransform(scrollYProgress, [0, 1], [0, 1]);
    const panelY = useTransform(scrollYProgress, [0, 1], [28, -16]);
    const panelRotateY = useTransform(scrollYProgress, [0, 1], [4, -3]);

    return h(
      "section",
      { className: "section", id: "how", ref: timelineRef },
      h(
        "div",
        { className: "section-inner timeline-wrap" },
        h(
          "div",
          null,
          h(SectionIntro, { eyebrow: c.howEyebrow, title: c.howTitle, copy: c.howCopy }),
          h(
            "div",
            { className: "timeline timeline-activation" },
            h(motion.div, {
              className: "timeline-progress-line",
              style: { scaleY: shouldReduceMotion ? 1 : lineScaleY },
              "aria-hidden": "true"
            }),
            c.howSteps.map(([title, copy], index) =>
              h(
                motion.article,
                {
                  className: "timeline-item timeline-activation-step",
                  key: title,
                  initial: { opacity: 0, y: 28, rotateX: 4 },
                  whileInView: { opacity: 1, y: 0, rotateX: 0 },
                  viewport: { once: true, amount: 0.38 },
                  transition: { duration: 0.68, delay: index * 0.09, ease: smoothEase }
                },
                h(
                  motion.div,
                  {
                    className: "timeline-marker",
                    initial: { boxShadow: "inset 0 0 20px rgba(101, 234, 255, 0.1), 0 0 18px rgba(30, 167, 255, 0.12)" },
                    whileInView: {
                      boxShadow:
                        "inset 0 0 22px rgba(101, 234, 255, 0.16), 0 0 34px rgba(101, 234, 255, 0.34), 0 0 0 6px rgba(101, 234, 255, 0.045)"
                    },
                    viewport: { once: true, amount: 0.7 },
                    transition: { duration: 0.58, delay: 0.12 + index * 0.12, ease: smoothEase }
                  },
                  index + 1
                ),
                h("div", null, h("h3", null, title), h("p", null, copy))
              )
            )
          )
        ),
        h(
          motion.div,
          {
            className: "system-panel practical-panel",
            ...reveal(0.1),
            style: shouldReduceMotion ? {} : { y: panelY, rotateY: panelRotateY, transformPerspective: 1200 }
          },
          h("div", { className: "system-core" }),
          c.systemNodes.map((node, index) =>
            h("div", { className: `node-chip node-${["a", "b", "c", "d"][index]}`, key: node }, node)
          )
        )
      )
    );
  }

  function WhyChooseUs({ lang }) {
    const c = content[lang];

    return h(
      "section",
      { className: "section", id: "why" },
      h(
        "div",
        { className: "section-inner" },
        h(SectionIntro, { eyebrow: c.whyEyebrow, title: c.whyTitle, copy: c.whyCopy }),
        h(
          "div",
          { className: "why-layout" },
          h(
            "div",
            { className: "stat-board" },
            c.stats.map(([value, label], index) =>
              h(motion.article, { className: "stat-card", key: label, ...reveal(index * 0.04) }, h("strong", null, value), h("span", null, label))
            )
          ),
          h(
            "div",
            { className: "feature-stack" },
            c.features.map(([title, copy], index) =>
              h(motion.article, { className: "feature-block", key: title, ...reveal(index * 0.04) }, h("h3", null, title), h("p", null, copy))
            )
          )
        )
      )
    );
  }

  function Testimonials({ lang }) {
    const c = content[lang];
    const shouldReduceMotion = useReducedMotion();
    const emptyForm = { name: "", role: "", quote: "" };
    const storageKey = "nous-systems-ai-testimonials";
    const [formData, setFormData] = useState(emptyForm);
    const [visitorTestimonials, setVisitorTestimonials] = useState([]);
    const [submission, setSubmission] = useState({ state: "idle", message: "" });

    useEffect(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setVisitorTestimonials(parsed.slice(0, 6));
        }
      } catch (error) {
        console.warn("[Nous Testimonials] Could not load saved testimonials", error);
      }
    }, []);

    useEffect(() => {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(visitorTestimonials.slice(0, 6)));
      } catch (error) {
        console.warn("[Nous Testimonials] Could not save testimonials", error);
      }
    }, [visitorTestimonials]);

    const updateField = (field) => (event) => {
      setFormData((current) => ({ ...current, [field]: event.target.value }));
    };

    const initials = (name) =>
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();

    const submitTestimonial = async (event) => {
      event.preventDefault();

      const testimonial = {
        name: formData.name.trim(),
        role: formData.role.trim() || c.testimonialForm.defaultRole,
        quote: formData.quote.trim(),
        createdAt: new Date().toISOString()
      };

      if (!testimonial.name || !testimonial.quote) {
        setSubmission({ state: "error", message: c.testimonialForm.error });
        return;
      }

      setSubmission({ state: "loading", message: "" });
      setVisitorTestimonials((current) => [{ ...testimonial, visitor: true }, ...current].slice(0, 6));
      setFormData(emptyForm);

      const testimonialWebhookUrl = ((window.NOUS_CONFIG && window.NOUS_CONFIG.MAKE_TESTIMONIAL_WEBHOOK_URL) || "").trim();

      if (testimonialWebhookUrl) {
        try {
          const response = await fetch(testimonialWebhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...testimonial,
              source: "nous-systems-ai-testimonial-form",
              pageUrl: window.location.href,
              language: lang
            })
          });

          if (!response.ok) {
            throw new Error(`Webhook failed with status ${response.status}`);
          }
        } catch (error) {
          console.warn("[Nous Testimonials] Optional webhook failed", error);
          setSubmission({ state: "success", message: c.testimonialForm.optionalWebhookError });
          return;
        }
      }

      setSubmission({ state: "success", message: c.testimonialForm.success });
    };

    const visibleTestimonials = [...visitorTestimonials, ...c.testimonials].slice(0, 6);

    return h(
      "section",
      { className: "section testimonials-section", id: "testimonials" },
      h(
        "div",
        { className: "section-inner" },
        h(SectionIntro, { eyebrow: c.testimonialsEyebrow, title: c.testimonialsTitle, copy: c.testimonialsCopy }),
        h(
          "div",
          { className: "testimonials-layout" },
          h(
            "div",
            { className: "testimonials-grid" },
            visibleTestimonials.map((testimonial, index) =>
              h(
                motion.article,
                {
                  className: `testimonial-card${testimonial.visitor ? " visitor-testimonial" : ""}`,
                  key: `${testimonial.name}-${index}`,
                  ...reveal(index * 0.04),
                  whileHover: shouldReduceMotion ? undefined : { y: -6, rotateX: 1.5, rotateY: index % 2 === 0 ? -1 : 1 }
                },
                h(
                  "div",
                  { className: "testimonial-rating", "aria-label": "5 out of 5" },
                  Array.from({ length: 5 }).map((_, starIndex) => h("span", { key: starIndex }))
                ),
                h("blockquote", null, testimonial.quote),
                h(
                  "div",
                  { className: "testimonial-author" },
                  h("span", { className: "testimonial-avatar", "aria-hidden": "true" }, initials(testimonial.name)),
                  h("div", null, h("strong", null, testimonial.name), h("small", null, testimonial.role))
                ),
                testimonial.visitor && h("span", { className: "testimonial-badge" }, c.testimonialForm.pendingReview)
              )
            )
          ),
          h(
            motion.aside,
            { className: "testimonial-form-panel", ...reveal(0.12) },
            h("div", { className: "testimonial-panel-glow", "aria-hidden": "true" }),
            h("p", { className: "eyebrow" }, c.testimonialForm.title),
            h("h3", null, c.testimonialForm.copy),
            h(
              "form",
              { className: "testimonial-form", onSubmit: submitTestimonial },
              h("input", {
                className: "input-field",
                name: "testimonialName",
                value: formData.name,
                onChange: updateField("name"),
                placeholder: c.testimonialForm.name,
                autoComplete: "name"
              }),
              h("input", {
                className: "input-field",
                name: "testimonialRole",
                value: formData.role,
                onChange: updateField("role"),
                placeholder: c.testimonialForm.role,
                autoComplete: "organization-title"
              }),
              h("textarea", {
                className: "input-field",
                name: "testimonialQuote",
                value: formData.quote,
                onChange: updateField("quote"),
                placeholder: c.testimonialForm.quote,
                rows: 5
              }),
              h(
                "div",
                { className: "testimonial-submit-row" },
                h(
                  "button",
                  { className: "btn btn-primary", type: "submit", disabled: submission.state === "loading" },
                  submission.state === "loading" ? c.testimonialForm.loading : c.testimonialForm.submit,
                  h(Icon, { name: submission.state === "loading" ? "loader-2" : "send" })
                )
              ),
              submission.message &&
                h("div", { className: `form-status ${submission.state === "error" ? "error" : "success"}`, role: "status" }, submission.message)
            )
          )
        )
      )
    );
  }

  function DemoCta({ lang }) {
    const c = content[lang];

    return h(
      "section",
      { className: "section demo-cta-section" },
      h(
        "div",
        { className: "section-inner" },
        h(
          motion.div,
          { className: "consultation-band demo-band", ...reveal() },
          h("div", null, h("h2", null, c.demoTitle), h("p", null, c.demoCopy)),
          h(motion.a, { className: "btn btn-primary", href: "#contact", whileTap: { scale: 0.98 } }, c.primaryCta, h(Icon, { name: "calendar-check" }))
        )
      )
    );
  }

  function Faq({ lang }) {
    const c = content[lang];

    return h(
      "section",
      { className: "section trust-section", id: "faq" },
      h(
        "div",
        { className: "section-inner" },
        h(SectionIntro, { eyebrow: c.faqEyebrow, title: c.faqTitle }),
        h(
          "div",
          { className: "faq-grid" },
          c.faqs.map(([question, answer], index) =>
            h(motion.article, { className: "faq-item", key: question, ...reveal(index * 0.04) }, h("h3", null, question), h("p", null, answer))
          )
        )
      )
    );
  }

  function Contact({ lang }) {
    const c = content[lang];
    const initialForm = {
      name: "",
      businessName: "",
      industry: "",
      email: "",
      phone: "",
      automationGoal: ""
    };
    const [formData, setFormData] = useState(initialForm);
    const [submission, setSubmission] = useState({ state: "idle", message: "" });
    const isSubmitting = submission.state === "loading";

    const applyDemoSelection = (selection) => {
      if (!selection || typeof selection !== "object") return;
      setFormData((current) => ({
        ...current,
        businessName: selection.businessName || current.businessName,
        industry: selection.industry || current.industry,
        automationGoal: selection.automationGoal || current.automationGoal
      }));
      if (submission.state !== "idle") {
        setSubmission({ state: "idle", message: "" });
      }
    };

    useEffect(() => {
      try {
        const stored = window.localStorage.getItem("nous-demo-selection");
        if (stored) applyDemoSelection(JSON.parse(stored));
      } catch (error) {
        console.warn("[Nous Contact] Could not read demo selection", error);
      }

      const handleDemoSelection = (event) => applyDemoSelection(event.detail);
      window.addEventListener("nous:demo-selection", handleDemoSelection);
      return () => window.removeEventListener("nous:demo-selection", handleDemoSelection);
    }, []);

    const updateField = (field) => (event) => {
      setFormData((current) => ({ ...current, [field]: event.target.value }));
      if (submission.state !== "idle") {
        setSubmission({ state: "idle", message: "" });
      }
    };

    const submitDemoRequest = async (event) => {
      event.preventDefault();
      if (isSubmitting) return;

      const webhookUrl = (window.NOUS_CONFIG && window.NOUS_CONFIG.MAKE_WEBHOOK_URL || "").trim();

      if (!webhookUrl || webhookUrl.includes("PASTE_YOUR")) {
        setSubmission({ state: "error", message: c.configErrorMessage });
        return;
      }

      const payload = {
        name: formData.name.trim(),
        businessName: formData.businessName.trim(),
        industry: formData.industry.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        automationGoal: formData.automationGoal.trim(),
        language: lang,
        source: "nous-systems-ai-landing",
        submittedAt: new Date().toISOString(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent
      };

      setSubmission({ state: "loading", message: "" });

      try {
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Make webhook returned HTTP ${response.status}`);
        }

        setFormData(initialForm);
        setSubmission({ state: "success", message: c.successMessage });
      } catch (error) {
        console.error("Demo request submission failed:", error);
        setSubmission({ state: "error", message: c.errorMessage });
      }
    };

    return h(
      "section",
      { className: "section", id: "contact" },
      h(
        "div",
        { className: "section-inner contact-layout" },
        h(
          "div",
          null,
          h(SectionIntro, { eyebrow: c.contactEyebrow, title: c.contactTitle, copy: c.contactCopy }),
          h(
            motion.div,
            { className: "contact-meta", ...reveal(0.12) },
            h("div", { className: "contact-pill" }, h("strong", null, c.phoneLabel), h("span", null, "+30 000 000 0000")),
            h("div", { className: "contact-pill" }, h("strong", null, c.emailLabel), h("span", null, "hello@noussystems.ai"))
          )
        ),
        h(
          motion.div,
          { className: "form-panel demo-form-panel", ...reveal(0.08) },
          h(
            "form",
            {
              className: "contact-form",
              onSubmit: submitDemoRequest
            },
            h("input", {
              className: "input-field",
              name: "name",
              placeholder: c.fields.name,
              "aria-label": c.fields.name,
              value: formData.name,
              onChange: updateField("name"),
              autoComplete: "name",
              required: true
            }),
            h("input", {
              className: "input-field",
              name: "businessName",
              placeholder: c.fields.business,
              "aria-label": c.fields.business,
              value: formData.businessName,
              onChange: updateField("businessName"),
              autoComplete: "organization",
              required: true
            }),
            h(
              "div",
              { className: "field-grid" },
              h("input", {
                className: "input-field",
                name: "industry",
                placeholder: c.fields.industry,
                "aria-label": c.fields.industry,
                value: formData.industry,
                onChange: updateField("industry")
              }),
              h("input", {
                className: "input-field",
                type: "email",
                name: "email",
                placeholder: c.fields.email,
                "aria-label": c.fields.email,
                value: formData.email,
                onChange: updateField("email"),
                autoComplete: "email",
                required: true
              })
            ),
            h("input", {
              className: "input-field",
              name: "phone",
              placeholder: c.fields.phone,
              "aria-label": c.fields.phone,
              value: formData.phone,
              onChange: updateField("phone"),
              autoComplete: "tel"
            }),
            h("textarea", {
              className: "input-field",
              name: "automationGoal",
              placeholder: c.fields.message,
              "aria-label": c.fields.message,
              value: formData.automationGoal,
              onChange: updateField("automationGoal"),
              required: true
            }),
            submission.message &&
              h(
                "div",
                {
                  className: `form-status ${submission.state}`,
                  role: submission.state === "error" ? "alert" : "status",
                  "aria-live": "polite"
                },
                submission.message
              ),
            h(
              motion.button,
              {
                className: "btn btn-primary",
                type: "submit",
                disabled: isSubmitting,
                whileTap: isSubmitting ? undefined : { scale: 0.98 }
              },
              isSubmitting ? c.loadingSubmit : submission.state === "success" ? c.submitted : c.submit,
              h(Icon, { name: isSubmitting ? "loader-circle" : submission.state === "success" ? "badge-check" : "send" })
            )
          )
        )
      )
    );
  }

  function AssistantOrb({ variant = "panel", label = "AI" }) {
    return h(
      "span",
      { className: `assistant-orb assistant-orb-${variant}`, "aria-hidden": "true" },
      h("span", { className: "assistant-orb-core" }),
      h("span", { className: "assistant-orb-ring ring-a" }),
      h("span", { className: "assistant-orb-ring ring-b" }),
      h("span", { className: "assistant-orb-node node-a" }),
      h("span", { className: "assistant-orb-node node-b" }),
      h("strong", null, label)
    );
  }

  function ChatAssistantWidget({ lang }) {
    const c = content[lang].assistant;
    const createMessage = (from, text) => ({ from, text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
    const [open, setOpen] = useState(false);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [thinkingStep, setThinkingStep] = useState(0);
    const [messages, setMessages] = useState([createMessage("assistant", c.intro)]);
    const endRef = useRef(null);

    useEffect(() => {
      setMessages([createMessage("assistant", c.intro)]);
      setInput("");
      setTyping(false);
    }, [lang]);

    useEffect(() => {
      const handleOpenChat = (event) => {
        setOpen(true);
        if (event.detail?.prompt) {
          setInput(event.detail.prompt);
        }
      };
      window.addEventListener("nous:open-chat", handleOpenChat);
      return () => window.removeEventListener("nous:open-chat", handleOpenChat);
    }, []);

    useEffect(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, typing, open]);

    useEffect(() => {
      if (!typing) {
        setThinkingStep(0);
        return undefined;
      }

      const interval = window.setInterval(() => {
        const steps = c.typingSteps || [c.typing];
        setThinkingStep((current) => Math.min(current + 1, steps.length - 1));
      }, 900);

      return () => window.clearInterval(interval);
    }, [typing, lang]);

    const systemPrompt = `You are the AI business assistant for Nous Systems AI, an AI automation agency in Greece.
Speak in the user's language when possible.
Be friendly, professional, concise and business-oriented.
Help local businesses understand how 24/7 AI systems can respond instantly, capture leads, handle booking requests, answer FAQs, automate follow-ups and collect Google reviews.
Do not position the offer as "just chatbots".
Encourage users to request a free AI demo when they ask about pricing, implementation, bookings, restaurants, clinics, law firms, real estate, customer support or missed leads.
Keep answers under 120 words unless the user asks for detail.`;

    const normalizeAssistantReply = (value) => {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (!trimmed) return "";

        try {
          return normalizeAssistantReply(JSON.parse(trimmed));
        } catch (error) {
          try {
            return normalizeAssistantReply(JSON.parse(`{${trimmed}}`));
          } catch (wrappedError) {
            const replyMatch = trimmed.match(/^["']?reply["']?\s*:\s*(["']?)([\s\S]*?)\1\s*$/i);
            if (replyMatch) return replyMatch[2].replace(/\\"/g, "\"").trim();
            return trimmed;
          }
        }
      }
      if (Array.isArray(value)) return value.map(normalizeAssistantReply).filter(Boolean).join("\n");
      if (value && typeof value === "object") {
        return normalizeAssistantReply(
          value.reply ||
            value.response ||
            value.message ||
            value.answer ||
            value.content ||
            value.text ||
            value.output_text ||
            value.choices?.[0]?.message?.content
        );
      }
      return "";
    };

    const readAssistantReply = async (response) => {
      const responseTextPromise = response.clone().text();
      let parsedData = null;

      try {
        const data = await response.json();
        parsedData = data;
      } catch (error) {
        parsedData = null;
      }

      const responseText = await responseTextPromise;

      if (!responseText.trim() && !parsedData) {
        throw new Error("Empty AI response");
      }

      const reply = normalizeAssistantReply(parsedData) || normalizeAssistantReply(responseText);
      if (!reply) {
        throw new Error("Missing reply in AI response");
      }

      return reply;
    };

    const playSoftInteractionSound = () => {
      if (!window.NOUS_ENABLE_CHAT_SOUND || !window.AudioContext) return;

      const context = new window.AudioContext();
      const oscillator = context.createOscillator();
      const gain = context.createGain();

      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(740, context.currentTime);
      gain.gain.setValueAtTime(0.0001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.025, context.currentTime + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + 0.16);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.18);
    };

    const sendMessage = async (value) => {
      const trimmed = value.trim();
      if (!trimmed || typing) return;

      playSoftInteractionSound();

      const chatWebhookUrl = (window.NOUS_CONFIG && window.NOUS_CONFIG.MAKE_CHAT_WEBHOOK_URL || "").trim();

      const nextMessages = [...messages, createMessage("user", trimmed)];

      setMessages(nextMessages);
      setInput("");

      if (!chatWebhookUrl || chatWebhookUrl.includes("PASTE_YOUR")) {
        console.error("[Nous Chat] missing MAKE_CHAT_WEBHOOK_URL in src/config.js");
        setMessages((current) => [...current, createMessage("assistant", c.configError)]);
        return;
      }

      setTyping(true);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 22000);

      try {
        const userMessage = trimmed;
        const payload = {
          message: userMessage
        };

        const response = await fetch(chatWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error(`Chat webhook returned HTTP ${response.status}`);
        }

        const reply = await readAssistantReply(response);
        setTyping(false);
        setMessages((current) => [...current, createMessage("assistant", reply)]);
      } catch (error) {
        console.error("AI chat request failed:", error);
        setTyping(false);
        setMessages((current) => [...current, createMessage("assistant", c.error)]);
      } finally {
        window.clearTimeout(timeoutId);
      }
    };

    return h(
      "div",
      { className: "chat-assistant" },
      h(
        AnimatePresence,
        null,
        open &&
          h(
            motion.div,
            {
              className: "chat-panel",
              initial: { opacity: 0, y: 24, scale: 0.96 },
              animate: { opacity: 1, y: 0, scale: 1 },
              exit: { opacity: 0, y: 16, scale: 0.97 },
              transition: { duration: 0.26, ease: smoothEase }
            },
            h(
              "div",
              { className: "chat-panel-header" },
              h(AssistantOrb, { variant: "panel" }),
              h(
                "div",
                { className: "chat-panel-title" },
                h("strong", null, c.title),
                h("span", null, c.subtitle),
                h("div", { className: "chat-status-row" }, h("i", null), h("em", null, "AI ONLINE"), h("span", null, c.status))
              ),
              h("button", { className: "chat-close", type: "button", onClick: () => setOpen(false), "aria-label": c.close }, "×")
            ),
            h(
              "div",
              { className: "chat-live-status", "aria-label": c.status },
              (c.liveStatus || []).map((status) => h("span", { key: status }, h("i", null), status))
            ),
            h(
              "div",
              { className: "chat-messages" },
              messages.map((message, index) =>
                h(
                  motion.div,
                  {
                    className: `chat-message ${message.from === "assistant" ? "assistant-message" : "user-message"}`,
                    key: `${message.from}-${index}`,
                    initial: { opacity: 0, y: 8 },
                    animate: { opacity: 1, y: 0 },
                    transition: { duration: 0.22 }
                  },
                  message.from === "assistant" && h(AssistantOrb, { variant: "mini" }),
                  h(
                    "div",
                    { className: "message-stack" },
                    h("div", { className: "message-bubble" }, h("p", null, message.text)),
                    h("time", { className: "message-time" }, message.time)
                  )
                )
              ),
              typing &&
                h(
                  "div",
                  { className: "chat-typing-indicator" },
                  h(AssistantOrb, { variant: "typing" }),
                  h(
                    "div",
                    { className: "typing-copy" },
                    h("strong", null, (c.typingSteps || [c.typing])[thinkingStep] || c.typing),
                    h("div", { className: "typing-wave" }, h("span", null), h("span", null), h("span", null), h("span", null))
                  ),
                  h("div", { className: "typing-dots" }, h("span", null), h("span", null), h("span", null))
                ),
              h("div", { ref: endRef })
            ),
            h(
              "div",
              { className: "chat-footer" },
              h(
                "form",
                {
                  className: "chat-input-form",
                  onSubmit: (event) => {
                    event.preventDefault();
                    sendMessage(input);
                  }
                },
                h("input", {
                  className: "chat-input",
                  type: "text",
                  value: input,
                  placeholder: c.placeholder,
                  "aria-label": c.placeholder,
                  disabled: typing,
                  onChange: (event) => setInput(event.target.value)
                }),
                h(
                  motion.button,
                  {
                    className: "chat-send",
                    type: "submit",
                    disabled: typing || !input.trim(),
                    whileTap: typing || !input.trim() ? undefined : { scale: 0.96 },
                    "aria-label": c.sendLabel
                  },
                  typing
                    ? h(Icon, { name: "loader-circle" })
                    : h(
                        "svg",
                        { className: "chat-send-arrow", viewBox: "0 0 24 24", "aria-hidden": "true", focusable: "false" },
                        h("path", { d: "M5 12h13" }),
                        h("path", { d: "m13 6 6 6-6 6" })
                      )
                )
              ),
              h(
                "div",
                { className: "chat-quick-replies" },
                c.quickReplies.map((reply) =>
                  h(
                    motion.button,
                    {
                      className: "chat-chip",
                      type: "button",
                      key: reply,
                      disabled: typing,
                      onClick: () => sendMessage(reply),
                      whileTap: typing ? undefined : { scale: 0.96 }
                    },
                    reply
                  )
                )
              )
            )
          )
      ),
      h(
        motion.button,
        { className: "chat-toggle", type: "button", onClick: () => setOpen((current) => !current), whileTap: { scale: 0.96 }, "aria-label": c.button },
        h(AssistantOrb, { variant: "toggle" }),
        h("span", { className: "chat-toggle-label" }, open ? c.close : c.button)
      )
    );
  }

  function ClientChatWidget({ clientConfig, lang }) {
    const copy =
      lang === "el"
        ? {
            title: "AI Assistant",
            status: "Online",
            placeholder: "Ρώτησε για υπηρεσίες, ραντεβού ή τιμές...",
            send: "Αποστολή",
            typing: "Ο AI assistant απαντά...",
            captured: "Το αίτημα καταγράφηκε τοπικά.",
            error: "Δεν μπόρεσα να συνδεθώ τώρα. Μπορείς να αφήσεις όνομα, τηλέφωνο και τι χρειάζεσαι."
          }
        : {
            title: "AI Assistant",
            status: "Online",
            placeholder: "Ask about services, bookings or pricing...",
            send: "Send",
            typing: "The AI assistant is replying...",
            captured: "Request captured locally.",
            error: "I could not connect right now. You can leave your name, phone and what you need."
          };
    const createMessage = (from, text) => ({ from, text, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) });
    const [messages, setMessages] = useState([
      createMessage(
        "assistant",
        `Hi, I am the AI assistant for ${clientConfig.businessName}. I can help with services, working hours, booking requests and common questions.`
      )
    ]);
    const [input, setInput] = useState("");
    const [typing, setTyping] = useState(false);
    const [captured, setCaptured] = useState(false);
    const endRef = useRef(null);

    useEffect(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, [messages, typing]);

    const sendMessage = async (event) => {
      event.preventDefault();
      const trimmed = input.trim();
      if (!trimmed || typing) return;

      const intent = detectLeadIntent(trimmed);
      if (intent) {
        saveClientLead(clientConfig, trimmed, intent);
        setCaptured(true);
      }

      setMessages((current) => [...current, createMessage("user", trimmed)]);
      setInput("");
      setTyping(true);

      const webhookUrl = ((window.NOUS_CONFIG && window.NOUS_CONFIG.MAKE_CHAT_WEBHOOK_URL) || "").trim();
      const payload = {
        message: trimmed,
        clientId: clientConfig.clientId,
        businessName: clientConfig.businessName,
        industry: clientConfig.industry,
        plan: clientConfig.plan,
        modules: clientConfig.modules || [],
        workingHours: clientConfig.workingHours,
        mainServices: clientConfig.mainServices,
        faqs: clientConfig.faqs,
        bookingMethod: clientConfig.bookingMethod,
        googleReviewLink: clientConfig.googleReviewLink,
        preferredTone: clientConfig.preferredTone,
        notificationEmail: clientConfig.notificationEmail,
        source: "nous-client-ai-page",
        language: lang
      };

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 22000);

      try {
        if (!webhookUrl || webhookUrl.includes("PASTE_YOUR")) throw new Error("Missing chat webhook URL");
        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        if (!response.ok) throw new Error(`Client chat webhook returned HTTP ${response.status}`);
        const reply = (await readAssistantResponse(response)) || buildClientFallbackReply(clientConfig);
        setMessages((current) => [...current, createMessage("assistant", reply)]);
      } catch (error) {
        console.warn("Client AI assistant fallback:", error);
        setMessages((current) => [...current, createMessage("assistant", buildClientFallbackReply(clientConfig) || copy.error)]);
      } finally {
        window.clearTimeout(timeoutId);
        setTyping(false);
      }
    };

    return h(
      "section",
      { className: "client-chat-panel", "aria-label": `${clientConfig.businessName} AI assistant` },
      h(
        "div",
        { className: "client-chat-header" },
        h(AssistantOrb, { variant: "panel" }),
        h("div", null, h("strong", null, copy.title), h("span", null, clientConfig.businessName)),
        h("em", null, h("i", null), copy.status)
      ),
      captured && h("div", { className: "client-capture-status", role: "status" }, h(Icon, { name: "badge-check" }), copy.captured),
      h(
        "div",
        { className: "client-chat-messages" },
        messages.map((message, index) =>
          h(
            "div",
            { className: `client-chat-message ${message.from}`, key: `${message.from}-${index}` },
            message.from === "assistant" && h(AssistantOrb, { variant: "mini" }),
            h("div", null, h("p", null, message.text), h("time", null, message.time))
          )
        ),
        typing &&
          h(
            "div",
            { className: "client-chat-typing" },
            h(AssistantOrb, { variant: "typing" }),
            h("span", null, copy.typing),
            h("i", null),
            h("i", null),
            h("i", null)
          ),
        h("div", { ref: endRef })
      ),
      h(
        "form",
        { className: "client-chat-form", onSubmit: sendMessage },
        h("input", { value: input, onChange: (event) => setInput(event.target.value), placeholder: copy.placeholder, "aria-label": copy.placeholder, disabled: typing }),
        h(motion.button, { type: "submit", disabled: typing || !input.trim(), whileTap: typing || !input.trim() ? undefined : { scale: 0.96 }, "aria-label": copy.send }, typing ? h(Icon, { name: "loader-circle" }) : h(Icon, { name: "send" }))
      )
    );
  }

  function ClientHostedPage({ clientConfig, lang }) {
    const notFound =
      lang === "el"
        ? {
            title: "Client AI page not found.",
            copy: "Δεν βρέθηκε local client config για αυτό το clientId.",
            back: "Πίσω στο Nous Systems AI"
          }
        : {
            title: "Client AI page not found.",
            copy: "No local client config exists for this clientId.",
            back: "Back to Nous Systems AI"
          };

    if (!clientConfig) {
      return h(
        "div",
        { className: "client-page client-page-empty" },
        h("div", { className: "static-depth-layer", "aria-hidden": "true" }),
        h("div", { className: "cinema-vignette", "aria-hidden": "true" }),
        h("main", { className: "client-empty-card" }, h(BrandLogoMark), h("h1", null, notFound.title), h("p", null, notFound.copy), h("a", { className: "btn btn-primary", href: window.location.pathname || "/" }, notFound.back))
      );
    }

    const hero = getClientHeroText(clientConfig);
    const modules = clientConfig.modules && clientConfig.modules.length ? clientConfig.modules : ["AI Chat Assistant"];
    const faqs = (clientConfig.faqs || "")
      .split(/\n|;/)
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 5);
    const shareLink = getClientShareLink(clientConfig.clientId);
    const copy =
      lang === "el"
        ? {
            status: "AI System Online",
            hours: "Working Hours",
            services: "Main Services",
            booking: "Booking Method",
            automations: "Active Automations",
            questions: "Business FAQs",
            contact: "Contact",
            review: "Leave Google Review",
            admin: "Admin View"
          }
        : {
            status: "AI System Online",
            hours: "Working Hours",
            services: "Main Services",
            booking: "Booking Method",
            automations: "Active Automations",
            questions: "Business FAQs",
            contact: "Contact",
            review: "Leave Google Review",
            admin: "Admin View"
          };

    return h(
      "div",
      { className: "client-page" },
      h("div", { className: "static-depth-layer", "aria-hidden": "true" }),
      h("div", { className: "cinema-vignette", "aria-hidden": "true" }),
      h(
        "header",
        { className: "client-nav" },
        h("a", { className: "brand-lockup", href: window.location.pathname || "/" }, h(BrandLogoMark), h("span", { className: "brand-name" }, "NOUS SYSTEMS AI")),
        h("div", { className: "client-nav-actions" }, h("span", null, h("i", null), copy.status), h("a", { href: `${window.location.pathname}?mode=admin` }, copy.admin))
      ),
      h(
        "main",
        { className: "client-page-main" },
        h(
          "section",
          { className: "client-hero-card" },
          h("div", { className: "client-hero-glow", "aria-hidden": "true" }),
          h("span", { className: "demo-preview-kicker" }, copy.status),
          h("h1", null, hero.title),
          h("p", null, hero.copy),
          h(
            "div",
            { className: "client-hero-actions" },
            clientConfig.phone && h("a", { className: "btn btn-primary", href: `tel:${clientConfig.phone}` }, clientConfig.phone, h(Icon, { name: "phone-call" })),
            clientConfig.contactEmail && h("a", { className: "btn btn-ghost", href: `mailto:${clientConfig.contactEmail}` }, clientConfig.contactEmail, h(Icon, { name: "mail" })),
            h("button", { className: "btn btn-ghost", type: "button", onClick: () => copyToClipboard(shareLink) }, "Copy Link", h(Icon, { name: "copy" }))
          )
        ),
        h(
          "div",
          { className: "client-page-grid" },
          h(
            "section",
            { className: "client-info-grid" },
            h("article", null, h("span", null, copy.hours), h("strong", null, clientConfig.workingHours || "Available by request")),
            h("article", null, h("span", null, copy.booking), h("strong", null, clientConfig.bookingMethod || "AI captures the request")),
            h("article", null, h("span", null, copy.services), h("p", null, clientConfig.mainServices || "Services are configured during onboarding.")),
            h("article", null, h("span", null, copy.automations), h("p", null, modules.join(", "))),
            faqs.length > 0 && h("article", { className: "client-info-wide" }, h("span", null, copy.questions), faqs.map((faq) => h("p", { key: faq }, faq))),
            clientConfig.googleReviewLink && h("a", { className: "client-review-link", href: clientConfig.googleReviewLink, target: "_blank", rel: "noopener noreferrer" }, copy.review, h(Icon, { name: "star" }))
          ),
          h(ClientChatWidget, { clientConfig, lang })
        )
      )
    );
  }

  function AdminView({ lang }) {
    const [snapshot, setSnapshot] = useState(() => ({
      clients: getClients(),
      leads: getClientLeads(),
      requests: getInstallRequests()
    }));
    const [copied, setCopied] = useState("");
    const copy =
      lang === "el"
        ? {
            title: "Nous Local Admin",
            copy: "Τοπικός πίνακας για clients, leads και installation requests.",
            refresh: "Refresh",
            clients: "Clients",
            leads: "Leads",
            installs: "Install Requests",
            empty: "Δεν υπάρχει ακόμα τοπικό data.",
            open: "Open Page",
            copyLink: "Copy Link",
            copied: "Copied"
          }
        : {
            title: "Nous Local Admin",
            copy: "Local panel for clients, leads and installation requests.",
            refresh: "Refresh",
            clients: "Clients",
            leads: "Leads",
            installs: "Install Requests",
            empty: "No local data yet.",
            open: "Open Page",
            copyLink: "Copy Link",
            copied: "Copied"
          };

    const refresh = () => setSnapshot({ clients: getClients(), leads: getClientLeads(), requests: getInstallRequests() });
    const handleCopy = async (clientId) => {
      await copyToClipboard(getClientShareLink(clientId));
      setCopied(clientId);
      window.setTimeout(() => setCopied(""), 1400);
    };

    return h(
      "div",
      { className: "admin-page" },
      h("div", { className: "static-depth-layer", "aria-hidden": "true" }),
      h("div", { className: "cinema-vignette", "aria-hidden": "true" }),
      h(
        "main",
        { className: "admin-shell" },
        h(
          "header",
          { className: "admin-header" },
          h("a", { className: "brand-lockup", href: window.location.pathname || "/" }, h(BrandLogoMark), h("span", { className: "brand-name" }, "NOUS SYSTEMS AI")),
          h("div", null, h("h1", null, copy.title), h("p", null, copy.copy)),
          h("button", { className: "btn btn-primary", type: "button", onClick: refresh }, copy.refresh, h(Icon, { name: "refresh-cw" }))
        ),
        h(
          "section",
          { className: "admin-section" },
          h("h2", null, copy.clients),
          snapshot.clients.length
            ? h(
                "div",
                { className: "admin-grid" },
                snapshot.clients.map((client) =>
                  h(
                    "article",
                    { className: "admin-card", key: client.clientId },
                    h("span", null, client.subscriptionStatus || "Local Mock Active"),
                    h("h3", null, client.businessName),
                    h("p", null, `${client.industry || "Business"} Β· ${client.plan || "Plan"}`),
                    h("small", null, client.clientId),
                    h(
                      "div",
                      { className: "admin-card-actions" },
                      h("a", { className: "btn btn-primary", href: getClientShareLink(client.clientId), target: "_blank", rel: "noopener noreferrer" }, copy.open),
                      h("button", { className: "btn btn-ghost", type: "button", onClick: () => handleCopy(client.clientId) }, copied === client.clientId ? copy.copied : copy.copyLink)
                    )
                  )
                )
              )
            : h("p", { className: "admin-empty" }, copy.empty)
        ),
        h(
          "section",
          { className: "admin-two-column" },
          h(
            "div",
            { className: "admin-section compact" },
            h("h2", null, copy.leads),
            snapshot.leads.length
              ? snapshot.leads.map((lead) => h("article", { className: "admin-row", key: lead.leadId }, h("strong", null, lead.businessName), h("p", null, lead.message), h("small", null, `${lead.detectedIntent || "lead"} Β· ${new Date(lead.createdAt).toLocaleString()}`)))
              : h("p", { className: "admin-empty" }, copy.empty)
          ),
          h(
            "div",
            { className: "admin-section compact" },
            h("h2", null, copy.installs),
            snapshot.requests.length
              ? snapshot.requests.map((request) => h("article", { className: "admin-row", key: request.requestId }, h("strong", null, request.businessName), h("p", null, request.installType), h("small", null, `${request.status} Β· ${new Date(request.createdAt).toLocaleString()}`)))
              : h("p", { className: "admin-empty" }, copy.empty)
          )
        )
      )
    );
  }

  function Footer({ lang }) {
    const c = content[lang];
    const year = new Date().getFullYear();

    return h(
      "footer",
      { className: "footer" },
      h(
        "div",
        { className: "footer-inner" },
        h(
          "div",
          { className: "footer-brand" },
          h(
            "div",
            { className: "footer-logo" },
            h("span", { className: "footer-mark" }, h("img", { src: logoPath, alt: "Nous Systems AI logo", width: 1536, height: 1024, loading: "lazy", decoding: "async", onError: useLogoFallback })),
            h("span", null, "NOUS SYSTEMS AI")
          ),
          h("p", null, c.footerDescription),
          h(
            "div",
            { className: "footer-meta" },
            h("a", { href: `mailto:${c.footerEmail}` }, c.footerEmail),
            h("a", { href: "#privacy", "aria-label": c.footerPrivacy }, c.footerPrivacy)
          ),
          h("small", null, c.footer.replace("{year}", String(year)))
        ),
        h(
          "div",
          { className: "socials", "aria-label": c.footerSocials.group },
          h("a", { href: "#contact", "aria-label": c.footerSocials.website }, h(Icon, { name: "globe" })),
          h("a", { href: "#contact", "aria-label": c.footerSocials.message }, h(Icon, { name: "message-circle" })),
          h("a", { href: "mailto:hello@noussystems.ai", "aria-label": c.footerSocials.email }, h(Icon, { name: "mail" }))
        )
      )
    );
  }

  function App() {
    const [loaded, setLoaded] = useState(false);
    const [lang, setLang] = useState("en");

    useSceneControls();
    useLucideRefresh([loaded, lang]);

    useEffect(() => {
      const timeout = window.setTimeout(() => setLoaded(true), 2100);
      return () => window.clearTimeout(timeout);
    }, []);

    useEffect(() => {
      document.documentElement.lang = content[lang].htmlLang;
      document.title =
        lang === "el"
          ? "Nous Systems AI | AI Αυτοματισμοί Για Τοπικές Επιχειρήσεις"
          : "Nous Systems AI | AI Automation Systems For Local Businesses";
    }, [lang]);

    const params = new URLSearchParams(window.location.search);
    const mode = params.get("mode");
    const clientId = params.get("clientId");
    const clientConfig = mode === "client" && clientId ? getClientConfig(clientId) : null;

    if (mode === "client") {
      return h(ClientHostedPage, { clientConfig, lang });
    }

    if (mode === "admin") {
      return h(AdminView, { lang });
    }

    return useMemo(
      () =>
        h(
          "div",
          { className: "app-shell" },
          h("div", { className: "static-depth-layer", "aria-hidden": "true" }),
          h("div", { className: "cinema-vignette", "aria-hidden": "true" }),
          h("div", { className: "scanline", "aria-hidden": "true" }),
          h(Loader, { loaded }),
          h(Nav, { lang, onToggle: setLang }),
          h(
            "main",
            null,
            h(Hero, { lang }),
            h(Services, { lang }),
            h(InteractiveAIDemo, { lang }),
            h(PricingSection, { lang }),
            h(OnboardingSection, { lang }),
            h(Industries, { lang }),
            h(BeforeAfter, { lang }),
            h(Handles, { lang }),
            h(HowItWorks, { lang }),
            h(WhyChooseUs, { lang }),
            h(Testimonials, { lang }),
            h(DemoCta, { lang }),
            h(Faq, { lang }),
            h(Contact, { lang })
          ),
          h(Footer, { lang }),
          h(ChatAssistantWidget, { lang })
        ),
      [loaded, lang]
    );
  }

  ReactDOM.createRoot(document.getElementById("root")).render(h(App));
})();
