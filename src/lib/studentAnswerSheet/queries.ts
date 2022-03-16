export const listStudentAnswerSheet = `
    query ListStudentAnswerSheet(
        $answerSheetId: ID
        $limit: Int
        $nextToken: String
    ){
        listStudentAnswerSheet(answerSheetId: $answerSheetId, limit: $limit, nextToken: $nextToken){

            items {
                answerSheetId
                studentId
            }
        }
    }
`

