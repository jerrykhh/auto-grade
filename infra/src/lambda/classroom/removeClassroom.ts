import { DynamoDB } from "aws-sdk";

const dynamodb = new DynamoDB({
    apiVersion: '2012-08-10',
    region: process.env.REGION
})

type RemoveClassroomEvent = {
    id: string,
    teacherId: string
}

const RemoveClassroom = async (event: RemoveClassroomEvent) => {

    const params: DynamoDB.DeleteItemInput = {
        TableName: `${process.env.CLASSROOM_TABLE}`,
        Key: {
            id: {
                S: event.id
            },
            teacherId: {
                S: event.teacherId
            }
        }
    }
    try{
        await dynamodb.deleteItem(params, () => {}).promise();
        return {
            result: true,
            msg: `${event.id} is removed`
        }
    }catch(error){
        return {
            result: false,
            msg: error
        }
    }
    return null
}

export default RemoveClassroom;