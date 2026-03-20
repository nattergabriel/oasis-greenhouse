"""HTTP client wrapper for integration tests with retry logic."""

import time
from typing import Optional, Dict, Any
import httpx
import structlog

logger = structlog.get_logger()


class IntegrationTestClient:
    """HTTP client with retry logic and timeout handling for integration tests."""

    def __init__(
        self,
        base_url: str,
        timeout: float = 30.0,
        retry_count: int = 3,
        retry_delay: float = 2.0
    ):
        """
        Initialize HTTP client.

        Args:
            base_url: Base URL for the service (e.g., http://localhost:8101)
            timeout: Request timeout in seconds
            retry_count: Number of retries for failed requests
            retry_delay: Delay between retries in seconds
        """
        self.base_url = base_url.rstrip('/')
        self.timeout = timeout
        self.retry_count = retry_count
        self.retry_delay = retry_delay
        self.client = httpx.Client(timeout=timeout)

    def get(self, path: str, **kwargs) -> httpx.Response:
        """
        Send GET request.

        Args:
            path: URL path (e.g., /health)
            **kwargs: Additional arguments passed to httpx.get

        Returns:
            HTTP response

        Raises:
            httpx.HTTPError: On request failure
        """
        url = f"{self.base_url}{path}"
        logger.info("GET request", url=url)
        return self.client.get(url, **kwargs)

    def post(self, path: str, **kwargs) -> httpx.Response:
        """
        Send POST request.

        Args:
            path: URL path (e.g., /simulate/init)
            **kwargs: Additional arguments passed to httpx.post (json, data, etc.)

        Returns:
            HTTP response

        Raises:
            httpx.HTTPError: On request failure
        """
        url = f"{self.base_url}{path}"
        logger.info("POST request", url=url, has_json="json" in kwargs)
        return self.client.post(url, **kwargs)

    def post_with_retry(
        self,
        path: str,
        retries: Optional[int] = None,
        **kwargs
    ) -> httpx.Response:
        """
        Send POST request with retry logic for transient failures.

        Args:
            path: URL path
            retries: Number of retries (uses self.retry_count if None)
            **kwargs: Additional arguments passed to httpx.post

        Returns:
            HTTP response

        Raises:
            httpx.HTTPError: On final failure after all retries
        """
        url = f"{self.base_url}{path}"
        retry_count = retries if retries is not None else self.retry_count
        last_exception = None

        for attempt in range(retry_count + 1):
            try:
                logger.info("POST request with retry", url=url, attempt=attempt + 1)
                response = self.client.post(url, **kwargs)
                response.raise_for_status()
                return response
            except (httpx.HTTPError, httpx.ConnectError) as e:
                last_exception = e
                if attempt < retry_count:
                    logger.warning(
                        "Request failed, retrying",
                        url=url,
                        attempt=attempt + 1,
                        error=str(e)
                    )
                    time.sleep(self.retry_delay)
                else:
                    logger.error(
                        "Request failed after all retries",
                        url=url,
                        attempts=retry_count + 1,
                        error=str(e)
                    )

        raise last_exception

    def health_check(self, path: str = "/health", timeout: float = 5.0) -> bool:
        """
        Check if service is healthy.

        Args:
            path: Health check endpoint path
            timeout: Timeout for health check

        Returns:
            True if service is healthy, False otherwise
        """
        try:
            response = self.client.get(
                f"{self.base_url}{path}",
                timeout=timeout
            )
            return response.status_code == 200
        except Exception as e:
            logger.warning("Health check failed", error=str(e))
            return False

    def wait_until_healthy(
        self,
        path: str = "/health",
        timeout: float = 60.0,
        check_interval: float = 2.0
    ) -> bool:
        """
        Wait until service becomes healthy.

        Args:
            path: Health check endpoint path
            timeout: Maximum time to wait
            check_interval: Time between health checks

        Returns:
            True if service became healthy, False if timed out
        """
        start_time = time.time()
        while time.time() - start_time < timeout:
            if self.health_check(path):
                logger.info("Service is healthy", base_url=self.base_url)
                return True
            time.sleep(check_interval)

        logger.error("Service did not become healthy", base_url=self.base_url)
        return False

    def close(self):
        """Close the HTTP client."""
        self.client.close()

    def __enter__(self):
        """Context manager entry."""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()
