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
    needChangePassword?: boolean
    onChangePassword?: Function
    themeImagePath: string,
    errMessage: String
}

const LoginPage = ({ header, onLogin, themeImagePath, errMessage, needChangePassword, onChangePassword }: LoginProps): JSX.Element => {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [newPwd, setNewPwd] = useState("");
    const [confirmPwd, setConfirmPwd] = useState("");

    return (
        <Page
            headerTitle="Login">
            <LHSplitLayout
                left={
                    <div className="text-center">
                        <div className="flex flex-col p-12">
                            {errMessage != "" ?
                                <ErrorAlert mes={errMessage} />
                                : <></>
                            }
                            {!header ?
                                <h1 className="text-3xl mb-8">Wellcome.</h1>
                                : header}
                            <div className="p-2">
                                {needChangePassword && onChangePassword ?
                                    <React.Fragment>
                                        <div className="text-left mb-5">You need to change the Password in first time login</div>
                                        <div className="py-2">
                                            <div className="text-sm text-left">New Password</div>
                                            <Textfield placeholder="New Password" type="password" onChange={e => setNewPwd(e.currentTarget.value)} value={newPwd} />
                                        </div>
                                        <div className="py-2">
                                            <div className="text-sm text-left">Confirm New Password</div>
                                            <Textfield placeholder="Confirm New PAssword" type="password" onChange={e => setConfirmPwd(e.currentTarget.value)} value={confirmPwd} />
                                        </div>
                                        <div className="py-2 mt-6">
                                            <button type="button" className="rounded text-white bg-black p-2 cursor-pointer w-full md:px-8 hover:bg-gray-900" onClick={() => onChangePassword(newPwd, confirmPwd)}>Change Password</button>
                                        </div>
                                    </React.Fragment>
                                    :
                                    <React.Fragment>
                                        <div className="py-2">
                                            <Textfield placeholder="Username" type="text" onChange={e => setUsername(e.currentTarget.value)} value={username} />
                                        </div>
                                        <div className="py-2">
                                            <Textfield placeholder="Password" type="password" onChange={e => setPassword(e.currentTarget.value)} value={password} />
                                        </div>
                                        <div className="py-2 mt-6">
                                            <button type="button" className="rounded text-white bg-black p-2 cursor-pointer w-full md:px-8 hover:bg-gray-900" onClick={() => onLogin(username, password)}>Login</button>
                                        </div>
                                    </React.Fragment>
                                }
                            </div>
                        </div>
                    </div>
                }
                right={
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        alt="Login Background Image"
                        src={themeImagePath}
                        className="object-cover w-full h-screen hidden md:block"
                        // layout="fill"
                    />
                }
            />

        </Page>
    )
}

export default LoginPage;