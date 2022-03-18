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
    const [user, setUser] = useState();
    const [needChangePassword, setNeedChangePassword] = useState<boolean>(false);

    const router = useRouter();

    const onChangePassword = async (newPwd: string, confirmNewPwd: string) => {
        if(newPwd != confirmNewPwd){
            setErrMessage("Password not match")
            return;
        }

        await Auth.completeNewPassword(user, newPwd).then(() => {
            router.push("/classroom")
        })
    }

    const onLogin = async (username: string, password: string) => {
        setErrMessage("");
        Auth.signIn(username, password)
            .then(user => {

                if (user.challengeName === 'NEW_PASSWORD_REQUIRED') {
                    setNeedChangePassword(true);
                    setUser(user)
                }else{
                    router.push("/classroom")
                }
                
            })
            .catch(() => {
                setErrMessage("Login Failed, username or password incorrect.")
            })
    }

    return (
            <LoginPage
                themeImagePath="/login-bg.jpg"
                needChangePassword={needChangePassword}
                onChangePassword={onChangePassword}
                onLogin={onLogin}
                errMessage={errMessage}
                />
 
    )
}

export default Index;