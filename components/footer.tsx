import Link from 'next/link'
import Typography from './ui/typography'

export function Footer() {
  return (
    <footer className="border-t py-6 px-4 mb-16 md:mb-0">
      <div className="container flex flex-col lg:flex-row justify-between items-center gap-[0.5rem] md:gap-[1rem]">
        <Typography variant="p">
          © {new Date().getFullYear()} Xcrow.co. All rights reserved.
        </Typography>
        <div className="flex items-center flex-col md:flex-row  gap-[0.7rem] md:gap-[1rem] text-sm text-muted-foreground">
          <Link
            href="mailto:support@xcrow.co"
            className="hover:text-foreground"
          >
            support@xcrow.co
          </Link>
          <span className="hidden md:block">•</span>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <span className="hidden md:block">•</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <span className="hidden md:block">•</span>
          <Link href="/refund-policy" className="hover:text-foreground">
            Refund Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
