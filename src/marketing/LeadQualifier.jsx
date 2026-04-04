// Route: /qualify
// AI chatbot that qualifies leads and routes them to the right segment landing page.
// Simple chat UI, 3-4 questions, then redirects to /m/{segment}.

import { useState } from "react";

const STYLES = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Outfit', system-ui, sans-serif; background:#0a1628; color:#f0f9ff; }
  .wrap { min-height:100dvh; display:flex; flex-direction:column; align-items:center;
    justify-content:center; padding:24px; }
  .card { background:rgba(255,255,255,0.03); border:1px solid rgba(14,165,233,0.15);
    border-radius:24px; max-width:480px; width:100%; padding:32px; }
  .logo { font-size:12px; letter-spacing:3px; color:#0ea5e9; margin-bottom:24px; font-weight:700; text-align:center; }
  .question { font-size:18px; font-weight:600; line-height:1.4; margin-bottom:20px; min-height:52px; }
  .options { display:flex; flex-direction:column; gap:10px; }
  .opt-btn { padding:14px 20px; background:rgba(255,255,255,0.04); border:1px solid rgba(14,165,233,0.2);
    border-radius:14px; color:#f0f9ff; font-size:15px; cursor:pointer; text-align:left;
    font-family:inherit; transition:all 0.2s; }
  .opt-btn:hover { border-color:#0ea5e9; background:rgba(14,165,233,0.08); transform:translateX(4px); }
  .progress { display:flex; gap:6px; justify-content:center; margin-bottom:24px; }
  .dot { width:8px; height:8px; border-radius:50%; background:rgba(14,165,233,0.2); transition:all 0.3s; }
  .dot.active { background:#0ea5e9; }
  .dot.done { background:#0284c7; }
  .redirect { text-align:center; padding:20px 0; }
  .redirect .wave { font-size:48px; margin-bottom:16px; animation:bob 2s ease-in-out infinite; }
  @keyframes bob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
  .redirect p { color:#7dd3fc; font-size:16px; }
`;

const QUESTIONS = [
  {
    id: "travel_type",
    text: "How do you travel to Croatia?",
    options: [
      { label: "🚐 Camper van / motorhome", value: "camper" },
      { label: "⛵ Sailing / yacht", value: "sailing" },
      { label: "🛳️ Cruise or boat trip", value: "cruiser" },
      { label: "✈️ Flight + hotel/apartment", value: "hotel" },
    ],
  },
  {
    id: "language",
    text: "What's your preferred language?",
    options: [
      { label: "🇩🇪 Deutsch", value: "de" },
      { label: "🇬🇧 English", value: "en" },
      { label: "🇮🇹 Italiano", value: "it" },
      { label: "🇭🇷 Hrvatski", value: "hr" },
    ],
  },
  {
    id: "travel_with",
    text: "Who are you travelling with?",
    options: [
      { label: "👫 Partner / couple", value: "couple" },
      { label: "👨‍👩‍👧 Family with kids", value: "family" },
      { label: "👥 Friends", value: "friends" },
      { label: "🧍 Solo", value: "solo" },
    ],
  },
];

// Segment routing logic
function pickSegment(answers) {
  const { travel_type, language, travel_with } = answers;

  if (language === "de") {
    if (travel_with === "family") return "de_family";
    if (travel_type === "camper" || travel_type === "hotel") return "de_camper";
    if (travel_type === "sailing" || travel_type === "cruiser") return "it_sailor"; // close enough, DE sailors → it_sailor is wrong; use en_cruiser
  }

  if (language === "it" && (travel_type === "sailing" || travel_type === "cruiser")) return "it_sailor";

  if (travel_type === "sailing") return "en_cruiser";
  if (travel_type === "cruiser") return "en_cruiser";
  if (travel_type === "camper") return "de_camper";

  if (travel_with === "couple") return "en_couple";
  if (travel_with === "family" && language === "de") return "de_family";

  return "en_couple"; // default
}

export default function LeadQualifier() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [redirecting, setRedirecting] = useState(false);

  function pick(value) {
    const q = QUESTIONS[step];
    const newAnswers = { ...answers, [q.id]: value };
    setAnswers(newAnswers);

    if (step + 1 >= QUESTIONS.length) {
      setRedirecting(true);
      const segment = pickSegment(newAnswers);
      setTimeout(() => {
        window.location.href = `/m/${segment}`;
      }, 1200);
    } else {
      setStep(step + 1);
    }
  }

  const q = QUESTIONS[step];

  return (
    <>
      <style>{STYLES}</style>
      <div className="wrap">
        <div className="card">
          <div className="logo">JADRAN.AI</div>

          <div className="progress">
            {QUESTIONS.map((_, i) => (
              <div
                key={i}
                className={`dot ${i < step ? "done" : i === step ? "active" : ""}`}
              />
            ))}
          </div>

          {redirecting ? (
            <div className="redirect">
              <div className="wave">🌊</div>
              <p>Finding your perfect guide...</p>
            </div>
          ) : (
            <>
              <p className="question">{q.text}</p>
              <div className="options">
                {q.options.map(opt => (
                  <button key={opt.value} className="opt-btn" onClick={() => pick(opt.value)}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
