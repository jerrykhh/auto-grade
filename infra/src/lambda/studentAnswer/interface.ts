import { DynamoDB } from "aws-sdk"

export type StudentAnswer = {
    questionId: string,
    studentId: string,
    studentAnswer: string,
    grade: number,
    file: S3Object
}

export type S3Object = {
    bucket: string
    region: string
    uri: string
}

export type ListStudentAnswerConnection = {
    items: Array<DynamoDB.AttributeMap>,
    nextToken: string | null
}


export type Grading = {
    questionId: string
    studentId: string
    grade: number
}