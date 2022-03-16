import fitz
import boto3
import base64
import json
import os 
import uuid

from boto3.dynamodb.types import TypeDeserializer



class TextractKVParser:
    
    def __init__(self, res) -> None:
        self.res = res["Blocks"]
    
    def get_kv_map(self):
        # Get the text blocks
        blocks=self.res

        # get key and value maps
        key_map = {}
        value_map = {}
        block_map = {}
        for block in blocks:
            block_id = block['Id']
            block_map[block_id] = block
            if block['BlockType'] == "KEY_VALUE_SET":
                if 'KEY' in block['EntityTypes']:
                    key_map[block_id] = block
                else:
                    value_map[block_id] = block

        return key_map, value_map, block_map
    
    def get_kv_relationship(self, key_map, value_map, block_map):
        kvs = {}
        for block_id, key_block in key_map.items():
            value_block = self.find_value_block(key_block, value_map)
            key = self.get_text(key_block, block_map)
            val = self.get_text(value_block, block_map)
            print(f"key={key}, val={val}")
            if key in kvs:
                
                if str(kvs[key]).strip().lower() != str(val).strip().lower():
                    if len(str(kvs[key]).strip()) == 1:
                        kvs[key] = str(val).strip()
                    else:
                        kvs[key] += " " + val
                    
            else:
                kvs[key] = str(val).strip()
                
        print(" ")
        return kvs
    
    def get_text(self,result, blocks_map):
        text = ''
        if 'Relationships' in result:
            for relationship in result['Relationships']:
                if relationship['Type'] == 'CHILD':
                    for child_id in relationship['Ids']:
                        word = blocks_map[child_id]
                        if word['BlockType'] == 'WORD':
                            text += word['Text'] + ' '
                        if word['BlockType'] == 'SELECTION_ELEMENT':
                            if word['SelectionStatus'] == 'SELECTED':
                                text += 'X '    

                                    
        return text
    
    def find_value_block(self, key_block, value_map):
        for relationship in key_block['Relationships']:
            if relationship['Type'] == 'VALUE':
                for value_id in relationship['Ids']:
                    value_block = value_map[value_id]
        return value_block
    
    def extract(self):
        key_map, value_map, block_map = self.get_kv_map()
        # Get Key Value relationship
        return  self.get_kv_relationship(key_map, value_map, block_map)
            



s3 = boto3.resource('s3')
dynamoDB = boto3.client('dynamodb')
client = boto3.client('textract')
lamFunc = boto3.client('lambda')


def dynamo_obj_to_python_obj(dynamo_obj: dict) -> dict:
    deserializer = TypeDeserializer()
    return {
        k: deserializer.deserialize(v) 
        for k, v in dynamo_obj.items()
    }


