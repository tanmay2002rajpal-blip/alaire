/**
 * @fileoverview Shipping address card for checkout.
 * Handles both saved addresses (for logged-in users) and new address entry.
 *
 * @module components/checkout/shipping-address-card
 */

"use client"

import { MapPin } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { PincodeChecker } from "./pincode-checker"
import { AddressSelector } from "./address-selector"
import { AddressFormFields } from "./address-form-fields"
import type { ShippingAddressCardProps, AddressMode } from "./types"

/**
 * ShippingAddressCard Component
 *
 * Renders the shipping address section of the checkout form.
 * Provides different experiences based on authentication status:
 *
 * - **Logged-in users**: Can choose between saved addresses or enter a new one
 * - **Guest users**: Must enter a new address manually
 *
 * Both flows include:
 * - Pincode serviceability check via Blue Dart
 * - Address form fields with validation
 * - City/state auto-population from pincode
 *
 * @param props - Component props
 * @param props.isLoggedIn - Whether user is authenticated
 * @param props.addressMode - Current address mode (saved/new)
 * @param props.onAddressModeChange - Handler for mode changes
 * @param props.selectedAddress - Currently selected saved address
 * @param props.onAddressSelect - Handler for saved address selection
 * @param props.formData - Current form data values
 * @param props.onInputChange - Handler for input field changes
 * @param props.onStateChange - Handler for state dropdown changes
 * @param props.serviceabilityData - Pincode serviceability data
 * @param props.onServiceabilityChange - Handler for serviceability updates
 * @param props.onShippingChange - Handler for shipping cost updates
 *
 * @example
 * ```tsx
 * <ShippingAddressCard
 *   isLoggedIn={true}
 *   addressMode="saved"
 *   onAddressModeChange={setAddressMode}
 *   selectedAddress={selectedAddress}
 *   onAddressSelect={handleAddressSelect}
 *   formData={formData}
 *   onInputChange={handleInputChange}
 *   onStateChange={handleStateChange}
 *   serviceabilityData={serviceabilityData}
 *   onServiceabilityChange={setServiceabilityData}
 *   onShippingChange={handleShippingChange}
 * />
 * ```
 */
export function ShippingAddressCard({
  isLoggedIn,
  addressMode,
  onAddressModeChange,
  selectedAddress,
  onAddressSelect,
  formData,
  onInputChange,
  onStateChange,
  serviceabilityData,
  onServiceabilityChange,
  onShippingChange,
}: ShippingAddressCardProps) {
  /**
   * Handles pincode serviceability data changes.
   * Updates the shipping cost and populates pincode if serviceable.
   */
  const handleServiceabilityChange = (data: typeof serviceabilityData) => {
    onServiceabilityChange(data)

    if (data) {
      // Update shipping cost and estimated days based on serviceability
      onShippingChange?.(data.shippingCost, data.estimatedDays)

      // Auto-populate pincode if serviceable
      if (data.serviceable) {
        const event = {
          target: { name: "pincode", value: data.pincode },
        } as React.ChangeEvent<HTMLInputElement>
        onInputChange(event)
      }
    } else {
      // Reset shipping cost when no data
      onShippingChange?.(0)
    }
  }

  /**
   * Handles city and state auto-population from pincode lookup.
   */
  const handleCityStateChange = (city: string, state: string) => {
    // Create synthetic events for city and state updates
    const cityEvent = {
      target: { name: "city", value: city },
    } as React.ChangeEvent<HTMLInputElement>
    onInputChange(cityEvent)
    onStateChange(state)
  }

  /**
   * Renders the address form fields with pincode checker.
   * Used in both "new address" tab and guest checkout.
   */
  const renderNewAddressForm = (showContactFields: boolean = false) => (
    <>
      {/* Pincode Serviceability Checker */}
      <div className="space-y-2">
        <Label>Check Delivery Availability</Label>
        <PincodeChecker
          onServiceabilityChange={handleServiceabilityChange}
          onCityStateChange={handleCityStateChange}
        />
      </div>

      {/* Address fields are always shown now */}
      <AddressFormFields
        formData={formData}
        onInputChange={onInputChange}
        onStateChange={onStateChange}
        showContactFields={showContactFields}
      />
    </>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" aria-hidden="true" />
          Shipping Address
        </CardTitle>
        <CardDescription>
          Where should we deliver your order?
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoggedIn ? (
          /**
           * Logged-in User Experience:
           * - Tab interface to switch between saved and new addresses
           * - Saved addresses tab shows AddressSelector component
           * - New address tab shows pincode checker and form fields
           */
          <Tabs
            value={addressMode}
            onValueChange={(v) => onAddressModeChange(v as AddressMode)}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="saved">Saved Addresses</TabsTrigger>
              <TabsTrigger value="new">New Address</TabsTrigger>
            </TabsList>

            {/* Saved Addresses Tab */}
            <TabsContent value="saved" className="mt-4">
              <AddressSelector
                onSelect={onAddressSelect}
                selectedId={selectedAddress?.id}
              />
            </TabsContent>

            {/* New Address Tab */}
            <TabsContent value="new" className="mt-4 space-y-4">
              {renderNewAddressForm(true)}
            </TabsContent>
          </Tabs>
        ) : (
          /**
           * Guest User Experience:
           * - Direct address entry without tabs
           * - Pincode checker followed by address fields
           * - No saved address option
           */
          <div className="space-y-4">
            {renderNewAddressForm(false)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
