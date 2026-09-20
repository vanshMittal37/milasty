import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  className = '',
  style = {},
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find((opt) => String(opt.value) === String(value)) || null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue) => {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`custom-select-wrap ${className}`}
      style={{ position: 'relative', width: '100%', ...style }}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        className="custom-select-trigger"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justify: 'space-between',
          padding: '0.6rem 0.85rem',
          backgroundColor: '#141A17',
          border: isOpen ? '1.5px solid #8FAF5B' : '1px solid #2C3730',
          borderRadius: '10px',
          color: selectedOption ? '#F4F5F0' : '#929B94',
          fontSize: '0.85rem',
          fontWeight: '700',
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 0 2px rgba(143, 175, 91, 0.25)' : 'none',
          opacity: disabled ? 0.6 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={16}
          color="#8FAF5B"
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '0.5rem',
          }}
        />
      </button>

      {isOpen && (
        <div
          className="custom-select-menu"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 9999,
            maxHeight: '220px',
            overflowY: 'auto',
            backgroundColor: '#141A17',
            border: '1.5px solid #2C3730',
            borderRadius: '12px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.65)',
            padding: '0.35rem',
          }}
        >
          {options.length > 0 ? (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className={`custom-select-option ${isSelected ? 'selected' : ''}`}
                  style={{
                    padding: '0.55rem 0.75rem',
                    borderRadius: '8px',
                    color: isSelected ? '#8FAF5B' : '#C1C7C1',
                    backgroundColor: isSelected ? 'rgba(143, 175, 91, 0.15)' : 'transparent',
                    fontSize: '0.82rem',
                    fontWeight: isSelected ? '800' : '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justify: 'space-between',
                    transition: 'all 0.15s ease',
                    marginBottom: '0.15rem',
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = '#1E2723';
                      e.currentTarget.style.color = '#F4F5F0';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#C1C7C1';
                    }
                  }}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} color="#8FAF5B" />}
                </div>
              );
            })
          ) : (
            <div style={{ padding: '0.75rem', fontSize: '0.78rem', color: '#929B94', textAlign: 'center' }}>
              No options available
            </div>
          )}
        </div>
      )}
    </div>
  );
}
