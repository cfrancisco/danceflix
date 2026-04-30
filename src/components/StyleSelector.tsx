import { useActiveStyle } from '../context/StyleContext'

const P = "'Poppins', sans-serif"

export function StyleSelector() {
  const { activeStyle, allStyles, setActiveStyleId } = useActiveStyle()

  return (
    <div style={{ background: '#eef2ff', borderBottom: '1px solid #dde3f5' }}>
      <div
        className="page-wrap"
        style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingTop: '10px', paddingBottom: '10px' }}
      >
        <span
          style={{
            fontFamily: P,
            fontSize: '9px',
            letterSpacing: '0.45em',
            color: '#8b95b8',
            fontWeight: 700,
            textTransform: 'uppercase',
            flexShrink: 0,
          }}
        >
          Estilo
        </span>

        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {allStyles.map((style) => {
            const isActive = style.id === activeStyle.id
            const accent = style.accentColor ?? style.color

            return (
              <button
                key={style.id}
                onClick={() => setActiveStyleId(style.id)}
                style={{
                  fontFamily: P,
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '5px 16px',
                  borderRadius: '50px',
                  border: `1.5px solid ${isActive ? accent : '#dde3f5'}`,
                  background: isActive ? `${accent}1a` : 'transparent',
                  color: isActive ? accent : '#8b95b8',
                  cursor: 'pointer',
                  transition: 'all 0.18s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = accent
                    e.currentTarget.style.color = accent
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = '#dde3f5'
                    e.currentTarget.style.color = '#8b95b8'
                  }
                }}
              >
                <span style={{ fontSize: '13px', lineHeight: 1 }}>{style.icon}</span>
                {style.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
