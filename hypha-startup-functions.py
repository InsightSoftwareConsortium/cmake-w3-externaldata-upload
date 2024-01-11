"""Example startup function file for Hypha."""

async def hypha_startup(server):
    """Hypha startup function."""

    # Register a test service
    await server.register_service(
        {
            "id": "test-service",
            "config": {
                "visibility": "public",
                "require_context": True,
            },
            "test": lambda x: print(f"Test: {x}"),
        }
    )