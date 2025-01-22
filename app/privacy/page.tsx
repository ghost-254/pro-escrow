import { ArrowLeft, Lock, Shield, Eye, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function PrivacyPolicy() {
  return (
    <ScrollArea className="h-[calc(150vh-4rem)] w-full">
      <div className="container max-w-4xl py-6 md:py-12 px-4">
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-6 w-6" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground">Last updated: January 22, 2024</p>
        </div>

        {/* Key Points Cards */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader className="space-y-1">
              <div className="h-8 w-8 mb-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Lock className="h-4 w-4" />
              </div>
              <CardTitle>Data Protection</CardTitle>
              <CardDescription>We prioritize the security and privacy of your personal information</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-1">
              <div className="h-8 w-8 mb-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Eye className="h-4 w-4" />
              </div>
              <CardTitle>Transparency</CardTitle>
              <CardDescription>Clear information about how we collect, use, and share your data</CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="text-muted-foreground mb-4">
              At Xcrow, we are committed to protecting your privacy and ensuring the security of your personal
              information. This Privacy Policy explains how we collect, use, disclose, and safeguard your data when you
              use our escrow services platform.
            </p>
            <div className="bg-muted p-4 rounded-lg border mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Important Notice</h3>
                  <p className="text-sm text-muted-foreground">
                    By using Xcrow's services, you consent to the practices described in this Privacy Policy. Please
                    read this document carefully to understand how we handle your information.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            <p className="text-muted-foreground mb-6">
              We collect various types of information to provide and improve our services:
            </p>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Personal Information</h4>
                  <p className="text-muted-foreground">
                    Name, email address, phone number, and other contact details you provide when creating an account or
                    using our services.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Financial Information</h4>
                  <p className="text-muted-foreground">
                    Bank account details, credit card information, and transaction history related to your use of our
                    escrow services.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Usage Data</h4>
                  <p className="text-muted-foreground">
                    Information about how you interact with our platform, including IP address, device information,
                    browser type, and pages visited.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            <p className="text-muted-foreground mb-6">
              We use the collected information for various purposes, including:
            </p>
            <ol className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Providing and Improving Our Services</h4>
                  <p className="text-muted-foreground">
                    To facilitate escrow transactions, process payments, and enhance the functionality of our platform.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Communication</h4>
                  <p className="text-muted-foreground">
                    To send you important updates, notifications, and respond to your inquiries.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Security and Fraud Prevention</h4>
                  <p className="text-muted-foreground">
                    To protect our platform, users, and detect and prevent fraudulent activities.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
            <p className="text-muted-foreground mb-6">We may share your information with:</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Service providers who assist us in operating our platform and providing our services
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Legal authorities when required by law or to protect our rights and safety
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Other users involved in your transactions, but only to the extent necessary to facilitate the escrow
                  process
                </span>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="text-muted-foreground mb-6">
              We implement robust security measures to protect your information, including:
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Encryption of sensitive data in transit and at rest</span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Regular security audits and vulnerability assessments</span>
              </li>
              <li className="flex items-start gap-3">
                <Lock className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Strict access controls and employee training on data protection
                </span>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights and Choices</h2>
            <p className="text-muted-foreground mb-6">You have certain rights regarding your personal information:</p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Access and update your personal information through your account settings
                </span>
              </li>
              <li className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Request deletion of your account and associated data</span>
              </li>
              <li className="flex items-start gap-3">
                <Eye className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">Opt-out of certain data collection and use practices</span>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">7. International Data Transfers</h2>
            <p className="text-muted-foreground mb-6">
              Your information may be transferred to and processed in countries other than your own. We ensure
              appropriate safeguards are in place to protect your data in compliance with applicable laws.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">8. Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any significant changes by
              posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <div className="space-y-2">
              <p className="text-muted-foreground">Email: privacy@xcrow.co</p>
            </div>
          </section>

          {/* Footer Note */}
          <div className="bg-muted p-4 rounded-lg border mt-8">
            <p className="text-sm text-muted-foreground">
              By using Xcrow's services, you acknowledge that you have read and understood this Privacy Policy and agree
              to the collection, use, and disclosure of your information as described herein.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}

