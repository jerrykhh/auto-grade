import Page from "../../layout/Page"
import { AdjustmentsIcon, AcademicCapIcon, UserCircleIcon, LogoutIcon, ChartBarIcon } from '@heroicons/react/solid'
import Link from "next/link"

type SystemPageProps = {
    headerTitle: string | String
    pageTitle: string | String
    children: React.ReactNode,
}


const SystemPage = ({ children, headerTitle, pageTitle }: SystemPageProps): JSX.Element => {
    
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
                                    {children}
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
                                    <li className="p-3">
                                        <Link href="/classroom" passHref>
                                            <NavItem
                                                icon={<AcademicCapIcon className="w-7" />}>
                                                Classroom
                                            </NavItem>
                                        </Link>
                                    </li>
                                    <li className="p-3">
                                        <Link href="/setting" passHref>
                                            <NavItem
                                                icon={<AdjustmentsIcon className="w-7" />}>
                                                Setting
                                            </NavItem>
                                        </Link>
                                    </li>
                                    <li className="p-3">
                                        <Link href="/logout" passHref>
                                        <NavItem
                                                icon={<LogoutIcon className="w-7 lg:hidden" />}
                                                alignCenter={true}>
                                                <span className="hidden md:block md:justify-center">Logout</span>
                                        </NavItem>
                                    </Link>
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
        <div className={`flex-col w-full flex lg:flex-row text-gray-500 hover:text-black hover:cursor-pointer ${alignCenter? "justify-center": ""}`}>
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