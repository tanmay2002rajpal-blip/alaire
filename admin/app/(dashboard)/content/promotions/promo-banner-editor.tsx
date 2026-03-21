'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Megaphone, Eye, EyeOff, Loader2, Tag, ExternalLink } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { updatePromoBannerAction } from '@/lib/actions/promo-banner'

interface PromoBannerEditorProps {
  initialData: {
    text: string
    is_active: boolean
    coupon_code?: string
    link?: string
  }
  activeCoupons: {
    code: string
    type: string
    value: number
  }[]
}

export function PromoBannerEditor({ initialData, activeCoupons }: PromoBannerEditorProps) {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    text: initialData.text,
    is_active: initialData.is_active,
    coupon_code: initialData.coupon_code || '',
    link: initialData.link || '',
  })

  const handleSave = async () => {
    if (!formData.text.trim()) {
      toast.error('Banner text is required')
      return
    }

    setIsSaving(true)
    try {
      const result = await updatePromoBannerAction({
        text: formData.text.trim(),
        is_active: formData.is_active,
        coupon_code: formData.coupon_code.trim() || undefined,
        link: formData.link.trim() || undefined,
      })

      if (result.success) {
        toast.success('Promo banner updated')
        router.refresh()
      } else {
        toast.error('Failed to save', { description: result.error })
      }
    } catch (error) {
      toast.error('Failed to save', {
        description: error instanceof Error ? error.message : 'Unknown error',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const insertCoupon = (code: string) => {
    if (formData.text.includes(code)) return
    setFormData((prev) => ({
      ...prev,
      text: prev.text ? `${prev.text} | Use code ${code}` : `Use code ${code}`,
      coupon_code: code,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Promo Banner</h1>
        <p className="text-muted-foreground">
          Manage the announcement bar shown at the top of your website
        </p>
      </div>

      {/* Live Preview */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b bg-muted/30">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Live Preview
          </h3>
        </div>
        <div className="p-6 flex justify-center">
          {formData.is_active ? (
            <div className="w-full max-w-2xl bg-black text-white h-7 flex items-center justify-center rounded">
              <p className="text-xs font-light tracking-wide">
                {formData.text || 'Your banner text here...'}
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl bg-gray-200 text-gray-500 h-7 flex items-center justify-center rounded border-2 border-dashed">
              <p className="text-xs flex items-center gap-1">
                <EyeOff className="h-3 w-3" />
                Banner is hidden
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Editor */}
      <Card className="p-6">
        <div className="space-y-6">
          {/* Active Toggle */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div>
              <Label className="text-base">Show Banner</Label>
              <p className="text-sm text-muted-foreground">
                Display the announcement bar on your website
              </p>
            </div>
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, is_active: checked }))
              }
            />
          </div>

          {/* Banner Text */}
          <div className="space-y-2">
            <Label htmlFor="banner-text">Banner Text *</Label>
            <Input
              id="banner-text"
              placeholder="e.g. Free shipping on orders over ₹999 | Use code SAVE20"
              value={formData.text}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, text: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              This text appears in the black bar at the top of your site. Use | to separate multiple messages.
            </p>
          </div>

          {/* Coupon Code */}
          <div className="space-y-2">
            <Label htmlFor="banner-coupon">Featured Coupon Code</Label>
            <Input
              id="banner-coupon"
              placeholder="e.g. SAVE20"
              value={formData.coupon_code}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, coupon_code: e.target.value.toUpperCase() }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Optional: Highlight a specific coupon code in the banner
            </p>
          </div>

          {/* Link */}
          <div className="space-y-2">
            <Label htmlFor="banner-link">Banner Link</Label>
            <div className="flex gap-2">
              <Input
                id="banner-link"
                placeholder="e.g. /products or /categories"
                value={formData.link}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, link: e.target.value }))
                }
              />
              <Button variant="outline" size="icon" className="shrink-0" disabled={!formData.link}>
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Optional: Make the banner clickable
            </p>
          </div>

          {/* Active Coupons Quick Insert */}
          {activeCoupons.length > 0 && (
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Quick Insert Active Coupon
              </Label>
              <div className="flex flex-wrap gap-2">
                {activeCoupons.map((coupon) => (
                  <Button
                    key={coupon.code}
                    variant="outline"
                    size="sm"
                    onClick={() => insertCoupon(coupon.code)}
                    className="text-xs"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {coupon.code}
                    <span className="ml-1 text-muted-foreground">
                      ({coupon.type === 'percentage' ? `${coupon.value}%` : `₹${coupon.value}`} off)
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Lines */}
          <div className="space-y-3">
            <Label>Suggested Lines</Label>
            <div className="flex flex-wrap gap-2">
              {[
                'Free shipping on orders over ₹999',
                'New arrivals just dropped!',
                'Flash Sale — Limited time only!',
                'Up to 50% off on selected items',
                'Use code WELCOME10 for 10% off your first order',
              ].map((line) => (
                <Button
                  key={line}
                  variant="outline"
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, text: line }))}
                  className="text-xs"
                >
                  {line}
                </Button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
