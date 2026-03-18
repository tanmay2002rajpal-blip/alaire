import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service",
}

export default function TermsPage() {
  return (
    <div className="container max-w-3xl py-12 lg:py-16">
      <h1 className="font-serif text-3xl lg:text-4xl font-medium tracking-tight mb-2">
        Terms of Service
      </h1>
      <p className="text-muted-foreground mb-8">
        Last updated: December 2024
      </p>

      <div className="prose prose-neutral max-w-none">
        <h2>1. Introduction</h2>
        <p>
          Welcome to Alaire. By accessing and using our website and services, you agree to be bound by these Terms of Service.
          These terms constitute a legally binding agreement between you and Alaire regarding your use of our luxury e-commerce platform.
          If you do not agree to these terms, please do not use our services.
        </p>

        <h2>2. Use of Service</h2>
        <p>
          You agree to use our services only for lawful purposes and in accordance with these terms. You are responsible for maintaining
          the confidentiality of your account credentials and for all activities that occur under your account. We reserve the right to
          suspend or terminate accounts that violate these terms or engage in fraudulent or abusive behavior.
        </p>

        <h2>3. Products and Pricing</h2>
        <p>
          All products displayed on our platform are subject to availability. Prices are listed in Indian Rupees (INR) and include
          applicable taxes unless otherwise stated. We reserve the right to modify product prices, descriptions, and availability at
          any time without prior notice. Any pricing errors will be corrected, and you will have the option to continue or cancel your order.
        </p>

        <h2>4. Orders and Payments</h2>
        <p>
          By placing an order, you make an offer to purchase products at the listed price. We reserve the right to accept or decline
          any order at our discretion. Payment must be made in full at the time of order placement through our approved payment methods.
          All transactions are processed securely, and we do not store complete credit card information on our servers.
        </p>

        <h2>5. Shipping and Delivery</h2>
        <p>
          We strive to process and ship orders promptly. Delivery times are estimates and may vary based on location and product availability.
          Risk of loss and title for products pass to you upon delivery to the carrier. We are not responsible for delays caused by
          courier services, customs clearance, or events beyond our reasonable control.
        </p>

        <h2>6. Intellectual Property</h2>
        <p>
          All content on the Alaire platform, including text, graphics, logos, images, and software, is the property of Alaire and is
          protected by Indian and international intellectual property laws. You may not reproduce, distribute, modify, or create derivative
          works from our content without express written permission. Our brand name, trademarks, and trade dress are proprietary assets.
        </p>

        <h2>7. Limitation of Liability</h2>
        <p>
          To the maximum extent permitted by law, Alaire shall not be liable for any indirect, incidental, special, consequential, or
          punitive damages arising from your use of our services. Our total liability for any claim arising from these terms or your use
          of our services shall not exceed the amount you paid for the specific product or service giving rise to the claim.
        </p>

        <h2>8. Governing Law</h2>
        <p>
          These Terms of Service shall be governed by and construed in accordance with the laws of India. Any disputes arising from
          these terms or your use of our services shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.
          You consent to personal jurisdiction in these courts and waive any objection to venue.
        </p>

        <h2>9. Contact</h2>
        <p>
          If you have any questions or concerns about these Terms of Service, please contact our legal team at legal@alaire.in.
          We are committed to addressing your inquiries promptly and transparently. For other matters, please visit our contact page
          for appropriate department email addresses.
        </p>
      </div>
    </div>
  )
}
