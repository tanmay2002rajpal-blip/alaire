'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2, GripVertical, Eye, EyeOff, Loader2, Image as ImageIcon } from 'lucide-react'
import NextImage from 'next/image'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deleteHeroSlideAction, toggleHeroSlideAction } from '@/lib/actions/hero-slides'

export interface HeroSlide {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  image_url: string
  button_text: string | null
  button_link: string | null
  position: number
  is_active: boolean
  created_at: string
  updated_at: string
}

interface HeroSlideStats {
  total: number
  active: number
  draft: number
}

interface HeroSlidesClientProps {
  slides: HeroSlide[]
  stats: HeroSlideStats
}

export function HeroSlidesClient({ slides, stats }: HeroSlidesClientProps) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingSlide, setDeletingSlide] = useState<HeroSlide | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const handleDeleteClick = (slide: HeroSlide) => {
    setDeletingSlide(slide)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingSlide) return

    setIsProcessing(true)
    try {
      const result = await deleteHeroSlideAction(deletingSlide.id)
      if (result.success) {
        toast.success('Slide deleted successfully')
        router.refresh()
      } else {
        toast.error('Failed to delete slide', {
          description: result.error || 'An unexpected error occurred',
        })
      }
    } catch (error) {
      toast.error('Failed to delete slide', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setIsProcessing(false)
      setDeleteDialogOpen(false)
      setDeletingSlide(null)
    }
  }

  const handleToggleActive = async (slide: HeroSlide) => {
    setTogglingId(slide.id)
    try {
      const result = await toggleHeroSlideAction(slide.id, !slide.is_active)
      if (result.success) {
        toast.success(slide.is_active ? 'Slide deactivated' : 'Slide activated')
        router.refresh()
      } else {
        toast.error('Failed to update slide', {
          description: result.error || 'An unexpected error occurred',
        })
      }
    } catch (error) {
      toast.error('Failed to update slide', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
      })
    } finally {
      setTogglingId(null)
    }
  }

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
        <Button onClick={() => toast.info('Slide creation form coming soon')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Slide
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <ImageIcon className="h-4 w-4" />
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
            <Button onClick={() => toast.info('Slide creation form coming soon')}>
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
                        <button
                          onClick={() => handleToggleActive(slide)}
                          disabled={togglingId === slide.id}
                          className="cursor-pointer"
                        >
                          {togglingId === slide.id ? (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full inline-flex items-center gap-1">
                              <Loader2 className="h-3 w-3 animate-spin" />
                              Updating...
                            </span>
                          ) : slide.is_active ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full hover:bg-green-200 transition-colors">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full hover:bg-gray-200 transition-colors">
                              Draft
                            </span>
                          )}
                        </button>
                      </div>
                      {slide.subtitle && (
                        <p className="text-sm text-muted-foreground mb-1">{slide.subtitle}</p>
                      )}
                      {slide.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{slide.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info('Slide editor coming soon')}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(slide)}
                      >
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

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Slide</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the slide{' '}
              <code className="bg-muted px-1 rounded">{deletingSlide?.title}</code>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
