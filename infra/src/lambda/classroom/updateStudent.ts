import { Key } from "aws-cdk-lib/aws-kms";
import { DynamoDB } from "aws-sdk";
import { dynamodb } from "./DB";

type updateStudentEvent = {
    id: string,
    teacherId: string,
    student: DynamoDB.AttributeValueList
}

const updateStudent = async(event: updateStudentEvent) => {

    let students = [];
    for (const student of event.student){
        const M = DynamoDB.Converter.marshall(student)
        students.push({M})
    }

    const params: DynamoDB.UpdateItemInput = {
        TableName: `${process.env.CLASSROOM_TABLE}`,
        Key: {
            teacherId: {
                S: event.teacherId
            },
            id: {
                S: event.id
            }
        },
        UpdateExpression: "SET students = :student",
        ExpressionAttributeValues: {
            ":student": {
             L : students
            }
        },
        ReturnValues: "UPDATED_NEW"
    };

    try{
        
        await dynamodb.updateItem(params).promise();
        return {
            result: true,
            msg: `Student Upload successful`
        }

    }catch(err){
        console.log(err);
        return {
            result: false,
            msg: `Database Error: ${err}`,
        }
    }

}

export default updateStudent;