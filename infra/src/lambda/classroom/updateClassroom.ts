import { DynamoDB } from "aws-sdk";
import { dynamodb } from "./DB";
import { Classroom } from "./interface";


const updateClassroom = async(classroom: Classroom) => {
    const params: DynamoDB.UpdateItemInput = {
        TableName: `${process.env.CLASSROOM_TABLE}`,
        Key: {
            teacherId: {
                S: classroom.teacherId
            },
            id : {
                S: classroom.id
            }
        },
        UpdateExpression: "SET #name = :name, #description = :desc",
        ExpressionAttributeValues: {
            ":name": {
                S: classroom.name
            },
            ":desc": {
                S: classroom.description
            }
        },
        ExpressionAttributeNames: {
            "#name": "name",
            "#description": "description"
        },
        ReturnValues: "UPDATED_NEW"
    }

    try{

        return await dynamodb.updateItem(params).promise();
        
    }catch(err){
        console.log(err);
    }
    return null

}

export default updateClassroom;