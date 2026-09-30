import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'
import { ImageUploadField } from '../shared/ImageUploadField'
import { TimerInner, type CountdownTimerProps } from './CountdownTimer'
import { DriftInner, StickyRevealInner, type ParallaxSectionProps, type LayerOptions } from '../Layout/ParallaxSection'

// Countdown Timer rendered as the fixed content of a Parallax Section — the
// parallax layers (Background/Midground/overlay, Depth Drift or Sticky Reveal)
// come straight from ParallaxSection.tsx and the timer straight from
// CountdownTimer.tsx, so both keep a single implementation. The timer's own
// background image/colour/overlay are dropped (the parallax layers replace
// them) and the slim 'bar' style is excluded — it's a full-width hero block.
// Mirrored in nuxt-storefront's ParallaxCountdown.vue.
type TimerFields = Omit<CountdownTimerProps, 'backgroundColor' | 'backgroundImage' | 'overlayOpacity' | 'embedded' | 'cardStyle' | 'align' | 'headlineAlign' | 'showSeparators'> & {
  cardStyle: 'card' | 'minimal' | 'neon'
}

export type ParallaxCountdownProps = TimerFields & ParallaxSectionProps & {
  // Timer (digits) position. 'split' is a legacy value from before
  // headlinePosition existed (= headline left, timer right) — no longer
  // offered in the field, still rendered for blocks saved with it.
  countdownPosition: 'left' | 'center' | 'right' | 'split'
  // Headline/subheadline/button position, independent of the timer. When it
  // differs from the timer they share one row, each on its own side, leaving
  // the middle clear for a Midground image. Undefined (older blocks) =
  // follow the timer.
  headlinePosition?: 'left' | 'center' | 'right'
  showSeparators: boolean
  backgroundFit: 'cover' | 'contain'
  sectionBackgroundColor: string
}

const color = (label: string) => ({
  type: 'custom' as const,
  label,
  render: ({ value, onChange, field }: { value: unknown; onChange: unknown; field: { label?: string } }) => (
    <ColorField value={value as string} onChange={onChange as (v: string) => void} label={field.label} />
  ),
})

const image = (label: string) => ({
  type: 'custom' as const,
  label,
  render: ({ value, onChange }: { value: unknown; onChange: unknown }) => (
    <ImageUploadField value={value as string} onChange={onChange as (v: string) => void} />
  ),
})

const yesNo = (label: string) => ({ type: 'radio' as const, label, options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] })

