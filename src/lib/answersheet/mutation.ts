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

export const saveQuestion = `
    mutation SaveQuestion(
        $id: ID!,
        $classroomId: ID!,
        $questions: [Question]!
    ){
        saveQuestion(classroomId: $classroomId, id: $id, questions: $questions){
            msg
            result
        }
    }
`

export type SaveQuestionMutation = {
    saveQuestion : {
        msg: string
        result: boolean
    }
}