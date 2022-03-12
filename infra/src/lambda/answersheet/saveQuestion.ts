import { DynamoDB } from "aws-sdk";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
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
                    S: event.classroomId
                }
            }
        }

        let data = DynamoDB.Converter.unmarshall((await dynamodb.getItem(params).promise()).Item as AttributeMap);
        if(data){

            let locates: Array<PDFAnnotation> = data.locate;

            if (locates.length == 0 )
                throw new RangeError("AnswerSheet is perparing")

            for(const sampleAnswer of event.sampleAnswers){
                const index = locates.findIndex((obj: PDFAnnotation) => obj.qid === sampleAnswer.qid);
                if (index < 0)
                    continue;
                locates[index].answer = sampleAnswer.answer
                locates[index].answer_type = sampleAnswer.answer_type
                locates[index].mark = sampleAnswer.mark
            }

            let marshall_locates = [];
            for (const locate of locates){
                const M = DynamoDB.Converter.marshall(locate);
                marshall_locates.push({M})
            }


            const updateParams: DynamoDB.UpdateItemInput = {
                TableName: `${process.env.ANSWERSHEET_TABLE}`,
                Key: {
                    id: {
                        S:event.answerSheetId
                    },
                    classroomId: {
                        S: event.classroomId
                    }
                },
                UpdateExpression: "SET #locate = :locate",
                ExpressionAttributeValues: {
                    ":locate": {
                        L: marshall_locates
                    }
                },
                ExpressionAttributeNames: {
                    "#locate": "locate"
                }
            }

            await dynamodb.updateItem(updateParams).promise();
            return {
                result: true,
                msg: `AnswerSheet ${event.answerSheetId} is saved`
            }                
        }
    } catch (error) {
        return {
            result: false,
            msg: error
        }
    }

    return {
        result: false,
        msg: "Unknown Error"
    }
}

export default saveQuestion;