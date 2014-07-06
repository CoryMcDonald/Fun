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

if os.path.isfile('dev'):
    ResponseFile = open('intake', 'r')
    DirtyHTML = ResponseFile.read()
else:
    print('prod')
    Response = requests.get('http://www.co.washington.ar.us/sheriff/resource/DintakeRoster.asp')
    DirtyHTML = Response.content


soup = BeautifulSoup((DirtyHTML))

inmateOutput = dict()

inmates = []
count = 0
for link in soup.find_all('a'):
    logging.warning('scraping page: ' + str(count))
    href = (link.get('href'))
    inmateResponse = requests.get('http://www.co.washington.ar.us/sheriff/resource/' + href)
    inmatePage = BeautifulSoup(inmateResponse.content)
    # print(href)
    
    results = inmatePage.find('table').find_all('tr')
    index = 0
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



if os.path.isfile('intakeDB.json'):
    intakeDB = open('intakeDB.json', 'r')
    prevDB = json.loads(intakeDB.read())
    inmates.extend(prevDB)


outputDB = intakeDB = open('intakeDB.json', 'w')
outputDB.write(json.dumps(inmates, indent=4, sort_keys=True))
#todo figure out how to get unique values
# ds = json.loads(currentJSON) #this contains the json
# unique_stuff = { each['Address'] : each for each in ds }.values()


    #Create another response
    
#Compare to ensure no duplicates
# ResponseFile = open('intake', 'r')
# DataBase = ResponseFile.read()

#Store the file for comparision of another day

# Response = requests.get('http://www.co.washington.ar.us/sheriff/resource/DintakeRoster.asp')
# ResponseFile = open('intake', 'w')
# ResponseFile.write(str(Response.content))