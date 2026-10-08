import React, { useState, useRef, useEffect } from "react";

// --- MEMORY DATA ARCHITECTURE WITH YOUR MEDIA ---
const BELLE_MEMORIES = [
  {
    id: "m1",
    cat: "milestone",
    date: "October 8, 2022",
    title: "Baby Belle's Final Farewell",
    from: "The Family",
    emoji: "🪴",
    note: "Planting Belle's ashes together in the garden surrounded by flowers and love. Forever rooted in our hearts.",
    media: [
      {
        url: "https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=800&q=80",
        type: "image",
        caption: "Planting her ashes in the garden surrounded by family",
      },
      {
        url: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80",
        type: "image",
        caption: "The beautiful memorial urn nestled among the flowers",
      },
    ],
  },
  {
    id: "m2",
    cat: "moment",
    date: "Treasured Days",
    title: "Car Rides & Happy Smiles",
    from: "Eoin",
    emoji: "🚗",
    note: "Belle sitting proudly in the passenger seat, ears up, ready for the next grand adventure.",
    media: [
      {
        url: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=800&q=80",
        type: "image",
        caption: "Belle smiling wide on our road trips",
      },
    ],
  },
  {
    id: "m3",
    cat: "treasure",
    date: "Always",
    title: "Comfy Cozy Belly Rubs",
    from: "The Whole Family",
    emoji: "🐾",
    note: "Rolling over in her favourite fluffy bed, looking up with those big gentle eyes asking for belly scratches.",
    media: [
      {
        url: "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80",
        type: "image",
        caption: "Her playful, loving pose in her bed",
      },
    ],
  },
  {
    id: "m4",
    cat: "photo",
    date: "Family Reunion",
    title: "Grounded in Love",
    from: "Family",
    emoji: "💛",
    note: "All of us together, sharing the warmth and holding onto the sweetest memories of our girl.",
    media: [
      {
        url: "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=800&q=80",
        type: "image",
        caption: "Family gather around Belle's resting place",
      },
    ],
  },
];

const SWIPE_CARDS = [
  {
    id: "s1",
    tag: "A HEAVY HEART",
    title: "Some Goodbye Words Are Hard to Say",
    body: "Belle was more than a dog; she was the rhythmic heart of our home. Her wagging tail welcomed every morning, and her gentle gaze made every hard day soft.",
    accent: "🐾",
  },
  {
    id: "s2",
    tag: "UNCONDITIONAL",
    title: "A Love Without Conditions",
    body: "She taught us patience, pure presence, and how to find joy in simple car rides and quiet sunbeams on the floor.",
    accent: "🌿",
  },
  {
    id: "s3",
    tag: "FOREVER KEPT",
    title: "Unlocking Her Legacy",
    body: "Swipe through these pages to reveal the golden key. Inside this handcrafted memory box lies every cherished moment we refuse to forget.",
    accent: "🔑",
  },
];

const CATEGORIES = [
  { id: "all", label: "All Memories" },
  { id: "milestone", label: "Farewell & Milestones" },
  { id: "moment", label: "Car Rides & Smiles" },
  { id: "treasure", label: "Comfort & Joy" },
];

