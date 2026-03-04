"use client"

import { useState, useCallback, useEffect } from "react"
import { Loader2, Check, X, Truck } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { checkPincodeServiceability } from "@/lib/bluedart/actions"
import type { PincodeData } from "@/lib/bluedart/types"

interface PincodeCheckerProps {
  onServiceabilityChange?: (data: PincodeData | null) => void
  onCityStateChange?: (city: string, state: string) => void
}

export function PincodeChecker({
  onServiceabilityChange,
  onCityStateChange
}: PincodeCheckerProps) {
  const [pincode, setPincode] = useState("")
  const [isChecking, setIsChecking] = useState(false)
  const [serviceabilityData, setServiceabilityData] = useState<PincodeData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [hasChecked, setHasChecked] = useState(false)

  const handleCheck = useCallback(async () => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setError("Please enter a valid 6-digit pincode")
      setServiceabilityData(null)
      setHasChecked(false)
      onServiceabilityChange?.(null)
      return
    }

    setIsChecking(true)
    setError(null)
    setServiceabilityData(null)
    setHasChecked(false)

    try {
      const result = await checkPincodeServiceability(pincode)

      if (result.success && result.data) {
        setServiceabilityData(result.data)
        setHasChecked(true)
        onServiceabilityChange?.(result.data)

        // Notify parent about city and state for auto-filling
        if (result.data.city && result.data.state && result.data.city !== 'Unknown') {
          onCityStateChange?.(result.data.city, result.data.state)
        }
      } else {
        // Just silently fail the auto-fill, no need to show a red error
        setHasChecked(true)
        onServiceabilityChange?.(null)
      }
    } catch {
      setHasChecked(true)
      onServiceabilityChange?.(null)
    } finally {
      setIsChecking(false)
    }
  }, [pincode, onServiceabilityChange, onCityStateChange])

  // Auto-check when 6 digits are entered
  useEffect(() => {
    if (pincode.length === 6 && /^\d{6}$/.test(pincode)) {
      handleCheck()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pincode])

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
    setPincode(value)

    // Reset states when user changes pincode
    if (value.length !== 6) {
      setError(null)
      setServiceabilityData(null)
      setHasChecked(false)
      onServiceabilityChange?.(null)
    }
  }

  const formatEstimatedDays = (days: number): string => {
    if (days === 1) return "1 business day"
    if (days <= 3) return `${days} business days`
    if (days <= 5) return "3-5 business days"
    if (days <= 7) return "5-7 business days"
    return `${days} business days`
  }

  return (
    <div className="space-y-3">
      <div>
        <Label htmlFor="pincode" className="text-sm font-medium text-gray-900">
          Delivery Pincode
        </Label>
        <div className="mt-2 flex gap-2">
          <Input
            id="pincode"
            type="text"
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            placeholder="Enter 6-digit pincode"
            value={pincode}
            onChange={handlePincodeChange}
            className="flex-1 font-mono text-base"
            disabled={isChecking}
          />
          <Button
            type="button"
            onClick={handleCheck}
            disabled={pincode.length !== 6 || isChecking}
            variant="outline"
            className="px-6"
          >
            {isChecking ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking
              </>
            ) : (
              "Auto-fill"
            )}
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {isChecking && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
            <p className="text-sm text-gray-600">
              Getting city and state...
            </p>
          </div>
        </div>
      )}

      {/* Removed strict success and error states as it is now just an auto-fill */}
    </div>
  )
}
