import {DynamoDB} from 'aws-sdk'

const dynamodb  = new DynamoDB({
    apiVersion: '2012-08-10',
    region: process.env.REGION
})

type GetClassroomEvent = {
    id: string,
    teacherId: string
}

const getClassroom = async(event: GetClassroomEvent) => {
    const params: DynamoDB.GetItemInput = {
        TableName: `${process.env.CLASSROOM_TABLE}`,
        Key: {
            id: {
                S: event.id
            },
            teacherId:{
                S: event.teacherId
            }
        }
    }

    try {
        const item = (await (dynamodb.getItem(params).promise())).Item;
        if (item != null)
            return DynamoDB.Converter.unmarshall(item);
    } catch (error) {
        console.log(error);
    }
    return null;
}

export default getClassroom;