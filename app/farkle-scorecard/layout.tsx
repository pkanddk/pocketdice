import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'F#*KLE Score Card',
  description: 'Track your F#*KLE game scores easily!', // You can customize this
};

export default function FarkleScoreCardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>; // This layout simply renders the children (the page)
} 