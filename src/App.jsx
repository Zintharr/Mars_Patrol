import React, { useState, useEffect, useRef } from "react";

// ── AUTH LAYER ────────────────────────────────────────────────────────────────
// ARTIFACT MODE: fully self-contained mock auth + API stubs.
// In your real project, DELETE this block and replace with:
//   import * as Auth from "./supabase-client.js";
// ─────────────────────────────────────────────────────────────────────────────
const _listeners = [];

const Auth = {
  onAuthChange: (cb) => {
    _listeners.push(cb);
    const saved = sessionStorage.getItem("steward_user");
    if (saved) setTimeout(() => cb(JSON.parse(saved), null), 50);
    else setTimeout(() => cb(null, null), 50);
    return { data: { subscription: { unsubscribe: () => {} } } };
  },
  signUp: async (email, password, fullName) => {
    const user = { id: "demo-" + Date.now(), email, user_metadata: { full_name: fullName } };
    sessionStorage.setItem("steward_user", JSON.stringify(user));
    _listeners.forEach(l => l(user, null));
    return user;
  },
  signIn: async (email, password) => {
    const user = { id: "demo-user", email };
    sessionStorage.setItem("steward_user", JSON.stringify(user));
    _listeners.forEach(l => l(user, null));
    return { user };
  },
  signInWithGoogle: async () => {
    const user = { id: "demo-google", email: "demo@google.com" };
    sessionStorage.setItem("steward_user", JSON.stringify(user));
    _listeners.forEach(l => l(user, null));
  },
  signOut: async () => {
    sessionStorage.removeItem("steward_user");
    sessionStorage.removeItem("steward_data");
    _listeners.forEach(l => l(null, null));
  },
  resetPassword: async (email) => { /* no-op in demo */ },

  fetchMe: async () => {
    const saved = sessionStorage.getItem("steward_data");
    const defaults = {
      profile: { streak: 3, selected_path: null, onboarding_done: false },
      subscription: { status: "inactive", plan: null },
      isPremium: false,
      xp: 0,
      lessonsCompleted: [],
      progress: [],
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  },
  updateProfile: async (updates) => {
    const saved = JSON.parse(sessionStorage.getItem("steward_data") || "{}");
    const merged = { ...saved, profile: { ...(saved.profile || {}), ...updates } };
    sessionStorage.setItem("steward_data", JSON.stringify(merged));
    return { profile: merged.profile };
  },
  recordProgress: async (lessonId, score, xpEarned) => {
    const saved = JSON.parse(sessionStorage.getItem("steward_data") || "{}");
    const completed = saved.lessonsCompleted || [];
    if (!completed.includes(lessonId)) completed.push(lessonId);
    const merged = { ...saved, lessonsCompleted: completed, xp: (saved.xp || 0) + xpEarned };
    sessionStorage.setItem("steward_data", JSON.stringify(merged));
    return { progress: { lesson_id: lessonId } };
  },
  createCheckoutSession: async (plan) => {
    const saved = JSON.parse(sessionStorage.getItem("steward_data") || "{}");
    const merged = {
      ...saved,
      isPremium: true,
      subscription: { status: "active", plan },
    };
    sessionStorage.setItem("steward_data", JSON.stringify(merged));
    return { url: null, demo: true, plan };
  },
  openCustomerPortal: async () => {
    alert("In production this opens the Stripe Customer Portal to manage your subscription.");
  },
  restorePurchase: async () => {
    return { restored: false };
  },
};

const FREE_LESSONS = 2;

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300&family=DM+Sans:wght@300;400;500&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --midnight: #1a2d6e; --navy: #1f3480; --navy-mid: #253d94; --navy-light: #2e4aad;
      --gold: #c9a84c; --gold-light: #e8c96a; --gold-dim: #a07c30;
      --ivory: #f5f0e8; --ivory-dim: #cdd5f0; --cream: #faf7f0;
      --red-accent: #8b2635; --green-accent: #2d6a4f; --white: #ffffff;
      --border: rgba(201,168,76,0.25); --border-bright: rgba(201,168,76,0.55);
    }
    html { font-size: 17px; }
    body { background: var(--midnight); font-family: 'DM Sans', sans-serif; font-size: 1rem; color: var(--ivory); min-height: 100vh; overflow-x: hidden; }
    .app-wrapper {
      min-height: 100vh; position: relative;
      background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(201,168,76,0.10) 0%, transparent 60%),
        radial-gradient(ellipse 60% 80% at 0% 100%, rgba(15,25,80,0.7) 0%, transparent 50%),
        linear-gradient(160deg, #1a2d6e 0%, #1f3480 40%, #162660 100%);
    }
    .noise-overlay { position: fixed; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"); pointer-events: none; z-index: 0; opacity: 0.4; }
    .screen { position: relative; z-index: 1; }
    .display-font { font-family: 'Playfair Display', serif; }
    .serif-font { font-family: 'Crimson Pro', serif; }
    .ornament { display: flex; align-items: center; gap: 12px; color: var(--gold-dim); font-size: 13px; letter-spacing: 0.2em; text-transform: uppercase; margin: 16px 0; }
    .ornament::before, .ornament::after { content: ''; flex: 1; height: 1px; background: linear-gradient(90deg, transparent, var(--gold-dim), transparent); }
    .btn-gold { background: linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%); color: var(--midnight); border: none; border-radius: 4px; font-family: 'DM Sans', sans-serif; font-weight: 500; font-size: 16px; letter-spacing: 0.08em; text-transform: uppercase; padding: 14px 32px; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 4px 20px rgba(201,168,76,0.3); }
    .btn-gold:hover { transform: translateY(-1px); box-shadow: 0 8px 28px rgba(201,168,76,0.45); }
    .btn-ghost { background: transparent; color: var(--ivory-dim); border: 1px solid var(--border); border-radius: 4px; font-family: 'DM Sans', sans-serif; font-size: 15px; letter-spacing: 0.05em; padding: 10px 24px; cursor: pointer; transition: all 0.2s ease; }
    .btn-ghost:hover { border-color: var(--border-bright); color: var(--ivory); }
    .card { background: rgba(15,25,90,0.55); border: 1px solid var(--border); border-radius: 8px; backdrop-filter: blur(12px); }
    .card-gold-top { border-top: 2px solid var(--gold); }
    .card-completed { background: rgba(15,25,90,0.55); border: 1px solid var(--gold); border-radius: 8px; backdrop-filter: blur(12px); box-shadow: 0 0 16px rgba(201,168,76,0.18), inset 0 0 24px rgba(201,168,76,0.04); }
    .card-locked { background: rgba(8,14,50,0.65); border: 1px solid rgba(255,255,255,0.08); border-radius: 8px; backdrop-filter: blur(12px); opacity: 0.72; cursor: pointer; transition: opacity 0.2s; position: relative; overflow: hidden; }
    .card-locked:hover { opacity: 0.88; }
    .card-locked::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.015) 4px, rgba(255,255,255,0.015) 8px); pointer-events: none; }
    .plan-card { background: rgba(15,25,90,0.6); border: 2px solid var(--border); border-radius: 10px; padding: 18px 16px; cursor: pointer; transition: all 0.2s ease; position: relative; }
    .plan-card:hover { border-color: var(--border-bright); }
    .plan-card.selected { border-color: var(--gold); background: rgba(201,168,76,0.08); box-shadow: 0 0 20px rgba(201,168,76,0.15); }
    .plan-badge { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); background: linear-gradient(135deg, var(--gold), var(--gold-light)); color: var(--midnight); font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; padding: 3px 12px; border-radius: 99px; }
    .modal-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(5,10,40,0.88); backdrop-filter: blur(8px); display: flex; align-items: flex-end; justify-content: center; }
    .modal-sheet { width: 100%; max-width: 560px; background: linear-gradient(180deg, #1e3280 0%, #162060 100%); border-top: 2px solid var(--gold); border-radius: 20px 20px 0 0; padding: 28px 24px 40px; animation: slideUp 0.35s cubic-bezier(0.32,0.72,0,1) both; max-height: 92vh; overflow-y: auto; }
    .celebration-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(5,10,40,0.85); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
    .celebration-sheet { width: 100%; max-width: 480px; background: linear-gradient(180deg, #1e3280 0%, #162060 100%); border: 1px solid var(--gold); border-radius: 16px; padding: 32px 24px 28px; text-align: center; animation: celebrationPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both; margin: 20px; }
    .next-lesson-preview { background: rgba(201,168,76,0.06); border: 1px solid var(--border-bright); border-radius: 8px; padding: 14px 16px; text-align: left; margin-bottom: 16px; }
    .next-lesson-locked { background: rgba(8,14,50,0.5); border: 1px solid rgba(255,255,255,0.12); border-radius: 8px; padding: 14px 16px; text-align: left; margin-bottom: 16px; position: relative; overflow: hidden; }
    .next-lesson-locked::after { content: ''; position: absolute; inset: 0; background: repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.01) 4px, rgba(255,255,255,0.01) 8px); pointer-events: none; }
    .path-complete-screen { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; }
    .certificate-card { background: linear-gradient(135deg, rgba(25,40,100,0.9) 0%, rgba(15,25,70,0.95) 100%); border: 2px solid var(--gold); border-radius: 16px; padding: 40px 32px; max-width: 440px; width: 100%; position: relative; box-shadow: 0 0 40px rgba(201,168,76,0.2), inset 0 0 60px rgba(201,168,76,0.03); }
    .certificate-card::before { content: ''; position: absolute; inset: 6px; border: 1px solid rgba(201,168,76,0.2); border-radius: 12px; pointer-events: none; }
    .progress-bar-bg { background: rgba(255,255,255,0.06); border-radius: 99px; height: 4px; overflow: hidden; }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, var(--gold), var(--gold-light)); border-radius: 99px; transition: width 0.5s ease; }
    .quiz-option { background: rgba(22,32,64,0.5); border: 1px solid var(--border); border-radius: 6px; padding: 14px 18px; cursor: pointer; transition: all 0.2s ease; display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; }
    .quiz-option:hover { border-color: var(--border-bright); background: rgba(30,45,82,0.7); }
    .quiz-option.selected { border-color: var(--gold); background: rgba(201,168,76,0.1); }
    .quiz-option.correct { border-color: var(--green-accent); background: rgba(45,106,79,0.15); }
    .quiz-option.incorrect { border-color: var(--red-accent); background: rgba(139,38,53,0.15); }
    .scripture-block { border-left: 3px solid var(--gold); padding: 16px 20px; background: rgba(201,168,76,0.05); border-radius: 0 6px 6px 0; margin: 16px 0; }
    .streak-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(201,168,76,0.1); border: 1px solid var(--border-bright); border-radius: 99px; padding: 5px 13px; font-size: 13px; color: var(--gold-light); }
    .completed-badge { display: inline-flex; align-items: center; gap: 6px; background: rgba(201,168,76,0.15); border: 1px solid var(--gold); border-radius: 99px; padding: 4px 12px; font-size: 12px; color: var(--gold-light); font-weight: 500; }
    .premium-badge { display: inline-flex; align-items: center; gap: 5px; background: linear-gradient(135deg, var(--gold), var(--gold-light)); border-radius: 99px; padding: 3px 10px; font-size: 11px; color: var(--midnight); font-weight: 700; letter-spacing: 0.06em; }
    .bottom-nav { position: fixed; bottom: 0; left: 0; right: 0; background: rgba(20,35,100,0.97); border-top: 1px solid var(--border); backdrop-filter: blur(20px); display: flex; z-index: 100; }
    .nav-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 8px; cursor: pointer; font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ivory-dim); transition: color 0.2s; border: none; background: transparent; }
    .nav-item.active { color: var(--gold); }
    .nav-icon { font-size: 20px; }
    .chat-bubble-user { background: rgba(201,168,76,0.15); border: 1px solid var(--border); border-radius: 12px 12px 2px 12px; padding: 11px 15px; max-width: 80%; align-self: flex-end; font-size: 16px; }
    .chat-bubble-ai { background: rgba(15,25,90,0.7); border: 1px solid var(--border); border-radius: 12px 12px 12px 2px; padding: 11px 15px; max-width: 88%; align-self: flex-start; font-size: 16px; line-height: 1.6; }
    @keyframes fadeSlideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    @keyframes completionPop { 0% { transform: scale(0.8); opacity: 0; } 60% { transform: scale(1.06); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    @keyframes celebrationPop { from { transform: scale(0.85); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    @keyframes confettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity: 1; } 100% { transform: translateY(60px) rotate(360deg); opacity: 0; } }
    @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 20px rgba(201,168,76,0.2); } 50% { box-shadow: 0 0 40px rgba(201,168,76,0.45); } }
    .confetti-dot { position: absolute; width: 8px; height: 8px; border-radius: 2px; animation: confettiFall 1.2s ease-in both; }
    .fade-up { animation: fadeSlideUp 0.45s ease both; }
    .fade-up-delay { animation: fadeSlideUp 0.45s 0.15s ease both; }
    .fade-up-delay2 { animation: fadeSlideUp 0.45s 0.3s ease both; }
    .fade-up-delay3 { animation: fadeSlideUp 0.45s 0.45s ease both; }
    .completion-pop { animation: completionPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }
    .glow-pulse { animation: glowPulse 2.5s ease-in-out infinite; }
    .shimmer-text { background: linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 40%, var(--gold) 80%); background-size: 200% auto; -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; animation: shimmer 3s linear infinite; }
  `}</style>
);

// ── DATA ──────────────────────────────────────────────────────────────────────

const ONBOARDING_QUESTIONS = [
  { id: "goal", question: "What is your primary financial desire?", options: [{ id: "debt", label: "Break free from debt", icon: "⛓️" }, { id: "wealth", label: "Build generational wealth", icon: "🌿" }, { id: "giving", label: "Give more generously", icon: "🙏" }, { id: "steward", label: "Become a wise steward", icon: "⚖️" }] },
  { id: "experience", question: "How would you describe your financial foundation?", options: [{ id: "beginner", label: "Starting from scratch", icon: "🌱" }, { id: "some", label: "Some basics, need structure", icon: "📖" }, { id: "solid", label: "Solid habits, want to grow", icon: "🌳" }, { id: "advanced", label: "Ready for advanced stewardship", icon: "🏛️" }] },
  { id: "obstacle", question: "What holds you back most?", options: [{ id: "discipline", label: "Lack of discipline / consistency", icon: "😓" }, { id: "knowledge", label: "Don't know where to start", icon: "🔍" }, { id: "fear", label: "Fear and anxiety about money", icon: "😟" }, { id: "faith", label: "Haven't connected faith to finances", icon: "✝️" }] },
];

const LEARNING_PATHS = {
  debt: { name: "The Freedom Path", tagline: "Breaking every financial chain", icon: "⛓️→🕊️" },
  wealth: { name: "The Inheritance Path", tagline: "Planting trees for generations", icon: "🌿" },
  giving: { name: "The Generosity Path", tagline: "The cheerful giver's journey", icon: "🙏" },
  steward: { name: "The Steward's Path", tagline: "Managing what God entrusted", icon: "⚖️" },
};

const PLANS = [
  { id: "weekly", label: "Weekly", price: "$6.99", per: "/ week", perDay: "$1.00 / day", note: "" },
  { id: "monthly", label: "Monthly", price: "$19.99", per: "/ month", perDay: "$0.67 / day", best: true },
  { id: "annual", label: "Annual", price: "$59.99", per: "/ year", perDay: "$0.16 / day", note: "Save 64%" },
];

const LESSONS = [
  { id: 1, free: true, title: "You Don't Own It", subtitle: "The Foundation of Biblical Stewardship", duration: "4 min",
    scripture: { text: "The earth is the Lord's, and everything in it, the world, and all who live in it.", ref: "Psalm 24:1 (NIV)" },
    content: `Everything shifts when we realize a simple truth: we are not owners — we are managers. Every dollar in your account, every investment, every asset belongs ultimately to God. He has simply entrusted it to your care for a season.\n\nThis changes everything about how we handle money. An owner says "It's mine, I'll do what I want." A steward says "How does my Master want this managed?"\n\nThe wealthiest people in Scripture — Abraham, Solomon, Job — understood this. Their prosperity didn't make them owners; it made them responsible stewards of greater resources.\n\nThis is not about guilt. It's about freedom. When you stop carrying the burden of ownership and pick up the joy of stewardship, financial stress transforms into financial purpose.`,
    quiz: [
      { question: "According to Psalm 24:1, who is the ultimate owner of all things?", options: ["Those who work hardest for it", "God — the Lord", "The government", "Whoever earns it"], correct: 1, explanation: "God is the owner of everything. We are stewards — trusted managers of what He has placed in our care." },
      { question: "What is the key difference between an owner and a steward?", options: ["Owners have more money", "Stewards ask how God wants resources managed", "Owners give more to charity", "Stewards avoid investing"], correct: 1, explanation: "A steward's mindset asks 'How does my Master want this managed?' — shifting from self-focus to God-focus." },
      { question: "Which biblical figures exemplified faithful stewardship of great wealth?", options: ["Judas Iscariot", "Ananias", "Abraham, Solomon, and Job", "The rich young ruler"], correct: 2, explanation: "Abraham, Solomon, and Job were all wealthy men who understood that their prosperity came from God and required faithful management." }
    ], xp: 50 },
  { id: 2, free: true, title: "The Tithe Is a Test", subtitle: "Why God Asks for the First 10%", duration: "5 min",
    scripture: { text: "Bring the whole tithe into the storehouse... Test me in this, says the Lord Almighty, and see if I will not throw open the floodgates of heaven.", ref: "Malachi 3:10 (NIV)" },
    content: `God doesn't need your money. He owns the cattle on a thousand hills. So why does He ask for a tithe?\n\nThe tithe is not a tax. It's a trust exercise. God is asking a direct question with every paycheck: "Do you trust Me more than you trust this money?"\n\nThe first 10% — given off the top, before bills, before savings — is an act of faith that says "God, You are my source, not my salary." It rewires your relationship with money from fearful hoarding to confident generosity.\n\nHistorically, tithing cultures created extraordinary generosity ecosystems. Churches, hospitals, universities — nearly every major charitable institution in Western history was funded by tithing communities.\n\nPractically: Start where you are. If 10% feels impossible, start with 5% and grow toward the full tithe. God honors the direction as much as the destination.`,
    quiz: [
      { question: "In Malachi 3:10, God describes the tithe as a kind of what?", options: ["Tax obligation", "Test of faith", "Suggestion", "Old covenant law only"], correct: 1, explanation: "God explicitly invites us to 'test' Him — the tithe is an act of faith and trust, not mere obligation." },
      { question: "When should the tithe ideally be given?", options: ["After all bills are paid", "At the end of the year", "Off the top — first, before expenses", "When financially comfortable"], correct: 2, explanation: "The 'firstfruits' principle means giving off the top — before other expenses — as an act of trust that God will provide." },
      { question: "What does consistent tithing primarily rewire in a believer?", options: ["Their credit score", "Their relationship with money — from hoarding to generosity", "Their tax liability", "Their investment returns"], correct: 1, explanation: "Tithing is a spiritual discipline that transforms our heart posture from fearful hoarding to confident, joyful generosity." }
    ], xp: 60 },
  { id: 3, free: false, title: "Debt: Borrower Is Slave to Lender", subtitle: "Understanding Debt Through a Biblical Lens", duration: "6 min",
    scripture: { text: "The rich rule over the poor, and the borrower is slave to the lender.", ref: "Proverbs 22:7 (NIV)" },
    content: `Solomon didn't mince words. Debt is a form of slavery. Every payment you make is labor owed to someone else — reducing your freedom, your options, and your margin to be generous.\n\nThis doesn't mean all debt is sinful. A mortgage on a home or a business loan can be strategic stewardship. The question is: does this debt serve your purpose, or does it own you?\n\nConsumer debt — credit cards, car loans on depreciating assets, "buy now pay later" traps — almost never serves a stewardship purpose. It trades future freedom for present comfort.\n\nThe biblical path out of debt:\n1. Stop digging the hole — eliminate new consumer debt\n2. Build a small emergency fund ($1,000–$2,000) as a buffer\n3. Attack the smallest debt first (the "snowball" method builds momentum)\n4. As each debt dies, roll that payment to the next one\n\nThis is not just financial math. It is a spiritual warfare strategy against the spirit of mammon that wants to keep God's people in financial bondage.`,
    quiz: [
      { question: "Proverbs 22:7 describes the borrower's relationship to the lender as:", options: ["A partnership", "A burden", "Slavery", "A blessing"], correct: 2, explanation: "The Bible uses the word 'slave' — debt reduces our freedom to serve God fully and give generously." },
      { question: "Which type of debt can sometimes be strategic stewardship?", options: ["Credit card debt for vacations", "Buy-now-pay-later purchases", "A mortgage or business loan", "Any debt under $1,000"], correct: 2, explanation: "Not all debt is sinful. A mortgage or business loan can serve a stewardship purpose — the key is whether the debt serves you or owns you." },
      { question: "What is the first step in the biblical path out of debt?", options: ["Consolidate all loans into one", "Stop accumulating new consumer debt", "Sell your home to pay it off", "Declare bankruptcy"], correct: 1, explanation: "Before paying down existing debt, you must stop digging the hole deeper. Eliminating new consumer debt is the essential first step." }
    ], xp: 65 },
];

