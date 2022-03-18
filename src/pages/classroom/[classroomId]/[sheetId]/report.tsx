import { GraphQLResult } from "@aws-amplify/api";
import { withSSRContext, API, Auth } from "aws-amplify";
import { GetServerSideProps } from "next"
import React, { useEffect, useState } from "react";
import SystemPage from "../../../../components/customize/template/SystemPage"
import Accordion from "../../../../components/element/accordion";
import { ErrorAlert } from "../../../../components/element/alert";
import Table from "../../../../components/element/table";
import { AnswerSheet, SKIP_TCODE } from "../../../../interface/answersheet";
import { Student } from "../../../../interface/student";
import { ReviewStudentAnswer, StudentAnswer, StudentStat } from "../../../../interface/studentAnswer";
import { getAnswerSheet, GetAnswerSheetQuery } from "../../../../lib/answersheet/queries";
import { getClassroomStudents } from "../../../../lib/classroom/queries";
import { getStudentStat, GetStudentStatQuery, listStudentAnswerData, ListStudentAnswerDataQuery, ListStudentAnswerQuery } from "../../../../lib/studentAnswer/queries";
import { listStudentAnswerSheet } from "../../../../lib/studentAnswerSheet/queries";
import InfiniteScroll from 'react-infinite-scroll-component';


import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import Button from "../../../../components/element/button";
import { useRouter } from "next/router";
import Loader from "../../../../components/element/loader";
import { StudentAnswerSheet } from "../../../../interface/studentAnswerSheet";

ChartJS.register(
    ArcElement,
    LinearScale,
    CategoryScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);


export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {

    const { classroomId, sheetId } = query;
    const { Auth, API } = withSSRContext({ req });

    try {
        const identityId = await (await Auth.currentUserCredentials()).identityId;
        if (!identityId)
            throw new Error("Session not found");

        const res = {
            props: {
                sub: identityId,
                totalStudent: 0,
                absStudents: {},
                answerSheet: {}
            }
        }

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
        const answerSheet = data.getAnswerSheet;
        const locates = [];
        for (const locate of data.getAnswerSheet.locate!) {
            let found = false
            for (const tcode of SKIP_TCODE) {
                if (tcode == locate.tcode)
                    found = true;
            }
            if (!found)
                locates.push(locate);
        }

        answerSheet.locate = locates;
        res.props.answerSheet = answerSheet;

        // attend
        // get classroom student 

        const classroomRes = await API.graphql({
            query: getClassroomStudents,
            variables: {
                id: classroomId,
                teacherId: identityId
            }
        })

        console.log(classroomRes);

        const students = classroomRes.data.getClassroom.students as Array<Student>;
        res.props.totalStudent = students.length;


        const locatedStudentRes = await API.graphql({
            query: listStudentAnswerSheet,
            variables: {
                answerSheetId: sheetId
            }
        })

        const locatedStudents = locatedStudentRes.data.listStudentAnswerSheet.items as Array<StudentAnswerSheet>;
        console.log(locatedStudents);

        const absStudent = [];
        for (const student of students) {
            let found = false;
            for (const located of locatedStudents) {
                if (located.studentId == student.id)
                    found = true;
            }
            if (!found)
                absStudent.push(student);
        }
        console.log("abs", absStudent);

        res.props.absStudents = absStudent;
        console.log(res);

        return res;

    } catch (err) {
        console.log(err);
        return {
            redirect: {
                permanent: false,
                destination: "/",
            },
            props: {},
        }
    }


}

type ReportStudentAnswerData = {
    [key: string]: Array<ReviewStudentAnswer>
}


