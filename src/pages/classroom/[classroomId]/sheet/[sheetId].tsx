/* eslint-disable @next/next/no-img-element */
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { withSSRContext, API, Auth, Storage } from "aws-amplify";
import { GetServerSideProps } from "next";
import Image, { ImageProps } from "next/image";
import { useRouter } from "next/router";
import React, { HTMLProps, useEffect, useRef, useState } from "react";
import Loader from "../../../../components/element/loader";
import { DropdownItem, DropdownList } from "../../../../components/input/dropdown";
import TextArea from "../../../../components/input/textarea";
import Page from "../../../../components/layout/Page";
import { AnswerSheet } from "../../../../interface/answersheet";
import { getAnswerSheet, GetAnswerSheetQuery } from "../../../../lib/answersheet/queries";

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
    const { sheetId, classroomId } = query;
    console.log(sheetId, classroomId);

    const { Auth, API } = withSSRContext({ req });
    try {
        const user = await Auth.currentAuthenticatedUser();

        if (!user)
            throw new Error("Session not found");

        const res = {
            props: {
                sub: user.attributes.sub,
                sheet: {}
            }
        }
        try {

            const { data } = await API.graphql({
                query: getAnswerSheet,
                variables: {
                    id: sheetId,
                    classroomId: classroomId
                }
            }) as GraphQLResult<GetAnswerSheetQuery>

            if (data?.getAnswerSheet == null) {
                return {
                    redirect: {
                        permanent: false,
                        destination: `/classroom/${classroomId}`,
                    },
                }
            }

            res.props.sheet = data.getAnswerSheet;


        } catch (e) {
            console.log(e);

        }
        return res;

    } catch (e) {
        console.log(` ${e}`);
        return {
            redirect: {
                permanent: false,
                destination: "/",
            },
            props: {},
        }
    }
}

const SheetDetailPage = ({ sub, sheet }: { sub: string, sheet: AnswerSheet }) => {
    const router = useRouter();
    const { classroomId, sheetId } = router.query;
    const [answerSheet, setAnswerSheet] = useState<AnswerSheet>(sheet);

    const headerRef = useRef<HTMLDivElement>();
    const bodyRef = useRef<HTMLDivElement>();
    const skipTcodes = ["studentid", "classroom", "name", "code"];


    const bodyOffsetY = () => {
        bodyRef.current!.style.marginTop = headerRef.current?.clientHeight + "px";

    }

    useEffect(() => {
        bodyOffsetY()
    }, []);


    return (
        <Page
            headerTitle={"Answer Sheet"}>
            <React.Fragment>
                <div ref={headerRef as React.LegacyRef<HTMLDivElement>} className="fixed top-0 p-3 bg-gray-100 border-b border-gray-300 w-full">
                    <div className="text-lg font-semibold">
                        {answerSheet.name}
                    </div>
                    {/* <div className="text-sm font-light">
                        created: {answerSheet.create_date}
                    </div> */}
                </div>
                <div ref={bodyRef as React.LegacyRef<HTMLDivElement>} className="p-5">
                    <div className="container m-auto max-w-6xl">
                        {answerSheet.locate && answerSheet.locate.length > 0 ?

                            answerSheet.locate.map((sheet, index) => {
                                if (!skipTcodes.includes(sheet.tcode.toLowerCase())) {
                                    return (
                                        <div className="w-full md:flex mb-10">
                                            <div className="sm:w-full md:flex-col md:w-8/12 md:mr-4">
                                                <SheetImageView src={`${sub}/${classroomId}/${sheetId}/${sheet.qid}.jpg`} />
                                            </div>
                                            <div className="sm:w-full md:flex-col md:w-4/12 border-gray-300 bg-gray-100 md:border p-5 sm:border-t-0">
                                                <div className="row">
                                                    <span className="font-semibold">T_code:</span> {`${sheet.tcode}`}
                                                </div>
                                                <div className="row mt-3">
                                                    <span className="font-semibold">Question Type:</span>
                                                    <div className="block">
                                                        <DropdownList>
                                                            <DropdownItem value={1}>MC Question</DropdownItem>
                                                            <DropdownItem value={2}>Essay Quesion</DropdownItem>
                                                        </DropdownList>
                                                    </div>
                                                </div>
                                                <div className="row">
                                                    <span className="font-semibold">Model Answer:</span>
                                                    <TextArea rowSpan={5} colSpan={5} placeholder="Answer" />
                                                </div>
                                            </div>
                                        </div>
                                    )
                                }
                            })
                            : <></>

                        }
                    </div>
                </div>

            </React.Fragment>
        </Page>
    )
}

const SheetImageView = ({ ...props }: ImageProps): JSX.Element => {

    const [loading, setLoading] = useState<boolean>(true);
    const [src, setSrc] = useState<string>();

    useEffect(() => {

        const getImageURL = async () => {
            const signedUrl = await Storage.get(props.src as string);
            console.log(signedUrl);
            setLoading(false);
            setSrc(signedUrl)

        }
        getImageURL();
    }, [src])

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


export default SheetDetailPage;