import type { GetServerSideProps, GetStaticProps, NextPage } from 'next'
import LoginPage from '../components/template/LoginPage';
import { useEffect, useState } from 'react';
import { Auth, withSSRContext } from 'aws-amplify';

import { useRouter } from 'next/router';

export const getServerSideProps: GetServerSideProps = async ({req}) => {
    const {Auth} = withSSRContext({req});

    try {
        const user = await Auth.currentAuthenticatedUser();
        return {
            redirect: {
                permanent: false,
                destination: "/classroom",
            },
            props: {},
        }
    } catch (err) {
     console.log(err);
        
    }

    return {
        props: {},
    }

}

const Index: NextPage = () => {

    const [errMessage, setErrMessage] = useState("");
    const router = useRouter();

    const onLogin = async (username: string, password: string) => {
        
        Auth.signIn(username, password)
            .then(() => {
                router.push("/classroom")
            })
            .catch(() => {
                setErrMessage("Login Failed, username or password incorrect.")
            })
    }

    return (
            <LoginPage
                themeImagePath="/login-bg.jpg"
                onLogin={onLogin}
                errMessage={errMessage}
                />
 
    )
}

export default Index;