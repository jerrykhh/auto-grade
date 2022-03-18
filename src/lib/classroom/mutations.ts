import {Classroom} from "../../interface/classroom"

export const createClassroom = `
    mutation CreateClassroom(
        $classroom: CreateClassroomInput!
    ){
        createClassroom(classroom: $classroom) {
            id
            name
            description
        }
    }
`

export type CreateClassroomMutation = { 
    createClassroom: Classroom
}


export const updateStudent = `
    mutation UpdateStudent(
        $id: ID!
        $teacherId: ID!
        $student: [InputStudent]
    ){
        uploadStudent(id: $id, teacherId: $teacherId, student: $student) {
            result
            msg
          }
    }
`


export type UpdateStudentMutation = {
    uploadStudent: {
        msg: string
        result: boolean
    }
}

export type UpdateStudentAnswerMutation = {
    uploadStudentAnswer: {
        msg: string
        result: boolean
    }
}

export const removeClassroom = `
    mutation RemoveClassroom(
        $id: ID!
        $teacherId: ID!
    ){
        removeClassroom(id: $id, teacherId: $teacherId){
            result
            msg
        }
    }
`

export type RemoveClassroomMutation = {
    removeClassroom: {
        msg: string
        result: boolean
    }
}