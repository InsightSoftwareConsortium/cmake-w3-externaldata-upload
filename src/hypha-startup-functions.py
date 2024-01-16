"""Startup function file for Hypha."""

import tempfile
from pathlib import Path
import subprocess

import duckdb

from imjoy_rpc.hypha import connect_to_server

DATABASE = "data.duckdb"

async def hypha_startup(server):
    """Hypha startup function."""

    max_upload_size = 1024 * 1024 * 50  # 50MB

    async def print_context(context=None):
        print(f"Context: {context}")

    async def email(context={}):
        return context['user']['email']

    async def upload_file(contents, callbacks, context=None):
        print(f"Uploading file: {contents.name}")
        print(f"Contents: {contents}")
        print(f"Context: {context}")
        print(f"Callbacks: {callbacks}")
        if contents.size > max_upload_size:
            callbacks["uploadErrorCallback"](f"File size, {contents.size} bytes, exceeds limit of {max_upload_size} bytes")
            return
        with duckdb.connect(DATABASE, read_only=True) as con:
            blacklisted = con.sql("SELECT * FROM blacklist").df()
            if context['user']['email'] in blacklisted['email'].unique() or context['user']['id'] in blacklisted['auth_id'].unique():
                callbacks["uploadErrorCallback"]("User not permitted to upload")
                return
        callbacks["startingUploadCallback"]()
        # save the file named file with contents contents to a temporary location
        with tempfile.TemporaryDirectory() as temp:
            data = await contents.read()
            file_path = Path(temp) / contents.name
            with open(file_path, 'wb') as f:
                f.write(data)
            print(f"Saved file to {file_path}")
            try:
                cid = subprocess.check_output(["node", "./src/web3-storage.mjs", file_path]).decode().strip()
            except Exception as e:
                print(e)
                callbacks["uploadErrorCallback"]('Error during web3.storage upload')
                return
            with duckdb.connect(DATABASE) as con:
                auth_id = context['user']['id']
                email = context['user']['email']
                name = contents.name
                size = contents.size
                con.sql(f"INSERT INTO upload_log (auth_id, email, name, size, cid, upload_time) VALUES ('{auth_id}', '{email}', '{name}', {size}, '{cid}', now())")
            callbacks["uploadCompleteCallback"](cid)
            # save the file named file with contents contents to a temporary location

    await server.register_service(
        {
            "id": "uploader",
            "config": {
                "visibility": "public",
                "require_context": True,
            },
            "printContext": print_context,
            "email": email,
            "uploadFile": upload_file,
        }
    )

    print(f"server.config {server.config}")