def handler(event, context): 
    
    try:
        print(event)
        # "{\"JobId\":\"9481af2b3a9df15a5c0b8f456c0c164bb2035a6b3374f311d4ccf8c9e45c2e2f\",\"Status\":\"SUCCEEDED\",\"API\":\"StartDocumentTextDetection\",\"Timestamp\":1646841975170,\"DocumentLocation\":{\"S3ObjectName\":\"public/student-answers.pdf\",\"S3Bucket\":\"auto-grade-app-storage\"}}",
        textract_job = json.loads(event["Records"][0]["Sns"]["Message"])

        # if True:
        if textract_job["Status"] == "SUCCEEDED":
            # job_id = "8d2f0cd2e0df73eefc49b1bb2a6edf9bbd30ae770476e37c4423fddd223c2330"
            job_id = textract_job["JobId"]
            response = client.get_document_analysis(
                JobId=job_id,
            )
            res = lamFunc.invoke(
                        FunctionName=os.environ['QRCODE_DECODEER'],
                        InvocationType='RequestResponse',
                        Payload= json.dumps({
                            "name": f"{job_id}.jpg",
                        })
                    )
            
            qrcode = str(res["Payload"].read().decode("utf-8"))
            print(qrcode)
            decode = str(base64.b64decode(qrcode).decode("utf-8")).split(",")
            print(decode)
            classroomId = decode[0]
            sheetId = decode[1]
            studentId = decode[2]
            
            data = dynamoDB.get_item(
                TableName=os.environ["ANSWERSHEET_TABLE"],
                    Key={
                        "id": {
                            "S": sheetId
                        },
                        "classroomId": {
                            "S": classroomId
                        }
                    }
                )
            
            data_unmash = dynamo_obj_to_python_obj(data["Item"])
            questions = []
            for locate in data_unmash["locate"]:
                print(locate)
                if locate["tcode"] not in ["studentid", "classroom", "name", "code"]:
                    questions.append(locate)
            # print(questions)
            
            # src_pdf_file:fitz.Document = fitz.open(
            #     stream=s3.Object("auto-grade-app-storage", "private/6de9b4a0-7d10-4055-80a9-9eab7933bf7b/45b89c18-2e6a-447f-a1d3-5b52053927a5/9fe8ba4f-5152-40f2-8181-1790b65a0829/885467ff-44bb-4394-9f73-2654d4d316d5.pdf").get()['Body'].read(),
            #     filetype="pdf"
            # )
            
            src_pdf_file:fitz.Document = fitz.open(
                stream=s3.Object(textract_job["DocumentLocation"]["S3Bucket"], textract_job["DocumentLocation"]["S3ObjectName"]).get()['Body'].read(),
                filetype="pdf"
            )

            
            std_ans = TextractKVParser(response).extract()
            print(std_ans)
            
            
            
            for question in questions:
                
                tcode = question["tcode"]
                
                img_key = uuid.uuid4()
                uri = f"{classroomId}/{sheetId}/{img_key}.jpg"
                # question_img = s3.Object("auto-grade-app-storage", uri)
                question_img = s3.Object(textract_job["DocumentLocation"]["S3Bucket"], uri)
                print(question)
                page = src_pdf_file.load_page(int(question['page'])-1)
                page.set_cropbox(fitz.Rect(question['x'], question['y'], question['p_height'], question['p_width']))
                cropped_img = page.get_pixmap(matrix=fitz.Matrix(3, 3))
                question_img.put(Body=cropped_img.tobytes(output="jpg"))
                
                for key in std_ans.keys():
                    if str(key).strip().lower() == tcode or  ''.join(e for e in str(key) if e.isalnum()) == tcode:
                        ans = str(std_ans[key]).strip()
                        break
                
                dynamoDB.update_item(
                        TableName=os.environ["STUDENTANSWER_TABLE"],
                        Key={
                            "questionId": {
                                'S': question["qid"]
                            },
                            'studentId': {
                                'S': studentId
                            }
                        },
                        UpdateExpression="SET #answer = :answer, #locate = :locate, #grade = :grade",
                        ExpressionAttributeValues={
                            ':answer':{
                                'S': ans
                            },
                            ':locate':{
                                'M': {
                                    "bucket": {
                                        'S': textract_job["DocumentLocation"]["S3Bucket"]
                                    },
                                    "region": {
                                        'S': os.environ["REGION"]
                                    },
                                    "uri": {
                                        'S': uri
                                    }
                                }
                            },
                            ":grade":{
                                'N': "0"
                            }
                        },
                        ExpressionAttributeNames={
                            "#answer": "answer",
                            "#locate": "locate",
                            "#grade": "grade"
                        }
                    )
            
            dynamoDB.update_item(
                            TableName=os.environ["LOCATESTUDENTANSWERSHEET_TABLE"],
                            Key={
                                "answerSheetId": {
                                    'S': sheetId
                                },
                                "studentId": {
                                    'S': studentId
                                }
                            },
                            UpdateExpression="SET #locate = :locate",
                            ExpressionAttributeValues={
                                ':locate':{
                                    'M': {
                                        "bucket": {
                                            'S': textract_job["DocumentLocation"]["S3Bucket"]
                                        },
                                        "region": {
                                            'S': os.environ["REGION"]  
                                        },
                                        "uri": {
                                            'S': textract_job["DocumentLocation"]["S3ObjectName"]
                                        }
                                        
                                    }
                                }
                            },
                            ExpressionAttributeNames={
                                "#locate": "locate"
                            }
                        )
            
            if data_unmash["lastJobId"] == job_id:
                    
                if data_unmash["type"] == 1:
                    status_id = 9
                    print("auto grade")
                        
                else:
                    status_id = 8
                    
                
                    
                dynamoDB.update_item(
                    TableName=os.environ["ANSWERSHEET_TABLE"],
                    Key={
                        "id": {
                            "S": sheetId
                        },
                        "classroomId": {
                            "S": classroomId
                        }
                    },
                    UpdateExpression="SET #status = :status",
                    ExpressionAttributeValues={
                                    ':status':{
                                        'N': f"{status_id}"
                                    }
                                },
                                ExpressionAttributeNames={
                                    "#status": "status"
                                }
                )
                    
                            
            # print(response)

    except Exception as e:
        print(e)