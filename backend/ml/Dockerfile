FROM public.ecr.aws/lambda/python:3.11

COPY requirements.txt .
RUN pip install -r requirements.txt --no-cache-dir

COPY model.joblib label_encoder.joblib app.py ./

CMD ["app.handler"]
