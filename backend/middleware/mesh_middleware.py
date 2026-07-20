import time
import uuid
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

logger = logging.getLogger("MeshMiddleware")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s")

class MeshMiddleware(BaseHTTPMiddleware):
    """
    Service Mesh Middleware for FastAPI
    Handles:
    - Correlation ID generation
    - Access Logging with Performance Tracking
    - Global Error Boundary (translating exceptions to JSON)
    """
    async def dispatch(self, request: Request, call_next):
        correlation_id = request.headers.get("X-Correlation-ID", str(uuid.uuid4()))
        start_time = time.time()
        
        # Add correlation ID to request state for other parts of the app to use
        request.state.correlation_id = correlation_id
        
        try:
            # Forward the request (Execute Business Logic)
            response = await call_next(request)
            
            process_time = time.time() - start_time
            response.headers["X-Process-Time"] = str(process_time)
            response.headers["X-Correlation-ID"] = correlation_id
            
            logger.info(f"[{correlation_id}] {request.method} {request.url.path} - Status: {response.status_code} - Duration: {process_time:.4f}s")
            return response
            
        except Exception as e:
            process_time = time.time() - start_time
            logger.error(f"[{correlation_id}] {request.method} {request.url.path} - ERROR: {str(e)} - Duration: {process_time:.4f}s")
            
            # Centralized Error Translation
            return JSONResponse(
                status_code=500,
                content={
                    "error": True,
                    "correlation_id": correlation_id,
                    "message": "Internal Server Error",
                    "details": str(e)
                },
                headers={
                    "X-Process-Time": str(process_time),
                    "X-Correlation-ID": correlation_id
                }
            )
