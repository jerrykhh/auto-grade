import os
import boto3
import fitz
import qrcode
import io
import base64
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
        TableName=os.environ['CLASSROOM_TABLE'],
        Key= {
            "teacherId": {
                "S": event["teacherId"]
            },
            "id": {
                "S": event["classroomId"]
            }
        }
    )

    classroom_data = dynamo_obj_to_python_obj(response["Item"])

    # create student answer sheet
    student_ans_sheet: fitz.Document = fitz.open()
    src_file = fitz.open(
        stream=s3.Object(event['file']["bucket"], event['file']["uri"]).get()['Body'].read(),
        filetype="pdf")

    for i, student in enumerate(classroom_data["students"], start=0):
        student_ans_sheet.insert_pdf(src_file, annots=False)
        count = 0
        for data in event["locate"]:
            rect = fitz.Rect(float(data['x']), float(data['y']), float(data['p_height']), float(data['p_width']))
            tcode = str(data['tcode']).lower()
            page = student_ans_sheet.load_page(int(data['page'])-1+i)
             
            if tcode == 'name':
                page.insert_textbox(rect, student['name'])
                count+=1
            elif tcode == 'studentid':
                page.insert_textbox(rect, student['id'])
                count+=1
            elif tcode == 'classroom':
                page.insert_textbox(rect, classroom_data["name"])
                count+=1
            elif tcode == 'code':
                qr_code = qrcode.make(base64.b64encode(f"{event['classroomId']},{event['id']},{student['id']}".encode()))
                qr_code_bytes_io = io.BytesIO()
                qr_code.save(qr_code_bytes_io, format='jpeg')
                page.insert_image(rect, stream=qr_code_bytes_io.getvalue())
                count+=1
            if count == 4:
                break

    student_ans_sheet_file = s3.Object(event['file']["bucket"], f"public/{event['teacherId']}/{event['classroomId']}/{event['id']}/student_ans_sheet-{event['classroomId']}.pdf")
    student_ans_sheet_file.put(
        Body=student_ans_sheet.write()
    )

    try:

        dynamoDB.update_item(
            TableName=os.environ['ANSWERSHEET_TABLE'],
            Key={
                'id': {
                    'S': event['id']
                },
                'classroomId': {
                    'S': event['classroomId']
                }
            },
            UpdateExpression= "SET #status = :status",
                    ExpressionAttributeValues={
                            ':status':{
                                'N': '5'
                            },
                    },
                    ExpressionAttributeNames={
                        "#status": "status"
                    }
        )
    except Exception as e:
        print(e)
        