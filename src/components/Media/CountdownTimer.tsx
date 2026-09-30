import { useState, useEffect, useRef, Fragment, type CSSProperties } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { ImageUploadField } from '../shared/ImageUploadField'

export type CountdownTimerProps = {
  targetDate: string
  headline: string
  subheadline: string
  endMessage: string
  showDays: boolean
  showHours: boolean
  showMinutes: boolean
  showSeconds: boolean
  cardStyle: 'card' | 'minimal' | 'neon' | 'bar'
  accentColor: string
  backgroundColor: string
  backgroundImage: string
  overlayOpacity: number
  cardColor: string
  headingColor: string
  textColor: string
  labelColor: string
  digitScale: number
  digitsOffsetY: number
  primaryButtonText: string
  primaryButtonUrl: string
  // Internal only (not a Puck field): set by ParallaxCountdown, which supplies
  // its own section padding/background, so the timer drops its 72px padding.
  embedded?: boolean
  // Internal only: ParallaxCountdown's Timer Position — aligns the digits
  // (and, unless headlineAlign says otherwise, the headline/button too)
  // left/right instead of centring them. 'split' is the legacy value from
  // before headlineAlign existed = headline left, digits right.
  align?: 'left' | 'center' | 'right' | 'split'
  // Internal only: ParallaxCountdown's Headline Position (headline,
  // subheadline and button). Undefined = follow the digits.
  headlineAlign?: 'left' | 'center' | 'right'
  // Internal only (ParallaxCountdown): hide the ":" between digit boxes.
  // Undefined = shown, so the plain Countdown Timer is unchanged.
  showSeparators?: boolean
}

interface TimeLeft { days: number; hours: number; minutes: number; seconds: number }

function getTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now()
  if (isNaN(diff) || diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  }
}

function pad(n: number) { return String(n).padStart(2, '0') }

interface UnitProps { value: number; label: string; cardStyle: 'card' | 'minimal' | 'neon'; accentColor: string; cardColor: string; textColor: string; labelColor: string; scale: number }

function TimeUnit({ value, label, cardStyle, accentColor, cardColor, textColor, labelColor, scale }: UnitProps) {
  const prevRef = useRef(value)
  const [flip, setFlip] = useState(false)

  useEffect(() => {
    if (prevRef.current !== value) {
      prevRef.current = value
      setFlip(true)
      const t = setTimeout(() => setFlip(false), 400)
      return () => clearTimeout(t)
    }
  }, [value])

  const numStr = pad(value)
  const px = (base: number) => Math.round(base * scale)

  const cardStyles: React.CSSProperties = {
    card: {
      backgroundColor: cardColor,
      borderRadius: 12,
      padding: `${px(20)}px ${px(28)}px`,
      minWidth: px(90),
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      border: `2px solid ${accentColor}22`,
    },
    minimal: {
      padding: `${px(10)}px ${px(20)}px`,
      minWidth: px(80),
    },
    neon: {
      backgroundColor: '#000',
      borderRadius: 10,
      padding: `${px(18)}px ${px(24)}px`,
      minWidth: px(90),
      boxShadow: `0 0 20px ${accentColor}55, 0 0 40px ${accentColor}22, inset 0 0 20px rgba(0,0,0,0.5)`,
      border: `1px solid ${accentColor}66`,
    },
  }[cardStyle]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: px(8) }}>
      <div style={cardStyles}>
        <div
          key={`${numStr}-${flip}`}
          style={{
            fontSize: px(52),
            fontWeight: 800,
            lineHeight: 1,
            color: cardStyle === 'neon' ? accentColor : textColor,
            fontVariantNumeric: 'tabular-nums',
            animation: flip ? 'cd-flip 0.35s ease' : 'none',
            textShadow: cardStyle === 'neon' ? `0 0 12px ${accentColor}` : 'none',
            letterSpacing: '-2px',
          }}
        >
          {numStr}
        </div>
      </div>
      <span style={{ fontSize: px(12), fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: labelColor }}>
        {label}
      </span>
    </div>
  )
}

