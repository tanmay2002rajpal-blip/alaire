/**
 * @fileoverview Reusable address form fields component.
 * Used in both guest checkout and new address entry for logged-in users.
 *
 * @module components/checkout/address-form-fields
 */

"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { INDIAN_STATES } from "@/lib/constants"
import type { AddressFormFieldsProps } from "./types"

/**
 * AddressFormFields Component
 *
 * Renders a set of form fields for collecting shipping address information.
 * This component is reusable across different checkout flows (guest/logged-in).
 *
 * @param props - Component props
 * @param props.formData - Current form data values
 * @param props.onInputChange - Handler for input field changes
 * @param props.onStateChange - Handler for state dropdown selection
 * @param props.showContactFields - Whether to show name and phone fields (default: false)
 *
 * @example
 * ```tsx
 * <AddressFormFields
 *   formData={formData}
 *   onInputChange={handleInputChange}
 *   onStateChange={handleStateChange}
 *   showContactFields={true}
 * />
 * ```
 */
export function AddressFormFields({
  formData,
  onInputChange,
  onStateChange,
  showContactFields = false,
}: AddressFormFieldsProps) {
  return (
    <div className="space-y-4">
      {/* Contact Fields - Only shown when explicitly requested */}
      {showContactFields && (
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Full Name Field */}
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={onInputChange}
              placeholder="John Doe"
              required
              aria-describedby="fullName-description"
            />
          </div>

          {/* Phone Number Field */}
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={onInputChange}
              placeholder="9876543210"
              required
              pattern="[0-9]{10}"
              aria-describedby="phone-description"
            />
          </div>
        </div>
      )}

      {/* Address Line 1 - Required */}
      <div className="space-y-2">
        <Label htmlFor="line1">Address Line 1</Label>
        <Input
          id="line1"
          name="line1"
          value={formData.line1}
          onChange={onInputChange}
          placeholder="House/Flat No., Building Name"
          required
          aria-describedby="line1-description"
        />
      </div>

      {/* Address Line 2 - Optional */}
      <div className="space-y-2">
        <Label htmlFor="line2">Address Line 2 (Optional)</Label>
        <Input
          id="line2"
          name="line2"
          value={formData.line2}
          onChange={onInputChange}
          placeholder="Street, Locality"
          aria-describedby="line2-description"
        />
      </div>

      {/* City, State, and Pincode - Three column layout on larger screens */}
      <div className="grid gap-4 sm:grid-cols-3">
        {/* City Field */}
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            name="city"
            value={formData.city}
            onChange={onInputChange}
            placeholder="Mumbai"
            required
          />
        </div>

        {/* State Dropdown - All Indian states and union territories */}
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Select value={formData.state} onValueChange={onStateChange}>
            <SelectTrigger id="state" aria-label="Select state">
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

        {/* Pincode Field - Disabled as it's set by PincodeChecker */}
        <div className="space-y-2">
          <Label htmlFor="pincode">Pincode</Label>
          <Input
            id="pincode"
            name="pincode"
            value={formData.pincode}
            onChange={onInputChange}
            placeholder="400001"
            required
            disabled
            aria-describedby="pincode-description"
            className="bg-muted"
          />
          <span id="pincode-description" className="sr-only">
            Pincode is auto-filled from delivery availability check
          </span>
        </div>
      </div>
    </div>
  )
}
