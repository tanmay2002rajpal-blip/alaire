import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Image as ImageIcon, Layers, GripVertical, Pencil, Trash2, Eye, EyeOff } from "lucide-react"
import { getHeroSlides, getHeroSlideStats } from "@/lib/queries/hero-slides"
import NextImage from "next/image"

export default async function HeroSlidesPage() {
  const [slides, stats] = await Promise.all([
    getHeroSlides(),
    getHeroSlideStats(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hero Slides</h1>
          <p className="text-muted-foreground">
            Manage homepage hero banner slides
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Slide
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Layers className="h-4 w-4" />
            <span className="text-sm">Total Slides</span>
          </div>
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Active carousel slides</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Active Slides</span>
          </div>
          <p className="text-2xl font-bold">{stats.active}</p>
          <p className="text-xs text-muted-foreground">Currently visible</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <EyeOff className="h-4 w-4" />
            <span className="text-sm">Draft Slides</span>
          </div>
          <p className="text-2xl font-bold">{stats.draft}</p>
          <p className="text-xs text-muted-foreground">Pending publication</p>
        </Card>
      </div>

      {/* Slides List */}
      {slides.length === 0 ? (
        <Card className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No hero slides yet</h3>
            <p className="text-muted-foreground mb-4 max-w-md">
              Create hero slides to showcase promotions, new arrivals, and special offers on your homepage carousel.
            </p>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Slide
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {slides.map((slide, index) => (
            <Card key={slide.id} className="overflow-hidden">
              <div className="flex">
                {/* Drag Handle & Position */}
                <div className="flex items-center px-4 bg-muted/50 border-r">
                  <div className="flex flex-col items-center gap-1">
                    <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
                    <span className="text-xs text-muted-foreground font-medium">#{index + 1}</span>
                  </div>
                </div>

                {/* Image Preview */}
                <div className="relative w-48 h-28 flex-shrink-0">
                  <NextImage
                    src={slide.image_url}
                    alt={slide.title}
                    fill
                    className="object-cover"
                  />
                </div>

                {/* Content */}
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{slide.title}</h3>
                        {slide.is_active ? (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            Draft
                          </span>
                        )}
                      </div>
                      {slide.subtitle && (
                        <p className="text-sm text-muted-foreground mb-1">{slide.subtitle}</p>
                      )}
                      {slide.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{slide.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  {slide.button_text && (
                    <div className="mt-2">
                      <span className="text-xs text-muted-foreground">
                        Button: {slide.button_text} &rarr; {slide.button_link}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
