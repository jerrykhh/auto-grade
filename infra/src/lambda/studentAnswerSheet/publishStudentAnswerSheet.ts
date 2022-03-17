import { Lambda, DynamoDB } from "aws-sdk";

const lambda = new Lambda();

const dynamodb = new DynamoDB({
    region: process.env.REGION,
    apiVersion: "2012-08-10"
})

type publishStudentAnswerSheetEvent = {
    answerSheetId: string,
    classroomId: string,
    teacherId: string
}

const publishStudentAnswerSheet = async (event: publishStudentAnswerSheetEvent) => {
    try {
        const dynamodbParam: DynamoDB.UpdateItemInput = {
            TableName: `${process.env.ANSWERSHEET_TABLE}`,
            Key: {
                id: {
                    S: event.answerSheetId
                },
                classroomId: {
                    S: event.classroomId
                }
            },
            UpdateExpression: "SET #status = :status",
            ExpressionAttributeNames: {
                "#status": "status"
            },
            ExpressionAttributeValues: {
                ":status": {
                    N: '11'
                }
            }
        }

        await dynamodb.updateItem(dynamodbParam).promise();

        const invokeParams = {
            FunctionName: `${process.env.SENDMAIL}`, /* required */
            InvocationType: "Event",
            Payload: JSON.stringify(event)
        };
        await lambda.invoke(invokeParams).promise();
        return {
            "result": true,
            "msg": `publishing ${event.answerSheetId}`
        }

    } catch (err) {
        return {
            "result": false,
            "msg": err
        };
    }
}

export default publishStudentAnswerSheet;