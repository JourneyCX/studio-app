import { useEffect, useRef } from 'react'
import type { ComponentConfig } from '@measured/puck'
import { ColorField } from '../shared/ColorField'

export type ParticleBackgroundProps = {
  particleCount: number
  particleColor: string
  particleSize: number
  speed: number
  connectLines: boolean
  lineColor: string
  connectDistance: number
  backgroundColor: string
  minHeight: number
  headline: string
  subheadline: string
  primaryButtonText: string
  primaryButtonUrl: string
  primaryButtonColor: string
  textColor: string
}

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number
}

function Canvas({ particleCount, particleColor, particleSize, speed, connectLines, lineColor, connectDistance, backgroundColor, minHeight }: Omit<ParticleBackgroundProps, 'headline' | 'subheadline' | 'primaryButtonText' | 'primaryButtonUrl' | 'primaryButtonColor' | 'textColor'>) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef   = useRef<number>(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()

    const count = Math.max(10, Math.min(particleCount, 250))
    const particles: Particle[] = Array.from({ length: count }, () => ({
      x:    Math.random() * canvas.width,
      y:    Math.random() * canvas.height,
      vx:   (Math.random() - 0.5) * speed,
      vy:   (Math.random() - 0.5) * speed,
      size: Math.random() * particleSize + 1,
    }))

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0 || p.x > canvas.width)  p.vx *= -1
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = particleColor
        ctx.globalAlpha = 0.8
        ctx.fill()
        ctx.globalAlpha = 1
      }

      if (connectLines) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx   = particles[i].x - particles[j].x
            const dy   = particles[i].y - particles[j].y
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist < connectDistance) {
              ctx.beginPath()
              ctx.moveTo(particles[i].x, particles[i].y)
              ctx.lineTo(particles[j].x, particles[j].y)
              ctx.strokeStyle = lineColor
              ctx.globalAlpha = (1 - dist / connectDistance) * 0.6
              ctx.lineWidth   = 1
              ctx.stroke()
              ctx.globalAlpha = 1
            }
          }
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animate()

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    return () => {
      cancelAnimationFrame(animRef.current)
      ro.disconnect()
    }
  }, [particleCount, particleColor, particleSize, speed, connectLines, lineColor, connectDistance])

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', minHeight }}
    />
  )
}

export const ParticleBackground: ComponentConfig<ParticleBackgroundProps> = {
  label: '3D / Particle Background',
  fields: {
    particleCount:    { type: 'number', label: 'Particle Count (10–250)' },
    particleColor:    { type: 'custom', label: 'Particle Colour (hex or rgba)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    particleSize:     { type: 'number', label: 'Max Particle Size (px)' },
    speed:            { type: 'number', label: 'Speed (0.2–3)' },
    connectLines:     { type: 'radio',  label: 'Connect Nearby Particles', options: [{ label: 'Yes', value: true }, { label: 'No', value: false }] },
    lineColor:        { type: 'custom', label: 'Connection Line Colour (hex or rgba)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    connectDistance:  { type: 'number', label: 'Connection Distance (px)' },
    backgroundColor:  { type: 'custom', label: 'Background Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    minHeight:        { type: 'number', label: 'Section Height (px)' },
    headline:         { type: 'text',   label: 'Headline (optional)' },
    subheadline:      { type: 'textarea', label: 'Subheadline (optional)' },
    primaryButtonText: { type: 'text',  label: 'Button Text (optional)' },
    primaryButtonUrl:  { type: 'text',  label: 'Button URL' },
    primaryButtonColor: { type: 'custom', label: 'Button Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
    textColor:        { type: 'custom', label: 'Text Colour (hex)', render: ({ value, onChange }) => <ColorField value={value as string} onChange={onChange as (v: string) => void} /> },
  },
  defaultProps: {
    particleCount:    80,
    particleColor:    'rgba(99,179,237,0.9)',
    particleSize:     3,
    speed:            0.6,
    connectLines:     true,
    lineColor:        'rgba(99,179,237,0.3)',
    connectDistance:  130,
    backgroundColor:  '#0f172a',
    minHeight:        520,
    headline:         'Innovation in Motion',
    subheadline:      'Bringing your brand to life with cutting-edge experiences.',
    primaryButtonText: 'Explore',
    primaryButtonUrl:  '/shop',
    primaryButtonColor: '#3b82f6',
    textColor:        '#ffffff',
  },
  render({ particleCount, particleColor, particleSize, speed, connectLines, lineColor, connectDistance, backgroundColor, minHeight, headline, subheadline, primaryButtonText, primaryButtonUrl, primaryButtonColor, textColor }) {
    return (
      <div style={{ position: 'relative', minHeight, backgroundColor, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Canvas
          particleCount={particleCount}
          particleColor={particleColor}
          particleSize={particleSize}
          speed={speed}
          connectLines={connectLines}
          lineColor={lineColor}
          connectDistance={connectDistance}
          backgroundColor={backgroundColor}
          minHeight={minHeight}
        />
        {(headline || subheadline || primaryButtonText) && (
          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '64px 32px', maxWidth: 680 }}>
            {/* sb-text-fluid-lg (styles/responsive.css) scales this down on
                narrow screens instead of staying fixed at 48px. */}
            {headline && (
              <h2 className="sb-text-fluid-lg" style={{ color: textColor, fontWeight: 800, margin: '0 0 20px', lineHeight: 1.15 }}>{headline}</h2>
            )}
            {subheadline && (
              <p style={{ color: textColor, opacity: 0.75, fontSize: 19, margin: '0 0 36px', lineHeight: 1.65 }}>{subheadline}</p>
            )}
            {primaryButtonText && (
              <a href={primaryButtonUrl} style={{ display: 'inline-block', backgroundColor: primaryButtonColor, color: '#fff', padding: '14px 36px', borderRadius: 8, textDecoration: 'none', fontWeight: 700, fontSize: 16 }}>
                {primaryButtonText}
              </a>
            )}
          </div>
        )}
      </div>
    )
  },
}