function Separator({ textColor, scale }: { textColor: string; scale: number }) {
  const px = (base: number) => Math.round(base * scale)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: px(12), paddingBottom: px(28), color: textColor, opacity: 0.5, fontSize: px(32), fontWeight: 800 }}>
      <span>:</span>
    </div>
  )
}

// Abbreviated labels for the slim bar style — a stacked "MINUTES" label
// reads fine under a 52px card digit, but wastes width sitting inline
// next to a 14px number, so the bar uses shorter forms.
const BAR_LABELS: Record<keyof TimeLeft, string> = { days: 'Days', hours: 'Hours', minutes: 'Mins', seconds: 'Sec' }

interface BarTimerProps extends CountdownTimerProps { time: TimeLeft; done: boolean }

// Slim, single-row announcement-bar layout — deliberately not built on
// TimeUnit/Separator (those are sized for the 52px stacked-card styles),
// so it stays narrow enough to sit inside a Columns dropzone instead of a
// full-width hero section.
function BarTimer({ headline, endMessage, showDays, showHours, showMinutes, showSeconds, accentColor, backgroundColor, headingColor, textColor, primaryButtonUrl, time, done }: BarTimerProps) {
  const units: { key: keyof TimeLeft; show: boolean }[] = [
    { key: 'days',    show: showDays },
    { key: 'hours',   show: showHours },
    { key: 'minutes', show: showMinutes },
    { key: 'seconds', show: showSeconds },
  ]
  const visibleUnits = units.filter((u) => u.show)

  const bar = (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, backgroundColor, padding: '14px 24px' }}>
      {headline && <span style={{ fontSize: 15, fontWeight: 600, color: headingColor }}>{headline}</span>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: textColor }}>
        {done && endMessage ? (
          <span style={{ fontSize: 14, fontWeight: 700, color: accentColor }}>{endMessage}</span>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, fontVariantNumeric: 'tabular-nums', flexWrap: 'wrap' }}>
            {visibleUnits.map((u, i) => (
              <span key={u.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {i > 0 && <span style={{ opacity: 0.4 }}>:</span>}
                {pad(time[u.key])} {BAR_LABELS[u.key]}
              </span>
            ))}
          </div>
        )}
        {primaryButtonUrl && <span style={{ fontSize: 18, lineHeight: 1 }} aria-hidden="true">&rsaquo;</span>}
      </div>
    </div>
  )

  return primaryButtonUrl ? <a href={primaryButtonUrl} style={{ textDecoration: 'none', display: 'block' }}>{bar}</a> : bar
}

type HAlign = 'left' | 'center' | 'right'
const H_COLUMN: Record<HAlign, number> = { left: 1, center: 2, right: 3 }
const H_SELF: Record<HAlign, 'flex-start' | 'center' | 'flex-end'> = { left: 'flex-start', center: 'center', right: 'flex-end' }

