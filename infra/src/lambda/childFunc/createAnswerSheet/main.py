import os
import boto3
import fitz
import uuid
import json

s3 = boto3.resource('s3')
lamFunc = boto3.client('lambda')
dynamoDB = boto3.client('dynamodb')


class PDFAnnotation:

    def __init__(self, tcode: str, page: int, rect) -> None:
        self.id = str(uuid.uuid4())
        self.tcode = tcode
        self.x = rect[0]
        self.y = rect[1]
        self.p_height = rect[2]
        self.p_width = rect[3]
        self.page = page+1
        self.answer = ""
        self.answer_type = -1


def handler(event, context):
    error_type = -1
    try:
        print()
        uploaded_file = s3.Object(event["file"]["bucket"], event['file']['uri'])
        pdf_file :fitz.Document = fitz.open(
            stream=uploaded_file.get()['Body'].read(),
            filetype="pdf"
        )

        if pdf_file.is_pdf:

            if pdf_file.has_annots():

                pdf_annotions = []
                CHECK_ANNOTIONS= ["name", "code", "studentid", "classroom"]

                for page in pdf_file.pages():
                    
                    for annot in page.annots():

                        tcode=str(annot.info['content']).lower()
                        pdf_annotions.append(PDFAnnotation(
                            tcode=tcode,
                            page= page.number,
                            rect= annot.rect
                        ))
                        
                        if tcode in CHECK_ANNOTIONS:
                            CHECK_ANNOTIONS.remove(tcode)

                        page.delete_annot(annot)
                
                if len(CHECK_ANNOTIONS) != 0:
                    error_type = -1
                    raise Exception("PDF not contain 'name', 'code', 'studentid' and 'classroom' annotations")
                
                if len(pdf_annotions) < 5:
                    error_type = -2
                    raise Exception("PDF must contain at least one question")
                # S3 PUT
                uploaded_file.put(
                    Body=pdf_file.write())
                    
                # Update DynamoDb
                locates = []
                for question in pdf_annotions:
                    question = question.__dict__
                    locates.append({"M": {
                        "qid": {
                            "S": question["id"]
                        },
                        "tcode": {
                            "S": f"{question['tcode']}"
                        },
                        "x": {
                            "N": f"{question['x']}"
                        },
                        "y": {
                            "N": f"{question['y']}"
                        },
                        "p_height": {
                            "N": f"{question['p_height']}"
                        },
                        "p_width": {
                            "N": f"{question['p_width']}"
                        },
                        "page": {
                            "N": f"{question['page']}"
                        },
                        "answer": {
                            "S": ""
                        },
                        "answer_type": {
                            "N": f"{question['answer_type']}"
                        },
                        "mark": {
                            "N": "0"
                        }
                    }})
                pages = pdf_file.page_count
                print("update", locates)
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
                    UpdateExpression="SET #status = :status, #locate = :locate, #page = :page",
                    ExpressionAttributeValues={
                        ':status':{
                            'N': '2'
                        },
                        ':locate':{
                            'L': locates
                        },
                        ':page': {
                            'N': f"{pages}"
                        }
                    },
                    ExpressionAttributeNames={
                        "#status": "status",
                        "#locate": "locate",
                        "#page": "page"
                    }
                )
                
                pdf_annotions_dict = [v.__dict__ for v in pdf_annotions]
                
                lamFunc.invoke(
                    FunctionName=os.environ['INIT_ANSWERSHEET_FUNC'],
                    InvocationType='Event',
                    Payload= json.dumps({
                        "id": event['id'],
                        "teacherId": event['teacherId'],
                        "classroomId": event['classroomId'],
                        "file": event["file"],
                        "type": event["type"],
                        "locate": pdf_annotions_dict
                    })
                )
                
                return {
                    'result': True,
                    'msg': f"AnswerSheet {event['file']['uri']} created"
                }

            else:
                error_type = -3
                raise Exception("Annotations not found")

        else:
            error_type = -4
            raise Exception("File is not PDF")

    except Exception as e:
        print("ex exception", e)
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
                    UpdateExpression="SET #status = :status, #locate = :locate",
                    ExpressionAttributeValues={
                        ':status':{
                            'N': f"{error_type}"
                        },
                        ':locate':{
                            'L': []
                        }
                    },
                    ExpressionAttributeNames={
                        "#status": "status",
                        "#locate": "locate"
                    }
                        
                )
        
        return {
            "result": False
        }
