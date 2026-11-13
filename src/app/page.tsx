
"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Volume2,
  VolumeX,
  Music2,
  Snowflake,
  Sparkles,
  RotateCcw,
  Gift,
  ArrowRight,
  Share2,
  Star,
} from "lucide-react";

type Screen = "home" | "quiz" | "result" | "comparison";

type Challenge = {
  name: string;
  aura: number;
  status: string;
  title: string;
  emoji: string;
};

const questions = [
  {
    question: "Be honest... how often do you leave people on read?",
    subtitle: "Santa has access to your WhatsApp backup.",
    options: [
      { text: "Never. I am an angel.", points: 0 },
      { text: "Only when I forget to reply.", points: 2 },
      { text: "I reply after 3 business days.", points: 4 },
      { text: "Seen at 2:03 AM. Reply never.", points: 5 },
    ],
  },
  {
    question: "You find ₹500 lying on the road. What do you do?",
    subtitle: "Your answer will be forwarded to the North Pole.",
    options: [
      { text: "Try to find the owner.", points: 0 },
      { text: "Keep it. Finders keepers!", points: 2 },
      { text: "Look around, then keep it.", points: 3 },
      { text: "Already planning my shopping.", points: 5 },
    ],
  },
  {
    question: "How do you behave in a group project?",
    subtitle: "Santa knows who actually made the PPT.",
    options: [
      { text: "I do my fair share.", points: 0 },
      { text: "I organise everything.", points: 1 },
      { text: "I disappear and return at submission.", points: 4 },
      { text: "My contribution is moral support.", points: 5 },
    ],
  },
  {
    question: "It's 2 AM. What's your biggest crime?",
    subtitle: "This is your final chance to defend yourself.",
    options: [
      { text: "Sleeping like a responsible human.", points: 0 },
      { text: "Scrolling reels for 10 minutes.", points: 2 },
      { text: "Overthinking my entire existence.", points: 3 },
      { text: "Watching one more episode. Definitely.", points: 5 },
    ],
  },
];

const getVerdict = (score: number) => {
  if (score <= 20) {
    return {
      title: "CERTIFIED ANGEL",
      status: "NICE LIST",
      roast: "Wait... you're actually a good person? Santa is suspicious. He's checking twice.",
      emoji: "😇",
      description: "The North Pole approves of your behaviour. For now.",
    };
  }

  if (score <= 50) {
    return {
      title: "CHAOTIC BUT CUTE",
      status: "SLIGHTLY NAUGHTY",
      roast: "You're not evil. You're just a walking collection of questionable decisions.",
      emoji: "🎅",
      description: "Santa has concerns, but he's willing to let this slide.",
    };
  }

  if (score <= 75) {
    return {
      title: "PROBLEMATIC ICON",
      status: "NAUGHTY LIST",
      roast: "The elves have a separate file dedicated entirely to you. It's 47 pages long.",
      emoji: "💀",
      description: "Santa knows what you did. And honestly? He's disappointed.",
    };
  }

  return {
    title: "NORTH POLE'S WORST NIGHTMARE",
    status: "EXTREMELY NAUGHTY",
    roast: "Santa saw your answers, closed his laptop and went on a vacation.",
    emoji: "😭",
    description: "Your Christmas privileges are currently under investigation.",
  };
};

