"use client";

import { useState } from "react";
import { Loader2, ArrowRight, CheckCircle2, XCircle, Truck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import { toast } from "sonner";

interface OrderStatusUpdateProps {
  orderId: string;
  currentStatus: string;
  onStatusUpdated?: () => void;
}

// Status workflow mapping
const STATUS_WORKFLOW: Record<string, string[]> = {
  pending: ["confirmed", "processing", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["refunded"],
  cancelled: [],
  refunded: [],
};

// Status display configuration
const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pending", variant: "outline" },
  confirmed: { label: "Confirmed", variant: "secondary" },
  processing: { label: "Processing", variant: "secondary" },
  shipped: { label: "Shipped", variant: "default" },
  delivered: { label: "Delivered", variant: "default" },
  cancelled: { label: "Cancelled", variant: "destructive" },
  refunded: { label: "Refunded", variant: "destructive" },
};

// Courier options
const COURIER_OPTIONS = [
  { value: "bluedart", label: "Blue Dart" },
  { value: "delhivery", label: "Delhivery" },
  { value: "dtdc", label: "DTDC" },
  { value: "ecom_express", label: "Ecom Express" },
  { value: "xpressbees", label: "XpressBees" },
  { value: "other", label: "Other" },
];

export function OrderStatusUpdate({
  orderId,
  currentStatus,
  onStatusUpdated,
}: OrderStatusUpdateProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // Shipping details for "shipped" status
  const [trackingNumber, setTrackingNumber] = useState<string>("");
  const [courierName, setCourierName] = useState<string>("");
  const [estimatedDelivery, setEstimatedDelivery] = useState<string>("");

  const availableStatuses = STATUS_WORKFLOW[currentStatus] || [];
  const canUpdate = availableStatuses.length > 0;
  const isShippedStatus = selectedStatus === "shipped";

  const handleUpdate = async () => {
    // Validation
    if (!selectedStatus) {
      toast.error("Please select a new status");
      return;
    }

    if (selectedStatus === currentStatus) {
      toast.error("Please select a different status");
      return;
    }

    if (!availableStatuses.includes(selectedStatus)) {
      toast.error("Invalid status transition");
      return;
    }

    // Validate shipping details for shipped status
    if (isShippedStatus && !trackingNumber.trim()) {
      toast.error("Please enter a tracking number");
      return;
    }

    setIsUpdating(true);

    try {
      const shippingDetails = isShippedStatus
        ? {
            trackingNumber: trackingNumber.trim(),
            courierName: courierName || "Standard Delivery",
            estimatedDelivery: estimatedDelivery || undefined,
          }
        : undefined;

      const result = await updateOrderStatusAction(
        orderId,
        selectedStatus,
        note.trim() || undefined,
        undefined, // adminId will be set server-side
        shippingDetails
      );

      if (result.success) {
        toast.success("Order status updated successfully", {
          description: `Status changed from ${STATUS_CONFIG[currentStatus].label} to ${STATUS_CONFIG[selectedStatus].label}`,
        });

        // Reset form
        setSelectedStatus("");
        setNote("");
        setTrackingNumber("");
        setCourierName("");
        setEstimatedDelivery("");

        // Call callback
        onStatusUpdated?.();
      } else {
        toast.error("Failed to update order status", {
          description: result.error || "An unexpected error occurred",
        });
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      toast.error("Failed to update order status", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Update Order Status</CardTitle>
        <CardDescription>
          Change the order status and add optional notes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Status Display */}
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">Current Status</p>
            <Badge variant={STATUS_CONFIG[currentStatus]?.variant || "outline"}>
              {STATUS_CONFIG[currentStatus]?.label || currentStatus}
            </Badge>
          </div>

          {canUpdate && selectedStatus && (
            <>
              <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-2">New Status</p>
                <Badge variant={STATUS_CONFIG[selectedStatus]?.variant || "outline"}>
                  {STATUS_CONFIG[selectedStatus]?.label || selectedStatus}
                </Badge>
              </div>
            </>
          )}
        </div>

        {canUpdate ? (
          <>
            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select New Status</label>
              <Select
                value={selectedStatus}
                onValueChange={setSelectedStatus}
                disabled={isUpdating}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {STATUS_CONFIG[status]?.label || status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shipping Details (for shipped status) */}
            {isShippedStatus && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 text-blue-700">
                  <Truck className="h-4 w-4" />
                  <span className="text-sm font-medium">Shipping Details</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trackingNumber">
                    Tracking Number / AWB <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="trackingNumber"
                    placeholder="Enter tracking number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    disabled={isUpdating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="courierName">Courier Partner</Label>
                  <Select
                    value={courierName}
                    onValueChange={setCourierName}
                    disabled={isUpdating}
                  >
                    <SelectTrigger id="courierName">
                      <SelectValue placeholder="Select courier" />
                    </SelectTrigger>
                    <SelectContent>
                      {COURIER_OPTIONS.map((courier) => (
                        <SelectItem key={courier.value} value={courier.label}>
                          {courier.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedDelivery">Estimated Delivery</Label>
                  <Input
                    id="estimatedDelivery"
                    type="date"
                    value={estimatedDelivery}
                    onChange={(e) => setEstimatedDelivery(e.target.value)}
                    disabled={isUpdating}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            )}

            {/* Note/Comment */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Note <span className="text-muted-foreground">(Optional)</span>
              </label>
              <Textarea
                placeholder="Add any additional comments or notes about this status change..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                disabled={isUpdating}
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                This note will be recorded in the order history
              </p>
            </div>

            {/* Update Button */}
            <Button
              onClick={handleUpdate}
              disabled={!selectedStatus || isUpdating}
              className="w-full"
              size="lg"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating Status...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Update Status
                </>
              )}
            </Button>
          </>
        ) : (
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <XCircle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">No Status Changes Available</p>
              <p className="text-sm text-muted-foreground mt-1">
                This order is in a terminal state and cannot be updated further.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
