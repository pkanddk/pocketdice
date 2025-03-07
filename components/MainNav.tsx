'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MainNav() {
  const pathname = usePathname();
  
  return (
    <div className="flex items-center space-x-4 lg:space-x-6">
      <Link
        href="/"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === "/" ? "text-black dark:text-white" : "text-muted-foreground"
        }`}
      >
        Home
      </Link>
      <Link
        href="/about"
        className={`text-sm font-medium transition-colors hover:text-primary ${
          pathname === "/about" ? "text-black dark:text-white" : "text-muted-foreground"
        }`}
      >
        About
      </Link>
    </div>
  );
} 