# import the required libraries
from googleapiclient.discovery import build
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
import pickle
import os
import base64
#import email
#from bs4 import BeautifulSoup
from datetime import datetime, timedelta
import pytz
import json

# Define the SCOPES. If modifying it, delete the token.pickle file.
SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

NUM_MESSAGES = 1

UTC = pytz.utc
IST = pytz.timezone('Asia/Kolkata')

print(f'Getting last {NUM_MESSAGES} emails...\n')

def getEmails(dateStr):
	files = []

	print(f"Checking emails after date:{dateStr}")
	# Variable creds will store the user access token.
	# If no valid token found, we will create one.
	creds = None


	# The file token.pickle contains the user access token.
	# Check if it exists
	if os.path.exists('token.pickle'):

		# Read the token from the file and store it in the variable creds
		with open('token.pickle', 'rb') as token:
			creds = pickle.load(token)

	# If credentials are not available or are invalid, ask the user to log in.
	if not creds or not creds.valid:
		if creds and creds.expired and creds.refresh_token:
			creds.refresh(Request())
		else:
			flow = InstalledAppFlow.from_client_secrets_file('client_secret.json', SCOPES)
			creds = flow.run_local_server(port=0)

		# Save the access token in token.pickle file for the next run
		with open('token.pickle', 'wb') as token:
			pickle.dump(creds, token)

	# Connect to the Gmail API
	service = build('gmail', 'v1', credentials=creds)

	# user for which to get the mail for 
	userId = 'me'

	# convert date string to timestamp
	dateObj = datetime.strptime(dateStr, '%Y-%m-%d %H:%M:%S %z').astimezone(IST)
	print(f'dateobj for {dateStr}: {dateObj}')
	dateTS = round(dateObj.timestamp())

	print(f'timestamp for {dateStr}: {dateTS}')

	# request a list of all the messages
	# We can also pass maxResults to get any number of emails. Like this:
	# result = service.users().messages().list(maxResults=100, userId='me').execute()
	result = service.users().messages().list(userId=userId, maxResults=NUM_MESSAGES, q=f'from:donotreply@camsonline.com after:{dateTS} has:attachment').execute()
	#result = service.users().messages().list(userId=userId, maxResults=NUM_MESSAGES, q=f'from:donotreply@camsonline.com').execute()

	if not 'messages' in result:
		raise Exception(f'No messages returned. Response: {result}')

	# messages is a list of dictionaries where each dictionary contains a message id.
	messages = result.get('messages')

	print(f'response from service: {result}')
	
	
	# iterate through all the messages
	for msg in messages:
		# Get the message from its id
		txt = service.users().messages().get(userId=userId, id=msg['id']).execute()

		#print(f'message:\n {txt}')

		# Use try-except to avoid any Errors
		try:
			# Get value of 'payload' from dictionary 'txt'
			payload = txt['payload']
			headers = payload['headers']

			# Look for Subject and Sender Email in the headers
			for d in headers:
				if d['name'] == 'Subject':
					subject = d['value']
				if d['name'] == 'From':
					sender = d['value']
				if d['name'] == 'Date':
					msgDate = d['value']

			# The Body of the message is in Encrypted format. So, we have to decode it.
			# Get the data and decode it with base 64 decoder.
			#
			# parts = payload.get('parts')[0]
			# data = parts['body']['data']
			# data = data.replace("-","+").replace("_","/")
			# decoded_data = base64.b64decode(data)

			# Now, the data obtained is in lxml. So, we will parse
			# it with BeautifulSoup library
			# soup = BeautifulSoup(decoded_data , "lxml")
			# body = soup.body()

			# skip messages that do not match given date

			# Printing the subject, sender's email and message
			print("Date: ", getDateInIST(msgDate))
			print("Subject: ", subject)
			print("From: ", sender)
			#print("Message: ", body)
			print('\n')

			files = getAttachments(service, userId, msg['id'], './')
		except Exception as err:
			print(f'An error occurred: {err}')
			raise

	return files


def getDateInIST(dateStr):
	formats = [
		'%d %b %Y %H:%M:%S %z',
		'%a, %d %b %Y %H:%M:%S %z',
		'%a, %d %b %Y %H:%M:%S %z (%Z)',
		'%Y-%m-%d'
	]

	numFormats = len(formats)
	for index, value in enumerate(formats):
		try:
			format = value
			datetimeObj = datetime.strptime(dateStr, format)
			break
		except ValueError:
			if index + 1 == numFormats:
				print(f'time data "{dateStr}" does not match any of the formats: ', formats)
				raise
			else:
				pass

	tzOffset = datetimeObj.strftime('%z')

	if tzOffset == None: 
		print(f'Error: No timezone info in date: {dateStr}')
	if tzOffset != '+0530':
		print(f'converting {datetimeObj} to IST')
		datetimeObj = datetimeObj.astimezone(IST)

	return datetimeObj.strftime(format)

def getAttachments(service, user_id, msg_id, store_dir):

	"""Get and store attachment from Message with given id.

	Args:
	service: Authorized Gmail API service instance.
	user_id: User's email address. The special value "me"
	can be used to indicate the authenticated user.
	msg_id: ID of Message containing attachment.
	prefix: prefix which is added to the attachment filename on saving
	"""
	files = []
	message = service.users().messages().get(userId=user_id, id=msg_id).execute()
	for part in message['payload']['parts']:
	    newvar = part['body']
	    if 'attachmentId' in newvar:
	        att_id = newvar['attachmentId']
	        att = service.users().messages().attachments().get(userId=user_id, messageId=msg_id, id=att_id).execute()
	        data = att['data']
	        print('file:', part['filename'])
	        files.append({'filename': part['filename'], 'data': data})
	        # file_data = base64.urlsafe_b64decode(data.encode('UTF-8'))
	        # path = ''.join([store_dir, part['filename']])
	        # f = open(path, 'wb')
	        # f.write(file_data)
	        # f.close()

	return files



#getEmails(datetime.now().astimezone(IST).strftime('%Y-%m-%d'))
files = getEmails((datetime.now() - timedelta(days=1)).astimezone(IST).strftime('%Y-%m-%d %H:%M:%S %z'))
print(json.dumps(files))

