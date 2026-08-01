import { useState, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen =
  | 'signup'
  | 'signup-email'
  | 'family-profiles'
  | 'add-parent-step1'
  | 'add-parent-step2'
  | 'add-parent-step3'
  | 'dashboard'

interface ParentProfile {
  id: number
  name: string
  rel: string
  dob: string
  lang: string
  emoji: string
  medName: string
  dosage: string
  activities: string[]
  music: string[]
  customRel?: string
}

const REL_EMOJI: Record<string, string> = {
  Mother: '👩', Father: '👨', Grandmother: '👵', Grandfather: '👴', Other: '🧓',
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const IconGoogle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
)

const IconCamera = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const IconUpload = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
  </svg>
)

const IconCheck = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IconPlus = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
)

const IconChevronLeft = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6"/>
  </svg>
)

const IconClock = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)

const IconEdit = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

// ─── Illustrations ─────────────────────────────────────────────────────────────
const FamilyIllustration = () => (
  <svg viewBox="0 0 320 220" fill="none" className="w-full max-w-xs mx-auto">
    <circle cx="160" cy="110" r="95" fill="#ccfbf1" opacity="0.5"/>
    <circle cx="80" cy="90" r="28" fill="#0d9488" opacity="0.15"/>
    <circle cx="80" cy="72" r="16" fill="#0d9488" opacity="0.6"/>
    <rect x="62" y="90" width="36" height="38" rx="10" fill="#0d9488" opacity="0.5"/>
    <line x1="98" y1="108" x2="105" y2="128" stroke="#0d9488" strokeWidth="3" strokeLinecap="round" opacity="0.6"/>
    <circle cx="155" cy="80" r="20" fill="#14b8a6" opacity="0.8"/>
    <rect x="137" y="102" width="36" height="44" rx="10" fill="#14b8a6" opacity="0.7"/>
    <circle cx="200" cy="85" r="18" fill="#0f766e" opacity="0.7"/>
    <rect x="184" y="105" width="32" height="40" rx="10" fill="#0f766e" opacity="0.5"/>
    <circle cx="238" cy="100" r="13" fill="#86efac" opacity="0.9"/>
    <rect x="226" y="115" width="24" height="28" rx="8" fill="#86efac" opacity="0.7"/>
    <path d="M155 50 C155 50 148 42 141 42 C135 42 130 47 130 53 C130 65 155 75 155 75 C155 75 180 65 180 53 C180 47 175 42 169 42 C162 42 155 50 155 50Z" fill="#f43f5e" opacity="0.25"/>
    <circle cx="45" cy="45" r="3" fill="#14b8a6" opacity="0.4"/>
    <circle cx="270" cy="60" r="4" fill="#0d9488" opacity="0.3"/>
    <circle cx="110" cy="155" r="3" fill="#86efac" opacity="0.5"/>
    <circle cx="240" cy="160" r="2.5" fill="#14b8a6" opacity="0.4"/>
  </svg>
)

const MedicineIllustration = () => (
  <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16">
    <circle cx="40" cy="40" r="36" fill="#ccfbf1"/>
    <rect x="28" y="22" width="24" height="36" rx="6" fill="#14b8a6" opacity="0.7"/>
    <rect x="28" y="22" width="24" height="16" rx="6" fill="#0d9488"/>
    <rect x="36" y="34" width="8" height="3" rx="1.5" fill="white"/>
    <rect x="38.5" y="31.5" width="3" height="8" rx="1.5" fill="white"/>
  </svg>
)

// ─── Shared Components ────────────────────────────────────────────────────────
const PhoneFrame = ({ children, bg = 'bg-gray-50' }: { children: React.ReactNode; bg?: string }) => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-teal-50 via-white to-green-50 p-4">
    <div
      className={`relative w-full max-w-sm ${bg} rounded-[2.5rem] shadow-2xl overflow-hidden`}
      style={{ minHeight: 780, maxHeight: 860 }}
    >
      <div className="flex items-center justify-between px-6 pt-4 pb-1">
        <span className="text-xs font-semibold text-gray-500">9:41</span>
        <div className="w-24 h-5 bg-black rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-3" style={{ width: 90 }}/>
        <div className="flex items-center gap-1">
          <div className="w-4 h-2.5 rounded-sm border border-gray-400 relative">
            <div className="absolute inset-0.5 right-1 bg-gray-500 rounded-sm"/>
            <div className="absolute right-0 top-0.5 bottom-0.5 w-0.5 bg-gray-400"/>
          </div>
        </div>
      </div>
      <div className="overflow-y-auto" style={{ height: 740, scrollbarWidth: 'none' }}>
        {children}
      </div>
    </div>
  </div>
)

