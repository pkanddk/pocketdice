import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'F#*KLE PvP',
  description: 'Play F#*KLE against another player!',
};

export default function FarklePvPLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>; // This layout simply renders the children (the page)
} 