export default function BelleInteractiveMemoryBox() {
  // Navigation / Phase states
  const [phase, setPhase] = useState("swipe"); // 'swipe' | 'box_closed' | 'box_open'
  const [swipeIdx, setSwipeIdx] = useState(0);

  // Box opening interaction state
  const [isLidUnlocked, setIsLidUnlocked] = useState(false);
  const [isLidOpen, setIsLidOpen] = useState(false);

  // App Content state
  const [activeFilter, setActiveFilter] = useState("all");
  const [memories, setMemories] = useState(BELLE_MEMORIES);
  const [activeTab, setActiveTab] = useState("gallery"); // 'gallery' | 'poem' | 'journal'

  // Modal / Lightbox states
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeLightbox, setActiveLightbox] = useState(null);
  const [newMem, setNewMem] = useState({
    title: "",
    date: "",
    from: "",
    note: "",
    emoji: "🐾",
    cat: "moment",
  });

  // Touch handling for swipe file
  const touchStartX = useRef(null);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartX.current) return;
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    if (diffX > 50 && swipeIdx < SWIPE_CARDS.length - 1) {
      setSwipeIdx((prev) => prev + 1);
    } else if (diffX < -50 && swipeIdx > 0) {
      setSwipeIdx((prev) => prev - 1);
    }
    touchStartX.current = null;
  };

  const unlockAndOpenBox = () => {
    setIsLidUnlocked(true);
    setTimeout(() => {
      setIsLidOpen(true);
      setTimeout(() => {
        setPhase("box_open");
      }, 1100);
    }, 400);
  };

  const filteredMemories =
    activeFilter === "all"
      ? memories
      : memories.filter((m) => m.cat === activeFilter);

  return (
    <div className="mobile-shell">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800&family=Lora:ital,wght@0,400;0,500;0,600;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; user-select: none; -webkit-tap-highlight-color: transparent; }

        body {
          background-color: #0d0b09;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          font-family: 'Plus Jakarta Sans', sans-serif;
          color: #e6dfd5;
          overflow: hidden;
        }

        .mobile-shell {
          width: 100vw;
          max-width: 430px;
          height: 100vh;
          max-height: 932px;
          background: #14110e;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 80px rgba(0,0,0,0.8), 0 0 0 12px #221c17;
          border-radius: 44px;
          display: flex;
          flex-direction: column;
        }

        /* --- SWIPE FILE EXPERIENCE --- */
        .swipe-screen {
          position: absolute;
          inset: 0;
          z-index: 50;
          background: linear-gradient(180deg, #1a1510 0%, #0d0a08 100%);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 60px 24px 40px;
          transition: opacity 0.6s ease, transform 0.6s ease;
        }

        .swipe-screen.hide {
          opacity: 0;
          pointer-events: none;
          transform: translateY(-20px);
        }

        .swipe-header {
          text-align: center;
        }

        .swipe-header .sub {
          font-family: 'Cinzel', serif;
          font-size: 0.7rem;
          letter-spacing: 4px;
          color: #c9a84c;
          text-transform: uppercase;
        }

        .swipe-header .main {
          font-family: 'Cinzel', serif;
          font-size: 1.4rem;
          color: #f3ece0;
          margin-top: 4px;
          font-weight: 700;
        }

        .swipe-card-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          margin: 20px 0;
        }

        .swipe-card {
          width: 100%;
          background: linear-gradient(145deg, #241d16 0%, #17130e 100%);
          border: 1px solid rgba(201, 168, 76, 0.3);
          border-radius: 24px;
          padding: 32px 24px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.6), inset 0 1px 1px rgba(255,255,255,0.1);
          text-align: center;
          position: relative;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        .swipe-card::before {
          content: '';
          position: absolute;
          inset: 6px;
          border: 1px dashed rgba(201, 168, 76, 0.2);
          border-radius: 18px;
          pointer-events: none;
        }

        .swipe-accent {
          font-size: 2.5rem;
          margin-bottom: 16px;
          display: inline-block;
          filter: drop-shadow(0 4px 12px rgba(201, 168, 76, 0.3));
        }

        .swipe-tag {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          letter-spacing: 3px;
          color: #9a7235;
          text-transform: uppercase;
          margin-bottom: 8px;
          display: block;
        }

        .swipe-title {
          font-family: 'Lora', serif;
          font-size: 1.25rem;
          color: #f5efe4;
          margin-bottom: 14px;
          line-height: 1.35;
        }

        .swipe-body {
          font-family: 'Lora', serif;
          font-size: 0.88rem;
          color: #b8aba0;
          line-height: 1.6;
          font-style: italic;
        }

        .swipe-controls {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }

        .dots {
          display: flex;
          gap: 8px;
        }

        .dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(201, 168, 76, 0.25);
          transition: all 0.3s ease;
        }

        .dot.active {
          width: 24px;
          border-radius: 12px;
          background: #c9a84c;
        }

        .btn-gold {
          width: 100%;
          padding: 16px;
          background: linear-gradient(135deg, #c9a84c 0%, #8a6a29 100%);
          border: none;
          border-radius: 30px;
          color: #0f0c08;
          font-family: 'Cinzel', serif;
          font-weight: 700;
          font-size: 0.85rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          box-shadow: 0 10px 25px rgba(201, 168, 76, 0.3);
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-gold:active {
          transform: scale(0.98);
        }

        /* --- TREASURE MEMORY BOX 3D SCENE --- */
        .box-screen {
          position: absolute;
          inset: 0;
          z-index: 40;
          background: radial-gradient(circle at center, #231c15 0%, #0a0806 100%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px;
        }

        .box-title-area {
          text-align: center;
          position: absolute;
          top: 60px;
        }

        .box-title-area h2 {
          font-family: 'Cinzel', serif;
          font-size: 1.4rem;
          color: #e8c97a;
          letter-spacing: 2px;
        }

        .box-title-area p {
          font-family: 'Lora', serif;
          font-size: 0.8rem;
          color: #9e8d7c;
          margin-top: 4px;
          font-style: italic;
        }

        /* Wooden Box Container */
        .treasure-box-wrap {
          width: 290px;
          height: 220px;
          perspective: 1000px;
          cursor: pointer;
          position: relative;
        }

        .box-body-3d {
          width: 100%;
          height: 100%;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.8s ease;
        }

        /* Base Wooden Box Container */
        .box-base {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, #3a2514 0%, #201309 100%);
          border-radius: 16px;
          border: 2px solid #5c3c21;
          box-shadow: 0 30px 60px rgba(0,0,0,0.9), inset 0 2px 4px rgba(255,255,255,0.1);
          overflow: hidden;
        }

        /* Lid with Hinges and Gold Embedded 'A' */
        .box-lid {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #422a17 0%, #29190d 50%, #1a0f07 100%);
          border-radius: 16px;
          border: 2px solid #6e4827;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          transform-origin: top center;
          transition: transform 1.1s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .box-lid.open {
          transform: rotateX(-110deg);
        }

        /* Wood Grain Texture Overlay */
        .wood-grain {
          position: absolute;
          inset: 0;
          background-image: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 3px,
            rgba(0, 0, 0, 0.08) 3px,
            rgba(0, 0, 0, 0.08) 6px
          );
          pointer-events: none;
          border-radius: 14px;
        }

        /* Gold Brass Corners */
        .corner {
          position: absolute;
          width: 24px;
          height: 24px;
          border: 2px solid #c9a84c;
          pointer-events: none;
        }

        .corner-tl { top: 8px; left: 8px; border-right: none; border-bottom: none; }
        .corner-tr { top: 8px; right: 8px; border-left: none; border-bottom: none; }
        .corner-bl { bottom: 8px; left: 8px; border-right: none; border-top: none; }
        .corner-br { bottom: 8px; right: 8px; border-left: none; border-top: none; }

        /* EMBEDDED GOLD LETTER A */
        .gold-emblem-a {
          width: 86px;
          height: 86px;
          border-radius: 50%;
          background: radial-gradient(circle, #f3e5ab 0%, #c9a84c 50%, #7a5c1e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0,0,0,0.6), inset 0 2px 4px rgba(255,255,255,0.6), inset 0 -2px 4px rgba(0,0,0,0.5);
          border: 2px solid #ffd700;
          position: relative;
          animation: emblemGlow 3s infinite alternate;
        }

        @keyframes emblemGlow {
          0% { box-shadow: 0 4px 15px rgba(0,0,0,0.6), 0 0 10px rgba(201, 168, 76, 0.2); }
          100% { box-shadow: 0 4px 20px rgba(0,0,0,0.8), 0 0 25px rgba(201, 168, 76, 0.6); }
        }

        .gold-letter {
          font-family: 'Cinzel', serif;
          font-size: 3rem;
          font-weight: 800;
          color: #2a1b0e;
          text-shadow: 1px 1px 0px rgba(255,255,255,0.4), -1px -1px 0px rgba(0,0,0,0.8);
        }

        .latch-btn {
          margin-top: 18px;
          padding: 6px 16px;
          background: linear-gradient(180deg, #d4af37 0%, #8a6a29 100%);
          border-radius: 12px;
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          color: #1a0f07;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          box-shadow: 0 4px 8px rgba(0,0,0,0.4);
        }

        .tap-prompt {
          position: absolute;
          bottom: -50px;
          width: 100%;
          text-align: center;
          font-family: 'Cinzel', serif;
          font-size: 0.75rem;
          letter-spacing: 3px;
          color: #c9a84c;
          text-transform: uppercase;
          animation: pulse 1.8s infinite ease-in-out;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: translateY(0); }
          50% { opacity: 1; transform: translateY(-4px); }
        }

        /* Interior Glow when Open */
        .box-interior {
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at center, #52351c 0%, #1c1108 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
        }

        .interior-glow {
          width: 120px;
          height: 120px;
          background: rgba(201, 168, 76, 0.4);
          filter: blur(30px);
          border-radius: 50%;
          animation: glowPulse 1.2s infinite alternate;
        }

        @keyframes glowPulse {
          from { opacity: 0.3; transform: scale(0.8); }
          to { opacity: 0.9; transform: scale(1.2); }
        }

        /* --- HIGH-RES GAMIFIED APP MAIN INTERFACE --- */
        .app-screen {
          position: absolute;
          inset: 0;
          z-index: 30;
          background: #120e0b;
          display: flex;
          flex-direction: column;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.8s ease;
        }

        .app-screen.active {
          opacity: 1;
          pointer-events: all;
        }

        /* Header Bar */
        .app-header {
          padding: 50px 20px 16px;
          background: linear-gradient(180deg, #1c1611 0%, rgba(28,22,17,0) 100%);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(201, 168, 76, 0.15);
        }

        .app-brand {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .app-mini-emblem {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: radial-gradient(circle, #f3e5ab 0%, #c9a84c 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Cinzel', serif;
          font-weight: 800;
          color: #1a0f07;
          font-size: 0.9rem;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        }

        .app-title-text h1 {
          font-family: 'Cinzel', serif;
          font-size: 0.95rem;
          color: #f0e6d8;
          letter-spacing: 1px;
        }

        .app-title-text p {
          font-family: 'Lora', serif;
          font-size: 0.68rem;
          color: #a89685;
          font-style: italic;
        }

        .add-quick-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(201, 168, 76, 0.15);
          border: 1px solid rgba(201, 168, 76, 0.4);
          color: #c9a84c;
          font-size: 1.2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        /* Main Scrollable Content Area */
        .app-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px 20px 90px;
          scrollbar-width: none;
        }
        .app-body::-webkit-scrollbar { display: none; }

        /* Category Filter Chips */
        .filter-scroll {
          display: flex;
          gap: 8px;
          overflow-x: auto;
          padding-bottom: 12px;
          scrollbar-width: none;
        }
        .filter-scroll::-webkit-scrollbar { display: none; }

        .chip {
          padding: 8px 16px;
          border-radius: 20px;
          background: #1c1712;
          border: 1px solid rgba(201, 168, 76, 0.2);
          font-family: 'Cinzel', serif;
          font-size: 0.68rem;
          color: #a8988a;
          white-space: nowrap;
          cursor: pointer;
          transition: all 0.25s ease;
        }

        .chip.active {
          background: linear-gradient(135deg, #c9a84c 0%, #8a6a29 100%);
          color: #0f0c08;
          font-weight: 700;
          border-color: transparent;
          box-shadow: 0 4px 12px rgba(201, 168, 76, 0.25);
        }

        /* Dedicated Memory Cards */
        .cards-list {
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin-top: 12px;
        }

        .memory-card {
          background: linear-gradient(145deg, #1e1813 0%, #15100c 100%);
          border: 1px solid rgba(201, 168, 76, 0.2);
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          transition: transform 0.2s ease;
        }

        .memory-card-media {
          position: relative;
          width: 100%;
          height: 210px;
          background: #0a0806;
          overflow: hidden;
        }

        .memory-card-media img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }

        .memory-card:hover .memory-card-media img {
          transform: scale(1.04);
        }

        .media-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(15, 12, 8, 0.75);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(201, 168, 76, 0.3);
          padding: 4px 10px;
          border-radius: 12px;
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          color: #e8c97a;
        }

        .memory-card-content {
          padding: 18px 20px;
        }

        .card-top-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 6px;
        }

        .card-date {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          color: #c9a84c;
          letter-spacing: 1px;
        }

        .card-emoji {
          font-size: 1.1rem;
        }

        .card-title {
          font-family: 'Lora', serif;
          font-size: 1.1rem;
          color: #f3ece0;
          font-weight: 600;
          margin-bottom: 8px;
        }

        .card-note {
          font-family: 'Lora', serif;
          font-size: 0.82rem;
          color: #b0a294;
          line-height: 1.55;
          font-style: italic;
        }

        .card-footer {
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px dashed rgba(201, 168, 76, 0.15);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .card-from {
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          color: #8a7868;
        }

        /* Bottom Tab Navigation Bar */
        .app-bottom-bar {
          position: absolute;
          bottom: 0;
          /* "inset-x" is a Tailwind class, not CSS: without left/right the bar
             shrank to its content and the tabs bunched up on the left. */
          left: 0;
          right: 0;
          height: 75px;
          background: rgba(20, 16, 12, 0.92);
          backdrop-filter: blur(16px);
          border-top: 1px solid rgba(201, 168, 76, 0.2);
          display: flex;
          justify-content: space-around;
          align-items: center;
          padding-bottom: 12px;
          z-index: 40;
        }

        .tab-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: #7a6a5c;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-item.active {
          color: #c9a84c;
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .tab-label {
          font-family: 'Cinzel', serif;
          font-size: 0.6rem;
          letter-spacing: 1px;
        }

        /* Dedicated Poem View */
        .poem-container {
          background: linear-gradient(145deg, #1f1812 0%, #140f0b 100%);
          border: 1px solid rgba(201, 168, 76, 0.3);
          border-radius: 20px;
          padding: 30px 24px;
          text-align: center;
          margin-top: 10px;
          position: relative;
        }

        .poem-title {
          font-family: 'Cinzel', serif;
          font-size: 1.1rem;
          color: #e8c97a;
          margin-bottom: 20px;
          letter-spacing: 2px;
        }

        .poem-verses {
          font-family: 'Lora', serif;
          font-size: 0.9rem;
          color: #d8cebf;
          line-height: 2.1;
          font-style: italic;
          white-space: pre-line;
        }

        /* MODAL DIALOGS */
        .modal-overlay {
          position: absolute;
          inset: 0;
          z-index: 100;
          background: rgba(0,0,0,0.85);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: flex-end;
        }

        .modal-sheet {
          width: 100%;
          background: #1a140e;
          border-top: 1px solid rgba(201, 168, 76, 0.3);
          border-radius: 28px 28px 0 0;
          padding: 28px 24px 40px;
          max-height: 85vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .modal-header h3 {
          font-family: 'Cinzel', serif;
          font-size: 1.1rem;
          color: #e8c97a;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-family: 'Cinzel', serif;
          font-size: 0.65rem;
          color: #a8988a;
          margin-bottom: 6px;
          letter-spacing: 1px;
        }

        .form-input, .form-textarea {
          width: 100%;
          background: #100d0a;
          border: 1px solid rgba(201, 168, 76, 0.25);
          border-radius: 12px;
          padding: 12px 14px;
          color: #f3ece0;
          font-family: 'Lora', serif;
          font-size: 0.88rem;
          outline: none;
        }

        .form-textarea {
          height: 90px;
          resize: none;
        }

        /* Lightbox Full View */
        .lightbox-screen {
          position: absolute;
          inset: 0;
          z-index: 120;
          background: rgba(8, 6, 4, 0.96);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 50px 20px 40px;
        }

        .lb-top {
          display: flex;
          justify-content: space-between;
          color: #c9a84c;
          font-family: 'Cinzel', serif;
          font-size: 0.8rem;
        }

        .lb-main {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 20px 0;
        }

        .lb-main img {
          max-width: 100%;
          max-height: 55vh;
          border-radius: 12px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.8);
          border: 1px solid rgba(201, 168, 76, 0.3);
        }

        .lb-bottom {
          text-align: center;
        }

        .lb-title {
          font-family: 'Lora', serif;
          font-size: 1.1rem;
          color: #f3ece0;
        }

        .lb-caption {
          font-family: 'Lora', serif;
          font-size: 0.8rem;
          color: #9e8d7c;
          margin-top: 4px;
          font-style: italic;
        }
      `}</style>

      {/* --- PHASE 1: HEARTFELT FAMILY SWIPE FILE --- */}
      <div
        className={`swipe-screen ${phase !== "swipe" ? "hide" : ""}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="swipe-header">
          <div className="sub">In Loving Memory</div>
          <div className="main">Belle's Journey</div>
        </div>

        <div className="swipe-card-container">
          <div className="swipe-card">
            <span className="swipe-accent">
              {SWIPE_CARDS[swipeIdx].accent}
            </span>
            <span className="swipe-tag">{SWIPE_CARDS[swipeIdx].tag}</span>
            <h2 className="swipe-title">{SWIPE_CARDS[swipeIdx].title}</h2>
            <p className="swipe-body">{SWIPE_CARDS[swipeIdx].body}</p>
          </div>
        </div>

        <div className="swipe-controls">
          <div className="dots">
            {SWIPE_CARDS.map((_, i) => (
              <div
                key={i}
                className={`dot ${swipeIdx === i ? "active" : ""}`}
              />
            ))}
          </div>

          {swipeIdx < SWIPE_CARDS.length - 1 ? (
            <button
              className="btn-gold"
              onClick={() => setSwipeIdx((prev) => prev + 1)}
            >
              Continue Swipe ✦
            </button>
          ) : (
            <button
              className="btn-gold"
              onClick={() => setPhase("box_closed")}
            >
              Unlock Memory Box 🗝️
            </button>
          )}
        </div>
      </div>

      {/* --- PHASE 2: TREASURE MEMORY BOX SCENE --- */}
      {/* Only while closed: the box screen sits above the app screen (z-index
          40 vs 30), so leaving it mounted in 'box_open' hid the whole app. */}
      {phase === "box_closed" && (
        <div className="box-screen">
          <div className="box-title-area">
            <h2>The Sacred Keepsake</h2>
            <p>Tap the golden emblem to unlock</p>
          </div>

          <div className="treasure-box-wrap" onClick={unlockAndOpenBox}>
            <div className="box-body-3d">
              {/* Box Base */}
              <div className="box-base">
                <div className="wood-grain" />
                <div className="box-interior">
                  <div className="interior-glow" />
                </div>
              </div>

              {/* Box Lid */}
              <div className={`box-lid ${isLidOpen ? "open" : ""}`}>
                <div className="wood-grain" />
                <div className="corner corner-tl" />
                <div className="corner corner-tr" />
                <div className="corner corner-bl" />
                <div className="corner corner-br" />

                {/* GOLD EMBEDDED LETTER 'A' */}
                <div className="gold-emblem-a">
                  <span className="gold-letter">A</span>
                </div>

                <div className="latch-btn">
                  {isLidUnlocked ? "Unlocked" : "Tap to Open"}
                </div>
              </div>
            </div>

            {!isLidUnlocked && (
              <div className="tap-prompt">✦ Tap Box Lid to Open ✦</div>
            )}
          </div>
        </div>
      )}

      {/* --- PHASE 3: INTERACTIVE GAMIFIED APP INTERFACE --- */}
      <div
        className={`app-screen ${phase === "box_open" ? "active" : ""}`}
      >
        {/* Header Bar */}
        <div className="app-header">
          <div className="app-brand">
            <div className="app-mini-emblem">A</div>
            <div className="app-title-text">
              <h1>Belle's Sanctuary</h1>
              <p>Forever in our hearts 🐾</p>
            </div>
          </div>
          <div
            className="add-quick-btn"
            onClick={() => setShowAddModal(true)}
          >
            +
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="app-body">
          {activeTab === "gallery" && (
            <>
              {/* Category Filter Scroll */}
              <div className="filter-scroll">
                {CATEGORIES.map((c) => (
                  <div
                    key={c.id}
                    className={`chip ${
                      activeFilter === c.id ? "active" : ""
                    }`}
                    onClick={() => setActiveFilter(c.id)}
                  >
                    {c.label}
                  </div>
                ))}
              </div>

              {/* Memory Cards */}
              <div className="cards-list">
                {filteredMemories.map((m) => (
                  <div key={m.id} className="memory-card">
                    {m.media && m.media.length > 0 && (
                      <div
                        className="memory-card-media"
                        onClick={() =>
                          setActiveLightbox({
                            media: m.media[0],
                            title: m.title,
                          })
                        }
                      >
                        <img src={m.media[0].url} alt={m.title} />
                        <div className="media-badge">
                          ✦ {m.media.length} Photo
                        </div>
                      </div>
                    )}
                    <div className="memory-card-content">
                      <div className="card-top-line">
                        <span className="card-date">{m.date}</span>
                        <span className="card-emoji">{m.emoji}</span>
                      </div>
                      <h3 className="card-title">{m.title}</h3>
                      <p className="card-note">{m.note}</p>
                      <div className="card-footer">
                        <span className="card-from">Kept by {m.from}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === "poem" && (
            <div className="poem-container">
              <h2 className="poem-title">✦ Rainbow Bridge Tribute ✦</h2>
              <p className="poem-verses">
                {`You came into our lives so small,
A little soul who gave us all.
You asked for nothing but our time,
And filled our days with joy sublime.

The leash still hangs beside the door,
Your bowl still sits upon the floor.
We look for you in morning light —
You're everywhere, just out of sight.

No words can hold what you have meant,
A life so pure, so wholly spent.
In love, sweet friend, sleep soft and deep.
The best of us, yours still to keep.`}
              </p>
            </div>
          )}

          {activeTab === "journal" && (
            <div className="poem-container">
              <h2 className="poem-title">✦ Family Journal ✦</h2>
              <p className="poem-verses">
                {`October 8, 2022
We gathered in the garden today to say our final soft goodbyes to sweet Belle.

Her spirit remains in every corner of the house, in every sunny patch on the rug, and in every car ride we will ever take.`}
              </p>
            </div>
          )}
        </div>

        {/* Bottom Tab Bar Navigation */}
        <div className="app-bottom-bar">
          <div
            className={`tab-item ${activeTab === "gallery" ? "active" : ""}`}
            onClick={() => setActiveTab("gallery")}
          >
            <span className="tab-icon">🖼️</span>
            <span className="tab-label">Memories</span>
          </div>
          <div
            className={`tab-item ${activeTab === "poem" ? "active" : ""}`}
            onClick={() => setActiveTab("poem")}
          >
            <span className="tab-icon">📜</span>
            <span className="tab-label">Tribute</span>
          </div>
          <div
            className={`tab-item ${activeTab === "journal" ? "active" : ""}`}
            onClick={() => setActiveTab("journal")}
          >
            <span className="tab-icon">📖</span>
            <span className="tab-label">Journal</span>
          </div>
        </div>

        {/* Add Memory Modal Sheet */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-sheet">
              <div className="modal-header">
                <h3>Place a New Memory</h3>
                <span
                  style={{ cursor: "pointer", color: "#c9a84c" }}
                  onClick={() => setShowAddModal(false)}
                >
                  ✕
                </span>
              </div>
              <div className="form-group">
                <label>Title</label>
                <input
                  className="form-input"
                  placeholder="e.g. Favorite Park Walk"
                  value={newMem.title}
                  onChange={(e) =>
                    setNewMem({ ...newMem, title: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Date or Time</label>
                <input
                  className="form-input"
                  placeholder="e.g. Summer 2021"
                  value={newMem.date}
                  onChange={(e) =>
                    setNewMem({ ...newMem, date: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Memory Note</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the moment..."
                  value={newMem.note}
                  onChange={(e) =>
                    setNewMem({ ...newMem, note: e.target.value })
                  }
                />
              </div>
              <button
                className="btn-gold"
                onClick={() => {
                  if (newMem.title) {
                    setMemories([
                      ...memories,
                      { ...newMem, id: Date.now().toString(), from: "Family" },
                    ]);
                    setShowAddModal(false);
                    setNewMem({
                      title: "",
                      date: "",
                      from: "",
                      note: "",
                      emoji: "🐾",
                      cat: "moment",
                    });
                  }
                }}
              >
                Keep Forever ✦
              </button>
            </div>
          </div>
        )}

        {/* Lightbox Screen */}
        {activeLightbox && (
          <div className="lightbox-screen">
            <div className="lb-top">
              <span>Kept Memory</span>
              <span
                style={{ cursor: "pointer" }}
                onClick={() => setActiveLightbox(null)}
              >
                ✕ Close
              </span>
            </div>
            <div className="lb-main">
              <img src={activeLightbox.media.url} alt="" />
            </div>
            <div className="lb-bottom">
              <div className="lb-title">{activeLightbox.title}</div>
              <div className="lb-caption">{activeLightbox.media.caption}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
