export type StudentAnswerSheet = {
    answerSheetId: string
    studentId: string
    locate: S3Object
}

type S3Object = {
    bucket: string
    region: string
    uri: string
}