import { DynamoDB, Lambda } from "aws-sdk";
import { UploadFile } from "./interface";
import { v4 as uuidv4 } from 'uuid';

const dynamodb: DynamoDB = new DynamoDB({
    apiVersion: "2012-08-10",
    region: process.env.REGION
});

const lambda: Lambda = new Lambda({
    apiVersion: "2015-03-31"
})

type CreateAnswerSheetEvent = {
    teacherId: string
    classroomId: string
    name: string 
    type: number
    file: UploadFile
}



const createAnswerSheet = async(event: CreateAnswerSheetEvent) => {
    try{
        const id = uuidv4()
        const params:DynamoDB.PutItemInput = {
            TableName: `${process.env.ANSWERSHEET_TABLE}`,
            Item: {
                id: {
                    S: id
                },
                classroomId: {
                    S: event.classroomId
                },
                name: {
                    S: event.name
                },
                type: {
                    N: `${event.type}`
                },
                status: {
                    N: `1`
                },
                file: {
                    M: DynamoDB.Converter.marshall(event.file)
                },
                locate: {
                    L: []
                }
            }
        }

        await dynamodb.putItem(params).promise()
        lambda.invoke({
            FunctionName: `${process.env.CREATE_ANSWERSHEET_ARN}`,
            InvocationType: "Event",
            Payload: {
                id: id,
                teacherId: event.teacherId,
                classroomId: event.classroomId,
                file: event.file,
                type: event.type
            }
        })

        return {
            result: true,
            msg: `AnswerSheet ${id} is created`
        }
        
    }catch(error){
        return {
            result: false,
            msg: `AnswerSheet create Error: ${error}`
        }
    }

}

export default createAnswerSheet;