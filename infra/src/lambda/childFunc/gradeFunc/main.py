import boto3
from transformers import BertTokenizer, BertModel
from sklearn.metrics.pairwise import cosine_similarity
import torch
import os
from boto3.dynamodb.types import TypeDeserializer

dynamoDB = boto3.client('dynamodb')

def dynamo_obj_to_python_obj(dynamo_obj: dict) -> dict:
    deserializer = TypeDeserializer()
    return {
        k: deserializer.deserialize(v) 
        for k, v in dynamo_obj.items()
    }


def handler(event, context):
    response = dynamoDB.get_item(
        # TableName="auto-grade-AnswerSheet",
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
    
    data = dynamo_obj_to_python_obj(response["Item"])
    questions = []
    for locate in data["locate"]:
        if locate["tcode"] not in ["studentid", "classroom", "name", "code"]:
            questions.append(locate)
    
    tokenizer = None
    model = None
    
    for question in questions:
        qid = question["qid"]
        question_type = int(question["answer_type"])
        question_answer = question["answer"]
        question_mark = float(question["mark"])
        
        # Get student Answer
        
        std_ans_res = dynamoDB.query(
            # TableName="auto-grade-StudentAnswer",
            TableName=os.environ["STUDENTANSWER_TABLE"],
            KeyConditionExpression="questionId = :id",
            ExpressionAttributeValues={
                    ":id": {
                        "S": qid
                    }
                }
            )
        student_answers = [];
        for answer in std_ans_res["Items"]:
            student_answers.append(dynamo_obj_to_python_obj(answer))
        #MC question
        print("type", question_type)
        graded_result = []
        if question_type == 1:
            
            for student in student_answers:
                
                if str(student["answer"]).strip().lower() == str(question_answer).strip().lower():
                    graded_result.append(question_mark)
                else:
                    graded_result.append(0)
            
            
            
        elif question_type == 2:

            ans = [student["answer"] for student in student_answers]
            print(ans)
            
            if tokenizer is None:
                tokenizer = BertTokenizer.from_pretrained(f"./model")
            if model is None:
                model = BertModel.from_pretrained("./model")

            
            tokens = {
                'input_ids': [], 
                'attention_mask': []
            }
        
            new_tokens = tokenizer.encode_plus(question_answer, max_length=128, truncation=True,
                                               padding='max_length', return_tensors='pt')
            tokens['input_ids'].append(new_tokens['input_ids'][0])
            tokens['attention_mask'].append(new_tokens['attention_mask'][0])
            
            
            print("loop")
            for student in student_answers:
                new_tokens = tokenizer.encode_plus(student['answer'], max_length=128, truncation=True,
                                               padding='max_length', return_tensors='pt')
                tokens['input_ids'].append(new_tokens['input_ids'][0])
                tokens['attention_mask'].append(new_tokens['attention_mask'][0])
            
            print("finish loop")
            tokens['input_ids'] = torch.stack(tokens['input_ids'])
            tokens['attention_mask'] = torch.stack(tokens['attention_mask'])
            outputs = model(**tokens)
            embeddings = outputs.last_hidden_state
            attention_mask = tokens['attention_mask']
            mask = attention_mask.unsqueeze(-1).expand(embeddings.size()).float()
            masked_embeddings = embeddings * mask
            summed = torch.sum(masked_embeddings, 1)
            summed_mask = torch.clamp(mask.sum(1), min=0)
            mean_pooled = summed / summed_mask
            mean_pooled = mean_pooled.detach().numpy()
            print("cal cosine")
            graded_result = cosine_similarity(
                [mean_pooled[0]],
                mean_pooled[1:]
            )[0]
            print(graded_result)
            
        if len(graded_result) > 0:
            for student, grade in zip(student_answers, graded_result):
                base = 1
                if question_type == 2:
                    base = 0.0
                    
                    if grade >= 0.60:
                        base = grade
                    
                student_mark = round(question_mark * base, 1)
                    
                dynamoDB.update_item(
                        # TableName="auto-grade-StudentAnswer",
                        TableName=os.environ["STUDENTANSWER_TABLE"],
                        Key={
                            "questionId": {
                                'S': qid
                            },
                            'studentId': {
                                'S': student["studentId"]
                            }
                        },
                        UpdateExpression="SET #grade = :grade",
                        ExpressionAttributeValues={
                            ":grade":{
                                'N': f"{student_mark}"
                        }
                        },
                        ExpressionAttributeNames={
                            "#grade": "grade"
                        }
                    )
                    
    
    dynamoDB.update_item(
        # TableName="auto-grade-AnswerSheet",
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
                            'N': '10'
                        },
        },
        ExpressionAttributeNames={
            "#status": "status"
        })
            
    
    
# if __name__ == "__main__":
#     main({
#         "classroomId": "45b89c18-2e6a-447f-a1d3-5b52053927a5",
#         "answerSheetId": "9fe8ba4f-5152-40f2-8181-1790b65a0829"
#     })