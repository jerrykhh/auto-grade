import { ReviewStudentAnswer, StudentAnswer } from "../../interface/studentAnswer"

export const listStudentAnswer = `
    query ListStudentAnswer(
        $questionId: ID
        $limit: Int
        $nextToken: String
    ){
        listStudentAnswer(questionId: $questionId, limit: $limit, nextToken: $nextToken) {
            
                items {
                  grade
                  locate {
                    bucket
                    region
                    uri
                  }
                  questionId
                  studentId
                  answer
                }
                nextToken
              
      }
    }
`



export type ListStudentAnswerQuery = {
  listStudentAnswer: {
    items: Array<StudentAnswer>
    nextToken: string
  }
}


export const listStudentAnswerData = `
  query ListStudentAnswer(
    $questionId: ID
    $limit: Int
    $nextToken: String
  ){
    listStudentAnswer(questionId: $questionId, limit: $limit, nextToken: $nextToken) {
        
            items {
              grade
              questionId
              studentId
              answer
            }
            nextToken
          
  }
}
`

export type ListStudentAnswerDataQuery = {
  listStudentAnswer: {
    items: Array<ReviewStudentAnswer>
    nextToken: string
  }
}

