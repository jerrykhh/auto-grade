import { DynamoDB } from "aws-sdk";
import { dynamodb } from "./DB";

type RemoveAnswerSheetEvent = {
    id: string,
    classroomId: string
}

const removeAnswerSheet = async(event: RemoveAnswerSheetEvent) => {
    const params: DynamoDB.DeleteItemInput = {
        TableName: `${process.env.ANSWERSHEET_TABLE}`,
        Key: {
            id: {
                S: event.id,
            },
            classroomId: {
                S: event.classroomId
            }
        }
    }
    try{
        await dynamodb.deleteItem(params).promise();
        return {
            result: true,
            msg: `${event.id} remove successful`
        }
    }catch(err){
        return {
            result: false,
            msg: `Database Error: ${err}`
        }
    }
}

export default removeAnswerSheet;