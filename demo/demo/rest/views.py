
import sys
import os
base_dir  = os.path.abspath(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))),'models'))
sys.path.append(base_dir)
print('Base Dir {}'.format(base_dir))

from django.shortcuts import render
from django.http import HttpResponse
import json
from django.views.decorators.csrf import csrf_exempt
#from infer import InferConv1d,InferCharEmbModel,InferXGBChar


# Create your views here.

question_list = questions = ["How is information retrieval course in tamu?","Information retrieval content","How are you today"]

def test_hello(request):
    return HttpResponse("Hello testing")


def construct_response(data=None):

    if not data:
        data = [{"question":"How is IR course?","score":0.9},{"question":"Contents of IR course?","score":0.7}]

    print('Result to json{}'.format(data))
    resp = HttpResponse(json.dumps(data))
    return resp

def predict(algo_id,question):
    global question_list
    model = None
    if algo_id=='conv1d':
        model = InferConv1d()
    elif algo_id =='xgboostchar':
        model = InferXGBChar()
    elif algo_id=='charlstm':
        model = InferCharEmbModel()
    result = model.predict(question,question_list)


    return result


@csrf_exempt
def update_question_list(request):
    global  question_list
    body = request.body.decode("utf-8")
    json_body = json.loads(body)
    all_questions = json_body["questions"]
    if request.method == 'POST':
        question_list.extend(all_questions)
    elif request.method=='PUT':
        question_list.clear()
        question_list.append(all_questions)



@csrf_exempt
def generate_prediction(request):
    algo_id = request.GET.get('algo_id','conv1d')
    body = request.body.decode("utf-8")
    json_body = json.loads(body)
    data = ""
    if "query" in json_body:
        data = json_body['query']
    print("Data parsed{}".format(data))
    print('Algo id{}'.format(algo_id))

    ## call algorithm below

    ## responese
    data = predict(algo_id,data)
    return construct_response(data)
    




