
const Loader = ({ show = true }: {show: boolean}): JSX.Element => {
    
    const loaderClassName = "h-2.5 w-2.5 bg-gray-800 rounded-full";

    return (
                show ?
                    <div className='flex m-auto justify-center'>
                        <div className={` ${loaderClassName} mr-1.5 animate-bounce`}></div>
                        <div className={` ${loaderClassName} mr-1.5 animate-bounce200`}></div>
                        <div className={` ${loaderClassName} animate-bounce400`}></div>
                    </div>
                    : <></>
    )
}


export default Loader