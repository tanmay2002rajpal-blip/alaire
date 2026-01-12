import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Privacy Policy",
}

export default function PrivacyPage() {
  return (
    <div className="container max-w-3xl py-12 lg:py-16">
      <h1 className="font-serif text-3xl lg:text-4xl font-medium tracking-tight mb-2">
        Privacy Policy
      </h1>
      <p className="text-muted-foreground mb-8">
        Last updated: December 2024
      </p>

      <div className="prose prose-neutral max-w-none">
        <h2>1. Information We Collect</h2>
        <p>
          We collect information that you provide directly to us, including your name, email address, phone number, shipping address,
          and payment information when you create an account or place an order. We also automatically collect certain information about
          your device and how you interact with our website, including IP address, browser type, pages visited, and time spent on pages.
          This information helps us improve your shopping experience and provide personalized services.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          We use the information we collect to process your orders, communicate with you about your purchases, and provide customer support.
          Your information also helps us improve our products and services, personalize your shopping experience, and send you marketing
          communications about new products and promotions if you have opted in. We analyze usage patterns to enhance our website functionality
          and security.
        </p>

        <h2>3. Information Sharing</h2>
        <p>
          We do not sell or rent your personal information to third parties. We may share your information with trusted service providers
          who assist us in operating our website, processing payments, and delivering products, provided they agree to keep your information
          confidential. We may also disclose your information when required by law or to protect our rights, property, or safety of our
          customers and employees.
        </p>

        <h2>4. Cookies</h2>
        <p>
          Our website uses cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and
          analyze site traffic. You can control cookie settings through your browser preferences, but disabling cookies may limit certain
          features of our website. We use both session cookies that expire when you close your browser and persistent cookies that remain
          until deleted or expired.
        </p>

        <h2>5. Data Security</h2>
        <p>
          We implement appropriate technical and organizational measures to protect your personal information against unauthorized access,
          alteration, disclosure, or destruction. All payment transactions are encrypted using SSL technology. While we strive to protect
          your information, no method of transmission over the internet is completely secure, and we cannot guarantee absolute security.
        </p>

        <h2>6. Your Rights</h2>
        <p>
          You have the right to access, update, or delete your personal information at any time by logging into your account or contacting us.
          You may also opt out of marketing communications by clicking the unsubscribe link in our emails or adjusting your account preferences.
          If you have concerns about how we handle your data, you have the right to lodge a complaint with the appropriate data protection authority.
        </p>

        <h2>7. Third-Party Services</h2>
        <p>
          Our website may contain links to third-party websites and services that are not operated by us. We are not responsible for the
          privacy practices of these external sites. We encourage you to review the privacy policies of any third-party services you access
          through our platform. Integration with payment gateways and courier services is governed by their respective privacy policies.
        </p>

        <h2>8. Updates to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. We will notify you
          of any material changes by posting the updated policy on our website and updating the &ldquo;Last updated&rdquo; date. Your continued use of
          our services after such changes constitutes acceptance of the updated policy.
        </p>

        <h2>9. Contact Us</h2>
        <p>
          If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact our privacy
          team at privacy@alaire.com. We are committed to addressing your inquiries and resolving any privacy-related issues promptly and
          in accordance with applicable data protection laws.
        </p>
      </div>
    </div>
  )
}
