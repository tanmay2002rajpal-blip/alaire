import { Metadata } from "next"
import { Truck, Clock, MapPin, Package, IndianRupee, CheckCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export const metadata: Metadata = {
  title: "Shipping Information",
  description: "Learn about Alaire's shipping policies, delivery times, and shipping costs across India.",
}

const shippingZones = [
  {
    zone: "Metro Cities",
    cities: "Mumbai, Delhi, Bangalore, Chennai, Kolkata, Hyderabad",
    standard: "3-5 days",
    express: "1-2 days",
    standardCost: "₹49",
    expressCost: "₹99",
  },
  {
    zone: "Tier 1 Cities",
    cities: "Pune, Ahmedabad, Jaipur, Lucknow, Chandigarh, Kochi",
    standard: "4-6 days",
    express: "2-3 days",
    standardCost: "₹69",
    expressCost: "₹149",
  },
  {
    zone: "Tier 2 & Other Cities",
    cities: "All other serviceable pin codes",
    standard: "5-8 days",
    express: "3-5 days",
    standardCost: "₹99",
    expressCost: "₹199",
  },
]

export default function ShippingPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Shipping Information</h1>
        <p className="text-lg text-muted-foreground">
          Everything you need to know about delivery times and shipping costs
        </p>
      </div>

      {/* Free Shipping Banner */}
      <Card className="mb-8 bg-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <IndianRupee className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Free Shipping on Orders ₹999+</h3>
              <p className="text-muted-foreground">
                Enjoy free standard shipping on all orders above ₹999 across India.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Zones Table */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Shipping Rates & Delivery Times
          </CardTitle>
          <CardDescription>
            Delivery times are estimates and may vary based on location and product availability.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium">Zone</th>
                  <th className="text-left py-3 px-4 font-medium">Standard</th>
                  <th className="text-left py-3 px-4 font-medium">Express</th>
                </tr>
              </thead>
              <tbody>
                {shippingZones.map((zone, index) => (
                  <tr key={index} className="border-b last:border-0">
                    <td className="py-4 px-4">
                      <div className="font-medium">{zone.zone}</div>
                      <div className="text-sm text-muted-foreground">{zone.cities}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium">{zone.standard}</div>
                      <div className="text-sm text-muted-foreground">{zone.standardCost}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-medium">{zone.express}</div>
                      <div className="text-sm text-muted-foreground">{zone.expressCost}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Features */}
      <div className="grid sm:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Order Tracking</h3>
                <p className="text-sm text-muted-foreground">
                  Track your order in real-time with our shipping partner's tracking system. You'll receive tracking details via email and SMS.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Delivery Coverage</h3>
                <p className="text-sm text-muted-foreground">
                  We deliver to 27,000+ pin codes across India. Check delivery availability by entering your pin code at checkout.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Same Day Dispatch</h3>
                <p className="text-sm text-muted-foreground">
                  Orders placed before 2 PM IST (Mon-Sat) are dispatched the same day. Orders after 2 PM ship the next business day.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Secure Packaging</h3>
                <p className="text-sm text-muted-foreground">
                  All orders are carefully packed in eco-friendly packaging to ensure your products arrive in perfect condition.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Important Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Important Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-muted-foreground">
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Delivery times are calculated from the date of dispatch, not the date of order.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Delivery may be delayed during sale periods, festivals, or due to unforeseen circumstances.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>For remote areas, delivery may take an additional 2-3 business days.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>Cash on Delivery (COD) is available for orders up to ₹10,000.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
              <span>International shipping is currently not available.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
