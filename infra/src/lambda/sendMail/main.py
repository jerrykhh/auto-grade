import boto3
from boto3.dynamodb.types import TypeDeserializer


s3 = boto3.resource('s3')
dynamoDB = boto3.client('dynamodb')

def dynamo_obj_to_python_obj(dynamo_obj: dict) -> dict:
    deserializer = TypeDeserializer()
    return {
        k: deserializer.deserialize(v) 
        for k, v in dynamo_obj.items()
    }

def handler(event, context):
    
    response = dynamoDB.get_item(
        TableName=os.environ["ANSWERSHEET_TABLE"],
        Key={
            "id": {
                "S": event["sheetId"]
            },
            "classroomId": {
                "S": event["classroomId"]
            }
        }
    )
    
    data = dynamo_obj_to_python_obj(response["Item"])
    