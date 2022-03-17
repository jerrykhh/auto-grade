export const publishStudentAnswerSheet = `
    mutation PublishStudentAnswerSheet(
        $answerSheetId: ID!
        $classroomId: ID!
        $teacherId: ID!
    ){
        publishStudentAnswerSheet(answerSheetId: $answerSheetId, classroomId: $classroomId, teacherId: $teacherId) {
            msg
            result
        }
    }
`

export type PublishStudentAnswerSheetMutation = {
    publishStudentAnswerSheet: {
        msg: string
        result: boolean
    }

}