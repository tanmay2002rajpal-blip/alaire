import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Return Policy",
}

export default function ReturnsPage() {
  return (
    <div className="container max-w-3xl py-12 lg:py-16">
      <h1 className="font-serif text-3xl lg:text-4xl font-medium tracking-tight mb-2">
        Return Policy
      </h1>
      <p className="text-muted-foreground mb-8">
        Last updated: December 2024
      </p>

      <div className="prose prose-neutral max-w-none">
        <h2>1. Return Window</h2>
        <p>
          We want you to be completely satisfied with your Alaire purchase. If you are not entirely happy with your order, you may
          return eligible items within 7 days of receiving your delivery. To qualify for a return, items must be in their original
          condition, unworn, unwashed, and with all original tags and packaging intact. Please note that the 7-day period is calculated
          from the date of delivery confirmation.
        </p>

        <h2>2. Eligibility</h2>
        <p>
          Items eligible for return must be in new, unused condition with all original tags, labels, and packaging. Products showing
          signs of wear, washing, alteration, or damage will not be accepted for return. Sale items, final sale products, and personalized
          or custom-made items are not eligible for return unless they arrive damaged or defective.
        </p>

        <h2>3. How to Initiate a Return</h2>
        <p>
          To initiate a return, please contact our customer service team at returns@alaire.com with your order number and reason for return.
          We will provide you with a return authorization number and detailed instructions for shipping your item back to us. Please do not
          send items back without first obtaining authorization, as unauthorized returns may not be processed or refunded.
        </p>

        <h2>4. Exchange Process</h2>
        <p>
          If you would like to exchange an item for a different size or color, please follow the return process and place a new order for
          the desired item. This ensures faster processing and guarantees availability of your preferred product. Exchanges are subject to
          stock availability, and we recommend placing your new order promptly to secure your preferred item.
        </p>

        <h2>5. Refund Timeline</h2>
        <p>
          Once we receive and inspect your returned item, we will process your refund within 5-7 business days. Refunds will be issued
          to your original method of payment in Indian Rupees (INR). Please note that depending on your financial institution, it may
          take an additional 3-5 business days for the refund to reflect in your account. You will receive an email confirmation once
          your refund has been processed.
        </p>

        <h2>6. Return Shipping</h2>
        <p>
          Customers are responsible for return shipping costs unless the return is due to our error or a defective product. We recommend
          using a trackable shipping service and purchasing shipping insurance for valuable items, as we cannot guarantee receipt of your
          returned item. Please pack items securely to prevent damage during transit, and retain proof of postage until your refund is confirmed.
        </p>

        <h2>7. Non-Returnable Items</h2>
        <p>
          Certain items are not eligible for return for hygiene and safety reasons, including intimate apparel, earrings, beauty products,
          and items marked as final sale. Gift cards, digital products, and personalized items are also non-returnable. If you receive
          a non-returnable item that is damaged or defective, please contact us immediately for assistance.
        </p>

        <h2>8. Damaged or Defective Items</h2>
        <p>
          If you receive a damaged or defective item, please contact us at returns@alaire.com within 48 hours of delivery with photographs
          of the damage or defect. We will arrange for a replacement or full refund, including return shipping costs. Our quality team
          investigates all reports of damaged or defective products to maintain our standards of excellence.
        </p>

        <h2>9. Contact</h2>
        <p>
          For any questions or concerns about our return policy, please contact our customer service team at returns@alaire.com. Our team
          is available to assist you with return authorizations, shipping instructions, and refund status inquiries. We are committed to
          making the return process as smooth and hassle-free as possible for our valued customers.
        </p>
      </div>
    </div>
  )
}
