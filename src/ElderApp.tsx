import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// ─── Images ───────────────────────────────────────────────────────────────────
const IMG_PILLS = 'https://images.unsplash.com/photo-1573883429746-084be9b5cfca?w=300&h=300&fit=crop&auto=format'

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  teal50:   '#f0fdfa',
  teal100:  '#ccfbf1',
  teal500:  '#14b8a6',
  teal600:  '#0d9488',
  teal700:  '#0f766e',
  green100: '#dcfce7',
  green500: '#22c55e',
  pageBg:   '#ffffff',
  // gradients
  tealGrad:    'linear-gradient(135deg, #0d9488, #14b8a6)',
  greenGrad:   'linear-gradient(135deg, #059669, #22c55e)',
  tealBubble:  'linear-gradient(135deg, #ccfbf1, #f0fdfa)',
  // aligned to the adult-child app: white screens with a soft teal/green wash, no dark backgrounds
  lockBg:      '#ffffff',
  outerBg:     'linear-gradient(135deg, #f0fdfa 0%, #ffffff 55%, #f0fdf4 100%)',
  cardShadow:  '0 10px 30px rgba(15,118,110,0.10)',
  // rgba helpers
  tealA10:  'rgba(20,184,166,0.10)',
  tealA15:  'rgba(20,184,166,0.15)',
  tealA20:  'rgba(20,184,166,0.20)',
  tealA25:  'rgba(20,184,166,0.25)',
  tealA30:  'rgba(20,184,166,0.30)',
  tealA40:  'rgba(20,184,166,0.40)',
  tealA50:  'rgba(20,184,166,0.50)',
}

// ─── State machine ────────────────────────────────────────────────────────────
type AppState =
  | 'onboarding-greeting' | 'onboarding-promise' | 'onboarding-preview' | 'onboarding-callback'
  | 'lockscreen' | 'notification' | 'speaking' | 'voice-listening' | 'voice-detected' | 'confirmed' | 'snoozed'
  | 'weekly-checkin'
  | 'walk-notification' | 'walk-listening' | 'walk-detected'
  | 'walk-bhajan-offer' | 'walk-bhajan-playing' | 'walk-done'

// ─── Speech synthesis ─────────────────────────────────────────────────────────
// Common calm, natural-sounding Indian-English voice names across platforms:
// Windows/Edge: "Neerja"/"Prabhat" (Online Natural); older SAPI: "Heera", "Ravi"
// Android/ChromeOS: Google "en-IN" voices; iOS/Safari: "Veena", "Rishi"
const INDIAN_VOICE_NAMES = ['neerja', 'prabhat', 'heera', 'ravi', 'veena', 'rishi', 'india']

// Real recorded clips, keyed by the exact line text they replace. Drop an MP3
// into public/audio/ and add its entry here — that line will then play the
// recording instead of the browser voice. Any line with no entry (or whose
// file 404s) automatically falls back to browser speechSynthesis, so nothing
// breaks while only some lines are recorded yet.
const AUDIO_CLIPS: Record<string, string> = {
  "Hi, I'm Sakha.": '/audio/greeting.mp3',
  "Think of me as your daily companion — medicines, walks, and a little company whenever you need it.": '/audio/promise.mp3',
  "Here's what I'll remind you about.": '/audio/preview.mp3',
  "Hold on, you'll get a call for help soon.": '/audio/callback.mp3',
  "Good morning, Mrs. Verma. It's time for your morning medicine.": '/audio/reminder1.mp3',
  "Please take one tablet of Amlodipine 5 mg after breakfast.": '/audio/reminder2.mp3',
  "I'll wait while you take it. Just let me know when you're done.": '/audio/reminder3.mp3',
  "No problem at all, Mrs. Verma. I'll remind you again in 10 minutes. Take care!": '/audio/snooze.mp3',
  "You've taken your medicine on time 6 days this week.": '/audio/weekly.mp3',
  "Wonderful, Mrs. Verma! You're taking great care of yourself. Keep it up!": '/audio/confirmed.mp3',
  "It's such a pleasant evening — perhaps a short walk would feel nice?": '/audio/walk_suggest.mp3',
  "Wonderful! Would you like some bhajans to keep you company along the way?": '/audio/bhajan_offer_accepted.mp3',
  "That's alright, take your time. Would you like to listen to a bhajan instead, just to relax?": '/audio/bhajan_offer_declined.mp3',
  "Enjoy your walk — here's a little bhajan to keep you company.": '/audio/walk_done_with_bhajan.mp3',
  "Enjoy your walk!": '/audio/walk_done_no_bhajan.mp3',
  "Here's a bhajan for you. Take care.": '/audio/relax_with_bhajan.mp3',
  "Take care, maybe another time.": '/audio/relax_no_bhajan.mp3',
}

function useSpeech() {
  const voicesRef = useRef<SpeechSynthesisVoice[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const load = () => { voicesRef.current = window.speechSynthesis.getVoices() }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  const speakBrowser = useCallback((text: string, onEnd?: () => void) => {
    if (!('speechSynthesis' in window)) { onEnd?.(); return }
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    const voices = voicesRef.current.length ? voicesRef.current : window.speechSynthesis.getVoices()
    const pick =
      voices.find(v => v.lang === 'en-IN') ||
      voices.find(v => INDIAN_VOICE_NAMES.some(n => v.name.toLowerCase().includes(n))) ||
      voices.find(v => v.lang.startsWith('en') && /female|woman/i.test(v.name))
    if (pick) u.voice = pick
    // Natural, calm pacing — no artificial pitch-shifting, which is what made
    // a non-Indian voice sound distorted rather than accented.
    u.rate = 0.93; u.pitch = 1.0; u.volume = 1
    if (onEnd) u.onend = onEnd
    window.speechSynthesis.speak(u)
  }, [])

  const speak = useCallback((text: string, onEnd?: () => void) => {
    audioRef.current?.pause()
    const clipUrl = AUDIO_CLIPS[text]
    if (!clipUrl) { speakBrowser(text, onEnd); return }
    const audio = new Audio(clipUrl)
    audioRef.current = audio
    audio.onended = () => onEnd?.()
    audio.onerror = () => speakBrowser(text, onEnd) // clip missing/not recorded yet — fall back
    audio.play().catch(() => speakBrowser(text, onEnd))
  }, [speakBrowser])
  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel()
    audioRef.current?.pause()
  }, [])
  return { speak, cancel }
}

// ─── Speech recognition ───────────────────────────────────────────────────────
function useSpeechRecognition(onInterim: (t: string) => void, onFinal: (t: string) => void, onEnd: () => void) {
  const ref = useRef<any>(null)
  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return false
    ref.current = new SR()
    ref.current.continuous = false
    ref.current.interimResults = true
    ref.current.lang = 'en-IN'
    ref.current.onresult = (e: any) => {
      const text = Array.from(e.results as any[]).map((r: any) => r[0].transcript).join(' ')
      e.results[0].isFinal ? onFinal(text) : onInterim(text)
    }
    ref.current.onend = onEnd
    try { ref.current.start(); return true } catch { return false }
  }, [onInterim, onFinal, onEnd])
  const stop = useCallback(() => { try { ref.current?.stop() } catch {} }, [])
  return { start, stop }
}

// ─── Typewriter ───────────────────────────────────────────────────────────────
function useTypewriter(text: string, active: boolean, speed = 36) {
  const [out, setOut] = useState('')
  useEffect(() => {
    if (!active) { setOut(''); return }
    setOut(''); let i = 0
    const id = setInterval(() => { i++; setOut(text.slice(0, i)); if (i >= text.length) clearInterval(id) }, speed)
    return () => clearInterval(id)
  }, [text, active, speed])
  return out
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
const CONF_COLORS = ['#059669','#22c55e','#fbbf24','#f59e0b','#14b8a6','#0d9488','#ec4899','#3b82f6','#10b981','#06b6d4']
function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 32 }, (_, i) => ({
    id: i, left: 4 + (i * 3.1) % 93, delay: (i * 0.11) % 2.2,
    duration: 2.5 + (i * 0.09) % 1.6, color: CONF_COLORS[i % CONF_COLORS.length],
    w: 6 + (i * 1.1) % 8, h: 6 + (i * 0.9) % 10,
    round: i % 4 === 0 ? '50%' : i % 4 === 1 ? '2px' : '3px',
    swayDur: 1.4 + (i * 0.07) % 0.8,
  })), [])
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {pieces.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: `${p.left}%`, top: -14,
          width: p.w, height: p.h, borderRadius: p.round, background: p.color,
          animation: `confettiFall ${p.duration}s ${p.delay}s ease-in infinite, confettiSway ${p.swayDur}s ${p.delay}s ease-in-out infinite`,
        }}/>
      ))}
    </div>
  )
}