export function TimerInner(props: CountdownTimerProps) {
  const { targetDate, headline, subheadline, endMessage, showDays, showHours, showMinutes, showSeconds, cardStyle, accentColor, backgroundColor, backgroundImage, overlayOpacity, cardColor, headingColor, textColor, labelColor, digitScale, digitsOffsetY, primaryButtonText, primaryButtonUrl, embedded, align = 'center', headlineAlign, showSeparators = true } = props
  const scale = (digitScale || 100) / 100

  const [time, setTime] = useState<TimeLeft>(() => getTimeLeft(targetDate))
  const done = time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0

  useEffect(() => {
    setTime(getTimeLeft(targetDate))
    const id = setInterval(() => setTime(getTimeLeft(targetDate)), 1000)
    return () => clearInterval(id)
  }, [targetDate])

  if (cardStyle === 'bar') {
    return <BarTimer {...props} time={time} done={done} />
  }

  const units: { key: keyof TimeLeft; label: string; show: boolean }[] = [
    { key: 'days',    label: 'Days',    show: showDays },
    { key: 'hours',   label: 'Hours',   show: showHours },
    { key: 'minutes', label: 'Minutes', show: showMinutes },
    { key: 'seconds', label: 'Seconds', show: showSeconds },
  ]
  const visibleUnits = units.filter((u) => u.show)
  const hasImage = !!backgroundImage
  const digitsPos: HAlign = align === 'split' ? 'right' : align
  const textPos: HAlign = headlineAlign ?? (align === 'split' ? 'left' : align)

  // sb-text-fluid-md (styles/responsive.css) scales the headline down on
  // narrow screens instead of staying fixed at 36px — the countdown
  // digits/separator stay fixed, they're short and narrow regardless of
  // viewport width.
  const textBlock = (subMarginBottom: number) => (
    <>
      {headline && <h2 className="sb-text-fluid-md" style={{ color: headingColor, fontWeight: 800, margin: '0 0 14px' }}>{headline}</h2>}
      {subheadline && <p style={{ color: headingColor, opacity: 0.65, fontSize: 18, margin: `0 0 ${subMarginBottom}px`, lineHeight: 1.65 }}>{subheadline}</p>}
    </>
  )

  const digitsBlock = (justify: CSSProperties['justifyContent']) => done && endMessage ? (
    <div style={{ padding: '32px 48px', backgroundColor: accentColor, borderRadius: 16, display: 'inline-block' }}>
      <p style={{ color: '#fff', fontSize: 26, fontWeight: 800, margin: 0 }}>{endMessage}</p>
    </div>
  ) : (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: justify, gap: Math.round(12 * scale), flexWrap: 'wrap', perspective: 600 }}>
      {visibleUnits.map((u, i) => (
        <Fragment key={u.key}>
          <TimeUnit value={time[u.key]} label={u.label} cardStyle={cardStyle} accentColor={accentColor} cardColor={cardColor} textColor={textColor} labelColor={labelColor} scale={scale} />
          {showSeparators && i < visibleUnits.length - 1 && <Separator textColor={textColor} scale={scale} />}
        </Fragment>
      ))}
    </div>
  )

  const buttonBlock = (marginTop: number) => primaryButtonText ? (
    <div style={{ marginTop }}>
      <a href={primaryButtonUrl} style={{ display: 'inline-block', backgroundColor: accentColor, color: '#fff', padding: '14px 40px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
        {primaryButtonText}
      </a>
    </div>
  ) : null

  return (
    <section
      style={{
        position: 'relative',
        backgroundColor: hasImage ? undefined : backgroundColor,
        backgroundImage: hasImage ? `url(${backgroundImage})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: embedded ? 0 : '72px 24px',
        textAlign: textPos,
      }}
    >
      <style>{`
        @keyframes cd-flip {
          0%   { transform: rotateX(-90deg) scale(0.8); opacity: 0; }
          60%  { transform: rotateX(10deg);  opacity: 1; }
          100% { transform: rotateX(0deg) scale(1);  opacity: 1; }
        }
        @media (max-width: 767px) {
          .cd-row { grid-template-columns: 1fr !important; }
          .cd-row > * { grid-column: 1 !important; grid-row: auto !important; }
        }
      `}</style>

      {hasImage && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0,0,0,${overlayOpacity / 100})` }} />
      )}

      {textPos !== digitsPos ? (
        // Headline and digits on different sides: one row, three columns
        // (left / centre / right) so each sits in its own column and the
        // unused middle stays clear for a midground image. Stacks on narrow
        // screens (.cd-row media query above), each keeping its alignment.
        <div className="cd-row" style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto minmax(0,1fr)', alignItems: 'center', gap: '24px 32px' }}>
          <div style={{ gridColumn: H_COLUMN[textPos], gridRow: 1, justifySelf: H_SELF[textPos], textAlign: textPos, maxWidth: 520 }}>
            {textBlock(0)}
            {buttonBlock(24)}
          </div>
          <div style={{ gridColumn: H_COLUMN[digitsPos], gridRow: 1, justifySelf: H_SELF[digitsPos], marginTop: digitsOffsetY || 0 }}>
            {digitsBlock(H_SELF[digitsPos])}
          </div>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 800, margin: digitsPos === 'left' ? '0 auto 0 0' : digitsPos === 'right' ? '0 0 0 auto' : '0 auto' }}>
          {textBlock(48)}
          <div style={{ marginTop: digitsOffsetY || 0 }}>
            {digitsBlock(H_SELF[digitsPos])}
          </div>
          {buttonBlock(48)}
        </div>
      )}
    </section>
  )
}

