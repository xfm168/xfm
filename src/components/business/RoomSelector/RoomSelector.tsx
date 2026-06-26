import { ReactNode } from 'react'
import './RoomSelector.css'

export interface RoomOption {
  id: string
  name: string
  icon: ReactNode
  description: string
}

export interface RoomSelectorProps {
  options: RoomOption[]
  value?: string
  onChange?: (id: string) => void
  className?: string
}

export default function RoomSelector({
  options,
  value,
  onChange,
  className = '',
}: RoomSelectorProps) {
  const classes = ['xbiz-room-selector', className].filter(Boolean).join(' ')

  return (
    <div className={classes}>
      {options.map((option) => {
        const isSelected = value === option.id
        return (
          <button
            key={option.id}
            type="button"
            className={`xbiz-room-card${isSelected ? ' selected' : ''}`}
            onClick={() => onChange?.(option.id)}
          >
            <div className="xbiz-room-card__icon">{option.icon}</div>
            <div className="xbiz-room-card__info">
              <span className="xbiz-room-card__name">{option.name}</span>
              <span className="xbiz-room-card__desc">{option.description}</span>
            </div>
            {isSelected && (
              <div className="xbiz-room-card__check">
                <svg viewBox="0 0 24 24" fill="none" width="16" height="16">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
