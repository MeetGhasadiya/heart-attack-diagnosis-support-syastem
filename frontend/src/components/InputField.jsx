import React, { useId, useState } from 'react'
import { motion } from 'framer-motion'
import { AlertCircle, ChevronDown } from 'lucide-react'

export default function InputField({
  label,
  value,
  onChange,
  error,
  helpText,
  type = 'text',
  as = 'input',
  options = [],
  placeholder = '',
  min,
  max,
  step,
  disabled = false,
  required = false,
  icon: Icon,
  rightSlot,
  onBlur,
  onFocus,
  ...rest
}) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const hasValue = value !== '' && value !== null && value !== undefined

  const handleFocus = (event) => {
    setFocused(true)
    onFocus?.(event)
  }

  const handleBlur = (event) => {
    setFocused(false)
    onBlur?.(event)
  }

  const commonProps = {
    id,
    value: value ?? '',
    disabled,
    required,
    onChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    className: `input-control ${error ? 'has-error' : ''}`,
    placeholder,
    ...rest,
  }

  return (
    <motion.div
      className={`field-shell ${focused ? 'is-focused' : ''} ${error ? 'has-error' : ''}`}
      initial={false}
      animate={{
        y: focused ? -2 : 0,
        scale: focused ? 1.01 : 1,
        boxShadow: focused ? '0 22px 50px rgba(37, 99, 235, 0.12)' : '0 10px 30px rgba(15, 23, 42, 0.04)',
      }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
    >
      <div className="field-header">
        <label htmlFor={id} className={`field-label ${hasValue || focused ? 'is-floating' : ''}`}>
          {label}
          {required && <span className="field-required">*</span>}
        </label>
        {helpText && <span className="field-help">{helpText}</span>}
      </div>

      <div className="field-control-wrap">
        {Icon && <Icon size={16} className="field-leading-icon" />}

        {as === 'select' ? (
          <select {...commonProps} className={`${commonProps.className} field-select`}>
            <option value="" disabled>
              Select an option
            </option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : as === 'textarea' ? (
          <textarea {...commonProps} className={`${commonProps.className} field-textarea`} rows={4} />
        ) : type === 'range' ? (
          <div className="field-range-wrap">
            <input
              {...commonProps}
              type="range"
              min={min}
              max={max}
              step={step}
              className="field-range"
            />
            <div className="field-range-value">{value === '' || value === undefined ? '—' : value}</div>
          </div>
        ) : (
          <input
            {...commonProps}
            type={type}
            min={min}
            max={max}
            step={step}
          />
        )}

        {type !== 'range' && !Icon && <ChevronDown size={16} className="field-trailing-icon field-trailing-hidden" />}
        {rightSlot && <div className="field-right-slot">{rightSlot}</div>}
      </div>

      {error ? (
        <motion.div className="field-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}>
          <AlertCircle size={14} />
          <span>{error}</span>
        </motion.div>
      ) : null}
    </motion.div>
  )
}
