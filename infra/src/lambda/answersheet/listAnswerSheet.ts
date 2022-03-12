import {DynamoDB} from 'aws-sdk'
import {AnswerSheetConntection} from './interface'

const dynamodb  = new DynamoDB({
    apiVersion: '2012-08-10',
    region: process.env.REGION
})

type ListAnswerSheetEvent = {
    classroomId: string,
    limit: number,
    nextToken: string
}
const listAnswerSheert = async (event: ListAnswerSheetEvent) => {
    const params: DynamoDB.QueryInput = {
        TableName: `${process.env.ANSWERSHEET_TABLE}`,
        KeyConditionExpression: "classroomId = :cID",
        ExpressionAttributeValues: {
            ":cID": {
                S: event.classroomId
            }
        },
        Limit: 50
    }

    if (event.limit != null)
        params.Limit = event.limit
    if (event.nextToken != null)
        params.ExclusiveStartKey = JSON.parse(Buffer.from(event.nextToken, 'base64').toString());
    const data = (await dynamodb.query(params).promise());
    if(data.Items != null){
        const result: AnswerSheetConntection = {
            items: data.Items.map( obj => DynamoDB.Converter.unmarshall(obj)),
            nextToken: null
        }
        if (data.LastEvaluatedKey != null)
            result.nextToken = Buffer.from(JSON.stringify(data.LastEvaluatedKey)).toString('base64')
        return result
    }     
    return null;
}

export default listAnswerSheert;