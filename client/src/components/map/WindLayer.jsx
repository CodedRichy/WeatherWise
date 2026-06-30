import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'

export default function WindLayer({ windSpeed, windDirection }) {
  const map = useMap()
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const particlesRef = useRef([])

  useEffect(() => {
    if (!windSpeed || windDirection == null) return

    // Create canvas overlay sized to map container
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:400;opacity:0.7'
    map.getContainer().appendChild(canvas)
    canvasRef.current = canvas

    const resize = () => {
      const c = map.getContainer()
      canvas.width = c.offsetWidth
      canvas.height = c.offsetHeight
    }
    resize()
    map.on('resize', resize)

    // Convert meteorological wind direction to math angle
    // Wind direction = direction FROM which wind blows
    const rad = ((windDirection - 180) * Math.PI) / 180
    const speed = Math.min(windSpeed, 25) // cap
    const vx = Math.sin(rad) * (speed / 25)  // normalized -1 to 1
    const vy = -Math.cos(rad) * (speed / 25) // flip Y (canvas y goes down)

    // Initialize particles
    const N = 80
    particlesRef.current = Array.from({ length: N }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      age: Math.random() * 100,
      maxAge: 60 + Math.random() * 80,
      size: 1 + Math.random() * 1.5,
    }))

    const ctx = canvas.getContext('2d')
    const SPEED = 1.5 + (windSpeed / 25) * 3.5 // px per frame

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = 'rgba(255,255,255,0.65)'
      ctx.lineWidth = 1

      particlesRef.current.forEach(p => {
        p.age++
        if (p.age > p.maxAge) {
          // respawn at random edge
          if (Math.random() < 0.5) {
            p.x = vx > 0 ? 0 : canvas.width
            p.y = Math.random() * canvas.height
          } else {
            p.x = Math.random() * canvas.width
            p.y = vy > 0 ? 0 : canvas.height
          }
          p.age = 0
          p.maxAge = 60 + Math.random() * 80
        }

        const alpha = Math.sin((p.age / p.maxAge) * Math.PI)
        ctx.beginPath()
        ctx.globalAlpha = alpha * 0.7
        ctx.moveTo(p.x, p.y)
        p.x += vx * SPEED
        p.y += vy * SPEED
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      })
      ctx.globalAlpha = 1
      animRef.current = requestAnimationFrame(frame)
    }

    animRef.current = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(animRef.current)
      map.off('resize', resize)
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas)
    }
  }, [map, windSpeed, windDirection])

  return null
}
