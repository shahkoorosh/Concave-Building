"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Github, Youtube, Info } from "lucide-react"

interface Shape {
  x: number
  y: number
  width: number
  height: number
  id: string
  color?: string
  type: "rectangle" | "circle" | "triangle"
}

interface Point {
  x: number
  y: number
}

interface Settings {
  rectWidth: number
  rectHeight: number
  rectColor: string
  backgroundColor: string
  groundColor: string
  groundHeight: number
  polygonColor: string
  polygonPadding: number
  canvasWidth: number
  canvasHeight: number
}

interface ColorPreset {
  color: string
  name: string
}

const CANVAS_SIZES = [512, 768]

const DOOR_WINDOW_PRESETS: ColorPreset[] = [
  { color: "#E6E6E6", name: "Window" },
  { color: "#08FF33", name: "Door" },
  { color: "#DCDCDC", name: "Mirror" },
  { color: "#19C2C2", name: "Glass" },
]

const GROUND_PRESETS: ColorPreset[] = [
  { color: "#04FA07", name: "Grass" },
  { color: "#04C803", name: "Tree" },
  { color: "#0052FF", name: "Palm Tree" },
  { color: "#8C8C8C", name: "Road" },
  { color: "#787846", name: "Ground, Earth" },
  { color: "#3DE6FA", name: "Water" },
  { color: "#0907E6", name: "Sea" },
  { color: "#A09614", name: "Sand" },
  { color: "#00C2FF", name: "Soil, Land" },
  { color: "#0ABED4", name: "Lake" },
  { color: "#8FFF8C", name: "Mountain" },
]

const BUILDING_PRESETS: ColorPreset[] = [
  { color: "#787878", name: "Wall" },
  { color: "#B47878", name: "Building" },
  { color: "#FF290A", name: "Rock, Stone" },
  { color: "#FF6600", name: "Hill" },
  { color: "#FF09E0", name: "House" },
  { color: "#8C8C8C", name: "Skyscraper" },
]