// ── CELEBRATION MODAL ─────────────────────────────────────────────────────────
function CelebrationModal({ lesson, xpEarned, nextLesson, nextIsLocked, allComplete, onNextLesson, onUnlockNext, onGoHome, totalXp, streak }) {
  const colors = ["#c9a84c","#e8c96a","#fff","#4a6fa5","#2d6a4f"];
  const dots = Array.from({ length: 16 }, (_, i) => ({ left: `${5 + Math.random() * 90}%`, delay: `${Math.random() * 0.7}s`, color: colors[i % 5], size: `${5 + Math.random() * 7}px` }));

  return (
    <div className="celebration-overlay">
      <div className="celebration-sheet" style={{ position: "relative", overflow: "hidden" }}>
        {dots.map((d, i) => <div key={i} className="confetti-dot" style={{ left: d.left, top: "-10px", width: d.size, height: d.size, background: d.color, animationDelay: d.delay }} />)}

        <div style={{ fontSize: 52, marginBottom: 8 }}>{allComplete ? "🏆" : "🎉"}</div>
        <h2 className="display-font shimmer-text" style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>
          {allComplete ? "Path Complete!" : "Lesson Complete!"}
        </h2>
        <p className="serif-font" style={{ fontSize: 16, color: "var(--ivory-dim)", fontStyle: "italic", marginBottom: 16, lineHeight: 1.4 }}>"{lesson.title}"</p>

        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginBottom: 20 }}>
          <div style={{ textAlign: "center" }}>
            <div className="display-font" style={{ fontSize: 26, fontWeight: 700, color: "var(--gold)" }}>+{xpEarned}</div>
            <div style={{ fontSize: 11, color: "var(--ivory-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>XP</div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ textAlign: "center" }}>
            <div className="display-font" style={{ fontSize: 26, fontWeight: 700, color: "var(--gold)" }}>{totalXp}</div>
            <div style={{ fontSize: 11, color: "var(--ivory-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>Total XP</div>
          </div>
          <div style={{ width: 1, background: "var(--border)" }} />
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 22 }}>🔥</div>
            <div style={{ fontSize: 11, color: "var(--ivory-dim)", letterSpacing: "0.1em", textTransform: "uppercase" }}>{streak} Days</div>
          </div>
        </div>

        <div className="scripture-block" style={{ marginBottom: 20, textAlign: "left" }}>
          <p className="serif-font" style={{ fontSize: 14, fontStyle: "italic", color: "var(--ivory-dim)", lineHeight: 1.6 }}>
            "Well done, good and faithful servant! You have been faithful with a few things; I will put you in charge of many things."
          </p>
          <p style={{ fontSize: 12, color: "var(--gold)", marginTop: 4 }}>— Matthew 25:21 (NIV)</p>
        </div>

        {nextLesson && !nextIsLocked && (
          <div className="next-lesson-preview">
            <p style={{ fontSize: 11, color: "var(--gold-dim)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>Up next · Lesson {nextLesson.id}</p>
            <p className="display-font" style={{ fontSize: 16, fontWeight: 600, color: "var(--ivory)", marginBottom: 2 }}>{nextLesson.title}</p>
            <p className="serif-font" style={{ fontSize: 14, fontStyle: "italic", color: "var(--ivory-dim)", lineHeight: 1.4 }}>"{nextLesson.scripture.text}"</p>
            <p style={{ fontSize: 12, color: "var(--gold)", marginTop: 4 }}>— {nextLesson.scripture.ref}</p>
          </div>
        )}

        {nextLesson && nextIsLocked && (
          <div className="next-lesson-locked">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, position: "relative", zIndex: 1 }}>
              <span style={{ fontSize: 20 }}>🔒</span>
              <div>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 2 }}>Premium · Lesson {nextLesson.id}</p>
                <p className="display-font" style={{ fontSize: 16, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>{nextLesson.title}</p>
              </div>
              <span className="premium-badge" style={{ marginLeft: "auto", flexShrink: 0 }}>⭐ Pro</span>
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)", fontStyle: "italic", position: "relative", zIndex: 1 }}>Unlock to continue your journey →</p>
          </div>
        )}

        {allComplete && (
          <div style={{ background: "rgba(201,168,76,0.08)", border: "1px solid var(--border-bright)", borderRadius: 8, padding: "14px 16px", marginBottom: 16, textAlign: "left" }}>
            <p style={{ fontSize: 14, color: "var(--gold-light)", fontWeight: 500, marginBottom: 4 }}>🎓 You've completed all available lessons!</p>
            <p style={{ fontSize: 13, color: "var(--ivory-dim)", lineHeight: 1.5 }}>New lessons are being written. Check back soon — your stewardship journey is just beginning.</p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {nextLesson && !nextIsLocked && (
            <button className="btn-gold" style={{ width: "100%" }} onClick={onNextLesson}>
              Start Lesson {nextLesson.id} →
            </button>
          )}
          {nextLesson && nextIsLocked && (
            <button className="btn-gold" style={{ width: "100%" }} onClick={onUnlockNext}>
              Unlock to Continue →
            </button>
          )}
          {allComplete && (
            <button className="btn-gold" style={{ width: "100%" }} onClick={onGoHome}>
              View My Progress →
            </button>
          )}
          <button className="btn-ghost" style={{ width: "100%" }} onClick={onGoHome}>
            {allComplete ? "Return Home" : "Go to Home"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PAYWALL SCREEN ────────────────────────────────────────────────────────────
function PaywallScreen({ onSubscribe, onRestore, onDismiss, triggeredByLesson }) {
  const [selected, setSelected] = React.useState('monthly');
  const [loading, setLoading]   = React.useState(false);
  const teaser = triggeredByLesson ? LESSONS.find(l => l.id === triggeredByLesson) : null;

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await onSubscribe(selected);
    } catch { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onDismiss()}>
      <div className="modal-sheet">
        <div style={{ width: 40, height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 99, margin: '0 auto 24px' }} />
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 44, marginBottom: 8 }}>🔓</div>
          <h2 className="display-font shimmer-text" style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>Unlock Full Access</h2>
          <p style={{ fontSize: 15, color: 'var(--ivory-dim)', lineHeight: 1.5 }}>Continue your discipleship journey with all 12 lessons, challenges, and unlimited AI Stewardship guidance.</p>
        </div>
        {teaser && (
          <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid var(--border-bright)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <p style={{ fontSize: 12, color: 'var(--gold-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>You were about to start</p>
            <p className="display-font" style={{ fontSize: 17, fontWeight: 600, color: 'var(--ivory)', marginBottom: 4 }}>{teaser.title}</p>
            <p className="serif-font" style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--ivory-dim)', lineHeight: 1.4 }}>"{teaser.scripture.text}"</p>
            <p style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>— {teaser.scripture.ref}</p>
          </div>
        )}
        <div className="card" style={{ padding: '14px 16px', marginBottom: 16 }}>
          {[['📖','All 12 Scripture-anchored lessons'],['⚖️','Unlimited AI Stewardship Guide'],['🏆','28-Day Discipleship Challenge'],['📜','Completion certificates'],['🔥','Streak tracking & daily reminders'],['💬','Community discussion (coming soon)']].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: 15, color: 'var(--ivory)' }}>{text}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--green-accent)', fontSize: 15 }}>✓</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {PLANS.map(plan => (
            <div key={plan.id} className={`plan-card ${selected === plan.id ? 'selected' : ''}`} onClick={() => setSelected(plan.id)}>
              {plan.best && <div className="plan-badge">Most Popular</div>}
              {plan.note && !plan.best && <div style={{ position: 'absolute', top: -11, right: 16, background: 'var(--green-accent)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99 }}>{plan.note}</div>}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div><p style={{ fontSize: 16, fontWeight: 600, color: selected === plan.id ? 'var(--gold)' : 'var(--ivory)', marginBottom: 2 }}>{plan.label}</p><p style={{ fontSize: 13, color: 'var(--ivory-dim)' }}>{plan.perDay}</p></div>
                <div style={{ flex: 1, textAlign: 'right' }}><span className="display-font" style={{ fontSize: 22, fontWeight: 700, color: selected === plan.id ? 'var(--gold)' : 'var(--ivory)' }}>{plan.price}</span><span style={{ fontSize: 13, color: 'var(--ivory-dim)', marginLeft: 4 }}>{plan.per}</span></div>
                <div style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${selected === plan.id ? 'var(--gold)' : 'var(--border)'}`, background: selected === plan.id ? 'var(--gold)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginLeft: 12, fontSize: 12, color: 'var(--midnight)' }}>{selected === plan.id ? '✓' : ''}</div>
              </div>
            </div>
          ))}
        </div>
        <button className="btn-gold" style={{ width: '100%', marginBottom: 12, fontSize: 17 }} onClick={handleSubscribe} disabled={loading}>
          {loading ? 'Redirecting to checkout…' : `Start ${PLANS.find(p => p.id === selected)?.label} Plan`}
        </button>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {['Cancel anytime','Secure payment','God-honoring mission'].map(t => (
            <span key={t} style={{ fontSize: 12, color: 'var(--ivory-dim)', display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ color: 'var(--gold)', fontSize: 10 }}>✦</span> {t}</span>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button onClick={onDismiss} style={{ background: 'none', border: 'none', color: 'var(--ivory-dim)', fontSize: 14, cursor: 'pointer', textDecoration: 'underline', marginRight: 16 }}>Maybe later</button>
          <button onClick={onRestore} style={{ background: 'none', border: 'none', color: 'var(--ivory-dim)', fontSize: 14, cursor: 'pointer', textDecoration: 'underline' }}>Restore purchase</button>
        </div>
      </div>
    </div>
  );
}

// ── AUTH SCREENS ──────────────────────────────────────────────────────────────
function AuthScreens({ screen, setScreen, onSuccess }) {
  const [email, setEmail]       = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName]         = React.useState('');
  const [loading, setLoading]   = React.useState(false);
  const [error, setError]       = React.useState('');
  const [msg, setMsg]           = React.useState('');

  const inputStyle = { width: '100%', background: 'rgba(15,25,90,0.8)', border: '1px solid var(--border)', borderRadius: 6, padding: '13px 14px', color: 'var(--ivory)', fontSize: 16, fontFamily: 'DM Sans', outline: 'none', marginBottom: 12 };

  const handleSignIn = async () => {
    setLoading(true); setError('');
    try {
      const { user } = await Auth.signIn(email, password);
      onSuccess(user);
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleSignUp = async () => {
    setLoading(true); setError('');
    try {
      await Auth.signUp(email, password, name);
      setMsg('Check your email to confirm your account, then sign in.');
      setScreen('login');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleForgot = async () => {
    setLoading(true); setError('');
    try {
      await Auth.resetPassword(email);
      setMsg('Password reset email sent. Check your inbox.');
    } catch (e) { setError(e.message); }
    setLoading(false);
  };

  const handleGoogle = async () => {
    try { await Auth.signInWithGoogle(); } catch (e) { setError(e.message); }
  };

  return (
    <div className="app-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 24px' }}>
      <div className="noise-overlay" />
      <div className="screen" style={{ maxWidth: 420, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>⚖️</div>
          <h1 className="display-font shimmer-text" style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>Steward</h1>
          <p style={{ fontSize: 15, color: 'var(--ivory-dim)' }}>
            {screen === 'login' ? 'Sign in to continue your journey' : screen === 'signup' ? 'Create your account' : 'Reset your password'}
          </p>
        </div>

        {error && <div style={{ background: 'rgba(139,38,53,0.2)', border: '1px solid var(--red-accent)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#f87171' }}>{error}</div>}
        {msg   && <div style={{ background: 'rgba(45,106,79,0.2)', border: '1px solid var(--green-accent)', borderRadius: 6, padding: '10px 14px', marginBottom: 16, fontSize: 14, color: '#86efac' }}>{msg}</div>}

        {screen === 'signup' && (
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Full name" style={inputStyle} />
        )}
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" type="email" style={inputStyle} />
        {screen !== 'forgot' && (
          <input value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" type="password" style={{ ...inputStyle, marginBottom: 20 }}
            onKeyDown={e => e.key === 'Enter' && (screen === 'login' ? handleSignIn() : handleSignUp())} />
        )}
        {screen === 'forgot' && <div style={{ marginBottom: 20 }} />}

        {screen === 'login' && (
          <>
            <button className="btn-gold" style={{ width: '100%', marginBottom: 12 }} onClick={handleSignIn} disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
            <button onClick={handleGoogle} style={{ width: '100%', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', borderRadius: 4, padding: '13px', color: 'var(--ivory)', fontSize: 15, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
              <span>G</span> Continue with Google
            </button>
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => { setScreen('signup'); setError(''); setMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--ivory-dim)', fontSize: 14, cursor: 'pointer' }}>
                Don't have an account? <span style={{ color: 'var(--gold)' }}>Sign up free</span>
              </button>
              <button onClick={() => { setScreen('forgot'); setError(''); setMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--gold-dim)', fontSize: 13, cursor: 'pointer' }}>Forgot password?</button>
            </div>
          </>
        )}

        {screen === 'signup' && (
          <>
            <button className="btn-gold" style={{ width: '100%', marginBottom: 16 }} onClick={handleSignUp} disabled={loading}>
              {loading ? 'Creating account…' : 'Create Account'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => { setScreen('login'); setError(''); setMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--ivory-dim)', fontSize: 14, cursor: 'pointer' }}>
                Already have an account? <span style={{ color: 'var(--gold)' }}>Sign in</span>
              </button>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ivory-dim)', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
              By creating an account you agree to our Terms of Service and Privacy Policy.
            </p>
          </>
        )}

        {screen === 'forgot' && (
          <>
            <button className="btn-gold" style={{ width: '100%', marginBottom: 16 }} onClick={handleForgot} disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Email'}
            </button>
            <div style={{ textAlign: 'center' }}>
              <button onClick={() => { setScreen('login'); setError(''); setMsg(''); }} style={{ background: 'none', border: 'none', color: 'var(--gold-dim)', fontSize: 14, cursor: 'pointer' }}>← Back to sign in</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── PATH COMPLETE SCREEN ──────────────────────────────────────────────────────
function PathCompleteScreen({ path, totalXp, completedCount, isPremium, streak, onUnlock, onGoHome }) {
  return (
    <div className="app-wrapper">
      <div className="noise-overlay" />
      <div className="screen path-complete-screen">
        <div style={{ fontSize: 64, marginBottom: 16 }}>🏆</div>
        <h1 className="display-font shimmer-text" style={{ fontSize: 40, fontWeight: 700, marginBottom: 8 }}>Path Complete</h1>
        <p className="serif-font" style={{ fontSize: 20, color: 'var(--ivory-dim)', fontStyle: 'italic', marginBottom: 32 }}>{path.tagline}</p>
        <div className="certificate-card" style={{ marginBottom: 32 }}>
          <div style={{ fontSize: 13, letterSpacing: '0.25em', color: 'var(--gold-dim)', textTransform: 'uppercase', marginBottom: 16 }}>Certificate of Completion</div>
          <div className="display-font" style={{ fontSize: 28, fontWeight: 700, color: 'var(--gold)', marginBottom: 8 }}>{path.name}</div>
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, var(--gold-dim), transparent)', margin: '16px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginBottom: 16 }}>
            <div style={{ textAlign: 'center' }}>
              <div className="display-font" style={{ fontSize: 32, fontWeight: 700, color: 'var(--gold)' }}>{totalXp}</div>
              <div style={{ fontSize: 12, color: 'var(--ivory-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Total XP</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div className="display-font" style={{ fontSize: 32, fontWeight: 700, color: 'var(--gold)' }}>{completedCount}</div>
              <div style={{ fontSize: 12, color: 'var(--ivory-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lessons</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28 }}>🔥</div>
              <div style={{ fontSize: 12, color: 'var(--ivory-dim)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{streak} Days</div>
            </div>
          </div>
          <p className="serif-font" style={{ fontSize: 15, color: 'var(--ivory-dim)', fontStyle: 'italic', lineHeight: 1.6 }}>
            "Well done, good and faithful servant."
          </p>
          <p style={{ fontSize: 13, color: 'var(--gold)', marginTop: 4 }}>— Matthew 25:23</p>
        </div>
        {!isPremium && (
          <button className="btn-gold" style={{ width: '100%', maxWidth: 360, marginBottom: 12 }} onClick={onUnlock}>
            Unlock All 12 Lessons →
          </button>
        )}
        <button className="btn-ghost" style={{ width: '100%', maxWidth: 360 }} onClick={onGoHome}>
          Return Home
        </button>
      </div>
    </div>
  );
}

// ── BOTTOM NAV ────────────────────────────────────────────────────────────────
function BottomNav({ active, setScreen }) {
  const items = [
    { id: 'home', icon: '🏛️', label: 'Home' },
    { id: 'lesson', icon: '📖', label: 'Lessons', action: 'home' },
    { id: 'chat', icon: '⚖️', label: 'Guide' },
    { id: 'progress', icon: '📊', label: 'Progress' },
  ];
  return (
    <div className="bottom-nav">
      {items.map(item => (
        <button key={item.id} className={`nav-item ${active === item.id ? 'active' : ''}`} onClick={() => setScreen(item.action || item.id)}>
          <span className="nav-icon">{item.icon}</span><span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
export default function StewardApp() {
  // ── AUTH STATE ─────────────────────────────────────────────
  const [authUser, setAuthUser]       = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authScreen, setAuthScreen]   = useState('login');

  // ── APP STATE ──────────────────────────────────────────────
  const [screen, setScreen]               = useState('splash');
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [answers, setAnswers]             = useState({});
  const [selectedPath, setSelectedPath]   = useState(null);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [quizStep, setQuizStep]           = useState(0);
  const [quizAnswers, setQuizAnswers]     = useState({});
  const [quizRevealed, setQuizRevealed]   = useState({});
  const [completedLessons, setCompletedLessons] = useState([]);
  const [xp, setXp]                       = useState(0);
  const [streak, setStreak]               = useState(0);
  const [isPremium, setIsPremium]         = useState(false);
  const [subscription, setSubscription]   = useState(null);
  const [showPaywall, setShowPaywall]     = useState(false);
  const [paywallTriggeredBy, setPaywallTriggeredBy] = useState(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [justCompletedLesson, setJustCompletedLesson] = useState(null);
  const [celebrationNextLesson, setCelebrationNextLesson] = useState(null);
  const [chatMessages, setChatMessages]   = useState([{ role: 'ai', text: 'Shalom. I am your Stewardship Guide — rooted in Scripture, grounded in practical wisdom. Ask me anything about biblical finances, tithing, debt, generosity, or building wealth God\'s way.' }]);
  const [chatInput, setChatInput]   = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // ── AUTH LISTENER ──────────────────────────────────────────
  useEffect(() => {
    const { data: { subscription: sub } } = Auth.onAuthChange(async (user) => {
      setAuthUser(user);
      if (user) {
        await loadUserData();
        const params = new URLSearchParams(window.location.search);
        if (params.get('checkout') === 'canceled') {
          window.history.replaceState({}, '', '/');
        }
      }
      setAuthLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session_id')) {
      loadUserData().then(() => {
        window.history.replaceState({}, '', '/');
        setShowPaywall(false);
      });
    }
  }, []);

  useEffect(() => {
    if (chatBottomRef.current) chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // ── LOAD USER DATA ─────────────────────────────────────────
  async function loadUserData() {
    try {
      const data = await Auth.fetchMe();
      setIsPremium(data.isPremium);
      setSubscription(data.subscription);
      setXp(data.xp);
      setCompletedLessons(data.lessonsCompleted);
      setStreak(data.profile.streak ?? 0);
      if (data.profile.selected_path) setSelectedPath(data.profile.selected_path);
      if (data.profile.onboarding_done) {
        setScreen('home');
      }
    } catch (err) {
      console.error('loadUserData error:', err);
    }
  }

  // ── HELPERS ────────────────────────────────────────────────
  const isLocked = (lesson) => !lesson.free && !isPremium;

  const handleLessonTap = (lesson) => {
    if (isLocked(lesson)) { setPaywallTriggeredBy(lesson.id); setShowPaywall(true); }
    else { setCurrentLesson(lesson); setScreen('lesson'); }
  };

  const handleSubscribe = async (plan) => {
    try {
      const result = await Auth.createCheckoutSession(plan);
      if (result.demo) {
        await loadUserData();
        setShowPaywall(false);
        setPaywallTriggeredBy(null);
      } else if (result.url) {
        window.location.href = result.url;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      alert('Could not start checkout. Please try again.');
    }
  };

  const handleRestore = async () => {
    try {
      const result = await Auth.restorePurchase();
      if (result.restored) {
        await loadUserData();
        setShowPaywall(false);
        alert(`Subscription restored! Plan: ${result.plan}`);
      } else {
        alert('No active subscription found for this account.');
      }
    } catch (err) {
      alert('Restore failed. Please contact support.');
    }
  };

  const handleUnlockDismiss = () => {
    setShowPaywall(false);
    setPaywallTriggeredBy(null);
  };

  const handleNextFromCelebration = () => {
    setShowCelebration(false);
    setJustCompletedLesson(null);
    if (celebrationNextLesson) {
      setCelebrationNextLesson(null);
      setCurrentLesson(celebrationNextLesson);
      setQuizStep(0); setQuizAnswers({}); setQuizRevealed({});
      setScreen('lesson');
    } else {
      setScreen('home');
    }
  };

  const handleUnlockFromCelebration = () => {
    setShowCelebration(false);
    setJustCompletedLesson(null);
    if (celebrationNextLesson) {
      setPaywallTriggeredBy(celebrationNextLesson.id);
      setCelebrationNextLesson(null);
      setShowPaywall(true);
    }
  };

  const handleCelebrationGoHome = () => {
    setShowCelebration(false);
    setJustCompletedLesson(null);
    setCelebrationNextLesson(null);
    const available = LESSONS.filter(l => l.free || isPremium);
    const allDone   = available.every(l => completedLessons.includes(l.id));
    setScreen(allDone ? 'path-complete' : 'home');
  };

  // ── AUTH LOADING ───────────────────────────────────────────
  if (authLoading) return (
    <><GlobalStyles />
    <div className="app-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="noise-overlay" />
      <div className="screen" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚖️</div>
        <p className="display-font shimmer-text" style={{ fontSize: 24, fontWeight: 700 }}>Steward</p>
        <p style={{ fontSize: 14, color: 'var(--ivory-dim)', marginTop: 8 }}>Loading your journey…</p>
      </div>
    </div></>
  );

  // ── AUTH SCREENS ───────────────────────────────────────────
  if (!authUser) return (
    <><GlobalStyles />
    <AuthScreens
      screen={authScreen}
      setScreen={setAuthScreen}
      onSuccess={async (user) => {
        setAuthUser(user);
        await loadUserData();
      }}
    /></>
  );

  // ── SPLASH ─────────────────────────────────────────────────
  if (screen === 'splash') return (
    <><GlobalStyles />
    <div className="app-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '40px 24px', textAlign: 'center' }}>
      <div className="noise-overlay" />
      <div className="screen" style={{ maxWidth: 420, width: '100%' }}>
        <div className="fade-up" style={{ marginBottom: 8, fontSize: 14, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'var(--gold-dim)' }}>✦ A Faith-Based Financial Discipleship Platform ✦</div>
        <div className="fade-up" style={{ fontSize: 72, marginBottom: 8 }}>⚖️</div>
        <h1 className="display-font fade-up shimmer-text" style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, marginBottom: 12 }}>Steward</h1>
        <p className="serif-font fade-up-delay" style={{ fontSize: 22, color: 'var(--ivory-dim)', fontStyle: 'italic', marginBottom: 8, lineHeight: 1.5 }}>"Well done, good and faithful servant."</p>
        <p className="fade-up-delay" style={{ fontSize: 13, color: 'var(--gold-dim)', letterSpacing: '0.2em' }}>MATTHEW 25:23</p>
        <div className="ornament fade-up-delay" style={{ marginTop: 40, marginBottom: 32 }}>Biblical Wisdom for Modern Finances</div>
        <div className="fade-up-delay2" style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 40 }}>
          {[['✦','Scripture-anchored micro-lessons'],['✦','Personalized discipleship paths'],['✦','AI Stewardship Guide — ask anything'],['✦','Debt, tithing, wealth & generosity']].map(([icon, text]) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left' }}>
              <span style={{ color: 'var(--gold)', fontSize: 12 }}>{icon}</span>
              <span style={{ fontSize: 16, color: 'var(--ivory-dim)' }}>{text}</span>
            </div>
          ))}
        </div>
        <button className="btn-gold fade-up-delay2" style={{ width: '100%' }} onClick={() => setScreen('onboarding')}>Begin My Stewardship Journey</button>
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--gold-dim)' }} className="fade-up-delay2">2 free lessons • No credit card required</p>
      </div>
    </div></>
  );

  // ── ONBOARDING ─────────────────────────────────────────────
  if (screen === 'onboarding') {
    const q = ONBOARDING_QUESTIONS[onboardingStep];
    const progress = (onboardingStep / ONBOARDING_QUESTIONS.length) * 100;
    const handleAnswer = async (optionId) => {
      const newAnswers = { ...answers, [q.id]: optionId };
      setAnswers(newAnswers);
      if (onboardingStep < ONBOARDING_QUESTIONS.length - 1) {
        setTimeout(() => setOnboardingStep(s => s + 1), 250);
      } else {
        const path = newAnswers.goal || 'steward';
        setSelectedPath(path);
        await Auth.updateProfile({ selected_path: path, onboarding_done: true }).catch(console.error);
        setTimeout(() => setScreen('path-reveal'), 300);
      }
    };
    return (
      <><GlobalStyles />
      <div className="app-wrapper" style={{ minHeight: '100vh', padding: '48px 24px 32px' }}>
        <div className="noise-overlay" />
        <div className="screen" style={{ maxWidth: 480, margin: '0 auto' }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, letterSpacing: '0.15em', color: 'var(--gold-dim)', textTransform: 'uppercase' }}>Question {onboardingStep + 1} of {ONBOARDING_QUESTIONS.length}</span>
              <div className="streak-badge">🔥 {streak} day streak</div>
            </div>
            <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${progress}%` }} /></div>
          </div>
          <div className="fade-up">
            <p className="display-font" style={{ fontSize: 28, fontWeight: 600, lineHeight: 1.3, marginBottom: 32, color: 'var(--ivory)' }}>{q.question}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {q.options.map(opt => (
                <button key={opt.id} className={`quiz-option ${answers[q.id] === opt.id ? 'selected' : ''}`} onClick={() => handleAnswer(opt.id)}>
                  <span style={{ fontSize: 22 }}>{opt.icon}</span><span style={{ fontSize: 16, color: 'var(--ivory)' }}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div></>
    );
  }

  // ── PATH REVEAL ────────────────────────────────────────────
  if (screen === 'path-reveal') {
    const path = LEARNING_PATHS[selectedPath] || LEARNING_PATHS.steward;
    return (
      <><GlobalStyles />
      <div className="app-wrapper" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
        <div className="noise-overlay" />
        <div className="screen" style={{ maxWidth: 420, width: '100%', textAlign: 'center' }}>
          <div className="fade-up" style={{ fontSize: 64, marginBottom: 16 }}>{path.icon}</div>
          <div className="fade-up" style={{ fontSize: 13, letterSpacing: '0.25em', color: 'var(--gold-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Your Discipleship Path</div>
          <h2 className="display-font fade-up shimmer-text" style={{ fontSize: 40, fontWeight: 700, marginBottom: 8 }}>{path.name}</h2>
          <p className="serif-font fade-up-delay" style={{ fontSize: 20, color: 'var(--ivory-dim)', fontStyle: 'italic', marginBottom: 40 }}>{path.tagline}</p>
          <div className="card card-gold-top fade-up-delay" style={{ padding: '24px', marginBottom: 32, textAlign: 'left' }}>
            <p style={{ fontSize: 16, color: 'var(--ivory-dim)', lineHeight: 1.7 }}>Based on your answers, we have tailored a Scripture-rooted journey designed to transform your relationship with money — from the inside out. Your path includes <strong style={{ color: 'var(--gold)' }}>12 core lessons</strong>, daily application challenges, and unlimited AI Stewardship guidance.</p>
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(201,168,76,0.08)', borderRadius: 6, border: '1px solid var(--border)' }}>
              <p style={{ fontSize: 14, color: 'var(--gold-light)' }}>✦ Lessons 1–2 are free to start. Unlock all 12 with a Steward subscription.</p>
            </div>
          </div>
          <button className="btn-gold fade-up-delay2" style={{ width: '100%' }} onClick={() => setScreen('home')}>Enter My Path →</button>
        </div>
      </div></>
    );
  }

  // ── PATH COMPLETE ──────────────────────────────────────────
  if (screen === 'path-complete') {
    const path = LEARNING_PATHS[selectedPath] || LEARNING_PATHS.steward;
    return (
      <><GlobalStyles />
      {showPaywall && <PaywallScreen onSubscribe={handleSubscribe} onRestore={handleRestore} onDismiss={handleUnlockDismiss} triggeredByLesson={paywallTriggeredBy} />}
      <PathCompleteScreen path={path} totalXp={xp} completedCount={completedLessons.length} isPremium={isPremium} streak={streak}
        onUnlock={() => { setPaywallTriggeredBy(null); setShowPaywall(true); }}
        onGoHome={() => setScreen('home')} />
      <BottomNav active="progress" setScreen={setScreen} /></>
    );
  }

  // ── LESSON READER ──────────────────────────────────────────
  if (screen === 'lesson' && currentLesson) {
    const lesson = currentLesson;
    const isDone = completedLessons.includes(lesson.id);
    return (
      <><GlobalStyles />
      {showCelebration && justCompletedLesson && (
        <CelebrationModal lesson={justCompletedLesson} xpEarned={justCompletedLesson.xp}
          nextLesson={celebrationNextLesson} nextIsLocked={celebrationNextLesson ? isLocked(celebrationNextLesson) : false}
          allComplete={!celebrationNextLesson} onNextLesson={handleNextFromCelebration}
          onUnlockNext={handleUnlockFromCelebration} onGoHome={handleCelebrationGoHome}
          totalXp={xp} streak={streak} />
      )}
      <div className="app-wrapper" style={{ minHeight: '100vh', paddingBottom: 80 }}>
        <div className="noise-overlay" />
        <div className="screen" style={{ maxWidth: 600, margin: '0 auto', padding: '0 20px' }}>
          <div style={{ padding: '20px 0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="btn-ghost" style={{ padding: '8px 14px' }} onClick={() => setScreen('home')}>← Back</button>
            <span style={{ fontSize: 13, color: 'var(--gold-dim)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>Lesson {lesson.id} · {lesson.duration}</span>
            {isDone ? <div className="completed-badge" style={{ marginLeft: 'auto' }}>✓ Completed</div> : <div className="streak-badge" style={{ marginLeft: 'auto' }}>+{lesson.xp} XP</div>}
          </div>
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--gold-dim)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8 }}>{lesson.subtitle}</p>
            <h1 className="display-font" style={{ fontSize: 36, fontWeight: 700, lineHeight: 1.2, color: 'var(--ivory)', marginBottom: 4 }}>{lesson.title}</h1>
          </div>
          <div className="scripture-block fade-up">
            <p className="serif-font" style={{ fontSize: 20, fontStyle: 'italic', color: 'var(--ivory)', lineHeight: 1.6, marginBottom: 8 }}>"{lesson.scripture.text}"</p>
            <p style={{ fontSize: 14, color: 'var(--gold)', letterSpacing: '0.1em' }}>— {lesson.scripture.ref}</p>
          </div>
          <div className="fade-up-delay">
            {lesson.content.split('\n\n').map((para, i) => (
              <p key={i} className="serif-font" style={{ fontSize: 19, lineHeight: 1.8, color: 'var(--ivory-dim)', marginBottom: 18 }}>{para}</p>
            ))}
          </div>
          <div className="ornament fade-up-delay">Reflection & Application</div>
          <div className="fade-up-delay2">
            <button className="btn-gold" style={{ width: '100%', marginTop: 8 }}
              onClick={() => { setQuizStep(0); setQuizAnswers({}); setQuizRevealed({}); setScreen('quiz'); }}>
              {isDone ? 'Review Knowledge Check →' : 'Take the Knowledge Check →'}
            </button>
          </div>
        </div>
      </div></>
    );
  }

  // ── QUIZ ───────────────────────────────────────────────────
  if (screen === 'quiz' && currentLesson) {
    const questions  = currentLesson.quiz;
    const totalQ     = questions.length;
    const q          = questions[quizStep];
    const selected   = quizAnswers[quizStep] ?? null;
    const revealed   = quizRevealed[quizStep] ?? false;
    const allDone    = Object.keys(quizRevealed).length === totalQ;
    const correctCount = Object.entries(quizAnswers).filter(([step, ans]) => ans === questions[step]?.correct).length;

    const handleSelect = (idx) => {
      if (revealed) return;
      setQuizAnswers(p => ({ ...p, [quizStep]: idx }));
      setQuizRevealed(p => ({ ...p, [quizStep]: true }));
    };

    const handleComplete = async () => {
      let newCompleted = completedLessons;
      let newXp = xp;

      if (!completedLessons.includes(currentLesson.id)) {
        newCompleted = [...completedLessons, currentLesson.id];
        newXp = xp + currentLesson.xp;
        setCompletedLessons(newCompleted);
        setXp(newXp);
        Auth.recordProgress(currentLesson.id, correctCount, currentLesson.xp).catch(console.error);
      }

      const next = LESSONS.find(l => !newCompleted.includes(l.id)) || null;
      setJustCompletedLesson(currentLesson);
      setCelebrationNextLesson(next);
      setShowCelebration(true);
      setScreen('lesson');
    };

    return (
      <><GlobalStyles />
      <div className="app-wrapper" style={{ minHeight: '100vh', padding: '40px 24px 60px' }}>
        <div className="noise-overlay" />
        <div className="screen" style={{ maxWidth: 520, margin: '0 auto', width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--gold-dim)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Knowledge Check</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {questions.map((_, i) => (
                <div key={i} style={{ width: 28, height: 28, borderRadius: '50%',
                  border: `2px solid ${i === quizStep ? 'var(--gold)' : quizRevealed[i] ? (quizAnswers[i] === questions[i].correct ? 'var(--green-accent)' : 'var(--red-accent)') : 'var(--border)'}`,
                  background: quizRevealed[i] ? (quizAnswers[i] === questions[i].correct ? 'rgba(45,106,79,0.3)' : 'rgba(139,38,53,0.3)') : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'var(--ivory-dim)', fontWeight: 600, transition: 'all 0.3s ease' }}>
                  {quizRevealed[i] ? (quizAnswers[i] === questions[i].correct ? '✓' : '✗') : i + 1}
                </div>
              ))}
            </div>
          </div>
          <div className="fade-up" key={quizStep}>
            <p style={{ fontSize: 13, color: 'var(--gold-dim)', marginBottom: 8 }}>Question {quizStep + 1} of {totalQ}</p>
            <h2 className="display-font" style={{ fontSize: 24, fontWeight: 600, color: 'var(--ivory)', lineHeight: 1.35, marginBottom: 24 }}>{q.question}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {q.options.map((opt, i) => {
                let cls = 'quiz-option';
                if (revealed && i === q.correct) cls += ' correct';
                else if (revealed && i === selected) cls += ' incorrect';
                return (
                  <button key={i} className={cls} onClick={() => handleSelect(i)}>
                    <span style={{ width: 26, height: 26, borderRadius: '50%', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, flexShrink: 0, color: 'var(--gold)', fontWeight: 600 }}>{String.fromCharCode(65 + i)}</span>
                    <span style={{ fontSize: 16, color: 'var(--ivory)' }}>{opt}</span>
                  </button>
                );
              })}
            </div>
            {revealed && (
              <div className="card fade-up" style={{ padding: '18px', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 22 }}>{selected === q.correct ? '✅' : '📖'}</span>
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 500, color: selected === q.correct ? '#4ade80' : 'var(--gold)', marginBottom: 6 }}>{selected === q.correct ? 'Excellent! Well discerned.' : 'Keep studying — growth comes through review.'}</p>
                    <p style={{ fontSize: 15, color: 'var(--ivory-dim)', lineHeight: 1.6 }}>{q.explanation}</p>
                  </div>
                </div>
              </div>
            )}
            {revealed && quizStep < totalQ - 1 && (
              <button className="btn-gold fade-up" style={{ width: '100%' }} onClick={() => setQuizStep(s => s + 1)}>Next Question →</button>
            )}
          </div>
          {allDone && quizStep === totalQ - 1 && (
            <div className="fade-up" style={{ marginTop: 8 }}>
              <div className="card card-gold-top completion-pop" style={{ padding: '20px', marginBottom: 16, textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{correctCount === totalQ ? '🏆' : correctCount >= 2 ? '⭐' : '📖'}</div>
                <p className="display-font" style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>{correctCount} / {totalQ} Correct</p>
                <p style={{ fontSize: 15, color: 'var(--ivory-dim)' }}>{correctCount === totalQ ? 'Perfect score — well done, faithful steward!' : correctCount >= 2 ? 'Strong foundation! Review the lesson to reinforce.' : 'Wisdom grows through repetition — revisit the lesson.'}</p>
              </div>
              <button className="btn-gold" style={{ width: '100%' }} onClick={handleComplete}>Complete Lesson (+{currentLesson.xp} XP) →</button>
            </div>
          )}
        </div>
      </div></>
    );
  }

  // ── CHAT ───────────────────────────────────────────────────
  if (screen === 'chat') {
    const sendMessage = async () => {
      const text = chatInput.trim(); if (!text || chatLoading) return;
      setChatInput('');
      const newMessages = [...chatMessages, { role: 'user', text }];
      setChatMessages(newMessages);
      setChatLoading(true);
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1000,
            system: `You are a wise, warm Stewardship Guide for a faith-based financial discipleship app called "Steward." You answer questions about biblical finances, tithing, debt freedom, generosity, investing, and wealth building from a Christian worldview. You ground your answers in Scripture (cite verses), use a warm but authoritative pastoral tone, and offer practical steps. You never give specific investment advice or predict markets. Keep responses under 200 words. Use ✦ as a bullet point where appropriate.`,
            messages: newMessages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.text }))
          })
        });
        const data = await res.json();
        setChatMessages(p => [...p, { role: 'ai', text: data.content?.[0]?.text || 'I am unable to respond right now.' }]);
      } catch {
        setChatMessages(p => [...p, { role: 'ai', text: 'I encountered an issue. Please try again.' }]);
      }
      setChatLoading(false);
    };

    return (
      <><GlobalStyles />
      <div className="app-wrapper" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="noise-overlay" />
        <div className="screen" style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 600, margin: '0 auto', width: '100%', padding: '0 16px' }}>
          <div style={{ padding: '20px 0 16px', borderBottom: '1px solid var(--border)', marginBottom: 16 }}>
            <div className="display-font" style={{ fontSize: 24, fontWeight: 600, color: 'var(--ivory)' }}>⚖️ Stewardship Guide</div>
            <p style={{ fontSize: 14, color: 'var(--gold-dim)', marginTop: 2 }}>Biblically-rooted financial wisdom</p>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingBottom: 120 }}>
            {chatMessages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'ai' && <span style={{ fontSize: 11, color: 'var(--gold)', display: 'block', marginBottom: 4, letterSpacing: '0.1em' }}>STEWARD GUIDE</span>}
                <p style={{ fontSize: 16, lineHeight: 1.65, color: 'var(--ivory)', whiteSpace: 'pre-wrap' }}>{m.text}</p>
              </div>
            ))}
            {chatLoading && <div className="chat-bubble-ai"><p style={{ fontSize: 15, color: 'var(--gold-dim)', fontStyle: 'italic' }}>Searching the Scriptures…</p></div>}
            <div ref={chatBottomRef} />
          </div>
        </div>
        <div style={{ position: 'fixed', bottom: 60, left: 0, right: 0, padding: '12px 16px', background: 'rgba(20,35,100,0.97)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(16px)', zIndex: 99 }}>
          <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', gap: 8 }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask about tithing, debt, wealth, generosity…"
              style={{ flex: 1, background: 'rgba(15,25,90,0.8)', border: '1px solid var(--border)', borderRadius: 6, padding: '12px 14px', color: 'var(--ivory)', fontSize: 15, fontFamily: 'DM Sans', outline: 'none' }} />
            <button className="btn-gold" style={{ padding: '12px 20px', flexShrink: 0 }} onClick={sendMessage}>Send</button>
          </div>
        </div>
        <BottomNav active="chat" setScreen={setScreen} />
      </div></>
    );
  }

  // ── PROGRESS ───────────────────────────────────────────────
  if (screen === 'progress') {
    const totalXpPossible = LESSONS.reduce((a, l) => a + l.xp, 0);
    const pct  = Math.round((xp / totalXpPossible) * 100);
    const path = LEARNING_PATHS[selectedPath] || LEARNING_PATHS.steward;
    return (
      <><GlobalStyles />
      {showPaywall && <PaywallScreen onSubscribe={handleSubscribe} onRestore={handleRestore} onDismiss={handleUnlockDismiss} triggeredByLesson={paywallTriggeredBy} />}
      <div className="app-wrapper" style={{ minHeight: '100vh', paddingBottom: 80 }}>
        <div className="noise-overlay" />
        <div className="screen" style={{ maxWidth: 520, margin: '0 auto', padding: '24px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <div className="display-font fade-up" style={{ fontSize: 28, fontWeight: 700, color: 'var(--ivory)' }}>My Progress</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {isPremium && <div className="premium-badge">⭐ Premium</div>}
              {isPremium && (
                <button onClick={async () => { await Auth.openCustomerPortal(); }}
                  style={{ background: 'none', border: 'none', color: 'var(--ivory-dim)', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}>
                  Manage
                </button>
              )}
            </div>
          </div>
          <p className="fade-up" style={{ fontSize: 15, color: 'var(--gold-dim)', marginBottom: 24 }}>{path.name} · {path.tagline}</p>
          <div className="card card-gold-top fade-up" style={{ padding: '20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 15, color: 'var(--ivory-dim)' }}>Total XP Earned</span>
              <span className="display-font shimmer-text" style={{ fontSize: 28, fontWeight: 700 }}>{xp}</span>
            </div>
            <div className="progress-bar-bg" style={{ height: 8 }}><div className="progress-bar-fill" style={{ width: `${pct}%` }} /></div>
            <p style={{ fontSize: 13, color: 'var(--gold-dim)', marginTop: 6 }}>{pct}% of foundation path complete</p>
          </div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            {[{ label: 'Lessons Done', value: completedLessons.length, icon: '📖' }, { label: 'Day Streak', value: streak, icon: '🔥' }, { label: 'Verses', value: completedLessons.length, icon: '✦' }].map(stat => (
              <div key={stat.label} className="card" style={{ flex: 1, padding: '16px 12px', textAlign: 'center' }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{stat.icon}</div>
                <div className="display-font" style={{ fontSize: 22, fontWeight: 700, color: 'var(--gold)' }}>{stat.value}</div>
                <div style={{ fontSize: 12, color: 'var(--ivory-dim)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{stat.label}</div>
              </div>
            ))}
          </div>
          <div className="ornament">Lesson History</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
            {LESSONS.map(l => {
              const done = completedLessons.includes(l.id); const locked = isLocked(l);
              return (
                <div key={l.id} className={done ? 'card-completed' : locked ? 'card-locked' : 'card'}
                  style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => locked ? (setPaywallTriggeredBy(l.id), setShowPaywall(true)) : handleLessonTap(l)}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: done ? 'rgba(201,168,76,0.2)' : locked ? 'rgba(255,255,255,0.05)' : 'rgba(22,32,64,0.8)', border: `2px solid ${done ? 'var(--gold)' : locked ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: locked ? 16 : 15, flexShrink: 0, color: done ? 'var(--gold)' : 'var(--ivory-dim)', fontWeight: 700 }}>
                    {done ? '✓' : locked ? '🔒' : l.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, color: done ? 'var(--gold-light)' : locked ? 'rgba(255,255,255,0.35)' : 'var(--ivory)', fontWeight: 500 }}>{l.title}</p>
                    <p style={{ fontSize: 13, color: locked ? 'rgba(255,255,255,0.2)' : 'var(--ivory-dim)' }}>{locked ? 'Premium — tap to unlock' : l.subtitle}</p>
                  </div>
                  {done ? <span className="completed-badge">+{l.xp} XP</span> : locked ? <span className="premium-badge">⭐ Pro</span> : <span style={{ fontSize: 13, color: 'var(--gold-dim)' }}>+{l.xp} XP</span>}
                </div>
              );
            })}
          </div>
          {!isPremium && (
            <div className="card card-gold-top fade-up" style={{ padding: '20px', marginTop: 24, textAlign: 'center', cursor: 'pointer' }} onClick={() => { setPaywallTriggeredBy(null); setShowPaywall(true); }}>
              <p className="display-font" style={{ fontSize: 18, fontWeight: 600, color: 'var(--gold)', marginBottom: 4 }}>Unlock All 12 Lessons</p>
              <p style={{ fontSize: 14, color: 'var(--ivory-dim)', marginBottom: 12 }}>Continue your full discipleship journey</p>
              <span className="btn-gold" style={{ display: 'inline-block', padding: '10px 24px', fontSize: 14 }}>View Plans →</span>
            </div>
          )}
          <div className="card" style={{ padding: '16px 18px', marginTop: 20 }}>
            <p style={{ fontSize: 14, color: 'var(--ivory-dim)', marginBottom: 4 }}>Signed in as <strong style={{ color: 'var(--ivory)' }}>{authUser?.email}</strong></p>
            <button onClick={() => Auth.signOut().then(() => { setAuthUser(null); setScreen('splash'); })}
              style={{ background: 'none', border: 'none', color: 'var(--gold-dim)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Sign out
            </button>
          </div>
        </div>
        <BottomNav active="progress" setScreen={setScreen} />
      </div></>
    );
  }

  // ── HOME ───────────────────────────────────────────────────
  const path = LEARNING_PATHS[selectedPath] || LEARNING_PATHS.steward;
  const totalLessons = LESSONS.length;
  const doneLessons  = completedLessons.length;
  const nextLesson   = LESSONS.find(l => !completedLessons.includes(l.id)) || null;

  return (
    <><GlobalStyles />
    {showPaywall && <PaywallScreen onSubscribe={handleSubscribe} onRestore={handleRestore} onDismiss={handleUnlockDismiss} triggeredByLesson={paywallTriggeredBy} />}
    <div className="app-wrapper" style={{ minHeight: '100vh', paddingBottom: 80 }}>
      <div className="noise-overlay" />
      <div className="screen" style={{ maxWidth: 520, margin: '0 auto', padding: '0 20px' }}>
        <div style={{ padding: '24px 0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 13, color: 'var(--gold-dim)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 2 }}>Welcome back</div>
            <div className="display-font" style={{ fontSize: 26, fontWeight: 700, color: 'var(--ivory)' }}>Steward</div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {isPremium && <div className="premium-badge">⭐ Premium</div>}
            <div className="streak-badge">🔥 {streak} days</div>
          </div>
        </div>
        <div className="card card-gold-top fade-up" style={{ padding: '20px', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <p style={{ fontSize: 13, color: 'var(--gold-dim)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 2 }}>Active Path</p>
              <p className="display-font" style={{ fontSize: 20, fontWeight: 600, color: 'var(--ivory)' }}>{path.name}</p>
            </div>
            <span style={{ fontSize: 30 }}>{path.icon}</span>
          </div>
          <div className="progress-bar-bg" style={{ marginBottom: 6 }}><div className="progress-bar-fill" style={{ width: `${Math.round((doneLessons / totalLessons) * 100)}%` }} /></div>
          <p style={{ fontSize: 14, color: 'var(--ivory-dim)' }}>{doneLessons} of {totalLessons} lessons complete · {xp} XP earned</p>
        </div>
        {!isPremium && doneLessons >= FREE_LESSONS && nextLesson && isLocked(nextLesson) && (
          <div className="card fade-up" style={{ padding: '16px 18px', marginBottom: 20, borderLeft: '3px solid var(--gold)', cursor: 'pointer', background: 'rgba(201,168,76,0.06)' }}
            onClick={() => { setPaywallTriggeredBy(null); setShowPaywall(true); }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>🔓</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--gold)' }}>You have finished your free lessons!</p>
                <p style={{ fontSize: 14, color: 'var(--ivory-dim)' }}>Unlock all 12 to continue your journey.</p>
              </div>
              <span style={{ color: 'var(--gold)', fontSize: 20 }}>→</span>
            </div>
          </div>
        )}
        {!nextLesson && (
          <div className="card card-gold-top fade-up" style={{ padding: '20px', marginBottom: 20, textAlign: 'center', cursor: 'pointer' }} onClick={() => setScreen('path-complete')}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏆</div>
            <p className="display-font" style={{ fontSize: 18, fontWeight: 700, color: 'var(--gold)', marginBottom: 4 }}>All Lessons Complete!</p>
            <p style={{ fontSize: 14, color: 'var(--ivory-dim)', marginBottom: 4 }}>View your certificate of completion</p>
            <span style={{ fontSize: 13, color: 'var(--gold)' }}>View Certificate →</span>
          </div>
        )}
        {nextLesson && (
          <div className="fade-up-delay" style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--gold-dim)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>Continue Learning</div>
            <div className={isLocked(nextLesson) ? 'card-locked' : 'card card-gold-top'} style={{ padding: '20px', cursor: 'pointer' }} onClick={() => handleLessonTap(nextLesson)}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: isLocked(nextLesson) ? 'rgba(255,255,255,0.05)' : 'rgba(201,168,76,0.12)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {isLocked(nextLesson) ? '🔒' : '📖'}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: 'var(--gold-dim)', marginBottom: 2, letterSpacing: '0.1em' }}>LESSON {nextLesson.id} · {nextLesson.duration}</p>
                  <p className="display-font" style={{ fontSize: 18, fontWeight: 600, color: isLocked(nextLesson) ? 'rgba(255,255,255,0.4)' : 'var(--ivory)', marginBottom: 2 }}>{nextLesson.title}</p>
                  <p style={{ fontSize: 15, color: isLocked(nextLesson) ? 'rgba(255,255,255,0.25)' : 'var(--ivory-dim)' }}>{isLocked(nextLesson) ? 'Premium lesson — tap to unlock' : nextLesson.subtitle}</p>
                </div>
                {isLocked(nextLesson) ? <span className="premium-badge" style={{ flexShrink: 0 }}>⭐ Pro</span> : <span style={{ color: 'var(--gold)', fontSize: 22, marginTop: 4 }}>→</span>}
              </div>
              {!isLocked(nextLesson) && (
                <div className="scripture-block" style={{ marginTop: 14, marginBottom: 0 }}>
                  <p className="serif-font" style={{ fontSize: 16, fontStyle: 'italic', color: 'var(--ivory-dim)', lineHeight: 1.5 }}>"{nextLesson.scripture.text}"</p>
                  <p style={{ fontSize: 13, color: 'var(--gold)', marginTop: 4 }}>— {nextLesson.scripture.ref}</p>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="fade-up-delay2">
          <div style={{ fontSize: 13, color: 'var(--gold-dim)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>All Lessons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {LESSONS.map(l => {
              const done = completedLessons.includes(l.id); const locked = isLocked(l);
              return (
                <div key={l.id} className={done ? 'card-completed' : locked ? 'card-locked' : 'card'}
                  style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                  onClick={() => handleLessonTap(l)}>
                  <div style={{ width: 34, height: 34, borderRadius: 6, background: done ? 'rgba(201,168,76,0.18)' : locked ? 'rgba(255,255,255,0.05)' : 'rgba(22,32,64,0.8)', border: `2px solid ${done ? 'var(--gold)' : locked ? 'rgba(255,255,255,0.1)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: locked ? 16 : 14, flexShrink: 0, color: done ? 'var(--gold)' : 'var(--ivory-dim)', fontWeight: 700 }}>
                    {done ? '✓' : locked ? '🔒' : l.id}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 15, color: done ? 'var(--gold-light)' : locked ? 'rgba(255,255,255,0.35)' : 'var(--ivory)', fontWeight: 500 }}>{l.title}</p>
                    <p style={{ fontSize: 13, color: locked ? 'rgba(255,255,255,0.22)' : 'var(--ivory-dim)' }}>{locked ? 'Premium — tap to unlock' : `${l.duration} · +${l.xp} XP`}</p>
                  </div>
                  {done ? <span className="completed-badge">Done</span> : locked ? <span className="premium-badge">⭐ Pro</span> : <span style={{ color: 'var(--gold-dim)', fontSize: 18 }}>→</span>}
                </div>
              );
            })}
          </div>
        </div>
        <div className="fade-up-delay2" style={{ margin: '24px 0' }}>
          <div className="card card-gold-top" style={{ padding: '20px', cursor: 'pointer', background: 'rgba(201,168,76,0.04)' }} onClick={() => setScreen('chat')}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <span style={{ fontSize: 34 }}>⚖️</span>
              <div>
                <p className="display-font" style={{ fontSize: 17, fontWeight: 600, color: 'var(--gold)' }}>Ask the Stewardship Guide</p>
                <p style={{ fontSize: 15, color: 'var(--ivory-dim)' }}>AI-powered biblical financial counsel — anytime</p>
              </div>
              <span style={{ color: 'var(--gold)', fontSize: 22, marginLeft: 'auto' }}>→</span>
            </div>
          </div>
        </div>
      </div>
      <BottomNav active="home" setScreen={setScreen} />
    </div></>
  );
}
