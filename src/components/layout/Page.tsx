import Head from "next/head";
import React from "react";
import { ReactNode } from "react";

type PageProps = {
    headerTitle: string | String,
    children: ReactNode
}

const Page = ({ headerTitle, children }: PageProps): JSX.Element => {
    return (
        <React.Fragment>
            <Head>
                <title>{headerTitle}</title>
                <meta charSet="utf-8" />
                <meta name="viewport" content="initial-scale=1.0, width=device-width" />
            </Head>
            <div className="bg m-0 p-0 min-h-screen w-full">
                {children}
            </div>
        </React.Fragment>
    )
}

export default Page