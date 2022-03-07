import { DynamoDB } from "aws-sdk"

interface Student {
    id: string,
    name: string,
    email: string
}

interface Classroom {
    id: string,
    teacherId: string,
    name: string,
    description?: string,
    students?: Array<Student>
}

interface ClassroomConnection {
    items: Array<DynamoDB.AttributeMap>
    nextToken: String | null
}

export {Student, Classroom, ClassroomConnection};