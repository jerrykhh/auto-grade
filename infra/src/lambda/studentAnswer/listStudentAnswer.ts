import {DynamoDB} from "aws-sdk";
import { ListStudentAnswerConnection } from "./interface";

const dynamodb = new DynamoDB({
    region: process.env.REGION,
    apiVersion: '2012-08-10'
})

type ListStudentAnswerEvent = {
    questionId: string,
    limit: number,
    nextToken: string
}

const listStudentAnswer = async (event: ListStudentAnswerEvent) => {
    const param: DynamoDB.QueryInput = {
        TableName: `${process.env.STUDENTANSWER_TABLE}`,
        KeyConditionExpression: "questionId = :qid",
        ExpressionAttributeValues: {
            ":qid": {
                S: event.questionId
            }
        },
        Limit: 100
    };

    if (event.limit != null)
        param.Limit = event.limit
    
    if (event.nextToken != null)
        param.ExclusiveStartKey = JSON.parse(Buffer.from(event.nextToken, 'base64').toString());
    
    const data = (await dynamodb.query(param).promise());
    if(data.Items != null){
        const result: ListStudentAnswerConnection = {
            items: data.Items.map(obj => DynamoDB.Converter.unmarshall(obj)),
            nextToken: null
        }

        if (data.LastEvaluatedKey != null)
            result.nextToken = Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64')
        return result
    }
    return null

}

export default listStudentAnswer;