import { GraphQLResult } from "@aws-amplify/api-graphql";
import { withSSRContext, API, Auth, Storage } from "aws-amplify";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router"
import React, { useEffect, useState, useCallback } from "react";
import { FileRejection } from "react-dropzone";
import SystemPage from "../../components/customize/template/SystemPage";
import { ErrorAlert, SuccessAlert, WarningAlert } from "../../components/element/alert";
import UploadBox from "../../components/input/uploadbox";
import { AnswerSheet } from "../../interface/answersheet";
import { Classroom } from "../../interface/classroom";
import { Student } from "../../interface/student";
import { listReviewAnswerSheet, ListReviewAnswerSheetQuery } from "../../lib/answersheet/queries";
import { getClassroom } from "../../lib/classroom/queries";
import { updateStudent, UpdateStudentAnswerMutation, UpdateStudentMutation } from "../../lib/classroom/mutations";
import Table from "../../components/element/table";
import Accordion from "../../components/element/accordion";
import Modal from "../../components/element/modal";
import Link from "next/link";
import Button from "../../components/element/button";
import { CloudUploadIcon, EyeIcon, DocumentDownloadIcon, MailIcon } from "@heroicons/react/outline";
import { TrashIcon, DocumentReportIcon } from "@heroicons/react/solid";
import { downloadBlob } from "../../lib/download/downloadBlob"
import { UploadStudentAnswerSheet } from "../../lib/studentAnswer/mutation";
import awsconfig from "../../../aws-config";
import Loader from "../../components/element/loader";
import { publishStudentAnswerSheet, PublishStudentAnswerSheetMutation } from "../../lib/studentAnswerSheet/mutations";
import { removeAnswerSheet, RemoveAnswerSheetMutation } from "../../lib/answersheet/mutation";

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
    console.log("server");

    const { classroomId } = query;
    console.log(`cid: ${classroomId}`);

    const { Auth, API } = withSSRContext({ req });
    try {
        const identityId = await (await Auth.currentUserCredentials()).identityId;


        if (!identityId)
            throw new Error("Session not found");

        const res = {
            props: {
                room: {}
            }
        }
        console.log(res);

        try {
            const { data } = await API.graphql({
                query: getClassroom,
                variables: {
                    id: classroomId,
                    teacherId: identityId
                }
            });
            console.log(data);
            if (data.getClassroom == null) {
                return {
                    redirect: {
                        permanent: false,
                        destination: "/classroom",
                    },
                }
            }

            res.props.room = data.getClassroom;

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


const ClassroomDetailPage = ({ room }: { room: Classroom }) => {

    const router = useRouter();
    const { classroomId } = router.query;

    const [classroom, setClassroom] = useState<Classroom>(room)
    const [answerSheets, setAnswerSheets] = useState<Array<AnswerSheet>>([]);
    const [loadAnswerSheet, setLoadAnswerSheet] = useState<boolean>(true);
    const [portalErrMes, setPortalErrMes] = useState<String>("");
    const [portalSucMes, setPortalSucMes] = useState<String>("");

    const [publishModal, setPublishModal] = useState<boolean>(false);
    const [publishAnswerSheetId, setpublishAnswerSheetId] = useState<String>("");


    const [uploadModal, setUploadModal] = useState<boolean>(false);
    const [file, setFile] = useState<File | null>(null);

    const [modalErrMes, setModalErrMes] = useState<string>("");
    const [uploadStudentAnswerSheetId, setUploadStudentAnswerSheetId] = useState<String>("")

    const [removeModal, setRemoveModal] = useState<boolean>(false);
    const [removeSheetId, setRemoveSheetId] = useState<String>("");

    useEffect(() => {
        reloadAnswerSheet();
    }, [])

    const studentDataFileUpload = useCallback((accFiles: File[], rejectFiles: FileRejection[]) => {
        console.log("acc", accFiles);

        console.log("rej", rejectFiles);
        if (rejectFiles.length > 0)
            setPortalErrMes(`The file ${rejectFiles[0].file.name} is rejected`)
        else {

            const fileReader = new FileReader();
            fileReader.onload = (e) => {
                const data = e.target?.result;

                if (data)
                    csvConvert(data?.toString());
                else
                    setPortalErrMes("Read csv file failed, please try again.")
            }

            fileReader.readAsText(accFiles[0])

        }
    }, []);

    const csvConvert = (str: string, delim: string = ",") => {
        console.log("convert");

        const headers = str.slice(0, str.indexOf('\n')).split(delim);
        const rows = str.slice(str.indexOf('\n') + 1).split('\n');

        const ids: Array<String> = [];

        const students = rows.map(row => {

            const values = row.split(delim);
            const student = headers.reduce((obj: { [key: string]: string }, header, i) => {
                header = header.toLowerCase().trim().replace(/[^a-zA-Z ]/g, "");
                if (header.includes("id"))
                    header = "id"

                obj[header] = values[i].trim().replace("/\r?\n|\r/g", "");
                return obj;
            }, {})
            return student;
        })
        console.log("convert", students);
        uploadStudents(students as Student[])
    }

    const uploadStudents = async (students: Array<Student>) => {
        console.log(students);

        const identityId = await (await Auth.currentUserCredentials()).identityId;

        try {
            const { data } = await API.graphql({
                query: updateStudent,
                variables: {
                    teacherId: identityId,
                    id: classroomId,
                    student: students

                }
            }) as GraphQLResult<UpdateStudentMutation>

            if (!data?.uploadStudent.result)
                throw new Error(data?.uploadStudent.msg)

            const updatedClassroom = Object.assign({}, classroom);
            updatedClassroom.students = students;
            setClassroom(updatedClassroom)
            setPortalErrMes("");
        } catch (e) {
            setPortalErrMes(`Exception: ${e}`);
        }
    }


    const downloadStudentAnswerSheet = async (answerSheetId: String, classroomName: String) => {

        const result = await Storage.get(`${classroomId}/${answerSheetId}/student_ans_sheet-${classroomId}.pdf`, { download: true })
        const file_classroom = classroomName.replace(" ", "_");
        downloadBlob(result.Body, `student_ans_sheet-${file_classroom}.pdf`);

    }

    const fetechData = async () => {
        setLoadAnswerSheet(true)
        const { data } = await API.graphql({
            query: listReviewAnswerSheet,
            variables: {
                classroomId: classroomId
            }
        }) as GraphQLResult<ListReviewAnswerSheetQuery>
        if (data?.listAnswerSheet.items)
            setAnswerSheets(data?.listAnswerSheet.items);
        setLoadAnswerSheet(false);
    }

    const reloadAnswerSheet = async () => {
        initPortalMes();
        setAnswerSheets([]);
        fetechData();
    }

    const initPortalMes = () => {
        setPortalErrMes("")
        setPortalSucMes("");
    }

    const studentAnswerSheet2S3 = async () => {

        try {
            const identityId = await (await Auth.currentUserCredentials()).identityId;
            console.log(identityId);

            const uri = `${classroomId}/${uploadStudentAnswerSheetId}/stud_ans.pdf`;

            const res = await Storage.put(uri, file, {
                level: "private"
            })
            console.log(res);
            const { data } = await API.graphql({
                query: UploadStudentAnswerSheet,
                variables: {
                    classroomId: classroomId,
                    sheetId: uploadStudentAnswerSheetId,
                    teacherId: identityId,
                    file: {
                        bucket: awsconfig.Storage.AWSS3.bucket,
                        region: awsconfig.Storage.AWSS3.region,
                        uri: `private/${identityId}/${uri}`
                    }
                }
            }) as GraphQLResult<UpdateStudentAnswerMutation>

            console.log(data)
            if (data?.uploadStudentAnswer.result) {
                setPortalSucMes(`${uploadStudentAnswerSheetId}, ${data.uploadStudentAnswer.msg}`)
                setUploadModal(false);
                reloadAnswerSheet();
                setFile(null);
            }


        } catch (err) {
            setModalErrMes(`Upload Failed, ${err}`)
        }

    }


    const onDropFile = async (acceptedFiles: File[], fileRejections: FileRejection[]) => {
        initPortalMes();
        setFile(null);
        if (fileRejections.length >= 1)
            setModalErrMes(fileRejections[0].errors.toString())
        else
            setFile(acceptedFiles[0])

    }

    const publish = async () => {
        const answerSheetId = publishAnswerSheetId;
        const identityId = await (await Auth.currentUserCredentials()).identityId;

        const { data } = await API.graphql({
            query: publishStudentAnswerSheet,
            variables: {
                answerSheetId: answerSheetId,
                classroomId: classroomId,
                teacherId: identityId
            }
        }) as GraphQLResult<PublishStudentAnswerSheetMutation>

        if (data?.publishStudentAnswerSheet.result) {
            setPortalSucMes(`${data.publishStudentAnswerSheet.msg}`)
            setPublishModal(false);
            fetechData();
        } else
            setPortalErrMes(`Error. ${data!.publishStudentAnswerSheet.msg}`)
    }

    const toRemoveSheet = async () => {

        const { data } = await API.graphql({
            query: removeAnswerSheet,
            variables: {
                id: removeSheetId,
                classroomId: classroomId
            }
        }) as GraphQLResult<RemoveAnswerSheetMutation>

        console.log(data);


        if (data?.removeAnswerSheet.result) {
            setPortalSucMes(`${removeSheetId} is removed`);
            fetechData();
            setRemoveModal(false);
        } else {
            setPortalErrMes("Remove failed")
        }

    }



    return (
        <SystemPage
            headerTitle={`Clasroom - ${room.name}`}
            pageTitle={`Classroom - ${room.name}`}>
            {portalErrMes != "" ?
                <ErrorAlert
                    mes={portalErrMes} />
                : <></>
            }
            {portalSucMes != "" ?
                <SuccessAlert
                    mes={portalSucMes} />
                : <></>

            }
            {uploadModal ?
                <Modal
                    header="Upload Student Answer"
                >
                    <React.Fragment>
                        {modalErrMes != "" ?
                            <ErrorAlert
                                mes={modalErrMes} />
                            : <></>
                        }
                        <UploadBox
                            accept={[".pdf"]}
                            maxSize={100 * 1024 * 1024}
                            onDrop={onDropFile}
                            maxFiles={1}>

                            <React.Fragment>
                                <p>Please Drop the student answered file here</p>
                                <em>(Only *.pdf will be accepted)</em>
                            </React.Fragment>


                        </UploadBox>

                        {file != null ?
                            <div className="font-semibold mt-3">
                                {`Name: ${file?.name}, SIZE: ${file?.size}`}
                            </div>
                            : <></>

                        }
                        <div className="mt-3 text-right">
                            <div className="md:flex block justify-end">
                                <button onClick={studentAnswerSheet2S3} className="rounded p-2 mt-3 cursor-pointer w-full md:w-auto md:px-8 border border-black">
                                    Upload
                                </button>

                                <div className="md:ml-3 sm: mt-3">
                                    <Button onClick={() => setUploadModal(false)}>Close</Button>
                                </div>
                            </div>
                        </div>
                    </React.Fragment>

                </Modal>
                : <></>
            }
            {publishModal ?
                <Modal
                    header="Warning message">
                    if you confirm publish this answer sheet to student, please click Confirm. Answer sheet will not allow to modify if you click confirm after.
                    <div className="md:flex justify-end">
                        <button onClick={publish} className="rounded p-2 mt-3 cursor-pointer w-full md:w-auto md:px-8 border border-black">
                            Confirm
                        </button>
                        <div className="md:ml-3 sm: mt-3">
                            <Button onClick={() => setPublishModal(false)}>Close</Button>
                        </div>
                    </div>
                </Modal>
                : <></>
            }
            {removeModal ?
                <Modal
                    header="Remove Warning">
                    Do you confirm to remove this classroom?
                    <div className="md:flex justify-end mt-5">
                        <button onClick={toRemoveSheet} className="rounded p-2 mt-3 cursor-pointer w-full md:w-auto md:px-8 border border-black">
                            Confirm
                        </button>
                        <div className="md:ml-3 sm: mt-3">
                            <Button onClick={() => setRemoveModal(false)}>Close</Button>
                        </div>
                    </div>
                </Modal>
                : <></>
            }

            {classroom.students == null || classroom.students.length == 0 ?
                <React.Fragment>
                    <WarningAlert
                        mes={"Please upload the student data file to continue."} />
                    <div className="row">
                        <UploadBox
                            accept={[".csv"]}
                            maxSize={5 * 1024 * 1024}
                            onDrop={studentDataFileUpload}
                            maxFiles={1}
                        >
                            <React.Fragment>
                                <p>Please Drop the students file here</p>
                                <em>(Only *.csv will be accepted)</em>
                                <em>Please make sure the file contain studenId, name and email fields</em>
                            </React.Fragment>
                        </UploadBox>
                    </div>
                </React.Fragment>
                :

                <React.Fragment>
                    <div className="md:flex">
                        <Button onClick={() => router.push({
                            pathname: '/classroom/[classroomId]/upload/',
                            query: { classroomId: classroomId }
                        })}>Create Answer Sheet</Button>
                        <button className=" bg-gray-50 border border-gray-700 rounded p-2 w-full my-3 md:w-auto md:ml-5 md:my-0" onClick={() => reloadAnswerSheet()}>Reload</button>
                    </div>


                    <div className="row">
                        <Table
                            title="Answer Sheet">
                            <Table.Row>
                                <Table.HeaderCell>Name</Table.HeaderCell>
                                <Table.HeaderCell>Status</Table.HeaderCell>
                                <Table.HeaderCell>Action</Table.HeaderCell>
                            </Table.Row>
                            <Table.Body>
                                {answerSheets.length == 0 ?
                                    <Table.Row>
                                        <Table.Cell colSpan={3} className="text-center px-6 py-4 ">
                                            {loadAnswerSheet ?
                                                <div className="p-3">
                                                    <Loader show={loadAnswerSheet} />
                                                </div>
                                                :
                                                <span>No any data here</span>
                                            }
                                        </Table.Cell>
                                    </Table.Row>
                                    : answerSheets.map((sheet: AnswerSheet, index: number) => {
                                        return (
                                            <Table.Row key={index}>
                                                <Table.Cell>{sheet.name}</Table.Cell>
                                                {Number(sheet.status) < 1 ?
                                                    <Table.Cell>Failed</Table.Cell>
                                                    :
                                                    Number(sheet.status) == 5 || Number(sheet.status) == 10 || Number(sheet.status) == 12 ?
                                                        <Table.Cell>Completed</Table.Cell>
                                                        :
                                                        Number(sheet.status) == 7 ||  Number(sheet.status) == 9 ?
                                                            <Table.Cell>Detecting...</Table.Cell>
                                                            : Number(sheet.status) == 11 ?
                                                                <Table.Cell>Publishing...</Table.Cell>
                                                                : <Table.Cell>Prepareing...</Table.Cell>
                                                }
                                                <Table.Cell>
                                                    {Number(sheet.status) >= 5 ?
                                                        <React.Fragment>

                                                            {Number(sheet.status) == 7 || Number(sheet.status) == 11 || Number(sheet.status) == 9 ? 
                                                                <></> :
                                                                <Link href={Number(sheet.status) == 5 ? `./${classroomId}/${sheet.id}/config` : `./${classroomId}/${sheet.id}/`}>
                                                                    <a target="_blank">
                                                                        <button className="p-2  bg-violet-400 text-white rounded m-2">
                                                                            <div className="flex">
                                                                                <EyeIcon className="w-5" />
                                                                                <span>View</span>
                                                                            </div>
                                                                        </button>
                                                                    </a>
                                                                </Link>

                                                            }
                                                            {Number(sheet.status) >= 10 ?
                                                                <button className="p-2 bg-indigo-700 text-white rounded m-2" onClick={() => router.push(`./${classroomId}/${sheet.id}/report`)}>
                                                                    <DocumentReportIcon className="w-5" />
                                                                </button>
                                                                : <></>

                                                            }
                                                            {Number(sheet.status) == 10 ?


                                                                <button className="p-2 bg-orange-700 text-white rounded m-2" onClick={() => {
                                                                    setpublishAnswerSheetId(sheet.id);
                                                                    setPublishModal(true);
                                                                }}>
                                                                    <MailIcon className="w-5" />
                                                                </button>

                                                                : <></>

                                                            }


                                                            {Number(sheet.status) == 5 ?
                                                                <React.Fragment>
                                                                    <button className="p-2 bg-sky-400 text-white rounded m-2" onClick={() => {
                                                                        setUploadStudentAnswerSheetId(sheet.id);
                                                                        setUploadModal(true)
                                                                    }}>
                                                                        <CloudUploadIcon className="w-5" />
                                                                    </button>

                                                                    <button className="p-2 bg-black text-white rounded m-2" onClick={() => downloadStudentAnswerSheet(sheet.id, sheet.name)}>
                                                                        <DocumentDownloadIcon className="w-5" />
                                                                    </button>
                                                                </React.Fragment>
                                                                : <></>
                                                            }


                                                        </React.Fragment>
                                                        : <></>

                                                    }
                                                    {Number(sheet.status) != 1 && Number(sheet.status) <= 10 ?
                                                        <button className="p-2 bg-red-600 text-white rounded m-2" onClick={() => {
                                                            setRemoveModal(true);
                                                            setRemoveSheetId(sheet.id);
                                                        }}>
                                                            <TrashIcon className="w-5 " />
                                                        </button>
                                                        : <></>

                                                    }
                                                </Table.Cell>

                                            </Table.Row>
                                        )
                                    })
                                }
                            </Table.Body>
                        </Table>
                    </div>
                    <div className="row mt-5">
                        <Accordion
                            title="Students">
                            <Table>
                                <Table.Row>
                                    <Table.HeaderCell>Student ID</Table.HeaderCell>
                                    <Table.HeaderCell>Name</Table.HeaderCell>
                                    <Table.HeaderCell>Action</Table.HeaderCell>
                                </Table.Row>
                                <Table.Body>
                                    {!classroom.students || classroom.students.length == 0 ?
                                        <Table.Row>
                                            <Table.Cell colSpan={3} className="text-center px-6 py-4 ">
                                                <span>No any data here</span>
                                            </Table.Cell>
                                        </Table.Row>
                                        : classroom.students.map((student: Student, index: number) => {
                                            return (
                                                <Table.Row key={index}>
                                                    <Table.Cell>{student.id}</Table.Cell>
                                                    <Table.Cell>{student.name}</Table.Cell>
                                                    <Table.Cell></Table.Cell>
                                                </Table.Row>
                                            )
                                        })
                                    }
                                </Table.Body>
                            </Table>
                        </Accordion>
                    </div>
                </React.Fragment>
            }



        </SystemPage>
    )
}

export default ClassroomDetailPage;
