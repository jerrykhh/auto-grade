import { AnswerSheet } from "../../interface/answersheet"

export const listReviewAnswerSheet = `
    query ListAnswersheet(
        $classroomId: ID!
        $limite: Int
        $nextToken: String
    ){
        listAnswerSheet(classroomId: $classroomId, limite: $limite, nextToken: $nextToken) {
        items {
          classroomId
          id
          name
          status
          type
        }
        nextToken
      }
    }
`

export type ListReviewAnswerSheetQuery = {
  listAnswerSheet: {
    items: Array<AnswerSheet>
  }
}

export const getAnswerSheet = `
  query GetAnswerSheet(
    $id: ID!
    $classroomId: ID!
  ){
    getAnswerSheet(id: $id, classroomId: $classroomId){
      classroomId
      id
      locate {
        answer
        qid
        page
        tcode
        y
        x
        p_width
        p_height
        answer_type
      }
      type
      status
      name
    }
  }
`

export type GetAnswerSheetQuery = {
  getAnswerSheet: AnswerSheet
}