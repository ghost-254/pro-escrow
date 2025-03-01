//app/terms/page.tsx

import {  Scale, Shield, FileText, AlertTriangle } from 'lucide-react'
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import Typography from '@/components/ui/typography'
import { GoBackButton } from '@/components/GoBackButton'

export default function TermsOfService() {
  return (
    <ScrollArea className="h-[calc(100vh-4rem)] w-full">
      <div className="container max-w-4xl py-6 md:py-12 px-4">
        <div className="mb-8 space-y-2">
          <div className="flex items-center gap-[1rem]">
            <GoBackButton/>
            <Typography
              variant="h1"
              className="text-2xl font-bold tracking-tight"
            >
              Terms of Service
            </Typography>
          </div>
          <Typography variant="p" className="text-muted-foreground">
            Last updated: January 22, 2025
          </Typography>
        </div>

        {/* Key Points Cards */}
        <div className="grid gap-[1rem] md:grid-cols-2 mb-8">
          <Card>
            <CardHeader className="space-y-2">
              <div className="h-8 w-8 mb-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Scale className="h-4 w-4" />
              </div>
              <CardTitle>Legal Agreement</CardTitle>
              <CardDescription>
                These terms constitute a legally binding agreement
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="space-y-2">
              <div className="h-8 w-8 mb-2 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Shield className="h-4 w-4" />
              </div>
              <CardTitle>User Obligations</CardTitle>
              <CardDescription>
                Users must comply with all applicable laws and regulations
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content */}
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <section className="flex flex-col gap-[0.5rem]">
            <Typography
              variant="h1"
              className="text-2xl font-bold tracking-tight mb-1"
            >
              1. Acceptance of Terms
            </Typography>
            <Typography variant="p" className="text-muted-foreground mb-4">
              By accessing or using the Xcrow platform, you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please
              do not use our services.
            </Typography>
            <div className="bg-muted p-4 rounded-lg border mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-7 w-7 text-primary mt-0.5" />
                <div>
                  <h3 className="font-medium mb-1">Important Notice</h3>
                  <p className="text-sm text-muted-foreground">
                    These terms may be updated from time to time. It is your
                    responsibility to check for updates regularly.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              2. Service Description
            </h2>
            <p className="text-muted-foreground mb-6">
              Xcrow provides an online escrow service platform designed to
              facilitate secure transactions between buyers and sellers. Our
              services include:
            </p>
            <ul className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Escrow Services</h4>
                  <p className="text-muted-foreground">
                    Holding funds securely until all parties fulfill their
                    obligations in a transaction.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Transaction Monitoring</h4>
                  <p className="text-muted-foreground">
                    Overseeing the progress of transactions and ensuring
                    compliance with agreed-upon terms.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Dispute Resolution</h4>
                  <p className="text-muted-foreground">
                    Providing a framework for resolving conflicts between
                    parties involved in a transaction.
                  </p>
                </div>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground mb-6">
              To use our services, you must:
            </p>
            <ol className="space-y-4 mb-6">
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Create an Account</h4>
                  <p className="text-muted-foreground">
                    Provide accurate and complete information when registering
                    for an account.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">
                    Maintain Account Security
                  </h4>
                  <p className="text-muted-foreground">
                    Keep your account credentials confidential and secure.
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="h-6 w-6 rounded-full bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Update Information</h4>
                  <p className="text-muted-foreground">
                    Promptly update your account information if any changes
                    occur.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">4. User Conduct</h2>
            <p className="text-muted-foreground mb-6">
              Users of Xcrow agree to:
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Comply with all applicable laws and regulations
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Respect the rights of other users and third parties
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Not engage in fraudulent or deceptive practices
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Not attempt to manipulate or abuse the Xcrow platform or its
                  users
                </span>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              5. Fees and Payments
            </h2>
            <p className="text-muted-foreground mb-6">
              Xcrow charges fees for its services. By using our platform, you
              agree to:
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Pay all applicable fees as outlined in our fee schedule
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Acknowledge that fees may be subject to change with notice
                </span>
              </li>
              <li className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Understand that certain fees may be non-refundable
                </span>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              6. Limitation of Liability
            </h2>
            <p className="text-muted-foreground mb-6">
              Xcrow's liability is limited to the extent permitted by law. We
              are not responsible for:
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Indirect, incidental, or consequential damages
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Losses resulting from unauthorized access to user accounts
                </span>
              </li>
              <li className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <span className="text-muted-foreground">
                  Damages arising from the use or inability to use our services
                </span>
              </li>
            </ul>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">7. Governing Law</h2>
            <p className="text-muted-foreground mb-6">
              These Terms of Service shall be governed by and construed in
              accordance with the laws of your local jurisdiction, without
              regard to its conflict of law provisions.
            </p>
          </section>

          <Separator className="my-8" />

          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">
              8. Contact Information
            </h2>
            <p className="text-muted-foreground mb-6">
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <div className="space-y-2">
              <p className="text-muted-foreground">Email: legal@xcrow.co</p>
            </div>
          </section>

          {/* Footer Note */}
          <div className="bg-muted p-4 rounded-lg border my-8">
            <p className="text-sm text-muted-foreground">
              By using Xcrow's services, you acknowledge that you have read,
              understood, and agree to be bound by these Terms of Service. If
              you do not agree to these terms, please do not use our platform.
            </p>
          </div>
        </div>
      </div>
    </ScrollArea>
  )
}