export default function Home() {
  const [screen, setScreen] = useState<Screen>("home");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [aura, setAura] = useState(100);
  const [selected, setSelected] = useState<number | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [challengeCopied, setChallengeCopied] = useState(false);
  const [showChallengeForm, setShowChallengeForm] = useState(false);
  const [challengeName, setChallengeName] = useState("");
  const [challengeUrl, setChallengeUrl] = useState("");
  const [incomingChallenge, setIncomingChallenge] = useState<Challenge | null>(null);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [aiRoast, setAiRoast] = useState<string | null>(null);
  const [roastLoading, setRoastLoading] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);

  const result = getVerdict(aura);

  useEffect(() => {
    if (!soundEnabled && audioRef.current) {
      audioRef.current.pause();
    }
  }, [soundEnabled]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const challengeAura = params.get("challengeAura");
    const challengeName = params.get("challengeName");
    const challengeStatus = params.get("challengeStatus");
    const challengeTitle = params.get("challengeTitle");
    const challengeEmoji = params.get("challengeEmoji");
    const parsedAura = Number(challengeAura);

    if (
      challengeAura !== null &&
      Number.isFinite(parsedAura) &&
      parsedAura >= 0 &&
      parsedAura <= 100 &&
      challengeStatus &&
      challengeTitle
    ) {
      setIncomingChallenge({
        name: challengeName || "Your friend",
        aura: parsedAura,
        status: challengeStatus,
        title: challengeTitle,
        emoji: challengeEmoji || "🎅",
      });
    }
  }, []);

  const playYassu = () => {
    const audio = audioRef.current;

    if (!audio) return;

    audio.pause();
    audio.currentTime = 0;
    audio.volume = 1;

    audio.play().catch((error) => {
      console.error("Audio playback error:", error);
    });
  };

  const startQuiz = () => {
    setQuestionIndex(0);
    setTotalPoints(0);
    setAura(100);
    setSelected(null);
    setUserAnswers([]);
    setAiRoast(null);
    setRoastLoading(false);
    setScreen("quiz");
  };

  // Gemini AI roast with a built-in roast fallback.
  const generateSantaRoast = async (answers: string[], finalAura: number) => {
    // Keep the original roast visible while Santa's AI is thinking.
    setAiRoast(null);
    setRoastLoading(true);

    try {
      const verdict = getVerdict(finalAura);

      const response = await fetch("/api/roast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers,
          status: verdict.status,
          aura: finalAura,
          title: verdict.title,
        }),
      });

      const data = await response.json();

      if (!response.ok || typeof data.roast !== "string") {
        throw new Error(data.error || "Santa is busy!");
      }

      // Show the AI-generated roast when Gemini succeeds.
      setAiRoast(data.roast);
    } catch (error) {
      console.error("Santa AI unavailable. Using backup roast:", error);

      // If Gemini fails, the built-in roast remains visible.
      setAiRoast(null);
    } finally {
      setRoastLoading(false);
    }
  };

  const nextQuestion = () => {
    if (selected === null) return;

    const chosenAnswer = questions[questionIndex].options[selected].text;
    const updatedAnswers = [...userAnswers, chosenAnswer];
    setUserAnswers(updatedAnswers);

    const newTotal = totalPoints + questions[questionIndex].options[selected].points;
    setTotalPoints(newTotal);
    setSelected(null);

    if (questionIndex === questions.length - 1) {
      const maxPoints = questions.length * 5;
      const finalAura = Math.round(100 - (newTotal / maxPoints) * 100);

      setAura(finalAura);
      setScreen(incomingChallenge ? "comparison" : "result");

      if (!incomingChallenge) {
        void generateSantaRoast(updatedAnswers, finalAura);
      }

      if (soundEnabled) {
        setTimeout(() => {
          playYassu();
        }, 300);
      }
    } else {
      setQuestionIndex((previous) => previous + 1);
    }
  };

  const shareResult = async () => {
    const message = `🎅 My Santa's Naughty AI verdict is: ${result.status}! My Christmas aura is ${aura}/100. Find out whether you're naughty or nice!`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Santa's Naughty AI",
          text: message,
        });
      } else {
        await navigator.clipboard.writeText(message);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.log("Sharing cancelled", error);
    }
  };

  const challengeFriends = async () => {
    const safeName = challengeName.trim().slice(0, 24) || "Your friend";
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("challengeName", safeName);
    url.searchParams.set("challengeAura", String(aura));
    url.searchParams.set("challengeStatus", result.status);
    url.searchParams.set("challengeTitle", result.title);
    url.searchParams.set("challengeEmoji", result.emoji);

    const generatedUrl = url.toString();
    setChallengeUrl(generatedUrl);
    setShowChallengeForm(false);

    const message = `🎅 ${safeName} has challenged you to Santa's Naughty AI! Their verdict: ${result.status} (${aura}/100 aura). Think you can beat them? Take the test: ${generatedUrl}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Santa's Naughty AI — Friend Challenge",
          text: message,
          url: generatedUrl,
        });
      } else {
        await navigator.clipboard.writeText(message);
        setChallengeCopied(true);
        setTimeout(() => setChallengeCopied(false), 2500);
      }
    } catch (error) {
      // Keep the generated link visible below so it can still be copied manually.
      if (error instanceof Error && error.name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(generatedUrl);
          setChallengeCopied(true);
          setTimeout(() => setChallengeCopied(false), 2500);
        } catch {
          setChallengeCopied(false);
        }
      }
    }
  };

  const copyChallengeLink = async () => {
    if (!challengeUrl) return;
    try {
      await navigator.clipboard.writeText(challengeUrl);
      setChallengeCopied(true);
      setTimeout(() => setChallengeCopied(false), 2500);
    } catch {
      setChallengeCopied(false);
    }
  };

  const downloadCertificate = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 850;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Background
    ctx.fillStyle = "#071426";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Decorative borders
    ctx.strokeStyle = "#e7b968";
    ctx.lineWidth = 8;
    ctx.strokeRect(35, 35, 1130, 780);
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, 1090, 740);

    // Decorative stars
    ctx.fillStyle = "#e7b968";
    ctx.font = "35px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("✦  ✧  ✦  ✧  ✦", 600, 115);

    // Certificate heading
    ctx.font = "24px Georgia";
    ctx.fillText("THE OFFICIAL NORTH POLE DOCUMENT", 600, 190);

    // Main title
    ctx.fillStyle = "#f4f0e8";
    ctx.font = "bold 65px Georgia";
    ctx.fillText("CHRISTMAS CERTIFICATE", 600, 290);

    // Supporting text
    ctx.fillStyle = "#c5d2df";
    ctx.font = "27px Georgia";
    ctx.fillText("This certificate officially declares that...", 600, 365);

    // Dynamic verdict
    ctx.fillStyle = "#e7b968";
    ctx.font = "bold 52px Georgia";
    ctx.fillText(result.status, 600, 465);

    ctx.fillStyle = "#f4f0e8";
    ctx.font = "bold 35px Georgia";
    ctx.fillText(result.title, 600, 530);

    // Dynamic aura score
    ctx.fillStyle = "#c5d2df";
    ctx.font = "27px Georgia";
    ctx.fillText(`Christmas Aura: ${aura}/100`, 600, 600);

    // Santa's message and signature
    ctx.fillStyle = "#e7b968";
    ctx.font = "italic 22px Georgia";
    ctx.fillText("Santa has reviewed your behaviour.", 600, 665);

    ctx.fillStyle = "#f4f0e8";
    ctx.font = "italic 36px cursive";
    ctx.fillText("Santa Claus", 600, 735);

    ctx.fillStyle = "#9aabba";
    ctx.font = "16px Arial";
    ctx.fillText("NORTH POLE • NAUGHTYLIST.EXE • 2026", 600, 775);

    // Download the certificate as a PNG
    canvas.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "My-Christmas-Certificate.png";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  const snowflakes = Array.from({ length: 35 }, (_, i) => ({
    id: i,
    left: `${(i * 37) % 100}%`,
    delay: `${(i % 9) * 0.7}s`,
    duration: `${7 + (i % 8)}s`,
    size: `${3 + (i % 5)}px`,
  }));

  return (
    <main className="site">
      <audio
        ref={audioRef}
        src="/audio/yassu.mp3"
        preload="auto"
      />

      <div className="stars" />
      <div className="sky-glow" />
      <div className="moon" />

      <div className="snow-container" aria-hidden="true">
        {snowflakes.map((flake) => (
          <span
            key={flake.id}
            className="snowflake"
            style={{
              left: flake.left,
              animationDelay: flake.delay,
              animationDuration: flake.duration,
              width: flake.size,
              height: flake.size,
            }}
          />
        ))}
      </div>

      <nav className="navbar">
        <div className="brand">
          <span className="brand-icon">✦</span>
          <span>NAUGHTYLIST<span className="brand-dot">.EXE</span></span>
        </div>

        <button
          className="sound-button"
          onClick={() => setSoundEnabled((value) => !value)}
          aria-label="Toggle sound"
        >
          {soundEnabled ? <Volume2 size={17} /> : <VolumeX size={17} />}
          <span>{soundEnabled ? "SOUND ON" : "SOUND OFF"}</span>
        </button>
      </nav>

      <div className="page-content">
        <AnimatePresence mode="wait">

          {screen === "home" && (
            <motion.section
              key="home"
              className="home-screen"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <div className="top-label">
                <Snowflake size={14} />
                <span>THE NORTH POLE DATABASE · 2026</span>
                <Snowflake size={14} />
              </div>

              <div className="hero-art">
                <div className="hero-glow" />
                <div className="hero-moon">☾</div>
                <div className="hero-sleigh">🛷</div>
                <div className="hero-santa">🎅🏻</div>
                <div className="hero-tree left-tree">🎄</div>
                <div className="hero-tree right-tree">🎄</div>
                <div className="hero-ground" />
              </div>

              <p className="eyebrow">HO HO HOLD UP...</p>

              <h1 className="hero-title">
                HELLOOOO
                <br />
                <span> MERA YASSU YASSU!</span>
              </h1>

              <p className="hero-description">
                Santa has been watching. The elves have been reporting.
                <br />
                And your name is officially under investigation.
              </p>

              <div className="notice-card">
                <Sparkles size={18} />
                <span>
                  Answer 4 brutally honest questions to discover your
                  Christmas fate.
                </span>
              </div>

              {incomingChallenge && (
                <div className="challenge-invite">
                  <span className="challenge-invite-icon">⚔️</span>
                  <div>
                    <strong>{incomingChallenge.name} CHALLENGED YOU!</strong>
                    <p>
                      They scored {incomingChallenge.aura}/100 aura and got
                      {" "}{incomingChallenge.status}. Can you beat them?
                    </p>
                  </div>
                </div>
              )}

              <button className="primary-button" onClick={startQuiz}>
                <span>FIND MY FATE</span>
                <ArrowRight size={18} />
              </button>

              <p className="tiny-note">
                NO JUDGEMENT. OKAY, MAYBE A LITTLE.
              </p>

              <div className="home-footer">
                <span>✦ MADE IN THE NORTH POLE</span>
                <span>EST. CHRISTMAS 2026</span>
              </div>
            </motion.section>
          )}

          {screen === "quiz" && (
            <motion.section
              key={`quiz-${questionIndex}`}
              className="quiz-screen"
              initial={{ opacity: 0, x: 35 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -35 }}
              transition={{ duration: 0.35 }}
            >
              <div className="quiz-topline">
                <span>THE NAUGHTY TEST</span>
                <span>
                  {String(questionIndex + 1).padStart(2, "0")} / 04
                </span>
              </div>

              <div className="progress-track">
                <motion.div
                  className="progress-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${((questionIndex + 1) / 4) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>

              <div className="quiz-icon">🎄</div>

              <p className="question-number">
                QUESTION {String(questionIndex + 1).padStart(2, "0")}
              </p>

              <h2 className="question-title">
                {questions[questionIndex].question}
              </h2>

              <p className="question-subtitle">
                {questions[questionIndex].subtitle}
              </p>

              <div className="options-list">
                {questions[questionIndex].options.map((option, index) => (
                  <button
                    key={option.text}
                    className={`option-button ${
                      selected === index ? "selected" : ""
                    }`}
                    onClick={() => setSelected(index)}
                  >
                    <span className="option-letter">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span className="option-text">{option.text}</span>
                    <span className="option-check">
                      {selected === index ? "✦" : ""}
                    </span>
                  </button>
                ))}
              </div>

              <button
                className="primary-button next-button"
                onClick={nextQuestion}
                disabled={selected === null}
              >
                <span>
                  {questionIndex === 3 ? "REVEAL MY FATE" : "NEXT QUESTION"}
                </span>
                <ArrowRight size={18} />
              </button>

              <p className="tiny-note">
                SANTA IS TAKING NOTES. 👀
              </p>
            </motion.section>
          )}

          {screen === "result" && (
            <motion.section
              key="result"
              className="result-screen"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="top-label">
                <Sparkles size={14} />
                <span>OFFICIAL NORTH POLE VERDICT</span>
                <Sparkles size={14} />
              </div>

              <div className="result-card">
                <div className="result-stamp">
                  <span>THE VERDICT IS IN</span>
                </div>

                <div className="result-emoji">{result.emoji}</div>

                <p className="result-status">{result.status}</p>

                <h1 className="result-title">{result.title}</h1>

                <p className="result-description">
                  {result.description}
                </p>

                <div className="aura-area">
                  <div className="aura-heading">
                    <span>YOUR CHRISTMAS AURA</span>
                    <span className="aura-number">{aura}/100</span>
                  </div>

                  <div className="aura-track">
                    <motion.div
                      className="aura-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${aura}%` }}
                      transition={{ duration: 1, delay: 0.3 }}
                    />
                  </div>
                </div>

                <div className="roast-box">
                  <span className="roast-label">
                    🎅 SANTA'S PERSONAL MESSAGE
                    {aiRoast
                      ? " · AI GENERATED ✨"
                      : roastLoading
                      ? " · SANTA IS THINKING..."
                      : ""}
                  </span>
                  <p>{aiRoast || result.roast}</p>
                </div>

                <div className="result-footer">
                  <span>NAUGHTYLIST.EXE</span>
                  <span>VERIFIED BY SANTA ✦</span>
                </div>
              </div>

              <button
                className="replay-button"
                onClick={playYassu}
                type="button"
              >
                <Music2 size={17} />
                <span>SUMMON YASSU AGAIN 💀</span>
              </button>

              <button className="share-button" onClick={shareResult}>
                <Share2 size={17} />
                <span>{copied ? "COPIED!" : "SHARE MY VERDICT"}</span>
              </button>

              <button
                className="certificate-button"
                onClick={downloadCertificate}
                type="button"
              >
                🎓 GET MY CERTIFICATE
              </button>

              <button
                className="challenge-button"
                onClick={() => {
                  setShowChallengeForm((open) => !open);
                  setChallengeUrl("");
                }}
                type="button"
              >
                <Star size={17} />
                <span>CHALLENGE YOUR FRIENDS ⚔️</span>
              </button>

              {showChallengeForm && (
                <div className="challenge-form">
                  <label htmlFor="challenge-name">WHAT NAME SHOULD SANTA DISPLAY?</label>
                  <input
                    id="challenge-name"
                    type="text"
                    maxLength={24}
                    value={challengeName}
                    onChange={(event) => setChallengeName(event.target.value)}
                    placeholder="Enter your name"
                  />
                  <div className="challenge-form-actions">
                    <button type="button" onClick={challengeFriends}>
                      CREATE CHALLENGE LINK ⚔️
                    </button>
                    <button
                      type="button"
                      className="challenge-cancel"
                      onClick={() => setShowChallengeForm(false)}
                    >
                      CANCEL
                    </button>
                  </div>
                </div>
              )}

              {challengeUrl && (
                <div className="challenge-link-box">
                  <p>Your challenge link is ready! Send it to your friend:</p>
                  <input
                    aria-label="Your challenge link"
                    readOnly
                    value={challengeUrl}
                    onFocus={(event) => event.currentTarget.select()}
                  />
                  <button type="button" onClick={copyChallengeLink}>
                    {challengeCopied ? "COPIED! ✓" : "COPY CHALLENGE LINK"}
                  </button>
                </div>
              )}

              <button
                className="try-again-button"
                onClick={startQuiz}
              >
                <RotateCcw size={15} />
                TRY AGAIN
              </button>
            </motion.section>
          )}

          {screen === "comparison" && incomingChallenge && (
            <motion.section
              key="comparison"
              className="result-screen comparison-screen"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              transition={{ duration: 0.45 }}
            >
              <div className="top-label">
                <Sparkles size={14} />
                <span>THE NORTH POLE SHOWDOWN</span>
                <Sparkles size={14} />
              </div>

              <div className="comparison-heading">
                <div className="comparison-trophy">🏆</div>
                <h1>FRIENDSHIP IS OVER.</h1>
                <p>Santa has compared your Christmas behaviour.</p>
              </div>

              <div className="comparison-grid">
                <div className="comparison-card">
                  <span className="comparison-label">CHALLENGER</span>
                  <div className="comparison-emoji">{incomingChallenge.emoji}</div>
                  <h2>{incomingChallenge.name}</h2>
                  <p className="comparison-status">{incomingChallenge.status}</p>
                  <strong className="comparison-score">
                    {incomingChallenge.aura}<small>/100</small>
                  </strong>
                  <span className="comparison-title">{incomingChallenge.title}</span>
                </div>

                <div className="comparison-vs">VS</div>

                <div className="comparison-card your-comparison-card">
                  <span className="comparison-label">YOU</span>
                  <div className="comparison-emoji">{result.emoji}</div>
                  <h2>YOU</h2>
                  <p className="comparison-status">{result.status}</p>
                  <strong className="comparison-score">
                    {aura}<small>/100</small>
                  </strong>
                  <span className="comparison-title">{result.title}</span>
                </div>
              </div>

              <div className="winner-box">
                {aura > incomingChallenge.aura ? (
                  <>
                    <span>👑 THE WINNER IS YOU!</span>
                    <p>Santa is impressed. {incomingChallenge.name} needs to explain themselves.</p>
                  </>
                ) : aura < incomingChallenge.aura ? (
                  <>
                    <span>💀 {incomingChallenge.name.toUpperCase()} WINS!</span>
                    <p>You have officially been out-chaosed. Better luck next Christmas.</p>
                  </>
                ) : (
                  <>
                    <span>🤝 IT'S A TIE!</span>
                    <p>Both of you are equally suspicious. Santa is keeping an eye on you.</p>
                  </>
                )}
              </div>

              <button className="replay-button" onClick={playYassu} type="button">
                <Music2 size={17} />
                <span>SUMMON YASSU AGAIN 💀</span>
              </button>

              <button className="primary-button comparison-replay" onClick={startQuiz}>
                <span>PLAY AGAIN</span>
                <RotateCcw size={16} />
              </button>

              <button
                className="try-again-button"
                onClick={() => {
                  setIncomingChallenge(null);
                  window.history.replaceState({}, "", window.location.pathname);
                  setScreen("home");
                }}
              >
                BACK TO HOME
              </button>
            </motion.section>
          )}

        </AnimatePresence>
      </div>

      <footer className="site-footer">
        <span>© 2026 NAUGHTYLIST.EXE</span>
        <span>BUILT WITH CHRISTMAS CHAOS <Gift size={13} /></span>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          min-height: 100%;
          background: #071426;
          color: #f2f4f5;
          font-family: 'DM Sans', sans-serif;
        }

        button {
          font: inherit;
        }

        button:focus-visible {
          outline: 2px solid #e7b968;
          outline-offset: 4px;
        }

        .site {
          position: relative;
          min-height: 100vh;
          overflow: hidden;
          background:
            radial-gradient(ellipse at 50% 35%, #173653 0%, transparent 55%),
            linear-gradient(180deg, #071426 0%, #0a1c31 55%, #071426 100%);
          isolation: isolate;
          display: flex;
          flex-direction: column;
        }

        .stars {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: -1;
          opacity: 0.4;
          background-image:
            radial-gradient(1px 1px at 10% 20%, white 100%, transparent),
            radial-gradient(1px 1px at 30% 70%, white 100%, transparent),
            radial-gradient(2px 2px at 80% 30%, white 100%, transparent),
            radial-gradient(1px 1px at 65% 12%, white 100%, transparent),
            radial-gradient(1px 1px at 90% 75%, white 100%, transparent),
            radial-gradient(2px 2px at 45% 42%, white 100%, transparent);
          background-size: 250px 250px;
        }

        .sky-glow {
          position: absolute;
          top: -180px;
          left: 50%;
          transform: translateX(-50%);
          width: 700px;
          height: 450px;
          background: #244c6a;
          filter: blur(140px);
          opacity: 0.17;
          pointer-events: none;
          z-index: -1;
        }

        .moon {
          position: absolute;
          top: 105px;
          right: 12%;
          width: 85px;
          height: 85px;
          border-radius: 50%;
          background: #e7dfc6;
          box-shadow: 0 0 55px #e7dfc633;
          opacity: 0.85;
          pointer-events: none;
          z-index: -1;
        }

        .snow-container {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
          z-index: 0;
        }

        .snowflake {
          position: absolute;
          top: -15px;
          border-radius: 50%;
          background: #e6f3ff;
          opacity: 0.65;
          pointer-events: none;
          animation: snowfall linear infinite;
        }

        @keyframes snowfall {
          from {
            transform: translateY(-20px) translateX(0);
          }
          to {
            transform: translateY(110vh) translateX(35px);
          }
        }

        .navbar {
          position: relative;
          z-index: 5;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 25px 7%;
          border-bottom: 1px solid #ffffff12;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 9px;
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 2px;
        }

        .brand-icon {
          color: #e7b968;
          font-size: 22px;
        }

        .brand-dot {
          color: #d6a65a;
        }

        .sound-button {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #d5e0eb;
          background: #ffffff08;
          border: 1px solid #ffffff24;
          padding: 10px 14px;
          border-radius: 30px;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          cursor: pointer;
          transition: 0.2s;
        }

        .sound-button:hover {
          border-color: #e7b968;
          color: #e7b968;
        }

        .page-content {
          position: relative;
          z-index: 2;
          width: 100%;
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 55px 20px 65px;
        }

        .home-screen,
        .quiz-screen,
        .result-screen {
          width: 100%;
          max-width: 680px;
          text-align: center;
          margin: auto;
        }

        .top-label {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 12px;
          color: #d9b66f;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 2.5px;
        }

        .hero-art {
          position: relative;
          height: 190px;
          max-width: 520px;
          margin: 15px auto 10px;
          overflow: hidden;
          border-bottom: 1px solid #e7b96833;
        }

        .hero-glow {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 240px;
          height: 130px;
          background: #d5a85d;
          opacity: 0.12;
          filter: blur(60px);
        }

        .hero-moon {
          position: absolute;
          right: 90px;
          top: 10px;
          font-size: 65px;
          color: #e8dfc7;
          opacity: 0.9;
        }

        .hero-sleigh {
          position: absolute;
          left: 50%;
          top: 65px;
          transform: translateX(-50%);
          font-size: 70px;
          filter: drop-shadow(0 0 15px #e7b96844);
        }

        .hero-santa {
          position: absolute;
          left: 47%;
          top: 30px;
          font-size: 30px;
        }

        .hero-tree {
          position: absolute;
          bottom: 5px;
          font-size: 58px;
          opacity: 0.85;
        }

        .left-tree {
          left: 15px;
        }

        .right-tree {
          right: 15px;
        }

        .hero-ground {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 14px;
          background: linear-gradient(180deg, #dce9f0, #aabfcd);
          border-radius: 50% 50% 0 0;
          opacity: 0.55;
        }

        .eyebrow {
          color: #e7b968;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          letter-spacing: 5px;
          margin: 28px 0 12px;
        }

        .hero-title {
          margin: 0;
          font-family: 'Playfair Display', serif;
          font-size: clamp(37px, 7vw, 66px);
          line-height: 1.12;
          font-weight: 700;
          letter-spacing: -1.5px;
          color: #f4f0e8;
        }

        .hero-title span {
          color: #e7b968;
          font-style: italic;
        }

        .hero-description {
          margin: 20px 0 25px;
          color: #b7c7d5;
          font-size: 14px;
          line-height: 1.9;
        }

        .notice-card {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          max-width: 460px;
          margin: 0 auto 28px;
          padding: 14px 18px;
          border: 1px solid #e7b96835;
          background: #e7b9680a;
          color: #e3d8c4;
          font-size: 12px;
          line-height: 1.6;
        }

        .notice-card svg {
          flex-shrink: 0;
          color: #e7b968;
        }

        .primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 22px;
          min-width: 230px;
          padding: 17px 24px;
          color: #101a24;
          background: #e7b968;
          border: 1px solid #f3d99f;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 1.8px;
          cursor: pointer;
          transition: 0.25s ease;
          position: relative;
          z-index: 5;
        }

        .primary-button:hover:not(:disabled) {
          background: #f2d18e;
          transform: translateY(-3px);
          box-shadow: 0 10px 30px #e7b96825;
        }

        .primary-button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .tiny-note {
          margin-top: 18px;
          color: #8195a8;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .home-footer {
          display: flex;
          justify-content: space-between;
          gap: 15px;
          margin-top: 55px;
          padding-top: 17px;
          border-top: 1px solid #ffffff15;
          color: #73889c;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .quiz-screen {
          max-width: 620px;
        }

        .quiz-topline {
          display: flex;
          justify-content: space-between;
          color: #d7b36c;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 2px;
          margin-bottom: 13px;
        }

        .progress-track {
          width: 100%;
          height: 3px;
          background: #ffffff1c;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #e7b968;
        }

        .quiz-icon {
          margin: 38px 0 12px;
          font-size: 37px;
        }

        .question-number {
          color: #d7b36c;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
        }

        .question-title {
          margin: 13px auto;
          max-width: 560px;
          color: #f2eee6;
          font-family: 'Playfair Display', serif;
          font-size: clamp(27px, 5vw, 39px);
          line-height: 1.25;
        }

        .question-subtitle {
          color: #9eafbd;
          font-size: 13px;
          margin-bottom: 30px;
        }

        .options-list {
          display: flex;
          flex-direction: column;
          gap: 11px;
          margin-bottom: 28px;
        }

        .option-button {
          width: 100%;
          min-height: 58px;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 13px 17px;
          text-align: left;
          background: #ffffff08;
          color: #dce4eb;
          border: 1px solid #ffffff1c;
          cursor: pointer;
          transition: 0.2s;
          position: relative;
          z-index: 3;
        }

        .option-button:hover {
          border-color: #e7b96880;
          background: #e7b9680c;
        }

        .option-button.selected {
          border-color: #e7b968;
          background: #e7b96818;
          color: #f5dfb4;
        }

        .option-letter {
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          border: 1px solid #ffffff2b;
          color: #d7b36c;
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          flex-shrink: 0;
        }

        .option-text {
          flex: 1;
          font-size: 13px;
          line-height: 1.5;
        }

        .option-check {
          color: #e7b968;
        }

        .next-button {
          width: 100%;
        }

        .result-screen {
          max-width: 570px;
        }

        .result-card {
          position: relative;
          margin: 28px auto 20px;
          padding: 35px 32px 25px;
          border: 1px solid #e7b96866;
          background:
            linear-gradient(145deg, #132c43, #0b1c30 75%);
          box-shadow: 0 20px 70px #00000040;
          z-index: 3;
        }

        .result-stamp {
          display: inline-block;
          padding: 7px 14px;
          border: 1px solid #e7b96870;
          color: #e7b968;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 2px;
        }

        .result-emoji {
          font-size: 58px;
          margin: 17px 0 4px;
        }

        .result-status {
          color: #e7b968;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 3px;
          margin: 7px 0;
        }

        .result-title {
          margin: 8px 0;
          font-family: 'Playfair Display', serif;
          font-size: clamp(27px, 5vw, 39px);
          line-height: 1.15;
          color: #f5eee2;
        }

        .result-description {
          color: #b4c3d0;
          font-size: 13px;
          line-height: 1.7;
        }

        .aura-area {
          margin: 28px 0;
          text-align: left;
        }

        .aura-heading {
          display: flex;
          justify-content: space-between;
          color: #c2d0dc;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
          margin-bottom: 10px;
        }

        .aura-number {
          color: #e7b968;
          font-size: 13px;
        }

        .aura-track {
          height: 7px;
          background: #ffffff1b;
          overflow: hidden;
        }

        .aura-fill {
          height: 100%;
          background: linear-gradient(90deg, #a52a35, #e7b968);
        }

        .roast-box {
          text-align: left;
          padding: 17px;
          border-left: 2px solid #e7b968;
          background: #ffffff08;
        }

        .roast-label {
          color: #e7b968;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.2px;
        }

        .roast-box p {
          color: #e0e5e9;
          font-family: 'Playfair Display', serif;
          font-size: 16px;
          line-height: 1.6;
          margin: 10px 0 0;
        }

        .result-footer {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          padding-top: 20px;
          margin-top: 20px;
          border-top: 1px solid #ffffff18;
          color: #7e93a5;
          font-family: 'DM Mono', monospace;
          font-size: 8px;
          letter-spacing: 1px;
        }

        .replay-button,
        .share-button,
        .try-again-button {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          margin: 12px auto;
          cursor: pointer;
          pointer-events: auto;
          transition: 0.2s;
        }

        .replay-button {
          width: 100%;
          max-width: 340px;
          padding: 15px;
          color: #e7b968;
          background: #e7b96812;
          border: 1px solid #e7b96870;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.4px;
        }

        .replay-button:hover {
          background: #e7b96825;
          transform: translateY(-2px);
        }

        .share-button {
          width: 100%;
          max-width: 340px;
          padding: 14px;
          color: #0c1a27;
          background: #e7b968;
          border: 1px solid #f3d99f;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.4px;
        }

        .share-button:hover {
          background: #f2d18e;
        }

        .certificate-button {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          max-width: 340px;
          margin: 12px auto;
          padding: 16px;
          color: #e7b968;
          background: transparent;
          border: 1px solid #e7b968;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.5px;
          cursor: pointer;
          transition: 0.2s;
        }

        .certificate-button:hover {
          color: #071426;
          background: #e7b968;
          transform: translateY(-2px);
        }

        .challenge-button {
          position: relative;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          max-width: 340px;
          margin: 12px auto;
          padding: 16px;
          color: #f2eee6;
          background: linear-gradient(110deg, #8f2938, #bd4950);
          border: 1px solid #e58b83;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1.3px;
          cursor: pointer;
          transition: 0.2s;
        }

        .challenge-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 9px 25px #a52a3540;
          background: linear-gradient(110deg, #a83242, #d05a5f);
        }

        .challenge-form,
        .challenge-link-box {
          width: 100%;
          max-width: 420px;
          margin: 14px auto;
          padding: 20px;
          text-align: left;
          border: 1px solid #e7b96870;
          background: #10263b;
        }

        .challenge-form label {
          display: block;
          margin-bottom: 10px;
          color: #e7b968;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.2px;
        }

        .challenge-form input,
        .challenge-link-box input {
          width: 100%;
          min-width: 0;
          padding: 13px;
          color: #f2eee6;
          background: #071426;
          border: 1px solid #ffffff35;
          outline: none;
          font: 13px 'DM Sans', sans-serif;
        }

        .challenge-form input:focus,
        .challenge-link-box input:focus {
          border-color: #e7b968;
        }

        .challenge-form-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 13px;
        }

        .challenge-form-actions button,
        .challenge-link-box button {
          padding: 12px 14px;
          color: #071426;
          background: #e7b968;
          border: 1px solid #f3d99f;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .challenge-form-actions .challenge-cancel {
          color: #c5d2df;
          background: transparent;
          border-color: #ffffff35;
        }

        .challenge-link-box p {
          margin: 0 0 12px;
          color: #dce4eb;
          font-size: 12px;
        }

        .challenge-link-box button {
          width: 100%;
          margin-top: 10px;
        }

        .challenge-invite {
          display: flex;
          align-items: center;
          gap: 14px;
          max-width: 460px;
          margin: -8px auto 24px;
          padding: 16px 18px;
          text-align: left;
          border: 1px solid #d87978a0;
          background: #a52a351c;
          color: #f2e5df;
        }

        .challenge-invite-icon {
          font-size: 27px;
        }

        .challenge-invite strong {
          color: #f0bd83;
          font-family: 'DM Mono', monospace;
          font-size: 10px;
          letter-spacing: 1px;
        }

        .challenge-invite p {
          margin: 6px 0 0;
          color: #c4d0d9;
          font-size: 12px;
          line-height: 1.6;
        }

        .comparison-heading {
          margin: 25px 0 20px;
        }

        .comparison-trophy {
          font-size: 48px;
        }

        .comparison-heading h1 {
          margin: 8px 0;
          color: #f0c779;
          font-family: 'Playfair Display', serif;
          font-size: clamp(27px, 5vw, 39px);
        }

        .comparison-heading p {
          color: #b4c3d0;
          font-size: 13px;
        }

        .comparison-grid {
          display: grid;
          grid-template-columns: 1fr 42px 1fr;
          align-items: stretch;
          gap: 8px;
          margin: 22px 0;
        }

        .comparison-card {
          min-width: 0;
          padding: 20px 12px;
          border: 1px solid #e7b96866;
          background: linear-gradient(145deg, #132c43, #0b1c30 75%);
        }

        .your-comparison-card {
          border-color: #d87978;
          background: linear-gradient(145deg, #382333, #172137 75%);
        }

        .comparison-label {
          color: #d7b36c;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .comparison-emoji {
          margin: 12px 0 5px;
          font-size: 37px;
        }

        .comparison-card h2 {
          overflow-wrap: anywhere;
          margin: 5px 0;
          color: #f4f0e8;
          font-family: 'Playfair Display', serif;
          font-size: 17px;
        }

        .comparison-status {
          min-height: 30px;
          color: #d7b36c;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          line-height: 1.5;
        }

        .comparison-score {
          display: block;
          margin: 8px 0;
          color: #f0c779;
          font-family: 'Playfair Display', serif;
          font-size: 37px;
        }

        .comparison-score small {
          color: #aebdca;
          font-family: 'DM Sans', sans-serif;
          font-size: 12px;
        }

        .comparison-title {
          display: block;
          color: #b4c3d0;
          font-size: 10px;
          line-height: 1.5;
        }

        .comparison-vs {
          align-self: center;
          color: #e7b968;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          font-weight: 700;
        }

        .winner-box {
          margin: 18px 0 22px;
          padding: 18px;
          border: 1px solid #e7b96866;
          background: #e7b96812;
        }

        .winner-box span {
          color: #f0c779;
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          letter-spacing: 1px;
        }

        .winner-box p {
          margin: 8px 0 0;
          color: #c4d0d9;
          font-size: 12px;
          line-height: 1.6;
        }

        .comparison-replay {
          width: 100%;
          max-width: 340px;
        }

        .try-again-button {
          padding: 10px 15px;
          color: #aebdca;
          background: transparent;
          border: none;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1.5px;
        }

        .try-again-button:hover {
          color: #e7b968;
        }

        .site-footer {
          position: relative;
          z-index: 2;
          display: flex;
          justify-content: space-between;
          gap: 15px;
          padding: 18px 7%;
          border-top: 1px solid #ffffff12;
          color: #73889c;
          font-family: 'DM Mono', monospace;
          font-size: 9px;
          letter-spacing: 1px;
        }

        .site-footer span:last-child {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .site-footer svg {
          color: #d7b36c;
        }

        @media (max-width: 600px) {
          .navbar {
            padding: 19px 5%;
          }

          .brand {
            font-size: 10px;
            letter-spacing: 1px;
          }

          .sound-button {
            padding: 9px 11px;
            font-size: 8px;
          }

          .page-content {
            padding: 40px 17px 50px;
          }

          .hero-art {
            height: 155px;
          }

          .hero-moon {
            right: 45px;
            font-size: 52px;
          }

          .hero-sleigh {
            font-size: 58px;
          }

          .hero-tree {
            font-size: 43px;
          }

          .hero-title {
            font-size: clamp(34px, 9vw, 49px);
          }

          .hero-description {
            font-size: 12px;
          }

          .home-footer,
          .site-footer {
            font-size: 7px;
          }

          .result-card {
            padding: 27px 18px 20px;
          }

          .result-footer {
            font-size: 7px;
          }

          .question-title {
            font-size: 29px;
          }

          .option-text {
            font-size: 12px;
          }

          .moon {
            right: -25px;
            opacity: 0.4;
          }

          .comparison-grid {
            grid-template-columns: minmax(0, 1fr) 28px minmax(0, 1fr);
            gap: 4px;
          }

          .comparison-card {
            padding: 16px 7px;
          }

          .comparison-card h2 {
            font-size: 14px;
          }

          .comparison-score {
            font-size: 31px;
          }

          .comparison-title {
            font-size: 9px;
          }
        }
      `}</style>
    </main>
  );
}
