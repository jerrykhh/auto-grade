export type StudentAnswer = {
    questionId: string,
    studentId: string
    answer: string
    grade: number
    locate: S3File
}

type S3File = {
    bucket: string
    region: string
    uri: string
}

