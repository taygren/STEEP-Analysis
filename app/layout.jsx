import './globals.css';

export const metadata = {
  title: 'STINT Studio | Applied Strategy & Intelligence',
  description: 'Practitioner instruments for structured intelligence, applied foresight, and organisational decision-making.',
  openGraph: {
    siteName: 'STINT Studio',
    title: 'STINT Studio | Applied Strategy & Intelligence',
    description: 'Practitioner instruments for structured intelligence, applied foresight, and organisational decision-making.',
  },
  twitter: {
    card: 'summary',
    title: 'STINT Studio | Applied Strategy & Intelligence',
    description: 'Practitioner instruments for structured intelligence, applied foresight, and organisational decision-making.',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-[#07070e] text-white antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
