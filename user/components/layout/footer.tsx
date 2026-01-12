"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { Instagram, Facebook, Twitter } from "lucide-react"
import { NewsletterForm } from "./newsletter-form"
import { FOOTER_LINKS, SOCIAL_LINKS, SITE_CONFIG } from "@/lib/constants"

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger)
}

export function Footer() {
  const footerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!footerRef.current) return

    const ctx = gsap.context(() => {
      // Animate footer sections on scroll
      gsap.fromTo(
        ".footer-section",
        { y: 40, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 90%",
            once: true,
          },
        }
      )
    }, footerRef)

    return () => ctx.revert()
  }, [])

  return (
    <footer ref={footerRef} className="border-t border-border/50 bg-muted/30">
      {/* Main Footer Content */}
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* Brand & Newsletter */}
          <div className="footer-section lg:col-span-5 space-y-8">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl font-medium tracking-tight">
                ALAIRE
              </span>
            </Link>
            <p className="max-w-sm text-muted-foreground leading-relaxed">
              {SITE_CONFIG.description}
            </p>
            <div className="space-y-4">
              <h4 className="text-sm font-medium uppercase tracking-widest">
                Stay Updated
              </h4>
              <p className="text-sm text-muted-foreground">
                Subscribe for exclusive offers and new arrivals.
              </p>
              <NewsletterForm variant="minimal" className="max-w-sm" />
            </div>
          </div>

          {/* Spacer for large screens */}
          <div className="hidden lg:block lg:col-span-1" />

          {/* Shop Links */}
          <div className="footer-section lg:col-span-2">
            <h4 className="mb-6 text-sm font-medium uppercase tracking-widest">
              Shop
            </h4>
            <ul className="space-y-4">
              {FOOTER_LINKS.shop.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account Links */}
          <div className="footer-section lg:col-span-2">
            <h4 className="mb-6 text-sm font-medium uppercase tracking-widest">
              Account
            </h4>
            <ul className="space-y-4">
              {FOOTER_LINKS.account.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help Links */}
          <div className="footer-section lg:col-span-2">
            <h4 className="mb-6 text-sm font-medium uppercase tracking-widest">
              Support
            </h4>
            <ul className="space-y-4">
              {FOOTER_LINKS.help.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border/50">
        <div className="container flex flex-col items-center justify-between gap-6 py-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <Link
              href={SOCIAL_LINKS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="h-5 w-5" />
            </Link>
            <Link
              href={SOCIAL_LINKS.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Follow us on Facebook"
            >
              <Facebook className="h-5 w-5" />
            </Link>
            <Link
              href={SOCIAL_LINKS.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Follow us on Twitter"
            >
              <Twitter className="h-5 w-5" />
            </Link>
          </div>

          {/* Legal Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