export const ParallaxCountdown: ComponentConfig<ParallaxCountdownProps> = {
  label: 'Parallax Countdown',
  fields: {
    // ── Countdown ──
    headline:          { type: 'text',     label: 'Headline' },
    subheadline:       { type: 'textarea', label: 'Subheadline' },
    targetDate:        { type: 'text',     label: 'Target Date & Time (YYYY-MM-DDTHH:mm:ss)' },
    endMessage:        { type: 'text',     label: 'End Message (shown when timer hits zero)' },
    showDays:          yesNo('Show Days'),
    showHours:         yesNo('Show Hours'),
    showMinutes:       yesNo('Show Minutes'),
    showSeconds:       yesNo('Show Seconds'),
    cardStyle:         { type: 'select', label: 'Card Style', options: [{ label: 'Card (classic)', value: 'card' }, { label: 'Minimal (borderless)', value: 'minimal' }, { label: 'Neon (dark glow)', value: 'neon' }] },
    accentColor:       color('Accent / Glow Colour (hex)'),
    cardColor:         color('Card Background (hex)'),
    headingColor:      color('Heading Text Colour (hex) — headline & subheadline'),
    textColor:         color('Number Colour (hex) — the countdown digits'),
    labelColor:        color('Label Colour (hex)'),
    digitScale:        { type: 'number', label: 'Digit Box Size (% of default, e.g. 70 = smaller)' },
    digitsOffsetY:     { type: 'number', label: 'Digit Row Vertical Offset (px, + moves down / − moves up)' },
    primaryButtonText: { type: 'text',   label: 'CTA Button Text (optional)' },
    primaryButtonUrl:  { type: 'text',   label: 'CTA Button URL' },
    headlinePosition:  { type: 'radio', label: 'Headline Position (headline, subheadline & button)', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
    countdownPosition: { type: 'radio', label: 'Timer Position (the digits) — set different sides from the headline to put them in one row', options: [{ label: 'Left', value: 'left' }, { label: 'Centre', value: 'center' }, { label: 'Right', value: 'right' }] },
    showSeparators:    yesNo('Show ":" Between Digit Boxes'),
    // ── Parallax ──
    scrollMode: {
      type: 'radio',
      label: 'Scroll Behaviour',
      options: [
        { label: 'Depth Drift — subtle multi-layer movement', value: 'drift' },
        { label: 'Sticky Reveal — background pins in place while a foreground image scrolls past', value: 'sticky' },
      ],
    },
    stickyScrollLength: { type: 'number', label: 'Scroll Length in vh — Sticky Reveal mode only (try 200–300)' },
    backgroundImage:   image('Background Image'),
    backgroundFit:     { type: 'radio', label: 'Background Image Fit', options: [{ label: 'Cover — fill the section (may crop)', value: 'cover' }, { label: 'Contain — show whole image, e.g. a shaped banner PNG over the section colour', value: 'contain' }] },
    sectionBackgroundColor: color('Section Background Colour (hex) — shows around a "Contain" image, or when no image'),
    backgroundSpeed:   { type: 'number', label: 'Background Speed — Depth Drift mode only (0 = none, 100 = strongest)' },
    midgroundImage:    image('Midground Image (optional — decorative element or product shot; transparent PNG works best)'),
    midgroundSpeed:    { type: 'number', label: 'Midground Speed — Depth Drift mode only (0 = none, 100 = strongest)' },
    midgroundWidth:    { type: 'number', label: 'Midground Width (px — height scales automatically)' },
    midgroundPosition: { type: 'select', label: 'Midground Position — Depth Drift mode only (Sticky Reveal always centres it)', options: [{ label: 'Centre', value: 'center' }, { label: 'Top Left', value: 'top-left' }, { label: 'Top Centre', value: 'top-center' }, { label: 'Top Right', value: 'top-right' }, { label: 'Bottom Left', value: 'bottom-left' }, { label: 'Bottom Centre', value: 'bottom-center' }, { label: 'Bottom Right', value: 'bottom-right' }] },
    overlayColor:      color('Overlay Colour (hex)'),
    overlayOpacity:    { type: 'number', label: 'Overlay Opacity (0–100)' },
    minHeight:         { type: 'number', label: 'Min Height (px) — Depth Drift mode only' },
    contentAlign:      { type: 'select', label: 'Countdown Vertical Align', options: [{ label: 'Top', value: 'top' }, { label: 'Centre', value: 'center' }, { label: 'Bottom', value: 'bottom' }] },
    contentMaxWidth:   { type: 'number', label: 'Content Max Width (px)' },
    forceAnimation:    { type: 'radio', label: 'Force Scroll Effect — Depth Drift mode only (ignores visitors’ "reduce motion" setting)', options: [{ label: 'No (recommended — respect visitor preference)', value: false }, { label: 'Yes — always animate', value: true }] },
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
    cardColor:         '#ffffff',
    // Light text by default — the countdown sits on a darkened image here,
    // unlike the plain Countdown Timer's light-grey section default.
    headingColor:      '#ffffff',
    textColor:         '#1e293b',
    labelColor:        '#e2e8f0',
    digitScale:        100,
    digitsOffsetY:     0,
    primaryButtonText: 'Shop the Sale',
    primaryButtonUrl:  '/sale',
    headlinePosition:  'center',
    countdownPosition: 'center',
    showSeparators:    true,
    scrollMode:        'drift',
    stickyScrollLength: 200,
    backgroundImage:   '',
    backgroundFit:     'cover',
    sectionBackgroundColor: '',
    backgroundSpeed:   30,
    midgroundImage:    '',
    midgroundSpeed:    60,
    midgroundWidth:    300,
    midgroundPosition: 'center',
    overlayColor:      '#000000',
    overlayOpacity:    45,
    minHeight:         520,
    contentAlign:      'center',
    contentMaxWidth:   900,
    forceAnimation:    false,
  },
  render(props) {
    // Blocks saved before these options existed have no value for them —
    // fall back to the original look (centred, separators, cover).
    const position = props.countdownPosition || 'center'
    const headlinePos = props.headlinePosition ?? (position === 'split' ? 'left' : position)
    const timerPos = position === 'split' ? 'right' : position
    const layer: LayerOptions = {
      // Different sides → full-width row; same side → push the column there.
      contentHorizontalAlign: headlinePos === timerPos ? timerPos : 'split',
      backgroundFit: props.backgroundFit || 'cover',
      sectionBackgroundColor: props.sectionBackgroundColor,
    }
    const timer = <TimerInner {...props} backgroundColor="transparent" backgroundImage="" overlayOpacity={0} embedded align={timerPos} headlineAlign={headlinePos} showSeparators={props.showSeparators !== false} />
    return props.scrollMode === 'sticky'
      ? <StickyRevealInner {...props} {...layer}>{timer}</StickyRevealInner>
      : <DriftInner {...props} {...layer}>{timer}</DriftInner>
  },
}
