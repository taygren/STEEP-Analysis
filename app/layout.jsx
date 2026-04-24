import './globals.css';

export const metadata = {
  title: 'STEEP Analysis Platform',
  description: 'AI-powered six-agent STEEP analysis using Groq cloud inference',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-white antialiased">{children}</body>
    </html>
  );
}
