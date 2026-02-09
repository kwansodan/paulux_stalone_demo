import localFont from 'next/font/local'

export const gellix = localFont({
  src: [
    {
      path: '../../public/fonts/gellix/Gellix-Light.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/gellix/Gellix-Regular.woff2',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/gellix/Gellix-Medium.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-gellix',
})

export const seasons = localFont({
  src: '../../public/fonts/seasons/FSP DEMO - The Seasons Light Regular.woff2',
  weight: '300',
  variable: '--font-seasons',
})