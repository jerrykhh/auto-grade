import { useState } from "react"

type ModalProps = {
    header: string
    children: React.ReactNode
}

const Modal = ({header, children}: ModalProps):JSX.Element => {

    return (
        <div className={`flex absolute h-screen bg-black bg-opacity-70 inset-0 justify-center items-center z-10 overflow-y-scroll ${!open? 'hidden': ''}`}>
            <div className="bg-white p-10 rounded-md shadow-lg md:w-6/12 max-w-xl">
                {header?
                    <div className="font-bold text-2xl mb-2">{header}</div>
                        :<></>
                }
                {children}
            </div>
        </div>
    )
}

export default Modal