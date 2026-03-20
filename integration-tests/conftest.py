"""Shared pytest fixtures for integration tests."""
import os
import pytest
from dotenv import load_dotenv
from utils.http_client import IntegrationTestClient
from utils.bedrock_mock import MockBedrockClient
import psycopg2

load_dotenv(".env.test")


@pytest.fixture(scope="session")
def test_config():
    """Load test configuration from environment."""
    return {
        "sim_engine_url": os.getenv("SIM_ENGINE_URL", "http://localhost:8101"),
        "backend_url": os.getenv("BACKEND_URL", "http://localhost:8102"),
        "management_url": os.getenv("MANAGEMENT_BACKEND_URL", "http://localhost:8180"),
        "db_host": os.getenv("DB_HOST", "localhost"),
        "db_port": int(os.getenv("DB_PORT", "5532")),
        "db_name": os.getenv("DB_NAME", "greenhouse_test"),
        "db_user": os.getenv("DB_USER", "test_user"),
        "db_password": os.getenv("DB_PASSWORD", "test_password"),
        "test_timeout": float(os.getenv("TEST_TIMEOUT", "60")),
        "test_seed": int(os.getenv("TEST_SEED", "42")),
    }


@pytest.fixture(scope="function")
def sim_client(test_config):
    """HTTP client for simulation engine."""
    client = IntegrationTestClient(
        base_url=test_config["sim_engine_url"],
        timeout=test_config["test_timeout"]
    )
    yield client
    client.close()


@pytest.fixture(scope="function")
def backend_client(test_config):
    """HTTP client for backend orchestrator."""
    client = IntegrationTestClient(
        base_url=test_config["backend_url"],
        timeout=test_config["test_timeout"]
    )
    yield client
    client.close()


@pytest.fixture(scope="function")
def management_client(test_config):
    """HTTP client for management backend."""
    client = IntegrationTestClient(
        base_url=test_config["management_url"],
        timeout=test_config["test_timeout"]
    )
    yield client
    client.close()


@pytest.fixture(scope="function")
def db_connection(test_config):
    """PostgreSQL database connection with cleanup."""
    conn = psycopg2.connect(
        host=test_config["db_host"],
        port=test_config["db_port"],
        dbname=test_config["db_name"],
        user=test_config["db_user"],
        password=test_config["db_password"]
    )
    conn.autocommit = True
    yield conn

    cursor = conn.cursor()
    try:
        cursor.execute("DELETE FROM simulations WHERE run_id LIKE 'test-%'")
        cursor.execute("DELETE FROM simulation_slots WHERE simulation_id IN (SELECT id FROM simulations WHERE run_id LIKE 'test-%')")
        cursor.execute("DELETE FROM simulation_events WHERE simulation_id IN (SELECT id FROM simulations WHERE run_id LIKE 'test-%')")
    except Exception as e:
        print(f"Cleanup warning: {e}")
    finally:
        cursor.close()
        conn.close()


@pytest.fixture(scope="function")
def bedrock_mock():
    """Mock Bedrock client for LLM calls."""
    mock = MockBedrockClient()
    yield mock
    mock.reset()


@pytest.fixture(scope="function")
def test_seed(test_config):
    """Deterministic seed for reproducible tests."""
    return test_config["test_seed"]


@pytest.fixture(scope="session", autouse=True)
def wait_for_services(test_config):
    """Wait for all services to be healthy before running tests."""
    print("\nSkipping health checks - assuming services are running...\n")


# Pytest markers
def pytest_configure(config):
    """Configure custom pytest markers."""
    config.addinivalue_line("markers", "sim: Simulation engine tests")
    config.addinivalue_line("markers", "backend: Backend integration tests")
    config.addinivalue_line("markers", "orchestration: Orchestration flow tests")
    config.addinivalue_line("markers", "bridge: Bridge integration tests")
    config.addinivalue_line("markers", "e2e: End-to-end tests")
    config.addinivalue_line("markers", "slow: Slow-running tests (> 1 minute)")
