import { ChevronDownIcon } from "@heroicons/react/solid"
import { useRef, useState } from "react";

type AccordionProps = {
    title: string
    children?: React.ReactNode
}

const Accordion = ({title, children}: AccordionProps) :JSX.Element => {
    const [active, setActive] = useState(false);
    const [height, setHeight] = useState("0px");
    const [rotate, setRotate] = useState("transform duration-700 ease")
    const contentRef = useRef<HTMLDivElement>(null);

    const toggle = () => {
        setActive(active ? false : true)
        setHeight(active ? "0px" : `${contentRef?.current?.scrollHeight}px`)
        setRotate(active ? 'transform duration-700 ease' : 'transform duration-700 ease rotate-180')
    }


    return (
        <div className="flex flex-col">
            <button
                className="py-2 px-4 border-gray-500 box-border rounded-b-none border bg-gray-100 rounded-sm appearance-none cursor-pointer focus:outline-none flex items-center justify-between"
                onClick={toggle}
            >
                <p className="inline-block text-footnote light">{title}</p>
                <ChevronDownIcon className={`${rotate} w-6  text-gray-800`} />
            </button>

            <div
                ref={contentRef}
                style={{ height: height }}
                className={`overflow-hidden rounded-b-sm border-gray-400 border-r border-l transition-max-height duration-700 ease-in-out` + (active ? " border-b" : "")}
            >
                <div className="py-2 px-6">{children}</div>
            </div>

        </div>
    )
}
export default Accordion;