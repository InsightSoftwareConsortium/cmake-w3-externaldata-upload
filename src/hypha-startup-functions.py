"""Startup function file for Hypha."""

from uploader import uploader

async def hypha_startup(server):
    """Hypha startup function."""

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

    print(f"server.config {server.config}")