export const CountdownTimer: ComponentConfig<CountdownTimerProps> = {
  label: 'Countdown Timer',
  fields: {
    headline:          { type: 'text',    label: 'Headline' },
    subheadline:       { type: 'textarea', label: 'Subheadline' },
    targetDate:        { type: 'text',    label: 'Target Date & Time (YYYY-MM-DDTHH:mm:ss)' },
    endMessage:        { type: 'text',    label: 'End Message (shown when timer hits zero)' },
    showDays:          { type: 'radio',   label: 'Show Days',    options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showHours:         { type: 'radio',   label: 'Show Hours',   options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showMinutes:       { type: 'radio',   label: 'Show Minutes', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    showSeconds:       { type: 'radio',   label: 'Show Seconds', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    cardStyle:         { type: 'select',  label: 'Card Style', options: [{ label: 'Card (classic)', value: 'card' }, { label: 'Minimal (borderless)', value: 'minimal' }, { label: 'Neon (dark glow)', value: 'neon' }, { label: 'Bar (slim announcement — fits columns)', value: 'bar' }] },
    accentColor:       { type: 'custom',  label: 'Accent / Glow Colour (hex)', render: ({ value, onChange, field }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} label={field.label} /> },
    backgroundColor:   { type: 'custom', label: 'Section Background (hex)', render: ({ value, onChange, field }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} label={field.label} /> },
    backgroundImage:   { type: 'custom', label: 'Background Image (optional, overrides colour)', render: ({ value, onChange }) => <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} /> },
    overlayOpacity:    { type: 'number', label: 'Dark Overlay (0–100, used with image)' },
    cardColor:         { type: 'custom',  label: 'Card Background (hex)', render: ({ value, onChange, field }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} label={field.label} /> },
    headingColor:      { type: 'custom',  label: 'Heading Text Colour (hex) — headline & subheadline', render: ({ value, onChange, field }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} label={field.label} /> },
    textColor:         { type: 'custom',  label: 'Number Colour (hex) — the countdown digits', render: ({ value, onChange, field }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} label={field.label} /> },
    labelColor:        { type: 'custom',  label: 'Label Colour (hex)', render: ({ value, onChange, field }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} label={field.label} /> },
    digitScale:        { type: 'number',  label: 'Digit Box Size (% of default, e.g. 70 = smaller)' },
    digitsOffsetY:     { type: 'number',  label: 'Digit Row Vertical Offset (px, + moves down / − moves up)' },
    primaryButtonText: { type: 'text',    label: 'CTA Button Text (optional)' },
    primaryButtonUrl:  { type: 'text',    label: 'CTA Button URL' },
  },
  defaultProps: {
    headline:          'Sale Ends In',
    subheadline:       'Don\'t miss out — our biggest promotion of the year.',
    targetDate:        new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19),
    endMessage:        '🎉 The sale has ended!',
    showDays:          true,
    showHours:         true,
    showMinutes:       true,
    showSeconds:       true,
    cardStyle:         'card',
    accentColor:       '#2563eb',
    backgroundColor:   '#f8fafc',
    backgroundImage:   '',
    overlayOpacity:    55,
    cardColor:         '#ffffff',
    headingColor:      '#1e293b',
    textColor:         '#1e293b',
    labelColor:        '#64748b',
    digitScale:        100,
    digitsOffsetY:     0,
    primaryButtonText: 'Shop the Sale',
    primaryButtonUrl:  '/sale',
  },
  render(props) {
    return <TimerInner {...props} />
  },
}
