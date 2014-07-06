import requests
import os.path
import logging
import copy
import json
import itertools
from bs4 import BeautifulSoup

#functions
def removeEscapeCharacters(mystr):
    return mystr.replace(',','').replace('\\r','').replace('\\n','').replace('\\t','').replace('\\','').replace('\n','').strip()

def formatHeaderToJson(header):
    namedArray = []
    for string in header.split('  '):
        if string != '':
            namedArray.append(removeEscapeCharacters(string))
    
    Indexes=['Last Name','First Name','Address','City']
    returnList = dict(itertools.zip_longest(Indexes, namedArray, fillvalue=None))
    if None in returnList:
        returnList.pop(None)
    return returnList


#This is basically checking if there is a dev flag, I used this for testing so I wouldn't keep making requests to the page each run
if os.path.isfile('dev'):
    ResponseFile = open('intake', 'r')
    DirtyHTML = ResponseFile.read()
else:
    print('prod')
    Response = requests.get('http://www.co.washington.ar.us/sheriff/resource/DintakeRoster.asp')
    DirtyHTML = Response.content

#Defining "soup" to be the output of the formatted HTML
soup = BeautifulSoup((DirtyHTML))

inmateOutput = dict()

inmates = []
count = 0
#Here I go through all the links on the intake page located in the Respone of the DintakeRoster.asp
for link in soup.find_all('a'):
    logging.warning('scraping page: ' + str(count))
    href = (link.get('href'))
    inmateResponse = requests.get('http://www.co.washington.ar.us/sheriff/resource/' + href)
    inmatePage = BeautifulSoup(inmateResponse.content)
    
    #Grab the table of information
    results = inmatePage.find('table').find_all('tr')
    index = 0
    #For every tag in it we will grab the results of it and append it to json-like object
    for tag in results:
        if tag.text.strip() != '' :
            if index == 0:
                # Header with name address etc
                inmateOutput.update(formatHeaderToJson(tag.text.strip()))
            elif index < len(results)-1: #We do this because the last line scrapped is "Arresting agency"
                infoArray = removeEscapeCharacters(tag.text.strip()).split(':')
                if len(infoArray) > 1:
                    inmateOutput[infoArray[0]] = infoArray[1]
        index = index + 1
    inmateOutput['bn'] = (href[href.find('bn=')+3:]) #Saving the BN in case I want to grab the pictures in a later release
    
    inmates.append(copy.deepcopy(inmateOutput))
    inmateOutput.clear()
    count = count+1
    # if count == 2 :
    #     break


#If there is an existing "database" i.e. json file we will append it to it
if os.path.isfile('intakeDB.json'):
    intakeDB = open('intakeDB.json', 'r')
    prevDB = json.loads(intakeDB.read())
    inmates.extend(prevDB)

#Write results to page
outputDB = intakeDB = open('intakeDB.json', 'w')
outputDB.write(json.dumps(inmates, indent=4, sort_keys=True))

#todo figure out how only store unique values
#todo migrate over to SQL table for better performance
#todo integrate google maps api so I can populate a map with criminal information
#todo parse json and find out most committed crime and location