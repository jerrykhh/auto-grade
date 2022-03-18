/* eslint-disable @next/next/no-img-element */
import { GraphQLResult } from "@aws-amplify/api-graphql";
import { withSSRContext, API, Auth, Storage } from "aws-amplify";
import { GetServerSideProps } from "next";
import Image, { ImageProps } from "next/image";
import { useRouter } from "next/router";
import React, { HTMLProps, useEffect, useRef, useState } from "react";
import Button from "../../../../components/element/button";
import Loader from "../../../../components/element/loader";
import { DropdownItem, DropdownList } from "../../../../components/input/dropdown";
import TextArea from "../../../../components/input/textarea";
import Textfield from "../../../../components/input/textfield";
import Page from "../../../../components/layout/Page";
import { AnswerSheet } from "../../../../interface/answersheet";
import { saveQuestion, SaveQuestionMutation } from "../../../../lib/answersheet/mutation";
import { getAnswerSheet, GetAnswerSheetQuery } from "../../../../lib/answersheet/queries";
import {XIcon} from "@heroicons/react/outline"
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

            res.props.answerSheet = data.getAnswerSheet;

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


type Answer = {
    [qid: string]: {
        answer: string
        answer_type: number
        mark: number
    }
}

const SheetDetailPage = ({ sub, answerSheet }: { sub: string, answerSheet: AnswerSheet }) => {
    const router = useRouter();
    const { classroomId, sheetId } = router.query

    const headerRef = useRef<HTMLDivElement>();
    const bodyRef = useRef<HTMLDivElement>();
    const [answers, setAnswers] = useState<Answer>({});
    const [portalSucMes, setPortalSucMes] = useState<string>();
    const [portalFailMes, setProtalFailMes] = useState<string>();
    const skipTcodes = ["studentid", "classroom", "name", "code"];

    const bodyOffsetY = () => {
        bodyRef.current!.style.marginTop = headerRef.current?.clientHeight + "px";
    }

    const setQuestionType = (qid: string, q_type: string) => {
        const questions = { ...answers };
        questions[qid].answer_type = Number(q_type);
        setAnswers(questions);
    }

    const setQuestionAnswer = (qid: string, answer: string) => {
        const questions = { ...answers };
        questions[qid].answer = answer;
        setAnswers(questions);
    }

    const setQuestionMark = (qid: string, mark: string) => {
        const questions = { ...answers };
        questions[qid].mark = Number(mark);
        setAnswers(questions);
    }

    useEffect(() => {
        bodyOffsetY();
        let answer_obj: Answer = {};
        answerSheet.locate?.map((sheet, i) => {
            console.log(sheet);
            if (!skipTcodes.includes(sheet.tcode.toLocaleLowerCase())) {

                const typeOfAnswer = (Number(sheet.answer_type) < 0) ? 1 : sheet.answer_type;
                console.log(sheet.tcode, typeOfAnswer);

                answer_obj[sheet.qid] = {
                    answer: sheet.answer,
                    answer_type: typeOfAnswer,
                    mark: Number(sheet.mark)
                }
            }
        });
        setAnswers(answer_obj);
    }, []);

    const onSaveQuestion = async () => {

        setPortalSucMes("");
        setProtalFailMes("");

        console.log("save");
        console.log(answers);

        const questions = [];
        let key: keyof typeof answers;
        for (key in answers) {
            questions.push({
                qid: key,
                answer_type: answers[key].answer_type,
                answer: answers[key].answer,
                mark: answers[key].mark
            })
        }
        console.log(questions);


        const { data } = await API.graphql({
            query: saveQuestion,
            variables: {
                id: sheetId,
                classroomId: classroomId,
                questions: questions
            }
        }) as GraphQLResult<SaveQuestionMutation>

        if(data?.saveQuestion.result)
            setPortalSucMes("saved at " + new Date().toLocaleString())
        else
            setProtalFailMes("save failed, try again later")



    }

    const getTotalMark = () => {
        let key: keyof typeof answers;
        let marks: number = 0;
        for (key in answers) {
            if (answers[key].mark >= 0)
                marks += answers[key].mark;
        }

        return marks;
    }

    const closeTab = () => {
        if (confirm("If leave the page, unsaved question will not save."))
            window.close()
            router.back();
    }


    return (
        <Page
            headerTitle={"Answer Sheet"}>
            <React.Fragment>
                <div ref={headerRef as React.LegacyRef<HTMLDivElement>} className="fixed top-0 bg-gray-100 border-b border-gray-300 w-full">
                    <div className="flex">
                        <div className="grow">
                            <div className="flex p-3 items-center">
                                
                                    <button onClick={closeTab}><XIcon className="w-6" /></button>
                                

                                <div className="ml-5 text-lg font-semibold">
                                    {answerSheet.name}
                                </div>
                                <div className="ml-2 text-gray-400">

                                
                                {portalSucMes != ""?
                                    <span>{portalSucMes}</span>
                                     : portalFailMes != ""?
                                        <span className="text-red-600">{portalFailMes}</span>
                                            :<></>
                                }
                                </div>
                                
                            </div>
                        </div>

                        {/* <div className="text-sm font-light">
                        created: {answerSheet.create_date}
                    </div> */}
                        <div className="self-stretch">
                            <span className="mr-4">Total Mark: {getTotalMark()}</span>
                            <button className="p-4 bg-zinc-700 text-white hover:bg-zinc-900" onClick={onSaveQuestion}>Save</button>
                        </div>
                    </div>
                </div>
                <div ref={bodyRef as React.LegacyRef<HTMLDivElement>} className="p-5">
                    <div className="container m-auto max-w-6xl">
                        {answerSheet.locate && answerSheet.locate.length > 0 && Object.keys(answers).length > 0 ?

                            answerSheet.locate.map((sheet, index) => {
                                if (!skipTcodes.includes(sheet.tcode.toLowerCase())) {
                                    return (
                                        <div className="w-full md:flex mb-10" key={index}>
                                            <div className="sm:w-full md:flex-col md:w-8/12 md:mr-4">
                                                <SheetImageView src={`${classroomId}/${sheetId}/config/${sheet.qid}.jpg`} />
                                            </div>
                                            <div className="sm:w-full md:flex-col md:w-4/12 border-gray-300 bg-gray-100 md:border p-5 sm:border-t-0">
                                                <div className="row">
                                                    <span className="font-semibold">T_code:</span> {`${sheet.tcode}`}
                                                </div>
                                                <div className="row mt-3">
                                                    <span className="font-semibold">Question Type:</span>
                                                    <div className="block">
                                                        <DropdownList value={answers[sheet.qid].answer_type} onChange={(e) => setQuestionType(sheet.qid, e.currentTarget.value)}>
                                                            {answers[sheet.qid].answer_type == 1 ?
                                                                <DropdownItem value={1} selected>MC Question</DropdownItem>
                                                                : <DropdownItem value={1}>MC Question</DropdownItem>
                                                            }
                                                            {answers[sheet.qid].answer_type == 2 ?
                                                                <DropdownItem value={2} selected>Essay Quesion</DropdownItem>
                                                                : <DropdownItem value={2}>Essay Quesion</DropdownItem>
                                                            }
                                                        </DropdownList>

                                                    </div>
                                                </div>
                                                {answerSheet.type == 1?
                                                    <div className="row">
                                                        <span className="font-semibold">Model Answer:</span>
                                                        <TextArea rowSpan={5} colSpan={5} placeholder="Answer" value={answers[sheet.qid].answer} onChange={e => setQuestionAnswer(sheet.qid, e.currentTarget.value)} />
                                                    </div>
                                                    :<></>
                                                }
                                                <div className="row">
                                                    <span className="font-semibold">Mark:</span>
                                                    <Textfield width={5} placeholder="mark" type="number" min={0} value={answers[sheet.qid].mark <= 0 ? "" : answers[sheet.qid].mark} onChange={e => setQuestionMark(sheet.qid, e.currentTarget.value)} />
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

export default SheetDetailPage;