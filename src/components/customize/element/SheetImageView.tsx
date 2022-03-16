/* eslint-disable @next/next/no-img-element */
import { ImageProps } from "next/image";
import React from "react";
import { useEffect, useState } from "react";
import Loader from "../../element/loader";
import { Storage } from "aws-amplify";

const SheetImageView = ({ ...props }: ImageProps): JSX.Element => {

    const [loading, setLoading] = useState<boolean>(true);
    const [src, setSrc] = useState<string>();

    useEffect(() => {
        getImageURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const getImageURL = async () => {
        const signedUrl = await Storage.get(props.src as string);
        console.log(signedUrl);
        setLoading(false);
        setSrc(signedUrl)

    }

    return (
        <React.Fragment>
            <div className="p-5 border border-gray-300 bg-gray-100">
            {loading ?
                    <div className="p-5">
                        <Loader show={loading} />
                    </div>
                    :
                    <div className="max-w-full h-auto">
                        <img src={src as string} className="object-contain block m-auto border border-black" alt={props.alt} />
                    </div>
                }
            </div>

        </React.Fragment >
    )

}

export default SheetImageView;