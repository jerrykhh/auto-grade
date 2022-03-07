const TextArea = ({...props}: React.HTMLProps<HTMLTextAreaElement>): JSX.Element => {
    return (
        <textarea 
            className="appearance-none border-gray-300 border rounded w-full py-2 px-3 text-gray-700 mt-1 leading-tight focus:outline-black"
            {...props}
            >
        </textarea>
    )
}

export default TextArea