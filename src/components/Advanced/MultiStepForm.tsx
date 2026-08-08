import { useState } from 'react'
import type { ComponentConfig } from '@measured/puck'

type StepMeta  = { title: string; description: string; icon: string }
type FieldType = 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox'
type FormField = { step: number; type: FieldType; label: string; placeholder: string; required: boolean; options: string }

export type MultiStepFormProps = {
  headline: string
  subheadline: string
  submitEndpoint: string
  submitButtonText: string
  successMessage: string
  showProgress: 'bar' | 'steps' | 'both' | 'none'
  accentColor: string
  backgroundColor: string
  cardColor: string
  textColor: string
  borderColor: string
  borderRadius: number
  steps: StepMeta[]
  fields: FormField[]
}

type Status = 'idle' | 'loading' | 'success' | 'error'

function ProgressBar({ current, total, color }: { current: number; total: number; color: string }) {
  return (
    <div style={{ height: 4, backgroundColor: color + '20', borderRadius: 2, overflow: 'hidden', marginBottom: 32 }}>
      <div style={{ height: '100%', width: `${((current + 1) / total) * 100}%`, backgroundColor: color, borderRadius: 2, transition: 'width 0.4s ease' }} />
    </div>
  )
}

function StepDots({ steps, current, color, textColor }: { steps: StepMeta[]; current: number; color: string; textColor: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, marginBottom: 32, flexWrap: 'wrap' }}>
      {steps.map((s, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 36, height: 36, borderRadius: '50%',
              backgroundColor: i <= current ? color : color + '20',
              color: i <= current ? '#fff' : color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: i < current ? 16 : 14,
              fontWeight: 700,
              transition: 'all 0.3s',
              border: i === current ? `3px solid ${color}` : 'none',
              boxShadow: i === current ? `0 0 0 3px ${color}25` : 'none',
            }}>
              {i < current ? '✓' : s.icon || i + 1}
            </div>
            <span style={{ fontSize: 11, color: i === current ? color : textColor, opacity: i === current ? 1 : 0.5, fontWeight: i === current ? 700 : 400, whiteSpace: 'nowrap' }}>{s.title}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 40, height: 2, backgroundColor: i < current ? color : color + '20', margin: '0 4px 22px', transition: 'background-color 0.3s' }} />
          )}
        </div>
      ))}
    </div>
  )
}

function FieldInput({ field, value, onChange, error }: { field: FormField; value: string; onChange: (v: string) => void; error: boolean }) {
  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: `1.5px solid ${error ? '#ef4444' : '#e2e8f0'}`,
    borderRadius: 8,
    fontSize: 15,
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    color: '#1e293b',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  }

  const opts = field.options ? field.options.split(',').map(o => o.trim()).filter(Boolean) : []

  if (field.type === 'textarea') {
    return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={field.placeholder} rows={4} style={{ ...inputBase, resize: 'vertical' }} />
  }
  if (field.type === 'select') {
    return (
      <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputBase, cursor: 'pointer', appearance: 'auto' }}>
        <option value="">— Select —</option>
        {opts.map((o, i) => <option key={i} value={o}>{o}</option>)}
      </select>
    )
  }
  if (field.type === 'radio') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {opts.map((o, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 15, color: '#1e293b' }}>
            <input type="radio" checked={value === o} onChange={() => onChange(o)} style={{ accentColor: '#2563eb', width: 17, height: 17 }} />
            {o}
          </label>
        ))}
      </div>
    )
  }
  if (field.type === 'checkbox') {
    return (
      <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
        <input type="checkbox" checked={value === 'true'} onChange={e => onChange(e.target.checked ? 'true' : '')} style={{ width: 17, height: 17, marginTop: 2, accentColor: '#2563eb' }} />
        <span style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.5 }}>{field.placeholder || field.label}</span>
      </label>
    )
  }
  return (
    <input
      type={field.type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={field.placeholder}
      style={inputBase}
    />
  )
}

