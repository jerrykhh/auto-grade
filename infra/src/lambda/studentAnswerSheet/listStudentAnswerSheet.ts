import {DynamoDB} from "aws-sdk";
import { ListStudentAnswerSheetConnection } from "./interface";

const dynamodb = new DynamoDB({
    region: process.env.REGION,
    apiVersion: '2012-08-10'
})


type ListStudentANswerSheetProps= {
    answerSheetId: string
    limit: number
    nextToken: string
}

const listStudentAnswerSheet = async (event: ListStudentANswerSheetProps) => {

    const param: DynamoDB.QueryInput = {
        TableName: `${process.env.STUDENTANSWERSHEET_TABLE}`,
        KeyConditionExpression: "answerSheetId = :id",
        ExpressionAttributeValues: {
            ":id": {
                S: event.answerSheetId
            }
        },
        Limit: 200
    };

    if (event.limit != null)
    param.Limit = event.limit

    if (event.nextToken != null)
        param.ExclusiveStartKey = JSON.parse(Buffer.from(event.nextToken, 'base64').toString());

    const data = (await dynamodb.query(param).promise());
    if(data.Items != null){
        const result: ListStudentAnswerSheetConnection = {
            items: data.Items.map(obj => DynamoDB.Converter.unmarshall(obj)),
            nextToken: null
        }

        if (data.LastEvaluatedKey != null)
            result.nextToken = Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64')
        return result
    }
    return null

}

export default listStudentAnswerSheet;