# coding: utf-8

import ffmpeg_helper
import logging
import time
import sys

from os import path
from transmissionrpc import Client
from settings import transmission_auth as auth
from settings import mongo_config, target_dir
from pymongo import MongoClient

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


tc = Client(
    auth['address'],
    port=auth['port'],
    user=auth['username'],
    password=auth['password']
)

mc = MongoClient(mongo_config['uri'])
mcdb = mc[mongo_config['dbname']]
mcdbc = mcdb[mongo_config['collection']]


def loop():
    # check new torrents
    for torr in tc.get_torrents():
        if mcdbc.count({"name": torr.name}) == 0:
            e = {
                "name": torr.name,
                "status": torr.status,
                "files": torr.files().values()
            }
            mcdbc.insert(e)
        else:
            e = mcdbc.find_one({"name": torr.name})

        if e["status"] == "seeding":
            # convert the movies
            _from_dir = path.join(torr.downloadDir, torr.name)
            _target_dir = path.join(target_dir, torr.name)
            mcdbc.update({"name": torr.name}, {"$set": {"status": "converting"}})
            ffmpeg_helper.convert(_from_dir, _target_dir)
            mcdbc.update({"name": torr.name}, {"$set": {"status": "converted"}})
        elif e["status"] == "downloading":
            pass
        elif e["status"] == "converted":
            pass
        elif e["status"] == "converting":
            pass
        else:
            logger.error("some error")


while True:
    loop()
    time.sleep(10) # every 10 seconds
    logger.info("i am alive")