function FormInner(props: MultiStepFormProps) {
  const { headline, subheadline, submitEndpoint, submitButtonText, successMessage, showProgress, accentColor, backgroundColor, cardColor, textColor, borderColor, borderRadius, steps, fields } = props

  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData]       = useState<Record<string, string>>({})
  const [errors, setErrors]           = useState<Record<string, boolean>>({})
  const [status, setStatus]           = useState<Status>('idle')
  const [errMsg, setErrMsg]           = useState('')

  const totalSteps   = steps.length
  const stepFields   = fields.filter(f => f.step === currentStep + 1)
  const isLastStep   = currentStep === totalSteps - 1

  const validate = () => {
    const newErrors: Record<string, boolean> = {}
    let valid = true
    stepFields.forEach(f => {
      if (f.required && !formData[f.label]?.trim()) {
        newErrors[f.label] = true
        valid = false
      }
    })
    setErrors(newErrors)
    return valid
  }

  const next = () => { if (validate()) setCurrentStep(s => Math.min(s + 1, totalSteps - 1)) }
  const prev = () => { setCurrentStep(s => Math.max(s - 1, 0)); setErrors({}) }

  const submit = async () => {
    if (!validate()) return
    setStatus('loading')
    if (!submitEndpoint) { setTimeout(() => setStatus('success'), 900); return }
    try {
      const res = await fetch(submitEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) })
      setStatus(res.ok ? 'success' : 'error')
      if (!res.ok) setErrMsg(`Server returned ${res.status}`)
    } catch (e: unknown) {
      setStatus('error')
      setErrMsg(e instanceof Error ? e.message : 'Network error')
    }
  }

  if (status === 'success') {
    return (
      <section style={{ backgroundColor, padding: '64px 24px' }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center', backgroundColor: cardColor, borderRadius, padding: '56px 48px', boxShadow: '0 8px 40px rgba(0,0,0,0.09)', border: `1px solid ${borderColor}` }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: '#10b981' + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
          </div>
          <h3 style={{ color: textColor, fontSize: 24, fontWeight: 800, margin: '0 0 12px' }}>{successMessage}</h3>
          <button onClick={() => { setStatus('idle'); setCurrentStep(0); setFormData({}) }} style={{ marginTop: 20, backgroundColor: accentColor, color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
            Start Over
          </button>
        </div>
      </section>
    )
  }

  return (
    <section style={{ backgroundColor, padding: '64px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        {(headline || subheadline) && (
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            {headline    && <h2 style={{ color: textColor, fontSize: 30, fontWeight: 800, margin: '0 0 10px' }}>{headline}</h2>}
            {subheadline && <p  style={{ color: textColor, opacity: 0.65, fontSize: 16, margin: 0, lineHeight: 1.65 }}>{subheadline}</p>}
          </div>
        )}

        <div style={{ backgroundColor: cardColor, borderRadius, padding: '40px 44px', boxShadow: '0 8px 40px rgba(0,0,0,0.09)', border: `1px solid ${borderColor}` }}>
          {(showProgress === 'bar' || showProgress === 'both') && <ProgressBar current={currentStep} total={totalSteps} color={accentColor} />}
          {(showProgress === 'steps' || showProgress === 'both') && totalSteps > 1 && <StepDots steps={steps} current={currentStep} color={accentColor} textColor={textColor} />}

          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              {steps[currentStep]?.icon && <span style={{ fontSize: 24 }}>{steps[currentStep].icon}</span>}
              <h3 style={{ color: textColor, fontSize: 20, fontWeight: 800, margin: 0 }}>{steps[currentStep]?.title}</h3>
            </div>
            {steps[currentStep]?.description && <p style={{ color: textColor, opacity: 0.6, fontSize: 14, margin: 0, lineHeight: 1.6 }}>{steps[currentStep].description}</p>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {stepFields.length > 0 ? stepFields.map((field, i) => (
              <div key={i}>
                {field.type !== 'checkbox' && (
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textColor, marginBottom: 6, opacity: 0.8 }}>
                    {field.label}{field.required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
                  </label>
                )}
                <FieldInput field={field} value={formData[field.label] || ''} onChange={v => setFormData(prev => ({ ...prev, [field.label]: v }))} error={!!errors[field.label]} />
                {errors[field.label] && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>This field is required.</p>}
              </div>
            )) : (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: accentColor + '08', borderRadius: 8, border: `1px dashed ${accentColor}40` }}>
                <p style={{ color: textColor, opacity: 0.5, fontSize: 14, margin: 0 }}>No fields assigned to Step {currentStep + 1} yet. Add fields with Step = {currentStep + 1} in the panel.</p>
              </div>
            )}
          </div>

          {status === 'error' && <p style={{ color: '#ef4444', fontSize: 13, marginTop: 14 }}>⚠ {errMsg || 'Something went wrong. Please try again.'}</p>}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
            <button
              onClick={prev}
              disabled={currentStep === 0}
              style={{ backgroundColor: 'transparent', color: textColor, border: `1.5px solid ${borderColor}`, padding: '11px 24px', borderRadius: 8, cursor: currentStep === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 14, opacity: currentStep === 0 ? 0.35 : 1 }}
            >
              ← Back
            </button>
            <span style={{ color: textColor, opacity: 0.4, fontSize: 13 }}>Step {currentStep + 1} of {totalSteps}</span>
            {isLastStep ? (
              <button
                onClick={submit}
                disabled={status === 'loading'}
                style={{ backgroundColor: accentColor, color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14, opacity: status === 'loading' ? 0.6 : 1 }}
              >
                {status === 'loading' ? 'Submitting…' : submitButtonText}
              </button>
            ) : (
              <button onClick={next} style={{ backgroundColor: accentColor, color: '#fff', border: 'none', padding: '11px 28px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: 14 }}>
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

export const MultiStepForm: ComponentConfig<MultiStepFormProps> = {
  label: 'Multi-Step Form',
  fields: {
    headline:         { type: 'text',     label: 'Headline' },
    subheadline:      { type: 'textarea', label: 'Subheadline' },
    submitEndpoint:   { type: 'text',     label: 'Submit Endpoint URL (POST, blank = preview)' },
    submitButtonText: { type: 'text',     label: 'Final Submit Button Text' },
    successMessage:   { type: 'text',     label: 'Success Message' },
    showProgress:     { type: 'select',   label: 'Progress Indicator', options: [{ label: 'Progress bar + step dots', value: 'both' }, { label: 'Step dots only', value: 'steps' }, { label: 'Progress bar only', value: 'bar' }, { label: 'None', value: 'none' }] },
    accentColor:      { type: 'text',     label: 'Accent Colour (hex)' },
    backgroundColor:  { type: 'text',    label: 'Section Background (hex)' },
    cardColor:        { type: 'text',     label: 'Card Background (hex)' },
    textColor:        { type: 'text',     label: 'Text Colour (hex)' },
    borderColor:      { type: 'text',     label: 'Border Colour (hex)' },
    borderRadius:     { type: 'number',   label: 'Card Border Radius (px)' },
    steps: {
      type: 'array', label: 'Steps',
      arrayFields: {
        title:       { type: 'text', label: 'Step Title' },
        description: { type: 'text', label: 'Step Description (optional)' },
        icon:        { type: 'text', label: 'Step Icon (emoji)' },
      },
      defaultItemProps: { title: 'New Step', description: '', icon: '📋' },
      getItemSummary: (s: StepMeta) => s.title || 'Step',
    },
    fields: {
      type: 'array', label: 'Form Fields',
      arrayFields: {
        step:        { type: 'number', label: 'Step Number (1-based — which step this field appears on)' },
        type:        { type: 'select', label: 'Field Type', options: [{ label: 'Text', value: 'text' }, { label: 'Email', value: 'email' }, { label: 'Phone', value: 'tel' }, { label: 'Number', value: 'number' }, { label: 'Textarea', value: 'textarea' }, { label: 'Dropdown', value: 'select' }, { label: 'Radio buttons', value: 'radio' }, { label: 'Checkbox', value: 'checkbox' }] },
        label:       { type: 'text', label: 'Field Label (also used as form key)' },
        placeholder: { type: 'text', label: 'Placeholder / Helper Text' },
        required:    { type: 'radio', label: 'Required?', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
        options:     { type: 'text', label: 'Options (comma-separated, for Select / Radio)' },
      },
      defaultItemProps: { step: 1, type: 'text', label: 'Field Label', placeholder: '', required: false, options: '' },
      getItemSummary: (f: FormField) => `Step ${f.step}: ${f.label} (${f.type})`,
    },
  },
  defaultProps: {
    headline:         'Get Your Custom Quote',
    subheadline:      'Tell us about your requirements and we\'ll have a tailored quote ready within 24 hours.',
    submitEndpoint:   '',
    submitButtonText: 'Submit Request',
    successMessage:   'Request received! We\'ll be in touch within 24 hours.',
    showProgress:     'both',
    accentColor:      '#2563eb',
    backgroundColor:  '#f8fafc',
    cardColor:        '#ffffff',
    textColor:        '#1e293b',
    borderColor:      '#e2e8f0',
    borderRadius:     16,
    steps: [
      { title: 'Your Details',   description: 'Tell us who you are.',               icon: '👤' },
      { title: 'Requirements',   description: 'What are you looking for?',          icon: '📦' },
      { title: 'Budget & Timeline', description: 'Help us scope your project.',     icon: '💰' },
      { title: 'Confirm',        description: 'Review and submit your request.',    icon: '✅' },
    ],
    fields: [
      { step: 1, type: 'text',     label: 'Full Name',     placeholder: 'Jane Smith',         required: true,  options: '' },
      { step: 1, type: 'email',    label: 'Email Address', placeholder: 'jane@company.com',   required: true,  options: '' },
      { step: 1, type: 'tel',      label: 'Phone Number',  placeholder: '+27 00 000 0000',    required: false, options: '' },
      { step: 1, type: 'text',     label: 'Company Name',  placeholder: 'Your company',       required: false, options: '' },
      { step: 2, type: 'select',   label: 'Product Category', placeholder: '',               required: true,  options: 'Clothing, Homeware, Electronics, Beauty, Food & Beverage, Other' },
      { step: 2, type: 'number',   label: 'Quantity Needed', placeholder: 'e.g. 100',        required: true,  options: '' },
      { step: 2, type: 'textarea', label: 'Project Description', placeholder: 'Tell us more about what you need…', required: true, options: '' },
      { step: 3, type: 'radio',    label: 'Budget Range',  placeholder: '',                   required: true,  options: 'Under R5 000, R5 000 – R20 000, R20 000 – R100 000, R100 000+' },
      { step: 3, type: 'select',   label: 'Delivery Timeline', placeholder: '',              required: false, options: 'ASAP, 2–4 weeks, 1–3 months, Flexible' },
      { step: 4, type: 'checkbox', label: 'Terms Agreement', placeholder: 'I agree to the terms and conditions', required: true, options: '' },
    ],
  },
  render(props) { return <FormInner {...props} /> },
}
