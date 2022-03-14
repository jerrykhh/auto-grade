import os
import boto3
import fitz
import uuid
from boto3.dynamodb.types import TypeDeserializer


dynamoDB = boto3.client('dynamodb')
s3 = boto3.resource('s3')
textract = boto3.client('textract')

def dynamo_obj_to_python_obj(dynamo_obj: dict) -> dict:
    deserializer = TypeDeserializer()
    return {
        k: deserializer.deserialize(v) 
        for k, v in dynamo_obj.items()
    }

def handler(event, context): 
    dynamoDB.update_item(
            TableName=os.environ["ANSWERSHEET_TABLE"],
            Key={
                "id": {
                    "S": event["sheetId"]
                },
                "classroomId": {
                    "S": event["classroomId"]
                }
            },
            UpdateExpression="SET #status = :status, #lastJobId = :lastJobId",
            ExpressionAttributeValues={
                            ':lastJobId':{
                                'S': last_job_id

                            },
                            ':status':{
                                'N':  "7"
                                
                            }
                        },
            ExpressionAttributeNames={
                            "#lastJobId": "lastJobId",
                            "#status": "status"
                        }
            )
    
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
    print(data)
    qrcode = None
    for locate in data["locate"]:
        print(locate)
        if locate["tcode"] == "code":
            qrcode = locate
            break
    print("qrcode", qrcode)
    
    if qrcode is not None:
        print(event['file'])
        src_file = fitz.open(
            stream=s3.Object(event['file']["bucket"], event['file']["uri"]).get()['Body'].read(),
            filetype="pdf")
        pdf = fitz.open()
        
        count = src_file.page_count
        last_job_id = ""
        
        for i in range(0, count):
            pdf.insert_pdf(src_file, from_page=0, to_page=int(data["page"])-1)
            src_file.delete_page(0)
            
            if (i % int(data["page"])== 0):
                uri = f"private/{event['teacherId']}/{event['classroomId']}/{event['sheetId']}/{uuid.uuid4()}.pdf"
                stud_pdf = s3.Object(event['file']["bucket"], uri)
                stud_pdf.put(
                    Body=pdf.tobytes()
                )
                
                tmp_page = pdf.load_page(0)
                tmp_page.set_cropbox(fitz.Rect(qrcode['x'], qrcode['y'], qrcode['p_height'], qrcode['p_width']))
                cropped_img = tmp_page.get_pixmap(matrix=fitz.Matrix(7, 7))
                
                
                res_textract = textract.start_document_analysis(
                        DocumentLocation={
                            'S3Object': {
                                'Bucket': event["file"]["bucket"],
                                'Name': uri
                            }
                        },
                        FeatureTypes=[
                            'FORMS'
                        ],
                        NotificationChannel={
                            'SNSTopicArn': os.environ["SNSTOPIC"],
                            'RoleArn': os.environ["TEXTRACTROLE"]
                        },
                        OutputConfig={
                            'S3Bucket':  event["file"]["bucket"],
                            'S3Prefix': f"private/{event['teacherId']}/{event['classroomId']}/{event['sheetId']}/predict"
                        },
                    )
                last_job_id = res_textract['JobId']
                
                uploaded_file = s3.Object(event["file"]["bucket"], f"tmp/{res_textract['JobId']}.jpg")
                uploaded_file.put(
                            Body=cropped_img.tobytes(output="jpg"))
                pdf = fitz.open()
        
        
                
        
        
        
    
    
    
    