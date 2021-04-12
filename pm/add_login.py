from pprint import pprint
import uuid

import pytz
from functions.enc import encryptor
from functions.dec import decryptor
from datetime import datetime
logins_skel = {
    "logins": [
        {
            "loginId": "0",
            "loginName": "Email",
            "loginCategoryId": "1",
            "lastEditTime": "Feb 19, 2019 at 10:03 PM",
            "fields": [
                {
                    "fieldId": "0",
                    "fieldName": "Username",
                    "fieldValue": "user@mail.com",
                    "fieldType": "text"
                },
                {
                    "fieldId": "1",
                    "fieldName": "Password",
                    "fieldValue": "0%vbTzzT2X",
                    "fieldType": "password"
                }
            ]
        }
    ]
}
skel = {}


def add_login(data, key):
    dt=datetime.utcnow().replace(tzinfo=pytz.UTC)
    date_crct=dt.astimezone(pytz.timezone("Asia/Kolkata"))
    eid = data['loginData[loginId]']
    if eid:
        uid = eid
    else:
        uid = uuid.uuid1().hex
    skel['_id'] = uid
    skel['loginId'] = uid
    skel['loginName'] = data['loginData[loginName]']
    skel['loginCategoryId'] = data['loginData[loginCategoryId]']
    print('Cat id', skel['loginCategoryId'])
    skel['lastEditTime'] = date_crct.strftime("%b %d, %Y" + " at " + "%I:%M %p")
    enc = skel.copy()
    field_list = []
    field_list_enc = []
    length = int((len(data)-4)/5)
    print('Length of fields', length)
    for i in range(0, length+1):
        name = 'fieldData['+str(i)+'][fieldName]'
        fieldName_enc = encryptor(data[name], key)
        fieldName = data[name]
        value = 'fieldData['+str(i)+'][fieldValue]'
        print(data[value])
        fieldValue_enc = encryptor(data[value], key)
        fieldValue = data[value]
        typ = 'fieldData['+str(i)+'][fieldType]'
        fieldType_enc = encryptor(data[typ], key)
        fieldType = data[typ]
        field_dict_loop = {"fieldId": i, "fieldName": fieldName,
                           "fieldValue": fieldValue, "fieldType": fieldType}
        field_dict_loop_enc = {"fieldId": i, "fieldName": fieldName_enc,
                               "fieldValue": fieldValue_enc, "fieldType": fieldType_enc}
        field_list.append(field_dict_loop)
        field_list_enc.append(field_dict_loop_enc)
        field_dict_loop = {}
        field_dict_loop_enc = {}
    enc['fields'] = field_list_enc
    skel['fields'] = field_list
    return enc, skel, uid


def get_loginss(db, key):
    cursor = db.find()
    docs = []
    print(key, type(key))

    for i in cursor:
        docs.append(i)

    logins = {}
    dict_login = {}
    dict_fields = {}
    logins['logins'] = []
    for i in range(0, len(docs)):
        ele = docs[i]
        dict_login['loginId'] = ele['loginId']
        dict_login['loginName'] = ele['loginName']
        dict_login['loginCategoryId'] = ele['loginCategoryId']
        dict_login['lastEditTime'] = ele['lastEditTime']
        print(ele['lastEditTime'])
        logins['logins'].append(dict_login)
        dict_login = {}
        logins['logins'][i]['fields'] = []
        for x in ele['fields']:
            # dict_fields['fieldName'] = x['fieldName']
            # dict_fields['fieldValue'] = x['fieldValue']
            # dict_fields['fieldType'] = x['fieldType']
            dict_fields['fieldName'] = decryptor(x['fieldName'], key)
            dict_fields['fieldValue'] = decryptor(x['fieldValue'], key)
            dict_fields['fieldType'] = decryptor(x['fieldType'], key)
            logins['logins'][i]['fields'].append(dict_fields)
            dict_fields = {}
        logins['logins'].reverse()
    # pprint(logins)
    return logins
