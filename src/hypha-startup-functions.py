"""Startup function file for Hypha."""

from imjoy_rpc.hypha import connect_to_server

async def hypha_startup(server):
    """Hypha startup function."""

    async def print_context(context=None):
        print(f"Context: {context}")

    async def email(context={}):
        return context['user']['email']

    await server.register_service(
        {
            "id": "uploader",
            "config": {
                "visibility": "public",
                "require_context": True,
            },
            "printContext": print_context,
            "email": email,
        }
    )

    print(f"server.config {server.config}")