import React, { Dispatch, SetStateAction, useState } from "react";
import LHSplitLayout from "../layout/LHSplitLayout"
import Image from 'next/image'
import Textfield from "../input/textfield";
import Button from "../element/button";
import Page from "../layout/Page";
import { ErrorAlert } from "../element/alert";

type LoginProps = {
    header?: React.ReactNode
    onLogin: Function
    themeImagePath: string,
    errMessage: String
}

const LoginPage = ({ header, onLogin, themeImagePath, errMessage }: LoginProps): JSX.Element => {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    return (
        <Page
            headerTitle="Login">
            <LHSplitLayout
                left={
                    <div className="text-center">
                        <div className="flex flex-col p-12">
                            {errMessage != ""?
                                <ErrorAlert mes={errMessage} />
                                    :<></>
                            }
                            {!header ?
                                <h1 className="text-3xl mb-8">Wellcome.</h1>
                                : header}
                            <div className="p-2">
                                <div className="py-2">
                                    <Textfield placeholder="Username" type="text" onChange={e => setUsername(e.currentTarget.value)} value={username} />
                                </div>
                                <div className="py-2">
                                    <Textfield placeholder="Password" type="password" onChange={e => setPassword(e.currentTarget.value)} value={password} />
                                </div>
                                <div className="py-2 mt-6">
                                    <Button type="button" onClick={() => onLogin(username, password)}>Login</Button>
                                </div>
                            </div>
                        </div>
                    </div>
                }
                right={
                    <Image
                        alt="Login Background Image"
                        src={themeImagePath}
                        className="object-cover w-full h-screen hidden md:block"
                        layout="fill"
                    />
                }
            />

        </Page>
    )
}

export default LoginPage;