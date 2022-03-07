import { GraphQLResult } from "@aws-amplify/api-graphql";
import { withSSRContext, API, Auth, Storage } from "aws-amplify";
import { GetServerSideProps, NextPage } from "next";
import { useRouter } from "next/router"
import React, { useEffect, useState, useCallback } from "react";
import { FileRejection } from "react-dropzone";
import SystemPage from "../../components/customize/template/SystemPage";
import { ErrorAlert, WarningAlert } from "../../components/element/alert";
import UploadBox from "../../components/input/uploadbox";
import { AnswerSheet } from "../../interface/answersheet";
import { Classroom } from "../../interface/classroom";
import { Student } from "../../interface/student";
import { listReviewAnswerSheet, ListReviewAnswerSheetQuery } from "../../lib/answersheet/queries";
import { getClassroom } from "../../lib/classroom/queries";
import { updateStudent, UpdateStudentMutation } from "../../lib/classroom/mutations";
import Table from "../../components/element/table";
import Accordion from "../../components/element/accordion";
import Link from "next/link";
import Button from "../../components/element/button";
import { CloudUploadIcon, EyeIcon, DocumentDownloadIcon } from "@heroicons/react/outline";
import { TrashIcon } from "@heroicons/react/solid";
import {downloadBlob} from "../../lib/download/downloadBlob"

export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
    console.log("server");

    const { classroomId } = query;
    console.log(`cid: ${classroomId}`);

    const { Auth, API } = withSSRContext({ req });
    try {
        const user = await Auth.currentAuthenticatedUser();

        if (!user)
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
                    teacherId: user.attributes.sub
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
    const [portalErrMes, setPortalErrMes] = useState<String>("");

    useEffect(() => {
        async function getAnswerSheets() {
            const { data } = await API.graphql({
                query: listReviewAnswerSheet,
                variables: {
                    classroomId: classroomId
                }
            }) as GraphQLResult<ListReviewAnswerSheetQuery>
            if (data?.listAnswerSheet.items)
                setAnswerSheets(data?.listAnswerSheet.items);
        }
        getAnswerSheets();
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

        const user = await Auth.currentAuthenticatedUser();
        try {
            const { data } = await API.graphql({
                query: updateStudent,
                variables: {
                    teacherId: user.attributes.sub,
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
        const user = await Auth.currentAuthenticatedUser();
        const result = await Storage.get(`${user.attributes.sub}/${classroomId}/${answerSheetId}/student_ans_sheet-${classroomId}.pdf`, { download: true })
        const file_classroom = classroomName.replace(" ", "_");
        downloadBlob(result.Body, `student_ans_sheet-${file_classroom}.pdf`);
        
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
                    <Button onClick={() => router.push({
                        pathname: '/classroom/[classroomId]/sheet',
                        query: { classroomId: classroomId }
                    })}>Create Answer Sheet</Button>
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
                                            <span>No any data here</span>
                                        </Table.Cell>
                                    </Table.Row>
                                    : answerSheets.map((sheet: AnswerSheet, index: number) => {
                                        return (
                                            <Table.Row key={index}>
                                                <Table.Cell>{sheet.name}</Table.Cell>
                                                {Number(sheet.status) < 1 ?
                                                    <Table.Cell>Failed</Table.Cell>
                                                    :
                                                    Number(sheet.status) == 5 ?
                                                        <Table.Cell>Completed</Table.Cell>
                                                        : <Table.Cell>Preparing...</Table.Cell>
                                                }
                                                <Table.Cell>
                                                    {Number(sheet.status) < 1 ?

                                                        <button className="p-3 bg-orange-400 text-white rounded">
                                                            <CloudUploadIcon className="w-5" /> Upload Answer Sheet
                                                        </button>

                                                        : Number(sheet.status) == 5 ?
                                                            <React.Fragment>

                                                                <button className="p-2  bg-violet-400 text-white rounded m-2">
                                                                    <div className="flex">
                                                                        <EyeIcon className="w-5" />
                                                                        <span>View</span>
                                                                    </div>
                                                                </button>

                                                                <button className="p-2 bg-sky-400 text-white rounded m-2">
                                                                    <CloudUploadIcon className="w-5" />
                                                                </button>

                                                                <button className="p-2 bg-black text-white rounded m-2" onClick={() => downloadStudentAnswerSheet(sheet.id, sheet.name)}>
                                                                    <DocumentDownloadIcon className="w-5"/>
                                                                </button>

                                                            </React.Fragment>
                                                            : <></>

                                                    }
                                                    {Number(sheet.status) != 1 ?
                                                        <button className="p-2 bg-red-600 text-white rounded m-2">
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