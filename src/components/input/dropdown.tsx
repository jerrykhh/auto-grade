const DropdownList = ({...props}: React.HTMLProps<HTMLSelectElement>) => {
    return (
        <select className="border px-2 py-1 rounded border-gray-300 bg-white focus:outline-black" {...props}></select>
    )
}

const DropdownItem = ({...props}: React.HTMLProps<HTMLOptionElement>) => {
    return (
        <option {...props}></option>
    )
}

export {DropdownList, DropdownItem};