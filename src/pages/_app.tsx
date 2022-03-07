import '../styles/globals.css'
import type { AppProps } from 'next/app'
import awsconfig from '../../aws-config';
import { Amplify } from 'aws-amplify';
Amplify.configure({...awsconfig, ssr: true});

function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}

export default MyApp
