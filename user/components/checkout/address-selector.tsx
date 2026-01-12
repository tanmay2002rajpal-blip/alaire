"use client"

import { useState, useEffect } from "react"
import { Plus, Check, Trash2 } from "lucide-react"
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
}

export function AddressSelector({ onSelect, selectedId }: AddressSelectorProps) {
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

  const handleAddAddress = async () => {
    if (!formData.full_name || !formData.phone || !formData.line1 || !formData.city || !formData.state || !formData.pincode) {
      toast.error("Please fill all required fields")
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

      {/* Add New Address Button */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full h-auto py-4">
            <Plus className="mr-2 h-4 w-4" />
            Add New Address
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-lg">
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
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Mumbai"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => setFormData((prev) => ({ ...prev, pincode: e.target.value }))}
                  placeholder="400001"
                  maxLength={6}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="state">State *</Label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, state: value }))}
              >
                <SelectTrigger>
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
