# Pull the base image with python 3.8 as a runtime for your Lambda
FROM public.ecr.aws/lambda/python:3.8

# Copy function code and models into our /var/task
COPY ./* ${LAMBDA_TASK_ROOT}/

# install our dependencies
RUN python3 -m pip install -r requirements.txt --target ${LAMBDA_TASK_ROOT}

# Install the python requirements from requirements.txt
RUN pip install torch==1.9.1+cpu -f https://download.pytorch.org/whl/torch_stable.html
RUN python3 getModel.py
# Set the CMD to your handler
CMD ["main.handler"]