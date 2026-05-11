import { useActiveStyle } from '../context/StyleContext'
import './StyleSelector.css'

export function StyleSelector() {
  const { activeStyle, allStyles, setActiveStyleId } = useActiveStyle()

  return (
    <div className="ss-bar">
      <div className="ss-bar__inner page-wrap">
        <span className="ss-label">Estilo</span>
        <div className="ss-buttons">
          {allStyles.map((style) => {
            const isActive = style.id === activeStyle.id
            const accent = style.accentColor ?? style.color

            return (
              <button
                key={style.id}
                onClick={() => setActiveStyleId(style.id)}
                className="ss-btn"
                style={{
                  border: `1.5px solid ${isActive ? accent : '#dde3f5'}`,
                  background: isActive ? `${accent}1a` : 'transparent',
                  color: isActive ? accent : '#8b95b8',
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
                <span className="ss-btn__icon">{style.icon}</span>
                {style.name}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
