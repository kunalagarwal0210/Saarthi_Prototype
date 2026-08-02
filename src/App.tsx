import { useState } from 'react'
import ElderApp from './ElderApp'
import AdultChildApp from './AdultChildApp'

type Choice = 'chooser' | 'elder' | 'adult-child'

const teal = {
  50: '#f0fdfa', 100: '#ccfbf1', 500: '#14b8a6', 600: '#0d9488', 700: '#0f766e',
}

function ChooserScreen({ onChoose }: { onChoose: (c: Choice) => void }) {
  return (
    <div className="w-full h-full flex items-center justify-center" style={{
      background: `linear-gradient(135deg, ${teal[50]} 0%, #ffffff 55%, #f0fdf4 100%)`,
      fontFamily: "'Nunito', system-ui, sans-serif",
    }}>
      <div className="w-full flex flex-col items-center px-6" style={{ maxWidth: 420 }}>
        {/* Saarthi logo */}
        <img src="/logo/saarthi-icon.png" alt="Saarthi" style={{ height: 88, width: 'auto', marginBottom: 8 }}/>

        <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 42, color: '#17324d', margin: 0 }}>
          Saarthi
        </h1>
        <p style={{ fontSize: 14, color: teal[600], fontWeight: 700, marginTop: 2, marginBottom: 2, textAlign: 'center' }}>
          Helping elders live independently, helping families care confidently.
        </p>
        <p style={{ fontSize: 14, color: '#9ca3af', fontWeight: 600, marginTop: 10, marginBottom: 32, textAlign: 'center' }}>
          Choose how you'd like to continue
        </p>

        <button
          onClick={() => onChoose('elder')}
          className="w-full flex items-center gap-4 rounded-3xl px-5 py-5 mb-4 text-left transition-all active:scale-95"
          style={{ background: '#ffffff', border: `2px solid ${teal[100]}`, boxShadow: '0 10px 30px rgba(15,118,110,0.10)', cursor: 'pointer' }}
        >
          <div className="flex items-center justify-center rounded-2xl flex-shrink-0" style={{ width: 56, height: 56, background: teal[50] }}>
            <span style={{ fontSize: 28 }}>🧓</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#134e4a' }}>Elder</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#6b7280', marginTop: 2 }}>A companion for everyday care</div>
          </div>
        </button>

        <button
          onClick={() => onChoose('adult-child')}
          className="w-full flex items-center gap-4 rounded-3xl px-5 py-5 text-left transition-all active:scale-95"
          style={{ background: '#ffffff', border: `2px solid ${teal[100]}`, boxShadow: '0 10px 30px rgba(15,118,110,0.10)', cursor: 'pointer' }}
        >
          <div className="flex items-center justify-center rounded-2xl flex-shrink-0" style={{ width: 56, height: 56, background: teal[50] }}>
            <span style={{ fontSize: 28 }}>👨‍👩‍👧</span>
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 18, color: '#134e4a' }}>Adult Child</div>
            <div style={{ fontWeight: 600, fontSize: 13, color: '#6b7280', marginTop: 2 }}>Manage your parent's care</div>
          </div>
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [choice, setChoice] = useState<Choice>('chooser')

  return (
    <div className="w-full h-full relative">
      {choice !== 'chooser' && (
        <button
          onClick={() => setChoice('chooser')}
          className="fixed top-4 left-4 z-[100] flex items-center gap-1.5 px-3.5 py-2 rounded-full transition-all active:scale-95"
          style={{
            background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)',
            border: `1.5px solid ${teal[100]}`, color: teal[700],
            fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13,
            boxShadow: '0 4px 16px rgba(15,118,110,0.15)', cursor: 'pointer',
          }}
        >
          ← Switch login
        </button>
      )}

      {choice === 'chooser' && <ChooserScreen onChoose={setChoice}/>}
      {choice === 'elder' && <ElderApp/>}
      {choice === 'adult-child' && <AdultChildApp/>}
    </div>
  )
}
