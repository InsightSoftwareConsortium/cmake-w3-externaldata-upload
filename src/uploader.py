import tempfile
from pathlib import Path
import subprocess

from dotenv import load_dotenv
load_dotenv()

import duckdb
from mailjet_rest import Client
import os

class Uploader:
    max_upload_size = 1024 * 1024 * 50  # 50MB
    quota_per_user = 1024 * 1024 * 1024 * 1  # 1GB
    database_file = "data.duckdb"
    api_key = os.environ['MJ_APIKEY_PUBLIC']
    api_secret = os.environ['MJ_APIKEY_PRIVATE']
    mailjet = Client(auth=(api_key, api_secret), version='v3.1')

    @staticmethod
    async def email(context={}):
        return context['user']['email']

    @staticmethod
    async def upload_file(contents, callbacks, context=None):
        if contents.size > Uploader.max_upload_size:
            callbacks["uploadErrorCallback"](f"File size, {contents.size} bytes, exceeds limit of {max_upload_size} bytes")
            return

        auth_id = context['user']['id']
        email = context['user']['email']
        size = contents.size

        with duckdb.connect(Uploader.database_file, read_only=True) as con:
            blacklisted = con.sql("SELECT * FROM blacklist").df()
            if email in blacklisted['email'].unique() or auth_id in blacklisted['auth_id'].unique():
                callbacks["uploadErrorCallback"]("User not permitted to upload")
                return
            id_uploads_size = con.sql(f"SELECT SUM(size) FROM upload_log WHERE auth_id = '{auth_id}'").fetchone()[0]
            if id_uploads_size is not None and id_uploads_size + size > Uploader.quota_per_user:
                callbacks["uploadErrorCallback"]("User has exceeded upload quota")
                return
            email_uploads_size = con.sql(f"SELECT SUM(size) FROM upload_log WHERE email = '{email}'").fetchone()[0]
            if email_uploads_size is not None and email_uploads_size + size > Uploader.quota_per_user:
                callbacks["uploadErrorCallback"]("User has exceeded upload quota")
                return

        callbacks["startingUploadCallback"]()

        with tempfile.TemporaryDirectory() as temp:
            data = await contents.read()
            file_path = Path(temp) / contents.name
            with open(file_path, 'wb') as f:
                f.write(data)
            try:
                cid = subprocess.check_output(["node", "./src/web3-storage.mjs", file_path]).decode().strip()
            except Exception as e:
                print(e)
                callbacks["uploadErrorCallback"]('Error during web3.storage upload')
                return

            name = contents.name

            with duckdb.connect(Uploader.database_file) as con:
                con.sql(f"INSERT INTO upload_log (auth_id, email, name, size, cid, upload_time) VALUES ('{auth_id}', '{email}', '{name}', {size}, '{cid}', now())")

            callbacks["uploadCompleteCallback"](cid)

            subject = f"{email} ({auth_id}) uploaded {name} with cmake-w3-externaldata"
            body = f"<p><strong>{email} ({auth_id})</strong> uploaded <strong>{name}</strong>, {size} bytes, to IPFS with CID {cid}</p>  <p><a href=\"https://w3s.link/ipfs/{cid}\">https://w3s.link/ipfs/{cid}</a></p>"
            sender_email = os.environ['SENDER_EMAIL']
            recipient_email = os.environ['RECIPIENT_EMAIL']
            data = {
                'Messages': [
                    {
                    "From": {
                        "Email": sender_email,
                        "Name": "cmake-w3-externaldata-upload"
                    },
                    "To": [
                        {
                        "Email": recipient_email,
                        "Name": "Monitor Email"
                        }
                    ],
                    "Subject": subject,
                    "TextPart": body,
                    "HTMLPart": body,
                    }
                ]
            }
            Uploader.mailjet.send.create(data=data)

uploader = Uploader()