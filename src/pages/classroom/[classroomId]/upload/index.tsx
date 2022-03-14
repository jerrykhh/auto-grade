import { DocumentAddIcon } from "@heroicons/react/solid";
import Amplify, { API, Auth, Storage } from "aws-amplify";
import { GraphQLResult } from "@aws-amplify/api";
import { useRouter } from "next/router";
import React, { useCallback } from "react";
import { useState } from "react";
import { FileRejection } from "react-dropzone";
import SystemPage from "../../../../components/customize/template/SystemPage";
import { ErrorAlert, SuccessAlert } from "../../../../components/element/alert";
import Button from "../../../../components/element/button";
import UploadBox from "../../../../components/input/uploadbox";
import { v4 as uuidv4 } from 'uuid';
import { PutResult } from "@aws-amplify/storage";
import Textfield from "../../../../components/input/textfield";
import Loader from "../../../../components/element/loader";
import { CreateAnswerSheet, CreateAnswerSheetMutation } from "../../../../lib/answersheet/mutation"
import awsconfig from "../../../../../aws-config";
import { DropdownItem, DropdownList } from "../../../../components/input/dropdown";


const AnswerSheetCreatePage = () => {

    const router = useRouter();
    const { classroomId } = router.query;
    // 0 -
    const [optionType, setOptionType] = useState<number>(0);
    const [portalErrMes, setPortalErrMes] = useState<String>("");
    const [portalSucMes, setPorltaSucMes] = useState<String>("");
    const [uploadFile, setUploadFile] = useState<File>();
    const [loading, setLoading] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const [qType, setQtype] = useState<String>("1");

    const pdfFileUpload = useCallback((accFiles: File[], rejectFiles: FileRejection[]) => {
        console.log("acc", accFiles);
        console.log("rej", rejectFiles);
        setPortalErrMes("");
        setPorltaSucMes("");
        if (rejectFiles.length > 0)
            setPortalErrMes(rejectFiles[0].errors.toString());
        else if (accFiles[0].type != "application/pdf")
            setPortalErrMes("Please upload the PDF file")
        else
            setUploadFile(accFiles[0]);
    }, []);

    const uploadFile2S3 = async () => {
        console.log("upload");
        setPortalErrMes("");
        setPorltaSucMes("");

        if (name == "" || qType == "" || !uploadFile) {
            setPortalErrMes("Some fields is missing, please check");
            return;
        }

        setLoading(true);
        const id = uuidv4();
        // try{
        const identityId = await (await Auth.currentUserCredentials()).identityId;
        try {
            const s3Obj = await Storage.put(`${classroomId}}/${id}.pdf`, uploadFile, {
                level: "private"
            });
            console.log(s3Obj.key);

            if (s3Obj.key) {

                const { data } = await API.graphql({
                    query: CreateAnswerSheet,
                    variables: {
                        teacherId: identityId,
                        classroomId: classroomId,
                        name: name,
                        type: Number(qType),
                        file: {
                            bucket: awsconfig.Storage.AWSS3.bucket,
                            region: awsconfig.Storage.AWSS3.region,
                            uri: `private/${identityId}/${classroomId}}/${id}.pdf`
                        }
                    }
                }) as GraphQLResult<CreateAnswerSheetMutation>
                console.log(data);
                setLoading(false)
                if (data?.createAnswerSheet.result) {
                    setPorltaSucMes(`Answer sheet ${name} is created, now redirect to classroom page.`)
                    setTimeout(() => {
                        console.log("back");
                        router.back()
                    }, 3000)
                } else {
                    setPortalErrMes(data?.createAnswerSheet.msg as String);
                }
            }
        } catch (e) {
            setLoading(false)
            setPortalErrMes(`Exception: ${e}`)
        }

        // Storage.put(`${user.attributes.sub}/${id}.txt`, "Hello world")
        //     .then((value: PutResult) => {
        //         router.back();
        //     })
        //     .catch((e) => {
        //         setPortalErrMes(e);
        //     })
        // }catch(e){
        //     console.log(e);

        // }
    }

    return (
        <SystemPage
            headerTitle={"Classroom - Create AnswerSheet"}
            pageTitle={"Create Answersheet Page"}>
            <div className="row mt-5">
                <Button onClick={() => router.back()}>Back</Button>
            </div>

            {portalErrMes != "" ?
                <div className="row">
                    <ErrorAlert
                        mes={portalErrMes} />
                </div>
                : <></>
            }
            {portalSucMes != "" ?
                <div className="row">
                    <SuccessAlert
                        mes={portalSucMes} />
                </div>
                : <></>

            }
            {loading ?
                <div className="row">
                    <Loader show={loading} />
                </div>
                : <></>
            }

            <div className="container">
                <div className="row mt-5">
                    <span>Grading type: </span>
                    <DropdownList onChange={(e) => {
                        setQtype(e.currentTarget.value);
                    }}>
                        <DropdownItem value={1}>auto</DropdownItem>
                        <DropdownItem value={0}>manually</DropdownItem>
                    </DropdownList>
                </div>
                <div className="row">
                    <span>Name:</span>
                    <Textfield type="text" placeholder="Answer Sheet Name (quiz/exam/etc)" value={name} onChange={(e) => setName(e.currentTarget.value)} className="appearance-none border border-gray-300 rounded w-full py-2 px-3 text-gray-700 mt-1 leading-tight focus:outline-black md:w-5/12 block" />
                </div>
                <div className="row mt-2">
                    <span>Please upload the Answer sheet file:</span>
                    <div className="row">
                        {/* <Button
                            onClick={() => setOptionType(0)}
                            className={optionType == 0 ? "text-white bg-black rounded-sm border-gray-400 border py-2" : "text-gray-300 hover:text-white hover:border-gray-400 hover:bg-gray-400  border-gray-300 border rounded"}>
                            <div className="p-6 text-left">
                                <DocumentAddIcon className="w-8 mb-4" />
                                <div className="font-semibold">
                                    Upload File: A4 size
                                </div>
                            </div>
                        </Button> */}
                    </div>
                    <div className="row">
                        <UploadBox
                            accept={[".pdf"]}
                            maxSize={5 * 1024 * 1024}
                            onDrop={pdfFileUpload}
                            maxFiles={1}
                        >
                            <React.Fragment>
                                <p>Please Drop the pdf file here</p>
                                <em>(Only *.pdf will be accepted)</em>
                            </React.Fragment>
                        </UploadBox>
                        {uploadFile?  
                            <div className="mt-4 font-semibold text-md">FILE: {uploadFile.name}, SIZE: {uploadFile.size}</div>
                            :<></>
                        }
                    </div>
                </div>
                <div className="row md:text-right">
                    <button className="w-full p-2 px-4 border bg-white rounded border-black md:w-fit" onClick={uploadFile2S3}>Upload</button>
                </div>
            </div>

        </SystemPage>
    )
}

export default AnswerSheetCreatePage;