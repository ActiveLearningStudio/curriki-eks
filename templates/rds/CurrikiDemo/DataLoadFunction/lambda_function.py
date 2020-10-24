import json
import boto3
import urllib.request
import requests
import psycopg2
from botocore.exceptions import ClientError
def lambda_handler(event, context):
    session = boto3.session.Session()
    my_region = session.region_name
    print(event)

    secret_name = "CurrikiStudioRDSCredentials"
    region_name = my_region
    client = session.client(
        service_name = 'secretsmanager',
        region_name = region_name,
    )
    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
    except ClientError as e:
        if e.response['Error']['Code'] == 'ResourceNotFoundException':
            print("The requested secret " + secret_name + " was not found")
        elif e.response['Error']['Code'] == 'InvalidRequestException':
            print("The request was invalid due to:", e)
        elif e.response['Error']['Code'] == 'InvalidParameterException':
            print("The request had invalid params:", e)
    else:
        # Secrets Manager decrypts the secret value using the associated KMS CMK
        # Depending on whether the secret was a string or binary, only one of these fields will be populated
        if 'SecretString' in get_secret_value_response:
            text_secret_data = get_secret_value_response['SecretString']

        else:
            binary_secret_data = get_secret_value_response['SecretBinary']
    test = json.loads(text_secret_data)

    username=test['username']
    password=test['password']
    dbname=test['dbname']


    database_url = event['ResourceProperties']['DatabaseURL']
    with urllib.request.urlopen('https://curriki-eks-ali.s3.amazonaws.com/CurrikiDemo/psqltest.sql') as response:
        html_content = response.read()
    encoding = response.headers.get_content_charset('utf-8')
    encoded = html_content.decode(encoding)
    sqlCommands = encoded.split(';')
    conn = psycopg2.connect(host=database_url,
              port=5432,
                      user=username,
                      password=password,
                      database=dbname)
    cur = conn.cursor()
    response_data = {}
    #
    # retrieve data from the request
    #
    response_url = event.get('ResponseURL', None)
    action = event['RequestType']
    response_data['StackId'] = event.get('StackId', None)
    response_data['RequestId'] = event.get('RequestId', None)
    response_data['LogicalResourceId'] = event.get('LogicalResourceId', "")
    response_data['PhysicalResourceId'] = event.get('PhysicalResourceId', "{context.function_name}-{context.function_version}")
    response_data['Data'] = {}
    response_data['Reason'] = "Loading Data"



    for command in sqlCommands:
        try:
            if action == "Create":
                response_data['Status'] = "SUCCESS"
                cur.execute(command)
                #print("Hello!")
            else:
                print("Not doing anything!")
                response_data['Status'] = "SUCCESS"
        except psycopg2.DatabaseError as error:
            code, message = error.args
            print(">>>>>>>", code, message)
            response_data['Status'] = "FAILED"
            conn.rollback()
            print("Problem with Insert")
    conn.commit()
    json_response = json.dumps(response_data)
    headers = {
        'content-type': '',
        'content-length': str(len(json_response))
        }
    print("Sending Response")
    try:
        response = requests.put(response_url, data=json_response, headers=headers)
    except Exception as e:
        print(e)
        raise
    # TODO implement
    return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
    }
