import { DynamoDB } from "aws-sdk"
import { Grading } from "./interface"


const dynamodb = new DynamoDB({
    region: process.env.REGION,
    apiVersion: "2012-08-10"
})

type SaveStudetAnswerEvent = {
    input: Array<Grading>
}

const SaveStudentAnswer = async (event: SaveStudetAnswerEvent) => {

    const failed = [];

    for (const grade of event.input) {
        const param: DynamoDB.UpdateItemInput = {
            TableName: `${process.env.STUDENTANSWER_TABLE}`,
            Key: {
                questionId: {
                    S: grade.questionId
                },
                studentId: {
                    S: grade.studentId
                }
            },
            UpdateExpression: "SET #grade = :grade",
            ExpressionAttributeValues: {
                ":grade": {
                    N: `${grade.grade}`
                }
            },
            ExpressionAttributeNames: {
                "#grade": "grade"
            }
        }


        try {
            await dynamodb.updateItem(param).promise();

        } catch (err) {
            failed.push({
                questionId: grade.questionId,
                studentId: grade.studentId
            })
        }
    }

    if (failed.length == 0) {
        return {
            "result": true,
            "msg": "saved"
        }
    } else {
        return {
            "result": false,
            "msg": JSON.stringify(failed)
        }
    }


}