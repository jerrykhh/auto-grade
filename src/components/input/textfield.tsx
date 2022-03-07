
const Textfield = ({...props}: React.HTMLProps<HTMLInputElement>) => {
    
    return (
        !props.className?
            <input {...props} className="appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 mt-1 leading-tight focus:outline-black" />
            : <input {...props} />
    )
}

export default Textfield;