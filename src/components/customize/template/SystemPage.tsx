import Page from "../../layout/Page"
import { AdjustmentsIcon, AcademicCapIcon, UserCircleIcon, LogoutIcon, ChartBarIcon } from '@heroicons/react/solid'
import Link from "next/link"
import { Auth } from "aws-amplify";
import { useRouter } from "next/router";
import React, { useState } from "react";
import Modal from "../../element/modal";
import Textfield from "../../input/textfield";
import { ErrorAlert, SuccessAlert } from "../../element/alert";
import Button from "../../element/button";

type SystemPageProps = {
    headerTitle: string | String
    pageTitle: string | String
    children: React.ReactNode,
}

type UserSetting = {
    currPassword: string,
    newPassword: string,
    confirmNewPassword: string
}

const SystemPage = ({ children, headerTitle, pageTitle }: SystemPageProps): JSX.Element => {

    const router = useRouter();

    const [settingModal, setSettingModal] = useState<boolean>(false);
    const [modalSucMes, setModalSucMes] = useState<string>("");
    const [modalErrMes, setModalErrMes] = useState<string>("");

    const [setting, setSetting] = useState<UserSetting>({
        currPassword: "",
        newPassword: "",
        confirmNewPassword: ""
    })

    const logout = async () => {

        try {
            await Auth.signOut({ global: true });
            router.push("/");

        } catch (err) {
            console.log(err);
        }

    }

    const changePassword = async () => {
        setModalErrMes("");
        setModalSucMes("")

        if (setting.confirmNewPassword == "" || setting.newPassword == "" || setting.currPassword == ""){
            setModalErrMes("Please enter the password");
            return;
        }

        if (setting.newPassword != setting.confirmNewPassword){
            setModalErrMes("New Password and Confirm Password not match")
        }else{
            Auth.currentAuthenticatedUser()
            .then(user => {
                return Auth.changePassword(user, setting.currPassword, setting.newPassword);
            })
            .then(data => setModalSucMes("Password is updated."))
            .catch(err => setModalErrMes("Password incorrect"));
        }
    }




    return (
        <Page
            headerTitle={headerTitle}>
            <div className="bg-gray-50 min-h-screen">
                <div className="w-full min-h-full">
                    <div className="justify-center text-center block p-6 w-full bg-gradient-to-r border from-yellow-400 via-red-500 to-pink-500 ...">
                        <div className="flex">
                            <span className="text-xl m-auto text-white font-bold">
                                <div className="border-b-4 border-white">{pageTitle}</div>
                            </span>
                        </div>
                    </div>
                </div>
                <div className="lg:container lg:mx-auto">
                    <div className="flex w-full pt-8">
                        <div className="flex-col w-9/12 mx-4 md:mx-8 mb-8">
                            <div className="bg-white border min-h-full">
                                <div className="px-8 py-8 max-h-full">
                                    <React.Fragment>
                                        {settingModal ?
                                            <Modal
                                                header="Setting">


                                                <div className="text-center">
                                                    {modalErrMes != "" ?
                                                        <ErrorAlert
                                                            mes={modalErrMes} />
                                                        : <></>
                                                    }
                                                    {modalSucMes != ""?
                                                        <SuccessAlert 
                                                            mes={modalSucMes}/>
                                                        :<></>
                                                    }
                                                    <div className="row">
                                                        <div className="text-sm text-left">Current Password</div>
                                                        <Textfield placeholder="Currect Password" type="password"
                                                             onChange={(e) => {
                                                                 const newSetting = {...setting};
                                                                 newSetting.currPassword = e.currentTarget.value;
                                                                 setSetting(newSetting)
                                                             }}
                                                             value={setting.currPassword} />
                                                    </div>
                                                    <div className="row">
                                                    <div className="text-sm text-left">New Password</div>
                                                        <Textfield placeholder="New Password" type="password" 
                                                            onChange={(e) => {
                                                                const newSetting = {...setting};
                                                                newSetting.newPassword = e.currentTarget.value;
                                                                setSetting(newSetting)
                                                            }}
                                                            value={setting.newPassword} />
                                                    </div>
                                                    <div className="row">
                                                    <div className="text-sm text-left">Confirm New Password</div>
                                                        <Textfield placeholder="Confirm New Password" type="password" 
                                                            onChange={(e) => {
                                                                const newSetting = {...setting};
                                                                newSetting.confirmNewPassword = e.currentTarget.value;
                                                                setSetting(newSetting)
                                                            }}
                                                            value={setting.confirmNewPassword}/>
                                                    </div>
                                                    <div className="md:flex justify-end">
                                                        <button onClick={changePassword} className="rounded p-2 mt-3 cursor-pointer w-full md:w-auto md:px-8 border border-black">
                                                            Save
                                                        </button>
                                                        <div className="md:ml-3 sm: mt-3">
                                                            <Button onClick={() => {
                                                                setSettingModal(false);
                                                            }}>Close</Button>
                                                        </div>
                                                    </div>
                                                </div>

                                            </Modal>
                                            : <></>

                                        }
                                        {children}
                                    </React.Fragment>
                                </div>
                            </div>
                        </div>
                        <div className="flex-col w-3/12 max-w-md">
                            <div className="w-5/6 bg-white border  block">
                                <ul className="divide-y-2 divide-gray-100 p-5">
                                    <li className="hidden p-3 pb-5 md:flex">
                                        <div className="m-auto">
                                            <UserCircleIcon />
                                            <span>Profile</span>
                                        </div>
                                    </li>
                                    {/* <li className="p-3">
                                        <Link href="/dashboard" passHref>
                                            <NavItem
                                                icon={<ChartBarIcon className="w-7" />}>
                                                Dashboard
                                            </NavItem>
                                        </Link>
                                    </li> */}
                                    <li className="p-3" onClick={() => router.push("/classroom")}>
                                        
                                            <NavItem
                                                icon={<AcademicCapIcon className="w-7" />}>
                                                Classroom
                                            </NavItem>
                                        
                                    </li>
                                    <li className="p-3" onClick={() => setSettingModal(true)}>
                                        <NavItem
                                            icon={<AdjustmentsIcon className="w-7" />}>
                                            Setting
                                        </NavItem>

                                    </li>
                                    <li className="p-3" onClick={logout}>

                                        <NavItem
                                            icon={<LogoutIcon className="w-7 lg:hidden" />}
                                            alignCenter={true}>
                                            <span className="hidden md:block md:justify-center">Logout</span>
                                        </NavItem>

                                    </li>
                                </ul>
                            </div>

                        </div>

                    </div>
                </div>
            </div>

        </Page>
    )
}

type NavItemProps = {
    children: React.ReactNode,
    icon: JSX.Element
    alignCenter?: boolean
}

const NavItem = ({ children, icon, alignCenter }: NavItemProps): JSX.Element => {
    return (
        <div className={`flex-col w-full flex lg:flex-row text-gray-500 hover:text-black hover:cursor-pointer ${alignCenter ? "justify-center" : ""}`}>
            <div className="m-auto lg:m-0 lg:flex-col">
                {icon}
            </div>
            <div className="hidden lg:block lg:flex-col pl-3">
                {children}
            </div>
        </div>
    )
}

export default SystemPage;