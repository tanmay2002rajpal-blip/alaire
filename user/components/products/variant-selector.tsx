"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import type { ProductOption, ProductVariant } from "@/types"

interface VariantSelectorProps {
  options: ProductOption[]
  variants: ProductVariant[]
  selectedOptions: Record<string, string>
  onOptionChange: (optionName: string, value: string) => void
}

export function VariantSelector({
  options,
  variants,
  selectedOptions,
  onOptionChange,
}: VariantSelectorProps) {
  // Check if a specific option value is available (has stock)
  const isOptionAvailable = (optionName: string, value: string) => {
    return variants.some((variant) => {
      if (!variant.is_active) return false
      const variantOptions = variant.options as Record<string, string>
      // Check case-insensitive key match
      const getVariantValue = (key: string) =>
        variantOptions[key] ?? variantOptions[key.toLowerCase()] ?? variantOptions[key.charAt(0).toUpperCase() + key.slice(1)]
      if (getVariantValue(optionName) !== value) return false

      // Check if this combination with other selected options exists
      for (const [key, selectedValue] of Object.entries(selectedOptions)) {
        if (key === optionName) continue
        if (getVariantValue(key) !== selectedValue) return false
      }

      return variant.stock_quantity > 0
    })
  }

  return (
    <div className="space-y-6">
      {options
        .sort((a, b) => a.position - b.position)
        .map((option) => (
          <div key={option.id}>
            <h3 className="mb-3 text-sm font-medium">
              {option.name}:{" "}
              <span className="text-muted-foreground">
                {selectedOptions[option.name] || "Select"}
              </span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {option.values.map((value) => {
                const isSelected = selectedOptions[option.name] === value
                const isAvailable = isOptionAvailable(option.name, value)
                const isColor = option.name.toLowerCase() === "color"

                if (isColor) {
                  const hexFromVariant = variants.find(v => {
                    const vo = v.options as Record<string, string>
                    return (vo.color ?? vo.Color) === value && vo.color_hex
                  })?.options as Record<string, string> | undefined
                  const colorHex = hexFromVariant?.color_hex || getColorValue(value)

                  return (
                    <button
                      key={value}
                      onClick={() => onOptionChange(option.name, value)}
                      disabled={!isAvailable}
                      className={cn(
                        "relative h-10 w-10 rounded-full border-2 transition-all",
                        isSelected
                          ? "border-foreground ring-2 ring-foreground ring-offset-2"
                          : "border-muted hover:border-foreground/50",
                        !isAvailable && "opacity-30 cursor-not-allowed"
                      )}
                      style={{
                        backgroundColor: colorHex,
                      }}
                      title={value}
                    >
                      {!isAvailable && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="h-px w-full rotate-45 bg-muted-foreground" />
                        </span>
                      )}
                      <span className="sr-only">{value}</span>
                    </button>
                  )
                }

                // Size or other options as buttons
                return (
                  <Button
                    key={value}
                    variant={isSelected ? "default" : "outline"}
                    size="sm"
                    onClick={() => onOptionChange(option.name, value)}
                    disabled={!isAvailable}
                    className={cn(
                      "min-w-[3rem]",
                      !isAvailable && "opacity-30 line-through"
                    )}
                  >
                    {value}
                  </Button>
                )
              })}
            </div>
          </div>
        ))}
    </div>
  )
}

// Helper to convert color names to CSS values
function getColorValue(colorName: string): string {
  const colors: Record<string, string> = {
    white: "#ffffff",
    black: "#000000",
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    orange: "#f97316",
    purple: "#a855f7",
    pink: "#ec4899",
    gray: "#6b7280",
    grey: "#6b7280",
    brown: "#78350f",
    navy: "#1e3a5a",
    "navy blue": "#1B2A4A",
    beige: "#d4c4a8",
    khaki: "#c3b091",
    olive: "#808000",
    tan: "#d2b48c",
    charcoal: "#36454f",
    camel: "#c19a6b",
    maroon: "#722F37",
    teal: "#2E6B7B",
  }

  return colors[colorName.toLowerCase()] || "#e5e7eb"
}