const PrimaryButton = ({ label, onClick, disabled = false }: { label: string; onClick: () => void; disabled?: boolean }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`w-full py-4 rounded-2xl font-bold text-base transition-all ${
      disabled
        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
        : 'bg-teal-600 text-white shadow-lg shadow-teal-200 hover:bg-teal-700 active:scale-95'
    }`}
  >
    {label}
  </button>
)

const OutlineButton = ({ label, icon, onClick }: { label: string; icon?: React.ReactNode; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="w-full py-3.5 rounded-2xl font-semibold text-sm border-2 border-gray-200 bg-white text-gray-700 flex items-center justify-center gap-2.5 hover:border-teal-300 hover:bg-teal-50 transition-all active:scale-95"
  >
    {icon}
    {label}
  </button>
)

const InputField = ({
  label, placeholder, type = 'text', value, onChange,
}: {
  label: string; placeholder: string; type?: string; value: string; onChange: (v: string) => void
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 bg-white text-sm font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 transition-colors"
    />
  </div>
)

const StepIndicator = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2 justify-center mb-6">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={`h-2 rounded-full transition-all ${
          i < current ? 'bg-teal-600 w-6' : i === current - 1 ? 'bg-teal-600 w-8' : 'bg-gray-200 w-4'
        }`}
      />
    ))}
  </div>
)

// ─── Screen 1: Sign Up ────────────────────────────────────────────────────────
const SignUpScreen = ({ onNext }: { onNext: (s: Screen) => void }) => {
  const [agreed, setAgreed] = useState(false)
  return (
    <PhoneFrame bg="bg-white">
      <div className="px-6 pt-6 pb-8 flex flex-col min-h-full">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center shadow-sm">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" fill="white"/>
              <path d="M16 11h-3V8h-2v3H8v2h3v3h2v-3h3z" fill="white"/>
            </svg>
          </div>
          <span className="text-base font-extrabold text-teal-700 tracking-tight">CareCircle</span>
        </div>

        <div className="mb-8">
          <h1 className="font-display text-3xl text-gray-900 leading-tight mb-3">
            Welcome to<br /><span className="text-teal-600">CareCircle</span>
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Help your loved ones stay healthy and independent with the support of an AI companion.
          </p>
        </div>

        <div className="flex flex-col gap-3 mb-5">
          <OutlineButton label="Continue with Google" icon={<IconGoogle />} onClick={() => onNext('family-profiles')} />
          <button
            onClick={() => onNext('signup-email')}
            className="w-full py-3.5 rounded-2xl font-semibold text-sm bg-teal-600 text-white flex items-center justify-center gap-2.5 shadow-lg shadow-teal-200 hover:bg-teal-700 transition-all active:scale-95"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Continue with Email
          </button>
        </div>

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 h-px bg-gray-100"/>
          <span className="text-xs text-gray-400 font-semibold">Secure & Private</span>
          <div className="flex-1 h-px bg-gray-100"/>
        </div>

        <div className="mt-auto pt-6">
          <div className="bg-teal-50 rounded-2xl p-4 mb-4">
            <p className="text-xs text-gray-500 leading-relaxed">
              By creating an account, you agree to our{' '}
              <span className="text-teal-600 font-bold">Terms & Conditions</span> and{' '}
              <span className="text-teal-600 font-bold">Privacy Policy</span>. We securely handle personal and health information in accordance with applicable data protection regulations and healthcare privacy standards.
            </p>
          </div>
          <button onClick={() => setAgreed(!agreed)} className="flex items-start gap-3 w-full text-left">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`}>
              {agreed && <IconCheck size={12} />}
            </div>
            <span className="text-xs text-gray-600 font-semibold leading-relaxed">
              I agree to the Terms & Conditions and Privacy Policy
            </span>
          </button>
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── Screen 1b: Email Sign Up ─────────────────────────────────────────────────
const EmailSignUpScreen = ({ onNext, onBack }: { onNext: (s: Screen) => void; onBack: () => void }) => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' })
  const [agreed, setAgreed] = useState(false)
  const set = (k: keyof typeof form) => (v: string) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.firstName && form.lastName && form.email && form.password && agreed

  return (
    <PhoneFrame bg="bg-white">
      <div className="px-6 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <IconChevronLeft />
          </button>
          <span className="font-bold text-gray-800">Create Account</span>
        </div>

        <h2 className="font-display text-2xl text-gray-900 mb-1">Your details</h2>
        <p className="text-sm text-gray-400 mb-7">We'll use this to keep your family safe.</p>

        <div className="flex flex-col gap-4 mb-6">
          <div className="flex gap-3">
            <div className="flex-1"><InputField label="First Name" placeholder="Priya" value={form.firstName} onChange={set('firstName')} /></div>
            <div className="flex-1"><InputField label="Last Name" placeholder="Sharma" value={form.lastName} onChange={set('lastName')} /></div>
          </div>
          <InputField label="Email Address" placeholder="priya@email.com" type="email" value={form.email} onChange={set('email')} />
          <InputField label="Password" placeholder="Min. 8 characters" type="password" value={form.password} onChange={set('password')} />
        </div>

        <div className="bg-teal-50 rounded-2xl p-4 mb-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            We securely handle personal and health information in accordance with applicable data protection regulations and healthcare privacy standards.
          </p>
        </div>
        <button onClick={() => setAgreed(!agreed)} className="flex items-start gap-3 w-full text-left mb-6">
          <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${agreed ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`}>
            {agreed && <IconCheck size={12} />}
          </div>
          <span className="text-xs text-gray-600 font-semibold leading-relaxed">I agree to the Terms & Conditions and Privacy Policy</span>
        </button>

        <PrimaryButton label="Create Account" onClick={() => onNext('family-profiles')} disabled={!valid} />
      </div>
    </PhoneFrame>
  )
}

// ─── Screen 2: Family Profiles ────────────────────────────────────────────────
const FamilyProfilesScreen = ({
  profiles,
  onAddParent,
  onViewDashboard,
}: {
  profiles: ParentProfile[]
  onAddParent: () => void
  onViewDashboard: (id: number) => void
}) => (
  <PhoneFrame bg="bg-white">
    <div className="px-6 pt-4 pb-8 flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-teal-600 rounded-xl flex items-center justify-center">
            <span className="text-white text-xs font-bold">CC</span>
          </div>
          <span className="font-extrabold text-teal-700 text-sm">CareCircle</span>
        </div>
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/><path d="M6 20v-2a6 6 0 0112 0v2"/>
          </svg>
        </div>
      </div>

      <div className="py-4 text-center">
        <h1 className="font-display text-2xl text-gray-900 mb-1">Your Family</h1>
        <p className="text-sm text-gray-400">
          {profiles.length === 0 ? 'Add your loved ones to get started' : `${profiles.length} member${profiles.length > 1 ? 's' : ''} added`}
        </p>
      </div>

      {profiles.length === 0 ? (
        <div className="py-2">
          <FamilyIllustration />
          <p className="text-center text-sm text-gray-400 leading-relaxed mt-2">
            Add your parent or grandparent's profile to<br />set up their personalised care plan.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 mb-4">
          {profiles.map(p => (
            <button
              key={p.id}
              onClick={() => onViewDashboard(p.id)}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-teal-200 hover:bg-teal-50 transition-all active:scale-95 text-left shadow-sm"
            >
              <div className="w-14 h-14 rounded-xl bg-teal-100 flex items-center justify-center text-2xl flex-shrink-0">
                {REL_EMOJI[p.rel] ?? '🧓'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-base truncate">{p.name}</p>
                <p className="text-sm text-gray-400 font-semibold">{p.rel}</p>
                {p.medName && (
                  <p className="text-xs text-teal-600 font-semibold mt-0.5 truncate">💊 {p.medName}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"/>
                  <span className="text-xs text-green-600 font-bold">Online</span>
                </div>
                <span className="text-xs text-teal-600 font-semibold">View →</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-auto">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3 text-center">
          Who would you like to add?
        </p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[
            { label: 'Mother', emoji: '👩' },
            { label: 'Father', emoji: '👨' },
            { label: 'Grandmother', emoji: '👵' },
            { label: 'Grandfather', emoji: '👴' },
          ].map(p => (
            <button
              key={p.label}
              onClick={onAddParent}
              className="py-4 rounded-2xl bg-teal-50 border-2 border-teal-100 text-sm font-bold text-teal-700 flex flex-col items-center justify-center gap-1.5 hover:border-teal-400 hover:bg-teal-100 transition-all active:scale-95"
            >
              <span className="text-2xl">{p.emoji}</span>
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={onAddParent}
          className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 bg-white flex items-center justify-center gap-2.5 hover:border-teal-300 hover:bg-teal-50 transition-all active:scale-95"
        >
          <div className="w-6 h-6 bg-gray-200 rounded-lg flex items-center justify-center">
            <IconPlus />
          </div>
          <span className="text-sm font-bold text-gray-500">Other family member</span>
        </button>
      </div>
    </div>
  </PhoneFrame>
)

// ─── Screen 3a: Add Parent – Step 1 ──────────────────────────────────────────
const AddParentStep1 = ({
  draft, setDraft, onNext, onBack,
}: {
  draft: Partial<ParentProfile>
  setDraft: (d: Partial<ParentProfile>) => void
  onNext: (s: Screen) => void
  onBack: () => void
}) => {
  const set = (k: keyof ParentProfile) => (v: string) => setDraft({ ...draft, [k]: v })
  const dobRef = useRef<HTMLInputElement>(null)
  const showOther = draft.rel === 'Other'

  return (
    <PhoneFrame bg="bg-white">
      <div className="px-6 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <IconChevronLeft />
          </button>
          <span className="font-bold text-gray-800">Create Profile</span>
        </div>

        <StepIndicator current={1} total={3} />

        <h2 className="font-display text-2xl text-gray-900 mb-1">Basic Information</h2>
        <p className="text-sm text-gray-400 mb-6">Tell us about your loved one.</p>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-teal-100 flex items-center justify-center shadow-sm text-3xl">
              {showOther ? '🧓' : (REL_EMOJI[draft.rel ?? 'Mother'] ?? '👵')}
            </div>
            <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-teal-600 rounded-lg flex items-center justify-center shadow text-white">
              <IconCamera />
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 mb-6">
          <InputField label="Family Member's Name" placeholder="e.g. Meera Sharma" value={draft.name ?? ''} onChange={set('name')} />

          {/* Relationship */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Relationship</label>
            <div className="grid grid-cols-2 gap-2">
              {['Mother', 'Father', 'Grandmother', 'Grandfather'].map(r => (
                <button
                  key={r}
                  onClick={() => set('rel')(r)}
                  className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    draft.rel === r ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {REL_EMOJI[r]} {r}
                </button>
              ))}
            </div>
            {/* Other spans full width below the grid */}
            <button
              onClick={() => set('rel')('Other')}
              className={`w-full py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                showOther ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
              }`}
            >
              🧓 Other
            </button>
            {/* Text box appears when Other is selected */}
            {showOther && (
              <input
                autoFocus
                placeholder="e.g. Aunt, Uncle, Guardian…"
                value={draft.customRel ?? ''}
                onChange={e => setDraft({ ...draft, customRel: e.target.value })}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-teal-300 bg-teal-50 text-sm font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-500 transition-colors"
              />
            )}
          </div>

          {/* Date of Birth — entire field is clickable */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Date of Birth</label>
            <div
              className="relative w-full cursor-pointer"
              onClick={() => dobRef.current?.focus()}
            >
              <input
                ref={dobRef}
                type="date"
                value={draft.dob ?? ''}
                onChange={e => set('dob')(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 bg-white text-sm font-semibold text-gray-800 focus:outline-none focus:border-teal-400 transition-colors cursor-pointer appearance-none"
              />
              {!draft.dob && (
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-300 pointer-events-none">
                  DD / MM / YYYY
                </span>
              )}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </span>
            </div>
          </div>

          {/* Preferred Language — custom styled to match other fields */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">Preferred Language</label>
            <div className="relative">
              <select
                value={draft.lang ?? 'English'}
                onChange={e => set('lang')(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 bg-white text-sm font-semibold text-gray-800 focus:outline-none focus:border-teal-400 transition-colors appearance-none cursor-pointer pr-10"
              >
                {['English', 'Hindi', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Gujarati', 'Punjabi'].map(l => (
                  <option key={l}>{l}</option>
                ))}
              </select>
              {/* Chevron icon, matches InputField visual style */}
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </span>
            </div>
          </div>
        </div>

        <PrimaryButton label="Continue →" onClick={() => onNext('add-parent-step2')} disabled={!draft.name} />
      </div>
    </PhoneFrame>
  )
}

// ─── Screen 3b: Add Parent – Step 2 (Medications) ────────────────────────────
const AddParentStep2 = ({
  draft, setDraft, onNext, onBack,
}: {
  draft: Partial<ParentProfile>
  setDraft: (d: Partial<ParentProfile>) => void
  onNext: (s: Screen) => void
  onBack: () => void
}) => {
  const [hasPhoto, setHasPhoto] = useState(false)
  const [hasPrescription, setHasPrescription] = useState(false)

  return (
    <PhoneFrame bg="bg-white">
      <div className="px-6 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <IconChevronLeft />
          </button>
          <span className="font-bold text-gray-800">Medication Setup</span>
        </div>

        <StepIndicator current={2} total={3} />

        <div className="flex items-center gap-3 mb-4">
          <MedicineIllustration />
          <div>
            <h2 className="font-display text-2xl text-gray-900 leading-tight">Medication<br />Setup</h2>
            <p className="text-xs text-teal-600 font-semibold">Highest priority</p>
          </div>
        </div>

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              1. What medicine should the AI remind {draft.name || 'your parent'} to take?
            </label>
            <input
              placeholder="e.g. Metformin 500mg"
              value={draft.medName ?? ''}
              onChange={e => setDraft({ ...draft, medName: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 bg-white text-sm font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">2. Photograph of the medicine</label>
            <button
              onClick={() => setHasPhoto(true)}
              className={`w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${hasPhoto ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-gray-50'}`}
            >
              {hasPhoto
                ? <><span className="text-teal-600"><IconCheck size={18} /></span><span className="text-sm font-semibold text-teal-600">Photo Added</span></>
                : <><span className="text-gray-400"><IconCamera /></span><span className="text-sm font-semibold text-gray-400">Tap to take or upload photo</span></>}
            </button>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">3. Dosage & Schedule</label>
            <input
              placeholder="e.g. One tablet after breakfast at 8:00 AM"
              value={draft.dosage ?? ''}
              onChange={e => setDraft({ ...draft, dosage: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 bg-white text-sm font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 transition-colors"
            />
            <div className="flex flex-wrap gap-2 mt-1">
              {['8:00 AM', '1:00 PM', '8:00 PM', 'Bedtime'].map(t => (
                <button key={t} className="px-3 py-1.5 rounded-lg bg-teal-50 text-teal-600 text-xs font-bold border border-teal-200 hover:bg-teal-100 transition-all">
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              4. Upload prescription <span className="text-gray-300 normal-case font-normal">(optional)</span>
            </label>
            <button
              onClick={() => setHasPrescription(true)}
              className={`w-full py-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${hasPrescription ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-gray-50'}`}
            >
              {hasPrescription
                ? <><span className="text-green-600"><IconCheck size={18} /></span><span className="text-sm font-semibold text-green-600">Prescription Added</span></>
                : <><span className="text-gray-400"><IconUpload /></span><span className="text-sm font-semibold text-gray-400">Upload prescription PDF or photo</span></>}
            </button>
          </div>

          <div className="flex items-start gap-2.5 bg-amber-50 rounded-xl p-3.5 border border-amber-100">
            <span className="text-lg">💊</span>
            <p className="text-xs text-amber-700 font-semibold leading-relaxed">
              You can always add or update medicines later from the dashboard.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <PrimaryButton label="Continue →" onClick={() => onNext('add-parent-step3')} disabled={!draft.medName} />
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── Screen 3c: Add Parent – Step 3 (Interests) ──────────────────────────────
const AddParentStep3 = ({
  draft, setDraft, onFinish, onBack,
}: {
  draft: Partial<ParentProfile>
  setDraft: (d: Partial<ParentProfile>) => void
  onFinish: () => void
  onBack: () => void
}) => {
  const [notes, setNotes] = useState('')
  const activities = draft.activities ?? []
  const music = draft.music ?? []

  const toggle = (arr: string[], val: string, key: 'activities' | 'music') => {
    const next = arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]
    setDraft({ ...draft, [key]: next })
  }

  const activityOptions = ['Walking 🚶', 'Bhajans 🙏', 'Gardening 🌱', 'Yoga 🧘', 'Reading 📖', 'Cooking 🍳', 'Painting 🎨', 'Chess ♟️']
  const musicOptions = ['Bhajans 🕉️', 'Old Hindi Songs 🎵', 'Instrumental 🎹', 'Classical 🎻', 'Devotional 🙌', 'Folk 🪘']

  return (
    <PhoneFrame bg="bg-white">
      <div className="px-6 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={onBack} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
            <IconChevronLeft />
          </button>
          <span className="font-bold text-gray-800">Personalise for {draft.name || 'your parent'}</span>
        </div>

        <StepIndicator current={3} total={3} />

        <h2 className="font-display text-2xl text-gray-900 mb-1">Interests &<br />Preferences</h2>
        <p className="text-sm text-gray-400 mb-6">Help the AI companion feel personal and familiar.</p>

        <div className="flex flex-col gap-6">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">
              Activities {draft.name || 'your parent'} enjoys
            </label>
            <div className="flex flex-wrap gap-2">
              {activityOptions.map(a => (
                <button
                  key={a}
                  onClick={() => toggle(activities, a, 'activities')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    activities.includes(a) ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-3">
              Music & Spiritual content they enjoy
            </label>
            <div className="flex flex-wrap gap-2">
              {musicOptions.map(m => (
                <button
                  key={m}
                  onClick={() => toggle(music, m, 'music')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border-2 transition-all ${
                    music.includes(m) ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-500 hover:border-gray-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide block mb-2">
              Anything else the AI should know? <span className="text-gray-300 normal-case font-normal">(optional)</span>
            </label>
            <textarea
              rows={3}
              placeholder={`e.g. ${draft.name || 'She'} loves talking about her grandchildren and misses her hometown.`}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-100 bg-white text-sm font-semibold text-gray-800 placeholder-gray-300 focus:outline-none focus:border-teal-400 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="mt-6">
          <PrimaryButton label="Finish Setup ✓" onClick={onFinish} />
          <p className="text-center text-xs text-gray-400 mt-3 font-semibold">
            {draft.name ? `${draft.name}'s` : "Your parent's"} profile will be ready in seconds
          </p>
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── Screen 4: Dashboard ──────────────────────────────────────────────────────
const DashboardScreen = ({
  profile,
  profiles,
  onSwitchProfile,
  onAddParent,
}: {
  profile: ParentProfile
  profiles: ParentProfile[]
  onSwitchProfile: (id: number) => void
  onAddParent: () => void
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'medications' | 'profile'>('today')

  const tasks = [
    { time: '8:00 AM', label: 'Morning Medicine', done: true, icon: '💊' },
    { time: '8:30 AM', label: 'Breakfast', done: true, icon: '🍽️' },
    { time: '10:00 AM', label: 'Hydration Reminder', done: true, icon: '💧' },
    { time: '2:00 PM', label: profile.medName || 'Afternoon Medicine', done: false, icon: '💊', upcoming: true },
    { time: '4:00 PM', label: 'Afternoon Walk', done: false, icon: '🚶' },
    { time: '8:00 PM', label: 'Evening Medicine', done: false, icon: '💊' },
  ]

  const summaryItems = [
    { emoji: '✅', label: 'Morning Medicine', value: 'Taken', ok: true },
    { emoji: '🍽️', label: 'Breakfast', value: 'Completed', ok: true },
    { emoji: '💧', label: 'Water Intake', value: '3 of 8 glasses', ok: false },
    { emoji: '⏰', label: 'Next Medicine', value: '2:00 PM', ok: null },
    { emoji: '🚶', label: 'Afternoon Walk', value: 'Pending', ok: false },
  ]

  return (
    <PhoneFrame bg="bg-gray-50">
      <div className="flex flex-col" style={{ minHeight: 740 }}>
        {/* Header */}
        <div className="bg-teal-600 px-5 pt-4 pb-6 rounded-b-3xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-teal-200 text-xs font-semibold">Good afternoon,</p>
              <p className="text-white font-bold text-base">CareCircle 👋</p>
            </div>
            {/* Profile switcher pill */}
            {profiles.length > 1 && (
              <div className="flex items-center gap-1 bg-white/20 rounded-xl px-2 py-1">
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => onSwitchProfile(p.id)}
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all ${
                      p.id === profile.id ? 'bg-white shadow-sm' : 'opacity-60 hover:opacity-80'
                    }`}
                    title={p.name}
                  >
                    {REL_EMOJI[p.rel] ?? '🧓'}
                  </button>
                ))}
                <button
                  onClick={onAddParent}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-all"
                  title="Add family member"
                >
                  <IconPlus />
                </button>
              </div>
            )}
            {profiles.length === 1 && (
              <button className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
              </button>
            )}
          </div>

          {/* Parent profile card — uses the real saved name */}
          <div className="bg-white/15 backdrop-blur rounded-2xl p-4 flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-xl bg-white/30 flex items-center justify-center text-2xl">
                {REL_EMOJI[profile.rel] ?? '🧓'}
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-teal-600"/>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-base truncate">{profile.name}</p>
              <p className="text-teal-200 text-xs font-semibold mb-1.5">{profile.rel} · {profile.lang}</p>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>
                <span className="text-green-300 text-xs font-bold">AI Companion Online</span>
              </div>
            </div>
            <button className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
              <IconEdit />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex mx-5 mt-4 bg-white rounded-xl p-1 shadow-sm border border-gray-100">
          {([['today', "Today's Care"], ['medications', 'Medicines'], ['profile', 'Profile']] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === key ? 'bg-teal-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 px-5 pt-4 pb-4 flex flex-col gap-4">
          {activeTab === 'today' && (
            <>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl">⏰</span>
                <div>
                  <p className="font-bold text-amber-800 text-sm">Upcoming Reminder</p>
                  <p className="text-amber-600 text-xs mt-0.5">
                    {profile.medName || 'Medicine'} at 2:00 PM
                  </p>
                </div>
                <div className="ml-auto flex-shrink-0">
                  <span className="bg-amber-200 text-amber-700 text-xs font-bold px-2 py-1 rounded-lg">Soon</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-gray-800 text-sm">Today's Care Summary</p>
                  <span className="text-xs text-teal-600 font-bold">Thu, 31 Jul</span>
                </div>
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400 font-semibold">Overall progress</span>
                    <span className="text-xs font-bold text-teal-600">40%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: '40%' }}/>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  {summaryItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center">{item.emoji}</span>
                      <span className="flex-1 text-sm font-semibold text-gray-700">{item.label}</span>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                        item.ok === true ? 'bg-green-100 text-green-700' :
                        item.ok === false ? 'bg-gray-100 text-gray-500' :
                        'bg-teal-100 text-teal-700'
                      }`}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <p className="font-bold text-gray-800 text-sm mb-4">Activity Timeline</p>
                <div className="flex flex-col gap-0">
                  {tasks.map((task, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="flex flex-col items-center" style={{ width: 24 }}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                          task.done ? 'bg-teal-500' : task.upcoming ? 'bg-amber-400' : 'bg-gray-200'
                        }`}>
                          {task.done ? <IconCheck size={10} /> : task.upcoming ? <IconClock /> : <div className="w-2 h-2 rounded-full bg-gray-400"/>}
                        </div>
                        {i < tasks.length - 1 && (
                          <div className={`w-0.5 flex-1 my-0.5 ${task.done ? 'bg-teal-200' : 'bg-gray-100'}`} style={{ minHeight: 16 }}/>
                        )}
                      </div>
                      <div className="flex-1 pb-3">
                        <p className={`text-xs font-bold ${task.upcoming ? 'text-amber-600' : 'text-gray-400'}`}>{task.time}</p>
                        <p className={`text-sm font-semibold ${task.done ? 'text-gray-400 line-through' : task.upcoming ? 'text-amber-700 font-bold' : 'text-gray-700'}`}>
                          {task.icon} {task.label}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <p className="font-bold text-gray-800 text-sm mb-3">Quick Actions</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Edit Medicines', icon: '✏️', color: 'bg-teal-50 border-teal-100 text-teal-700' },
                    { label: 'Add Medicine', icon: '➕', color: 'bg-green-50 border-green-100 text-green-700' },
                    { label: 'Prescriptions', icon: '📄', color: 'bg-blue-50 border-blue-100 text-blue-700' },
                    { label: 'Edit Profile', icon: '👤', color: 'bg-purple-50 border-purple-100 text-purple-700' },
                  ].map((a, i) => (
                    <button key={i} className={`py-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 ${a.color} hover:opacity-80 transition-all active:scale-95`}>
                      <span className="text-base">{a.icon}</span>{a.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTab === 'medications' && (
            <div className="flex flex-col gap-3">
              <p className="font-bold text-gray-800 text-sm">
                {profile.name ? `${profile.name}'s` : 'Current'} Medications
              </p>
              {profile.medName ? (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center text-xl">💊</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm">{profile.medName}</p>
                      <p className="text-xs text-gray-400 font-semibold mt-0.5">{profile.dosage || 'As prescribed · 8:00 AM'}</p>
                    </div>
                    <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-green-100 text-green-700">Taken ✓</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No medications added yet.</p>
              )}
              <button className="w-full py-3.5 rounded-2xl border-2 border-dashed border-teal-300 bg-teal-50 flex items-center justify-center gap-2 text-teal-600 text-sm font-bold">
                <IconPlus /> Add New Medicine
              </button>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="flex flex-col gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl bg-teal-100 flex items-center justify-center text-3xl">
                    {REL_EMOJI[profile.rel] ?? '🧓'}
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">{profile.name}</p>
                    <p className="text-sm text-gray-400 font-semibold">{profile.rel}</p>
                    <p className="text-xs text-teal-600 font-bold mt-1">{profile.lang}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Relationship', value: profile.rel },
                    { label: 'Language', value: profile.lang },
                    { label: 'Medicines', value: profile.medName ? '1 active' : 'None added' },
                    { label: 'AI Companion', value: 'Online ✅' },
                  ].map((s, i) => (
                    <div key={i} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-400 font-semibold">{s.label}</p>
                      <p className="text-sm font-bold text-gray-800 mt-0.5">{s.value}</p>
                    </div>
                  ))}
                </div>
              </div>
              {(profile.activities?.length > 0 || profile.music?.length > 0) && (
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <p className="font-bold text-gray-800 text-sm mb-3">Interests</p>
                  <div className="flex flex-wrap gap-2">
                    {[...( profile.activities ?? []), ...(profile.music ?? [])].map(t => (
                      <span key={t} className="px-3 py-1.5 bg-teal-50 text-teal-700 text-xs font-bold rounded-lg border border-teal-100">{t}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </PhoneFrame>
  )
}

// ─── App Shell ────────────────────────────────────────────────────────────────
export default function AdultChildApp() {
  const [screen, setScreen] = useState<Screen>('signup')
  const [history, setHistory] = useState<Screen[]>([])
  const [profiles, setProfiles] = useState<ParentProfile[]>([])
  const [activeDashboardId, setActiveDashboardId] = useState<number | null>(null)
  const [draft, setDraft] = useState<Partial<ParentProfile>>({ rel: 'Mother', lang: 'English', activities: [], music: [] })

  const navigate = (next: Screen) => {
    setHistory(h => [...h, screen])
    setScreen(next)
  }

  const goBack = () => {
    if (history.length === 0) return
    const prev = history[history.length - 1]
    setHistory(h => h.slice(0, -1))
    setScreen(prev)
  }

  const startAddParent = () => {
    setDraft({ rel: 'Mother', lang: 'English', activities: [], music: [] })
    navigate('add-parent-step1')
  }

  const finishSetup = () => {
    const newProfile: ParentProfile = {
      id: Date.now(),
      name: draft.name ?? 'Parent',
      rel: draft.rel ?? 'Mother',
      dob: draft.dob ?? '',
      lang: draft.lang ?? 'English',
      emoji: REL_EMOJI[draft.rel ?? 'Mother'] ?? '🧓',
      medName: draft.medName ?? '',
      dosage: draft.dosage ?? '',
      activities: draft.activities ?? [],
      music: draft.music ?? [],
    }
    const updated = [...profiles, newProfile]
    setProfiles(updated)
    setActiveDashboardId(newProfile.id)
    setHistory([])
    setScreen('dashboard')
  }

  const activeProfile = profiles.find(p => p.id === activeDashboardId) ?? profiles[0]

  switch (screen) {
    case 'signup':
      return <SignUpScreen onNext={navigate} />
    case 'signup-email':
      return <EmailSignUpScreen onNext={navigate} onBack={goBack} />
    case 'family-profiles':
      return (
        <FamilyProfilesScreen
          profiles={profiles}
          onAddParent={startAddParent}
          onViewDashboard={id => { setActiveDashboardId(id); navigate('dashboard') }}
        />
      )
    case 'add-parent-step1':
      return <AddParentStep1 draft={draft} setDraft={setDraft} onNext={navigate} onBack={goBack} />
    case 'add-parent-step2':
      return <AddParentStep2 draft={draft} setDraft={setDraft} onNext={navigate} onBack={goBack} />
    case 'add-parent-step3':
      return <AddParentStep3 draft={draft} setDraft={setDraft} onFinish={finishSetup} onBack={goBack} />
    case 'dashboard':
      return activeProfile ? (
        <DashboardScreen
          profile={activeProfile}
          profiles={profiles}
          onSwitchProfile={id => setActiveDashboardId(id)}
          onAddParent={() => { setHistory(h => [...h, 'dashboard']); startAddParent() }}
        />
      ) : <FamilyProfilesScreen profiles={[]} onAddParent={startAddParent} onViewDashboard={() => {}} />
    default:
      return <SignUpScreen onNext={navigate} />
  }
}
