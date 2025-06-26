import type { AppProps } from 'next/app'
import Layout from '@/components/Layout'
import '../styles/globals.css';
import 'react-calendar/dist/Calendar.css'  

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  )
}

export default MyApp