// ─── Companion avatar — teal sari palette ─────────────────────────────────────
// ─── Sakha avatar expressions ───────────────────────────────────────────────────
type AvatarExpr = 'hello' | 'here_for_you' | 'idea' | 'let_me_help' | 'assist' | 'take_care'
const AVATAR_SRC: Record<AvatarExpr, string> = {
  hello:        '/avatars/hello.png',
  here_for_you: '/avatars/here_for_you.png',
  idea:         '/avatars/idea.png',
  let_me_help:  '/avatars/let_me_help.png',
  assist:       '/avatars/assist.png',
  take_care:    '/avatars/take_care.png',
}

function Avatar({ expr, size = 80, active = false }: { expr: AvatarExpr; size?: number; active?: boolean }) {
  return (
    <img
      src={AVATAR_SRC[expr]}
      alt="Sakha"
      width={size}
      height={size}
      style={{
        width: size, height: size, borderRadius: Math.round(size * 0.22), objectFit: 'cover',
        display: 'block',
        animation: active ? 'talkBob 0.6s ease-in-out infinite' : 'breathe 3s ease-in-out infinite',
      }}
    />
  )
}


// ─── Speaking rings ───────────────────────────────────────────────────────────
function SpeakRings({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {[0, 1, 2].map(i => (
        <div key={i} className="absolute rounded-full" style={{
          width: '100%', height: '100%',
          border: '2px solid #5eead4',
          animation: `speakRing 2s ease-out ${i * 0.65}s infinite`, opacity: 0,
        }}/>
      ))}
    </div>
  )
}

// ─── Mic rings ────────────────────────────────────────────────────────────────
function MicRings() {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {[0, 1].map(i => (
        <div key={i} className="absolute rounded-full" style={{
          width: '100%', height: '100%',
          border: `3px solid ${T.tealA50}`,
          animation: `micRing 1.6s ease-out ${i * 0.8}s infinite`, opacity: 0,
        }}/>
      ))}
    </div>
  )
}

// ─── Voice wave ───────────────────────────────────────────────────────────────
function VoiceWave({ color = T.teal500, size = 'sm' }: { color?: string; size?: 'sm' | 'lg' }) {
  return (
    <div className="flex items-center gap-1" style={{ height: size === 'lg' ? 48 : 28 }}>
      {[1,2,3,4,5,4,3,2,1].map((_, i) => (
        <div key={i} className="wave-bar" style={{
          background: color,
          animation: `wave${(i % 5) + 1} ${0.45 + i * 0.06}s ease-in-out infinite`,
          animationDelay: `${i * 0.07}s`,
          width: size === 'lg' ? 6 : 4,
        }}/>
      ))}
    </div>
  )
}

// ─── Status bar ───────────────────────────────────────────────────────────────
function StatusBar({ light }: { light?: boolean }) {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 30000); return () => clearInterval(id) }, [])
  const hh = t.getHours().toString().padStart(2,'0')
  const mm = t.getMinutes().toString().padStart(2,'0')
  const c = light ? '#134e4a' : 'white'
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 flex-shrink-0" style={{ minHeight: 42 }}>
      <span style={{ fontFamily:"'Nunito',sans-serif", fontSize:15, fontWeight:700, color:c }}>{hh}:{mm}</span>
      <div className="flex items-center gap-2">
        <svg width="18" height="13" viewBox="0 0 18 13">
          <rect x="0"    y="8"   width="3" height="5"   rx="1" fill={c}/>
          <rect x="4.5"  y="5.5" width="3" height="7.5" rx="1" fill={c}/>
          <rect x="9"    y="3"   width="3" height="10"  rx="1" fill={c}/>
          <rect x="13.5" y="0"   width="3" height="13"  rx="1" fill={c}/>
        </svg>
        <svg width="16" height="12" viewBox="0 0 16 12">
          <path d="M8 9.5L8 9.5" stroke={c} strokeWidth="2.5" strokeLinecap="round"/>
          <path d="M4.5 6.5Q8 3.5 11.5 6.5" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
          <path d="M1.5 3.5Q8 -1 14.5 3.5" stroke={c} strokeWidth="1.8" fill="none" strokeLinecap="round"/>
        </svg>
        <div className="flex items-center">
          <div style={{ width:22, height:12, border:`1.5px solid ${c}`, borderRadius:3, padding:1.5, display:'flex' }}>
            <div style={{ width:'78%', height:'100%', background:c, borderRadius:1.5 }}/>
          </div>
          <div style={{ width:2, height:6, background:c, borderRadius:1, marginLeft:1 }}/>
        </div>
      </div>
    </div>
  )
}

// ─── Lock clock ───────────────────────────────────────────────────────────────
function LockClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id) }, [])
  const hh = t.getHours().toString().padStart(2,'0')
  const mm = t.getMinutes().toString().padStart(2,'0')
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const mons = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return (
    <div className="flex flex-col items-center pt-14 pb-4">
      <div style={{ fontFamily:"'DM Serif Display', Georgia, serif", fontSize:76, fontWeight:400, color:T.teal700, lineHeight:1, letterSpacing:'-1px' }}>
        {hh}:{mm}
      </div>
      <div style={{ fontFamily:"'Nunito',sans-serif", fontSize:16, color:T.teal600, fontWeight:500, marginTop:8 }}>
        {days[t.getDay()]}, {t.getDate()} {mons[t.getMonth()]}
      </div>
    </div>
  )
}

// ─── Medicine card ────────────────────────────────────────────────────────────
function MedicineCard({ compact }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:`linear-gradient(135deg,${T.teal50},${T.teal100})`, border:`1.5px solid ${T.tealA15}` }}>
      <div className="flex items-start gap-3 p-3">
        <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width: compact?64:76, height: compact?64:76, border:`2px solid ${T.tealA25}` }}>
          <img src={IMG_PILLS} alt="Amlodipine" className="w-full h-full object-cover"/>
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize: compact?18:20, color:'#134e4a', lineHeight:1.2 }}>Amlodipine</div>
          <div style={{ fontWeight:800, fontSize: compact?15:17, color:T.teal600, marginTop:2 }}>5 mg · 1 Tablet</div>
          <div className="flex items-center gap-2 mt-2">
            <span style={{ fontSize:13 }}>⏰</span>
            <span style={{ fontWeight:600, fontSize:14, color:T.teal700 }}>9:00 AM · Morning</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 mx-3 mb-3 rounded-xl" style={{ background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.35)' }}>
        <span style={{ fontSize:16 }}>🍳</span>
        <span style={{ fontWeight:700, fontSize:14, color:'#78350f' }}>Take after breakfast</span>
      </div>
    </div>
  )
}

// ─── Walk card (framed as a suggestion, not an instruction) ────────────────────
function WalkCard({ compact }: { compact?: boolean }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background:`linear-gradient(135deg,${T.teal50},${T.teal100})`, border:`1.5px solid ${T.tealA15}` }}>
      <div className="flex items-start gap-3 p-3">
        <div className="rounded-xl overflow-hidden flex-shrink-0 flex items-center justify-center" style={{ width: compact?64:76, height: compact?64:76, border:`2px solid ${T.tealA25}`, background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}>
          <span style={{ fontSize: compact?30:36 }}>🚶</span>
        </div>
        <div className="flex-1 min-w-0">
          <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize: compact?18:20, color:'#134e4a', lineHeight:1.2 }}>Evening Walk</div>
          <div style={{ fontWeight:800, fontSize: compact?15:17, color:T.teal600, marginTop:2 }}>A gentle suggestion</div>
          <div className="flex items-center gap-2 mt-2">
            <span style={{ fontSize:13 }}>🌇</span>
            <span style={{ fontWeight:600, fontSize:14, color:T.teal700 }}>Around evening · Optional</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 py-2 mx-3 mb-3 rounded-xl" style={{ background: T.tealA10, border:`1px solid ${T.tealA20}` }}>
        <span style={{ fontSize:16 }}>💬</span>
        <span style={{ fontWeight:700, fontSize:14, color:T.teal700 }}>Totally up to you, always</span>
      </div>
    </div>
  )
}

