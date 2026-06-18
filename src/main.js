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
      testimonialsEyebrow: "Μαρτυρίες",
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
      testimonialsEyebrow: "Testimonials",
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
      let raf = 0;

      const setPointer = (event) => {
        document.documentElement.style.setProperty("--mx", `${event.clientX}px`);
        document.documentElement.style.setProperty("--my", `${event.clientY}px`);
      };

      const setScroll = () => {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          document.documentElement.style.setProperty("--scroll", `${window.scrollY}`);
        });
      };

      window.addEventListener("pointermove", setPointer, { passive: true });
      window.addEventListener("scroll", setScroll, { passive: true });
      setScroll();

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", setPointer);
        window.removeEventListener("scroll", setScroll);
      };
    }, []);
  }

  function ThreeScene() {
    const mountRef = useRef(null);

    useEffect(() => {
      const mount = mountRef.current;
      if (!mount || !window.THREE) return undefined;

      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 1000);
      const renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
        preserveDrawingBuffer: false
      });
      const pointer = { x: 0, y: 0 };

      camera.position.set(0, 0, 86);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(window.innerWidth, window.innerHeight);
      mount.appendChild(renderer.domElement);

      const particleCount = window.innerWidth < 700 ? 160 : 340;
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
      scene.add(particles);

      const grid = new THREE.GridHelper(190, 48, 0x1ea7ff, 0x102a46);
      grid.position.y = -42;
      grid.position.z = -34;
      grid.material.transparent = true;
      grid.material.opacity = 0.16;
      scene.add(grid);

      const coreMaterial = new THREE.MeshBasicMaterial({
        color: 0x41c9ff,
        wireframe: true,
        transparent: true,
        opacity: 0.12,
        blending: THREE.AdditiveBlending
      });
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(15, 1), coreMaterial);
      core.position.set(42, 0, -26);
      scene.add(core);

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };

      const onPointer = (event) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      };

      window.addEventListener("resize", onResize);
      window.addEventListener("pointermove", onPointer, { passive: true });

      let frame = 0;
      let animationId = 0;

      const renderFrame = () => {
        frame += reduceMotion ? 0.001 : 0.0035;
        particles.rotation.y = frame * 0.06 + pointer.x * 0.035;
        particles.rotation.x = pointer.y * 0.02;
        core.rotation.x = frame * 0.4;
        core.rotation.y = frame * 0.32;
        grid.position.z = -34 + Math.sin(frame * 0.55) * 0.8;
        camera.position.x += (pointer.x * 2.4 - camera.position.x) * 0.025;
        camera.position.y += (-pointer.y * 1.6 - camera.position.y) * 0.025;
        camera.lookAt(scene.position);
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(renderFrame);
      };

      renderFrame();

      return () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointer);
        scene.remove(particles, grid, core);
        particleGeometry.dispose();
        particleMaterial.dispose();
        core.geometry.dispose();
        coreMaterial.dispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      };
    }, []);

    return h("div", { className: "three-layer", ref: mountRef, "aria-hidden": "true" });
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
          h("h1", null, c.heroTitle),
          h("p", null, c.heroCopy),
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
      automationGoal: formatText(c.contactSummary, { industry: selectedIndustry.label, modules: moduleNames })
    });

    const buildForBusiness = () => {
      const payload = buildSelectionPayload();
      try {
        window.localStorage.setItem("nous-demo-selection", JSON.stringify(payload));
      } catch (error) {
        console.warn("[Nous Interactive Demo] Could not save demo selection", error);
      }
      window.dispatchEvent(new CustomEvent("nous:demo-selection", { detail: payload }));
      document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
      console.log("[Nous Chat] response status", response.status);
      console.log("[Nous Chat] response text", responseText);

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
      console.log("[Nous Chat] send clicked", { message: trimmed });
      console.log("[Nous Chat] NOUS_CONFIG", window.NOUS_CONFIG);

      const chatWebhookUrl = (window.NOUS_CONFIG && window.NOUS_CONFIG.MAKE_CHAT_WEBHOOK_URL || "").trim();
      console.log("[Nous Chat] webhook URL", chatWebhookUrl || "(empty)");

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

        console.log("[Nous Chat] payload", payload);

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
          { className: "footer-logo" },
          h("span", { className: "footer-mark" }, h("img", { src: logoPath, alt: "Nous Systems AI logo", width: 1536, height: 1024, loading: "lazy", decoding: "async", onError: useLogoFallback })),
          h("span", null, c.footer.replace("{year}", String(year)))
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
          ? "Nous Systems AI | AI Συστήματα για Τοπικές Επιχειρήσεις"
          : "Nous Systems AI | AI Systems for Local Businesses";
    }, [lang]);

    return useMemo(
      () =>
        h(
          "div",
          { className: "app-shell" },
          h(ThreeScene),
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
