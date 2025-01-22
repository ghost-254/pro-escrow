import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-6 px-4 mb-16 md:mb-0">
      <div className="container flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="text-sm text-muted-foreground">
          © 2025 Xcrow.co. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="mailto:support@xcrow.co" className="hover:text-foreground">
            support@xcrow.co
          </Link>
          <span>•</span>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <span>•</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <span>•</span>
          <Link href="/refund-policy" className="hover:text-foreground">
            Refund Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
