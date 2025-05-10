import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'General Score Card',
  description: 'A general score card for any game!',
};

export default function GeneralScoreCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>; // This layout simply renders the children (the page)
} 