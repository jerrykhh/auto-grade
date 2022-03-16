import { API, Auth, withSSRContext } from "aws-amplify";
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { GetServerSideProps } from "next";
import { getAnswerSheet, GetAnswerSheetQuery } from "../../../../lib/answersheet/queries";
import { AnswerSheet, SKIP_TCODE } from "../../../../interface/answersheet";
import Page from "../../../../components/layout/Page";
import React, { useEffect, useRef, useState } from "react";
import router, { useRouter } from "next/router";
import { XIcon } from "@heroicons/react/solid";
import { Grading, StudentAnswer } from "../../../../interface/studentAnswer";
import { listStudentAnswer, ListStudentAnswerQuery } from "../../../../lib/studentAnswer/queries";
import Loader from "../../../../components/element/loader";
import InfiniteScroll from 'react-infinite-scroll-component';
import { SaveStudentAnswer, SaveStudentAnswerSheetMutation } from "../../../../lib/studentAnswer/mutation";
import SheetImageView from "../../../../components/customize/element/SheetImageView";


export const getServerSideProps: GetServerSideProps = async ({ req, query }) => {
    const { sheetId, classroomId } = query;
    console.log(sheetId, classroomId);

    const { Auth, API } = withSSRContext({ req });
    try {
        const identityId = await (await Auth.currentUserCredentials()).identityId;

        if (!identityId)
            throw new Error("Session not found");

        const res = {
            props: {
                sub: identityId,
                answerSheet: {}
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

            console.log(data)

            if (data?.getAnswerSheet == null) {
                return {
                    redirect: {
                        permanent: false,
                        destination: `/classroom/${classroomId}`,
                    },
                }
            }
            console.log("[sheetId]");
            console.log(data.getAnswerSheet)

            const answerSheet = data.getAnswerSheet;
            const locates = [];
            for (const locate of answerSheet.locate!) {
                if (!SKIP_TCODE.includes(locate.tcode))
                    locates.push(locate)
            }
            answerSheet.locate = locates;
            res.props.answerSheet = answerSheet;




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

type GradingStudentAnswer = {
    [key: string]: Array<StudentAnswer>
}


const GradePage = ({ answerSheet }: { answerSheet: AnswerSheet }) => {


    const router = useRouter();
    const { classroomId, sheetId } = router.query

    const [portalSucMes, setPortalSucMes] = useState<string>();
    const [portalFailMes, setProtalFailMes] = useState<string>();

    const [orginGradingQuestion, setOrginGradinQuestion] = useState<GradingStudentAnswer>({});
    const [gradingQuestion, setGradingQuestion] = useState<GradingStudentAnswer>({});
    const [currQuestionIdx, setCurrQuestionIdx] = useState<number>(0);



    const headerRef = useRef<HTMLDivElement>();
    const bodyRef = useRef<HTMLDivElement>();

    const bodyOffsetY = () => {
        bodyRef.current!.style.marginTop = headerRef.current?.clientHeight + "px";
    }

    const closeTab = () => {
        if (confirm("If leave the page, unsaved question will not save."))
            window.close()
        router.back();
    }

    const getGradeSheetSize = (): number => {
        let count = 0
        for (const key in gradingQuestion)
            count += gradingQuestion[key].length;
        return count;
    }

    const onGrading = (qid: string, studentId: string, grade: string) => {
        const studentAnswers = gradingQuestion[qid];
        let chkAnswer = null;
        for (const answer of studentAnswers) {
            if (studentId == answer.studentId) {
                chkAnswer = answer;
                break
            }
        }
        if (chkAnswer != null) {
            console.log(chkAnswer);

            const updatedStudentAnswers = [];

            for (let i = 0; i < studentAnswers.length; i++) {

                let updateGrade = studentAnswers[i].grade;
                if (studentAnswers[i].answer.toLowerCase().trim() == chkAnswer.answer.toLowerCase().trim()) {
                    updateGrade = Number(grade);
                }

                updatedStudentAnswers.push({
                    questionId: studentAnswers[i].questionId,
                    studentId: studentAnswers[i].studentId,
                    answer: studentAnswers[i].answer,
                    grade: updateGrade,
                    locate: studentAnswers[i].locate
                })
            }

            console.log("updateing");

            const newGraded = { ...gradingQuestion };
            newGraded[qid] = updatedStudentAnswers;
            console.log("new", newGraded);
            console.log("orgin", orginGradingQuestion);

            setGradingQuestion(newGraded);

        }

    }

    const getMaxMark = (qid: string): number => {
        for (const locate of answerSheet.locate!) {
            if (locate.qid == qid)
                return locate.mark
        }
        return 0;
    }

    const fetechQuestion = async () => {
        console.log("idx", currQuestionIdx);

        if (currQuestionIdx < answerSheet.locate!.length) {
            const qid = answerSheet.locate![currQuestionIdx].qid;
            // const user = await Auth.currentAuthenticatedUser();
            console.log(qid);

            const { data } = await API.graphql({
                query: listStudentAnswer,
                variables: {
                    questionId: qid,
                    limit: 100
                }
            }) as GraphQLResult<ListStudentAnswerQuery>

            if (data?.listStudentAnswer.items) {

                const tmpQuestion = Object.assign({}, gradingQuestion);
                tmpQuestion[qid] = [...data.listStudentAnswer.items]
                setGradingQuestion(tmpQuestion)
                console.log(tmpQuestion);
                setCurrQuestionIdx(currQuestionIdx => currQuestionIdx + 1);
                console.log("idx", currQuestionIdx);

                // orgin save
                const tmpOrginQuestion = { ...orginGradingQuestion };
                const tmpStudentAnswers = [...data.listStudentAnswer.items]
                tmpOrginQuestion[qid] = tmpStudentAnswers;
                setOrginGradinQuestion(tmpOrginQuestion)
                console.log("fetech", tmpOrginQuestion);

            }

        }
    }

    useEffect(() => {
        console.log("useEffect");

        bodyOffsetY();
        fetechQuestion();
    }, []);

    const onSave = async () => {
        const save: Array<Grading> = [];
        Object.entries(gradingQuestion).map(([key, i]) => {
            const graded = gradingQuestion[key];
            const orgin = orginGradingQuestion[key];

            for (let i = 0; i < graded.length; i++) {
                console.log("loop");
                console.log(graded[i].grade, orgin[i].grade);

                if (graded[i].grade != orgin[i].grade) {
                    console.log(graded[i].studentId);

                    save.push({
                        questionId: graded[i].questionId,
                        studentId: graded[i].studentId,
                        grade: graded[i].grade
                    })
                }
            }
        })
        console.log("save", save);

        const { data } = await API.graphql({
            query: SaveStudentAnswer,
            variables: {
                input: save
            }
        }) as GraphQLResult<SaveStudentAnswerSheetMutation>
        console.log(data);

        if (data?.saveStudentAnswer.result) {
            setPortalSucMes("saved at " + new Date().toLocaleString())
            // orgin key update missing

            const tmpOrgin = Object.assign({}, orginGradingQuestion);

            for (const saved of save) {
                for (let i = 0; i < tmpOrgin[saved.questionId].length; i++) {
                    if (tmpOrgin[saved.questionId][i].studentId == saved.studentId)
                        tmpOrgin[saved.questionId][i].grade = saved.grade
                }
            }
            setOrginGradinQuestion(tmpOrgin)


        } else {
            setProtalFailMes("save failed, try again later")
        }
    }


    return (
        <Page
            headerTitle={`Grading ${answerSheet.name}`}>
            <React.Fragment>
                <div ref={headerRef as React.LegacyRef<HTMLDivElement>} className="fixed top-0 bg-gray-100 border-b border-gray-300 w-full z-10">
                    <div className="flex">
                        <div className="grow">
                            <div className="flex p-3 items-center">
                                <button onClick={closeTab}><XIcon className="w-6" /></button>
                                <div className="ml-5 text-lg font-semibold">
                                    {answerSheet.name}
                                </div>
                                <div className="ml-2 text-gray-400">
                                    {portalSucMes != "" ?
                                        <span>{portalSucMes}</span>
                                        : portalFailMes != "" ?
                                            <span className="text-red-600">{portalFailMes}</span>
                                            : <></>
                                    }
                                </div>

                            </div>
                        </div>
                        <div className="self-stretch">
                            <button className="p-4 bg-zinc-700 text-white hover:bg-zinc-900" onClick={onSave}>Save</button>
                        </div>
                    </div>
                </div>

                <div ref={bodyRef as React.LegacyRef<HTMLDivElement>} className="p-5">
                    <div className="container m-auto max-w-6xl">
                    <InfiniteScroll
                            dataLength={getGradeSheetSize()} //This is important field to render the next data
                            next={fetechQuestion}
                            //hasMore={false}
                            hasMore={(currQuestionIdx< answerSheet.locate!.length? true: false)}
                            loader={<div className="w-full p-5"> <Loader show={true}/></div>}
                            endMessage={
                                <p className="w-full text-center">
                                    <span>- End -</span>
                                </p>
                            }
                            >

                        {
                            Object.entries(gradingQuestion).map(([key, value]) => {
                                const answers = gradingQuestion[key];
                                const maxMark = getMaxMark(key);
                                console.log("here", answers);

                                return answers.map((answer, i) => (

                                    <div className="w-full lg:flex mb-10" key={i} >
                                        <div className="w-full lg:flex-col lg:w-9/12 md:mr-4">
                                            <SheetImageView src={answer.locate.uri} />
                                        </div>
                                        <div className="w-full lg:flex-col lg:w-3/12 border-gray-300 bg-gray-100 lg:border p-5 sm:border-t-0">
                                            <div className="flex lg:justify-center lg:items-center justify-end h-full">
                                                <input type="number" min={0} max={maxMark} value={answer.grade} step="0.5" className="w-40 h-32 p-8 text-6xl border-gray-400 border appearance-none"
                                                    onChange={(e) => {
                                                        onGrading(key, answer.studentId, e.currentTarget.value)
                                                    }}
                                                    onClick={e => e.currentTarget.select()} />
                                                <span className="self-end mb-5 ml-2">{` / ${maxMark}`}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                                )


                            })
                        }
                        </InfiniteScroll>









                    </div>
                </div>



            </React.Fragment>





        </Page>
    )


}

export default GradePage;