import { Star, BadgeCheck } from "lucide-react"
import { Marquee } from "@/components/ui/marquee"
import { cn } from "@/lib/utils"

interface Testimonial {
  id: string
  name: string
  avatar: string | null
  rating: number
  content: string
  productName: string
  verified: boolean
}

function TestimonialCard({ t }: { t: Testimonial }) {
  const initial = t.name.trim().charAt(0).toUpperCase() || "A"

  return (
    <figure className="relative w-72 shrink-0 rounded-xl border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary">
          {t.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={t.avatar} alt={t.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0">
          <figcaption className="flex items-center gap-1.5 text-sm font-semibold">
            <span className="truncate">{t.name}</span>
            {t.verified && <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-green-600" />}
          </figcaption>
          <div className="mt-0.5 flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn(
                  "h-3 w-3",
                  i < t.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
                )}
              />
            ))}
          </div>
        </div>
      </div>
      <blockquote className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
        &ldquo;{t.content}&rdquo;
      </blockquote>
      <p className="mt-3 truncate text-xs text-muted-foreground/70">{t.productName}</p>
    </figure>
  )
}

export function Testimonials({ reviews }: { reviews: Testimonial[] }) {
  if (!reviews || reviews.length === 0) return null

  const mid = Math.ceil(reviews.length / 2)
  const firstRow = reviews.slice(0, mid)
  const secondRow = reviews.slice(mid).length > 0 ? reviews.slice(mid) : reviews.slice(0, mid)

  return (
    <section className="py-16 lg:py-24 overflow-hidden">
      <div className="container">
        <div className="mb-10 text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
            Reviews
          </p>
          <h2 className="mt-2 font-serif text-3xl font-semibold tracking-tight lg:text-5xl">
            What Our Customers Say
          </h2>
        </div>
      </div>

      <div className="relative flex flex-col gap-4">
        <Marquee pauseOnHover className="[--duration:40s]">
          {firstRow.map((t) => (
            <TestimonialCard key={t.id} t={t} />
          ))}
        </Marquee>
        <Marquee reverse pauseOnHover className="[--duration:40s]">
          {secondRow.map((t) => (
            <TestimonialCard key={`r-${t.id}`} t={t} />
          ))}
        </Marquee>

        {/* Edge fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/6 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/6 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  )
}
