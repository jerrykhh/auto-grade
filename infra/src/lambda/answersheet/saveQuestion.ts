import { DynamoDB } from "aws-sdk";
import { PDFAnnotation } from "./interface";

const dynamodb = new DynamoDB({
    region: process.env.REGION,
    apiVersion: "2012-08-10"
})


type SaveQuestionEvent = {
    classroomId: string
    answerSheetId: string,
    sampleAnswers: Array<PDFAnnotation>
}

const saveQuestion = async(event: SaveQuestionEvent) => {
    
    try {
        const params: DynamoDB.GetItemInput = {
            TableName: `${process.env.ANSWERSHEET_TABLE}`,
            Key: {
                id: {
                    S: event.answerSheetId
                },
                classroomId: {
                    S: event.answerSheetId
                }
            }
        }

        const data = (await dynamodb.getItem(params).promise()).Item;
        if(!data){
            const locate = DynamoDB.Converter.unmarshall(data!).locate;
            
            if (locate.length == 0 )
                throw new RangeError("AnswerSheet is perparing")

            for(const sampleAnswer of event.sampleAnswers){
                const index = locate.findIndex((obj: PDFAnnotation) => obj.id === sampleAnswer.id);
                if (index < 0)
                    throw new RangeError("Answer Id not found")
                locate[index].answer = sampleAnswer.answer
                locate[index].answer_type = sampleAnswer.answer_type
            }

            const updateParams: DynamoDB.UpdateItemInput = {
                TableName: `${process.env.ANSWERSHEET_TABLE}`,
                Key: {
                    id: {
                        S:event.answerSheetId
                    },
                    classroomId: {
                        S: event.answerSheetId
                    }
                },
                UpdateExpression: "SET locate = :locate",
                ExpressionAttributeValues: {
                    ":locate": {
                        L: locate
                    }
                }
            }


            await dynamodb.updateItem(params).promise();
            return {
                result: true,
                msg: `AnswerSheet ${event.answerSheetId} is saved`
            }                
        }
    } catch (error) {
        return {
            result: false,
            msg: "Database Error: Save failed"
        }
    }

    return {
        result: false,
        msg: "Unknown Error"
    }
}

export default saveQuestion;