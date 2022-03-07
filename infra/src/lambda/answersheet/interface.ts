import { DynamoDB } from "aws-sdk";

type PDFAnnotation = {
    qid: string,
    tcode: string,
    x: number,
    y: number,
    p_height: number,
    p_width: number,
    answer: string,
    answer_type: number
}

type AnswerSheet = {
    id: string,
    classroomId: string,
    name: string,
    status: number,
    locate: Array<PDFAnnotation> | Array<DynamoDB.AttributeMap>
}

type AnswerSheetConntection= {
    items: Array<DynamoDB.AttributeMap>
    nextToken: string | null
}

type UploadFile = {
    bucket: string
    region: string
    uri: string
}

export {AnswerSheet, PDFAnnotation, AnswerSheetConntection, UploadFile};