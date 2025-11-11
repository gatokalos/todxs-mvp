// src/hooks/useMemeGenerator.js
import { useRef } from "react"

export default function useMemeGenerator(logoPath = "/logo_transmedia.png") {
  const canvasRef = useRef(null)

  const generarMeme = async (frase) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const ctx = canvas.getContext("2d")
    const width = 1000, height = 600
    canvas.width = width
    canvas.height = height

    // 🎨 Fondo con gradiente
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, "#2c003e") // púrpura profundo
    gradient.addColorStop(1, "#000000") // negro
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    // 🖋️ Texto con estilo
    ctx.fillStyle = "#fff"
    ctx.font = "bold 40px 'Georgia'"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"

    // Divide la frase en varias líneas si es larga
    const maxWidth = width - 120
    const lineHeight = 55
    const words = frase.split(" ")
    let line = ""
    const lines = []
    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " "
      const metrics = ctx.measureText(testLine)
      if (metrics.width > maxWidth && i > 0) {
        lines.push(line)
        line = words[i] + " "
      } else {
        line = testLine
      }
    }
    lines.push(line)

    // Centrar verticalmente el bloque de texto
    const totalHeight = lines.length * lineHeight
    let y = height / 2 - totalHeight / 2

    lines.forEach((l) => {
      ctx.fillText(l.trim(), width / 2, y)
      y += lineHeight
    })

    // 🐾 Logo en esquina con transparencia
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      img.src = logoPath
      await new Promise((res, rej) => {
        img.onload = res
        img.onerror = rej
      })
      ctx.globalAlpha = 0.8
      ctx.drawImage(img, width - 140, height - 140, 120, 120)
      ctx.globalAlpha = 1.0
    } catch (e) {
      console.warn("⚠️ No se pudo cargar el logo:", e.message)
    }

    return canvas.toDataURL("image/png")
  }

  const abrirMeme = async (frase) => {
    const urlImg = await generarMeme(frase)
    if (urlImg) window.open(urlImg, "_blank")
  }

  const descargarMeme = async (frase) => {
    const urlImg = await generarMeme(frase)
    if (urlImg) {
      const link = document.createElement("a")
      link.download = `meme-${Date.now()}.png`
      link.href = urlImg
      link.click()
    }
  }

  return {
    canvasRef,
    previewUrl,
    generarMeme,
    descargarMeme,
  };
}