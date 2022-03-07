import { Student } from "./student";

export type Classroom = {
    id: String 
    teacherId: String 
    name: String
    description: String 
    students?: Student[]
}