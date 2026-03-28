import Link from 'next/link'
import Typography from './ui/typography'

export function Footer() {
  return (
    <footer className="border-t py-6 px-4 mb-16 md:mb-0">
      <div className="container flex flex-col lg:flex-row justify-between items-center gap-[0.5rem] md:gap-[1rem]">
        <Typography variant="p">
          &copy; {new Date().getFullYear()} XcrowTrust.com. All rights reserved.
        </Typography>
        <div className="flex items-center flex-col md:flex-row gap-[0.7rem] md:gap-[1rem] text-sm text-muted-foreground">
          <Link href="mailto:support@xcrowtrust.com" className="hover:text-foreground">
            support@xcrowtrust.com
          </Link>
          <span className="hidden md:block">&bull;</span>
          <Link href="/terms" className="hover:text-foreground">
            Terms
          </Link>
          <span className="hidden md:block">&bull;</span>
          <Link href="/privacy" className="hover:text-foreground">
            Privacy
          </Link>
          <span className="hidden md:block">&bull;</span>
          <Link href="/refund" className="hover:text-foreground">
            Refund Policy
          </Link>
        </div>
      </div>
    </footer>
  )
}
