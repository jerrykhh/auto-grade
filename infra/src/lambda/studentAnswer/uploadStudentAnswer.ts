import { DynamoDB, Textract, Lambda } from "aws-sdk";

const lambda = new Lambda();
const textract = new Textract();
const dynamodb = new DynamoDB({
    region: process.env.REGION,
    apiVersion: "2012-08-10"
})

type UploadStudentAnswer = {
    teacherId: string,
    classroomId: string,
    sheetId: string,
    file: {
        bucket: string,
        region: string,
        uri: string
    }
}

const uploadStudentAnswer = async (event: UploadStudentAnswer) => {
    // const params: Textract.Types.StartDocumentAnalysisRequest = {
    //     DocumentLocation: {
    //         S3Object: {
    //             Bucket: event.file.bucket,
    //             Name: event.file.uri
    //         },
    //     },
    //     FeatureTypes: ["FORMS"],
    //     NotificationChannel: {
    //         RoleArn: `${process.env.TEXTRACTROLE}`,
    //         SNSTopicArn: `${process.env.SNSTOPIC}`
    //     },
    //     OutputConfig: {
    //         S3Bucket: event.file.bucket,
    //         S3Prefix: `private/${event.teacherId}/${event.classroomId}/${event.sheetId}`
    //     }
    // }

    const dynamodbParam: DynamoDB.UpdateItemInput = {
        TableName: `${process.env.ANSWERSHEET_TABLE}`,
        Key: {
            id: {
                S: event.sheetId
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
                S: '6'
            }
        }
    }

    try {

        await dynamodb.updateItem(dynamodbParam).promise();
        const invokeParams = {
            FunctionName: `${process.env.STARTTEXTRACT}`, /* required */
            InvocationType: "Event",
            Payload: JSON.stringify(event)
        };

        await lambda.invoke(invokeParams).promise();

        return {
            "result": true,
            "msg": `start Document Text Detection`
        };

    } catch (err) {

        return {
            "result": false,
            "msg": err
        };
    }

}

export default uploadStudentAnswer;