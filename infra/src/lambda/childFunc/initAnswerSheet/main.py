import boto3
import os
import fitz
import json


s3 = boto3.resource('s3')
dynamoDB = boto3.client('dynamodb')
lamFunc = boto3.client('lambda')
NOT_FILTER= ['name', 'classroom', 'studentid', 'code']

def handler(event, context):
    # 0 not need crop
    # 1 need crop
    
    pdf_file = s3.Object(event["file"]["bucket"], event["file"]["uri"])
    src_file :fitz.Document = fitz.open(
            stream=pdf_file.get()['Body'].read(),
            filetype="pdf"
        )

    for ann in event["locate"]:
        if str(ann['tcode']).lower() not in NOT_FILTER:
            page = src_file.load_page(ann['page']-1)
            page.set_cropbox(fitz.Rect(ann['x'], ann['y'], ann['p_height'], ann['p_width']))
            cropped_img = page.get_pixmap()
                # cropped_img.save(f"{ann['id']}.jpg")
            uploaded_file = s3.Object(event["file"]["bucket"], f"public/{event['classroomId']}/{event['id']}/config/{ann['id']}.jpg")
            uploaded_file.put(
                    Body=cropped_img.tobytes(output="jpg"))
        
    dynamoDB.update_item(
        TableName=os.environ["ANSWERSHEET_TABLE"],
        Key={
            'id': {
                'S': event['id']
            },
            'classroomId': {
                'S': event['classroomId']
            }
        },
        UpdateExpression="SET #status = :status",
        ExpressionAttributeValues={
                        ':status':{
                            'N': '3'
                        },
        },
        ExpressionAttributeNames={
            "#status": "status"
        })

    lamFunc.invoke(
                    FunctionName=os.environ['PREPARE_ANSWERSHEET_FUNC'],
                    InvocationType='Event',
                    Payload= json.dumps({
                        "id": event['id'],
                        "teacherId": event['teacherId'],
                        "classroomId": event['classroomId'],
                        "file": event['file'],
                        "type": event["type"],
                        "locate": event['locate']
                    })
                )