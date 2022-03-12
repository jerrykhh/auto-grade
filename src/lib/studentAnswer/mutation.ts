export const UploadStudentAnswerSheet = `
    mutation uploadStudentAnswer(
        $classroomId: ID!
        $sheetId: ID!
        $teacherId: ID!
        $file: UploadFile!
    ){
        uploadStudentAnswer(classroomId: $classroomId, teacherId: $teacherId sheetId: $sheetId, file: $file){
            result
            msg
        }
    }
`

export type UploadStudentAnswerSheetMutation = {
    uploadStudentAnswer: {
        result: boolean
        msg: string
    }
}