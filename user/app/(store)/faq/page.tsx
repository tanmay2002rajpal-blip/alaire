import { Metadata } from "next"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageCircle } from "lucide-react"
import Link from "next/link"

export const metadata: Metadata = {
  title: "FAQ",
  description: "Find answers to frequently asked questions about Alaire orders, shipping, returns, and more.",
}

const faqCategories = [
  {
    title: "Orders & Payments",
    faqs: [
      {
        question: "How do I place an order?",
        answer: "Simply browse our collection, add items to your cart, and proceed to checkout. You can pay using UPI, credit/debit cards, net banking, or choose Cash on Delivery for eligible orders."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit and debit cards (Visa, Mastercard, Amex, RuPay), UPI payments, net banking from all major banks, and Cash on Delivery (COD) for orders up to ₹10,000."
      },
      {
        question: "Can I modify or cancel my order?",
        answer: "Orders can be modified or cancelled within 1 hour of placing them, provided they haven't been dispatched. Please contact our support team immediately at support@alaire.in to request changes."
      },
      {
        question: "How do I track my order?",
        answer: "Once your order is dispatched, you'll receive a tracking link via email and SMS. You can also track your order by logging into your account and visiting the 'Orders' section."
      },
      {
        question: "Is Cash on Delivery (COD) available?",
        answer: "Yes, COD is available for orders up to ₹10,000 at select pin codes. You can check COD availability by entering your pin code during checkout."
      },
    ]
  },
  {
    title: "Shipping & Delivery",
    faqs: [
      {
        question: "What are the shipping charges?",
        answer: "Shipping is FREE on all orders above ₹999. For orders below ₹999, shipping charges range from ₹49 to ₹99 depending on your location. Express shipping is available at additional cost."
      },
      {
        question: "How long does delivery take?",
        answer: "Standard delivery takes 3-8 business days depending on your location. Metro cities receive orders in 3-5 days, while other areas may take 5-8 days. Express shipping delivers within 1-3 days."
      },
      {
        question: "Do you deliver to my area?",
        answer: "We deliver to 27,000+ pin codes across India. You can check delivery availability by entering your pin code on the product page or during checkout."
      },
      {
        question: "What if I'm not available to receive my order?",
        answer: "Our courier partner will attempt delivery up to 3 times. If you're unavailable, you can reschedule delivery or pick up from the nearest courier hub. You'll receive SMS notifications for each attempt."
      },
    ]
  },
  {
    title: "Returns & Exchanges",
    faqs: [
      {
        question: "What is your return policy?",
        answer: "We offer a 7-day return policy from the date of delivery. Items must be unused, unwashed, and in original packaging with all tags attached. Visit our Returns page for complete details."
      },
      {
        question: "How do I initiate a return?",
        answer: "To initiate a return, log into your account, go to 'Orders', select the item you wish to return, and click 'Request Return'. You can also email us at tanmay2002rajpal@gmail.com with your order details."
      },
      {
        question: "How long does it take to get a refund?",
        answer: "Refunds are processed within 5-7 business days after we receive and inspect the returned item. The amount will be credited to your original payment method. Bank processing may take an additional 3-5 days."
      },
      {
        question: "Can I exchange an item for a different size?",
        answer: "For exchanges, we recommend placing a new order for the desired size and returning the original item for a refund. This ensures you get your new item quickly without waiting for the exchange process."
      },
      {
        question: "What items cannot be returned?",
        answer: "For hygiene reasons, innerwear and intimate apparel cannot be returned unless damaged or defective. Items marked as 'Final Sale' are also non-returnable."
      },
    ]
  },
  {
    title: "Products & Sizing",
    faqs: [
      {
        question: "How do I find my size?",
        answer: "Each product page includes a detailed size guide with measurements. We recommend measuring yourself and comparing with our size chart for the best fit. If you're between sizes, we suggest sizing up."
      },
      {
        question: "Are the product colors accurate?",
        answer: "We make every effort to display colors accurately, but colors may vary slightly depending on your screen settings. Product descriptions include the actual color name for reference."
      },
      {
        question: "How do I care for my Alaire products?",
        answer: "Care instructions are printed on the product label and included in the product description. Generally, we recommend machine wash cold, gentle cycle, and tumble dry low for best results."
      },
    ]
  },
  {
    title: "Account & Privacy",
    faqs: [
      {
        question: "Do I need an account to shop?",
        answer: "You can checkout as a guest, but creating an account lets you track orders, save addresses, view order history, and earn rewards on purchases."
      },
      {
        question: "How do I reset my password?",
        answer: "Click 'Sign In' and then 'Forgot Password'. Enter your email address and we'll send you a link to reset your password. The link expires in 24 hours."
      },
      {
        question: "Is my personal information secure?",
        answer: "Yes, we use industry-standard SSL encryption to protect your data. We never share your personal information with third parties except for order fulfillment. Read our Privacy Policy for details."
      },
    ]
  },
]

export default function FAQPage() {
  return (
    <div className="container max-w-4xl py-12 md:py-16">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-muted-foreground">
          Find answers to common questions about shopping with Alaire
        </p>
      </div>

      {/* FAQ Categories */}
      <div className="space-y-8">
        {faqCategories.map((category, categoryIndex) => (
          <div key={categoryIndex}>
            <h2 className="text-xl font-semibold mb-4">{category.title}</h2>
            <Accordion type="single" collapsible className="w-full">
              {category.faqs.map((faq, faqIndex) => (
                <AccordionItem key={faqIndex} value={`${categoryIndex}-${faqIndex}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        ))}
      </div>

      {/* Still Need Help */}
      <Card className="mt-12 bg-muted/50">
        <CardContent className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h3 className="text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is here to help.
          </p>
          <Button asChild>
            <Link href="/contact">Contact Support</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
