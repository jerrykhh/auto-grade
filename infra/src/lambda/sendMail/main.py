import boto3
import os
import time
import fitz
import uuid
from boto3.dynamodb.types import TypeDeserializer
from botocore.exceptions import ClientError


s3 = boto3.resource('s3')
dynamoDB = boto3.client('dynamodb')
ses = boto3.client('ses')

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
                "S": event["answerSheetId"]
            },
            "classroomId": {
                "S": event["classroomId"]
            }
        }
    )
    
    print("get ANSWERSHEET_TABLE")
    cdn_domain = os.environ["CDN"]
    
    data = dynamo_obj_to_python_obj(response["Item"])
    questions = []
    for locate in data["locate"]:
        if locate["tcode"] not in ["studentid", "classroom", "name", "code"]:
            questions.append(locate)
    
    print("convert question", questions)
    # get student answer sheet
    
    student_locates_res = dynamoDB.query(
        TableName=os.environ["LOCATESTUDENTANSWERSHEET_TABLE"],
        KeyConditionExpression="answerSheetId = :id",
        ExpressionAttributeValues={
            ":id": {
                "S": event["answerSheetId"]
            }
        }
    )
    print("get LOCATESTUDENTANSWERSHEET_TABLE")
    print(student_locates_res)
    locates = [];
    for locate in student_locates_res["Items"]:
        locates.append(dynamo_obj_to_python_obj(locate))
        
    # get student mail
    classroom_res = dynamoDB.get_item(
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
    
    classroom_data = dynamo_obj_to_python_obj(classroom_res["Item"])
    
    students = classroom_data["students"]
    
    for student in locates:
       
        student_ans_sheet:fitz.Document = fitz.open(
                stream=s3.Object(student["locate"]["bucket"], student["locate"]["uri"]).get()['Body'].read(),
                filetype="pdf"
            )
        total_grade = 0
        # get studnet graded
        
        for question in questions:
                try:
                    # print("for question")
                    student_grade_res = dynamoDB.get_item(
                        TableName=os.environ["STUDENTANSWER_TABLE"],
                        Key={
                            "questionId": {
                                'S': question["qid"]
                            },
                            'studentId': {
                                'S': student["studentId"]
                            }
                        }
                    )
                    
                    #print(student_grade_res)
                    std_grade = 0.0
                    
                    try:
                        if student_grade_res["Item"] is not None:
                            #print("not None")
                            student_grade = dynamo_obj_to_python_obj(student_grade_res["Item"])
                            std_grade = float(student_grade['grade'])
                    except Exception as e :
                        print(e)
                        
                    total_grade += std_grade
                    page = student_ans_sheet.load_page(int(question["page"])-1)
                    rect = fitz.Rect(float(question['x']), float(question['y']), float(question['p_height']), float(question['p_width']))
                    page.insert_textbox(rect, f"{std_grade}", color=(1,0,0), align=2, fontsize=14)
                
                except Exception as e:
                    print(e)
            
        rect = fitz.Rect(20, 20, 100, 100)
        page = student_ans_sheet.load_page(0)
        total_grade = round(total_grade, 1)
        page.insert_textbox(rect, f"Total: {total_grade}", color=(1,0,0), align=2, fontsize=14)
        
        # print("save")
        id = uuid.uuid4()
        student_ans_sheet_file = s3.Object(os.environ["PUBLIC_STORAGE"], f"{event['classroomId']}/{event['answerSheetId']}/{id}.pdf")
        student_ans_sheet_file.put(
            Body=student_ans_sheet.tobytes()
        )
        
        
        uri = f"{event['classroomId']}/{event['answerSheetId']}/{id}.pdf"
        mail = f'Please check your garded result, <a class="ulink" href="https://{cdn_domain}/{uri}" target="_blank">Click here</a>'
        student_mail_address = None
        for std in students:
            if std["id"] == student["studentId"]:
                student_mail_address = std["email"]
                break
            

        if student_mail_address is not None:
            try:
                # print(student_mail_address)
                res = ses.send_email(
                    Source='Grading System <jerrymailproxy@gmail.com>',
                    Destination={
                        'ToAddresses': [
                            student_mail_address
                        ]
                    },
                    Message={
                        'Body': {
                            'Html': {
                                'Charset': 'UTF-8',
                                'Data': mail,
                            },
                            'Text': {
                                'Charset': 'UTF-8',
                                'Data': 'This is the message body in text format.',
                            }
                        },
                        'Subject': {
                            'Charset': 'UTF-8',
                            'Data': 'Graded Result',
                        }
                    }
                )
                time.sleep(1)
            except ClientError as e:
                print(e.response['Error']['Message'])
            else:
                print("Email sent! Message ID:"),
                print(res['MessageId'])
                
    
    dynamoDB.update_item(
        TableName=os.environ["ANSWERSHEET_TABLE"],
        Key={
            'id': {
                'S': event['answerSheetId']
            },
            'classroomId': {
                'S': event['classroomId']
            }
        },
        UpdateExpression="SET #status = :status",
        ExpressionAttributeValues={
                        ':status':{
                            'N': '12'
                        },
        },
        ExpressionAttributeNames={
            "#status": "status"
        })
        
        