import { Metadata } from 'next';

/**
 * מטאדאטה סטטי עבור האפליקציה
 * נפרד מהלייאוט שמסומן עם 'use client'
 */
export const metadata: Metadata = {
  title: 'Chatly - אפליקציית צ\'אט עם בינה מלאכותית',
  description: 'צור ונהל צ\'אטים עם בינה מלאכותית בצורה מותאמת אישית',
  keywords: ['chatly', 'AI', 'chat', 'GPT', 'צ\'אט', 'בינה מלאכותית', 'שיחה', 'התכתבות', 'עוזר וירטואלי'],
  authors: [{ name: 'Chatly Team' }],
  creator: 'Chatly',
  publisher: 'Chatly',
  applicationName: 'Chatly',
  
  // תמונת אייקון
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  
  // הגדרות viewport
  viewport: {
    width: 'device-width',
    initialScale: 1,
    minimumScale: 1,
  },
  
  // צבע נושא
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f9fa' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  
  // הגדרות Open Graph
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    url: 'https://chatly-app.com',
    title: 'Chatly - אפליקציית צ\'אט עם בינה מלאכותית',
    description: 'צור ונהל צ\'אטים עם בינה מלאכותית בצורה מותאמת אישית',
    siteName: 'Chatly',
  },
  
  // הגדרות Twitter Card
  twitter: {
    card: 'summary_large_image',
    title: 'Chatly - אפליקציית צ\'אט עם בינה מלאכותית',
    description: 'צור ונהל צ\'אטים עם בינה מלאכותית בצורה מותאמת אישית',
    creator: '@chatly',
  },
  
  // הגדרות לוקליזציה
  alternates: {
    languages: {
      'en': '/en',
      'he': '/',
    },
  },
}; 