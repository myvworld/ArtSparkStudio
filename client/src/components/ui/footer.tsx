
import { Link } from "wouter";

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-10 md:h-24 md:flex-row md:py-0">
        <div className="flex flex-col items-center gap-4 px-8 md:flex-row md:gap-2 md:px-8">
          <p className="text-center text-sm leading-loose md:text-left">
            © {currentYear} Vworld New Media. All Rights Reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
            Terms of Use
          </Link>
          <Link href="/copyright" className="text-sm text-muted-foreground hover:text-foreground">
            Copyright
          </Link>
        </div>
      </div>
    </footer>
  );
}