const ReportPage = ({ totalStudent, absStudents, answerSheet }: { totalStudent: number, absStudents: Array<Student>, answerSheet: AnswerSheet }) => {

    const router = useRouter();
    const { classroomId, sheetId } = router.query;

    const [currQuestionIdx, setCurrQuestionIdx] = useState<number>(0);
    const [studentAnswer, setStudentAnswer] = useState<ReportStudentAnswerData>({});

    const [portalErrMes, setPortalErrMes] = useState<String>("");

    const [statStudent, setStatStudent] = useState<Array<StudentStat>>([]);
    const [statStudentLoading, setStatStudentLoading] = useState<boolean>(true);



    const fetechStudentStat = async () => {
        setStatStudentLoading(true);
        console.log("student stat");

        const { data } = await API.graphql({
            query: getStudentStat,
            variables: {
                sheetId: sheetId,
                classroomId: classroomId
            }
        }) as GraphQLResult<GetStudentStatQuery>
        console.log(data);

        if (data?.getStat.items) {
            setStatStudent(data.getStat.items)
            setStatStudentLoading(false);
        }
        setStatStudentLoading(false);
    }

    const fetechQuestion = async () => {
        console.log("idx", currQuestionIdx);

        if (currQuestionIdx < answerSheet.locate!.length) {
            const qid = answerSheet.locate![currQuestionIdx].qid;

            const { data } = await API.graphql({
                query: listStudentAnswerData,
                variables: {
                    questionId: qid,
                    limit: 100
                }
            }) as GraphQLResult<ListStudentAnswerDataQuery>

            console.log(data);

            if (data?.listStudentAnswer.items) {
                const tmpQuestion = { ...studentAnswer }
                tmpQuestion[qid] = data.listStudentAnswer.items

                setStudentAnswer(tmpQuestion);
                setCurrQuestionIdx(currQuestionIdx + 1)
                console.log("set", studentAnswer);

            }
        }

    }

    const getStudentAnswerSize = () => {
        let count = 0;
        for (const key in studentAnswer)
            count += studentAnswer[key].length;
        return count;
    }

    const mcQuestionExtract = (answers: Array<StudentAnswer | ReviewStudentAnswer>): { [key: string]: number } => {
        const result: { [key: string]: number } = {};

        for (const answer of answers) {
            const data = answer.answer.toUpperCase().trim();
            if (!(data in result)) {
                if (data != "")
                    result[data] = 1;
                else {
                    result["no answer"] = 1;
                }
            } else {
                if (data != "")
                    result[data]++;
                else
                    result["no answer"]++;
            }

        }

        return result;

    }

    const essayQuestionExtract = (baseMark: number, answers: Array<StudentAnswer | ReviewStudentAnswer>): { [key: string]: number } => {

        const result: { [key: string]: number } = {
            ">=85%": 0,
            ">=65% and <85%": 0,
            ">=40% and <65%": 0,
            "<39%": 0
        };

        for (const answer of answers) {

            if (answer.grade >= baseMark * 0.85) {
                result[">=85%"]++;
            } else if (answer.grade >= baseMark * 0.65) {
                result[">=65% and <85%"]++;
            } else if (answer.grade >= baseMark * 0.4) {
                result[">=40% and <65%"]++;
            } else {
                result["<39%"]++;
            }

        }
        return result;

    }

    const statExtract = (data: Array<StudentStat>) => {
        const result: { [key: string]: number } = {
            ">=85%": 0,
            ">=65% and <85%": 0,
            ">=40% and <65%": 0,
            "<39%": 0
        };

        for (const std of data) {
            if (std.grade >= 85) {
                result[">=85%"]++;
            } else if (std.grade >= 65) {
                result[">=65% and <85%"]++;
            } else if (std.grade >= 40) {
                result[">=40% and <65%"]++;
            } else {
                result["<39%"]++;
            }
        }

        const labels = Object.keys(result);
        const chartDatasetData = Object.values(result);

        const chartData = {
            labels,
            datasets: [
                {
                    label: 'Grade Distribution',
                    data: chartDatasetData,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.2)',
                        'rgba(54, 162, 235, 0.2)',
                        'rgba(255, 206, 86, 0.2)',
                        'rgba(75, 192, 192, 0.2)',
                        'rgba(153, 102, 255, 0.2)',
                        'rgba(255, 159, 64, 0.2)',
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)',
                    ],
                    borderWidth: 1,
                }
            ]
        }

        return <Pie data={chartData} width={"50%"} className="md:max-w-max" />;
    }

    const getQuestion = (qid: string) => {
        for (const locate of answerSheet.locate!) {
            if (locate.qid == qid)
                return locate;
        }

    }

    useEffect(() => {
        fetechQuestion();
        fetechStudentStat();
    }, [])


    return (
        <SystemPage
            headerTitle={`Report`}
            pageTitle={`Report`}>

            <React.Fragment>

                {portalErrMes != "" ?
                    <ErrorAlert mes={portalErrMes} />
                    : <></>

                }
                <div className="my-3">
                    <Button onClick={() => router.back()}>Back</Button>
                </div>
                <div className="border p-5">
                    <h3 className=" text-2xl font-bold">Name: {answerSheet.name}</h3>
                    <div className="text-gray-600">
                        <p>Type: {answerSheet.type == 1 ? "Auto" : "Manually"}</p>
                        <p>Total Student: {totalStudent} (attend: {totalStudent - absStudents.length}, abs: {absStudents.length})</p>
                        <p>Total Mark: {answerSheet.locate?.map(item => item.mark).reduce((pre, next) => pre + next)}</p>
                    </div>
                    {absStudents.length > 0 ?
                        <div className="my-5">
                            <Accordion
                                title="ABS Students">
                                <Table>
                                    <Table.Row>
                                        <Table.HeaderCell>Student ID</Table.HeaderCell>
                                        <Table.HeaderCell>Name</Table.HeaderCell>
                                        <Table.HeaderCell>Email</Table.HeaderCell>
                                    </Table.Row>
                                    {absStudents.map((student, index) => {
                                        return (
                                            <Table.Row key={index}>
                                                <Table.Cell>{student.id}</Table.Cell>
                                                <Table.Cell>{student.name}</Table.Cell>
                                                <Table.Cell>{student.email}</Table.Cell>
                                            </Table.Row>
                                        )
                                    })
                                    }
                                </Table>
                            </Accordion>
                        </div>
                        : <></>
                    }
                    <div className="my-5">
                        <Accordion
                            title="Graded Result">
                            <React.Fragment>
                                <div className="my-4">
                                    <Table>
                                        <Table.Row>
                                            <Table.HeaderCell>Student ID</Table.HeaderCell>
                                            <Table.HeaderCell>Grade</Table.HeaderCell>
                                        </Table.Row>
                                        {statStudentLoading ?
                                            <Table.Row>
                                                <Table.HeaderCell colSpan={2}>
                                                    <div className="p-2">
                                                        <Loader show={statStudentLoading} />
                                                    </div>
                                                </Table.HeaderCell>
                                            </Table.Row>
                                            : statStudent.map((student, i) => {
                                                return (
                                                    <Table.Row key={i}>
                                                        <Table.Cell>{student.studentId}</Table.Cell>
                                                        <Table.Cell>{student.grade}</Table.Cell>
                                                    </Table.Row>
                                                )
                                            })

                                        }
                                    </Table>
                                </div>
                                <div className="my-2">
                                    <div className="sm:mt-4 md:flex justify-center">
                                        <div className="md:w-1/2">
                                            {statExtract(statStudent)}
                                        </div>
                                    </div>
                                </div>
                            </React.Fragment>
                        </Accordion>
                    </div>

                    <InfiniteScroll
                        dataLength={getStudentAnswerSize()} //This is important field to render the next data
                        next={fetechQuestion}
                        //hasMore={false}
                        hasMore={(currQuestionIdx < answerSheet.locate!.length ? true : false)}
                        loader={<div className="w-full p-5"> <Loader show={true} /></div>}
                        endMessage={
                            <p className="w-full text-center p-2">
                                <span>- End -</span>
                            </p>
                        }
                    >

                        {Object.keys(studentAnswer).map((key: string, i) => {

                            const studentAns = studentAnswer[key];
                            const question = getQuestion(key);

                            let chart = (
                                <div>Error</div>
                            )
                            // mc
                            if (question!.answer_type == 1) {
                                const data = mcQuestionExtract(studentAns);
                                const labels = Object.keys(data);
                                const chartDatasetData = Object.values(data);
                                const chartData = {
                                    labels,
                                    datasets: [
                                        {
                                            label: 'Student Answer',
                                            data: chartDatasetData,
                                            backgroundColor: 'rgba(0, 0, 0, 0.8'
                                        }
                                    ]

                                }
                                chart = (
                                    <div className="w-full sm:mt-4 md:p-12 md:mt-0">
                                        <Bar options={{
                                            responsive: true
                                        }}
                                            data={chartData} />
                                    </div>)

                            } else {
                                const data = essayQuestionExtract(question!.mark, studentAns);
                                const labels = Object.keys(data);
                                const chartDatasetData = Object.values(data);
                                console.log("pie", data, chartDatasetData);

                                const chartData = {
                                    labels,
                                    datasets: [
                                        {
                                            label: 'Grade Distribution',
                                            data: chartDatasetData,
                                            backgroundColor: [
                                                'rgba(255, 99, 132, 0.2)',
                                                'rgba(54, 162, 235, 0.2)',
                                                'rgba(255, 206, 86, 0.2)',
                                                'rgba(75, 192, 192, 0.2)',
                                                'rgba(153, 102, 255, 0.2)',
                                                'rgba(255, 159, 64, 0.2)',
                                            ],
                                            borderColor: [
                                                'rgba(255, 99, 132, 1)',
                                                'rgba(54, 162, 235, 1)',
                                                'rgba(255, 206, 86, 1)',
                                                'rgba(75, 192, 192, 1)',
                                                'rgba(153, 102, 255, 1)',
                                                'rgba(255, 159, 64, 1)',
                                            ],
                                            borderWidth: 1,
                                        }
                                    ]
                                }
                                chart = (
                                    <div className="sm:mt-4 md:flex justify-center">
                                        <div className="md:w-1/2">
                                            <Pie data={chartData} width={"50%"} className="md:max-w-max" />

                                        </div>
                                    </div>
                                )
                            }

                            return (
                                <React.Fragment key={i}>
                                    <div className="p-5 border my-5">
                                        <div className="font-bold text-lg">Question ID: {question?.qid}</div>
                                        <p>{question?.answer_type == 1 ? "MC Question" : "Essay Question"}</p>
                                        <p>Code: {question?.tcode}</p>
                                        <p>Mark: {question?.mark}</p>
                                        <p>Correct Answer: {question?.answer}</p>
                                        {chart}
                                    </div>

                                </React.Fragment>
                            )
                        })

                        }



                    </InfiniteScroll>


                </div>

            </React.Fragment>


        </SystemPage>
    )


}

export default ReportPage;