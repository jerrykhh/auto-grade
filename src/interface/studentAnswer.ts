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

export type Grading = {
    questionId: string,
    studentId: string
    grade: number
}

export type ReviewStudentAnswer = {
    questionId: string,
    studentId: string
    answer: string
    grade: number
}

export type StudentStat = {
    studentId: string,
    grade: number
}