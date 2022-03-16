import { Student } from "../../interface/student"

export const listReviewClassroom = `
  query ListClassroom(
      $teacherId: ID!
      $limit: Int
      $nextToken: String
  ) {
    listClassrooms(teacherId: $teacherId, limit: $limit, nextToken: $nextToken) {
        items {
            id
            students {
              email
              id
              name
            }
            description
            name
          }
      nextToken
    }
  }
`

export const listClassroom = `
    query ListClassroom(
        $teacherId: ID!
        $limit: Int
        $nextToken: String
    ) {
      listClassrooms(teacherId: $teacherId, limit: $limit, nextToken: $nextToken) {
          items {
              id
              description
              name
            }
        nextToken
      }
    }
`

export const getClassroom = `
    query GetClassroom(
      $id: ID!
      $teacherId: ID!
    ){
      getClassroom(id: $id, teacherId: $teacherId) {
        name
        id
        teacherId
        description
        students {
          email
          id
          name
        }
      }
    }
`

export const getClassroomStudents = `
  query GetClassroom(
    $id: ID!
    $teacherId: ID!
  ){
    getClassroom(id: $id, teacherId: $teacherId) {
      students {
        email
        id
        name
      }
    }
  }

`

export type getClassroomStudentsQuery = {

  getClassroom: {
    students: Array<Student>
  }

}