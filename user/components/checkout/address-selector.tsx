"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Plus, Check, Trash2, Loader2, Truck, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  getAddresses,
  addAddress,
  deleteAddress,
  type Address,
  type AddressInput,
} from "@/lib/actions/addresses"
import { checkPincodeServiceability } from "@/lib/fship/actions"
import type { PincodeData } from "@/lib/fship/types"

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi",
]

interface AddressSelectorProps {
  onSelect: (address: Address) => void
  selectedId?: string
  /**
   * Notifies the parent of the shipping rate for the SELECTED saved address so
   * the order summary reflects the same fee the server will charge. Fed the raw
   * FShip pincode rate (parent derives free-vs-paid from admin delivery settings).
   */
  onShippingChange?: (cost: number, days?: number) => void
}

export function AddressSelector({ onSelect, selectedId, onShippingChange }: AddressSelectorProps) {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState<AddressInput>({
    full_name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    pincode: "",
    is_default: false,
  })
  const [isCheckingPincode, setIsCheckingPincode] = useState(false)
  const [pincodeData, setPincodeData] = useState<PincodeData | null>(null)
  const [pincodeError, setPincodeError] = useState<string | null>(null)
  const [cityAutoFilled, setCityAutoFilled] = useState(false)
  const [stateAutoFilled, setStateAutoFilled] = useState(false)

  // Shipping-lookup state for the currently SELECTED saved address. Used to show
  // an inline hint when a saved address has no / an unresolvable pincode so we
  // never silently display "Free" when a delivery fee would actually apply.
  const [isLookingUpSelected, setIsLookingUpSelected] = useState(false)
  const [selectedShippingUnknown, setSelectedShippingUnknown] = useState(false)

  // Keep the latest onShippingChange without making it an effect dependency
  // (the parent recreates it every render). Combined with the pincode-dedupe
  // ref below, this prevents the selected-address lookup from looping.
  const onShippingChangeRef = useRef(onShippingChange)
  onShippingChangeRef.current = onShippingChange
  const lastLookedUpPincodeRef = useRef<string | null>(null)

  /**
   * Looks up city, state, serviceability, and delivery estimate from a 6-digit pincode.
   * Uses the existing checkPincodeServiceability server action (FShip / static map fallback).
   */
  const lookupPincode = useCallback(async (pincode: string) => {
    if (pincode.length !== 6 || !/^\d{6}$/.test(pincode)) {
      setPincodeData(null)
      setPincodeError(null)
      setCityAutoFilled(false)
      setStateAutoFilled(false)
      return
    }

    setIsCheckingPincode(true)
    setPincodeError(null)
    setPincodeData(null)

    try {
      const result = await checkPincodeServiceability(pincode)

      if (result.success && result.data) {
        setPincodeData(result.data)

        // Auto-fill city and state if the lookup returned real values
        if (result.data.city && result.data.city !== "Unknown") {
          setFormData((prev) => ({ ...prev, city: result.data!.city }))
          setCityAutoFilled(true)
        }
        if (result.data.state && result.data.state !== "Unknown") {
          setFormData((prev) => ({ ...prev, state: result.data!.state }))
          setStateAutoFilled(true)
        }
      } else {
        setPincodeError(result.error || "Could not verify this pincode")
      }
    } catch {
      setPincodeError("Failed to look up pincode. Please enter city and state manually.")
    } finally {
      setIsCheckingPincode(false)
    }
  }, [])

  /**
   * Formats estimated delivery days into a human-readable string.
   */
  const formatEstimatedDays = (days: number): string => {
    if (days === 1) return "1 business day"
    if (days <= 3) return `${days} business days`
    if (days <= 5) return "3-5 business days"
    if (days <= 7) return "5-7 business days"
    return `${days} business days`
  }

  // Load addresses on mount
  useEffect(() => {
    let isMounted = true

    const fetchAddresses = async () => {
      const data = await getAddresses()
      if (!isMounted) return

      setAddresses(data)
      setIsLoading(false)

      // Auto-select default address if none selected
      if (!selectedId && data.length > 0) {
        const defaultAddr = data.find((a) => a.is_default) || data[0]
        onSelect(defaultAddr)
      }
    }

    fetchAddresses()

    return () => {
      isMounted = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Handle auto-select when selectedId changes
  useEffect(() => {
    if (!selectedId && addresses.length > 0) {
      const defaultAddr = addresses.find((a) => a.is_default) || addresses[0]
      onSelect(defaultAddr)
    }
  }, [selectedId, addresses, onSelect])

  // Recompute shipping whenever the SELECTED saved address changes. This feeds
  // the same onShippingChange path the New Address tab uses, so switching between
  // saved addresses / tabs keeps the order summary in sync with the pincode rate.
  // Deduped on pincode so re-renders don't re-trigger the lookup.
  useEffect(() => {
    const notify = onShippingChangeRef.current
    if (!notify) return

    const selected = addresses.find((a) => a.id === selectedId)
    if (!selected) return

    const pincode = (selected.pincode || "").trim()

    // Skip if we've already resolved this exact pincode.
    if (lastLookedUpPincodeRef.current === pincode) return
    lastLookedUpPincodeRef.current = pincode

    // No / malformed pincode on a saved address: don't silently show "Free".
    // Reset the rate to 0 and surface a "calculated at delivery" hint instead.
    if (!/^\d{6}$/.test(pincode)) {
      setIsLookingUpSelected(false)
      setSelectedShippingUnknown(true)
      notify(0)
      return
    }

    let cancelled = false
    setSelectedShippingUnknown(false)
    setIsLookingUpSelected(true)

    checkPincodeServiceability(pincode)
      .then((result) => {
        if (cancelled) return
        if (result.success && result.data) {
          setSelectedShippingUnknown(false)
          onShippingChangeRef.current?.(result.data.shippingCost, result.data.estimatedDays)
        } else {
          // Serviceability unknown — surface it rather than defaulting to Free.
          setSelectedShippingUnknown(true)
          onShippingChangeRef.current?.(0)
        }
      })
      .catch(() => {
        if (cancelled) return
        setSelectedShippingUnknown(true)
        onShippingChangeRef.current?.(0)
      })
      .finally(() => {
        if (!cancelled) setIsLookingUpSelected(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedId, addresses])

  const handleAddAddress = async () => {
    if (!formData.full_name || !formData.phone || !formData.line1 || !formData.city || !formData.state || !formData.pincode) {
      toast.error("Please fill all required fields")
      return
    }

    // Block saving with an invalid pincode — shipping can't be resolved for it.
    if (!/^\d{6}$/.test(formData.pincode)) {
      toast.error("Please enter a valid 6-digit pincode")
      return
    }

    // Block saving a pincode we've confirmed is not serviceable.
    if (pincodeData && !pincodeData.serviceable) {
      toast.error("Delivery is not available to this pincode. Please use a different address.")
      return
    }

    setIsSaving(true)
    const result = await addAddress(formData)

    if (result.success && result.address) {
      setAddresses((prev) => [result.address!, ...prev])
      onSelect(result.address)
      setIsAddDialogOpen(false)
      setFormData({
        full_name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        pincode: "",
        is_default: false,
      })
      setPincodeData(null)
      setPincodeError(null)
      setCityAutoFilled(false)
      setStateAutoFilled(false)
      toast.success("Address added successfully")
    } else {
      toast.error(result.error || "Failed to add address")
    }
    setIsSaving(false)
  }

  const handleDeleteAddress = async (id: string) => {
    const result = await deleteAddress(id)
    if (result.success) {
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      if (selectedId === id && addresses.length > 1) {
        const remaining = addresses.filter((a) => a.id !== id)
        if (remaining.length > 0) {
          onSelect(remaining[0])
        }
      }
      toast.success("Address deleted")
    } else {
      toast.error(result.error || "Failed to delete address")
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-muted" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Existing Addresses */}
      {addresses.length > 0 && (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card
              key={address.id}
              className={cn(
                "cursor-pointer transition-all",
                selectedId === address.id
                  ? "border-primary ring-1 ring-primary"
                  : "hover:border-muted-foreground/50"
              )}
              onClick={() => onSelect(address)}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div
                  className={cn(
                    "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    selectedId === address.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/30"
                  )}
                >
                  {selectedId === address.id && <Check className="h-3 w-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{address.full_name}</p>
                    {address.is_default && (
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {address.line1}
                    {address.line2 && `, ${address.line2}`}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address.city}, {address.state} {address.pincode}
                  </p>
                  <p className="text-sm text-muted-foreground">{address.phone}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteAddress(address.id)
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Shipping status for the selected saved address */}
      {selectedId && isLookingUpSelected && (
        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
          <Loader2 className="h-3 w-3 animate-spin" />
          Calculating delivery fee...
        </p>
      )}
      {selectedId && !isLookingUpSelected && selectedShippingUnknown && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
            <p className="text-xs text-amber-700">
              Delivery fee will be calculated at delivery for this address.
            </p>
          </div>
        </div>
      )}

      {/* Add New Address Button */}
      <Dialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open)
          if (!open) {
            // Reset pincode lookup state when dialog closes
            setPincodeData(null)
            setPincodeError(null)
            setCityAutoFilled(false)
            setStateAutoFilled(false)
          }
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-auto py-4">
            <Plus className="mr-2 h-4 w-4" />
            Add New Address
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Address</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                placeholder="9876543210"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="line1">Address Line 1 *</Label>
              <Input
                id="line1"
                value={formData.line1}
                onChange={(e) => setFormData((prev) => ({ ...prev, line1: e.target.value }))}
                placeholder="House/Flat No., Building Name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="line2">Address Line 2</Label>
              <Input
                id="line2"
                value={formData.line2}
                onChange={(e) => setFormData((prev) => ({ ...prev, line2: e.target.value }))}
                placeholder="Street, Landmark"
              />
            </div>

            {/* Pincode field - triggers auto-lookup on 6-digit entry */}
            <div className="grid gap-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <div className="relative">
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6)
                    setFormData((prev) => ({ ...prev, pincode: value }))
                    // Reset auto-fill flags when user changes pincode
                    if (value.length !== 6) {
                      setPincodeData(null)
                      setPincodeError(null)
                      setCityAutoFilled(false)
                      setStateAutoFilled(false)
                    } else {
                      lookupPincode(value)
                    }
                  }}
                  placeholder="Enter 6-digit pincode"
                  maxLength={6}
                  inputMode="numeric"
                  pattern="\d{6}"
                  className="font-mono"
                  disabled={isCheckingPincode}
                />
                {isCheckingPincode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Loading state */}
              {isCheckingPincode && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Looking up pincode...
                </p>
              )}

              {/* Delivery estimate - serviceable */}
              {!isCheckingPincode && pincodeData?.serviceable && (
                <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Truck className="h-3.5 w-3.5 shrink-0 text-green-600" />
                    <p className="text-xs text-green-700">
                      <span className="font-medium">
                        Delivery in {formatEstimatedDays(pincodeData.estimatedDays)}
                      </span>
                      {pincodeData.city !== "Unknown" && (
                        <span className="text-green-600">
                          {" "}to {pincodeData.city}, {pincodeData.state}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Not serviceable warning */}
              {!isCheckingPincode && pincodeData && !pincodeData.serviceable && (
                <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700 font-medium">
                      Delivery may not be available to this pincode
                    </p>
                  </div>
                </div>
              )}

              {/* Pincode lookup error */}
              {!isCheckingPincode && pincodeError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <p className="text-xs text-red-600">
                      {pincodeError}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* City and State - auto-filled from pincode when possible */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">
                  City *
                  {cityAutoFilled && (
                    <span className="ml-1.5 text-xs font-normal text-green-600">(auto-filled)</span>
                  )}
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => {
                    setFormData((prev) => ({ ...prev, city: e.target.value }))
                    setCityAutoFilled(false)
                  }}
                  placeholder="Mumbai"
                  className={cn(cityAutoFilled && "border-green-300 bg-green-50/50")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="state">
                  State *
                  {stateAutoFilled && (
                    <span className="ml-1.5 text-xs font-normal text-green-600">(auto-filled)</span>
                  )}
                </Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => {
                    setFormData((prev) => ({ ...prev, state: value }))
                    setStateAutoFilled(false)
                  }}
                >
                  <SelectTrigger className={cn(stateAutoFilled && "border-green-300 bg-green-50/50")}>
                    <SelectValue placeholder="Select state" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) =>
                  setFormData((prev) => ({ ...prev, is_default: !!checked }))
                }
              />
              <Label htmlFor="is_default" className="text-sm font-normal">
                Set as default address
              </Label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddAddress} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Address"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
