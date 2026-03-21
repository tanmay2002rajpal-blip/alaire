import { getDb } from "@/lib/db/client"
import { PromoBannerEditor } from "./promo-banner-editor"

async function getPromoBannerData() {
  try {
    const db = await getDb()
    const settings = await db.collection('site_settings').findOne({ key: 'promo_banner' })
    if (!settings) {
      return {
        text: 'Free shipping on orders over ₹999',
        is_active: true,
        coupon_code: '',
        link: '',
      }
    }
    return settings.value as {
      text: string
      is_active: boolean
      coupon_code?: string
      link?: string
    }
  } catch {
    return {
      text: 'Free shipping on orders over ₹999',
      is_active: true,
      coupon_code: '',
      link: '',
    }
  }
}

async function getActiveCoupons() {
  try {
    const db = await getDb()
    const now = new Date()
    const coupons = await db.collection('coupons').find({
      is_active: true,
      valid_from: { $lte: now },
      $or: [
        { valid_until: null },
        { valid_until: { $gte: now } },
      ],
    }).project({ code: 1, type: 1, value: 1 }).toArray()

    return coupons.map((c) => ({
      code: c.code as string,
      type: c.type as string,
      value: c.value as number,
    }))
  } catch {
    return []
  }
}

export default async function PromotionsPage() {
  const [bannerData, coupons] = await Promise.all([
    getPromoBannerData(),
    getActiveCoupons(),
  ])

  return <PromoBannerEditor initialData={bannerData} activeCoupons={coupons} />
}