// ─── Script lines ─────────────────────────────────────────────────────────────
const SCRIPT = [
  "Good morning, Mrs. Verma. It's time for your morning medicine.",
  "Please take one tablet of Amlodipine 5 mg after breakfast.",
  "I'll wait while you take it. Just let me know when you're done.",
]

// ─── Onboarding script lines ────────────────────────────────────────────────────
const ONBOARD_GREETING = "Hi, I'm Sakha."
const ONBOARD_PROMISE  = "Think of me as your daily companion — medicines, walks, and a little company whenever you need it."
const ONBOARD_PREVIEW_LINE = "Here's what I'll help you with."
const CALLBACK_LINE = "Hold on, you'll get a call for help soon."

// ─── Weekly check-in (calm, factual — no gamification) ─────────────────────────
const WEEK_DAYS = ['S','M','T','W','T','F','S']
const WEEK_TAKEN = [true, true, true, false, true, true, true] // demo data — 6 of 7
const WEEK_TAKEN_COUNT = WEEK_TAKEN.filter(Boolean).length
const WEEKLY_LINE = `You've taken your medicine on time ${WEEK_TAKEN_COUNT} days this week.`

// ─── Walk suggestion (advice, not a task — easy to decline, no re-nagging) ──────
const WALK_LINE = "It's such a pleasant evening — perhaps a short walk would feel nice?"
const BHAJAN_OFFER_ACCEPTED = "Wonderful! Would you like some bhajans to keep you company along the way?"
const BHAJAN_OFFER_DECLINED = "That's alright, take your time. Would you like to listen to a bhajan instead, just to relax?"
const WALK_DONE_WITH_BHAJAN = "Enjoy your walk — here's a little bhajan to keep you company."
const WALK_DONE_NO_BHAJAN = "Enjoy your walk!"
const RELAX_WITH_BHAJAN = "Here's a bhajan for you. Take care."
const RELAX_NO_BHAJAN = "Take care, maybe another time."
const BHAJAN_CLIP_URL = '/audio/bhajan.mp3'

// ─── Pressable button ─────────────────────────────────────────────────────────
function Btn({ onClick, bg, border, color, shadow, children, minH = 64 }: {
  onClick: () => void; bg: string; border?: string; color: string
  shadow?: string; children: React.ReactNode; minH?: number
}) {
  const [pressed, setPressed] = useState(false)
  return (
    <button onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width:'100%', minHeight:minH, borderRadius:20, border: border || 'none',
        background:bg, color, fontFamily:"'Nunito',sans-serif", fontWeight:800,
        fontSize:18, cursor:'pointer', display:'flex', alignItems:'center',
        justifyContent:'center', gap:10, boxShadow: shadow || 'none',
        letterSpacing:'0.01em', transition:'transform 0.1s',
        transform: pressed ? 'scale(0.96)' : 'scale(1)',
      }}>
      {children}
    </button>
  )
}

// ─── Need-help control (onboarding only) ───────────────────────────────────────
function NeedHelpButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="absolute right-4 z-40 flex items-center gap-1.5 px-3.5 py-2 rounded-full" style={{
      top: 54,
      background: T.tealA10,
      border: `1.5px solid ${T.tealA25}`,
      color: T.teal700,
      fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13,
      cursor: 'pointer',
    }}>
      <span style={{ fontSize: 15 }}>❓</span> Need help?
    </button>
  )
}

// ─── Type-instead hint (onboarding only) ───────────────────────────────────────
function TypeInsteadHint({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', marginTop: 10,
      color: T.teal600,
      fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 13,
      textDecoration: 'underline', textUnderlineOffset: 3,
    }}>
      Prefer to type instead? Tap here.
    </button>
  )
}

