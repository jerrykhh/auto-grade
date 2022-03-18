import { DynamoDB } from "aws-sdk"

export type Student = {
    id: string,
    name: string,
    email: string
}

export type  Classroom = {
    id: string,
    teacherId: string,
    name: string,
    description?: string,
    students?: Array<Student>
}

export type  ClassroomConnection = {
    items: Array<DynamoDB.AttributeMap>
    nextToken: String | null
}