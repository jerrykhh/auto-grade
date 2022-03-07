import { DynamoDB } from "aws-sdk";
import { dynamodb } from "./DB";
import { Student } from "./interface";
import updateStudent from "./updateStudent";

type RemoveStudentEvent = {
    teacherId: string,
    id: string,
    studentId: string
}

const removeStudent = async (event: RemoveStudentEvent) => {
    const params: DynamoDB.GetItemInput = {
        TableName: `${process.env.CLASSROOM_TABLE}`,
        Key: {
            teacherId: {
                S: event.teacherId
            },
            id : {
                S: event.id
            }
        }
    }

    try {
        const data = (await dynamodb.getItem(params).promise()).Item;
        if (!data){
            const covertedData = DynamoDB.Converter.unmarshall(data!);
            const removeIndex: number = covertedData.student.findIndex((obj: Student) => obj.id === event.studentId);
            const students: DynamoDB.AttributeValueList = covertedData.student;
            const removedStudent = students.splice(removeIndex, 1);
            const updateResult = await updateStudent({
                                            id: event.id,
                                            teacherId: event.teacherId,
                                            student: students
                                        });
            if (!updateResult)
                return removedStudent;
        }
    }catch(err){
        return null;
    }

    return null;
}

export default removeStudent;