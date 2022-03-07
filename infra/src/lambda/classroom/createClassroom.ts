import { v4 as uuidv4 } from 'uuid';
import {DynamoDB} from 'aws-sdk';
import {Classroom} from './interface'

const dynamodb = new DynamoDB({
    region: process.env.REGION,
    apiVersion: '2012-08-10'
})

const createClassroom = async(classroom: Classroom) => {

    if(!classroom.id)
        classroom.id = uuidv4()

    const param: DynamoDB.PutItemInput = {
        TableName: `${process.env.CLASSROOM_TABLE}`,
        Item: {
            id: {
                S: uuidv4()
            },
            teacherId: {
                S: classroom.teacherId
            },
            name: {
                S: classroom.name
            },
            description: {
                S: classroom.description
            },
            students: {
                L: []
            }
        }
    }

    try{
        await dynamodb.putItem(param).promise()
        return classroom
    }catch(err){
        console.log(err)
    }
    return null;
    
}

export default createClassroom;