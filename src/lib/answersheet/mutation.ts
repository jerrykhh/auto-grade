export const CreateAnswerSheet = `
    mutation CreateAnswerSheet(
        $teacherId: ID!, 
        $classroomId: ID!, 
        $name: String!, 
        $file: UploadFile!
        $type: Int!
    ){
        createAnswerSheet(teacherId: $teacherId, classroomId: $classroomId, name: $name, file:$file, type:$type) {
            msg
            result
        }
    }
`

export type CreateAnswerSheetMutation = {
    createAnswerSheet: {
        msg: string
        result: boolean
    }
}