export default function ConceptualConcaveBuildingApp() {
  const sketchRef = useRef<HTMLDivElement>(null)
  const p5Instance = useRef<any>(null)
  const settingsRef = useRef<Settings>()
  const shapesRef = useRef<Shape[]>([])
  const selectedShapeRef = useRef<Shape | null>(null)
  const enabledShapesRef = useRef({ rectangle: true, circle: false, triangle: false })
  const updateTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shapeRotationIndexRef = useRef<number>(0)
  const [isClient, setIsClient] = useState(false)

  const [settings, setSettings] = useState<Settings>({
    rectWidth: 40,
    rectHeight: 70,
    rectColor: "#E6E6E6",
    backgroundColor: "#06E6E6",
    groundColor: "#787846",
    groundHeight: 80,
    polygonColor: "#B47878",
    polygonPadding: 0,
    canvasWidth: 768,
    canvasHeight: 512,
  })

  const [shapes, setShapes] = useState<Shape[]>([])
  const [selectedShape, setSelectedShape] = useState<Shape | null>(null)
  const [individualColor, setIndividualColor] = useState<string>("#E6E6E6")

  // Shape type selection
  const [enabledShapes, setEnabledShapes] = useState({
    rectangle: true,
    circle: false,
    triangle: false,
  })

  // Check if we're on the client side
  useEffect(() => {
    setIsClient(true)
  }, [])

  // Keep refs updated
  settingsRef.current = settings
  shapesRef.current = shapes
  selectedShapeRef.current = selectedShape
  enabledShapesRef.current = enabledShapes

  // Get enabled shape types as array
  const getEnabledShapeTypes = (): ("rectangle" | "circle" | "triangle")[] => {
    const types: ("rectangle" | "circle" | "triangle")[] = []
    if (enabledShapesRef.current.rectangle) types.push("rectangle")
    if (enabledShapesRef.current.circle) types.push("circle")
    if (enabledShapesRef.current.triangle) types.push("triangle")
    return types
  }

  // Get next shape type in round-robin fashion
  const getNextShapeType = (): "rectangle" | "circle" | "triangle" => {
    const enabledTypes = getEnabledShapeTypes()
    if (enabledTypes.length === 0) {
      // If no shapes are enabled, default to rectangle
      return "rectangle"
    }

    const currentType = enabledTypes[shapeRotationIndexRef.current % enabledTypes.length]
    shapeRotationIndexRef.current = (shapeRotationIndexRef.current + 1) % enabledTypes.length
    return currentType
  }

  // Improved edge-tracing polygon algorithm
  const calculateEdgeTracingPolygon = (shapes: Shape[], padding = 15): Point[] => {
    if (shapes.length === 0) return []

    // Get all shape edges with padding
    const getAllEdgePoints = (): Point[] => {
      const points: Point[] = []

      shapes.forEach((shape) => {
        if (shape.type === "rectangle") {
          // Rectangle corners
          const corners = [
            { x: shape.x - padding, y: shape.y - padding },
            { x: shape.x + shape.width + padding, y: shape.y - padding },
            { x: shape.x + shape.width + padding, y: shape.y + shape.height + padding },
            { x: shape.x - padding, y: shape.y + shape.height + padding },
          ]
          points.push(...corners)
        } else if (shape.type === "circle") {
          // Circle approximation with points around circumference
          const centerX = shape.x + shape.width / 2
          const centerY = shape.y + shape.width / 2
          const radius = shape.width / 2 + padding

          for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2
            points.push({
              x: centerX + Math.cos(angle) * radius,
              y: centerY + Math.sin(angle) * radius,
            })
          }
        } else if (shape.type === "triangle") {
          // Triangle corners with padding
          const centerX = shape.x + shape.width / 2
          const topY = shape.y - padding
          const bottomY = shape.y + shape.height + padding
          const leftX = shape.x - padding
          const rightX = shape.x + shape.width + padding

          points.push(
            { x: centerX, y: topY }, // top
            { x: leftX, y: bottomY }, // bottom left
            { x: rightX, y: bottomY }, // bottom right
          )
        }
      })

      return points
    }

    const points = getAllEdgePoints()
    if (points.length < 3) return points

    // Remove duplicate points
    const uniquePoints = points.filter(
      (point, index, arr) => arr.findIndex((p) => Math.abs(p.x - point.x) < 2 && Math.abs(p.y - point.y) < 2) === index,
    )

    // Calculate convex hull using Graham scan
    const convexHull = (pts: Point[]): Point[] => {
      if (pts.length < 3) return pts

      // Find the bottom-most point (and leftmost in case of tie)
      let start = pts[0]
      for (let i = 1; i < pts.length; i++) {
        if (pts[i].y > start.y || (pts[i].y === start.y && pts[i].x < start.x)) {
          start = pts[i]
        }
      }

      // Sort points by polar angle with respect to start point
      const sorted = pts
        .filter((p) => p !== start)
        .sort((a, b) => {
          const angleA = Math.atan2(a.y - start.y, a.x - start.x)
          const angleB = Math.atan2(b.y - start.y, b.x - start.x)
          if (Math.abs(angleA - angleB) < 0.001) {
            // If angles are equal, sort by distance
            const distA = Math.sqrt((a.x - start.x) ** 2 + (a.y - start.y) ** 2)
            const distB = Math.sqrt((b.x - start.x) ** 2 + (b.y - start.y) ** 2)
            return distA - distB
          }
          return angleA - angleB
        })

      const hull = [start]

      for (const point of sorted) {
        // Remove points that make clockwise turn
        while (hull.length > 1) {
          const cross =
            (hull[hull.length - 1].x - hull[hull.length - 2].x) * (point.y - hull[hull.length - 2].y) -
            (hull[hull.length - 1].y - hull[hull.length - 2].y) * (point.x - hull[hull.length - 2].x)
          if (cross > 0) break
          hull.pop()
        }
        hull.push(point)
      }

      return hull
    }

    return convexHull(uniquePoints)
  }

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? {
          r: Number.parseInt(result[1], 16),
          g: Number.parseInt(result[2], 16),
          b: Number.parseInt(result[3], 16),
        }
      : { r: 0, g: 0, b: 0 }
  }

  // Check if point is inside shape
  const isPointInShape = (px: number, py: number, shape: Shape): boolean => {
    if (shape.type === "rectangle") {
      return px >= shape.x && px <= shape.x + shape.width && py >= shape.y && py <= shape.y + shape.height
    } else if (shape.type === "circle") {
      const centerX = shape.x + shape.width / 2
      const centerY = shape.y + shape.width / 2
      const radius = shape.width / 2
      const distance = Math.sqrt((px - centerX) ** 2 + (py - centerY) ** 2)
      return distance <= radius
    } else if (shape.type === "triangle") {
      // Triangle hit detection using barycentric coordinates
      const centerX = shape.x + shape.width / 2
      const topY = shape.y
      const bottomY = shape.y + shape.height
      const leftX = shape.x
      const rightX = shape.x + shape.width

      // Triangle vertices
      const v0x = centerX,
        v0y = topY
      const v1x = leftX,
        v1y = bottomY
      const v2x = rightX,
        v2y = bottomY

      // Barycentric coordinates
      const denom = (v1y - v2y) * (v0x - v2x) + (v2x - v1x) * (v0y - v2y)
      if (Math.abs(denom) < 0.001) return false // Degenerate triangle

      const a = ((v1y - v2y) * (px - v2x) + (v2x - v1x) * (py - v2y)) / denom
      const b = ((v2y - v0y) * (px - v2x) + (v0x - v2x) * (py - v2y)) / denom
      const c = 1 - a - b

      return a >= 0 && b >= 0 && c >= 0
    }
    return false
  }

  // Debounced state update to prevent flashing
  const debouncedUpdateShapes = useCallback((newShapes: Shape[]) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current)
    }
    updateTimeoutRef.current = setTimeout(() => {
      setShapes([...newShapes])
    }, 16) // ~60fps
  }, [])

  // Immediate update for color changes (no debouncing needed)
  const immediateUpdateShapes = useCallback((newShapes: Shape[]) => {
    setShapes([...newShapes])
  }, [])

  useEffect(() => {
    // Only run on client side
    if (!isClient || !sketchRef.current) return

    // Dynamically import p5 only on client side
    const initializeP5 = async () => {
      try {
        const p5Module = await import("p5")
        const p5 = p5Module.default

        const sketch = (p: any) => {
          let canvasWidth = settings.canvasWidth
          let canvasHeight = settings.canvasHeight
          let draggedShape: Shape | null = null
          let dragOffset = { x: 0, y: 0 }
          let hoveredShape: Shape | null = null
          let isDragging = false
          let hasMovedWhileDragging = false

          // Local copy of shapes for immediate updates without React re-renders
          let localShapes: Shape[] = [...shapes]

          // Stable color cache - only update when colors actually change
          let colorCache = {
            background: hexToRgb(settings.backgroundColor),
            ground: hexToRgb(settings.groundColor),
            polygon: hexToRgb(settings.polygonColor),
            defaultShape: hexToRgb(settings.rectColor),
          }
          let lastColorString = JSON.stringify({
            bg: settings.backgroundColor,
            ground: settings.groundColor,
            polygon: settings.polygonColor,
            rect: settings.rectColor,
          })

          const findShapeAtPosition = (x: number, y: number): Shape | null => {
            for (let i = localShapes.length - 1; i >= 0; i--) {
              if (isPointInShape(x, y, localShapes[i])) {
                return localShapes[i]
              }
            }
            return null
          }

          const drawShape = (shape: Shape, shapeColor: { r: number; g: number; b: number }) => {
            p.fill(shapeColor.r, shapeColor.g, shapeColor.b)
            p.noStroke()

            if (shape.type === "rectangle") {
              p.rect(shape.x, shape.y, shape.width, shape.height)
            } else if (shape.type === "circle") {
              // Draw circle using ellipse with diameter = width
              const centerX = shape.x + shape.width / 2
              const centerY = shape.y + shape.width / 2
              p.ellipse(centerX, centerY, shape.width, shape.width)
            } else if (shape.type === "triangle") {
              // Draw triangle with top vertex at center-top, base at bottom
              const centerX = shape.x + shape.width / 2
              const topY = shape.y
              const bottomY = shape.y + shape.height
              const leftX = shape.x
              const rightX = shape.x + shape.width

              p.triangle(centerX, topY, leftX, bottomY, rightX, bottomY)
            }
          }

          p.setup = () => {
            const canvas = p.createCanvas(canvasWidth, canvasHeight)
            canvas.parent(sketchRef.current!)
            // Disable right-click context menu
            //canvas.elt.oncontextmenu = () => false
            const canvasElement = canvas.elt
            canvasElement.addEventListener("contextmenu", (e) => {
              e.preventDefault()
              return false
            })
            p.frameRate(60) // Ensure smooth 60fps
          }

          p.draw = () => {
            // Update canvas size if changed
            if (
              canvasWidth !== settingsRef.current!.canvasWidth ||
              canvasHeight !== settingsRef.current!.canvasHeight
            ) {
              canvasWidth = settingsRef.current!.canvasWidth
              canvasHeight = settingsRef.current!.canvasHeight
              p.resizeCanvas(canvasWidth, canvasHeight)
            }

            // Only update color cache when colors actually change
            const currentColorString = JSON.stringify({
              bg: settingsRef.current!.backgroundColor,
              ground: settingsRef.current!.groundColor,
              polygon: settingsRef.current!.polygonColor,
              rect: settingsRef.current!.rectColor,
            })

            if (currentColorString !== lastColorString) {
              colorCache = {
                background: hexToRgb(settingsRef.current!.backgroundColor),
                ground: hexToRgb(settingsRef.current!.groundColor),
                polygon: hexToRgb(settingsRef.current!.polygonColor),
                defaultShape: hexToRgb(settingsRef.current!.rectColor),
              }
              lastColorString = currentColorString
            }

            // Sync local shapes with React state (important for color changes)
            const currentShapesString = JSON.stringify(shapesRef.current)
            const localShapesString = JSON.stringify(localShapes)
            if (currentShapesString !== localShapesString) {
              localShapes = [...shapesRef.current]
            }

            // Layer 1: Background (canvas)
            p.background(colorCache.background.r, colorCache.background.g, colorCache.background.b)

            // Layer 2: Ground (behind polygon)
            p.fill(colorCache.ground.r, colorCache.ground.g, colorCache.ground.b)
            p.noStroke()
            p.rect(0, canvasHeight - settingsRef.current!.groundHeight, canvasWidth, settingsRef.current!.groundHeight)

            // Layer 3: Polygon (in front of ground, behind shapes)
            if (localShapes.length > 0) {
              const hull = calculateEdgeTracingPolygon(localShapes, settingsRef.current!.polygonPadding)

              if (hull.length > 2) {
                p.fill(colorCache.polygon.r, colorCache.polygon.g, colorCache.polygon.b)
                p.noStroke()
                p.beginShape()
                hull.forEach((point) => {
                  p.vertex(point.x, point.y)
                })
                p.endShape(p.CLOSE)
              }
            }

            // Layer 4: Shapes (on top)
            localShapes.forEach((shape) => {
              // Use individual color if set, otherwise use default
              const shapeColor = shape.color ? hexToRgb(shape.color) : colorCache.defaultShape

              // Check if this shape is selected
              const isSelected = selectedShapeRef.current && selectedShapeRef.current.id === shape.id

              let finalColor = { ...shapeColor }

              if (shape === hoveredShape && !isDragging) {
                // Subtle hover effect
                finalColor = {
                  r: Math.max(0, shapeColor.r - 15),
                  g: Math.max(0, shapeColor.g - 15),
                  b: Math.max(0, shapeColor.b - 15),
                }
              } else if (shape === draggedShape) {
                // Slightly darker for dragging
                finalColor = {
                  r: Math.max(0, shapeColor.r - 25),
                  g: Math.max(0, shapeColor.g - 25),
                  b: Math.max(0, shapeColor.b - 25),
                }
              } else if (isSelected) {
                // Subtle selection indicator (slightly brighter)
                finalColor = {
                  r: Math.min(255, shapeColor.r + 10),
                  g: Math.min(255, shapeColor.g + 10),
                  b: Math.min(255, shapeColor.b + 10),
                }
              }

              drawShape(shape, finalColor)
            })

            // Update hover state only when not dragging
            if (!isDragging) {
              hoveredShape = findShapeAtPosition(p.mouseX, p.mouseY)
            }

            // Change cursor based on hover/drag state
            if (hoveredShape || draggedShape) {
              p.cursor(p.HAND)
            } else {
              p.cursor(p.ARROW)
            }
          }

          p.mousePressed = (event: any) => {
            // Check if click is within canvas bounds
            if (p.mouseX < 0 || p.mouseX > canvasWidth || p.mouseY < 0 || p.mouseY > canvasHeight) {
              return false
            }

            const clickedShape = findShapeAtPosition(p.mouseX, p.mouseY)
            hasMovedWhileDragging = false

            // More robust right-click detection
            const isRightClick = event && (event.button === 2 || p.mouseButton === p.RIGHT)

            if (isRightClick) {
              console.log("Right click detected")
              // Right click - delete shape
              if (clickedShape) {
                console.log("Deleting shape:", clickedShape.id)
                localShapes = localShapes.filter((shape) => shape.id !== clickedShape.id)
                debouncedUpdateShapes(localShapes)

                // Clear selection if deleted shape was selected
                if (selectedShapeRef.current && selectedShapeRef.current.id === clickedShape.id) {
                  setSelectedShape(null)
                }
              }
              return false
            } else {
              console.log("Left click detected")
              // Left click
              if (clickedShape) {
                // DIRECT MANIPULATION: Start dragging immediately
                draggedShape = clickedShape
                dragOffset.x = p.mouseX - clickedShape.x
                dragOffset.y = p.mouseY - clickedShape.y
                isDragging = true

                // Update selection for color picker - IMMEDIATE UPDATE
                setSelectedShape(clickedShape)
                setIndividualColor(clickedShape.color || settingsRef.current!.rectColor)
              } else {
                // Click on empty space - add new shape and deselect
                setSelectedShape(null)

                const shapeType = getNextShapeType()
                console.log(`Creating ${shapeType} shape`)

                let newShape: Shape

                if (shapeType === "circle") {
                  // Circle: use rectWidth as diameter
                  const diameter = settingsRef.current!.rectWidth
                  newShape = {
                    id: Date.now().toString() + Math.random(),
                    x: p.mouseX - diameter / 2,
                    y: p.mouseY - diameter / 2,
                    width: diameter,
                    height: diameter, // For circles, height = width (diameter)
                    color: undefined,
                    type: "circle",
                  }
                } else if (shapeType === "triangle") {
                  // Triangle: use rectWidth for base, rectHeight for height
                  const baseWidth = settingsRef.current!.rectWidth
                  const triangleHeight = settingsRef.current!.rectHeight
                  newShape = {
                    id: Date.now().toString() + Math.random(),
                    x: p.mouseX - baseWidth / 2,
                    y: p.mouseY - triangleHeight / 2,
                    width: baseWidth,
                    height: triangleHeight,
                    color: undefined,
                    type: "triangle",
                  }
                } else {
                  // Rectangle: use both rectWidth and rectHeight
                  newShape = {
                    id: Date.now().toString() + Math.random(),
                    x: p.mouseX - settingsRef.current!.rectWidth / 2,
                    y: p.mouseY - settingsRef.current!.rectHeight / 2,
                    width: settingsRef.current!.rectWidth,
                    height: settingsRef.current!.rectHeight,
                    color: undefined,
                    type: "rectangle",
                  }
                }

                // Ensure shape stays within canvas bounds
                newShape.x = Math.max(0, Math.min(newShape.x, canvasWidth - newShape.width))
                newShape.y = Math.max(0, Math.min(newShape.y, canvasHeight - newShape.height))

                console.log(
                  `Added ${shapeType}: position (${newShape.x.toFixed(1)}, ${newShape.y.toFixed(1)}), size ${newShape.width}x${newShape.height}`,
                )

                localShapes.push(newShape)
                debouncedUpdateShapes(localShapes)
              }
            }
            return false
          }

          p.mouseDragged = () => {
            if (draggedShape && isDragging) {
              hasMovedWhileDragging = true
              const newX = p.mouseX - dragOffset.x
              const newY = p.mouseY - dragOffset.y

              // Constrain to canvas bounds
              const constrainedX = Math.max(0, Math.min(newX, canvasWidth - draggedShape.width))
              const constrainedY = Math.max(0, Math.min(newY, canvasHeight - draggedShape.height))

              // Update position immediately for smooth dragging
              draggedShape.x = constrainedX
              draggedShape.y = constrainedY

              // Update the corresponding shape in localShapes
              const shapeIndex = localShapes.findIndex((s) => s.id === draggedShape.id)
              if (shapeIndex !== -1) {
                localShapes[shapeIndex].x = constrainedX
                localShapes[shapeIndex].y = constrainedY
              }
            }
          }

          p.mouseReleased = () => {
            if (draggedShape && isDragging) {
              // Only update React state when dragging is complete
              debouncedUpdateShapes(localShapes)
            }

            draggedShape = null
            dragOffset = { x: 0, y: 0 }
            isDragging = false
            hasMovedWhileDragging = false
          }
        }

        // Only recreate p5 instance when absolutely necessary
        if (p5Instance.current) {
          p5Instance.current.remove()
        }
        p5Instance.current = new p5(sketch)
      } catch (error) {
        console.error("Error loading p5.js:", error)
      }
    }

    initializeP5()

    return () => {
      if (p5Instance.current) {
        p5Instance.current.remove()
      }
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current)
      }
    }
  }, [isClient]) // Only depend on isClient to prevent re-initialization

  // Separate effect for handling external shape updates
  useEffect(() => {
    shapesRef.current = shapes
  }, [shapes])

  // Separate effect for handling settings updates
  useEffect(() => {
    settingsRef.current = settings
  }, [settings])

  // Update individual color picker when selection changes
  useEffect(() => {
    if (selectedShape) {
      setIndividualColor(selectedShape.color || settings.rectColor)
    }
  }, [selectedShape, settings.rectColor])

  const clearShapes = () => {
    setShapes([])
    setSelectedShape(null)
    shapeRotationIndexRef.current = 0
  }

  const updateSetting = (key: keyof Settings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  // Optimized color update without flashing
  const updateColor = useCallback((key: keyof Settings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  // Update individual shape color - IMMEDIATE UPDATE
  const updateIndividualColor = useCallback(
    (color: string) => {
      setIndividualColor(color)
      if (selectedShape) {
        // Update the shapes array immediately
        const updatedShapes = shapes.map((shape) =>
          shape.id === selectedShape.id ? { ...shape, color: color } : shape,
        )

        // Immediate update for visual feedback
        immediateUpdateShapes(updatedShapes)

        // Update selected shape state
        setSelectedShape((prev) => (prev ? { ...prev, color: color } : null))
      }
    },
    [selectedShape, shapes, immediateUpdateShapes],
  )

  // Save canvas as PNG image
  const saveCanvasAsImage = useCallback(() => {
    if (p5Instance.current) {
      // Get the current date and time for filename
      const now = new Date()
      const timestamp = now.toISOString().replace(/[:.]/g, "-").slice(0, 19)
      const filename = `conceptual-building-${timestamp}.png`

      // Use p5.js save function to download the canvas
      p5Instance.current.save(filename)
    }
  }, [])

  const handleShapeToggle = (shapeType: "rectangle" | "circle" | "triangle", checked: boolean) => {
    setEnabledShapes((prev) => ({
      ...prev,
      [shapeType]: checked,
    }))

    // Reset rotation index when shape selection changes
    shapeRotationIndexRef.current = 0
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Minimal Settings Panel */}
      <div className="w-64 p-4 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="space-y-4">
          {/* Canvas Size */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div>
                <Label className="text-sm">Canvas Size</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Select
                    value={settings.canvasWidth.toString()}
                    onValueChange={(value) => updateSetting("canvasWidth", Number.parseInt(value))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANVAS_SIZES.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={settings.canvasHeight.toString()}
                    onValueChange={(value) => updateSetting("canvasHeight", Number.parseInt(value))}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CANVAS_SIZES.map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}px
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shape Types */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div>
                <Label className="text-sm">Shape Types</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="rectangle"
                      checked={enabledShapes.rectangle}
                      onCheckedChange={(checked) => handleShapeToggle("rectangle", checked as boolean)}
                    />
                    <Label htmlFor="rectangle" className="text-sm">
                      Rectangle
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="circle"
                      checked={enabledShapes.circle}
                      onCheckedChange={(checked) => handleShapeToggle("circle", checked as boolean)}
                    />
                    <Label htmlFor="circle" className="text-sm">
                      Circle
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="triangle"
                      checked={enabledShapes.triangle}
                      onCheckedChange={(checked) => handleShapeToggle("triangle", checked as boolean)}
                    />
                    <Label htmlFor="triangle" className="text-sm">
                      Triangle
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Size Controls */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div>
                <Label className="text-sm">
                  Size: {settings.rectWidth} × {settings.rectHeight}
                </Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">X (Width)</Label>
                    <Slider
                      min={20}
                      max={120}
                      step={5}
                      value={[settings.rectWidth]}
                      onValueChange={(value) => updateSetting("rectWidth", value[0])}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-gray-500">Y (Height)</Label>
                    <Slider
                      min={20}
                      max={120}
                      step={5}
                      value={[settings.rectHeight]}
                      onValueChange={(value) => updateSetting("rectHeight", value[0])}
                    />
                  </div>
                </div>
              </div>

              {/* Window */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm">Window</Label>
                  <input
                    type="color"
                    value={settings.rectColor}
                    onChange={(e) => updateColor("rectColor", e.target.value)}
                    className="w-5 h-5 rounded border border-gray-300 cursor-pointer"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        Seg Color
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {DOOR_WINDOW_PRESETS.map((preset) => (
                        <DropdownMenuItem
                          key={preset.color}
                          onClick={() => updateColor("rectColor", preset.color)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span className="text-sm">{preset.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Window Sel */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm">Window Sel</Label>
                  <input
                    type="color"
                    value={individualColor}
                    onChange={(e) => updateIndividualColor(e.target.value)}
                    disabled={!selectedShape}
                    className="w-5 h-5 rounded border border-gray-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs" disabled={!selectedShape}>
                        Seg Color
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {DOOR_WINDOW_PRESETS.map((preset) => (
                        <DropdownMenuItem
                          key={preset.color}
                          onClick={() => updateIndividualColor(preset.color)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span className="text-sm">{preset.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Colors */}
          <Card>
            <CardContent className="p-3 space-y-3">
              {/* Sky */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm">Sky</Label>
                  <input
                    type="color"
                    value={settings.backgroundColor}
                    onChange={(e) => updateColor("backgroundColor", e.target.value)}
                    className="w-5 h-5 rounded border border-gray-300 cursor-pointer"
                  />
                </div>
              </div>

              {/* Ground */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm">Ground</Label>
                  <input
                    type="color"
                    value={settings.groundColor}
                    onChange={(e) => updateColor("groundColor", e.target.value)}
                    className="w-5 h-5 rounded border border-gray-300 cursor-pointer"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        Seg Color
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {GROUND_PRESETS.map((preset) => (
                        <DropdownMenuItem
                          key={preset.color}
                          onClick={() => updateColor("groundColor", preset.color)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span className="text-sm">{preset.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Building */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Label className="text-sm">Building</Label>
                  <input
                    type="color"
                    value={settings.polygonColor}
                    onChange={(e) => updateColor("polygonColor", e.target.value)}
                    className="w-5 h-5 rounded border border-gray-300 cursor-pointer"
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        Seg Color
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      {BUILDING_PRESETS.map((preset) => (
                        <DropdownMenuItem
                          key={preset.color}
                          onClick={() => updateColor("polygonColor", preset.color)}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div
                            className="w-4 h-4 rounded border border-gray-300"
                            style={{ backgroundColor: preset.color }}
                          />
                          <span className="text-sm">{preset.name}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardContent className="p-3 space-y-3">
              <div>
                <Label className="text-sm">Ground Height: {settings.groundHeight}px</Label>
                <Slider
                  min={40}
                  max={200}
                  step={10}
                  value={[settings.groundHeight]}
                  onValueChange={(value) => updateSetting("groundHeight", value[0])}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm">Building Padding: {settings.polygonPadding}px</Label>
                <Slider
                  min={0}
                  max={50}
                  step={5}
                  value={[settings.polygonPadding]}
                  onValueChange={(value) => updateSetting("polygonPadding", value[0])}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardContent className="p-3 space-y-2">
              <Button onClick={clearShapes} variant="outline" size="sm" className="w-full">
                Clear ({shapes.length})
              </Button>
              <Button onClick={saveCanvasAsImage} variant="default" size="sm" className="w-full">
                Save Image
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 p-6">
        <div className="mb-4">
          {/* Credit */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-800">Conceptual Concave Building</h1>
              <p className="text-sm text-gray-500 mt-1">Designed by Koorosh Ghotb</p>
            </div>
            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/shahkoorosh"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                title="GitHub"
              >
                <Github className="w-4 h-4 text-gray-700" />
              </a>
              <a
                href="https://www.youtube.com/@UD.SMedia"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 transition-colors"
                title="YouTube"
              >
                <Youtube className="w-4 h-4 text-red-600" />
              </a>
            </div>
          </div>
          <p className="text-gray-600 mb-4">Left click: Add/Drag • Right click: Delete</p>
        </div>

        <div ref={sketchRef} className="border-2 border-gray-300 rounded-lg bg-white inline-block" />

        {/* Tooltip */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Shape Sizing Guide:</p>
              <ul className="space-y-1 text-xs">
                <li>
                  <strong>Rectangle:</strong> X slider controls width, Y slider controls height
                </li>
                <li>
                  <strong>Circle:</strong> X slider controls diameter (Y slider ignored)
                </li>
                <li>
                  <strong>Triangle:</strong> X slider controls base width, Y slider controls height
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
