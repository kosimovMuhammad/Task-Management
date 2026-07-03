import { useEffect, useRef } from 'react'
import { useAppSelector } from '@/hooks/useAppSelector'

interface Particle {
  x: number
  y: number
  angle: number
  radius: number
  speed: number
  color: string
  size: number
  opacity: number
}

export function InteractiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const theme = useAppSelector((state) => state.ui.theme)
  
  const mouse = useRef({ x: 0, y: 0 })
  const targetMouse = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number
    const particles: Particle[] = []
    
    // Premium vibrant colors
    const darkColors = ['#8b5cf6', '#3b82f6', '#ec4899', '#10b981', '#f59e0b']
    const lightColors = ['#6366f1', '#2563eb', '#e11d48', '#059669', '#d97706']
    const colors = theme === 'dark' ? darkColors : lightColors

    const initCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      particles.length = 0
      
      const numParticles = Math.floor((window.innerWidth * window.innerHeight) / 5000)
      const maxRadius = Math.max(canvas.width, canvas.height) / 1.5

      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: canvas.width / 2,
          y: canvas.height / 2,
          angle: Math.random() * Math.PI * 2,
          radius: Math.random() * maxRadius,
          speed: Math.random() * 0.5 + 0.1,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 2 + 1,
          opacity: Math.random() * 0.5 + 0.2
        })
      }
    }

    const handleResize = () => initCanvas()
    
    const handleMouseMove = (e: MouseEvent) => {
      targetMouse.current.x = (e.clientX - window.innerWidth / 2) * 0.05
      targetMouse.current.y = (e.clientY - window.innerHeight / 2) * 0.05
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    initCanvas()

    const render = () => {
      mouse.current.x += (targetMouse.current.x - mouse.current.x) * 0.05
      mouse.current.y += (targetMouse.current.y - mouse.current.y) * 0.05

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const centerX = canvas.width / 2
      const centerY = canvas.height / 2
      const maxRadius = Math.max(canvas.width, canvas.height) / 1.2

      particles.forEach(p => {
        // Expand outward slowly
        p.radius += p.speed
        if (p.radius > maxRadius) {
          p.radius = Math.random() * 50
          p.angle = Math.random() * Math.PI * 2
        }

        // Parallax effect based on mouse
        const parallaxX = mouse.current.x * (p.radius / 100)
        const parallaxY = mouse.current.y * (p.radius / 100)

        // Calculate actual position
        const drawX = centerX + Math.cos(p.angle) * p.radius + parallaxX
        const drawY = centerY + Math.sin(p.angle) * p.radius + parallaxY

        // Draw elongated dashes pointing to center
        ctx.save()
        ctx.translate(drawX, drawY)
        ctx.rotate(p.angle)
        
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(p.size * 3, 0) // Length of dash
        
        // Dynamic opacity based on distance
        const fade = Math.min(1, p.radius / 200) * Math.max(0, 1 - p.radius / maxRadius)
        
        ctx.strokeStyle = p.color
        ctx.lineWidth = p.size
        ctx.lineCap = 'round'
        ctx.globalAlpha = p.opacity * fade
        
        ctx.shadowBlur = 12
        ctx.shadowColor = p.color
        
        ctx.stroke()
        ctx.restore()
      })

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [theme])

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: theme === 'dark' ? 'radial-gradient(circle at center, rgba(139, 92, 246, 0.05) 0%, transparent 60%)' : 'radial-gradient(circle at center, rgba(59, 130, 246, 0.03) 0%, transparent 60%)' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: '100%',
          opacity: 0.8
        }}
      />
    </div>
  )
}
