FROM python:3.9-slim

# تعيين مجلد العمل داخل الحاوية
WORKDIR /app

# Install system dependencies required for pycups
RUN apt-get update && apt-get install -y libcups2-dev build-essential

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

# run the conutiner
CMD ["python", "print_orders.py"]