// ─── Scroll-top mask ────────────────────────────────────────────────────────────
// Sits at the top of each scrollable screen, pinned via `sticky`, so content
// scrolling upward disappears behind this opaque band instead of visually
// overlapping the fixed dynamic island / Need-help button above it.
function ScrollTopMask({ tall = false }: { tall?: boolean }) {
  return <div className="sticky top-0 z-30" style={{ height: tall ? 50 : 10, background: T.pageBg, flexShrink: 0 }}/>
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function ElderApp() {
  const [state, setState]           = useState<AppState>('onboarding-greeting')
  const [lineIdx, setLineIdx]       = useState(0)
  const [snooze, setSnooze]         = useState(600)
  const [detected, setDetected]     = useState('')
  const [heardFinal, setHeardFinal] = useState('')
  const [micAvail, setMicAvail]     = useState(true)

  // ── Onboarding-only state ────────────────────────────────────────────────
  const [onboardStarted, setOnboardStarted] = useState(false)
  const [callbackReturnState, setCallbackReturnState] = useState<AppState>('onboarding-greeting')

  // ── Weekly check-in state ────────────────────────────────────────────────
  const [confirmCount, setConfirmCount] = useState(0)

  // ── Walk suggestion state ────────────────────────────────────────────────
  const [walkAccepted, setWalkAccepted] = useState(false)
  const [voiceContext, setVoiceContext] = useState<'medicine' | 'walk'>('medicine')

  const { speak, cancel } = useSpeech()

  const curLine  = SCRIPT[Math.min(lineIdx, SCRIPT.length - 1)]
  const typed    = useTypewriter(curLine, state === 'speaking', 34)

  // ── Onboarding typewriter lines ──────────────────────────────────────────
  // Greeting only "plays" (types + speaks) once the elder taps to begin;
  // promise/preview follow on automatically once the sequence has started.
  const onboardLine = state === 'onboarding-greeting' ? ONBOARD_GREETING
    : state === 'onboarding-promise' ? ONBOARD_PROMISE
    : state === 'onboarding-preview' ? ONBOARD_PREVIEW_LINE : ''
  const onboardActive =
    (state === 'onboarding-greeting' && onboardStarted) ||
    state === 'onboarding-promise' || state === 'onboarding-preview'
  const onboardTyped = useTypewriter(onboardLine, onboardActive, 34)
  const callbackTyped = useTypewriter(CALLBACK_LINE, state === 'onboarding-callback', 34)
  const walkTyped = useTypewriter(WALK_LINE, state === 'walk-notification', 34)
  const bhajanOfferLine = walkAccepted ? BHAJAN_OFFER_ACCEPTED : BHAJAN_OFFER_DECLINED
  const bhajanOfferTyped = useTypewriter(bhajanOfferLine, state === 'walk-bhajan-offer', 34)

  useEffect(() => {
    if (state !== 'lockscreen') return
    const id = setTimeout(() => setState('notification'), 1600)
    return () => clearTimeout(id)
  }, [state])

  useEffect(() => {
    if (state !== 'notification') return
    const id = setTimeout(() => { setState('speaking'); setLineIdx(0) }, 500)
    return () => clearTimeout(id)
  }, [state])

  useEffect(() => {
    if (state !== 'speaking') return
    if (lineIdx >= SCRIPT.length - 1) {
      speak(SCRIPT[SCRIPT.length - 1]) // final line — spoken, but no further auto-advance
      return
    }
    speak(SCRIPT[lineIdx], () => setTimeout(() => setLineIdx(i => i + 1), 380))
  }, [state, lineIdx, speak])

  useEffect(() => {
    if (state !== 'snoozed') return
    setSnooze(600)
    const id = setInterval(() => setSnooze(c => {
      if (c <= 1) { clearInterval(id); setState('lockscreen'); return 600 }
      return c - 1
    }), 1000)
    return () => clearInterval(id)
  }, [state])

  const handleTaken = useCallback(() => {
    cancel(); setState('confirmed')
    speak("Wonderful, Mrs. Verma! You're taking great care of yourself. Keep it up!")
  }, [cancel, speak])

  const handleSnooze = useCallback(() => {
    cancel(); setState('snoozed')
    speak("No problem at all, Mrs. Verma. I'll remind you again in 10 minutes. Take care!")
  }, [cancel, speak])

  const handleWalkAccept = useCallback(() => {
    cancel(); setWalkAccepted(true); setState('walk-bhajan-offer')
  }, [cancel])

  const handleWalkDecline = useCallback(() => {
    cancel(); setWalkAccepted(false); setState('walk-bhajan-offer')
  }, [cancel])

  const onInterim = useCallback((t: string) => setDetected(t), [])
  const onFinal   = useCallback((t: string) => {
    const detectedState = voiceContext === 'walk' ? 'walk-detected' : 'voice-detected'
    setHeardFinal(t); setState(detectedState)
    setTimeout(() => {
      const lower = t.toLowerCase()
      if (voiceContext === 'walk') {
        if (/\b(yes|sure|okay|ok|let's|lets|walk|haan|ha)\b/.test(lower)) handleWalkAccept()
        else if (/\b(no|not today|later|nahi|naheen)\b/.test(lower)) handleWalkDecline()
        else { setState('walk-notification'); setDetected(''); setHeardFinal('') }
        return
      }
      if (/\b(yes|taken|done|ate|i have|already|finished|ok|okay|haan|ha)\b/.test(lower)) handleTaken()
      else if (/\b(no|later|remind|wait|not yet|nahi|naheen)\b/.test(lower)) handleSnooze()
      else { setState('speaking'); setDetected(''); setHeardFinal('') }
    }, 1200)
  }, [voiceContext, handleTaken, handleSnooze, handleWalkAccept, handleWalkDecline])

  const onEnd = useCallback(() => {
    setDetected(prev => { if (!prev) setState(voiceContext === 'walk' ? 'walk-notification' : 'speaking'); return prev })
  }, [voiceContext])

  const { start: startListening, stop: stopListening } = useSpeechRecognition(onInterim, onFinal, onEnd)

  const handleMic = useCallback(() => {
    cancel(); setDetected(''); setHeardFinal(''); setVoiceContext('medicine'); setState('voice-listening')
    const ok = startListening()
    if (!ok) setMicAvail(false)
  }, [cancel, startListening])

  const handleWalkMic = useCallback(() => {
    cancel(); setDetected(''); setHeardFinal(''); setVoiceContext('walk'); setState('walk-listening')
    const ok = startListening()
    if (!ok) setMicAvail(false)
  }, [cancel, startListening])

  const snoozeMM = Math.floor(snooze / 60)
  const snoozeSS = (snooze % 60).toString().padStart(2, '0')

  // ── Onboarding sequencing ─────────────────────────────────────────────────
  useEffect(() => {
    if (state !== 'onboarding-greeting' || !onboardStarted) return
    speak(ONBOARD_GREETING, () => setTimeout(() => setState('onboarding-promise'), 500))
  }, [state, onboardStarted, speak])

  useEffect(() => {
    if (state !== 'onboarding-promise') return
    speak(ONBOARD_PROMISE, () => setTimeout(() => setState('onboarding-preview'), 600))
  }, [state, speak])

  useEffect(() => {
    if (state !== 'onboarding-preview') return
    speak(ONBOARD_PREVIEW_LINE)
  }, [state, speak])

  useEffect(() => {
    if (state !== 'onboarding-callback') return
    speak(CALLBACK_LINE)
  }, [state, speak])

  const handleBeginOnboarding = useCallback(() => {
    setOnboardStarted(true)
  }, [])

  const handleRequestCallback = useCallback(() => {
    cancel(); setCallbackReturnState(state); setState('onboarding-callback')
  }, [cancel, state])

  const handleCallbackDone = useCallback(() => {
    cancel(); setState(callbackReturnState)
  }, [cancel, callbackReturnState])

  const handleOnboardContinue = useCallback(() => {
    cancel(); setState('lockscreen')
  }, [cancel])

  useEffect(() => {
    if (state !== 'weekly-checkin') return
    speak(WEEKLY_LINE)
  }, [state, speak])

  // ── Walk suggestion sequencing ───────────────────────────────────────────
  useEffect(() => {
    if (state !== 'walk-notification') return
    speak(WALK_LINE)
  }, [state, speak])

  useEffect(() => {
    if (state !== 'walk-bhajan-offer') return
    speak(bhajanOfferLine)
  }, [state, bhajanOfferLine, speak])

  const handleBhajanYes = useCallback(() => {
    cancel(); setState('walk-bhajan-playing')
  }, [cancel])

  const handleBhajanNo = useCallback(() => {
    cancel(); setState('walk-done')
  }, [cancel])

  const bhajanMusicRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => {
    if (state !== 'walk-bhajan-playing') { bhajanMusicRef.current?.pause(); return }
    speak(walkAccepted ? WALK_DONE_WITH_BHAJAN : RELAX_WITH_BHAJAN)
    const audio = new Audio(BHAJAN_CLIP_URL)
    audio.loop = true
    bhajanMusicRef.current = audio
    audio.play().catch(() => {}) // clip not recorded yet — screen still works, just silent
    return () => { audio.pause() }
  }, [state, walkAccepted, speak])

  useEffect(() => {
    if (state !== 'walk-done') return
    speak(walkAccepted ? WALK_DONE_NO_BHAJAN : RELAX_NO_BHAJAN)
    const id = setTimeout(() => setState('lockscreen'), 4000)
    return () => clearTimeout(id)
  }, [state, walkAccepted, speak])

  const handleWalkFinish = useCallback(() => {
    cancel(); bhajanMusicRef.current?.pause(); setState('lockscreen')
  }, [cancel])

  // DEMO ONLY: shows the weekly check-in after every single confirmation so it's
  // easy to test/preview. In production this should go back to `next % 7 === 0`
  // (once every 7th confirmed dose) instead of always true.
  const DEMO_SHOW_WEEKLY_EVERY_TIME = true

  const handleConfirmedDone = useCallback(() => {
    cancel()
    const next = confirmCount + 1
    setConfirmCount(next)
    setState((DEMO_SHOW_WEEKLY_EVERY_TIME || next % 7 === 0) ? 'weekly-checkin' : 'lockscreen')
  }, [cancel, confirmCount])

  // DEMO ONLY: chains straight into the walk suggestion after the weekly
  // check-in so the whole flow is reachable in one click-through. In
  // production the walk suggestion would trigger on its own schedule
  // (e.g. evening), independent of the medicine/weekly cycle.
  const handleWeeklyCheckinDone = useCallback(() => {
    cancel(); setState('walk-notification')
  }, [cancel])

  // ── Notification card ───────────────────────────────────────────────────────
  const NotifCard = (
    <div className="mx-3 flex flex-col gap-2.5" style={{ animation:'slideDown 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
      {/* App badge */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: T.tealA10, border: `1px solid ${T.tealA20}` }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: T.tealGrad }}>
          <span style={{ fontSize:15 }}>💊</span>
        </div>
        <span style={{ fontWeight:700, fontSize:14, color:T.teal700 }}>Sakha</span>
        <span style={{ fontSize:12, color:'#9ca3af', marginLeft:'auto' }}>now</span>
      </div>

      {/* Card */}
      <div className="rounded-3xl overflow-hidden" style={{ background:'#ffffff', border:`1.5px solid ${T.tealA15}`, boxShadow: T.cardShadow }}>

        {/* Sakha + speech */}
        <div className="flex items-start gap-3 p-4 pb-3">
          <div className="relative flex-shrink-0" style={{ width:78, height:78 }}>
            <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}/>
            <div className="relative z-10 flex items-center justify-center w-full h-full">
              <Avatar expr="here_for_you" active={state === 'speaking'} size={70}/>
            </div>
            <SpeakRings active={state === 'speaking'}/>
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div style={{ fontWeight:800, fontSize:15, color:'#134e4a' }}>Sakha</div>
            <div className="mt-1.5 px-3 py-2 rounded-2xl rounded-tl-sm" style={{ background: T.tealBubble, border:`1.5px solid ${T.tealA20}`, minHeight:42 }}>
              {state === 'speaking' ? (
                <p style={{ fontSize:14, color:T.teal700, lineHeight:1.55, fontWeight:600, margin:0 }}>
                  {typed}<span style={{ animation:'breathe 0.7s infinite', display:'inline-block', color:T.teal500 }}>▋</span>
                </p>
              ) : (
                <div className="flex items-center gap-1"><VoiceWave/></div>
              )}
            </div>
            {state === 'speaking' && (
              <div className="flex gap-1.5 mt-1.5">
                {SCRIPT.map((_,i) => (
                  <div key={i} style={{ width: i===lineIdx?14:6, height:5, borderRadius:3, background: i<=lineIdx ? T.teal500 : T.tealA25, transition:'all 0.3s' }}/>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div style={{ height:1, background: T.tealA15, margin:'0 18px' }}/>

        {/* Medicine */}
        <div className="p-3 pb-2"><MedicineCard compact/></div>

        {/* ── Buttons: VOICE FIRST ── */}
        <div className="px-4 pb-5 flex flex-col gap-2.5">

          {/* 1 — Voice (primary CTA) */}
          <button onClick={handleMic} style={{
            width:'100%', minHeight:64, borderRadius:20,
            background: T.tealGrad,
            border: 'none', color:'white',
            fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:18,
            cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
            boxShadow:`0 6px 22px ${T.tealA40}`,
            animation: 'micPulse 2.5s ease-in-out infinite',
            letterSpacing:'0.01em',
          }}>
            <span style={{ fontSize:24 }}>🎤</span>
            {micAvail ? 'Speak Your Answer' : 'Voice Unavailable'}
          </button>

          {/* Voice hint */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: T.tealA10, border:`1px solid ${T.tealA20}` }}>
            <span style={{ fontSize:13 }}>💬</span>
            <span style={{ fontSize:12, fontWeight:600, color:T.teal700 }}>
              Say <strong>"Yes, I've taken it"</strong> or <strong>"Remind me later"</strong>
            </span>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2">
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
            <span style={{ fontSize:12, color:'#9ca3af', fontWeight:600 }}>or tap</span>
            <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
          </div>

          {/* 2 — Yes tap */}
          <Btn onClick={handleTaken} bg={T.greenGrad} color="white" shadow="0 6px 22px rgba(5,150,105,0.4)">
            <span style={{ fontSize:22 }}>✅</span> Yes, I've Taken It
          </Btn>

          {/* 3 — Snooze tap */}
          <Btn onClick={handleSnooze} bg="linear-gradient(135deg,#fffbeb,#fef3c7)" border="2.5px solid rgba(217,119,6,0.4)" color="#92400e" shadow="0 4px 12px rgba(217,119,6,0.2)">
            <span style={{ fontSize:22 }}>⏰</span> Remind Me in 10 Min
          </Btn>
        </div>
      </div>
    </div>
  )

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: T.outerBg }}>
      <div className="relative flex flex-col overflow-hidden" style={{
        width:'min(390px,100vw)', height:'min(844px,100vh)',
        background: T.pageBg,
        borderRadius:'clamp(0px,4vw,48px)',
        boxShadow:'0 20px 60px rgba(15,23,42,0.18), inset 0 0 0 1px rgba(15,118,110,0.06)',
        fontFamily:"'Nunito',sans-serif",
      }}>
        {/* Dynamic island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-50" style={{ width:126, height:36, background:'#000', borderRadius:20 }}/>

        {/* Need-help control — fixed to the phone frame, not the scrolling content, so it never scrolls out of view */}
        {['onboarding-greeting','onboarding-promise','onboarding-preview'].includes(state) && (
          <NeedHelpButton onClick={handleRequestCallback} />
        )}

        <StatusBar light/>

        {/* ── ONBOARDING: GREETING / PROMISE ── */}
        {(state === 'onboarding-greeting' || state === 'onboarding-promise') && (
          <div className="relative flex-1 flex flex-col overflow-y-auto overflow-x-hidden" style={{ animation:'fadeIn 0.4s ease-out' }}>
            <ScrollTopMask tall/>
            <LockClock/>
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 pb-16">
              <div className="relative" style={{ width:120, height:120 }}>
                <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}/>
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  <Avatar expr={state === 'onboarding-greeting' ? 'hello' : 'here_for_you'} active={onboardActive} size={104}/>
                </div>
                <SpeakRings active={onboardActive}/>
              </div>
              <div className="w-full rounded-3xl px-5 py-4 text-center" style={{ background:'#ffffff', border:`1.5px solid ${T.tealA15}`, boxShadow: T.cardShadow }}>
                <p style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:21, color:T.teal700, lineHeight:1.5, margin:0, minHeight:64 }}>
                  {state === 'onboarding-greeting' && !onboardStarted ? ONBOARD_GREETING : onboardTyped}
                  {onboardActive && onboardTyped.length < onboardLine.length && (
                    <span style={{ animation:'breathe 0.7s infinite', display:'inline-block', color:T.teal500 }}>▋</span>
                  )}
                </p>
              </div>
              {state === 'onboarding-greeting' && !onboardStarted ? (
                <Btn onClick={handleBeginOnboarding} bg={T.tealGrad} color="white" shadow={`0 6px 22px ${T.tealA40}`} minH={60}>
                  <span style={{ fontSize:22 }}>👋</span> Tap to Begin
                </Btn>
              ) : (
                onboardTyped.length >= onboardLine.length && (
                  <TypeInsteadHint onClick={() => setState(state === 'onboarding-greeting' ? 'onboarding-promise' : 'onboarding-preview')}/>
                )
              )}
            </div>
          </div>
        )}

        {/* ── ONBOARDING: PREVIEW ── */}
        {state === 'onboarding-preview' && (
          <div className="relative flex-1 flex flex-col overflow-y-auto overflow-x-hidden" style={{ animation:'fadeIn 0.4s ease-out' }}>
            <ScrollTopMask tall/>
            <LockClock/>
            <div className="flex-1 flex flex-col items-center justify-start px-4 gap-4 pb-10">
              <div className="relative flex-shrink-0" style={{ width:88, height:88 }}>
                <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}/>
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  <Avatar expr="idea" active={onboardTyped.length < onboardLine.length} size={78}/>
                </div>
                <SpeakRings active={onboardTyped.length < onboardLine.length}/>
              </div>

              <div className="w-full rounded-3xl overflow-hidden" style={{ background:'#ffffff', border:`1.5px solid ${T.tealA15}`, boxShadow: T.cardShadow }}>
                <div className="px-5 pt-4 pb-2 text-center">
                  <p style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:19, color:T.teal700, lineHeight:1.4, margin:0 }}>
                    {onboardTyped}
                    {onboardTyped.length < onboardLine.length && (
                      <span style={{ animation:'breathe 0.7s infinite', display:'inline-block', color:T.teal500 }}>▋</span>
                    )}
                  </p>
                </div>
                <div className="px-3 pb-3 flex flex-col gap-2.5">
                  <MedicineCard/>
                  <WalkCard/>
                </div>
              </div>

              <div className="w-full flex flex-col items-center gap-1 mt-2">
                <Btn onClick={handleOnboardContinue} bg={T.tealGrad} color="white" shadow={`0 6px 22px ${T.tealA40}`} minH={60}>
                  <span style={{ fontSize:22 }}>👍</span> Got It, Thanks Sakha
                </Btn>
                {onboardTyped.length >= onboardLine.length && <TypeInsteadHint onClick={handleOnboardContinue}/>}
              </div>
            </div>
          </div>
        )}

        {/* ── ONBOARDING: CALLBACK CONFIRMATION ── */}
        {state === 'onboarding-callback' && (
          <div className="relative flex-1 flex flex-col overflow-y-auto overflow-x-hidden" style={{ animation:'fadeIn 0.3s ease-out' }}>
            <ScrollTopMask/>
            <LockClock/>
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 pb-16">
              <div className="relative" style={{ width:110, height:110 }}>
                <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}/>
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  <Avatar expr="let_me_help" active size={96}/>
                </div>
                <SpeakRings active/>
              </div>

              <div className="w-full rounded-3xl px-5 py-4 text-center" style={{ background:'#ffffff', border:`1.5px solid ${T.tealA15}`, boxShadow: T.cardShadow }}>
                <div style={{ fontSize:34, marginBottom:6 }}>📞</div>
                <p style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:20, color:T.teal700, lineHeight:1.5, margin:0, minHeight:56 }}>
                  {callbackTyped}
                  {callbackTyped.length < CALLBACK_LINE.length && (
                    <span style={{ animation:'breathe 0.7s infinite', display:'inline-block', color:T.teal500 }}>▋</span>
                  )}
                </p>
              </div>

              {callbackTyped.length >= CALLBACK_LINE.length && (
                <Btn onClick={handleCallbackDone} bg={T.tealGrad} color="white" shadow={`0 6px 22px ${T.tealA40}`} minH={60}>
                  <span style={{ fontSize:22 }}>✅</span> Okay
                </Btn>
              )}
            </div>
          </div>
        )}

        {/* ── LOCK / NOTIFICATION / SPEAKING ── */}
        {(state === 'lockscreen' || state === 'notification' || state === 'speaking') && (
          <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
            <ScrollTopMask/>
            <LockClock/>
            {state !== 'lockscreen' && NotifCard}
            {state === 'lockscreen' && (
              <div className="flex-1 flex flex-col items-center justify-end pb-12 gap-2">
                <div className="flex gap-2">{[0,1,2].map(i=><div key={i} style={{width:7,height:7,borderRadius:'50%',background:T.tealA30}}/>)}</div>
                <p style={{ color:'#9ca3af', fontSize:13 }}>Checking for reminders…</p>
              </div>
            )}
          </div>
        )}

        {/* ── VOICE LISTENING (medicine + walk share this shell) ── */}
        {(state === 'voice-listening' || state === 'voice-detected' || state === 'walk-listening' || state === 'walk-detected') && (
          <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden" style={{ animation:'fadeIn 0.3s ease-out' }}>
            <ScrollTopMask/>
            <LockClock/>
            {/* Compact pill */}
            <div className="mx-3 mb-3">
              <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: T.tealA10, border:`1px solid ${T.tealA20}` }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg,${T.teal100},${T.teal50})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Avatar expr="assist" size={36}/>
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:T.teal700 }}>Sakha</div>
                  <div style={{ fontWeight:600, fontSize:12, color:T.teal600 }}>
                    {voiceContext === 'walk' ? 'Evening Walk · Just a suggestion' : 'Amlodipine 5 mg · 9:00 AM'}
                  </div>
                </div>
              </div>
            </div>

            {/* Listening panel */}
            <div className="flex-1 mx-3 rounded-3xl flex flex-col items-center justify-center gap-5 p-6" style={{
              background:'#ffffff', border:`1.5px solid ${T.tealA15}`, boxShadow: T.cardShadow,
            }}>
              {(state === 'voice-detected' || state === 'walk-detected') && heardFinal ? (
                <div className="flex flex-col items-center gap-4 w-full" style={{ animation:'voiceHeard 0.4s ease-out' }}>
                  <div style={{ fontSize:52 }}>👂</div>
                  <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:18, color:T.teal700, textAlign:'center' }}>I heard:</div>
                  <div className="px-5 py-3 rounded-2xl text-center w-full" style={{ background: T.tealBubble, border:`2px solid ${T.tealA30}` }}>
                    <p style={{ fontWeight:800, fontSize:18, color:T.teal600, margin:0 }}>"{heardFinal}"</p>
                  </div>
                  <div style={{ fontWeight:600, fontSize:14, color:T.teal600 }}>Just a moment…</div>
                </div>
              ) : (
                <>
                  {/* Mic orb */}
                  <div className="relative flex items-center justify-center" style={{ width:110, height:110 }}>
                    <div style={{
                      width:80, height:80, borderRadius:'50%', background: T.tealGrad,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:`0 8px 30px ${T.tealA50}`,
                      animation:'micPulse 1.5s ease-in-out infinite',
                    }}>
                      <span style={{ fontSize:36 }}>🎤</span>
                    </div>
                    <MicRings/>
                  </div>

                  <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:22, color:'#134e4a', textAlign:'center' }}>
                    I'm Listening…
                  </div>
                  <VoiceWave color={T.teal500} size="lg"/>

                  {detected && (
                    <div className="px-4 py-2 rounded-xl w-full" style={{ background: T.tealA10, border:`1.5px solid ${T.tealA25}` }}>
                      <p style={{ fontWeight:600, fontSize:14, color:T.teal600, textAlign:'center', margin:0 }}>"{detected}"</p>
                    </div>
                  )}

                  <div style={{ fontWeight:600, fontSize:14, color:T.teal700, textAlign:'center' }}>
                    {voiceContext === 'walk'
                      ? <>Say <strong>"Sure, let's walk"</strong> or <strong>"Not today"</strong></>
                      : <>Say <strong>"Yes, I've taken it"</strong> or <strong>"Remind me later"</strong></>}
                  </div>

                  <div style={{ fontWeight:600, fontSize:13, color:'#9ca3af', marginTop:-8 }}>— or tap —</div>
                  <div className="w-full flex flex-col gap-2">
                    {voiceContext === 'walk' ? (
                      <>
                        <Btn onClick={() => { stopListening(); handleWalkAccept() }} bg={T.tealGrad} color="white" shadow={`0 4px 14px ${T.tealA40}`} minH={56}>
                          <span style={{ fontSize:20 }}>🚶</span> Sure, Let's Walk
                        </Btn>
                        <Btn onClick={() => { stopListening(); handleWalkDecline() }} bg="#ffffff" border={`2px solid ${T.tealA25}`} color={T.teal700} minH={56}>
                          Not Today
                        </Btn>
                      </>
                    ) : (
                      <>
                        <Btn onClick={() => { stopListening(); handleTaken() }} bg={T.greenGrad} color="white" shadow="0 4px 14px rgba(5,150,105,0.4)" minH={56}>
                          <span style={{ fontSize:20 }}>✅</span> Yes, I've Taken It
                        </Btn>
                        <Btn onClick={() => { stopListening(); handleSnooze() }} bg="linear-gradient(135deg,#fffbeb,#fef3c7)" border="2px solid rgba(217,119,6,0.4)" color="#92400e" shadow="0 3px 10px rgba(217,119,6,0.2)" minH={56}>
                          <span style={{ fontSize:20 }}>⏰</span> Remind Me in 10 Min
                        </Btn>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── CONGRATULATIONS ── */}
        {state === 'confirmed' && (
          <div className="relative flex-1 flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden" style={{ background:`linear-gradient(175deg,${T.teal50},${T.teal100},#99f6e4)`, animation:'fadeIn 0.4s ease-out' }}>
            <Confetti/>
            <div className="relative z-10 flex flex-col items-center px-5 pt-6 gap-4 w-full">

              {/* Check */}
              <div style={{
                width:100, height:100, borderRadius:'50%', background: T.greenGrad,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:48, boxShadow:'0 10px 40px rgba(34,197,94,0.45)',
                animation:'successPop 0.55s cubic-bezier(0.34,1.56,0.64,1)',
              }}>✅</div>

              {/* Heading */}
              <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:30, color:T.teal700, textAlign:'center', lineHeight:1.2 }}>
                Congratulations!
              </div>
              <div style={{ fontWeight:700, fontSize:15, color:T.teal600, textAlign:'center', marginTop:-8 }}>
                Medicine taken on time 🎉
              </div>

              {/* Sakha celebrating */}
              <div className="flex flex-col items-center gap-1">
                <div className="relative" style={{ width:90, height:90 }}>
                  <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},#99f6e4)` }}/>
                  <div className="relative z-10 flex items-center justify-center w-full h-full">
                    <Avatar expr="take_care" size={82}/>
                  </div>
                </div>
                <span style={{ fontWeight:800, fontSize:14, color:T.teal700 }}>Sakha</span>
              </div>

              {/* Speech bubble */}
              <div className="w-full rounded-3xl px-5 py-4 text-center" style={{ background:'white', boxShadow:`0 6px 28px ${T.tealA25}`, border:`2px solid ${T.tealA20}` }}>
                <p style={{ fontWeight:700, fontSize:17, color:T.teal700, lineHeight:1.55, margin:0 }}>
                  "Wonderful, Mrs. Verma! You're taking great care of yourself. Keep it up!"
                </p>
              </div>

              {/* Streak badge */}
              <div className="flex items-center gap-3 px-5 py-3 rounded-2xl w-full justify-center" style={{
                background:'linear-gradient(90deg,#fef3c7,#fde68a,#fef3c7)', backgroundSize:'200% auto',
                animation:'shimmer 2.5s linear infinite', border:'2px solid rgba(251,191,36,0.6)',
              }}>
                <span style={{ fontSize:26 }}>🔥</span>
                <div>
                  <div style={{ fontWeight:800, fontSize:16, color:'#78350f' }}>7-Day Streak!</div>
                  <div style={{ fontWeight:600, fontSize:12, color:'#92400e' }}>Taken on time every day</div>
                </div>
                <span style={{ fontSize:26, marginLeft:'auto' }}>⭐</span>
              </div>

              {/* Stats */}
              <div className="flex gap-3 w-full">
                {[
                  { icon:'💊', label:'Doses taken', val:'21' },
                  { icon:'✅', label:'On time',    val:'100%' },
                  { icon:'📅', label:'Day streak', val:'7' },
                ].map(({ icon, label, val }) => (
                  <div key={label} className="flex-1 flex flex-col items-center py-3 rounded-2xl gap-1" style={{ background: T.tealA10, border:`1.5px solid ${T.tealA20}` }}>
                    <span style={{ fontSize:20 }}>{icon}</span>
                    <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:20, color:T.teal700, lineHeight:1 }}>{val}</span>
                    <span style={{ fontWeight:600, fontSize:11, color:T.teal600, textAlign:'center' }}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Next dose */}
              <div className="w-full flex items-center justify-between px-4 py-3 rounded-2xl" style={{ background: T.tealA10, border:`1.5px solid ${T.tealA20}` }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:13, color:T.teal700 }}>Next Dose</div>
                  <div style={{ fontWeight:600, fontSize:14, color:T.teal600 }}>Amlodipine 5 mg</div>
                </div>
                <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:20, color:T.teal600 }}>9:00 PM</div>
              </div>

              <button onClick={handleConfirmedDone} style={{
                padding:'14px 40px', borderRadius:16, border:'none', background: T.tealGrad,
                color:'white', fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:17,
                cursor:'pointer', marginBottom:8, boxShadow:`0 6px 22px ${T.tealA40}`,
              }}>Done ✓</button>
            </div>
          </div>
        )}

        {/* ── SNOOZED ── */}
        {state === 'snoozed' && (
          <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto px-5 pt-6 gap-5" style={{ background:'linear-gradient(175deg,#fffbeb,#fef3c7,#fde68a)', animation:'fadeUp 0.4s ease-out' }}>

            <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:26, color:'#78350f', textAlign:'center' }}>
              I'll Remind You Again
            </div>

            {/* Sakha */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="relative flex-shrink-0" style={{ width:88, height:88 }}>
                <div className="absolute inset-0 rounded-full" style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)' }}/>
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  <Avatar expr="take_care" size={78}/>
                </div>
              </div>
              <span style={{ fontWeight:800, fontSize:14, color:'#78350f' }}>Sakha</span>
            </div>

            <div className="w-full rounded-3xl px-5 py-4 text-center" style={{ background:'white', boxShadow:'0 6px 24px rgba(217,119,6,0.18)', border:'2px solid rgba(217,119,6,0.25)' }}>
              <p style={{ fontWeight:700, fontSize:17, color:'#78350f', lineHeight:1.55, margin:0 }}>
                "No problem at all, Mrs. Verma. I'll remind you again in 10 minutes. Take care!"
              </p>
            </div>

            {/* Countdown ring */}
            <div className="relative flex items-center justify-center flex-shrink-0" style={{ width:150, height:150 }}>
              <svg width="150" height="150" viewBox="0 0 150 150" style={{ position:'absolute', inset:0, transform:'rotate(-90deg)' }}>
                <circle cx="75" cy="75" r="66" fill="none" stroke="rgba(217,119,6,0.15)" strokeWidth="11"/>
                <circle cx="75" cy="75" r="66" fill="none" stroke="#d97706" strokeWidth="11"
                  strokeDasharray="415" strokeDashoffset={415 * (1 - snooze / 600)}
                  strokeLinecap="round" style={{ transition:'stroke-dashoffset 1s linear' }}/>
              </svg>
              <div className="relative flex flex-col items-center">
                <span style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:38, color:'#92400e', lineHeight:1 }}>
                  {snoozeMM}:{snoozeSS}
                </span>
                <span style={{ fontSize:12, color:'#b45309', fontWeight:700 }}>mins remaining</span>
              </div>
            </div>

            {/* Mini medicine */}
            <div className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl flex-shrink-0" style={{ background:'rgba(217,119,6,0.09)', border:'1.5px solid rgba(217,119,6,0.25)' }}>
              <div className="rounded-xl overflow-hidden flex-shrink-0" style={{ width:52, height:52 }}>
                <img src={IMG_PILLS} alt="pills" className="w-full h-full object-cover"/>
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:15, color:'#78350f' }}>Amlodipine 5 mg</div>
                <div style={{ fontWeight:600, fontSize:13, color:'#b45309' }}>🍳 Take after breakfast</div>
              </div>
            </div>

            <Btn onClick={handleTaken} bg={T.greenGrad} color="white" shadow="0 6px 22px rgba(34,197,94,0.4)" minH={60}>
              <span style={{ fontSize:22 }}>✅</span> I've Taken It Now
            </Btn>

            <div className="w-full px-4 py-3 rounded-2xl text-center" style={{ background: T.tealA10, border:`1.5px solid ${T.tealA20}` }}>
              <span style={{ fontWeight:600, fontSize:13, color:T.teal700 }}>
                💡 Taking Amlodipine at the same time each day works best.
              </span>
            </div>
          </div>
        )}

        {/* ── WEEKLY CHECK-IN (calm, factual, no confetti) ── */}
        {state === 'weekly-checkin' && (
          <div className="relative flex-1 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-5 gap-5 py-6" style={{ background:`linear-gradient(175deg,${T.teal50},${T.teal100})`, animation:'fadeIn 0.4s ease-out' }}>
            <div className="flex flex-col items-center gap-2">
              <div className="relative" style={{ width:84, height:84 }}>
                <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}/>
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  <Avatar expr="take_care" size={74}/>
                </div>
              </div>
              <span style={{ fontWeight:800, fontSize:14, color:T.teal700 }}>Sakha</span>
            </div>

            <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:22, color:T.teal700, textAlign:'center' }}>
              This Week
            </div>

            {/* Quiet checkmark row — no badges, no fanfare */}
            <div className="flex items-center gap-2.5">
              {WEEK_DAYS.map((d, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5">
                  <div style={{
                    width:34, height:34, borderRadius:'50%',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    background: WEEK_TAKEN[i] ? T.teal500 : 'rgba(20,184,166,0.12)',
                    border: WEEK_TAKEN[i] ? 'none' : `1.5px solid ${T.tealA25}`,
                  }}>
                    {WEEK_TAKEN[i] && <span style={{ color:'white', fontSize:15, fontWeight:800 }}>✓</span>}
                  </div>
                  <span style={{ fontSize:11, fontWeight:700, color:T.teal600 }}>{d}</span>
                </div>
              ))}
            </div>

            {/* One calm, factual sentence */}
            <div className="w-full rounded-3xl px-5 py-4 text-center" style={{ background:'white', boxShadow:`0 6px 28px ${T.tealA25}`, border:`2px solid ${T.tealA20}` }}>
              <p style={{ fontWeight:700, fontSize:16, color:T.teal700, lineHeight:1.55, margin:0 }}>
                {WEEKLY_LINE}
              </p>
            </div>

            <Btn onClick={handleWeeklyCheckinDone} bg={T.tealGrad} color="white" shadow={`0 6px 22px ${T.tealA40}`} minH={58}>
              Okay
            </Btn>
          </div>
        )}

        {/* ── WALK SUGGESTION (advice, not a task — easy to decline) ── */}
        {state === 'walk-notification' && (
          <div className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
            <ScrollTopMask/>
            <LockClock/>
            <div className="mx-3 flex flex-col gap-2.5" style={{ animation:'slideDown 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: T.tealA10, border: `1px solid ${T.tealA20}` }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: T.tealGrad }}>
                  <span style={{ fontSize:15 }}>🚶</span>
                </div>
                <span style={{ fontWeight:700, fontSize:14, color:T.teal700 }}>Sakha</span>
                <span style={{ fontSize:12, color:'#9ca3af', marginLeft:'auto' }}>just a thought</span>
              </div>

              <div className="rounded-3xl overflow-hidden" style={{ background:'#ffffff', border:`1.5px solid ${T.tealA15}`, boxShadow: T.cardShadow }}>
                <div className="flex items-start gap-3 p-4 pb-3">
                  <div className="relative flex-shrink-0" style={{ width:78, height:78 }}>
                    <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}/>
                    <div className="relative z-10 flex items-center justify-center w-full h-full">
                      <Avatar expr="here_for_you" active size={70}/>
                    </div>
                    <SpeakRings active/>
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <div style={{ fontWeight:800, fontSize:15, color:'#134e4a' }}>Sakha</div>
                    <div className="mt-1.5 px-3 py-2 rounded-2xl rounded-tl-sm" style={{ background: T.tealBubble, border:`1.5px solid ${T.tealA20}`, minHeight:42 }}>
                      <p style={{ fontSize:14, color:T.teal700, lineHeight:1.55, fontWeight:600, margin:0 }}>
                        {walkTyped}
                        {walkTyped.length < WALK_LINE.length && (
                          <span style={{ animation:'breathe 0.7s infinite', display:'inline-block', color:T.teal500 }}>▋</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                <div style={{ height:1, background: T.tealA15, margin:'0 18px' }}/>
                <div className="p-3 pb-2"><WalkCard compact/></div>

                <div className="px-4 pb-5 flex flex-col gap-2.5">
                  <button onClick={handleWalkMic} style={{
                    width:'100%', minHeight:60, borderRadius:20,
                    background: T.tealGrad, border: 'none', color:'white',
                    fontFamily:"'Nunito',sans-serif", fontWeight:800, fontSize:17,
                    cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                    boxShadow:`0 6px 22px ${T.tealA40}`, letterSpacing:'0.01em',
                  }}>
                    <span style={{ fontSize:22 }}>🎤</span>
                    {micAvail ? 'Speak Your Answer' : 'Voice Unavailable'}
                  </button>

                  <div className="flex items-center gap-2">
                    <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
                    <span style={{ fontSize:12, color:'#9ca3af', fontWeight:600 }}>or tap</span>
                    <div style={{ flex:1, height:1, background:'rgba(0,0,0,0.08)' }}/>
                  </div>

                  <Btn onClick={handleWalkAccept} bg={T.tealGrad} color="white" shadow={`0 6px 22px ${T.tealA40}`}>
                    <span style={{ fontSize:22 }}>🚶</span> Sure, Let's Walk
                  </Btn>
                  <Btn onClick={handleWalkDecline} bg="#ffffff" border={`2px solid ${T.tealA25}`} color={T.teal700}>
                    Not Today
                  </Btn>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BHAJAN OFFER ── */}
        {state === 'walk-bhajan-offer' && (
          <div className="relative flex-1 flex flex-col overflow-y-auto overflow-x-hidden" style={{ animation:'fadeIn 0.3s ease-out' }}>
            <ScrollTopMask/>
            <LockClock/>
            <div className="flex-1 flex flex-col items-center justify-center px-6 gap-5 pb-16">
              <div className="relative" style={{ width:110, height:110 }}>
                <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}/>
                <div className="relative z-10 flex items-center justify-center w-full h-full">
                  <Avatar expr="idea" active size={96}/>
                </div>
                <SpeakRings active/>
              </div>

              <div className="w-full rounded-3xl px-5 py-4 text-center" style={{ background:'#ffffff', border:`1.5px solid ${T.tealA15}`, boxShadow: T.cardShadow }}>
                <div style={{ fontSize:34, marginBottom:6 }}>🪕</div>
                <p style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:19, color:T.teal700, lineHeight:1.5, margin:0, minHeight:56 }}>
                  {bhajanOfferTyped}
                  {bhajanOfferTyped.length < bhajanOfferLine.length && (
                    <span style={{ animation:'breathe 0.7s infinite', display:'inline-block', color:T.teal500 }}>▋</span>
                  )}
                </p>
              </div>

              {bhajanOfferTyped.length >= bhajanOfferLine.length && (
                <div className="w-full flex flex-col gap-2.5">
                  <Btn onClick={handleBhajanYes} bg={T.tealGrad} color="white" shadow={`0 6px 22px ${T.tealA40}`} minH={58}>
                    <span style={{ fontSize:20 }}>🎵</span> {walkAccepted ? 'Yes, Play Some' : 'Yes, Play One'}
                  </Btn>
                  <Btn onClick={handleBhajanNo} bg="#ffffff" border={`2px solid ${T.tealA25}`} color={T.teal700} minH={58}>
                    {walkAccepted ? 'No, Just the Walk' : 'No, Maybe Later'}
                  </Btn>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── BHAJAN PLAYING ── */}
        {state === 'walk-bhajan-playing' && (
          <div className="relative flex-1 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-6 gap-5 py-6" style={{ background:`linear-gradient(175deg,${T.teal50},${T.teal100})`, animation:'fadeIn 0.4s ease-out' }}>
            <div className="relative" style={{ width:100, height:100 }}>
              <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}/>
              <div className="relative z-10 flex items-center justify-center w-full h-full">
                <Avatar expr="take_care" size={88}/>
              </div>
            </div>

            <div className="w-full rounded-3xl px-5 py-5 text-center flex flex-col items-center gap-3" style={{ background:'#ffffff', border:`1.5px solid ${T.tealA15}`, boxShadow: T.cardShadow }}>
              <div style={{ fontSize:38 }}>🎵</div>
              <div style={{ fontFamily:"'DM Serif Display',Georgia,serif", fontSize:19, color:T.teal700, textAlign:'center' }}>
                Now Playing
              </div>
              <div style={{ fontWeight:700, fontSize:15, color:T.teal600 }}>A Bhajan for You</div>
              <VoiceWave color={T.teal500} size="lg"/>
            </div>

            <Btn onClick={handleWalkFinish} bg={T.tealGrad} color="white" shadow={`0 6px 22px ${T.tealA40}`} minH={58}>
              Done, Thank You
            </Btn>
          </div>
        )}

        {/* ── WALK DONE (calm close, auto-returns) ── */}
        {state === 'walk-done' && (
          <div className="relative flex-1 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden px-6 gap-5 py-6" style={{ background:`linear-gradient(175deg,${T.teal50},${T.teal100})`, animation:'fadeIn 0.4s ease-out' }}>
            <div className="relative" style={{ width:100, height:100 }}>
              <div className="absolute inset-0 rounded-full" style={{ background:`linear-gradient(135deg,${T.teal100},${T.teal50})` }}/>
              <div className="relative z-10 flex items-center justify-center w-full h-full">
                <Avatar expr="take_care" size={88}/>
              </div>
            </div>

            <div className="w-full rounded-3xl px-5 py-4 text-center" style={{ background:'#ffffff', border:`1.5px solid ${T.tealA15}`, boxShadow: T.cardShadow }}>
              <p style={{ fontWeight:700, fontSize:17, color:T.teal700, lineHeight:1.55, margin:0 }}>
                {walkAccepted ? WALK_DONE_NO_BHAJAN : RELAX_NO_BHAJAN}
              </p>
            </div>

            <Btn onClick={handleWalkFinish} bg={T.tealGrad} color="white" shadow={`0 6px 22px ${T.tealA40}`} minH={58}>
              Okay
            </Btn>
          </div>
        )}


        {/* Home indicator */}
        <div className="flex justify-center py-2 flex-shrink-0">
          <div style={{ width:120, height:5, borderRadius:3, background: T.tealA25 }}/>
        </div>
      </div>
    </div>
  )
}
