import './globals.css';
import { Analytics } from '@vercel/analytics/next';

export const metadata = {
  title: 'STEEP Analysis Platform',
  description: 'AI-powered multi-agent STEEP analysis using local Ollama LLMs',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-900 text-white antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
