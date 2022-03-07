import {useDropzone, DropzoneOptions} from 'react-dropzone'


interface customizeDropzoneProps extends DropzoneOptions {
    className?: string,
    children?: React.ReactNode
}

const UploadBox = ({...props}: customizeDropzoneProps): JSX.Element => {

    const {
        acceptedFiles,
        getRootProps,
        getInputProps,
    } = useDropzone({...props});

    if (!props.className)
        props.className = "border-dashed border  border-gray-400 py-24 md:py-18 px-8 text-center flex flex-col justify-center items-center"

    return (
        <section className="container cursor-pointer">
            <div {...getRootProps({ className: props.className })}>
                <input {...getInputProps()} /> 
                {props.children}
            </div>
        </section>
    );
}

export default UploadBox;