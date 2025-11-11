// src/components/NarrativeResult.jsx
import useGameStore from '../store/useGameStore'

export default function NarrativeResult() {
  const { frasesFinales, resetJuego, setScreen } = useGameStore()

  const handleRestart = () => {
    resetJuego()
    setScreen('selector')
  }

  return (
    <div style={{ backgroundColor: 'black', color: 'white', padding: 24 }}>
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>
        Resultado final ✨
      </h1>

      <div style={{ marginBottom: 32 }}>
        {frasesFinales.map((frase, index) => (
          <div key={index} style={{ marginBottom: 16 }}>
            <strong>{frase.personajeId}</strong><br />
            {frase.fraseFinal}
          </div>
        ))}
      </div>

      <button
        onClick={handleRestart}
        style={{
          backgroundColor: '#00FFAA',
          border: 'none',
          padding: '12px 24px',
          fontSize: 16,
          cursor: 'pointer',
        }}
      >
        Volver a jugar
      </button>
    </div>
  )
}