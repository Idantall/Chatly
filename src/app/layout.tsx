import type { Metadata } from 'next';
import { Inter, Heebo } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';

// טעינת גופנים באמצעות next/font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter', 
  display: 'swap'
});

const heebo = Heebo({ 
  subsets: ['hebrew'],
  variable: '--font-heebo', 
  display: 'swap'
});

// מטה-דאטה לאפליקציה - נדרש לקומפוננט שרת
export const metadata: Metadata = {
  title: 'Chatly - Your AI Chat Assistant',
  description: 'Personal AI chat assistant built with Next.js and OpenAI',
};

// זהו רכיב שרת (server component)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${heebo.variable}`}>
      <body className="bg-white dark:bg-gray-900 text-black dark:text-white transition-colors">
        {/* ClientLayout מטפל בכל הלוגיקה שדורשת גישה ללקוח */}
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
