import os
import asyncio
from imjoy_rpc.hypha import connect_to_server

from dotenv import load_dotenv
load_dotenv()

from uploader import uploader

async def start_server(server_url):
    server = await connect_to_server({"server_url": server_url})

    await server.register_service(
        {
            "id": "cmake-w3-externaldata-upload",
            "config": {
                "visibility": "public",
                "require_context": True,
            },
            "email": uploader.email,
            "uploadFile": uploader.upload_file,
        }
    )

if __name__ == "__main__":
    server_url = os.environ.get('VITE_HYPHA_SERVER_URL', 'http://localhost:9000')
    loop = asyncio.get_event_loop()
    loop.create_task(start_server(server_url))
    loop.run_forever()
