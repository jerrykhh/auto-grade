
type LHSplitLayoutProps = {
    left: React.ReactNode,
    right: React.ReactNode
}

const LHSplitLayout = ({ left, right }: LHSplitLayoutProps): JSX.Element => {

    return (
        <div className="w-full flex h-screen items-center">
            <div className="w-full p-5 -mt-12 md:w-1/2 md:max-w-xl">
                {left}
            </div>
            <div className="hidden md:h-screen md:block md:w-1/2 lg:w-8/12 xl:flex-auto relative">
                {right}
            </div>
        </div>
    )

}

export default LHSplitLayout;