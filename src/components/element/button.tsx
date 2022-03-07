const Button = ({...props}: React.ButtonHTMLAttributes<HTMLButtonElement>) => {
    return (
        <button className="rounded text-white bg-black p-2 cursor-pointer w-full md:w-auto md:px-8 hover:bg-gray-900" {...props}/>
    )
}

export default Button;