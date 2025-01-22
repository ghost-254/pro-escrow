import { ArrowLeft, Clock, DollarSign, ShieldCheck, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function RefundPolicy() {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full">
      <div className="container max-w-4xl py-6 md:py-12 px-4">
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Refund Policy</h1>
          </div>
          <p className="text-muted-foreground">Last updated: January 22, 2024</p>
        </div>

        {/* Key Points Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader className="space-y-1">
              <div className="h-8 w-8 mb-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <CardTitle>Processing Time</CardTitle>
              <CardDescription>Refund requests are processed within 3-5 business days</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <div className="h-8 w-8 mb-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <DollarSign className="h-4 w-4" />
              </div>
              <CardTitle>Full Refunds</CardTitle>
              <CardDescription>100% money-back guarantee for eligible transactions</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Overview</h2>
            <p className="text-muted-foreground mb-4">
              At Xcrow, we understand that sometimes transactions don't go as planned. Our refund policy is designed to
              ensure fair treatment for both buyers and sellers while maintaining the integrity of our escrow service.
              This policy outlines the conditions under which refunds are processed and the steps required to initiate a
              refund request.
            </p>
            <div className="bg-muted p-4 rounded-lg border mb-6">
              <div className="flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Buyer Protection Guarantee</h3>
                  <p className="text-sm text-muted-foreground">
                    All transactions are covered by our Buyer Protection Guarantee. If you don't receive the item as
                    described, you're eligible for a full refund.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Refund Eligibility</h2>
            <p className="text-muted-foreground mb-6">Refunds may be issued in the following circumstances:</p>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Non-Receipt of Item/Service</h4>
                  <p className="text-muted-foreground">
                    If you haven't received your purchased item or service within the agreed-upon timeframe.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Item Not as Described</h4>
                  <p className="text-muted-foreground">
                    If the received item or service significantly differs from what was advertised.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Unauthorized Transactions</h4>
                  <p className="text-muted-foreground">If unauthorized or fraudulent transactions are detected.</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-medium mb-1">Technical Issues</h4>
                  <p className="text-muted-foreground">
                    If technical problems on our platform prevent the completion of the transaction.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Refund Process</h2>
            <p className="text-muted-foreground mb-6">To initiate a refund request:</p>
            <ol className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Submit a Request</h4>
                  <p className="text-muted-foreground">
                    Log into your account and navigate to the transaction in question. Click the "Request Refund" button
                    and fill out the required information.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Provide Documentation</h4>
                  <p className="text-muted-foreground">
                    Submit any relevant documentation or evidence to support your refund request (e.g., photos,
                    communication logs, etc.).
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Review Period</h4>
                  <p className="text-muted-foreground">
                    Our team will review your request within 24-48 hours. We may contact you for additional information
                    if needed.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-medium mb-1">Refund Processing</h4>
                  <p className="text-muted-foreground">
                    If approved, refunds are processed within 3-5 business days. The time it takes for the funds to
                    appear in your account may vary depending on your payment method.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Non-Refundable Items</h2>
            <p className="text-muted-foreground mb-6">The following are generally not eligible for refunds:</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Completed and delivered digital services that meet the agreed-upon specifications
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Items or services where the buyer has already confirmed receipt and satisfaction
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Platform fees and transaction charges</span>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions about our refund policy or need assistance with a refund request, please don't
              hesitate to contact our support team:
            </p>
            <div className="space-y-2">
              <p className="text-muted-foreground">Email: support@xcrow.co</p>
              <p className="text-muted-foreground">Support Hours: 24/7</p>
              <p className="text-muted-foreground">Response Time: Within 24 hours</p>
            </div>
          </section>

          {/* Footer Note */}
          <div className="bg-muted p-4 rounded-lg border mt-8">
            <p className="text-sm text-muted-foreground">
              This refund policy is subject to change. Any modifications will be effective immediately upon posting the
              updated policy on this page. Your continued use of our services following any changes indicates your
              acceptance of the revised policy.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

